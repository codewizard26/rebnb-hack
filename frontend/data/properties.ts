export type Property = {
    id: string;
    title: string;
    description: string;
    city: string;
    type: "apartment" | "house" | "studio";
    rent: number;
    deposit: number;
    owner: {
        address: string;
        ens?: string;
    };
    image: string;
};

export const properties: Property[] = [
    {
        id: "p1",
        title: "Sunny Apartment near Central Park",
        description: "Cozy 1BR with great light and amenities.",
        city: "New York",
        type: "apartment",
        rent: 180,
        deposit: 300,
        owner: { address: "0x1234...ABCD", ens: "alice.eth" },
        image: "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "p2",
        title: "Modern House with Pool",
        description: "Spacious 3BR with private pool.",
        city: "Los Angeles",
        type: "house",
        rent: 350,
        deposit: 500,
        owner: { address: "0x9876...CDEF" },
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop",
    },
    {
        id: "p3",
        title: "Minimal Studio in City Center",
        description: "Compact and stylish studio close to everything.",
        city: "Berlin",
        type: "studio",
        rent: 95,
        deposit: 150,
        owner: { address: "0x4567...EF01", ens: "bob.eth" },
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
    },
];


