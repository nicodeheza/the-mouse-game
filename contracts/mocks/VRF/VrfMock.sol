// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol";

contract VrfMock is VRFCoordinatorV2Mock {
    constructor(
        uint96 _baseFee,
        uint96 _gasPriceLink
    ) VRFCoordinatorV2Mock(_baseFee, _gasPriceLink) {}

    function onTokenTransfer(
        address /* sender */,
        uint256 amount,
        bytes calldata data
    ) external {
        uint64 subId = abi.decode(data, (uint64));
        fundSubscription(subId, uint96(amount));
    }
}
