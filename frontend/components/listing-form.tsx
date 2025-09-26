"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { generatePropertyId, useCreateListing } from "@/hooks/useGenerateListing";
import { useCreatePropertyWithSigning } from "@/hooks/useExecuteProperty";

// Function to post listing data to your backend

export interface TxResult {
  chainId: string;
  data: string;
  to: string;
  value: string;
}

export function ListingForm() {


  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [rentPrice, setRentPrice] = useState(0);
  const [rentSecurity, setRentSecurity] = useState(0);
  const [bookingPrice, setBookingPrice] = useState(0);
  const [bookingSecurity, setBookingSecurity] = useState(0);
  const [location, setLocation] = useState("");
  const [listingMsg, setListingMsg] = useState("");
  const [txhash, setTxhash] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const { mutateAsync: handleCreatePropertyForSigning } = useCreatePropertyWithSigning()
  const { mutateAsync: handleCreateListing, isPending: isCreatingProperty } = useCreateListing();
  const [txHash, setTxHash] = useState("");
  const [availableDate, setAvailableDate] = useState<string>("");
  const [availableDateTimestamp, setAvailableDateTimestamp] = useState<string>("0");
  // const{mutateAsync:handleStartList}=useHandleStartListing()
  // React Query mutation


  const handleCreatePropertyClick = async () => {
    try {
      // Generate a property ID greater than 1

      const response = await fetch("http://10.20.23.172:8080/api/v1/create-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_name: name,
          property_address: location,
          description: "Property created via UI", // You can customize this or add a description field
          to: "0xd81252d06C67A2f3cF3B377d9Aae5d827f14f3b1", // You may want to make this dynamic
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create property");
      }

      const data = await response.json();
      const newPropertyId = data.property_id;
      setPropertyId(newPropertyId); // Store the property_id in state for later use


      const result = await handleCreateListing({
        propertyId: newPropertyId,
        date: availableDateTimestamp,
        rentPrice: rentPrice.toString(),
        rentSecurity: rentSecurity.toString(),
        bookingPrice: bookingPrice.toString(),
        bookingSecurity: bookingSecurity.toString()
      });

      if (result.success) {
        console.log("Property created successfully:", result.data);
        handleCreate(result.data.msg);
        setPropertyId(newPropertyId); // Set the generated property ID for use in listing
      } else {
        console.error("Failed to create property:", result.message);
      }
    } catch (error) {
      console.error("Error creating property:", error);
    }
  }

  const handleCreate = async (swapMsg: TxResult) => {
    try {
      const hash = await handleCreatePropertyForSigning({
        msg: swapMsg,
      });
      setTxHash(hash);


    } catch (error) {
      console.error("Swap failed:", error);
    }
  };


  // const handleSubmit = async () => {


  //   // need id here
  //   const propertyId = ""

  //   try {
  //     const tx = await handleListingMsg({
  //       propertyId: Math.random().toString(),
  //       name: name,
  //       image: image,
  //       rentPrice: rentPrice,
  //       rentSecurity: rentSecurity,
  //       bookingPrice: bookingPrice,
  //       bookingSecurity: bookingSecurity,
  //       currentLocation: location
  //     })

  //     // handleList(tx)
  //   } catch (error) {
  //     console.error("error")
  //   }
  // }

  // const handleList = async (listMsg:any) => {
  //   try {
  //       const hash = await handleStartList({
  //           msg:listMsg
  //       })
  //       setTxhash(hash);
  //   }catch(error){
  //       console.error("error",error);
  //   }



  // };

  return (
    <Card className="rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white shadow-md shadow-sky-500/20 backdrop-blur transition hover:bg-sky-500/20 hover:border-sky-500 p-4">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-sky-400">
          Create Listing
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="availableDate">Available Date</Label>
          <Input
            id="availableDate"
            type="date"
            value={availableDate}
            onChange={(e) => {
              setAvailableDate(e.target.value);
              setAvailableDateTimestamp(e.target.value ? new Date(e.target.value).getTime().toString() : "0");
            }}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rentPrice">Rent Price</Label>
          <Input
            id="rentPrice"
            type="number"
            value={rentPrice}
            onChange={(e) => setRentPrice(Number(e.target.value || 0))}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rentSecurity">Rent Security</Label>
          <Input
            id="rentSecurity"
            type="number"
            value={rentSecurity}
            onChange={(e) => setRentSecurity(Number(e.target.value || 0))}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bookingPrice">Booking Price</Label>
          <Input
            id="bookingPrice"
            type="number"
            value={bookingPrice}
            onChange={(e) => setBookingPrice(Number(e.target.value || 0))}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bookingSecurity">Booking Security</Label>
          <Input
            id="bookingSecurity"
            type="number"
            value={bookingSecurity}
            onChange={(e) => setBookingSecurity(Number(e.target.value || 0))}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="location">Current Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-xl bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 transition"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Button
            onClick={handleCreatePropertyClick}
            disabled={isCreatingProperty}
            className="w-full rounded-xl bg-green-600 text-white hover:bg-green-500 transition shadow-md shadow-green-500/40"
          >
            {isCreatingProperty ? "Creating Property..." : "Create Property"}
          </Button>

        </div>
      </CardContent>
    </Card>
  );

}
