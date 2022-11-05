// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

error GameMinion__forbidden();

abstract contract GameMinion {
    address immutable i_gameAddress;

    constructor(address gameAddress) {
        i_gameAddress = gameAddress;
    }

    modifier onlyGame() {
        if (msg.sender != i_gameAddress) revert GameMinion__forbidden();
        _;
    }
}
