"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ReRentForm({ basePrice, onSubmit }: { basePrice: number; onSubmit: (price: number) => void }) {
    const [price, setPrice] = useState(Math.round(basePrice * 1.2));
    const ownerShare = Math.round(price * 0.9);
    const brokerShare = price - ownerShare;
    return (
        <Card className="rounded-2xl bg-white/70 shadow-lg backdrop-blur-lg dark:bg-white/10">
            <CardHeader>
                <CardTitle>Re-Rent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="price">New price</Label>
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} />
                </div>
                <div className="text-sm text-muted-foreground">Owner ${ownerShare} • Broker ${brokerShare}</div>
                <Button onClick={() => onSubmit(price)} className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow hover:shadow-2xl">Set price</Button>
            </CardContent>
        </Card>
    );
}


