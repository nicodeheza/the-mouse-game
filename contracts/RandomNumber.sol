// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";

abstract contract RandomNumber is VRFV2WrapperConsumerBase {
    // struct RequestStatus {
    //     uint256 paid;
    //     bool fulfilled;
    //     uint[] randomWords;
    // }

    uint32 callbackGasLimit = 100000;
    address private immutable i_linkAddress;
    address private immutable i_wrapperAddress;

    constructor(address linkAdderess, address wrapperAddress)
        VRFV2WrapperConsumerBase(linkAdderess, wrapperAddress)
    {
        i_linkAddress = linkAdderess;
        i_wrapperAddress = wrapperAddress;
    }

    function requestRandomWords() internal returns (uint256 requestID) {
        uint256 requestId = requestRandomness(callbackGasLimit, 3, 1);
        uint256 price = VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit);
    }
}
