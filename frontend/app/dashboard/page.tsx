"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/useAppStore";
import { properties } from "@/data/properties";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";

export default function DashboardPage() {
    const { bookings, listings, removeListing } = useAppStore();
    const owned = properties; // dummy: treat all as owned
    const preBooked = bookings.filter((b) => b.status === "prebooked" || b.status === "rerented");
    const final = bookings.filter((b) => b.status === "final");

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="mx-auto flex w-full max-w-none flex-1 gap-6 px-4 py-6">
                <Sidebar />
                <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-blue-50 p-4 text-blue-900 shadow dark:bg-blue-950 dark:text-blue-100">
                            <div className="text-sm opacity-70">Owned</div>
                            <div className="text-2xl font-bold">{owned.length}</div>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-4 text-blue-900 shadow dark:bg-blue-950 dark:text-blue-100">
                            <div className="text-sm opacity-70">Pre-booked</div>
                            <div className="text-2xl font-bold">{preBooked.length}</div>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-4 text-blue-900 shadow dark:bg-blue-950 dark:text-blue-100">
                            <div className="text-sm opacity-70">Final</div>
                            <div className="text-2xl font-bold">{final.length}</div>
                        </div>
                    </div>
                    <Tabs defaultValue="owner">
                        <TabsList>
                            <TabsTrigger value="owner">Owner</TabsTrigger>
                            <TabsTrigger value="broker">Broker</TabsTrigger>
                            <TabsTrigger value="guest">Guest</TabsTrigger>
                        </TabsList>
                        <TabsContent value="owner" className="space-y-3">
                            <div className="flex justify-end">
                                <Link href="/list" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-500">Create Listing</Link>
                            </div>
                            {listings.length > 0 && (
                                <div className="rounded-2xl border bg-white/70 p-3 shadow dark:bg-white/10">
                                    <div className="mb-2 text-sm font-medium">Your Listings</div>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {listings.map((l) => (
                                            <div key={l.id} className="flex items-center justify-between rounded-xl border bg-white/70 p-3 shadow-sm dark:bg-white/5">
                                                <div>
                                                    <p className="font-medium">{l.title}</p>
                                                    <p className="text-xs text-muted-foreground">{l.city} • ${l.rent}/night</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Link href={`/property/${l.id}`} className="text-sm underline">View</Link>
                                                    <button onClick={() => removeListing(l.id)} className="text-sm text-rose-600 hover:underline">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {owned.map((p) => (
                                <div key={p.id} className="flex items-center justify-between rounded-2xl border bg-white/70 p-3 shadow dark:bg-white/10">
                                    <div>
                                        <p className="font-medium">{p.title}</p>
                                        <p className="text-sm text-muted-foreground">Rent set: ${p.rent}</p>
                                    </div>
                                    <Link className="underline" href={`/property/${p.id}`}>Manage</Link>
                                </div>
                            ))}
                        </TabsContent>
                        <TabsContent value="broker" className="space-y-3">
                            {preBooked.length === 0 && <p className="text-sm text-muted-foreground">No pre-booked properties yet.</p>}
                            {preBooked.map((b) => {
                                const p = properties.find((pp) => pp.id === b.propertyId)!;
                                return (
                                    <div key={b.propertyId} className="flex items-center justify-between rounded-2xl border bg-white/70 p-3 shadow dark:bg-white/10">
                                        <div>
                                            <p className="font-medium">{p.title}</p>
                                            <p className="text-sm text-muted-foreground">Pre-booked at ${b.price} {b.brokerPrice ? `• Re-list ${b.brokerPrice}` : ""}</p>
                                        </div>
                                        <Link className="underline" href={`/rerent/${p.id}`}>Re-list</Link>
                                    </div>
                                );
                            })}
                        </TabsContent>
                        <TabsContent value="guest" className="space-y-3">
                            {final.length === 0 && <p className="text-sm text-muted-foreground">No final bookings yet.</p>}
                            {final.map((b) => {
                                const p = properties.find((pp) => pp.id === b.propertyId)!;
                                return (
                                    <div key={b.propertyId} className="flex items-center justify-between rounded-2xl border bg-white/70 p-3 shadow dark:bg-white/10">
                                        <div>
                                            <p className="font-medium">{p.title}</p>
                                            <p className="text-sm text-muted-foreground">Access key available</p>
                                        </div>
                                        <Link className="underline" href={`/nft/${p.id}`}>View Key</Link>
                                    </div>
                                );
                            })}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <Footer />
        </div>
    );
}


