"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sidebar } from "@/components/sidebar";
import { ListingForm } from "@/components/listing-form";
import { useAppStore } from "@/store/useAppStore";
import { PropertyCard } from "@/components/property-card";

export default function ListPage() {
    const listings = useAppStore((s) => s.listings);

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="mx-auto flex w-full max-w-none flex-1 gap-6 px-4 py-6">
                <Sidebar />
                <div className="flex-1 space-y-6">
                    <ListingForm />
                    {listings.length > 0 && (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {listings.map((l) => (
                                <PropertyCard
  key={l.id}
  property={{
    id: l.id,
    title: l.name,               // ✅ name exists now
    city: l.currentLocation,     // ✅ currentLocation exists now
    rent: l.rentPrice,
    deposit: l.rentSecurity,
    bookingPrice: l.bookingPrice,
    bookingSecurity: l.bookingSecurity,
    owner: { address: "you" },
    image: l.image,
  }}
/>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}


