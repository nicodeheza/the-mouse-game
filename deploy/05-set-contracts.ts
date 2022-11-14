import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const setContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {getNamedAccounts, network} = hre;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	const contractsAddress = getContractAddress()[networkName];

	const game = await ethers.getContract("MouseGame", deployer);
	await game.setContracts(
		contractsAddress.MouseNFT[0],
		contractsAddress.CheeseToken[0],
		contractsAddress.PrizeToken[0]
	);

	const mouse = await ethers.getContract("MouseNFT", deployer);
	await mouse.setCheeseToken(contractsAddress.CheeseToken[0]);
};

export default setContracts;
setContracts.tags = ["set", "all"];
