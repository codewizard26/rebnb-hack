import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import {
  CONTRACTS,
  RENTAL_CONTRACT_ABI,
  NATIVE_TOKEN,
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

// Native token utilities (0G tokens)
export function formatNativeToken(amount: bigint | undefined): string {
  if (!amount) return "0";
  return formatUnits(amount, NATIVE_TOKEN.decimals);
}

export function parseNativeToken(amount: string): bigint {
  return parseUnits(amount, NATIVE_TOKEN.decimals);
}

// Hook for contract write operations
export function useRentalContractWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Native token operations (no approval needed for native tokens)

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
