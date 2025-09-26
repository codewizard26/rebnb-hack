"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { ReownConnectButton } from "@/components/reown-connect";
import { FlowConnectButton } from "@/components/flow-connect";
import { UserBadge } from "@/components/user-badge";

export function Navbar() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const onSearch = () => {
        const q = query.trim();
        if (q.length > 0) router.push(`/?q=${encodeURIComponent(q)}`);
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 w-full max-w-none items-center gap-3 px-4">
                <Link href="/" className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-lg font-bold text-transparent tracking-tight">ReAirbnb</Link>
                <div className="mx-auto hidden w-full max-w-2xl items-center justify-center md:flex">
                    <Input placeholder="Search..." className="rounded-full" />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Input
                        placeholder="Search city or location"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearch()}
                        className="w-48 rounded-full sm:hidden"
                    />
                    <Button onClick={onSearch} className="hidden sm:inline-flex bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow hover:shadow-lg">Search</Button>
                    <ModeToggle />
                    <ReownConnectButton />
                    <FlowConnectButton />
                    <UserBadge />
                </div>
            </div>
        </header>
    );
}


