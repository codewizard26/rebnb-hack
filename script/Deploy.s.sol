// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ProofOfHuman} from "../src/ProofOfHuman.sol";
import {BaseScript} from "./Base.s.sol";
import {CountryCodes} from "@selfxyz/contracts/contracts/libraries/CountryCode.sol";
import {console} from "forge-std/console.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";

/// @title DeployProofOfHuman
/// @notice Deployment script for ProofOfHuman contract using Self Protocol infrastructure
/// @dev This script deploys a ProofOfHuman contract that extends SelfVerificationRoot
contract DeployProofOfHuman is BaseScript {
    // Custom errors for deployment verification
    error DeploymentFailed();
    error InvalidHubAddress();
    error ConfigurationFailed();

    // Events for deployment tracking
    event DeploymentStarted(
        address indexed deployer,
        address indexed hubAddress,
        uint256 scope,
        uint256 timestamp
    );

    event DeploymentCompleted(
        address indexed contractAddress,
        address indexed deployer,
        address indexed hubAddress,
        uint256 scope,
        bytes32 configId,
        uint256 timestamp
    );

    event VerificationConfigCreated(
        uint256 olderThan,
        string[] forbiddenCountries,
        bool ofacEnabled,
        bytes32 configId,
        uint256 timestamp
    );

    /// @notice Main deployment function using Self Protocol deployment
    /// @return proofOfHuman The deployed ProofOfHuman contract instance
    /// @dev Requires the following environment variables:
    ///      - IDENTITY_VERIFICATION_HUB_ADDRESS: Address of the Self Protocol verification hub
    ///      - DEPLOYMENT_SCOPE: Scope for verification (optional, defaults to "rebnb-verification")
    function run() public broadcast returns (ProofOfHuman proofOfHuman) {
        // Get configuration from environment
        address hubAddress = vm.envAddress("IDENTITY_VERIFICATION_HUB_ADDRESS");
        uint256 deploymentScope = vm.envOr("DEPLOYMENT_SCOPE", uint256(12345)); // Default scope value for rebnb verification

        // Validate hub address
        if (hubAddress == address(0)) revert InvalidHubAddress();

        // Emit deployment start event
        emit DeploymentStarted(
            msg.sender,
            hubAddress,
            deploymentScope,
            block.timestamp
        );

        // Configure verification requirements
        string[] memory forbiddenCountries = new string[](1);
        forbiddenCountries[0] = CountryCodes.UNITED_STATES;

        SelfUtils.UnformattedVerificationConfigV2
            memory verificationConfig = SelfUtils
                .UnformattedVerificationConfigV2({
                    olderThan: 18,
                    forbiddenCountries: forbiddenCountries,
                    ofacEnabled: false
                });

        // Log configuration details
        console.log("=== DEPLOYMENT CONFIGURATION ===");
        console.log("Deployer:", msg.sender);
        console.log("Identity Verification Hub:", hubAddress);
        console.log("Deployment Scope:", deploymentScope);
        console.log("Minimum Age:", verificationConfig.olderThan);
        console.log("OFAC Enabled:", verificationConfig.ofacEnabled);
        console.log("Forbidden Countries Count:", forbiddenCountries.length);
        for (uint i = 0; i < forbiddenCountries.length; i++) {
            console.log("  - Forbidden Country:", forbiddenCountries[i]);
        }

        // Deploy the contract using Self Protocol infrastructure
        proofOfHuman = new ProofOfHuman(
            hubAddress,
            deploymentScope,
            verificationConfig
        );

        // Verify deployment was successful
        if (address(proofOfHuman) == address(0)) revert DeploymentFailed();

        // Get the configuration ID that was set during deployment
        bytes32 configId = proofOfHuman.getCurrentConfigId();

        // Emit configuration created event
        emit VerificationConfigCreated(
            verificationConfig.olderThan,
            forbiddenCountries,
            verificationConfig.ofacEnabled,
            configId,
            block.timestamp
        );

        // Log comprehensive deployment information
        console.log("=== DEPLOYMENT RESULTS ===");
        console.log("ProofOfHuman deployed to:", address(proofOfHuman));
        console.log("Contract Owner:", proofOfHuman.owner());
        console.log("Verification Scope:", proofOfHuman.scope());
        console.log("Configuration ID:", vm.toString(configId));
        console.log("Hub Address:", hubAddress);
        console.log("Deployment Timestamp:", block.timestamp);

        // Emit deployment completed event
        emit DeploymentCompleted(
            address(proofOfHuman),
            msg.sender,
            hubAddress,
            deploymentScope,
            configId,
            block.timestamp
        );

        console.log("=== DEPLOYMENT SUCCESS ===");
        console.log("Contract is ready for Self Protocol verification!");
        console.log(
            "Users can now verify their identity through the Self Protocol flow."
        );
        console.log(
            "Frontend should use contract address:",
            address(proofOfHuman)
        );
    }
}
