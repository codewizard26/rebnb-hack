"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReownConnectButton } from "@/components/reown-connect";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FlowConnectButton } from "@/components/flow-connect";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
// import { UserBadge } from "@/components/user-badge";

export function Navbar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const onSearch = () => {
    const q = query.trim();
    if (q.length > 0) router.push(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Hamburger trigger for sidebar */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            {/* Overlay Sidebar */}
            <SheetContent
              side="left"
              className="w-72 bg-black backdrop-blur-xl p-0"
            >
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold"></h2>
              </div>
              <Sidebar />
            </SheetContent>
          </Sheet>
        {/* Logo */}
        <Link
          href="/"
          className="bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent hover:opacity-80 transition-opacity"
        >
          ReBNB
        </Link>
        

        {/* Search (centered on md+) */}
        <div className="mx-auto hidden w-full max-w-xl items-center justify-center md:flex">
          <div className="relative w-full">
            <Input
              placeholder="Search city, location, or stay..."
              className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm shadow-sm transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <Button
              size="sm"
              onClick={onSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 px-4 py-1.5 text-white shadow hover:shadow-md"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Mobile search input */}
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="w-40 rounded-full border border-white/20 bg-white/5 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 sm:hidden"
          />

          <ModeToggle />

          <ReownConnectButton />

          <FlowConnectButton />

          {/* Uncomment when user profile system ready */}
          {/* <UserBadge /> */}
        </div>
      </div>
    </header>
  );
}
