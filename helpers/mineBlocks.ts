import {network} from "hardhat";

export default async function mineBlocks(numberOfBlocks: number) {
	for (let i = 0; i < numberOfBlocks; i++) {
		await network.provider.send("evm_mine");
	}
}
