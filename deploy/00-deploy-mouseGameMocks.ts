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
		contractsAddress.VRFCoordinator[0],
		contractsAddress.uniswapRouter2[0],
		"0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805",
		deployer,
		ethers.utils.parseUnits((10).toString(), "ether"),
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
