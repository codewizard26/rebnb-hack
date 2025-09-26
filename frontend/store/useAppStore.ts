"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Address } from "viem";
import { ReservationState } from "@/lib/contracts";

export type UserRole = "owner" | "broker" | "renter";

export type BlockchainBooking = {
  bookingId: bigint;
  listingId: bigint;
  propertyId: string; // Local property ID for UI
  originalPayer: Address; // broker address
  owner: Address;
  deposit: bigint;
  price: bigint;
  expiresAt: bigint;
  state: ReservationState;
  isRerent: boolean;
  renter: Address;
  totalPaid: bigint;
  ownerShare: bigint;
  brokerShare: bigint;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
};

export type LocalBooking = {
  id: string;
  propertyId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  userRole: "broker" | "renter";
  amount: number; // in PYUSD
  createdAt: number;
  checkIn?: number;
  checkOut?: number;
  transactionHash?: string;
  blockchainBookingId?: bigint;
};

export type WalletState = {
  isConnected: boolean;
  address?: Address;
  chainId?: number;
  balance?: bigint; // PYUSD balance
};

export type TransactionState = {
  hash?: string;
  status: "idle" | "pending" | "confirming" | "confirmed" | "failed";
  type?:
    | "approve"
    | "prebook"
    | "finalize"
    | "book-direct"
    | "dispute"
    | "evidence";
  error?: string;
};

type AppState = {
  // User role and preferences
  role: UserRole;
  setRole: (r: UserRole) => void;

  // Wallet state
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;

  // Transaction state
  transaction: TransactionState;
  setTransaction: (transaction: Partial<TransactionState>) => void;
  resetTransaction: () => void;

  // Local bookings (for UI state management)
  bookings: LocalBooking[];
  addBooking: (b: LocalBooking) => void;
  updateBooking: (id: string, patch: Partial<LocalBooking>) => void;
  removeBooking: (id: string) => void;

  // Blockchain bookings cache
  blockchainBookings: BlockchainBooking[];
  setBlockchainBookings: (bookings: BlockchainBooking[]) => void;
  addBlockchainBooking: (booking: BlockchainBooking) => void;
  updateBlockchainBooking: (
    bookingId: bigint,
    patch: Partial<BlockchainBooking>
  ) => void;

  // UI state
  selectedProperty?: string;
  setSelectedProperty: (propertyId?: string) => void;

  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  addNotification: (
    notification: Omit<
      AppState["notifications"][0],
      "id" | "timestamp" | "read"
    >
  ) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User role
      role: "renter",
      setRole: (r) => set({ role: r }),

      // Wallet state
      wallet: { isConnected: false },
      setWallet: (wallet) =>
        set((state) => ({ wallet: { ...state.wallet, ...wallet } })),

      // Transaction state
      transaction: { status: "idle" },
      setTransaction: (transaction) =>
        set((state) => ({
          transaction: { ...state.transaction, ...transaction },
        })),
      resetTransaction: () => set({ transaction: { status: "idle" } }),

      // Local bookings
      bookings: [],
      addBooking: (b) => set((state) => ({ bookings: [...state.bookings, b] })),
      updateBooking: (id, patch) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...patch } : b
          ),
        })),
      removeBooking: (id) =>
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== id),
        })),

      // Blockchain bookings
      blockchainBookings: [],
      setBlockchainBookings: (bookings) =>
        set({ blockchainBookings: bookings }),
      addBlockchainBooking: (booking) =>
        set((state) => ({
          blockchainBookings: [...state.blockchainBookings, booking],
        })),
      updateBlockchainBooking: (bookingId, patch) =>
        set((state) => ({
          blockchainBookings: state.blockchainBookings.map((b) =>
            b.bookingId === bookingId
              ? { ...b, ...patch, updatedAt: Date.now() }
              : b
          ),
        })),

      // UI state
      selectedProperty: undefined,
      setSelectedProperty: (propertyId) =>
        set({ selectedProperty: propertyId }),

      // Search
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Notifications
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substring(2),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "reairbnb-store",
      partialize: (state) => ({
        role: state.role,
        bookings: state.bookings,
        searchQuery: state.searchQuery,
        notifications: state.notifications,
      }),
    }
  )
);
