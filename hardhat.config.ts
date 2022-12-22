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
			// loggingEnabled: true,
		},
		goerli: {
			url: process.env.GOERLI_URL,
			accounts: [
				process.env.GOERLI_ACCOUNT_1 || "",
				process.env.GOERLI_ACCOUNT_2 || "",
				process.env.GOERLI_ACCOUNT_3 || "",
				process.env.GOERLI_ACCOUNT_4 || ""
			]
		}
	},
	namedAccounts: {
		deployer: 0
	},
	solidity: "0.8.17"
};

export default config;
