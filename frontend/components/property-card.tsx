"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { motion } from "framer-motion";
import { Property } from "@/data/properties";
import {
  useListingReservation,
  getReservationStateLabel,
  getReservationStateColor,
} from "@/lib/hooks/useRentalContract";
import { ReservationState } from "@/lib/contracts";
import { MapPin, Users, Bed, Bath } from "lucide-react";

export function PropertyCard({ property }: { property: Property }) {
  // Fetch reservation status for this property
  const { data: reservation } = useListingReservation(property.listingId);

  // Determine the status to display
  const getStatusBadge = () => {
    if (!reservation || reservation[7] === undefined) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Available
        </Badge>
      );
    }

    const state = reservation[7] as ReservationState;
    return (
      <Badge className={getReservationStateColor(state)}>
        {getReservationStateLabel(state)}
      </Badge>
    );
  };

  const getBookingButton = () => {
    if (!reservation || reservation[7] === undefined) {
      return (
        <Button variant="outline" size="sm">
          Book Now
        </Button>
      );
    }

    const state = reservation[7] as ReservationState;

    if (state === ReservationState.PREBOOKED) {
      return (
        <Button variant="outline" size="sm">
          Book Pre-rented
        </Button>
      );
    } else if (
      state === ReservationState.FINALIZED ||
      state === ReservationState.RENTED
    ) {
      return (
        <Button variant="outline" size="sm" disabled>
          Booked
        </Button>
      );
    } else {
      return (
        <Button variant="outline" size="sm" disabled>
          Unavailable
        </Button>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="group overflow-hidden rounded-2xl bg-white/70 shadow-lg backdrop-blur-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] dark:bg-white/10">
        <CardHeader className="relative p-0">
          <Image
            src={property.image}
            alt={property.title}
            width={800}
            height={600}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3">{getStatusBadge()}</div>
          {reservation && reservation[7] === ReservationState.PREBOOKED && (
            <div className="absolute bottom-3 left-3">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                Pre-rented by {reservation[2]?.slice(0, 6)}...
                {reservation[2]?.slice(-4)}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <CardTitle className="line-clamp-1 text-lg">
            {property.title}
          </CardTitle>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {property.city} • {property.type}
            </span>
          </div>

          {(property.maxGuests || property.bedrooms || property.bathrooms) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {property.maxGuests && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{property.maxGuests}</span>
                </div>
              )}
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">${property.rent} PYUSD</p>
              <p className="text-sm text-muted-foreground">per night</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Deposit</p>
              <p className="font-medium">${property.deposit} PYUSD</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 p-4">
          <Link href={`/property/${property.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow hover:shadow-lg transition-all duration-300">
              View Details
            </Button>
          </Link>
          {getBookingButton()}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
