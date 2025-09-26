"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { Property } from "@/data/properties";

export function PropertyCard({ property }: { property: Property }) {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="overflow-hidden rounded-2xl bg-white/70 shadow-lg backdrop-blur-lg transition hover:shadow-2xl dark:bg-white/10">
                <CardHeader className="p-0">
                    <Image src={property.image} alt={property.title} width={800} height={600} className="h-48 w-full object-cover" />
                </CardHeader>
                <CardContent className="space-y-2 p-4">
                    <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{property.city} • {property.type}</p>
                    <p className="font-semibold">${property.rent}/night • Deposit ${property.deposit}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4">
                    <Link href={`/property/${property.id}`}>
                        <Button className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow hover:shadow-2xl">View Details</Button>
                    </Link>
                    <Button variant="outline">Book</Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}


