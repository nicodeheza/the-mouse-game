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
			describe("mint", function () {
				it("only game can call it", async function () {
					await expect(mouseNft.mint(deployer.address)).to.have.been.rejectedWith(
						"GameMinion__forbidden()"
					);
				});
				it("only can be one mouse at the time", async function () {
					await mouseGameMock.mintMouse(deployer.address);
					await expect(
						mouseGameMock.mintMouse(deployer.address)
					).to.have.been.rejectedWith("MouseNFT__OnlyOneMouse()");
				});
				it("to address must be the owner", async function () {
					await mouseGameMock.mintMouse(deployer.address);
					const mouseOwner = await mouseNft.ownerOf(0);
					expect(mouseOwner).to.be.equal(deployer.address);
				});
				it("states must be updated", async function () {
					const initialIsLive = await mouseNft.getIsLive();
					const initialTokenCount = await mouseNft.getTokenCount();
					const initialLastTransfer = await mouseNft.getLastTransfer();

					expect(initialIsLive).to.be.equal(false);
					expect(initialTokenCount).to.be.equal(0);
					expect(initialLastTransfer).to.be.equal(0);

					await mouseGameMock.mintMouse(deployer.address);

					const finalIsLive = await mouseNft.getIsLive();
					const finalTokenCount = await mouseNft.getTokenCount();
					const finalLastTransfer = await mouseNft.getLastTransfer();

					const blocknumber = await ethers.provider.getBlockNumber();
					const block = await ethers.provider.getBlock(blocknumber);
					const timestamp = block.timestamp;

					await network.provider.send("evm_mine");

					expect(finalIsLive).to.be.equal(true);
					expect(finalTokenCount).to.be.equal(1);
					expect(finalLastTransfer).to.be.equal(timestamp);
				});
			});
	  });
