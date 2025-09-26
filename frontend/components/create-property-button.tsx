"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateListing, generatePropertyId } from "@/hooks/useGenerateListing";
import { toast } from "sonner";

interface CreatePropertyButtonProps {
    to?: string;
    propertyId?: string;
    onSuccess?: (data: { property_id: string; ipfs_hash: string; transaction_hash: string }) => void;
    onError?: (error: string) => void;
}

export function CreatePropertyButton({
    to = "0x7d0176b839a37d6d1e0c1b814f056d39091baec6",
    propertyId,
    onSuccess,
    onError
}: CreatePropertyButtonProps) {
    const { mutateAsync: createProperty, isPending } = useCreateListing();

    const handleCreateProperty = async () => {
        try {
            // Use provided propertyId or generate a new one > 1
            const finalPropertyId = propertyId || generatePropertyId();

            const result = await createProperty({
                propertyId: finalPropertyId,
                date: new Date().toISOString().split('T')[0],
                rentPrice: "0.1",
                rentSecurity: "0.05",
                bookingPrice: "0.2",
                bookingSecurity: "0.1"
            });

            if (result.success) {
                toast.success("Property created successfully!");
                onSuccess?.(result.data);
            } else {
                toast.error(result.message || "Failed to create property");
                onError?.(result.message || "Failed to create property");
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
            toast.error(errorMessage);
            onError?.(errorMessage);
        }
    };

    return (
        <Button
            onClick={handleCreateProperty}
            disabled={isPending}
            className="rounded-xl bg-green-600 text-white hover:bg-green-500 transition shadow-md shadow-green-500/40"
        >
            {isPending ? "Creating Property..." : "Create Property"}
        </Button>
    );
}
