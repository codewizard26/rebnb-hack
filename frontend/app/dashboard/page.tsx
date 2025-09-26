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
import Link from "next/link";

import { Sidebar } from "@/components/sidebar";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { bookings, listings, removeListing } = useAppStore();
  const owned = properties; // dummy: treat all as owned
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

              {listings.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {listings.map((l) => (
                    <motion.div
                      key={l.id}
                      whileHover={{ scale: 1.02 }}
                      className="relative rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white hover:bg-sky-500/20 hover:border-sky-500 transition shadow-md shadow-sky-500/20 p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{l.title}</p>
                          <p className="text-xs text-gray-300">
                            {l.city} • ${l.rent}/night
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Link
                            href={`/property/${l.id}`}
                            className="text-sm font-medium underline hover:text-sky-400"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => removeListing(l.id)}
                            className="text-sm text-rose-500 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {owned.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white hover:bg-sky-500/20 hover:border-sky-500 transition shadow-md shadow-sky-500/20 p-4"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-sm text-gray-300">Rent set: ${p.rent}</p>
                  </div>
                  <Link
                    className="text-sm font-medium underline hover:text-sky-400"
                    href={`/property/${p.id}`}
                  >
                    Manage
                  </Link>
                </motion.div>
              ))}
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
