import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const deployGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	const contractsAddress = getContractAddress()[networkName];
	const args = [
		contractsAddress.linkToken[0],
		contractsAddress.chainLinkWrapper[0],
		contractsAddress.uniswapRouter2[0],
		deployer,
		10 * 60,
		2 * 60 * 60
	];

	await deploy("MouseGameMock", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});
};

export default deployGame;
deployGame.tags = ["mocks", "all", "gameMock", "mouseMock"];
