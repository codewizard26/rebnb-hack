"use client";

import { create } from "zustand";

export type UserRole = "owner" | "broker" | "guest";

export type Booking = {
    propertyId: string;
    status: "prebooked" | "rerented" | "final";
    price: number;
    brokerPrice?: number;
    accessExpiresAt?: number;
    startDate?: number;
    endDate?: number;
};

export type Listing = {
    id: string;
    title: string;
    description: string;
    city: string;
    type: "apartment" | "house" | "studio";
    rent: number;
    deposit: number;
    image: string;
    startDate?: number;
    endDate?: number;
};

type AppState = {
    role: UserRole;
    setRole: (r: UserRole) => void;
    bookings: Booking[];
    addBooking: (b: Booking) => void;
    updateBooking: (propertyId: string, patch: Partial<Booking>) => void;
    listings: Listing[];
    addListing: (l: Listing) => void;
    updateListing: (id: string, patch: Partial<Listing>) => void;
    removeListing: (id: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
    role: "guest",
    setRole: (r) => set({ role: r }),
    bookings: [],
    addBooking: (b) => set((s) => ({ bookings: [...s.bookings, b] })),
    updateBooking: (propertyId, patch) =>
        set((s) => ({
            bookings: s.bookings.map((b) => (b.propertyId === propertyId ? { ...b, ...patch } : b)),
        })),
    listings: [],
    addListing: (l) => set((s) => ({ listings: [l, ...s.listings] })),
    updateListing: (id, patch) => set((s) => ({ listings: s.listings.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
    removeListing: (id) => set((s) => ({ listings: s.listings.filter((l) => l.id !== id) })),
}));


