import { Address } from "viem";

// Contract addresses - these should be updated with actual deployed addresses
export const CONTRACTS = {
  // Main rental contract address (to be updated with actual deployment)
  RENTAL_CONTRACT: "0x1234567890123456789012345678901234567890" as Address,
  // PYUSD token contract address (actual PYUSD address on respective networks)
  PYUSD_TOKEN: "0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1" as Address, // PYUSD on Arbi sepolia
} as const;

// Reservation states enum matching the smart contract
export enum ReservationState {
  PREBOOKED = 0,
  FINALIZED = 1,
  RENTED = 2,
  REFUNDED = 3,
  DISPUTE = 4,
}

// Reservation struct type matching the smart contract
export type Reservation = {
  bookingId: bigint;
  listingId: bigint;
  originalPayer: Address; // broker
  owner: Address;
  deposit: bigint;
  price: bigint;
  expiresAt: bigint;
  state: ReservationState;
  isRerent: boolean;
  renter: Address;
  totalPaid: bigint;
  ownerShare: bigint; // basis points
  brokerShare: bigint; // basis points
};

// Listing details type
export type ListingDetails = {
  id: bigint;
  owner: Address;
  pricePerNight: bigint;
  isActive: boolean;
  title: string;
  description: string;
  imageUrl: string;
  city: string;
  propertyType: string;
};

// Main rental contract ABI
export const RENTAL_CONTRACT_ABI = [
  // Read functions
  {
    name: "getListingDetails",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "pricePerNight", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "imageUrl", type: "string" },
      { name: "city", type: "string" },
      { name: "propertyType", type: "string" },
    ],
  },
  {
    name: "getReservationStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "bookingId", type: "uint256" }],
    outputs: [
      { name: "bookingId", type: "uint256" },
      { name: "listingId", type: "uint256" },
      { name: "originalPayer", type: "address" },
      { name: "owner", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "state", type: "uint8" },
      { name: "isRerent", type: "bool" },
      { name: "renter", type: "address" },
      { name: "totalPaid", type: "uint256" },
      { name: "ownerShare", type: "uint256" },
      { name: "brokerShare", type: "uint256" },
    ],
  },
  {
    name: "getListingReservation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [
      { name: "bookingId", type: "uint256" },
      { name: "listingId", type: "uint256" },
      { name: "originalPayer", type: "address" },
      { name: "owner", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "state", type: "uint8" },
      { name: "isRerent", type: "bool" },
      { name: "renter", type: "address" },
      { name: "totalPaid", type: "uint256" },
      { name: "ownerShare", type: "uint256" },
      { name: "brokerShare", type: "uint256" },
    ],
  },
  // Write functions
  {
    name: "prebook",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "depositAmount", type: "uint256" },
    ],
    outputs: [{ name: "bookingId", type: "uint256" }],
  },
  {
    name: "finalizeBooking",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bookingId", type: "uint256" },
      { name: "totalPaidAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "bookDirectly",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    outputs: [{ name: "bookingId", type: "uint256" }],
  },
  {
    name: "raiseDispute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "bookingId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "submitEvidence",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "bookingId", type: "uint256" },
      { name: "evidenceHash", type: "string" },
    ],
    outputs: [],
  },
  // Events
  {
    name: "ReservationCreated",
    type: "event",
    inputs: [
      { name: "bookingId", type: "uint256", indexed: true },
      { name: "listingId", type: "uint256", indexed: true },
      { name: "originalPayer", type: "address", indexed: true },
      { name: "deposit", type: "uint256" },
    ],
  },
  {
    name: "BookingFinalized",
    type: "event",
    inputs: [
      { name: "bookingId", type: "uint256", indexed: true },
      { name: "renter", type: "address", indexed: true },
      { name: "totalPaid", type: "uint256" },
    ],
  },
  {
    name: "DisputeRaised",
    type: "event",
    inputs: [
      { name: "bookingId", type: "uint256", indexed: true },
      { name: "disputeRaiser", type: "address", indexed: true },
    ],
  },
] as const;

// PYUSD ERC20 token ABI (standard ERC20 functions we need)
export const PYUSD_TOKEN_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;
