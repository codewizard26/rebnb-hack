"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FiltersValue = {
    minPrice: number;
    maxPrice: number;
    type: "all" | "apartment" | "house" | "studio";
};

export function Filters({ value, onChange }: { value: FiltersValue; onChange: (v: FiltersValue) => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="minPrice">Min price</Label>
                        <Input
                            id="minPrice"
                            type="number"
                            value={value.minPrice}
                            onChange={(e) => onChange({ ...value, minPrice: Number(e.target.value || 0) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maxPrice">Max price</Label>
                        <Input
                            id="maxPrice"
                            type="number"
                            value={value.maxPrice}
                            onChange={(e) => onChange({ ...value, maxPrice: Number(e.target.value || 0) })}
                        />
                    </div>
                </div>
                <div>
                    <Label className="mb-2 block">Property type</Label>
                    <Tabs value={value.type} onValueChange={(v) => onChange({ ...value, type: v as FiltersValue["type"] })}>
                        <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="apartment">Apartment</TabsTrigger>
                            <TabsTrigger value="house">House</TabsTrigger>
                            <TabsTrigger value="studio">Studio</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" />
                        <TabsContent value="apartment" />
                        <TabsContent value="house" />
                        <TabsContent value="studio" />
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}


