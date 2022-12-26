// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "./SawpEthToLink.sol";

import "hardhat/console.sol";

error RandomNumber__insufficientFunds();

abstract contract RandomNumber is VRFConsumerBaseV2, SwapEthToLink {
    uint32 constant callbackGasLimit = 100000;
    VRFCoordinatorV2Interface immutable VRFCoordinator;
    LinkTokenInterface immutable Link;
    uint64 private immutable VRFSubscriptionId;
    bytes32 private immutable keyHash;

    constructor(
        address linkAdderess,
        address VRFCoordinatorAddress,
        address uniswapRouterAddress,
        bytes32 _keyHash
    )
        VRFConsumerBaseV2(VRFCoordinatorAddress)
        SwapEthToLink(uniswapRouterAddress, linkAdderess)
    {
        VRFCoordinator = VRFCoordinatorV2Interface(VRFCoordinatorAddress);
        Link = LinkTokenInterface(linkAdderess);
        keyHash = _keyHash;
        VRFSubscriptionId = VRFCoordinator.createSubscription();
        VRFCoordinator.addConsumer(VRFSubscriptionId, address(this));
    }

    function requestRandomWords() internal returns (uint256 requestID) {
        requestID = VRFCoordinator.requestRandomWords(
            keyHash,
            VRFSubscriptionId,
            3,
            callbackGasLimit,
            3
        );
    }

    function _getVRFSubscriptionFunds() internal view returns (uint256 funds) {
        (funds, , , ) = VRFCoordinator.getSubscription(VRFSubscriptionId);
    }

    function fundVRFSubscriptionsWithEth() external payable {
        uint256 amount = convertEthToLink(msg.value);
        Link.transferAndCall(
            address(VRFCoordinator),
            amount,
            abi.encode(VRFSubscriptionId)
        );
    }

    function fundVRFSubscriptionsWithLink(uint256 amount) external {
        Link.approve(address(this), amount);
        Link.transferAndCall(
            address(VRFCoordinator),
            amount,
            abi.encode(VRFSubscriptionId)
        );
    }
}
