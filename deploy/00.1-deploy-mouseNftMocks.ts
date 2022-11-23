import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {ethers} from "hardhat";

const deployGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();

	const MouseGameMock = await ethers.getContract("MouseGameMock");

	await deploy("MouseNftMock", {
		from: deployer,
		args: [MouseGameMock.address],
		log: true,
		waitConfirmations: 1
	});
};

export default deployGame;
deployGame.tags = ["mocks", "all", "mouseMock"];
