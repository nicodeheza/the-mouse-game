import {expect} from "chai";
import {deployments, ethers, network} from "hardhat";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {developmentChains} from "../../helper-hardhat-config";
import {MouseNFT, MouseGameMock} from "../../typechain-types";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("MouseNFT unit test", function () {
			let deployer: SignerWithAddress,
				player1: SignerWithAddress,
				player2: SignerWithAddress,
				mouseNft: MouseNFT,
				mouseGameMock: MouseGameMock;
			this.beforeEach(async () => {
				const accounts = await ethers.getSigners();
				deployer = accounts[0];
				player1 = accounts[1];
				player2 = accounts[2];
				await deployments.fixture(["all"]);
				mouseNft = await ethers.getContract("MouseNFT");
				mouseGameMock = await ethers.getContract("MouseGameMock");
			});

			describe("constructor", function () {
				it("token must have correct name and symbol", async function () {
					const name = await mouseNft.name();
					const symbol = await mouseNft.symbol();
					expect(name).to.be.equal("Mouse");
					expect(symbol).to.be.equal("M");
				});
			});
			describe("tokenURI", function () {
				before(async () => {
					await mouseGameMock.mintMouse(deployer.address);
				});
				it("must return the correct base url", async function () {
					const url = await mouseNft.tokenURI(0);
					const baseUrl = url.split(",")[0];
					expect(baseUrl).to.be.equal("data:application/json;base64");
				});
				it("must contain de correct encoded data", async function () {
					const url = await mouseNft.tokenURI(0);
					const data = url.split(",")[1];
					const buffer = Buffer.from(data, "base64");
					const decodeData = buffer.toString("ascii");
					const metadata = JSON.parse(decodeData);

					expect(metadata.description).to.be.equal(
						"Transfer this mouse quickly or it will steal all your cheese!"
					);
					expect(metadata.external_url).to.be.equal("todo");
					expect(metadata.image).to.be.equal(
						"https://upload.wikimedia.org/wikipedia/commons/6/63/Twemoji12_1f42d.svg"
					);
					expect(metadata.name).to.be.equal("Bad Mouse");
					expect(metadata.attributes).to.be.eqls([
						{trait_type: "personality", value: "thief"},
						{trait_type: "goodness", value: "0"},
						{trait_type: "cheese_theft_speed_per_sec", value: "30"}
					]);
				});
			});
	  });
