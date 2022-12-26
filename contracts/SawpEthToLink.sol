// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/uniswapRouter/IUniswapV2Router02.sol";

error SwapEthToLink__insufficientFunds(
    uint256 balance,
    uint256 necessaryAmount
);

contract SwapEthToLink {
    IUniswapV2Router02 uniswapRouter;
    address private immutable i_LinkAddress;
    mapping(address => uint) internal s_balance;

    constructor(address uniswapRouterAddress, address linkAddress) {
        uniswapRouter = IUniswapV2Router02(uniswapRouterAddress);
        i_LinkAddress = linkAddress;
    }

    event Converted(
        uint256 needAmount,
        uint256 linkReceived,
        uint256 ethSpended
    );

    function convertEthToLink(
        uint256 linkAmount
    ) internal returns (uint256 amount) {
        uint256 deadline = block.timestamp + 30;
        uint256 ethPerLink = getEthForLinkEstimation(1);
        uint256 ethToSwap = linkAmount * ethPerLink;
        if (ethToSwap > s_balance[msg.sender]) {
            revert SwapEthToLink__insufficientFunds(
                address(this).balance,
                ethToSwap
            );
        }

        s_balance[msg.sender] -= ethToSwap;
        uint256[] memory result = uniswapRouter.swapETHForExactTokens{
            value: ethToSwap
        }(linkAmount, getPathForEthToLink(), address(this), deadline);
        s_balance[msg.sender] -= result[0];
        uint256 resultAmount = result[1];
        emit Converted(linkAmount, resultAmount, ethToSwap);
        return resultAmount;
    }

    function getEthForLinkEstimation(
        uint256 linkAmount
    ) private view returns (uint256) {
        return uniswapRouter.getAmountsIn(linkAmount, getPathForEthToLink())[0];
    }

    function getPathForEthToLink() private view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = i_LinkAddress;

        return path;
    }
}
