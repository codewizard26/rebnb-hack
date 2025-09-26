"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";
import { properties } from "@/data/properties";
import { fetchProperties, Property } from "@/lib/api";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Sidebar } from "@/components/sidebar";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { bookings } = useAppStore();
  const [apiProperties, setApiProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const fetchedProperties = await fetchProperties();
        setApiProperties(fetchedProperties);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  const owned = apiProperties; // Use API properties instead of dummy data
  const preBooked = bookings.filter(
    (b) => b.status === "prebooked" || b.status === "rerented"
  );
  const final = bookings.filter((b) => b.status === "final");

  const summaryStats = [
    {
      label: "Owned",
      value: owned.length,
      from: "from-sky-500",
      to: "to-teal-400",
    },
    {
      label: "Pre-booked",
      value: preBooked.length,
      from: "from-pink-500",
      to: "to-rose-400",
    },
    {
      label: "Final",
      value: final.length,
      from: "from-emerald-400",
      to: "to-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Accents */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-sky-500 to-teal-500 animate-pulse" />
      </div>

      <Navbar />
      <main className="mx-auto flex w-full max-w-none flex-1 gap-6 px-6 py-8 relative z-10">
        <Sidebar />
        <div className="flex-1 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {summaryStats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`relative rounded-3xl p-1 bg-gradient-to-tr ${stat.from} ${stat.to} shadow-lg`}
              >
                <div className="flex items-center justify-between rounded-3xl bg-black/80 p-6">
                  <div>
                    <div className="text-sm font-semibold opacity-70">
                      {stat.label}
                    </div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="rounded-full bg-black/70 shadow-md shadow-sky-500/20 backdrop-blur-md border border-sky-500/20">
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="broker">Broker</TabsTrigger>
              <TabsTrigger value="guest">Guest</TabsTrigger>
            </TabsList>

            {/* Owner Tab */}
            <TabsContent value="owner" className="space-y-6">
              <div className="flex justify-end">
                <Link
                  href="/list"
                  className="rounded-full bg-gradient-to-r from-sky-500 to-teal-400 px-5 py-2 text-sm font-medium text-black shadow-md shadow-sky-500/40 hover:opacity-90 transition"
                >
                  + Create Listing
                </Link>
              </div>


              {loading && (
                <div className="text-center py-8">
                  <div className="text-sky-400">Loading properties...</div>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="text-red-400">Error: {error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-sky-400 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && owned.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400">No properties found.</div>
                </div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {owned.map((p) => (
                    <motion.div
                      key={p.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="cursor-pointer"
                    >
                      <Link href={`/dashboard/${p.property_id}`}>
                        <div className="rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white hover:bg-sky-500/20 hover:border-sky-500 transition shadow-md shadow-sky-500/20 overflow-hidden">
                          {/* Image */}
                          <div className="aspect-video bg-gray-800/50 flex items-center justify-center">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.property_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`${p.image ? 'hidden' : ''} text-gray-500 text-center`}>
                              <div className="text-4xl mb-2">🏠</div>
                              <div className="text-sm">No Image</div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg text-white truncate">
                              {p.property_name}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              Click to view details
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Broker Tab */}
            <TabsContent value="broker" className="space-y-3">
              {preBooked.length === 0 && (
                <p className="text-sm text-gray-400">
                  No pre-booked properties yet.
                </p>
              )}
              {preBooked.map((b) => {
                const p = properties.find((pp) => pp.id === b.propertyId)!;
                return (
                  <motion.div
                    key={b.propertyId}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white hover:bg-sky-500/20 hover:border-sky-500 transition shadow-md shadow-sky-500/20 p-4"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-gray-300">
                        Pre-booked at ${b.price}{" "}
                        {b.brokerPrice ? `• Re-list ${b.brokerPrice}` : ""}
                      </p>
                    </div>
                    <Link
                      className="text-sm font-medium underline hover:text-sky-400"
                      href={`/rerent/${p.id}`}
                    >
                      Re-list
                    </Link>
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* Guest Tab */}
            <TabsContent value="guest" className="space-y-3">
              {final.length === 0 && (
                <p className="text-sm text-gray-400">No final bookings yet.</p>
              )}
              {final.map((b) => {
                const p = properties.find((pp) => pp.id === b.propertyId)!;
                return (
                  <motion.div
                    key={b.propertyId}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white hover:bg-sky-500/20 hover:border-sky-500 transition shadow-md shadow-sky-500/20 p-4"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-gray-300">
                        Access key available
                      </p>
                    </div>
                    <Link
                      className="text-sm font-medium underline hover:text-sky-400"
                      href={`/nft/${p.id}`}
                    >
                      View Key
                    </Link>
                  </motion.div>
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
