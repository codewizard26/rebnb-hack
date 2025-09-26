"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";
import { properties } from "@/data/properties";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import {
  formatPYUSD,
  usePYUSDBalance,
  useRentalContractWrite,
  getReservationStateLabel,
  getReservationStateColor,
} from "@/lib/hooks/useRentalContract";
import { ReservationState } from "@/lib/contracts";
import {
  Wallet,
  Home,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  TrendingUp,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// Mock data for demonstration - in a real app, this would come from blockchain events/queries
const mockBookings = [
  {
    id: "1",
    bookingId: 1n,
    listingId: 1n,
    propertyId: "p1",
    state: ReservationState.FINALIZED,
    userRole: "renter" as const,
    amount: 180,
    totalPaid: 200,
    checkIn: Date.now() + 86400000, // tomorrow
    checkOut: Date.now() + 259200000, // 3 days from now
    createdAt: Date.now() - 3600000, // 1 hour ago
    canDispute: true,
  },
  {
    id: "2",
    bookingId: 2n,
    listingId: 2n,
    propertyId: "p2",
    state: ReservationState.PREBOOKED,
    userRole: "broker" as const,
    amount: 500,
    deposit: 500,
    expiresAt: Date.now() + 604800000, // 1 week from now
    createdAt: Date.now() - 7200000, // 2 hours ago
    potentialProfit: 100,
  },
];

const mockOwnerBookings = [
  {
    id: "3",
    bookingId: 3n,
    listingId: 3n,
    propertyId: "p3",
    state: ReservationState.RENTED,
    renterAddress: "0x1234567890123456789012345678901234567890",
    amount: 95,
    checkIn: Date.now() - 86400000, // yesterday
    checkOut: Date.now() + 172800000, // 2 days from now
    earnings: 85.5, // after fees
  },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: pyusdBalance } = usePYUSDBalance(address);
  const { raiseDispute, isPending } = useRentalContractWrite();
  const { role, setRole } = useAppStore();

  const [activeTab, setActiveTab] = useState("trips");

  // Filter bookings by user role
  const myTrips = mockBookings.filter((b) => b.userRole === "renter");
  const myPreBookings = mockBookings.filter((b) => b.userRole === "broker");
  const myProperties = properties.filter(
    (p) => address && p.owner.address.toLowerCase() === address.toLowerCase()
  );

  const handleRaiseDispute = async (bookingId: bigint) => {
    try {
      await raiseDispute(bookingId);
      toast.success("Dispute raised successfully");
    } catch (error) {
      console.error("Failed to raise dispute:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Wallet className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <h1 className="text-2xl font-semibold mb-4">
                Connect Your Wallet
              </h1>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to access your dashboard and manage your
                bookings.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your bookings, properties, and earnings
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">PYUSD Balance</p>
              <p className="text-2xl font-bold">
                {formatPYUSD(pyusdBalance)} PYUSD
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Trips
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        myTrips.filter(
                          (t) =>
                            t.state === ReservationState.FINALIZED ||
                            t.state === ReservationState.RENTED
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pre-bookings
                    </p>
                    <p className="text-2xl font-bold">{myPreBookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Home className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      My Properties
                    </p>
                    <p className="text-2xl font-bold">{myProperties.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold">
                      {mockOwnerBookings
                        .reduce((sum, b) => sum + b.earnings, 0)
                        .toFixed(1)}{" "}
                      PYUSD
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trips" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                My Trips
              </TabsTrigger>
              <TabsTrigger
                value="prebookings"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Pre-bookings
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                My Properties
              </TabsTrigger>
            </TabsList>

            {/* My Trips Tab */}
            <TabsContent value="trips" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Trips</h2>
                <Link href="/">
                  <Button>Book New Trip</Button>
                </Link>
              </div>

              {myTrips.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start exploring and book your first property!
                    </p>
                    <Link href="/">
                      <Button>Browse Properties</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {myTrips.map((trip) => {
                    const property = properties.find(
                      (p) => p.id === trip.propertyId
                    );
                    if (!property) return null;

                    return (
                      <Card key={trip.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-4">
                              <img
                                src={property.image}
                                alt={property.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {property.title}
                                </h3>
                                <p className="text-muted-foreground">
                                  {property.city}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    className={getReservationStateColor(
                                      trip.state
                                    )}
                                  >
                                    {getReservationStateLabel(trip.state)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Total Paid
                              </p>
                              <p className="text-lg font-semibold">
                                {trip.totalPaid} PYUSD
                              </p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Check-in</p>
                              <p className="font-medium">
                                {trip.checkIn
                                  ? new Date(trip.checkIn).toLocaleDateString()
                                  : "TBD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Check-out</p>
                              <p className="font-medium">
                                {trip.checkOut
                                  ? new Date(trip.checkOut).toLocaleDateString()
                                  : "TBD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Booking ID
                              </p>
                              <p className="font-mono text-xs">
                                {trip.bookingId.toString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/property/${property.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              {trip.canDispute && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleRaiseDispute(trip.bookingId)
                                  }
                                  disabled={isPending}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Dispute
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Pre-bookings Tab */}
            <TabsContent value="prebookings" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Pre-bookings</h2>
                <Link href="/">
                  <Button>Find Properties to Pre-book</Button>
                </Link>
              </div>

              {myPreBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No pre-bookings yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Pre-book properties to earn broker fees when they&apos;re
                      rented!
                    </p>
                    <Link href="/">
                      <Button>Start Pre-booking</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {myPreBookings.map((prebooking) => {
                    const property = properties.find(
                      (p) => p.id === prebooking.propertyId
                    );
                    if (!property) return null;

                    return (
                      <Card key={prebooking.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-4">
                              <img
                                src={property.image}
                                alt={property.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {property.title}
                                </h3>
                                <p className="text-muted-foreground">
                                  {property.city}
                                </p>
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mt-2">
                                  Pre-booked
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Deposit Paid
                              </p>
                              <p className="text-lg font-semibold">
                                {prebooking.deposit} PYUSD
                              </p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Expires</p>
                              <p className="font-medium">
                                {prebooking.expiresAt
                                  ? new Date(
                                      prebooking.expiresAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Potential Profit
                              </p>
                              <p className="font-medium text-green-600">
                                +{prebooking.potentialProfit} PYUSD
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              <p className="font-medium">Waiting for renter</p>
                            </div>
                            <div>
                              <Link href={`/rerent/${property.id}`}>
                                <Button size="sm">
                                  <Users className="h-4 w-4 mr-1" />
                                  Market to Renters
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* My Properties Tab */}
            <TabsContent value="properties" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Properties</h2>
                <Link href="/list">
                  <Button>List New Property</Button>
                </Link>
              </div>

              {myProperties.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Home className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No properties listed
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      List your first property and start earning rental income!
                    </p>
                    <Link href="/list">
                      <Button>List Property</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {myProperties.map((property) => {
                    const ownerBooking = mockOwnerBookings.find(
                      (b) => b.propertyId === property.id
                    );

                    return (
                      <Card key={property.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex gap-4">
                              <img
                                src={property.image}
                                alt={property.title}
                                className="w-20 h-20 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {property.title}
                                </h3>
                                <p className="text-muted-foreground">
                                  {property.city}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  ${property.rent} PYUSD per night
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Total Earnings
                              </p>
                              <p className="text-lg font-semibold">
                                {ownerBooking?.earnings || 0} PYUSD
                              </p>
                            </div>
                          </div>

                          {ownerBooking && (
                            <>
                              <Separator className="my-4" />
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Current Guest
                                  </p>
                                  <p className="font-mono text-xs">
                                    {ownerBooking.renterAddress.slice(0, 6)}...
                                    {ownerBooking.renterAddress.slice(-4)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Check-out
                                  </p>
                                  <p className="font-medium">
                                    {new Date(
                                      ownerBooking.checkOut
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Status
                                  </p>
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Occupied
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Link href={`/property/${property.id}`}>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleRaiseDispute(ownerBooking.bookingId)
                                    }
                                    disabled={isPending}
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Dispute
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}

                          {!ownerBooking && (
                            <>
                              <Separator className="my-4" />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Available for booking
                                </div>
                                <Link href={`/property/${property.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Listing
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
