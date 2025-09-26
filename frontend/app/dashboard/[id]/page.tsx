"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ExternalLink, Home, MapPin, User, Calendar, Key, X } from "lucide-react";
import { fetchProperties, Property } from "@/lib/api";
import {
    useRentProperty,
    useBookProperty,
    useUnlockRoom,
    useCancelBooking,
    useGetListingData
} from "@/hooks/usePropertyActions";

interface PropertyMetadata {
    id: string;
    title?: string;
    description?: string;
    image?: string;
    price?: number;
    location?: string;
    owner?: string;
    [key: string]: any; // Allow for additional properties
}

export default function PropertyDetailPage() {
    const params = useParams();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [propertyMetadata, setPropertyMetadata] = useState<any>(null);

    // Property action states
    const [selectedDate, setSelectedDate] = useState("");
    const [newRentPrice, setNewRentPrice] = useState("");
    const [newRentSecurity, setNewRentSecurity] = useState("");
    const [newBookingPrice, setNewBookingPrice] = useState("");
    const [newBookingSecurity, setNewBookingSecurity] = useState("");
    const [listingData, setListingData] = useState<any>(null);
    const [showActionForm, setShowActionForm] = useState(false);
    const [actionType, setActionType] = useState<"rent" | "book" | "unlock" | "cancel" | null>(null);

    // Property action hooks
    const { mutateAsync: rentProperty, isPending: isRenting } = useRentProperty();
    const { mutateAsync: bookProperty, isPending: isBooking } = useBookProperty();
    const { mutateAsync: unlockRoom, isPending: isUnlocking } = useUnlockRoom();
    const { mutateAsync: cancelBooking, isPending: isCanceling } = useCancelBooking();
    const { mutateAsync: getListingData } = useGetListingData();

    useEffect(() => {
        const fetchPropertyData = async () => {
            if (!propertyId) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch all properties and find the one with matching property_id
                const properties = await fetchProperties();
                const foundProperty = properties.find(p => p.property_id === propertyId);

                if (!foundProperty) {
                    throw new Error(`Property with ID ${propertyId} not found`);
                }
                else {
                    // Make a GET request to the specified endpoint to fetch property details
                    const response = await fetch(`https://api.rebnb.sumitdhiman.in/api/v1/lists/${propertyId}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch property details from API (status: ${response.status})`);
                    }
                    const apiProperties = await response.json();
                    // The API returns an array, so get the first item (if any)
                    const apiProperty = Array.isArray(apiProperties) && apiProperties.length > 0 ? apiProperties[0] : null;
                    console.log("apiProperty", apiProperty);

                    // If we have a property, fetch its metadata using property_id and date
                    let metadata = null;
                    if (apiProperty && apiProperty.property_id && apiProperty.date) {
                        const metadataResponse = await fetch(
                            `https://api.rebnb.sumitdhiman.in/metadata/${apiProperty.property_id}/${apiProperty.date}`
                        );
                        if (!metadataResponse.ok) {
                            throw new Error(`Failed to fetch property metadata (status: ${metadataResponse.status})`);
                        }
                        metadata = await metadataResponse.json();
                        console.log("property metadata", metadata);

                        // Set the metadata and default date
                        setPropertyMetadata(metadata);
                        if (metadata && metadata.date) {
                            // Convert timestamp to date string (YYYY-MM-DD format)
                            const date = new Date(parseInt(metadata.date));
                            const dateString = date.toISOString().split('T')[0];
                            setSelectedDate(dateString);
                        }
                    }
                }

                setProperty(foundProperty);
            } catch (err) {
                console.error('Error fetching property data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch property data');
            } finally {
                setLoading(false);
            }
        };

        fetchPropertyData();
    }, [propertyId]);

    // Property action handlers
    const handleActionClick = (type: "rent" | "book" | "unlock" | "cancel") => {
        setActionType(type);
        setShowActionForm(true);
    };

    const handleRentProperty = async () => {
        if (!selectedDate) {
            alert("Please select a date");
            return;
        }
        try {
            // Use metadata values if available, otherwise use form values
            const rentPrice = propertyMetadata?.rent_price || newRentPrice;
            const rentSecurity = propertyMetadata?.rent_security || newRentSecurity;
            const bookingPrice = propertyMetadata?.booking_price || newBookingPrice;
            const bookingSecurity = propertyMetadata?.booking_security || newBookingSecurity;

            const receipt = await rentProperty({
                propertyId,
                date: selectedDate,
                newRentPrice: rentPrice,
                newRentSecurity: rentSecurity,
                newBookingPrice: bookingPrice,
                newBookingSecurity: bookingSecurity
            });
            alert("Property rented successfully! Transaction hash: " + receipt.hash);
            setShowActionForm(false);
            setActionType(null);
        } catch (error) {
            alert("Failed to rent property: " + (error as Error).message);
        }
    };

    const handleBookProperty = async () => {
        if (!selectedDate) {
            alert("Please select a date");
            return;
        }
        try {
            const receipt = await bookProperty({
                propertyId,
                date: selectedDate
            });
            alert("Property booked successfully! Transaction hash: " + receipt.hash);
            setShowActionForm(false);
            setActionType(null);
        } catch (error) {
            alert("Failed to book property: " + (error as Error).message);
        }
    };

    const handleUnlockRoom = async () => {
        if (!selectedDate) {
            alert("Please select a date");
            return;
        }
        try {
            const receipt = await unlockRoom({
                propertyId,
                date: selectedDate
            });
            alert("Room unlocked successfully! Transaction hash: " + receipt.hash);
            setShowActionForm(false);
            setActionType(null);
        } catch (error) {
            alert("Failed to unlock room: " + (error as Error).message);
        }
    };

    const handleCancelBooking = async () => {
        if (!selectedDate) {
            alert("Please select a date");
            return;
        }
        try {
            const receipt = await cancelBooking({
                propertyId,
                date: selectedDate
            });
            alert("Booking canceled successfully! Transaction hash: " + receipt.hash);
            setShowActionForm(false);
            setActionType(null);
        } catch (error) {
            alert("Failed to cancel booking: " + (error as Error).message);
        }
    };

    const handleGetListingData = async () => {
        if (!selectedDate) {
            alert("Please select a date");
            return;
        }
        try {
            const data = await getListingData({
                propertyId,
                date: selectedDate
            });
            setListingData(data);
        } catch (error) {
            alert("Failed to get listing: " + (error as Error).message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white relative overflow-hidden">
                <Navbar />
                <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                        <p className="text-gray-300">Loading property metadata...</p>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white relative overflow-hidden">
                <Navbar />
                <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Error Loading Property</h2>
                        <p className="text-gray-300 mb-4">{error}</p>
                        <p className="text-sm text-gray-400">
                            Property ID: <code className="bg-gray-800 px-2 py-1 rounded">{propertyId}</code>
                        </p>
                    </motion.div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Accents */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-sky-500 to-teal-500 animate-pulse" />
            </div>

            <Navbar />
            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-teal-400 bg-clip-text text-transparent">
                                {property?.property_name || 'Property Details'}
                            </h1>
                            <p className="text-gray-400 mt-1">
                                Property ID: <code className="bg-gray-800 px-2 py-1 rounded text-sm">{propertyId}</code>
                            </p>
                        </div>
                        <Badge variant="outline" className="border-sky-500/30 text-sky-400">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Available
                        </Badge>
                    </div>

                    {/* Property Image */}
                    {property?.image && (
                        <div className="relative rounded-2xl overflow-hidden">
                            <img
                                src={property.image}
                                alt={property.property_name}
                                className="w-full h-96 object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Property Details Card */}
                    <Card className="bg-black/30 border-sky-500/30 shadow-lg shadow-sky-500/20">
                        <CardHeader>
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <Home className="h-5 w-5 text-sky-400" />
                                Property Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Description */}
                            {property?.description && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2 text-sky-400">Description</h3>
                                    <p className="text-gray-300 leading-relaxed">{property.description}</p>
                                </div>
                            )}

                            <Separator className="bg-sky-500/20" />

                            {/* Pricing Information */}
                            {propertyMetadata && (
                                <>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 text-sky-400">Pricing Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-800/50 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-gray-400 mb-2">Rent Pricing</h4>
                                                <p className="text-white text-sm">Rent Price: <span className="text-green-400 font-semibold">{propertyMetadata.rent_price} ETH</span></p>
                                                <p className="text-white text-sm">Security (paid upfront): <span className="text-yellow-400 font-semibold">{propertyMetadata.rent_security} ETH</span></p>
                                                <p className="text-xs text-gray-400 mt-2">💡 You only pay security when renting. Rent price goes to owner when room is unlocked.</p>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-4">
                                                <h4 className="text-sm font-medium text-gray-400 mb-2">Booking Pricing</h4>
                                                <p className="text-white text-sm">Booking Price: <span className="text-green-400 font-semibold">{propertyMetadata.booking_price} ETH</span></p>
                                                <p className="text-white text-sm">Security (paid upfront): <span className="text-yellow-400 font-semibold">{propertyMetadata.booking_security} ETH</span></p>
                                                <p className="text-xs text-gray-400 mt-2">💡 You only pay security when booking. Booking price is paid when room is unlocked.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator className="bg-sky-500/20" />
                                </>
                            )}

                            {/* Property Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Address
                                    </h4>
                                    <p className="text-white">{property?.property_address}</p>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Owner
                                    </h4>
                                    <p className="text-white font-mono text-sm">{property?.wallet_address}</p>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Created
                                    </h4>
                                    <p className="text-white text-sm">
                                        {property?.created_at ? new Date(property.created_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-400 mb-1">IPFS Hash</h4>
                                    <p className="text-white font-mono text-xs break-all">{property?.ipfs_hash}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <Card className="bg-black/30 border-sky-500/30 shadow-lg shadow-sky-500/20">
                        <CardHeader>
                            <CardTitle className="text-xl text-white">Available Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={() => handleActionClick("rent")}
                                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 text-sm"
                                        size="lg"
                                    >
                                        <div className="text-center">
                                            <div>🏠 Rent Property</div>
                                            {propertyMetadata && (
                                                <div className="text-xs opacity-80 mt-1">
                                                    Pay: {propertyMetadata.rent_security} ETH security
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={() => handleActionClick("book")}
                                        className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-semibold py-4 text-sm"
                                        size="lg"
                                    >
                                        <div className="text-center">
                                            <div>🗓️ Book Property</div>
                                            {propertyMetadata && (
                                                <div className="text-xs opacity-80 mt-1">
                                                    Pay: {propertyMetadata.booking_security} ETH security
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={() => handleActionClick("unlock")}
                                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 text-sm"
                                        size="lg"
                                    >
                                        <div className="text-center">
                                            <div>🔑 Unlock Room</div>
                                            {propertyMetadata && (
                                                <div className="text-xs opacity-80 mt-1">
                                                    Pay: {propertyMetadata.booking_price} ETH
                                                </div>
                                            )}
                                        </div>
                                    </Button>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Button
                                        onClick={() => handleActionClick("cancel")}
                                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 text-sm"
                                        size="lg"
                                    >
                                        ❌ Cancel Booking
                                    </Button>
                                </motion.div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <Label htmlFor="mainDate" className="text-sky-300 text-sm">Select Date for Actions</Label>
                                    <Input
                                        id="mainDate"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-black/50 border-sky-500/30 text-white mt-1"
                                    />
                                </div>
                                <Button
                                    onClick={handleGetListingData}
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                                    disabled={!selectedDate}
                                >
                                    📊 Get Listing Data
                                </Button>
                                <p className="text-sm text-gray-400 text-center">
                                    Connect your wallet to proceed with transactions
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </main>
            <Footer />

            {/* Action Form Modal */}
            {showActionForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-sky-500/30 rounded-2xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">
                                {actionType === "rent" && "Rent Property"}
                                {actionType === "book" && "Book Property"}
                                {actionType === "unlock" && "Unlock Room"}
                                {actionType === "cancel" && "Cancel Booking"}
                            </h3>
                            <Button
                                onClick={() => {
                                    setShowActionForm(false);
                                    setActionType(null);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="date" className="text-sky-300">Select Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-black/50 border-sky-500/30 text-white mt-1"
                                />
                            </div>

                            {(actionType === "rent") && (
                                <>
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                        <h4 className="text-blue-300 font-semibold mb-2">Rent Information</h4>
                                        <p className="text-white text-sm mb-2">You will pay: <span className="text-yellow-400 font-semibold">{propertyMetadata?.rent_security || "0"} ETH</span> security deposit</p>
                                        <p className="text-white text-sm mb-2">Rent price: <span className="text-green-400 font-semibold">{propertyMetadata?.rent_price || "0"} ETH</span> (paid to owner when room is unlocked)</p>
                                        <p className="text-gray-400 text-xs">The rent price will be sent to the property owner when someone unlocks the room. You only pay the security deposit upfront.</p>
                                    </div>
                                    <div>
                                        <Label htmlFor="newRentPrice" className="text-sky-300">New Rent Price (ETH) - Optional</Label>
                                        <Input
                                            id="newRentPrice"
                                            value={newRentPrice || propertyMetadata?.rent_price || ""}
                                            onChange={(e) => setNewRentPrice(e.target.value)}
                                            placeholder={propertyMetadata?.rent_price || "0.1"}
                                            className="bg-black/50 border-sky-500/30 text-white mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="newRentSecurity" className="text-sky-300">New Rent Security (ETH) - Optional</Label>
                                        <Input
                                            id="newRentSecurity"
                                            value={newRentSecurity || propertyMetadata?.rent_security || ""}
                                            onChange={(e) => setNewRentSecurity(e.target.value)}
                                            placeholder={propertyMetadata?.rent_security || "0.05"}
                                            className="bg-black/50 border-sky-500/30 text-white mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="newBookingPrice" className="text-sky-300">New Booking Price (ETH) - Optional</Label>
                                        <Input
                                            id="newBookingPrice"
                                            value={newBookingPrice || propertyMetadata?.booking_price || ""}
                                            onChange={(e) => setNewBookingPrice(e.target.value)}
                                            placeholder={propertyMetadata?.booking_price || "0.2"}
                                            className="bg-black/50 border-sky-500/30 text-white mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="newBookingSecurity" className="text-sky-300">New Booking Security (ETH) - Optional</Label>
                                        <Input
                                            id="newBookingSecurity"
                                            value={newBookingSecurity || propertyMetadata?.booking_security || ""}
                                            onChange={(e) => setNewBookingSecurity(e.target.value)}
                                            placeholder={propertyMetadata?.booking_security || "0.1"}
                                            className="bg-black/50 border-sky-500/30 text-white mt-1"
                                        />
                                    </div>
                                </>
                            )}

                            {(actionType === "book") && (
                                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                                    <h4 className="text-green-300 font-semibold mb-2">Booking Information</h4>
                                    <p className="text-white text-sm mb-2">You will pay: <span className="text-yellow-400 font-semibold">{propertyMetadata?.booking_security || "0"} ETH</span> security deposit</p>
                                    <p className="text-white text-sm mb-2">Booking price: <span className="text-green-400 font-semibold">{propertyMetadata?.booking_price || "0"} ETH</span> (paid when room is unlocked)</p>
                                    <p className="text-gray-400 text-xs">The booking price will be paid when someone unlocks the room. You only pay the security deposit upfront.</p>
                                </div>
                            )}

                            {(actionType === "unlock") && (
                                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                                    <h4 className="text-orange-300 font-semibold mb-2">Unlock Information</h4>
                                    <p className="text-white text-sm mb-2">You will pay: <span className="text-green-400 font-semibold">{propertyMetadata?.booking_price || "0"} ETH</span> booking price</p>
                                    <p className="text-white text-sm mb-2">Rent price: <span className="text-blue-400 font-semibold">{propertyMetadata?.rent_price || "0"} ETH</span> (sent to property owner)</p>
                                    <p className="text-gray-400 text-xs">When you unlock the room, the booking price is paid and the rent price is sent to the property owner. The NFT is also transferred to you.</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={() => {
                                        if (actionType === "rent") handleRentProperty();
                                        if (actionType === "book") handleBookProperty();
                                        if (actionType === "unlock") handleUnlockRoom();
                                        if (actionType === "cancel") handleCancelBooking();
                                    }}
                                    disabled={isRenting || isBooking || isUnlocking || isCanceling}
                                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
                                >
                                    {isRenting && "Renting..."}
                                    {isBooking && "Booking..."}
                                    {isUnlocking && "Unlocking..."}
                                    {isCanceling && "Canceling..."}
                                    {!isRenting && !isBooking && !isUnlocking && !isCanceling && "Confirm"}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowActionForm(false);
                                        setActionType(null);
                                    }}
                                    variant="outline"
                                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Listing Data Display */}
            {listingData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-sky-500/30 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">Listing Information</h3>
                            <Button
                                onClick={() => setListingData(null)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <p className="text-white">{listingData.listing.rentPrice} ETH</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Rent Security</Label>
                                <p className="text-white">{listingData.listing.rentSecurity} ETH</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Booking Price</Label>
                                <p className="text-white">{listingData.listing.bookingPrice} ETH</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Booking Security</Label>
                                <p className="text-white">{listingData.listing.bookingSecurity} ETH</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Is Active</Label>
                                <div className="flex items-center space-x-2">
                                    {listingData.isActive ? (
                                        <span className="text-green-400">✓ Yes</span>
                                    ) : (
                                        <span className="text-red-400">✗ No</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Is Booked</Label>
                                <div className="flex items-center space-x-2">
                                    {listingData.bookingInfo.isBooked ? (
                                        <span className="text-green-400">✓ Yes</span>
                                    ) : (
                                        <span className="text-red-400">✗ No</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sky-300">Is Completed</Label>
                                <div className="flex items-center space-x-2">
                                    {listingData.isCompleted ? (
                                        <span className="text-green-400">✓ Yes</span>
                                    ) : (
                                        <span className="text-red-400">✗ No</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                onClick={handleGetListingData}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Refresh Data
                            </Button>
                            <Button
                                onClick={() => setListingData(null)}
                                variant="outline"
                                className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                            >
                                Close
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
