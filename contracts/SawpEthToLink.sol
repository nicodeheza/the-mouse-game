// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/uniswapRouter/IUniswapV2Router02.sol";

contract SwapEthToLink {
    IUniswapV2Router02 uniswapRouter;
    address private immutable i_LinkAddress;

    uint256 internal s_linkBalance = 0;

    constructor(address uniswapRouterAddress, address linkAddress) {
        uniswapRouter = IUniswapV2Router02(uniswapRouterAddress);
        i_LinkAddress = linkAddress;
    }

    function convertEthToLink(uint256 linkAmount)
        internal
        returns (uint256 amount)
    {
        uint256 deadline = block.timestamp + 30;
        uint256 ethPerLink = getEthForLinkEstimation(1);
        uint256 ethToSwap = linkAmount * ethPerLink;
        uint256 resultAmount = uniswapRouter.swapETHForExactTokens{
            value: ethToSwap
        }(linkAmount, getPathForEthToLink(), address(this), deadline)[1];
        s_linkBalance += resultAmount;
        return resultAmount;
    }

    function getEthForLinkEstimation(uint256 linkAmount)
        private
        view
        returns (uint256)
    {
        return uniswapRouter.getAmountsIn(linkAmount, getPathForEthToLink())[0];
    }

    function getPathForEthToLink() private view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = i_LinkAddress;

        return path;
    }

    function spendLink(uint256 linkToSpend) internal {
        s_linkBalance -= linkToSpend;
    }
}
