"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Shield,
  Camera,
  Home,
  Clock
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { generatePropertyId, useCreateListing } from "@/hooks/useGenerateListing";
import { useCreatePropertyWithSigning } from "@/hooks/useExecuteProperty";
import { useAccount } from "wagmi";
import { toast } from "sonner";

// Function to post listing data to your backend

export interface TxResult {
  chainId: string;
  data: string;
  to: string;
  value: string;
}

export function ListingForm() {
  const { address } = useAccount();

  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Cleanup preview URL on component unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleCreatePropertyClick = async () => {
    try {
      // Validate required fields
      if (!image) {
        toast.error("Please select an image for your property");
        return; 
      }

      if (!name.trim()) {
        toast.error("Please enter a property name");
        return;
      }

      if (!location.trim()) {
        toast.error("Please enter a property location");
        return;
      }

      // Create blob URL for image validation
      const imageBlobUrl = URL.createObjectURL(image);
      
      try {
        // Validate text content via API
        const textValidationResponse = await fetch('/api/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'text',
            data: `Name of the listing: ${name}, location of the listing: ${location}`
          })
        });

        if (!textValidationResponse.ok) {
          throw new Error('Text validation failed');
        }

        const textValidation = await textValidationResponse.json();
        
        // Check text validation result
        if (textValidation.error || textValidation.valid === false) {
          toast.error(`Text validation failed: ${textValidation.error || 'Invalid property information'}`);
          URL.revokeObjectURL(imageBlobUrl);
          return;
        }

        // Validate image content via API
        const imageValidationResponse = await fetch('/api/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'image',
            data: imageBlobUrl,
            prompt: `Validate the image of the listing: ${name} at ${location}`
          })
        });

        if (!imageValidationResponse.ok) {
          throw new Error('Image validation failed');
        }

        const imageValidation = await imageValidationResponse.json();
        
        // Check image validation result
        if (imageValidation.error || imageValidation.valid === false) {
          toast.error(`Image validation failed: ${imageValidation.error || 'Invalid or inappropriate image'}`);
          URL.revokeObjectURL(imageBlobUrl);
          return;
        }

        // Show success message for validation
        toast.success("Property information validated successfully!");

        // Create FormData for multipart form submission
        const formData = new FormData();
        formData.append("property_name", name);
        formData.append("property_address", location);
        formData.append("description", "Property created via UI");
        formData.append("to", address || "0x0000000000000000000000000000000000000000");
        formData.append("image", image);

        const response = await fetch("https://api.rebnb.sumitdhiman.in/api/v1/create-property", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to create property");
        }

        const data = await response.json();
        const newPropertyId = data.property_id;
        setPropertyId(newPropertyId);

        console.log("🏠 Creating listing with:");
        console.log("- Property ID:", newPropertyId);
        console.log("- Date string:", availableDate);
        console.log("- Date timestamp (days since epoch):", availableDateTimestamp);
        console.log("- Rent Price:", rentPrice);
        console.log("- Rent Security:", rentSecurity);
        console.log("- Booking Price:", bookingPrice);
        console.log("- Booking Security:", bookingSecurity);

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
          handleCreate(result.data.transaction.msg);
          setPropertyId(newPropertyId);
        } else {
          console.error("Failed to create property:", result.message);
          toast.error("Failed to create property listing");
        }
      } finally {
        // Clean up blob URL
        URL.revokeObjectURL(imageBlobUrl);
      }
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("An error occurred while creating the property");
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-sky-400">
            List Your Property
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Join thousands of hosts and start earning from your property. Fill out the details below to create your listing.
        </p>
      </div>

      {/* Main Form */}
      <Card className="border-2 border-sky-500/30 shadow-2xl bg-black/40 backdrop-blur">
        <CardContent className="p-8">
          <div className="space-y-8">

            {/* Property Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-sky-500/30">
                <Building2 className="h-6 w-6 text-sky-400" />
                <h2 className="text-2xl font-semibold text-white">Property Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>Property Name</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Cozy Downtown Apartment"
                    className="h-12 bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 text-white placeholder-gray-400 rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="location" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Property Address</span>
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter full address"
                    className="h-12 bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 text-white placeholder-gray-400 rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="image" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>Property Image</span>
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="h-12 bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 text-white placeholder-gray-400 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600"
                  />
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Property preview"
                        className="w-full h-48 object-cover rounded-lg border border-sky-500/30"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="availableDate" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Available From</span>
                  </Label>
                  <Input
                    id="availableDate"
                    type="date"
                    value={availableDate}
                    onChange={(e) => {
                      setAvailableDate(e.target.value);
                      // Convert to days since epoch (same format as getDateTimestamp)
                      setAvailableDateTimestamp(e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000 / 86400).toString() : "0");
                    }}
                    className="h-12 bg-black/50 border-sky-500/30 focus:border-sky-500 focus:ring-sky-500 text-white placeholder-gray-400 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-sky-500/30">
                <DollarSign className="h-6 w-6 text-green-400" />
                <h2 className="text-2xl font-semibold text-white">Pricing & Security</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="rentPrice" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Rent Price (per day)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="rentPrice"
                      type="number"
                      value={rentPrice}
                      onChange={(e) => setRentPrice(Number(e.target.value || 0))}
                      placeholder="0"
                      className="h-12 bg-black/50 border-sky-500/30 focus:border-green-500 focus:ring-green-500 text-white placeholder-gray-400 rounded-lg pl-8"
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="rentSecurity" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Rent Security Deposit</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="rentSecurity"
                      type="number"
                      value={rentSecurity}
                      onChange={(e) => setRentSecurity(Number(e.target.value || 0))}
                      placeholder="0"
                      className="h-12 bg-black/50 border-sky-500/30 focus:border-green-500 focus:ring-green-500 text-white placeholder-gray-400 rounded-lg pl-8"
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bookingPrice" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Booking Price</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="bookingPrice"
                      type="number"
                      value={bookingPrice}
                      onChange={(e) => setBookingPrice(Number(e.target.value || 0))}
                      placeholder="0"
                      className="h-12 bg-black/50 border-sky-500/30 focus:border-green-500 focus:ring-green-500 text-white placeholder-gray-400 rounded-lg pl-8"
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bookingSecurity" className="text-sm font-medium text-sky-300 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Booking Security Deposit</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="bookingSecurity"
                      type="number"
                      value={bookingSecurity}
                      onChange={(e) => setBookingSecurity(Number(e.target.value || 0))}
                      placeholder="0"
                      className="h-12 bg-black/50 border-sky-500/30 focus:border-green-500 focus:ring-green-500 text-white placeholder-gray-400 rounded-lg pl-8"
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                onClick={handleCreatePropertyClick}
                disabled={isCreatingProperty}
                className="w-full h-14 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isCreatingProperty ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Your Property Listing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5" />
                    <span>Create Property Listing</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Success Message */}
            {txHash && (
              <div className="mt-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg backdrop-blur">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <p className="text-green-300 font-medium">Property listed successfully!</p>
                </div>
                <p className="text-green-400 text-sm mt-1">Transaction Hash: {txHash}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

}
