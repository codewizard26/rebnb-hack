// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title ProofOfHuman
 * @notice Implementation of SelfVerificationRoot for human verification in rental platform
 * @dev This contract provides verification functionality using Self Protocol infrastructure
 */
contract ProofOfHuman is SelfVerificationRoot {
    // Storage for verification tracking
    mapping(address => bool) public verifiedHumans;
    mapping(address => uint256) public verificationTimestamps;
    mapping(address => uint256) public userIdentifiers;

    // Configuration storage
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;
    address public owner;

    // Last verification data for debugging/monitoring
    ISelfVerificationRoot.GenericDiscloseOutputV2 public lastOutput;
    bytes public lastUserData;
    address public lastUserAddress;

    /// @notice Comprehensive events for all contract activities
    event ContractDeployed(
        address indexed contractAddress,
        address indexed owner,
        address indexed identityVerificationHub,
        uint256 scope,
        bytes32 verificationConfigId,
        uint256 timestamp
    );

    event HumanVerified(
        address indexed human,
        uint256 indexed userIdentifier,
        uint256 timestamp,
        uint256 scope,
        ISelfVerificationRoot.GenericDiscloseOutputV2 output
    );

    event VerificationCompleted(
        ISelfVerificationRoot.GenericDiscloseOutputV2 output,
        bytes userData,
        address indexed userAddress,
        uint256 timestamp
    );

    event ScopeUpdated(
        uint256 indexed oldScope,
        uint256 indexed newScope,
        address indexed updatedBy,
        uint256 timestamp
    );

    event VerificationConfigUpdated(
        bytes32 indexed oldConfigId,
        bytes32 indexed newConfigId,
        address indexed updatedBy,
        uint256 timestamp
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    event VerificationStatusQueried(
        address indexed queriedAddress,
        bool isVerified,
        address indexed queriedBy,
        uint256 timestamp
    );

    /// @notice Custom errors
    error OnlyOwner();
    error AlreadyVerified();
    error NotVerified();
    error InvalidConfiguration();

    /// @notice Modifier to restrict access to owner
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /**
     * @notice Constructor for the ProofOfHuman contract
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param scopeValue The verification scope for this contract
     * @param _verificationConfig Unformatted verification configuration
     */
    constructor(
        address identityVerificationHubV2Address,
        uint256 scopeValue,
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    ) SelfVerificationRoot(identityVerificationHubV2Address, scopeValue) {
        owner = msg.sender;

        // Format and set verification configuration
        verificationConfig = SelfUtils.formatVerificationConfigV2(
            _verificationConfig
        );
        verificationConfigId = IIdentityVerificationHubV2(
            identityVerificationHubV2Address
        ).setVerificationConfigV2(verificationConfig);

        // Emit comprehensive deployment event
        emit ContractDeployed(
            address(this),
            msg.sender,
            identityVerificationHubV2Address,
            scopeValue,
            verificationConfigId,
            block.timestamp
        );
    }

    /**
     * @notice Implementation of customVerificationHook for Self Protocol
     * @dev This function is called by onVerificationSuccess after hub address validation
     * @param output The verification output from the hub
     * @param userData The user data passed through verification
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        address userAddress = address(uint160(output.userIdentifier));

        // Store verification data
        verifiedHumans[userAddress] = true;
        verificationTimestamps[userAddress] = block.timestamp;
        userIdentifiers[userAddress] = output.userIdentifier;

        // Store last verification for debugging
        lastOutput = output;
        lastUserData = userData;
        lastUserAddress = userAddress;

        // Emit comprehensive verification events
        emit HumanVerified(
            userAddress,
            output.userIdentifier,
            block.timestamp,
            scope(),
            output
        );

        emit VerificationCompleted(
            output,
            userData,
            userAddress,
            block.timestamp
        );
    }

    /**
     * @notice Set verification configuration ID
     * @param configId The new configuration ID
     */
    function setConfigId(bytes32 configId) external onlyOwner {
        bytes32 oldConfigId = verificationConfigId;
        verificationConfigId = configId;

        emit VerificationConfigUpdated(
            oldConfigId,
            configId,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Get configuration ID for verification
     * @return The verification configuration ID
     */
    function getConfigId(
        bytes32 /* destinationChainId */,
        bytes32 /* userIdentifier */,
        bytes memory /* userDefinedData */
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }

    /**
     * @notice Check if an address is verified
     * @param human Address to check
     * @return isVerifiedStatus True if verified, false otherwise
     */
    function isVerified(
        address human
    ) external returns (bool isVerifiedStatus) {
        isVerifiedStatus = verifiedHumans[human];

        // Emit query event for transparency and monitoring
        emit VerificationStatusQueried(
            human,
            isVerifiedStatus,
            msg.sender,
            block.timestamp
        );

        return isVerifiedStatus;
    }

    /**
     * @notice Get verification timestamp for an address
     * @param human Address to check
     * @return The timestamp when the address was verified (0 if not verified)
     */
    function getVerificationTimestamp(
        address human
    ) external view returns (uint256) {
        return verificationTimestamps[human];
    }

    /**
     * @notice Get user identifier for a verified address
     * @param human Address to check
     * @return The user identifier from Self Protocol verification
     */
    function getUserIdentifier(address human) external view returns (uint256) {
        return userIdentifiers[human];
    }

    /**
     * @notice Transfer ownership of the contract
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner, block.timestamp);
    }

    /**
     * @notice Get current verification configuration
     * @return The current verification configuration
     */
    function getVerificationConfig()
        external
        view
        returns (SelfStructs.VerificationConfigV2 memory)
    {
        return verificationConfig;
    }

    /**
     * @notice Get current verification configuration ID
     * @return The current verification configuration ID
     */
    function getCurrentConfigId() external view returns (bytes32) {
        return verificationConfigId;
    }

    /**
     * @notice Get the identity verification hub V2 address
     * @return The address of the identity verification hub V2
     */
    function identityVerificationHubV2() external view returns (address) {
        return address(_identityVerificationHubV2);
    }
}
