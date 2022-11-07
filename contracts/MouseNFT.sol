// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract MouseNFT is ERC721 {
    constructor() ERC721("Mouse", "M") {}

    uint256 s_tokenCount = 0;

    function tokenURI(uint256) public pure override returns (string memory) {
        bytes memory dataURI = abi.encodePacked(
            "{",
            '"description": "Transfer this mouse quickly or it will steal all your cheese!",',
            '"external_url": "todo",',
            '"image": "https://upload.wikimedia.org/wikipedia/commons/6/63/Twemoji12_1f42d.svg",',
            '"name": "Bad Mouse",',
            '"attributes": [ ',
            '{"trait_type": "personality","value": "thief"}',
            '{"trait_type": "goodness","value": "0"}',
            '{"trait_type": "cheese_theft_speed_per_sec","value": "30"}]'
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(dataURI)
                )
            );
    }
}
