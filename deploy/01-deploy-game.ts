import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";
import {developmentChains} from "../helper-hardhat-config";
import verify from "../utils/verify";

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
			deployer,
			ethers.utils.parseUnits((10).toString(), "ether"),
			10 * 60,
			2 * 60 * 60
		];
	} else {
		args = [
			contractsAddress.linkToken[0],
			contractsAddress.chainLinkWrapper[0],
			contractsAddress.uniswapRouter2[0],
			deployer,
			ethers.utils.parseUnits((0.01).toString(), "ether"),
			5 * 60, //10 * 60,
			10 * 60 // 2 * 60 * 60
		];
	}

	const {address} = await deploy("MouseGame", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});

	setContractAddress(networkName, "MouseGame", address);

	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KET) {
		console.log("Verifying...");
		await verify(address, args);
	}
};

export default deployGame;
deployGame.tags = ["game", "all", "deploy"];
