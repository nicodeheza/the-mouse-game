// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";
import "./SawpEthToLink.sol";

import "hardhat/console.sol";

error RandomNumber__insufficientFunds();

abstract contract RandomNumber is VRFV2WrapperConsumerBase, SwapEthToLink {
    uint32 constant callbackGasLimit = 100000;

    constructor(
        address linkAdderess,
        address wrapperAddress,
        address uniswapRouterAddress
    )
        VRFV2WrapperConsumerBase(linkAdderess, wrapperAddress)
        SwapEthToLink(uniswapRouterAddress, linkAdderess)
    {}

    function requestRandomWords() internal returns (uint256 requestID) {
        uint256 price = estimateVRFPrice();
        uint256 linkToGet;
        if (price < s_linkBalance) {
            linkToGet = 0;
        } else {
            linkToGet = price - s_linkBalance;
        }

        convertEthToLink(linkToGet);

        if (s_linkBalance < price) revert RandomNumber__insufficientFunds();
        return requestRandomness(callbackGasLimit, 1, 1);
    }

    function estimateVRFPrice() internal view returns (uint256 price) {
        price = VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit);
    }
}
