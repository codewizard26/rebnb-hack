"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { addDays } from "date-fns";

export function BookingDates({ value, onChange }: { value: { from?: Date; to?: Date }; onChange: (v: { from?: Date; to?: Date }) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {value.from ? `${value.from.toLocaleDateString()} - ${value.to?.toLocaleDateString() ?? ""}` : "Select dates"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                    <Calendar
                        mode="range"
                        selected={value}
                        onSelect={(range) => onChange({ from: range?.from, to: range?.to ?? (range?.from ? addDays(range.from, 1) : undefined) })}
                        numberOfMonths={2}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
