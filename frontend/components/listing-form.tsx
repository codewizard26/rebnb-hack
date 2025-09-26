"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useGenerateListingMsg } from "@/hooks/useGenerateListing";

// Function to post listing data to your backend
async function postListing(listing: any) {
  const res = await fetch("/api/listings", {  // Replace with your endpoint
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(listing),
  });

  if (!res.ok) {
    throw new Error("Failed to create listing");
  }

  return res.json();
}

export function ListingForm() {
  const addListing = useAppStore((s) => s.addListing);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [rentPrice, setRentPrice] = useState(0);
  const [rentSecurity, setRentSecurity] = useState(0);
  const [bookingPrice, setBookingPrice] = useState(0);
  const [bookingSecurity, setBookingSecurity] = useState(0);
  const [location, setLocation] = useState("");
  const [listingMsg,setListingMsg]=useState("");
  const [txhash,setTxhash]=useState("");
  const{mutateAsync:handleListingMsg}=useGenerateListingMsg();
  const{mutateAsync:handleStartList}=useHandleStart
  // React Query mutation



  
  const handleSubmit=async ()=>{
    try{
        const tx= await handleListingMsg({
            name:name,
            image:image,
            rentPrice:rentPrice,
            rentSecurity:rentSecurity,
            bookingPrice:bookingPrice,
            bookingSecurity:bookingSecurity,
            currentLocation:location
        })
        handleList(tx)
    }catch(error){
        console.error("error")
    }
  }

  const handleList = (listMsg:any) => {
    try {
        const hash = await handleStartList({
            msg:listMsg
        })
        setTxhash(hash);
    }catch(error){
        console.error("error",error);
    }
    


  };

  return (
    <Card className="rounded-2xl border-2 border-sky-500/30 bg-black/30 text-white shadow-md shadow-sky-500/20 backdrop-blur transition p">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-sky-400">
          Create Listing
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Form fields here (same as your original code) */}
        <div className="md:col-span-2">
          <Button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition shadow-md shadow-sky-500/40"
          >
            Create Listing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
