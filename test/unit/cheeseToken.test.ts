import {expect} from "chai";
import {deployments, ethers, network} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {developmentChains} from "../../helper-hardhat-config";
import {CheeseToken, MouseGameMock, MouseNftMock} from "../../typechain-types";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("CheeseToken unit test", function () {
			let deployer: SignerWithAddress,
				cheeseToken: CheeseToken,
				mouseGameMock: MouseGameMock,
				player: SignerWithAddress,
				mouseNftMock: MouseNftMock;
			this.beforeEach(async () => {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];
				player = accounts[1];
				await deployments.fixture(["all"]);
				cheeseToken = await ethers.getContract("CheeseToken");
				mouseGameMock = await ethers.getContract("MouseGameMock");
				mouseNftMock = await ethers.getContract("MouseNftMock");
			});

			describe("constructor", function () {
				it("token must have the correct name y symbol", async function () {
					const name = await cheeseToken.name();
					const symbol = await cheeseToken.symbol();

					expect(name).to.be.equal("CheeseToken");
					expect(symbol).to.be.equal("CT");
				});
				it("2400 token must be minted to the game", async function () {
					const supply = await cheeseToken.totalSupply();
					const gameBalance = await cheeseToken.balanceOf(mouseGameMock.address);
					expect(supply).to.be.equal(2400);
					expect(gameBalance).to.be.equal(2400);
				});
			});

			describe("transfer", function () {
				it("revert if haven't been called by game or mouse", async function () {
					await expect(cheeseToken.transfer(player.address, 3)).to.have.been.rejectedWith(
						"CheeseToken__forbidden()"
					);
				});
				it("transfer successfully from the mouse", async function () {
					await expect(mouseNftMock.transferCheese(deployer.address, 20)).to.have.not.been
						.rejected;
				});
				it("transfer successfully from game", async function () {
					await expect(mouseGameMock.transferCheese(deployer.address)).to.have.not.been
						.rejected;
				});
				it("to address must received the correct amount of tokens", async function () {
					await mouseNftMock.transferCheese(deployer.address, 20);
					const deployerBalance = await cheeseToken.balanceOf(deployer.address);
					expect(deployerBalance).to.be.equal(20);
				});
				it("the transfer amount must be approved to the game", async function () {
					await mouseNftMock.transferCheese(deployer.address, 20);
					const approveAmount = await cheeseToken.allowance(
						deployer.address,
						mouseGameMock.address
					);
					expect(approveAmount).to.be.equal(20);
				});
			});

			describe("approve", function () {
				it("approve can be only called by the game", async function () {
					await expect(
						cheeseToken.approve(deployer.address, 2)
					).to.have.been.rejectedWith("GameMinion__forbidden()");
				});
			});

			describe("transferFrom", function () {
				beforeEach(async function () {
					await mouseGameMock.transferCheese(deployer.address);
				});
				it("revert if haven't been called by game or mouse", async function () {
					await expect(
						cheeseToken.transferFrom(deployer.address, player.address, 10)
					).to.have.been.rejectedWith("CheeseToken__forbidden()");
				});
				it("the sender allowance must be spend", async function () {
					await mouseNftMock.transferCheeseFrom(deployer.address, player.address, 10);
					const allowance = await cheeseToken.allowance(
						deployer.address,
						mouseGameMock.address
					);

					expect(allowance).to.be.equal(240 - 10);
				});
				it("the sended amount must be approved to the game", async function () {
					await mouseNftMock.transferCheeseFrom(deployer.address, player.address, 10);
					const allowance = await cheeseToken.allowance(
						player.address,
						mouseGameMock.address
					);

					expect(allowance).to.be.equal(10);
				});
				it("transfer successfully", async function () {
					await mouseNftMock.transferCheeseFrom(deployer.address, player.address, 10);
					const playerBalance = await cheeseToken.balanceOf(player.address);
					expect(playerBalance).to.be.equal(10);
				});
			});
			describe("decreaseAllowance", function () {
				it("revert if haven't been called by game or mouse", async function () {
					await expect(
						cheeseToken.decreaseAllowance(mouseGameMock.address, 10)
					).to.have.been.rejectedWith("CheeseToken__forbidden()");
				});
			});
			describe("increaseAllowance", function () {
				it("revert if haven't been called by game", async function () {
					await expect(
						cheeseToken.increaseAllowance(mouseGameMock.address, 10)
					).to.have.been.rejectedWith("GameMinion__forbidden()");
				});
			});
	  });
