import {HardhatUserConfig} from "hardhat/config";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			forking: {
				url: process.env.MAINNET_URL || ""
			}
		}
	},
	namedAccounts: {
		deployer: 0
	},
	solidity: "0.8.17"
};

export default config;
