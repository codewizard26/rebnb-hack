"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PropertyGrid } from "@/components/property-grid";
import { Sidebar } from "@/components/sidebar";
import { SearchBar, SearchValue } from "@/components/search-bar";
import { useState } from "react";
import { CategoriesRow, StatsStrip, HowItWorks, CtaBanner } from "@/components/home-sections";

export default function Home() {
  const [search, setSearch] = useState<SearchValue>({ location: "", from: undefined, to: undefined, maxPrice: 500 });
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <section className="relative h-[40dvh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-none items-end pb-6 px-4">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </section>
      <main className="mx-auto flex w-full max-w-none flex-1 gap-6 px-4 py-6">
        <Sidebar />
        <div className="flex-1 space-y-6">
          <CategoriesRow />
          <PropertyGrid />
          <StatsStrip />
          <HowItWorks />
          <CtaBanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
