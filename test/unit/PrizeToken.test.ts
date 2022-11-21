import {expect} from "chai";
import {deployments, ethers, network} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {developmentChains} from "../../helper-hardhat-config";
import {MouseGameMock, PrizeToken} from "../../typechain-types";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("PrizeToken unit test", function () {
			let deployer: SignerWithAddress,
				mouseGameMock: MouseGameMock,
				prizeToken: PrizeToken;
			beforeEach(async () => {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];

				await deployments.fixture(["all"]);
				mouseGameMock = await ethers.getContract("MouseGameMock");
				prizeToken = await ethers.getContract("PrizeToken");
			});

			describe("constructor", function () {
				it("the token must have the correct name and symbol", async function () {
					const name = await prizeToken.name();
					const symbol = await prizeToken.symbol();
					expect(name).to.be.equal("MouseGamePrize");
					expect(symbol).to.be.equal("MGP");
				});
			});

			describe("mint", function () {
				it("revert if mint isn't call by game", async function () {
					await expect(prizeToken.mint(deployer.address, 10)).to.have.been.rejectedWith(
						"GameMinion__forbidden()"
					);
				});
				it("mint successfully to player", async function () {
					await mouseGameMock.mintPrizeMock(deployer.address, 10);
					const deployerBalance = await prizeToken.balanceOf(deployer.address);
					expect(deployerBalance).to.be.equal(10);
				});
			});

			describe("burn", function () {
				it("revert if burn isn't call by game", async function () {
					await expect(prizeToken.burn(deployer.address, 10)).to.have.been.rejectedWith(
						"GameMinion__forbidden()"
					);
				});
				it("burn successfully to player", async function () {
					await mouseGameMock.mintPrizeMock(deployer.address, 10);
					await mouseGameMock.burnPrizeMock(deployer.address, 5);
					const deployerBalance = await prizeToken.balanceOf(deployer.address);

					expect(deployerBalance).to.be.equal(5);
				});
			});
	  });
