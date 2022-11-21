import "dotenv/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const setContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {getNamedAccounts, network} = hre;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	const contractsAddress = getContractAddress()[networkName];

	try {
		if (process.env.NODE_ENV == "test") {
			const gameMock = await ethers.getContract("MouseGameMock", deployer);
			await gameMock.setContracts(
				contractsAddress.MouseNFT[0],
				contractsAddress.CheeseToken[0],
				contractsAddress.PrizeToken[0]
			);

			const mouseNftMock = await ethers.getContract("MouseNftMock", deployer);
			await mouseNftMock.setCheeseToken(contractsAddress.CheeseToken[0]);
		}

		const game = await ethers.getContract("MouseGame", deployer);
		const gameTx = await game.setContracts(
			contractsAddress.MouseNFT[0],
			contractsAddress.CheeseToken[0],
			contractsAddress.PrizeToken[0]
		);

		const gameReceipt = await gameTx.wait();
		console.log(
			"Game contracts seated with",
			ethers.utils.formatEther(gameReceipt.gasUsed.mul(gameReceipt.effectiveGasPrice)),
			"eth gas."
		);
		const mouse = await ethers.getContract("MouseNFT", deployer);
		const mouseTx = await mouse.setCheeseToken(contractsAddress.CheeseToken[0]);
		const mouseReceipt = await mouseTx.wait();

		console.log(
			"Mouse cheeseToken seated with",
			ethers.utils.formatEther(mouseReceipt.gasUsed.mul(mouseReceipt.effectiveGasPrice)),
			"eth gas."
		);
	} catch (error) {
		console.log(error);
	}
};

export default setContracts;
setContracts.tags = ["set", "all"];
