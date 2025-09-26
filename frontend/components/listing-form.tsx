"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { addDays } from "date-fns";
import { useAppStore } from "@/store/useAppStore";

export function ListingForm() {
    const addListing = useAppStore((s) => s.addListing);
    const [title, setTitle] = useState("");
    const [city, setCity] = useState("");
    const [type, setType] = useState<"apartment" | "house" | "studio">("apartment");
    const [description, setDescription] = useState("");
    const [rent, setRent] = useState(150);
    const [deposit, setDeposit] = useState(300);
    const [image, setImage] = useState("");
    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState<Date | undefined>();
    const [to, setTo] = useState<Date | undefined>();

    const submit = () => {
        const id = `u-${Date.now()}`;
        addListing({
            id,
            title,
            description,
            city,
            type,
            rent,
            deposit,
            image: image || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
            startDate: from?.getTime(),
            endDate: to?.getTime(),
        });
        setTitle(""); setCity(""); setDescription(""); setRent(150); setDeposit(300); setImage(""); setFrom(undefined); setTo(undefined);
    };

    return (
        <Card className="rounded-2xl bg-white/70 shadow backdrop-blur dark:bg-white/10">
            <CardHeader>
                <CardTitle>Create Listing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Input id="type" value={type} onChange={(e) => setType(e.target.value as any)} placeholder="apartment | house | studio" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rent">Rent / night</Label>
                    <Input id="rent" type="number" value={rent} onChange={(e) => setRent(Number(e.target.value || 0))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit</Label>
                    <Input id="deposit" type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value || 0))} />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label>Available dates</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {from ? `${from.toLocaleDateString()} - ${to?.toLocaleDateString() ?? ""}` : "Pick dates"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3">
                                <Calendar
                                    mode="range"
                                    selected={{ from, to }}
                                    onSelect={(range) => { setFrom(range?.from); setTo(range?.to ?? (range?.from ? addDays(range.from, 1) : undefined)); }}
                                    numberOfMonths={2}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="md:col-span-2">
                    <Button onClick={submit} className="bg-blue-600 text-white hover:bg-blue-500">Create Listing</Button>
                </div>
            </CardContent>
        </Card>
    );
}
