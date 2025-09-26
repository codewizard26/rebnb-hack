// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ProofOfHuman} from "../src/ProofOfHuman.sol";
import {BaseScript} from "./Base.s.sol";
import {console} from "forge-std/console.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";

/// @title TestProofOfHuman
/// @notice Test script for deployed ProofOfHuman contract
contract TestProofOfHuman is BaseScript {
    // Deployed contract address
    address constant DEPLOYED_CONTRACT = 0xf52E363c92945E350bC2515A948EB5A722d52EA6;

    /// @notice Test the deployed contract
    function run() public view {
        ProofOfHuman proofOfHuman = ProofOfHuman(DEPLOYED_CONTRACT);

        console.log("=== TESTING DEPLOYED PROOFOFHUMAN CONTRACT ===");
        console.log("Contract Address:", DEPLOYED_CONTRACT);

        // Test basic contract information
        console.log("\n=== BASIC CONTRACT INFO ===");

        address owner = proofOfHuman.owner();
        console.log("Contract Owner:", owner);

        uint256 scope = proofOfHuman.scope();
        console.log("Verification Scope:", scope);

        address hubAddress = proofOfHuman.identityVerificationHubV2();
        console.log("Identity Verification Hub:", hubAddress);

        bytes32 configId = proofOfHuman.getCurrentConfigId();
        console.log("Configuration ID:", vm.toString(configId));

        // Test verification status for some addresses
        console.log("\n=== VERIFICATION STATUS TESTS ===");

        address[] memory testAddresses = new address[](3);
        testAddresses[0] = address(0x1234567890123456789012345678901234567890);
        testAddresses[1] = address(0xdEad000000000000000000000000000000000000);
        testAddresses[2] = owner;

        for (uint256 i = 0; i < testAddresses.length; i++) {
            address testAddr = testAddresses[i];
            console.log("Testing address:", testAddr);

            // Note: isVerified() emits events, so we skip in view context
            console.log("  - Verification status check skipped (requires transaction)");

            uint256 timestamp = proofOfHuman.getVerificationTimestamp(testAddr);
            console.log("  - Verification timestamp:", timestamp);
            if (timestamp == 0) {
                console.log("    (Not verified)");
            } else {
                console.log("    (Verified at timestamp)");
            }

            uint256 userIdentifier = proofOfHuman.getUserIdentifier(testAddr);
            console.log("  - User identifier:", userIdentifier);
        }

        // Test verification configuration
        console.log("\n=== VERIFICATION CONFIGURATION ===");

        SelfStructs.VerificationConfigV2 memory config = proofOfHuman.getVerificationConfig();
        console.log("Verification Config:");
        console.log("  - Older than enabled:", config.olderThanEnabled ? "true" : "false");
        console.log("  - Older than:", config.olderThan);
        console.log("  - Forbidden countries enabled:", config.forbiddenCountriesEnabled ? "true" : "false");
        console.log("  - Forbidden countries count:", config.forbiddenCountriesListPacked.length);

        // Print OFAC settings (3 modes)
        console.log("  - OFAC Settings:");
        console.log("    - Passport No OFAC:", config.ofacEnabled[0] ? "true" : "false");
        console.log("    - Name+DOB OFAC:", config.ofacEnabled[1] ? "true" : "false");
        console.log("    - Name+YOB OFAC:", config.ofacEnabled[2] ? "true" : "false");

        // Print packed forbidden countries
        for (uint256 i = 0; i < config.forbiddenCountriesListPacked.length; i++) {
            console.log("  - Forbidden countries packed[", i, "]:", config.forbiddenCountriesListPacked[i]);
        }

        console.log("\n=== CONTRACT TEST COMPLETED ===");
        console.log("Contract appears to be deployed and accessible!");
        console.log("To test verification functionality, you would need to:");
        console.log("1. Have a valid Self Protocol verification proof");
        console.log("2. Call verifySelfProof() with proper proof data");
        console.log("3. Check events emitted during verification");
    }

    /// @notice Test contract with transactions (requires --broadcast)
    function runWithTransactions() public broadcast {
        ProofOfHuman proofOfHuman = ProofOfHuman(DEPLOYED_CONTRACT);

        console.log("=== TESTING WITH TRANSACTIONS ===");

        // Test verification status queries (will emit events)
        address testAddr = address(0x1234567890123456789012345678901234567890);

        console.log("Checking verification status for:", testAddr);
        bool isVerified = proofOfHuman.isVerified(testAddr);
        console.log("Is verified:", isVerified);

        console.log("Transaction-based tests completed!");
        console.log("Check the transaction logs for emitted events.");
    }
}
