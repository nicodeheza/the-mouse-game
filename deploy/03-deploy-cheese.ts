import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {getContractAddress, setContractAddress} from "../scripts/contractsAddress";

const deployCheese: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployments, getNamedAccounts, network} = hre;
	const {deploy} = deployments;

	const {deployer} = await getNamedAccounts();
	const {name: networkName} = network;

	const contractsAddress = getContractAddress()[networkName];
	const args = [contractsAddress.MouseGame[0], contractsAddress.MouseNFT[0], 2400];

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
