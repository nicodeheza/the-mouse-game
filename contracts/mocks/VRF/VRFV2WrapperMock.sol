// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/VRFV2Wrapper.sol";

contract VRFV2WrapperMock is VRFV2Wrapper {
    constructor(
        address link,
        address linkEthFeed,
        address coordinator
    ) VRFV2Wrapper(link, linkEthFeed, coordinator) {}
}
