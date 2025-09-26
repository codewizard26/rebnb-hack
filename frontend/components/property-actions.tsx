"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Home,
    Calendar,
    DollarSign,
    Shield,
    Clock,
    CheckCircle,
    XCircle,
    Key,
    X
} from "lucide-react";
import {
    useRentProperty,
    useBookProperty,
    useUnlockRoom,
    useCancelBooking,
    useGetListingData
} from "@/hooks/usePropertyActions";

export function PropertyActions() {
    // Form states
    const [propertyId, setPropertyId] = useState("");
    const [date, setDate] = useState("");
    const [newRentPrice, setNewRentPrice] = useState("");
    const [newRentSecurity, setNewRentSecurity] = useState("");
    const [newBookingPrice, setNewBookingPrice] = useState("");
    const [newBookingSecurity, setNewBookingSecurity] = useState("");

    // Listing data state
    const [listingData, setListingData] = useState<{
        listing: {
            creator: string;
            propertyId: string;
            date: string;
            rentPrice: string;
            rentSecurity: string;
            bookingPrice: string;
            bookingSecurity: string;
        };
        isActive: boolean;
        bookingInfo: {
            receiver: string;
            booker: string;
            isBooked: boolean;
        };
        isCompleted: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    // Hooks
    const { mutateAsync: rentProperty, isPending: isRenting } = useRentProperty();
    const { mutateAsync: bookProperty, isPending: isBooking } = useBookProperty();
    const { mutateAsync: unlockRoom, isPending: isUnlocking } = useUnlockRoom();
    const { mutateAsync: cancelBooking, isPending: isCanceling } = useCancelBooking();
    const { mutateAsync: getListingData } = useGetListingData();

    // Handle rent property (re-rent)
    const handleRentProperty = async () => {
        try {
            setLoading(true);
            const receipt = await rentProperty({
                propertyId,
                date,
                newRentPrice,
                newRentSecurity,
                newBookingPrice,
                newBookingSecurity
            });
            console.log("Property rented:", receipt);
            alert("Property rented successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            console.error("Error renting property:", error);
            alert("Failed to rent property: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Handle book property
    const handleBookProperty = async () => {
        try {
            setLoading(true);
            const receipt = await bookProperty({
                propertyId,
                date
            });
            console.log("Property booked:", receipt);
            alert("Property booked successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            console.error("Error booking property:", error);
            alert("Failed to book property: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Handle unlock room
    const handleUnlockRoom = async () => {
        try {
            setLoading(true);
            const receipt = await unlockRoom({
                propertyId,
                date
            });
            console.log("Room unlocked:", receipt);
            alert("Room unlocked successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            console.error("Error unlocking room:", error);
            alert("Failed to unlock room: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel booking
    const handleCancelBooking = async () => {
        try {
            setLoading(true);
            const receipt = await cancelBooking({
                propertyId,
                date
            });
            console.log("Booking canceled:", receipt);
            alert("Booking canceled successfully! Transaction hash: " + receipt.hash);
        } catch (error) {
            console.error("Error canceling booking:", error);
            alert("Failed to cancel booking: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Handle get listing data
    const handleGetListingData = async () => {
        try {
            setLoading(true);
            const data = await getListingData({
                propertyId,
                date
            });
            setListingData(data);
            console.log("Listing data:", data);
        } catch (error) {
            console.error("Error getting listing:", error);
            alert("Failed to get listing: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                        <Home className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-sky-400">
                        Property Actions
                    </h1>
                </div>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Rent, re-rent, book, and manage property listings
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <Card className="border-2 border-sky-500/30 shadow-2xl bg-black/40 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                            <Home className="h-5 w-5" />
                            <span>Property Details</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="propertyId" className="text-sky-300">Property ID</Label>
                                <Input
                                    id="propertyId"
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    placeholder="Enter property ID"
                                    className="bg-black/50 border-sky-500/30 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-sky-300">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-black/50 border-sky-500/30 text-white"
                                />
                            </div>
                        </div>

                        <Separator className="bg-sky-500/30" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">New Pricing (for Re-rent)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newRentPrice" className="text-sky-300">New Rent Price (0G)</Label>
                                    <Input
                                        id="newRentPrice"
                                        value={newRentPrice}
                                        onChange={(e) => setNewRentPrice(e.target.value)}
                                        placeholder="0.1"
                                        className="bg-black/50 border-sky-500/30 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newRentSecurity" className="text-sky-300">New Rent Security (0G)</Label>
                                    <Input
                                        id="newRentSecurity"
                                        value={newRentSecurity}
                                        onChange={(e) => setNewRentSecurity(e.target.value)}
                                        placeholder="0.05"
                                        className="bg-black/50 border-sky-500/30 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newBookingPrice" className="text-sky-300">New Booking Price (0G)</Label>
                                    <Input
                                        id="newBookingPrice"
                                        value={newBookingPrice}
                                        onChange={(e) => setNewBookingPrice(e.target.value)}
                                        placeholder="0.2"
                                        className="bg-black/50 border-sky-500/30 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newBookingSecurity" className="text-sky-300">New Booking Security (0G)</Label>
                                    <Input
                                        id="newBookingSecurity"
                                        value={newBookingSecurity}
                                        onChange={(e) => setNewBookingSecurity(e.target.value)}
                                        placeholder="0.1"
                                        className="bg-black/50 border-sky-500/30 text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleGetListingData}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? "Loading..." : "Get Listing Data"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card className="border-2 border-sky-500/30 shadow-2xl bg-black/40 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                            <Clock className="h-5 w-5" />
                            <span>Property Actions</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={handleRentProperty}
                                disabled={isRenting || loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {isRenting ? "Renting..." : "Rent Property (Re-rent)"}
                            </Button>

                            <Button
                                onClick={handleBookProperty}
                                disabled={isBooking || loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isBooking ? "Booking..." : "Book Property"}
                            </Button>

                            <Button
                                onClick={handleUnlockRoom}
                                disabled={isUnlocking || loading}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                {isUnlocking ? "Unlocking..." : "Unlock Room"}
                            </Button>

                            <Button
                                onClick={handleCancelBooking}
                                disabled={isCanceling || loading}
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isCanceling ? "Canceling..." : "Cancel Booking"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Listing Data Display */}
            {listingData && (
                <Card className="border-2 border-sky-500/30 shadow-2xl bg-black/40 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5" />
                            <span>Listing Information</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sky-300">Creator</Label>
                                <p className="text-white text-sm font-mono">{listingData.listing.creator}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Property ID</Label>
                                <p className="text-white">{listingData.listing.propertyId}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Date</Label>
                                <p className="text-white">{listingData.listing.date}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Rent Price</Label>
                                <p className="text-white">{listingData.listing.rentPrice} 0G</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Rent Security</Label>
                                <p className="text-white">{listingData.listing.rentSecurity} 0G</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Booking Price</Label>
                                <p className="text-white">{listingData.listing.bookingPrice} 0G</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Booking Security</Label>
                                <p className="text-white">{listingData.listing.bookingSecurity} 0G</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Is Active</Label>
                                <div className="flex items-center space-x-2">
                                    {listingData.isActive ? (
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                    )}
                                    <span className="text-white">{listingData.isActive ? "Yes" : "No"}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Is Booked</Label>
                                <div className="flex items-center space-x-2">
                                    {listingData.bookingInfo.isBooked ? (
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                    )}
                                    <span className="text-white">{listingData.bookingInfo.isBooked ? "Yes" : "No"}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Is Completed</Label>
                                <div className="flex items-center space-x-2">
                                    {listingData.isCompleted ? (
                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                    )}
                                    <span className="text-white">{listingData.isCompleted ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
