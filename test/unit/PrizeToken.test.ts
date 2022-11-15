import {expect} from "chai";
import {deployments, ethers, network} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {developmentChains} from "../../helper-hardhat-config";
import {MouseGame, PrizeToken} from "../../typechain-types";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("PrizeToken unit test", function () {
			let deployer: SignerWithAddress, mouseGame: MouseGame, prizeToken: PrizeToken;
			beforeEach(async () => {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];

				await deployments.fixture(["all"]);
				mouseGame = await ethers.getContract("MouseGame");
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
			});

			describe("burn", function () {
				it("revert if burn isn't call by game", async function () {
					await expect(prizeToken.burn(deployer.address, 10)).to.have.been.rejectedWith(
						"GameMinion__forbidden()"
					);
				});
			});
	  });
