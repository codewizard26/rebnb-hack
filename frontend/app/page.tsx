"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PropertyGrid } from "@/components/property-grid";
import { SearchBar, SearchValue } from "@/components/search-bar";
import { useState } from "react";
import { CategoriesRow, HowItWorks, CtaBanner } from "@/components/home-sections";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState<SearchValue>({
    location: "",
    from: undefined,
    to: undefined,
    maxPrice: 500,
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[70dvh] w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1670589953903-b4e2f17a70a9?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-4xl font-extrabold text-transparent tracking-tight sm:text-5xl lg:text-6xl"
            >
              Find your next unforgettable stay
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="max-w-2xl text-base text-muted-foreground sm:text-lg"
            >
              Explore unique stays and experiences, tailored to your vibe.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Floating SearchBar BELOW hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative z-20 -mt-10 mx-auto w-full max-w-4xl px-4"
      >
        <div className="rounded-3xl border border-transparent bg-white/80 p-4 shadow-xl backdrop-blur-xl 
                        dark:bg-black/60 dark:shadow-2xl
                        bg-gradient-to-r from-sky-500/10 via-transparent to-teal-500/10">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-none flex-1 gap-6 px-4 py-10">
        
        <div className="flex-1 space-y-6">
          <CategoriesRow />
          <PropertyGrid />
          <HowItWorks />
          <CtaBanner />
        </div>
      </main>

      <Footer />
    </div>
  );
}
