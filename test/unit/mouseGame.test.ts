import "dotenv/config";
import {expect} from "chai";
import {
	ChainId,
	Fetcher,
	Percent,
	Route,
	Token,
	TokenAmount,
	Trade,
	TradeType,
	WETH
} from "@uniswap/sdk";
import {deployments, ethers, getNamedAccounts, network} from "hardhat";
import {developmentChains} from "../../helper-hardhat-config";
import {
	CheeseToken,
	MouseGame,
	MouseNFT,
	VRFCoordinatorV2Mock
} from "../../typechain-types";
import mineBlocks from "../../helpers/mineBlocks";
import {BigNumber, Contract, Event} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("MouseGame unit test", function () {
			let deployer: SignerWithAddress,
				players: SignerWithAddress[],
				mouseGame: MouseGame,
				cheeseToken: CheeseToken,
				mouseNft: MouseNFT,
				vrfMock: VRFCoordinatorV2Mock,
				uniswap: Contract,
				linkToken: Contract;
			const transactionFee = ethers.utils.parseUnits("10", "ether");
			const inscriptionLimit = 10 * 60;

			this.beforeAll(() => (process.env.MOUSE_TEST = "true"));

			this.beforeEach(async function () {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];
				players = accounts.slice(1);
				await deployments.fixture(["vrfMock", "game", "cheese", "prize", "mouse"]);
				mouseGame = await ethers.getContract("MouseGame");
				cheeseToken = await ethers.getContract("CheeseToken");
				mouseNft = await ethers.getContract("MouseNFT");
				vrfMock = await ethers.getContract("VrfMock");
				uniswap = await ethers.getContractAt(
					"IUniswapV2Router02",
					"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
				);
				linkToken = await ethers.getContractAt(
					"LinkTokenInterface",
					"0x514910771AF9Ca656af840dff83E8264EcF986CA"
				);
			});

			this.afterAll(() => (process.env.MOUSE_TEST = ""));

			const LINK = new Token(
				ChainId.MAINNET,
				"0x514910771AF9Ca656af840dff83E8264EcF986CA",
				18
			);

			describe("inscribe", function () {
				it("revert if registration time expired", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});
					await network.provider.send("evm_increaseTime", [inscriptionLimit + 60]);

					await expect(
						mouseGame.connect(players[1]).inscribe({value: transactionFee})
					).to.have.been.rejectedWith("MouseGame__inscriptionClose()");
				});
				it("revert if the max of players was reached", async function () {
					const promiseArray = new Array(10)
						.fill(true)
						.map((_, i) =>
							mouseGame.connect(players[i]).inscribe({value: transactionFee})
						);
					await Promise.all(promiseArray);
					await expect(
						mouseGame.connect(players[1]).inscribe({value: transactionFee})
					).to.have.been.rejectedWith("MouseGame__inscriptionClose()");
				});
				it("revert if sin't is pay the exact entrance fee", async function () {
					await expect(
						mouseGame.connect(players[0]).inscribe({value: transactionFee.add("1")})
					).to.have.been.rejectedWith("MouseGame__overpaid()");
					await expect(
						mouseGame.connect(players[0]).inscribe({value: transactionFee.sub("1")})
					).to.have.been.rejectedWith("MouseGame__underpayment()");
				});
				it("revert if the player is already inscribe", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});
					await expect(
						mouseGame.connect(players[0]).inscribe({value: transactionFee})
					).to.have.been.rejectedWith("MouseGame__alreadyRegistered()");
				});
				it("if the player is the first inscribed set the inscription start time", async function () {
					const initialInscriptionTimeLeft = await mouseGame.getInscriptionTimeLeft();
					expect(initialInscriptionTimeLeft).to.be.equal(9999);
					const tx = await mouseGame
						.connect(players[0])
						.inscribe({value: transactionFee});
					await tx.wait();
					await network.provider.send("evm_increaseTime", [60]);
					await network.provider.send("evm_mine");
					const finalInscriptionTimeLeft = await mouseGame.getInscriptionTimeLeft();
					expect(finalInscriptionTimeLeft.toNumber()).to.be.equal(inscriptionLimit - 60);
				});
				it("player must be add to the game", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});
					const playerRegistered = await mouseGame.isRegistered(players[0].address);
					expect(playerRegistered).to.be.true;
				});
				it("the correct amount of cheese token must be transfer to the player", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});
					const playerCheese = await cheeseToken.balanceOf(players[0].address);
					expect(playerCheese).to.be.equal(240);
				});
				it("event must be emitted", async function () {
					await expect(
						mouseGame.connect(players[0]).inscribe({value: transactionFee})
					).to.emit(mouseGame, "playerInscribed");
				});
			});

			describe("startGame", function () {
				it("only the referee can call this function", async function () {
					await expect(
						mouseGame.connect(players[0]).startGame()
					).to.have.been.rejectedWith("MouseGame__OnlyReferee()");
				});
				it("revert if the inscription time didn't end", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});
					await network.provider.send("evm_increaseTime", [60]);
					await network.provider.send("evm_mine");
					await expect(mouseGame.startGame()).to.have.been.rejectedWith(
						"MouseGame__notReadyToStart()"
					);
				});
				it("if the minimum of player didn't was reach return players eth", async function () {
					const initialBalance1 = await players[0].getBalance();
					const initialBalance2 = await players[1].getBalance();
					const tx1 = await mouseGame
						.connect(players[0])
						.inscribe({value: transactionFee});
					const tx2 = await mouseGame
						.connect(players[1])
						.inscribe({value: transactionFee});
					const receipt1 = await tx1.wait();
					const receipt2 = await tx2.wait();
					const gas1 = receipt1.cumulativeGasUsed.mul(receipt1.effectiveGasPrice);
					const gas2 = receipt2.cumulativeGasUsed.mul(receipt2.effectiveGasPrice);

					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					const startGameTx = await mouseGame.startGame();
					startGameTx.wait();

					const finalBalance1 = await players[0].getBalance();
					const finalBalance2 = await players[1].getBalance();

					expect(finalBalance1).to.be.equal(initialBalance1.sub(gas1));
					expect(finalBalance2).to.be.equal(initialBalance2.sub(gas2));
				});
				it("if the minimum of player didn't was reach send back cheese token to the game", async function () {
					const initialGameCheese = await cheeseToken.balanceOf(mouseGame.address);

					await mouseGame.connect(players[0]).inscribe({value: transactionFee});
					await mouseGame.connect(players[1]).inscribe({value: transactionFee});

					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					await mouseGame.startGame();

					const finalGameCheese = await cheeseToken.balanceOf(mouseGame.address);
					const player1Cheese = await cheeseToken.balanceOf(players[0].address);
					const player2Cheese = await cheeseToken.balanceOf(players[1].address);

					expect(finalGameCheese).to.be.equal(initialGameCheese);
					expect(player1Cheese).to.be.equal(0);
					expect(player2Cheese).to.be.equal(0);
				});
				it("if the minimum of player didn't was reach reset inscription time", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});

					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					await mouseGame.startGame();

					const inscriptionTimeLeft = await mouseGame.getInscriptionTimeLeft();
					expect(inscriptionTimeLeft).to.be.equal(9999);
				});
				it("if the minimum of player didn't was reach emit an event", async function () {
					await mouseGame.connect(players[0]).inscribe({value: transactionFee});

					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					await expect(mouseGame.startGame()).to.emit(mouseGame, "gameReverted");
				});
				it("one random player must receive the mouse nft", async function () {
					const promiseArray = new Array(5)
						.fill(true)
						.map((_, i) =>
							mouseGame.connect(players[i]).inscribe({value: transactionFee})
						);
					await Promise.all(promiseArray);
					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					const fundTx = await mouseGame.fundVRFSubscriptionsWithEth({
						value: ethers.utils.parseUnits((2).toString(), "ether")
					});
					await fundTx.wait();

					const tx = await mouseGame.startGame();
					const txReceipt = await tx.wait();
					const starEvent = txReceipt.events?.filter(
						(e) => e.event === "requestRandomPlayer"
					);
					const requestId = starEvent![0].args!.requestId;
					await vrfMock.fulfillRandomWords(requestId, mouseGame.address);

					await new Promise((resolve, reject) => {
						mouseGame.once("gameStarted", async (user) => {
							try {
								const ownerBalance = await mouseNft.balanceOf(user);
								expect(ownerBalance).to.be.equal(1);

								const otherPlayers = players.filter(
									(player, i) => player.address !== user && i < 5
								);

								const otherPlayersBalance = await Promise.all(
									otherPlayers.map((player) => mouseNft.balanceOf(player.address))
								);
								otherPlayersBalance.forEach((balance) => expect(balance).to.be.equal(0));
								resolve(user);
							} catch (error) {
								reject(error);
							}
						});
					});
				});
				it("star game time must be set", async function () {
					const initialTimeLeft = await mouseGame.getGameTimeLeft();
					expect(initialTimeLeft).to.be.equal(9999);

					const promiseArray = new Array(5)
						.fill(true)
						.map((_, i) =>
							mouseGame.connect(players[i]).inscribe({value: transactionFee})
						);
					await Promise.all(promiseArray);
					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					const fundTx = await mouseGame.fundVRFSubscriptionsWithEth({
						value: ethers.utils.parseUnits((2).toString(), "ether")
					});
					await fundTx.wait();

					const tx = await mouseGame.startGame();
					const txReceipt = await tx.wait();
					const starEvent = txReceipt.events?.filter(
						(e) => e.event === "requestRandomPlayer"
					);
					const requestId = starEvent![0].args!.requestId;
					await vrfMock.fulfillRandomWords(requestId, mouseGame.address);

					const finalTimeLeft = await mouseGame.getGameTimeLeft();
					expect(finalTimeLeft).to.be.lessThanOrEqual(60 * 60 * 2);
				});
				it("revert if the game is in progress", async function () {
					const promiseArray = new Array(5)
						.fill(true)
						.map((_, i) =>
							mouseGame.connect(players[i]).inscribe({value: transactionFee})
						);
					await Promise.all(promiseArray);
					await network.provider.send("evm_increaseTime", [inscriptionLimit]);
					await network.provider.send("evm_mine");

					const fundTx = await mouseGame.fundVRFSubscriptionsWithEth({
						value: ethers.utils.parseUnits((2).toString(), "ether")
					});
					await fundTx.wait();

					const tx = await mouseGame.startGame();
					const txReceipt = await tx.wait();
					const starEvent = txReceipt.events?.filter(
						(e) => e.event === "requestRandomPlayer"
					);
					const requestId = starEvent![0].args!.requestId;
					await vrfMock.fulfillRandomWords(requestId, mouseGame.address);

					await network.provider.send("evm_increaseTime", [60 * 50]);
					await network.provider.send("evm_mine");

					await expect(mouseGame.startGame()).to.have.been.rejectedWith(
						"MouseGame__gameInProgress()"
					);
				});
			});
			describe("fund vrf subscription", function () {
				describe("fund with eth", function () {
					it("eht must be swapped ot link", async function () {
						const amountToSwap = "1000000";
						const pair = await Fetcher.fetchPairData(LINK, WETH[LINK.chainId]);
						const route = new Route([pair], WETH[LINK.chainId]);

						await mouseGame.fundVRFSubscriptionsWithEth({value: amountToSwap});
						await new Promise((resolve, reject) => {
							mouseGame.once("Converted", (ethAmount, resultAmount) => {
								try {
									expect(ethAmount.toString()).to.be.equal(amountToSwap);
									const eth = BigNumber.from(amountToSwap);
									const approxLinkPrice = BigNumber.from(
										parseInt(route.midPrice.toSignificant())
									);
									const approxResult = eth.mul(approxLinkPrice);

									expect(resultAmount).to.be.greaterThan(0);
									expect(resultAmount.sub(approxResult).abs()).to.be.lessThan(
										BigNumber.from(20).mul(resultAmount).div(BigNumber.from(100))
									);
									resolve(resultAmount);
								} catch (error) {
									reject(error);
								}
							});
						});
					});
					it("fund successfully", async function () {
						const initialFunds = await mouseGame.getVRFSubscriptionFunds();
						expect(initialFunds).to.be.equal(0);
						await mouseGame.fundVRFSubscriptionsWithEth({value: "1000000"});
						await new Promise((resolve, reject) => {
							mouseGame.once("Converted", async (ethAmount, resultAmount) => {
								try {
									const finalFund = await mouseGame.getVRFSubscriptionFunds();
									expect(finalFund).to.be.equal(resultAmount);
									resolve(true);
								} catch (error) {
									reject(error);
								}
							});
						});
					});
				});
				describe("fund with Link", function () {
					let linkBalance: BigNumber;
					beforeEach(async function () {
						const pair = await Fetcher.fetchPairData(LINK, WETH[LINK.chainId]);
						const route = new Route([pair], WETH[LINK.chainId]);
						const amountIn = "1000000000000000000";
						const trade = new Trade(
							route,
							new TokenAmount(WETH[LINK.chainId], amountIn),
							TradeType.EXACT_INPUT
						);
						const slippageTolerance = new Percent("50", "10000");
						const amountOutMin = parseInt(
							trade.minimumAmountOut(slippageTolerance).toSignificant()
						);
						const path = [WETH[LINK.chainId].address, LINK.address];
						const to = deployer.address;
						const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

						const swapTx = await uniswap.swapExactETHForTokens(
							amountOutMin,
							path,
							to,
							deadline,
							{value: amountIn}
						);
						await swapTx.wait();

						linkBalance = await linkToken.balanceOf(deployer.address);
					});
					it("if link is not approve revert", async function () {
						await expect(
							mouseGame.fundVRFSubscriptionsWithLink(linkBalance)
						).to.have.been.rejectedWith("RandomNumber__insufficientAllowance()");
					});
					it("fund successfully", async function () {
						await linkToken.approve(mouseGame.address, linkBalance);
						const tx = await mouseGame.fundVRFSubscriptionsWithLink(linkBalance);
						await tx.wait();
						const vrfFunds = await mouseGame.getVRFSubscriptionFunds();
						expect(vrfFunds).to.be.equal(linkBalance);
					});
				});
			});
			describe("endGame", function () {
				it("only the referee can call this function", async function () {});
				it("revert if game didn't end", async function () {});
				it("pick the correct winner", async function () {});
				it("transfer all the player cheese token to the game", async function () {});
				it("send the correct amount of prize tokens to the players", async function () {});
				it("emit an event for all the player with address and their cheese token balance", async function () {});
				it("transfer the mouse nft cheese to the game", async function () {});
				it("send the correct amount of price token to the winner", async function () {});
				it("the mouse nft must be burned", async function () {});
				it("if referee delay is >= to 5 minutes pay 0", async function () {});
				it("if referee delay is = to 2 minutes pay 3%", async function () {});
				it("if referee delay is = to 0 minutes pay 5%", async function () {});
				it("set game balance", async function () {});
				it("set game start time to 0", async function () {});
				it("set inscription start time to 0", async function () {});
				it("remove all players", async function () {});
				it("emit event with the game winner address", async function () {});
			});

			describe("prizeToEth", function () {
				it("revert if user don't have prize tokens", async function () {});
				it("burn the user prize tokens amount", async function () {});
				it("update game balance", async function () {});
				it("send to the user the correct amount of eth", async function () {});
				it("emit event", async function () {});
			});

			describe("refereeWithdraw", function () {
				it("revert if isn't call by the referee", async function () {});
				it("send the correct amount of eth", async function () {});
				it("set the referee balance to 0", async function () {});
				it("emit and event", async function () {});
			});

			describe("isRegistered", function () {
				it("return true if player is registered", async function () {});
				it("return false if player is not registered", async function () {});
			});

			describe("getPrizeTokenValue", function () {
				it("return the correct value", async function () {});
			});

			describe("getInscriptionTimeLeft", function () {
				it("if time is 0 return 9999", async function () {});
				it("if time is grader or equal to inscription limit return 0", async function () {});
				it("return the correct time left", async function () {});
			});

			describe("getGameTimeLeft", function () {
				it("if time is 0 return 9999", async function () {});
				it("if time is grader or equal to inscription limit return 0", async function () {});
				it("return the correct time left", async function () {});
			});

			describe("getGameBalance", function () {
				it("the game balance", async function () {});
			});

			describe("getGameBalance", function () {
				it("revert if isn't call by the referee", async function () {});
				it("the referee balance", async function () {});
			});
	  });
