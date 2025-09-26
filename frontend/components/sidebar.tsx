"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gauge, Repeat, BadgeCheck, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: Gauge },
    { href: "/rerent/p1", label: "Re-Rent", icon: Repeat },
    { href: "/nft", label: "My NFTs", icon: BadgeCheck },
    { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarLinks() {
    const pathname = usePathname();
    return (
        <nav className="flex flex-col gap-2 p-2">
            {items.map((it) => {
                const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                const Icon = it.icon;
                return (
                    <Link
                        key={it.href}
                        href={it.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition shadow-sm hover:shadow ${active ? "border border-transparent bg-white/70 dark:bg-white/10 backdrop-blur-lg ring-1 ring-indigo-400/50" : "bg-transparent"
                            }`}
                    >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white" : "bg-muted"}`}>
                            <Icon className="h-4 w-4" />
                        </span>
                        <span className={active ? "bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent" : ""}>{it.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export function Sidebar() {
    return (
        <>
            <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 md:block">
                <div className="h-full rounded-2xl bg-white/70 p-2 shadow-lg backdrop-blur-lg dark:bg-white/10">
                    <SidebarLinks />
                </div>
            </aside>
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="fixed left-4 top-4 z-50">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                        <SidebarLinks />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}


