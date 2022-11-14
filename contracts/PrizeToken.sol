// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./GameMinion.sol";

contract PrizeToken is ERC20, GameMinion {
    constructor(address gameAddress)
        ERC20("MouseGamePrice", "MGP")
        GameMinion(gameAddress)
    {}

    function mint(address to, uint256 amount) public onlyGame {
        _mint(to, amount);
    }

    function burn(address account, uint256 amount) public onlyGame {
        _burn(account, amount);
    }
}
