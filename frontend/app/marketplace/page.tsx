import { Navbar } from "@/components/navbar";
import { PropertyGrid } from "@/components/property-grid";

export default function MarketplacePage() {
    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
                        <p className="text-muted-foreground">
                            Discover and book amazing properties
                        </p>
                    </div>
                    <PropertyGrid />
                </div>
            </main>
        </div>
    );
}