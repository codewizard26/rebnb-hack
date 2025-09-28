// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {ProofOfHuman} from "../src/ProofOfHuman.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";

/**
 * @title DeployProofOfHuman
 * @notice Deployment script for ProofOfHuman contract
 * @dev Run with: forge script script/DeployProofOfHuman.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 */
contract DeployProofOfHuman is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address identityVerificationHubV2 = vm.envAddress("IDENTITY_VERIFICATION_HUB_V2");
        
        // Default to testnet hub if not provided
        if (identityVerificationHubV2 == address(0)) {
            // This is a placeholder - replace with actual Self Protocol hub address for your network
            identityVerificationHubV2 = 0x0000000000000000000000000000000000000000;
            console.log("Warning: Using placeholder hub address. Update with actual Self Protocol hub address.");
        }

        vm.startBroadcast(deployerPrivateKey);

        // Create verification configuration
        string[] memory forbiddenCountries = new string[](1);
        forbiddenCountries[0] = "US"; // Example: forbid US for testing
        
        SelfUtils.UnformattedVerificationConfigV2 memory verificationConfig = SelfUtils.UnformattedVerificationConfigV2({
            olderThan: 18,
            forbiddenCountries: forbiddenCountries,
            ofacEnabled: false
        });

        // Deploy ProofOfHuman contract
        ProofOfHuman proofOfHuman = new ProofOfHuman(
            identityVerificationHubV2,
            uint256(keccak256(abi.encodePacked("rebnb-kyc-verification"))), // scope seed
            verificationConfig
        );

        console.log("ProofOfHuman deployed to:", address(proofOfHuman));
        console.log("Identity Verification Hub V2:", identityVerificationHubV2);
        console.log("Contract scope:", proofOfHuman.scope());
        console.log("Verification config ID:", vm.toString(proofOfHuman.getCurrentConfigId()));
        console.log("Contract owner:", proofOfHuman.owner());

        vm.stopBroadcast();

        // Log deployment info for frontend integration
        console.log("\n=== Frontend Integration ===");
        console.log("Update frontend/lib/contracts.ts:");
        console.log("PROOF_OF_HUMAN: \"%s\" as Address,", address(proofOfHuman));
        console.log("\nUpdate environment variables:");
        console.log("NEXT_PUBLIC_SELF_SCOPE=%s", vm.toString(proofOfHuman.scope()));
        console.log("NEXT_PUBLIC_PROOF_OF_HUMAN_ADDRESS=%s", address(proofOfHuman));
    }
}
