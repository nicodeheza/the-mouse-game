// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

error CheeseToken__forbidden();

contract CheeseToken is ERC20 {
    address private immutable i_gameAddress;

    constructor(address gameAddress, uint256 supply)
        ERC20("CheeseToken", "CT")
    {
        i_gameAddress = gameAddress;
        _mint(gameAddress, supply);
    }

    function transfer(address to, uint256 amount)
        public
        override
        onlyGame
        returns (bool)
    {
        _transfer(i_gameAddress, to, amount);
        _approve(to, i_gameAddress, amount);
        return true;
    }

    function approve(address, uint256)
        public
        override
        onlyGame
        returns (bool)
    {}

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override onlyGame returns (bool) {
        _spendAllowance(from, i_gameAddress, amount);
        _approve(to, i_gameAddress, allowance(to, i_gameAddress) + amount);
        _transfer(from, to, amount);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        override
        onlyGame
        returns (bool)
    {}

    function increaseAllowance(address spender, uint256 addedValue)
        public
        override
        onlyGame
        returns (bool)
    {}

    modifier onlyGame() {
        if (_msgSender() != i_gameAddress) revert CheeseToken__forbidden();
        _;
    }
}
