"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreateProperty, generatePropertyId } from "@/hooks/useGenerateListing";
import { toast } from "sonner";

interface CreatePropertyButtonProps {
    to?: string;
    propertyId?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}

export function CreatePropertyButton({
    to = "0xd81252d06C67A2f3cF3B377d9Aae5d827f14f3b1",
    propertyId,
    onSuccess,
    onError
}: CreatePropertyButtonProps) {
    const { mutateAsync: createProperty, isPending } = useCreateProperty();

    const handleCreateProperty = async () => {
        try {
            // Use provided propertyId or generate a new one > 1
            const finalPropertyId = propertyId || generatePropertyId();

            const result = await createProperty({ to, propertyId: finalPropertyId });

            if (result.success) {
                toast.success("Property created successfully!");
                onSuccess?.(result.data);
            } else {
                toast.error(result.message || "Failed to create property");
                onError?.(result.message || "Failed to create property");
            }
        } catch (error: any) {
            const errorMessage = error.message || "An unexpected error occurred";
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
