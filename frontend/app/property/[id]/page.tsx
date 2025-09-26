"use client";

import { useParams, useRouter } from "next/navigation";
import { properties } from "@/data/properties";
import { ImageCarousel } from "@/components/image-carousel";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { preBook, reRent as reRentAction, finalBook } from "@/lib/mockBooking";
import { BookingDates } from "@/components/booking-dates";
import { useState } from "react";

export default function PropertyDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const property = properties.find((p) => p.id === params.id);
    const [dates, setDates] = useState<{ from?: Date; to?: Date }>({});

    if (!property) return <div className="container py-10">Not found</div>;

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="mx-auto grid w-full max-w-none flex-1 grid-cols-1 gap-6 px-4 py-6 md:grid-cols-2">
                <div>
                    <ImageCarousel images={[property.image, property.image, property.image]} />
                    <h1 className="mt-4 text-2xl font-semibold">{property.title}</h1>
                    <p className="text-muted-foreground">{property.city} • {property.type}</p>
                    <p className="mt-4">{property.description}</p>
                </div>
                <div className="space-y-4">
                    <div className="rounded-2xl border bg-white/70 p-4 shadow-lg backdrop-blur-lg dark:bg-white/10">
                        <p className="font-semibold">Rent: ${property.rent}/night</p>
                        <p className="font-semibold">Deposit: ${property.deposit}</p>
                        <p className="text-sm text-muted-foreground mt-2">Owner: {property.owner.ens ?? property.owner.address}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <BookingDates value={dates} onChange={setDates} />
                        <Button className="bg-blue-600 text-white shadow hover:bg-blue-500" onClick={() => preBook(property.id, property.rent, dates)}>Pre-Book</Button>
                        <Button variant="outline" onClick={() => { reRentAction(property.id, Math.round(property.rent * 1.2)); router.push(`/rerent/${property.id}`); }}>Re-Rent</Button>
                        <Button variant="secondary" onClick={() => finalBook(property.id)}>Final Book</Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}


