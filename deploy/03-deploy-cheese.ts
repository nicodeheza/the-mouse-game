import "dotenv/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const deployCheese: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	const contractsAddress = getContractAddress()[networkName];
	let args;
	if (process.env.NODE_ENV === "test") {
		const gameMock = await ethers.getContract("MouseGameMock", deployer);
		const mouseNftMock = await ethers.getContract("MouseNftMock", deployer);
		args = [gameMock.address, mouseNftMock.address, 2400];
	} else {
		args = [contractsAddress.MouseGame[0], contractsAddress.MouseNFT[0], 2400];
	}

	const {address} = await deploy("CheeseToken", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});

	setContractAddress(networkName, "CheeseToken", address);

	// verify
};

export default deployCheese;
deployCheese.tags = ["cheese", "all"];
