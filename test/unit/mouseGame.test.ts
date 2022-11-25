import "dotenv/config";
import {expect} from "chai";
import {deployments, ethers, network} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {developmentChains} from "../../helper-hardhat-config";
import {CheeseToken, MouseGame} from "../../typechain-types";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("MouseGame unit test", function () {
			let deployer: SignerWithAddress,
				players: SignerWithAddress[],
				mouseGame: MouseGame,
				cheeseToken: CheeseToken;

			this.beforeAll(() => (process.env.MOUSE_TEST = "true"));

			this.beforeEach(async function () {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];
				players = accounts.slice(1);
				await deployments.fixture(["game", "cheese", "prize", "mouse"]);
				mouseGame = await ethers.getContract("MouseGame");
				cheeseToken = await ethers.getContract("CheeseToken");
			});

			this.afterAll(() => (process.env.MOUSE_TEST = ""));

			describe("inscribe", function () {
				const transactionFee = ethers.utils.parseUnits("0.0014", "ether");
				const inscriptionLimit = 10 * 60;
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
				it("revert if the inscription time didn't end", async function () {});
				it("if the minimum of player didn't was reach reset the game", async function () {});
				it("the necessary amount of link must be swapped", async function () {});
				it("one random player must receive the mouse nft", async function () {});
				it("star game time must be set", async function () {});
				it("star game time must be set", async function () {});
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
