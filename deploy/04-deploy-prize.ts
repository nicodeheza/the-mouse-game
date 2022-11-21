import "dotenv/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";
import {ethers} from "hardhat";

const deployPrize: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	let args;
	if (process.env.NODE_ENV === "test") {
		const mouseGameMock = await ethers.getContract("MouseGameMock");
		args = [mouseGameMock.address];
	} else {
		const contractsAddress = getContractAddress()[networkName];
		args = [contractsAddress.MouseGame[0]];
	}

	const {address} = await deploy("PrizeToken", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: 1
	});

	setContractAddress(networkName, "PrizeToken", address);

	// verify
};

export default deployPrize;
deployPrize.tags = ["prize", "all"];
