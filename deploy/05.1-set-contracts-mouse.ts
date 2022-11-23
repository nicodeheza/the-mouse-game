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
setContracts.tags = ["mouse", "all"];
