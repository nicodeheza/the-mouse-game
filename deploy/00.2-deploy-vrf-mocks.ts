import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {ethers} from "hardhat";

const deployVrfMock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();

	const BASE_FEE = "250000000000000000";
	const GAS_PRICE_LINK = 1e9;

	const vrfCoordinator = await deploy("VRFCoordinatorV2Mock", {
		from: deployer,
		args: [BASE_FEE, GAS_PRICE_LINK],
		log: false,
		waitConfirmations: 1
	});

	await deploy("VRFV2WrapperMock", {
		from: deployer,
		args: [
			"0x514910771AF9Ca656af840dff83E8264EcF986CA",
			"0xDC530D9457755926550b59e8ECcdaE7624181557",
			vrfCoordinator.address
		],
		log: false,
		waitConfirmations: 1
	});

	const vrfWrapper = await ethers.getContract("VRFV2WrapperMock", deployer);
	await vrfWrapper.setConfig(
		40000,
		90000,
		0,
		"0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
		10
	);
};

export default deployVrfMock;
deployVrfMock.tags = ["mocks", "all", "vrfMock"];
