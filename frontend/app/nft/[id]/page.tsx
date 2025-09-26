"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function NftPage() {
    const { id } = useParams<{ id: string }>();
    const bookings = useAppStore((s) => s.bookings);
    const booking = useMemo(() => bookings.find((b) => b.propertyId === id), [bookings, id]);
    const now = Date.now();
    const expired = !booking?.accessExpiresAt || now > booking.accessExpiresAt;
    const start = booking?.startDate ? new Date(booking.startDate) : undefined;
    const end = booking?.endDate ? new Date(booking.endDate) : undefined;
    const token = booking?.status === "final" && !expired ? `reairbnb:key:${id}:${booking.accessExpiresAt}:${booking.startDate ?? ''}:${booking.endDate ?? ''}` : "expired";

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="container flex flex-1 flex-col items-center justify-center gap-6 py-8">
                {token !== "expired" ? (
                    <div className="rounded-2xl bg-emerald-500/10 p-8 shadow-lg ring-1 ring-emerald-400/40">
                        <div className="animate-pulse-slow rounded-xl bg-emerald-400/20 p-6">
                            <QRCodeSVG value={token} size={224} />
                        </div>
                        <p className="mt-4 text-center text-sm text-emerald-300">Scan to Unlock</p>
                        <p className="mt-1 text-center text-xs text-emerald-200">
                            {start ? start.toLocaleDateString() : ""} {start && end ? "-" : ""} {end ? end.toLocaleDateString() : ""}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-rose-500/10 p-8 shadow-lg ring-1 ring-rose-400/40">
                        <p className="text-rose-300">Access Expired</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}


