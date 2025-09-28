# KYC Integration with SelfXYZ - Complete Implementation Guide

This guide documents the complete KYC (Know Your Customer) integration using SelfXYZ protocol for the REBNB platform.

## Overview

The KYC integration ensures that users must verify their identity before listing properties on the platform. This implementation uses:

- **SelfXYZ Protocol**: Zero-knowledge identity verification
- **ProofOfHuman Contract**: On-chain verification storage
- **React Components**: Seamless user experience
- **Wagmi Hooks**: Blockchain interaction

## Architecture

```
User → SelfXYZ App → Backend API → ProofOfHuman Contract → Blockchain
  ↓                      ↓                ↓                    ↓
QR Code              Verification     Smart Contract      Permanent
Scan                 Validation       Storage             Record
```

## Components Overview

### 1. Smart Contract (`src/ProofOfHuman.sol`)

The ProofOfHuman contract extends SelfVerificationRoot and provides:

- **Verification Storage**: Tracks verified users on-chain
- **Event Emission**: Comprehensive logging for transparency
- **Access Control**: Owner-only administrative functions
- **Configuration Management**: Dynamic verification rules

Key functions:
- `verifySelfProof()`: Submit verification proof
- `isVerified()`: Check verification status
- `getVerificationTimestamp()`: Get verification date
- `getUserIdentifier()`: Get Self Protocol user ID

### 2. Frontend Integration

#### Hooks (`frontend/hooks/useProofOfHuman.ts`)

- `useIsVerified()`: Check if address is verified
- `useVerificationStatus()`: Get complete verification data
- `useProofOfHumanWrite()`: Contract write operations

#### Components (`frontend/components/kyc-verification.tsx`)

- **KYCVerification**: Main verification component
- **Compact Mode**: For inline status display
- **QR Code Integration**: SelfXYZ app interaction
- **Status Tracking**: Real-time verification updates

#### Store Integration (`frontend/store/useAppStore.ts`)

- Persistent verification status
- Cross-component state sharing
- Automatic status updates

### 3. API Integration (`frontend/app/api/verify/route.ts`)

- **SelfXYZ Verification**: Backend proof validation
- **Contract Integration**: Automatic on-chain recording
- **Error Handling**: Graceful failure management
- **Logging**: Comprehensive audit trail

## Deployment Guide

### 1. Deploy ProofOfHuman Contract

```bash
# Set environment variables
export PRIVATE_KEY="your_private_key"
export IDENTITY_VERIFICATION_HUB_V2="self_protocol_hub_address"

# Deploy contract
forge script script/DeployProofOfHuman.s.sol \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### 2. Update Frontend Configuration

Update `frontend/lib/contracts.ts`:
```typescript
export const CONTRACTS = {
  // ... other contracts
  PROOF_OF_HUMAN: "0xYourDeployedContractAddress" as Address,
} as const;
```

### 3. Environment Variables

Add to `.env.local`:
```env
# SelfXYZ Configuration
NEXT_PUBLIC_SELF_APP_NAME="REBNB KYC"
NEXT_PUBLIC_SELF_SCOPE="rebnb-kyc"
NEXT_PUBLIC_SELF_ENDPOINT="https://your-domain.com/api/verify"

# Contract Configuration
NEXT_PUBLIC_PROOF_OF_HUMAN_ADDRESS="0xYourContractAddress"

# Backend Configuration (for API route)
RPC_URL="https://evmrpc-testnet.0g.ai"
PRIVATE_KEY="your_server_private_key"
```

## Usage Examples

### 1. Basic KYC Component

```tsx
import { KYCVerification } from "@/components/kyc-verification";

function MyComponent() {
  const handleVerificationComplete = (isVerified: boolean) => {
    if (isVerified) {
      console.log("User verified!");
    }
  };

  return (
    <KYCVerification 
      onVerificationComplete={handleVerificationComplete}
      required={true}
    />
  );
}
```

### 2. Compact Status Display

```tsx
import { KYCVerification } from "@/components/kyc-verification";

function PropertyCard() {
  return (
    <div>
      <h3>Property Title</h3>
      <KYCVerification compact={true} />
    </div>
  );
}
```

### 3. Verification Status Hook

```tsx
import { useVerificationStatus } from "@/hooks/useProofOfHuman";
import { useAccount } from "wagmi";

function UserProfile() {
  const { address } = useAccount();
  const { isVerified, timestamp, userIdentifier } = useVerificationStatus(address);

  return (
    <div>
      <p>Status: {isVerified ? "Verified" : "Not Verified"}</p>
      {isVerified && (
        <p>Verified on: {new Date(timestamp * 1000).toLocaleDateString()}</p>
      )}
    </div>
  );
}
```

## Property Listing Integration

The listing form (`frontend/components/listing-form.tsx`) now includes:

1. **Automatic KYC Check**: Verifies user status on load
2. **Inline Verification**: Shows KYC component when needed
3. **Disabled Submission**: Prevents listing without verification
4. **Status Display**: Shows verification status prominently

### Flow:
1. User opens listing form
2. System checks verification status
3. If not verified, shows KYC component
4. User completes verification via SelfXYZ app
5. System updates status and enables listing
6. User can proceed with property creation

## Security Considerations

### 1. Contract Security
- Owner-only administrative functions
- Immutable verification records
- Event-based transparency
- Reentrancy protection

### 2. Frontend Security
- Client-side verification status caching
- Automatic status refresh
- Secure API communication
- Error boundary handling

### 3. Privacy Protection
- Zero-knowledge proofs
- No personal data storage
- Self-sovereign identity
- GDPR compliance

## Testing

### 1. Contract Testing
```bash
forge test --match-contract ProofOfHumanTest
```

### 2. Frontend Testing
```bash
npm run test -- --testPathPattern=kyc
```

### 3. Integration Testing
1. Deploy contract to testnet
2. Configure frontend with contract address
3. Test full verification flow
4. Verify on-chain storage

## Monitoring & Analytics

### Contract Events
- `HumanVerified`: New verification completed
- `VerificationStatusQueried`: Status check performed
- `VerificationCompleted`: Full verification process done

### Frontend Metrics
- Verification completion rate
- Time to complete verification
- Error rates and types
- User drop-off points

## Troubleshooting

### Common Issues

1. **Contract Address Not Set**
   - Update `PROOF_OF_HUMAN` in contracts.ts
   - Verify deployment was successful

2. **SelfXYZ App Not Working**
   - Check endpoint URL configuration
   - Verify scope matches contract
   - Ensure proper network configuration

3. **Verification Not Updating**
   - Check contract transaction status
   - Verify event emission
   - Refresh verification status

4. **API Errors**
   - Check server private key configuration
   - Verify RPC URL accessibility
   - Monitor contract gas limits

### Debug Commands

```bash
# Check contract deployment
cast call $CONTRACT_ADDRESS "owner()" --rpc-url $RPC_URL

# Verify user status
cast call $CONTRACT_ADDRESS "verifiedHumans(address)" $USER_ADDRESS --rpc-url $RPC_URL

# Check contract scope
cast call $CONTRACT_ADDRESS "scope()" --rpc-url $RPC_URL
```

## Future Enhancements

1. **Multi-Chain Support**: Deploy on multiple networks
2. **Advanced Verification**: Additional identity checks
3. **Reputation System**: Link verification to user reputation
4. **Batch Operations**: Bulk verification status checks
5. **Analytics Dashboard**: Verification metrics and insights

## Support

For technical support or questions:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Documentation: [SelfXYZ Docs](https://docs.self.xyz)
- Community: [Discord/Telegram]

## License

This implementation is provided under the MIT License. See LICENSE file for details.
