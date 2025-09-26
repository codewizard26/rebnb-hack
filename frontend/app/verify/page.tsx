"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function VerifyPage() {
    const sp = useSearchParams();
    const pid = sp.get("pid");
    const bookings = useAppStore((s) => s.bookings);
    const booking = useMemo(() => bookings.find((b) => b.propertyId === pid), [bookings, pid]);
    const now = Date.now();
    const expired = !booking?.accessExpiresAt || now > booking.accessExpiresAt;
    const token = booking?.status === "final" && !expired ? `reairbnb:key:${pid}:${booking.accessExpiresAt}` : "expired";

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="mx-auto flex w-full max-w-none flex-1 flex-col items-center justify-center gap-4 px-4 py-8">
                {token !== "expired" ? (
                    <>
                        <QRCodeSVG value={token} size={192} />
                        <p className="text-sm text-muted-foreground">Scan to verify NFT-based access</p>
                    </>
                ) : (
                    <p className="text-lg font-medium">Access expired</p>
                )}
            </main>
            <Footer />
        </div>
    );
}


