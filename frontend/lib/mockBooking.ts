import { useAppStore } from "@/store/useAppStore";

export function preBook(propertyId: string, price: number, dates?: { from?: Date; to?: Date }) {
    useAppStore.getState().addBooking({ propertyId, status: "prebooked", price, startDate: dates?.from?.getTime(), endDate: dates?.to?.getTime() });
}

export function reRent(propertyId: string, brokerPrice: number) {
    useAppStore.getState().updateBooking(propertyId, { status: "rerented", brokerPrice });
}

export function finalBook(propertyId: string) {
    const expires = Date.now() + 1000 * 60 * 60 * 24; // 24h
    useAppStore.getState().updateBooking(propertyId, { status: "final", accessExpiresAt: expires });
}


