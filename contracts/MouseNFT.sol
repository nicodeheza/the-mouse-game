// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameMinion.sol";
import "./CheeseToken.sol";
import "./MouseGame.sol";

error MouseNFT__OnlyOneMouse();
error MouseNFT__toAddressNotInscripted();

contract MouseNFT is ERC721, GameMinion, Ownable {
    uint256 s_tokenCount = 0;
    bool s_isLive = false;
    uint256 s_lastTranfer;
    CheeseToken cheeseToken;
    MouseGame game;

    constructor(address gameAddress)
        ERC721("Mouse", "M")
        GameMinion(gameAddress)
    {
        game = MouseGame(gameAddress);
    }

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

    function mint(address to) external onlyGame {
        if (s_isLive) revert MouseNFT__OnlyOneMouse();
        _mint(to, s_tokenCount);
        s_isLive = true;
        s_tokenCount++;
    }

    function burn() external onlyGame {
        _burn(s_tokenCount);
        s_isLive = false;
    }

    // add only trasfer to players
    function _beforeTokenTransfer(
        address,
        address to,
        uint256
    ) internal override {
        if (!game.isRegistered(to)) {
            if (to != address(0)) revert MouseNFT__toAddressNotInscripted();
        }
        if (s_lastTranfer > 0) {
            uint256 tokensToSteal = (block.timestamp - s_lastTranfer) / 30;
            address owner = ownerOf(s_tokenCount);
            cheeseToken.transferFrom(owner, address(this), tokensToSteal);
        }
        if (to == address(0)) {
            s_lastTranfer = 0;
        } else {
            s_lastTranfer = block.timestamp;
        }
    }

    function setCheeseToken(address cheeseTokenAddress) external onlyOwner {
        cheeseToken = CheeseToken(cheeseTokenAddress);
    }
}
