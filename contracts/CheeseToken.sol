// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./GameMinion.sol";

error CheeseToken__forbidden();

contract CheeseToken is ERC20, GameMinion {
    address private immutable i_mouseAddress;

    constructor(
        address gameAddress,
        address mouseAddress,
        uint256 supply
    ) ERC20("CheeseToken", "CT") GameMinion(gameAddress) {
        i_mouseAddress = mouseAddress;
        _mint(gameAddress, supply);
    }

    function transfer(
        address to,
        uint256 amount
    ) public override onlyGameAndMouse returns (bool) {
        _transfer(i_gameAddress, to, amount);
        return true;
    }

    function approve(
        address,
        uint256
    ) public override onlyGame returns (bool) {}

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override onlyGameAndMouse returns (bool) {
        _transfer(from, to, amount);
        return true;
    }

    function decreaseAllowance(
        address spender,
        uint256 subtractedValue
    ) public override onlyGameAndMouse returns (bool) {}

    function increaseAllowance(
        address spender,
        uint256 addedValue
    ) public override onlyGame returns (bool) {}

    modifier onlyGameAndMouse() {
        if (msg.sender != i_gameAddress && msg.sender != i_mouseAddress)
            revert CheeseToken__forbidden();
        _;
    }
}
