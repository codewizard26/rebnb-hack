"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAppStore } from "@/store/useAppStore";
import Link from "next/link";

export default function MyNftsPage() {
    const allBookings = useAppStore((s) => s.bookings);
    const bookings = allBookings.filter((b) => b.status === "final");
    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-none flex-1 px-4 py-6">
                <h1 className="mb-4 text-2xl font-semibold">My NFT Keys</h1>
                {bookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active keys yet.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((b) => (
                            <div key={b.propertyId} className="rounded-2xl border bg-white/70 p-4 shadow dark:bg-white/10">
                                <div className="mb-2 text-sm text-muted-foreground">Booking</div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Property {b.propertyId}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {b.startDate ? new Date(b.startDate).toLocaleDateString() : ""}
                                            {b.startDate && b.endDate ? " - " : ""}
                                            {b.endDate ? new Date(b.endDate).toLocaleDateString() : ""}
                                        </p>
                                    </div>
                                    <Link href={`/nft/${b.propertyId}`} className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500">View QR</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}


