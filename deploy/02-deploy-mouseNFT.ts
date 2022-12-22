import "dotenv/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const deployMouse: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	const contractsAddress = getContractAddress()[networkName];
	let args;
	if (process.env.NODE_ENV === "test" && !process.env.MOUSE_TEST) {
		const gameMock = await ethers.getContract("MouseGameMock");
		args = [gameMock.address];
	} else {
		args = [contractsAddress.MouseGame[0]];
	}

	const {address} = await deploy("MouseNFT", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});

	setContractAddress(networkName, "MouseNFT", address);

	// verify
};

export default deployMouse;
deployMouse.tags = ["mouse", "all", "deploy"];
