"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gauge, Repeat, BadgeCheck, Settings, Menu, List } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/rerent/p1", label: "Re-Rent", icon: Repeat },
  { href: "/nft", label: "My NFTs", icon: BadgeCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/list", label: "Create List", icon: List },
];

function SidebarLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-2 p-4">
      {items.map((it) => {
        const active =
          pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all shadow-sm hover:shadow-md
              ${active
                ? "bg-gradient-to-r from-sky-500 to-teal-500 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all
              ${active
                ? "bg-white/20"
                : "bg-gradient-to-br from-slate-700/30 to-slate-800/30"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={`font-medium transition-all ${active ? "text-white" : "group-hover:text-white"
                }`}
            >
              {it.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] w-64 shrink-0 md:block">
        <div className="h-full rounded-2xl bg-black shadow-xl border border-white/10">
          <SidebarLinks />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed left-4 top-20 z-50 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20"
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white"
          >
            <SidebarLinks />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
