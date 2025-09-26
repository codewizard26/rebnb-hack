// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";

/// @title BaseScript
/// @notice Base contract for deployment scripts with common functionality
abstract contract BaseScript is Script {
    /// @notice Modifier to handle broadcasting for deployment
    modifier broadcast() {
        vm.startBroadcast();
        _;
        vm.stopBroadcast();
    }
}
