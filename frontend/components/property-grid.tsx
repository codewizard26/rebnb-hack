"use client";

import { useMemo, useState } from "react";
import { properties } from "@/data/properties";
import { PropertyCard } from "@/components/property-card";
import { Filters } from "@/components/search-filters";
import { useSearchParams } from "next/navigation";

export function PropertyGrid() {
    const searchParams = useSearchParams();
    const q = searchParams.get("q")?.toLowerCase() ?? "";
    const [filters, setFilters] = useState({
        minPrice: 0,
        maxPrice: 10000,
        type: "all" as "all" | "apartment" | "house" | "studio",
    });

    const filtered = useMemo(() => {
        return properties.filter((p) => {
            const matchesQuery = q ? p.city.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) : true;
            const matchesPrice = p.rent >= filters.minPrice && p.rent <= filters.maxPrice;
            const matchesType = filters.type === "all" ? true : p.type === filters.type;
            return matchesQuery && matchesPrice && matchesType;
        });
    }, [q, filters]);

    return (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
                <Filters value={filters} onChange={setFilters} />
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                ))}
            </div>
        </div>
    );
}


