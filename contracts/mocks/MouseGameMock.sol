// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../MouseNFT.sol";
import "../MouseGame.sol";

contract MouseGameMock is MouseGame {
    constructor(
        address linkAddressm,
        address wrapperAddress,
        address uniswapRouterAddress,
        address referee,
        uint256 entranceFee,
        uint256 inscriptionLimit,
        uint256 gameDuration
    )
        MouseGame(
            linkAddressm,
            wrapperAddress,
            uniswapRouterAddress,
            referee,
            entranceFee,
            inscriptionLimit,
            gameDuration
        )
    {
        s_players = [msg.sender];
    }

    function mintMouse(address to) public {
        mouseNft.mint(to);
    }

    function burnMouse() public {
        mouseNft.burn();
    }

    function addPlayer(address player) public {
        s_players.push(player);
    }

    function transferCheese(address to) public {
        cheeseToken.transfer(to, CHEESE_INITIAL_AMOUNT);
    }

    function mintPrizeMock(address to, uint256 amount) public {
        prizeToken.mint(to, amount);
    }

    function burnPrizeMock(address account, uint256 amount) public {
        prizeToken.burn(account, amount);
    }
}
