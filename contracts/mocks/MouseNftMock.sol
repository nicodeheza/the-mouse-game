// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../MouseNFT.sol";

contract MouseNftMock is MouseNFT {
    constructor(address payable gameAddress) MouseNFT(gameAddress) {}

    function transferCheese(address to, uint256 amount) public returns (bool) {
        bool result = cheeseToken.transfer(to, amount);
        return result;
    }

    function transferCheeseFrom(
        address from,
        address to,
        uint256 amount
    ) public {
        cheeseToken.transferFrom(from, to, amount);
    }
}
