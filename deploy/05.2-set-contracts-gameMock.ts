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
		const gameMock = await ethers.getContract("MouseGameMock", deployer);
		await gameMock.setContracts(
			contractsAddress.MouseNFT[0],
			contractsAddress.CheeseToken[0],
			contractsAddress.PrizeToken[0]
		);
	} catch (error) {
		console.log(error);
	}
};

export default setContracts;
setContracts.tags = ["gameMock", "all"];
