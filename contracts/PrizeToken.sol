// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error PrizeToken__forbidden();

contract PrizeToken is ERC20 {
    address private immutable i_gameAddress;

    constructor(address gameAddress) ERC20("MouseGamePrice", "MGP") {
        i_gameAddress = gameAddress;
    }

    function mint(uint256 amount) public onlyGame {
        _mint(i_gameAddress, amount);
    }

    function burn(address account, uint256 amount) public onlyGame {
        _burn(account, amount);
    }

    modifier onlyGame() {
        if (_msgSender() != i_gameAddress) revert PrizeToken__forbidden();
        _;
    }
}
