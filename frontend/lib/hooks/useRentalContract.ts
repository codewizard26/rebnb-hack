import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address, formatUnits, parseUnits } from "viem";
import {
  CONTRACTS,
  RENTAL_CONTRACT_ABI,
  PYUSD_TOKEN_ABI,
  Reservation,
  ListingDetails,
  ReservationState,
} from "../contracts";
import { toast } from "sonner";
import { useCallback } from "react";

// Hook for reading listing details
export function useListingDetails(listingId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.RENTAL_CONTRACT,
    abi: RENTAL_CONTRACT_ABI,
    functionName: "getListingDetails",
    args: listingId ? [listingId] : undefined,
    query: {
      enabled: !!listingId,
    },
  });
}

// Hook for reading reservation status
export function useReservationStatus(bookingId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.RENTAL_CONTRACT,
    abi: RENTAL_CONTRACT_ABI,
    functionName: "getReservationStatus",
    args: bookingId ? [bookingId] : undefined,
    query: {
      enabled: !!bookingId,
    },
  });
}

// Hook for reading listing reservation (current reservation for a listing)
export function useListingReservation(listingId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.RENTAL_CONTRACT,
    abi: RENTAL_CONTRACT_ABI,
    functionName: "getListingReservation",
    args: listingId ? [listingId] : undefined,
    query: {
      enabled: !!listingId,
    },
  });
}

// Hook for PYUSD balance
export function usePYUSDBalance(address: Address | undefined) {
  return useReadContract({
    address: CONTRACTS.PYUSD_TOKEN,
    abi: PYUSD_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

// Hook for PYUSD allowance
export function usePYUSDAllowance(
  owner: Address | undefined,
  spender: Address = CONTRACTS.RENTAL_CONTRACT
) {
  return useReadContract({
    address: CONTRACTS.PYUSD_TOKEN,
    abi: PYUSD_TOKEN_ABI,
    functionName: "allowance",
    args: owner ? [owner, spender] : undefined,
    query: {
      enabled: !!owner,
    },
  });
}

// Hook for contract write operations
export function useRentalContractWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // PYUSD approval
  const approvePYUSD = useCallback(
    async (amount: bigint) => {
      try {
        toast.loading("Approving PYUSD spending...", { id: "approve" });

        writeContract({
          address: CONTRACTS.PYUSD_TOKEN,
          abi: PYUSD_TOKEN_ABI,
          functionName: "approve",
          args: [CONTRACTS.RENTAL_CONTRACT, amount],
        });
      } catch (error) {
        toast.error("Failed to approve PYUSD spending", { id: "approve" });
        throw error;
      }
    },
    [writeContract]
  );

  // Pre-book a property
  const prebook = useCallback(
    async (listingId: bigint, depositAmount: bigint) => {
      try {
        toast.loading("Creating pre-booking...", { id: "prebook" });

        writeContract({
          address: CONTRACTS.RENTAL_CONTRACT,
          abi: RENTAL_CONTRACT_ABI,
          functionName: "prebook",
          args: [listingId, depositAmount],
        });
      } catch (error) {
        toast.error("Failed to create pre-booking", { id: "prebook" });
        throw error;
      }
    },
    [writeContract]
  );

  // Finalize booking (for renters booking pre-rented properties)
  const finalizeBooking = useCallback(
    async (bookingId: bigint, totalPaidAmount: bigint) => {
      try {
        toast.loading("Finalizing booking...", { id: "finalize" });

        writeContract({
          address: CONTRACTS.RENTAL_CONTRACT,
          abi: RENTAL_CONTRACT_ABI,
          functionName: "finalizeBooking",
          args: [bookingId, totalPaidAmount],
        });
      } catch (error) {
        toast.error("Failed to finalize booking", { id: "finalize" });
        throw error;
      }
    },
    [writeContract]
  );

  // Book directly (standard booking flow)
  const bookDirectly = useCallback(
    async (listingId: bigint, price: bigint) => {
      try {
        toast.loading("Creating direct booking...", { id: "book-direct" });

        writeContract({
          address: CONTRACTS.RENTAL_CONTRACT,
          abi: RENTAL_CONTRACT_ABI,
          functionName: "bookDirectly",
          args: [listingId, price],
        });
      } catch (error) {
        toast.error("Failed to create direct booking", { id: "book-direct" });
        throw error;
      }
    },
    [writeContract]
  );

  // Raise dispute
  const raiseDispute = useCallback(
    async (bookingId: bigint) => {
      try {
        toast.loading("Raising dispute...", { id: "dispute" });

        writeContract({
          address: CONTRACTS.RENTAL_CONTRACT,
          abi: RENTAL_CONTRACT_ABI,
          functionName: "raiseDispute",
          args: [bookingId],
        });
      } catch (error) {
        toast.error("Failed to raise dispute", { id: "dispute" });
        throw error;
      }
    },
    [writeContract]
  );

  // Submit evidence
  const submitEvidence = useCallback(
    async (bookingId: bigint, evidenceHash: string) => {
      try {
        toast.loading("Submitting evidence...", { id: "evidence" });

        writeContract({
          address: CONTRACTS.RENTAL_CONTRACT,
          abi: RENTAL_CONTRACT_ABI,
          functionName: "submitEvidence",
          args: [bookingId, evidenceHash],
        });
      } catch (error) {
        toast.error("Failed to submit evidence", { id: "evidence" });
        throw error;
      }
    },
    [writeContract]
  );

  return {
    approvePYUSD,
    prebook,
    finalizeBooking,
    bookDirectly,
    raiseDispute,
    submitEvidence,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Utility functions for formatting
export function formatPYUSD(amount: bigint | undefined): string {
  if (!amount) return "0";
  return formatUnits(amount, 6); // PYUSD has 6 decimals
}

export function parsePYUSD(amount: string): bigint {
  return parseUnits(amount, 6);
}

// Helper function to get reservation state label
export function getReservationStateLabel(state: ReservationState): string {
  switch (state) {
    case ReservationState.PREBOOKED:
      return "Pre-booked";
    case ReservationState.FINALIZED:
      return "Finalized";
    case ReservationState.RENTED:
      return "Rented";
    case ReservationState.REFUNDED:
      return "Refunded";
    case ReservationState.DISPUTE:
      return "In Dispute";
    default:
      return "Unknown";
  }
}

// Helper function to get reservation state color
export function getReservationStateColor(state: ReservationState): string {
  switch (state) {
    case ReservationState.PREBOOKED:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case ReservationState.FINALIZED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case ReservationState.RENTED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case ReservationState.REFUNDED:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    case ReservationState.DISPUTE:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}
