// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../MouseNFT.sol";
import "../MouseGame.sol";

contract MouseGameMock is MouseGame {
    constructor(
        address linkAddressm,
        address wrapperAddress,
        address uniswapRouterAddress,
        address referee
    ) MouseGame(linkAddressm, wrapperAddress, uniswapRouterAddress, referee) {
        s_players = [msg.sender];
    }

    function mintMouse(address to) public {
        mouseNft.mint(to);
    }

    function burnMouse() public {
        mouseNft.burn();
    }
}
