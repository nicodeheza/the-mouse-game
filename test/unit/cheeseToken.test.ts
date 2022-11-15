import {expect} from "chai";
import {deployments, ethers, network} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {developmentChains} from "../../helper-hardhat-config";
import {CheeseToken, MouseGame} from "../../typechain-types";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("CheeseToken unit test", function () {
			let deployer: SignerWithAddress,
				cheeseToken: CheeseToken,
				mouseGame: MouseGame,
				player: SignerWithAddress;
			this.beforeEach(async () => {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];
				player = accounts[1];
				await deployments.fixture(["all"]);
				cheeseToken = await ethers.getContract("CheeseToken");
				mouseGame = await ethers.getContract("MouseGame");
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
					const gameBalance = await cheeseToken.balanceOf(mouseGame.address);
					expect(supply).to.be.equal(2400);
					expect(gameBalance).to.be.equal(2400);
				});
			});

			describe("functions", function () {
				it("functions have restricted access", async function () {
					await expect(
						cheeseToken.transfer(deployer.address, 10)
					).to.have.been.rejectedWith("CheeseToken__forbidden()");

					await expect(
						cheeseToken.approve(deployer.address, 10)
					).to.have.been.rejectedWith("GameMinion__forbidden()");

					await expect(
						cheeseToken.transferFrom(deployer.address, player.address, 10)
					).to.have.been.rejectedWith("CheeseToken__forbidden()");

					await expect(
						cheeseToken.decreaseAllowance(deployer.address, 10)
					).to.have.been.rejectedWith("CheeseToken__forbidden()");

					await expect(
						cheeseToken.increaseAllowance(deployer.address, 10)
					).to.have.been.rejectedWith("GameMinion__forbidden()");
				});
			});
	  });
