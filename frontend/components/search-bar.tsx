"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon } from "lucide-react";
import { addDays } from "date-fns";

export type SearchValue = {
    location: string;
    from: Date | undefined;
    to: Date | undefined;
    maxPrice: number;
};

export function SearchBar({ value, onChange }: { value: SearchValue; onChange: (v: SearchValue) => void }) {
    const [open, setOpen] = useState(false);

    const setDates = (from?: Date, to?: Date) => onChange({ ...value, from, to });

    return (
        <div className="flex w-full max-w-3xl items-center gap-2 rounded-full bg-white/70 p-2 shadow-lg backdrop-blur-lg dark:bg-white/10">
            <Input
                placeholder="Where to?"
                value={value.location}
                onChange={(e) => onChange({ ...value, location: e.target.value })}
                className="rounded-full"
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-full gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {value.from ? value.from.toLocaleDateString() : "Dates"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                        <Calendar
                            mode="range"
                            selected={{ from: value.from, to: value.to }}
                            onSelect={(range) => setDates(range?.from, range?.to ?? (range?.from ? addDays(range.from, 1) : undefined))}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm text-muted-foreground">Max ${value.maxPrice}</span>
                <Slider value={[value.maxPrice]} min={50} max={1000} step={10} onValueChange={([v]) => onChange({ ...value, maxPrice: v })} className="w-40" />
            </div>
            <Button className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow hover:shadow-lg">
                Search
            </Button>
        </div>
    );
}
