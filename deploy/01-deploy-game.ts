import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const deployGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	let args;
	const contractsAddress = getContractAddress()[networkName];
	if (process.env.NODE_ENV === "test") {
		const vrfMock = await ethers.getContract("VRFV2WrapperMock");
		args = [
			contractsAddress.linkToken[0],
			vrfMock.address,
			contractsAddress.uniswapRouter2[0],
			deployer
		];
	} else {
		args = [
			contractsAddress.linkToken[0],
			contractsAddress.chainLinkWrapper[0],
			contractsAddress.uniswapRouter2[0],
			deployer
		];
	}

	const {address} = await deploy("MouseGame", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});

	setContractAddress(networkName, "MouseGame", address);

	// verify
};

export default deployGame;
deployGame.tags = ["game", "all"];
