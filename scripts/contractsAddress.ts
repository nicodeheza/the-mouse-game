import {readFileSync, writeFileSync} from "fs";

const JSON_PATH = "../data/contractsAddress.json";

export function getContractAddress() {
	return JSON.parse(readFileSync(JSON_PATH, "utf8"));
}

export function setContractAddress(chain: string, name: string, address: string) {
	const contractsAddress = getContractAddress();
	contractsAddress[chain][name] = [
		address,
		...(contractsAddress[chain][name] ? contractsAddress[chain][name] : [])
	];
	writeFileSync(JSON_PATH, JSON.stringify(contractsAddress));
}
