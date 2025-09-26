"use client";

import { useParams } from "next/navigation";
import { properties } from "@/data/properties";
import { ImageCarousel } from "@/components/image-carousel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BookingDates } from "@/components/booking-dates";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useListingReservation,
  useRentalContractWrite,
  usePYUSDBalance,
  usePYUSDAllowance,
  formatPYUSD,
  parsePYUSD,
  getReservationStateLabel,
  getReservationStateColor,
} from "@/lib/hooks/useRentalContract";
import { ReservationState } from "@/lib/contracts";
import { toast } from "sonner";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Waves,
  ChefHat,
  Snowflake,
  Tv,
  Shirt,
  TreePine,
  Utensils,
  Wallet,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";

const amenityIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  WiFi: Wifi,
  Parking: Car,
  Pool: Waves,
  Kitchen: ChefHat,
  "Air Conditioning": Snowflake,
  TV: Tv,
  Washer: Shirt,
  Garden: TreePine,
  BBQ: Utensils,
  Heating: Snowflake,
  Desk: Tv,
};

export default function PropertyDetailsPage() {
  const params = useParams<{ id: string }>();
  const property = properties.find((p) => p.id === params.id);
  const [dates, setDates] = useState<{ from?: Date; to?: Date }>({});

  // Wallet connection
  const { address, isConnected } = useAccount();

  // Contract hooks
  const { data: reservation } = useListingReservation(property?.listingId);
  const { data: pyusdBalance } = usePYUSDBalance(address);
  const { data: pyusdAllowance } = usePYUSDAllowance(address);
  const {
    approvePYUSD,
    prebook,
    finalizeBooking,
    bookDirectly,
    isPending,
    isConfirming,
    isConfirmed,
  } = useRentalContractWrite();

  if (!property) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Property Not Found</h1>
            <p className="text-muted-foreground">
              The property you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get reservation state
  const reservationState = reservation
    ? (reservation[7] as ReservationState)
    : null;
  const isPrebooked = reservationState === ReservationState.PREBOOKED;
  const isFinalized = reservationState === ReservationState.FINALIZED;
  const isRented = reservationState === ReservationState.RENTED;
  const isAvailable = !reservation || reservationState === null;

  // Calculate amounts
  const depositAmount = parsePYUSD(property.deposit.toString());
  const rentAmount = parsePYUSD(property.rent.toString());
  const totalAmount = isPrebooked && reservation ? reservation[10] : rentAmount; // totalPaid from reservation or rent

  // Check if user has sufficient balance and allowance
  const hasSufficientBalance =
    pyusdBalance && pyusdBalance >= (isPrebooked ? totalAmount : rentAmount);
  const hasAllowance =
    pyusdAllowance &&
    pyusdAllowance >= (isPrebooked ? totalAmount : rentAmount);

  const handlePrebook = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // First approve if needed
      if (!hasAllowance) {
        await approvePYUSD(depositAmount);
        return; // Wait for approval to complete
      }

      // Then prebook
      await prebook(property.listingId, depositAmount);
    } catch (error) {
      console.error("Prebook failed:", error);
    }
  };

  const handleBookDirect = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // First approve if needed
      if (!hasAllowance) {
        await approvePYUSD(rentAmount);
        return; // Wait for approval to complete
      }

      // Then book directly
      await bookDirectly(property.listingId, rentAmount);
    } catch (error) {
      console.error("Direct booking failed:", error);
    }
  };

  const handleFinalizeBooking = async () => {
    if (!isConnected || !reservation) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const bookingId = reservation[0] as bigint;
      const totalPaid = reservation[10] as bigint;

      // First approve if needed
      if (!hasAllowance) {
        await approvePYUSD(totalPaid);
        return; // Wait for approval to complete
      }

      // Then finalize booking
      await finalizeBooking(bookingId, totalPaid);
    } catch (error) {
      console.error("Finalize booking failed:", error);
    }
  };

  const renderBookingSection = () => {
    if (!isConnected) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Connect Wallet to Book
              </h3>
              <p className="text-muted-foreground mb-4">
                Connect your wallet to start booking this property
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isAvailable) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Available for Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nightly Rate</p>
                <p className="text-2xl font-bold">${property.rent} PYUSD</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deposit</p>
                <p className="text-xl font-semibold">
                  ${property.deposit} PYUSD
                </p>
              </div>
            </div>

            <Separator />

            <BookingDates value={dates} onChange={setDates} />

            <div className="space-y-3">
              <Button
                onClick={handleBookDirect}
                disabled={!hasSufficientBalance || isPending || isConfirming}
                className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
              >
                {isPending || isConfirming ? "Processing..." : "Book Directly"}
              </Button>

              <Button
                onClick={handlePrebook}
                disabled={!hasSufficientBalance || isPending || isConfirming}
                variant="outline"
                className="w-full"
              >
                {isPending || isConfirming
                  ? "Processing..."
                  : "Pre-book for Re-rent"}
              </Button>
            </div>

            {!hasSufficientBalance && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Insufficient PYUSD balance. You have{" "}
                  {formatPYUSD(pyusdBalance)} PYUSD.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (isPrebooked && reservation) {
      const brokerAddress = reservation[2] as string;
      const totalPaid = reservation[10] as bigint;

      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Pre-rented Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This property has been pre-booked by a broker and is available
                for final booking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Reserved by
                </span>
                <span className="text-sm font-mono">
                  {brokerAddress.slice(0, 6)}...{brokerAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Final Price
                </span>
                <span className="text-lg font-bold">
                  {formatPYUSD(totalPaid)} PYUSD
                </span>
              </div>
            </div>

            <Separator />

            <BookingDates value={dates} onChange={setDates} />

            <Button
              onClick={handleFinalizeBooking}
              disabled={!hasSufficientBalance || isPending || isConfirming}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white"
            >
              {isPending || isConfirming
                ? "Processing..."
                : "Book This Pre-rented Stay"}
            </Button>

            {!hasSufficientBalance && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Insufficient PYUSD balance. You need {formatPYUSD(totalPaid)}{" "}
                  PYUSD.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (isFinalized || isRented) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Badge className={getReservationStateColor(reservationState!)}>
                {getReservationStateLabel(reservationState!)}
              </Badge>
              <h3 className="text-lg font-semibold mt-4 mb-2">
                Property Unavailable
              </h3>
              <p className="text-muted-foreground">
                This property is currently booked for the selected dates.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <ImageCarousel images={property.images || [property.image]} />

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {property.city} • {property.type}
                    </span>
                  </div>
                </div>
                {reservation && (
                  <Badge
                    className={getReservationStateColor(reservationState!)}
                  >
                    {getReservationStateLabel(reservationState!)}
                  </Badge>
                )}
              </div>

              {/* Property Stats */}
              <div className="flex items-center gap-6 mb-6">
                {property.maxGuests && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>{property.maxGuests} guests</span>
                  </div>
                )}
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span>{property.bedrooms} bedrooms</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span>{property.bathrooms} bathrooms</span>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.amenities.map((amenity) => {
                        const IconComponent = amenityIcons[amenity] || Wifi;
                        return (
                          <div
                            key={amenity}
                            className="flex items-center gap-3"
                          >
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                            <span>{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Owner Information
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Owned by:</span>
                  <span className="font-mono">
                    {property.owner.ens ||
                      `${property.owner.address.slice(0, 6)}...${property.owner.address.slice(-4)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Section */}
          <div className="space-y-6">
            {renderBookingSection()}

            {/* Wallet Info */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Wallet Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      PYUSD Balance
                    </span>
                    <span className="font-mono">
                      {formatPYUSD(pyusdBalance)} PYUSD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Address
                    </span>
                    <span className="font-mono text-sm">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
