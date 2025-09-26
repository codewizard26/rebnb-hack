"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    useRentProperty,
    useBookProperty,
    useUnlockRoom,
    useCancelBooking,
    useGetListingData
} from "@/hooks/usePropertyActions";

interface PropertyActionButtonsProps {
    propertyId: string;
    date: string;
}

export function PropertyActionButtons({ propertyId, date }: PropertyActionButtonsProps) {
    const [newRentPrice, setNewRentPrice] = useState("");
    const [newRentSecurity, setNewRentSecurity] = useState("");
    const [newBookingPrice, setNewBookingPrice] = useState("");
    const [newBookingSecurity, setNewBookingSecurity] = useState("");
    const [listingData, setListingData] = useState<any>(null);

    // Hooks
    const { mutateAsync: rentProperty, isPending: isRenting } = useRentProperty();
    const { mutateAsync: bookProperty, isPending: isBooking } = useBookProperty();
    const { mutateAsync: unlockRoom, isPending: isUnlocking } = useUnlockRoom();
    const { mutateAsync: cancelBooking, isPending: isCanceling } = useCancelBooking();
    const { mutateAsync: getListingData } = useGetListingData();

    // Handle rent property (re-rent)
    const handleRentProperty = async () => {
        try {
            const receipt = await rentProperty({
                propertyId,
                date,
                newRentPrice,
                newRentSecurity,
                newBookingPrice,
                newBookingSecurity
            });
            alert("Property rented successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            alert("Failed to rent property: " + (error as Error).message);
        }
    };

    // Handle book property
    const handleBookProperty = async () => {
        try {
            const receipt = await bookProperty({ propertyId, date });
            alert("Property booked successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            alert("Failed to book property: " + (error as Error).message);
        }
    };

    // Handle unlock room
    const handleUnlockRoom = async () => {
        try {
            const receipt = await unlockRoom({ propertyId, date });
            alert("Room unlocked successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            alert("Failed to unlock room: " + (error as Error).message);
        }
    };

    // Handle cancel booking
    const handleCancelBooking = async () => {
        try {
            const receipt = await cancelBooking({ propertyId, date });
            alert("Booking canceled successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            alert("Failed to cancel booking: " + (error as Error).message);
        }
    };

    // Handle get listing data
    const handleGetListingData = async () => {
        try {
            const data = await getListingData({ propertyId, date });
            setListingData(data);
        } catch (error) {
            alert("Failed to get listing: " + (error as Error).message);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Property Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Re-rent pricing inputs */}
                <div className="space-y-2">
                    <Label>New Rent Price (ETH)</Label>
                    <Input
                        value={newRentPrice}
                        onChange={(e) => setNewRentPrice(e.target.value)}
                        placeholder="0.1"
                    />
                </div>

                <div className="space-y-2">
                    <Label>New Rent Security (ETH)</Label>
                    <Input
                        value={newRentSecurity}
                        onChange={(e) => setNewRentSecurity(e.target.value)}
                        placeholder="0.05"
                    />
                </div>

                <div className="space-y-2">
                    <Label>New Booking Price (ETH)</Label>
                    <Input
                        value={newBookingPrice}
                        onChange={(e) => setNewBookingPrice(e.target.value)}
                        placeholder="0.2"
                    />
                </div>

                <div className="space-y-2">
                    <Label>New Booking Security (ETH)</Label>
                    <Input
                        value={newBookingSecurity}
                        onChange={(e) => setNewBookingSecurity(e.target.value)}
                        placeholder="0.1"
                    />
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                    <Button
                        onClick={handleRentProperty}
                        disabled={isRenting}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        {isRenting ? "Renting..." : "Rent Property (Re-rent)"}
                    </Button>

                    <Button
                        onClick={handleBookProperty}
                        disabled={isBooking}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {isBooking ? "Booking..." : "Book Property"}
                    </Button>

                    <Button
                        onClick={handleUnlockRoom}
                        disabled={isUnlocking}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                        {isUnlocking ? "Unlocking..." : "Unlock Room"}
                    </Button>

                    <Button
                        onClick={handleCancelBooking}
                        disabled={isCanceling}
                        className="w-full bg-red-600 hover:bg-red-700"
                    >
                        {isCanceling ? "Canceling..." : "Cancel Booking"}
                    </Button>

                    <Button
                        onClick={handleGetListingData}
                        className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                        Get Listing Data
                    </Button>
                </div>

                {/* Display listing data */}
                {listingData && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                        <h4 className="font-semibold mb-2">Listing Info:</h4>
                        <p><strong>Creator:</strong> {listingData.listing.creator}</p>
                        <p><strong>Rent Price:</strong> {listingData.listing.rentPrice} ETH</p>
                        <p><strong>Booking Price:</strong> {listingData.listing.bookingPrice} ETH</p>
                        <p><strong>Is Active:</strong> {listingData.isActive ? "Yes" : "No"}</p>
                        <p><strong>Is Booked:</strong> {listingData.bookingInfo.isBooked ? "Yes" : "No"}</p>
                        <p><strong>Is Completed:</strong> {listingData.isCompleted ? "Yes" : "No"}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
