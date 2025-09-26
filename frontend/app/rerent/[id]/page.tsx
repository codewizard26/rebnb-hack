"use client";

import { useParams } from "next/navigation";
import { properties } from "@/data/properties";
import { ReRentForm } from "@/components/rerent-form";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useState } from "react";
import { reRent } from "@/lib/mockBooking";
import { Sidebar } from "@/components/sidebar";

export default function ReRentPage() {
    const { id } = useParams<{ id: string }>();
    const property = properties.find((p) => p.id === id);

    if (!property) return <div className="container py-10">Not found</div>;

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="mx-auto flex w-full max-w-none flex-1 gap-6 px-4 py-6">
                <Sidebar />
                <div className="flex-1 space-y-4">
                    <h1 className="text-2xl font-semibold">Re-Rent: {property.title}</h1>
                    <div className="rounded-2xl border bg-white/70 p-4 shadow dark:bg-white/10">
                        <p className="font-medium">{property.city} • {property.type}</p>
                        <p className="text-sm text-muted-foreground">Base rent ${property.rent} • Deposit ${property.deposit}</p>
                    </div>
                    <ReRentForm basePrice={property.rent} onSubmit={(price) => reRent(property.id, price)} />
                </div>
            </main>
            <Footer />
        </div>
    );
}


