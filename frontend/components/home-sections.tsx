"use client";

import Link from "next/link";

export function CategoriesRow() {
    const cats = [
        { k: "city", label: "City Stays" },
        { k: "beach", label: "Beachfront" },
        { k: "mountain", label: "Mountain" },
        { k: "work", label: "Work Remote" },
        { k: "family", label: "Family" },
    ];
    return (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-3">
            {cats.map((c) => (
                <button key={c.k} className="rounded-full border bg-white/70 px-4 py-2 text-sm shadow hover:shadow-md dark:bg-white/10">
                    {c.label}
                </button>
            ))}
        </div>
    );
}

export function StatsStrip() {
    const stats = [
        { n: "12k+", t: "Bookings" },
        { n: "2.5k+", t: "Hosts" },
        { n: "48", t: "Cities" },
    ];
    return (
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-blue-50 p-4 text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            {stats.map((s) => (
                <div key={s.t} className="rounded-xl bg-white/70 p-4 text-center shadow dark:bg-white/5">
                    <div className="text-xl font-bold">{s.n}</div>
                    <div className="text-xs opacity-70">{s.t}</div>
                </div>
            ))}
        </div>
    );
}

export function HowItWorks() {
    const steps = [
        { t: "Search", d: "Find verified stays with deposits in vaults." },
        { t: "Pre-Book", d: "Reserve with a small fee; you can re-rent." },
        { t: "Final Book", d: "Pay, receive NFT key, and check-in." },
    ];
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
                <div key={s.t} className="rounded-2xl border bg-white/70 p-5 shadow dark:bg-white/10">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">{i + 1}</div>
                    <div className="font-semibold">{s.t}</div>
                    <div className="text-sm text-muted-foreground">{s.d}</div>
                </div>
            ))}
        </div>
    );
}

export function CtaBanner() {
    return (
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 p-6 text-white shadow">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="text-2xl font-bold tracking-tight">List your place on ReAirbnb</div>
                    <p className="opacity-90">Earn more with decentralized escrow and re-rent markets.</p>
                </div>
                <Link href="/dashboard" className="rounded-full bg-white/20 px-5 py-2 text-sm font-medium backdrop-blur hover:bg-white/30">Get started</Link>
            </div>
        </div>
    );
}
