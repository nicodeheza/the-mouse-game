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

	const gameMock = await ethers.getContract("MouseGameMock");
	const args = [gameMock.address, contractsAddress.MouseNFT[0], 2400];

	const {address} = await deploy("CheeseToken", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});

	setContractAddress(network.name, "CheeseToken", address);
};

export default deployCheese;
deployCheese.tags = ["mouseNftTest", "all"];
