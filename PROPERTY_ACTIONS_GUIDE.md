# Property Actions - Direct Contract Calls

This guide explains how to use the direct contract calls for **renting**, **re-renting**, and **booking** properties in your Airbnb marketplace.

## Contract Analysis

Based on your deployed contracts:

- **Marketplace Contract**: `0xa82e1dd2ead50fb919c277cb34e9db8859663207`
- **TokenizedProperty Contract**: `0xd53a9d638c1e8535ad9eedfae5abb2098a3ab2c3`
- **Network**: Unichain Sepolia (Chain ID: 1301)

## Available Actions

### 1. Rent Property (Re-rent)
- **Function**: `rentListing(propertyId, date, updateParams)`
- **Purpose**: Allows someone to rent a property and become the new owner for that date
- **Payment**: Requires `rentSecurity` amount in ETH
- **Result**: Transfers the date token to the renter and updates listing with new pricing

### 2. Book Property
- **Function**: `bookListing(propertyId, date)`
- **Purpose**: Books a property for a specific date
- **Payment**: Requires `bookingSecurity` amount in ETH
- **Result**: Transfers the date token to the booker and marks as booked

### 3. Unlock Room
- **Function**: `unlockRoom(propertyId, date)`
- **Purpose**: Finalizes a booking and distributes payments to all renters
- **Payment**: Requires `bookingPrice` amount in ETH
- **Result**: Completes the listing and splits payments among renters

### 4. Cancel Booking
- **Function**: `cancelBooking(propertyId, date)`
- **Purpose**: Cancels an existing booking
- **Payment**: No payment required
- **Result**: Returns the date token to the original owner

## Usage Examples

### Basic Usage

```typescript
import { useRentProperty, useBookProperty, useUnlockRoom, useCancelBooking } from "@/hooks/usePropertyActions";

function MyComponent() {
  const { mutateAsync: rentProperty } = useRentProperty();
  const { mutateAsync: bookProperty } = useBookProperty();
  const { mutateAsync: unlockRoom } = useUnlockRoom();
  const { mutateAsync: cancelBooking } = useCancelBooking();

  // Rent a property (re-rent)
  const handleRent = async () => {
    try {
      const receipt = await rentProperty({
        propertyId: "123",
        date: "2024-01-15",
        newRentPrice: "0.1",
        newRentSecurity: "0.05",
        newBookingPrice: "0.2",
        newBookingSecurity: "0.1"
      });
      console.log("Rented successfully:", receipt.hash);
    } catch (error) {
      console.error("Rent failed:", error);
    }
  };

  // Book a property
  const handleBook = async () => {
    try {
      const receipt = await bookProperty({
        propertyId: "123",
        date: "2024-01-15"
      });
      console.log("Booked successfully:", receipt.hash);
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  // Unlock room (finalize booking)
  const handleUnlock = async () => {
    try {
      const receipt = await unlockRoom({
        propertyId: "123",
        date: "2024-01-15"
      });
      console.log("Unlocked successfully:", receipt.hash);
    } catch (error) {
      console.error("Unlock failed:", error);
    }
  };

  // Cancel booking
  const handleCancel = async () => {
    try {
      const receipt = await cancelBooking({
        propertyId: "123",
        date: "2024-01-15"
      });
      console.log("Canceled successfully:", receipt.hash);
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  };
}
```

### Using the Property Action Buttons Component

```typescript
import { PropertyActionButtons } from "@/components/property-action-buttons";

function PropertyPage() {
  return (
    <div>
      <h1>Property Details</h1>
      <PropertyActionButtons 
        propertyId="123" 
        date="2024-01-15" 
      />
    </div>
  );
}
```

## Key Features

1. **Automatic Payment Calculation**: The hooks automatically fetch the required payment amounts from the contract
2. **Error Handling**: Comprehensive error handling with user-friendly messages
3. **Transaction Receipts**: Returns transaction receipts for tracking
4. **Loading States**: Built-in loading states for UI feedback
5. **Type Safety**: Full TypeScript support with proper typing

## Important Notes

1. **Date Format**: Dates are converted to days since epoch (Unix timestamp / 86400)
2. **ETH Payments**: All payments are in ETH and automatically converted using ethers.js
3. **Wallet Connection**: Requires MetaMask or similar wallet to be connected
4. **Network**: Make sure you're connected to Unichain Sepolia (Chain ID: 1301)
5. **Gas Fees**: Users will need ETH for gas fees in addition to the property payments

## Contract Functions Used

- `getListing(propertyId, date)` - Get listing details
- `isListingActive(propertyId, date)` - Check if listing is active
- `listingBooked(propertyId, date)` - Get booking information
- `listingCompleted(propertyId, date)` - Check if listing is completed
- `rentListing(propertyId, date, updateParams)` - Rent property
- `bookListing(propertyId, date)` - Book property
- `unlockRoom(propertyId, date)` - Unlock room
- `cancelBooking(propertyId, date)` - Cancel booking

## Files Created

1. `/frontend/hooks/usePropertyActions.ts` - Main hooks for contract interactions
2. `/frontend/components/property-actions.tsx` - Full-featured component
3. `/frontend/components/property-action-buttons.tsx` - Simple reusable component
4. `/frontend/app/property-actions/page.tsx` - Demo page

## Integration

To integrate these actions into your existing components, simply import the hooks and use them as shown in the examples above. The hooks handle all the contract interaction complexity, so you just need to call them with the appropriate parameters.
