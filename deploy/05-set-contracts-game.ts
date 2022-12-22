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
	} catch (error) {
		console.log(error);
	}
};

export default setContracts;
setContracts.tags = ["game", "all", "deploy"];
