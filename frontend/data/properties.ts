export type Property = {
  id: string;
  listingId: bigint; // Blockchain listing ID
  title: string;
  description: string;
  city: string;
  type: "apartment" | "house" | "studio";
  rent: number; // Price in 0G tokens
  deposit: number; // Deposit in 0G tokens
  owner: {
    address: string;
    ens?: string;
  };
  image: string;
  images?: string[]; // Additional images
  amenities?: string[];
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
};

export const properties: Property[] = [
  {
    id: "p1",
    listingId: 1n,
    title: "Sunny Apartment near Central Park",
    description:
      "Cozy 1BR with great light and amenities. Perfect for couples or solo travelers looking to explore NYC.",
    city: "New York",
    type: "apartment",
    rent: 1,
    deposit: 0.1,
    owner: {
      address: "0x66BEd1DeDf7D459168Db564D97294366cA777142",
      ens: "alice.eth",
    },
    image:
      "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
    ],
    amenities: [
      "WiFi",
      "Kitchen",
      "Air Conditioning",
      "Heating",
      "TV",
      "Washer",
    ],
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
  },
  {
    id: "p2",
    listingId: 2n,
    title: "Modern House with Pool",
    description:
      "Spacious 3BR with private pool. Great for families or groups looking for a luxurious stay.",
    city: "Los Angeles",
    type: "house",
    rent: 0.1,
    deposit: 0.2,
    owner: { address: "0xd81252d06C67A2f3cF3B377d9Aae5d827f14f3b1" },
    image:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop",
    ],
    amenities: [
      "WiFi",
      "Kitchen",
      "Pool",
      "Air Conditioning",
      "Parking",
      "Garden",
      "BBQ",
    ],
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
  },
  {
    id: "p3",
    listingId: 3n,
    title: "Minimal Studio in City Center",
    description:
      "Compact and stylish studio close to everything. Perfect for business travelers or city explorers.",
    city: "Berlin",
    type: "studio",
    rent: 0.01,
    deposit: 0.1,
    owner: {
      address: "0x1F474fe70F593E452F976F59BF2Cf990585E12FD",
      ens: "bob.eth",
    },
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
    ],
    amenities: ["WiFi", "Kitchen", "Air Conditioning", "Heating", "Desk"],
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
  },
];
