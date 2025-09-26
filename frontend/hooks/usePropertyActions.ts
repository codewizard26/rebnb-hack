import { useMutation } from "@tanstack/react-query";
import { ethers } from "ethers";

// Contract addresses from your deployment
const MARKETPLACE_ADDRESS = "0x1F474fe70F593E452F976F59BF2Cf990585E12FD";

// Marketplace contract ABI for the specific functions we need
const MARKETPLACE_ABI = [
    // Read functions
    {
        name: "getListing",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [
            { name: "creator", type: "address" },
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" },
            { name: "rentPrice", type: "uint256" },
            { name: "rentSecurity", type: "uint256" },
            { name: "bookingPrice", type: "uint256" },
            { name: "bookingSecurity", type: "uint256" }
        ],
    },
    {
        name: "isListingActive",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "listingBooked",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [
            { name: "receiver", type: "address" },
            { name: "booker", type: "address" },
            { name: "isBooked", type: "bool" }
        ],
    },
    {
        name: "listingCompleted",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    // Write functions
    {
        name: "rentListing",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" },
            {
                name: "updateParams", type: "tuple", components: [
                    { name: "rentPrice", type: "uint256" },
                    { name: "rentSecurity", type: "uint256" },
                    { name: "bookingPrice", type: "uint256" },
                    { name: "bookingSecurity", type: "uint256" }
                ]
            }
        ],
        outputs: [],
    },
    {
        name: "bookListing",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [],
    },
    {
        name: "unlockRoom",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [],
    },
    {
        name: "cancelBooking",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "propertyId", type: "uint256" },
            { name: "date", type: "uint256" }
        ],
        outputs: [],
    },
];

// Helper function to safely call ethereum methods
const ethereumRequest = async (method: string, params?: any[]): Promise<any> => {
    if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
    }
    return await (window.ethereum as any).request({ method, params });
};

// Helper function to create contract instance
const createContract = (address: string, abi: any) => {
    if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    return new ethers.Contract(address, abi, provider);
};

// Helper function to get signer
const getSigner = async () => {
    if (!window.ethereum) {
        throw new Error("No Ethereum provider found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    return await provider.getSigner();
};

// Helper function to send transaction
const sendTransaction = async (contract: ethers.Contract, method: string, args: any[], value?: string) => {
    const signer = await getSigner();
    const contractWithSigner = contract.connect(signer);

    const tx = await (contractWithSigner as any)[method](...args, {
        value: value ? ethers.parseEther(value) : 0
    });

    const receipt = await tx.wait();
    return receipt;
};

// Helper function to convert date to timestamp (days since epoch)
const getDateTimestamp = (dateString: string): string => {
    if (!dateString) return "0";
    return Math.floor(new Date(dateString).getTime() / 1000 / 86400).toString();
};

// Helper function to check listing status
export const checkListingStatus = async (propertyId: string, date: string) => {
    const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);
    const dateTimestamp = BigInt(getDateTimestamp(date));

    try {
        console.log("🔍 Checking listing status:");
        console.log("- Property ID:", propertyId);
        console.log("- Date:", date);
        console.log("- Date timestamp:", dateTimestamp.toString());

        const listing = await contract.getListing(BigInt(propertyId), dateTimestamp);
        const isActive = await contract.isListingActive(BigInt(propertyId), dateTimestamp);
        const isBooked = await contract.listingBooked(BigInt(propertyId), dateTimestamp);
        const isCompleted = await contract.listingCompleted(BigInt(propertyId), dateTimestamp);

        console.log("📋 Listing details:", {
            creator: listing.creator,
            propertyId: listing.propertyId.toString(),
            date: listing.date.toString(),
            rentPrice: ethers.formatEther(listing.rentPrice),
            rentSecurity: ethers.formatEther(listing.rentSecurity),
            bookingPrice: ethers.formatEther(listing.bookingPrice),
            bookingSecurity: ethers.formatEther(listing.bookingSecurity)
        });

        console.log("📊 Status:", {
            exists: listing.creator !== "0x0000000000000000000000000000000000000000",
            isActive,
            isBooked,
            isCompleted
        });

        return {
            listing,
            isActive,
            isBooked,
            isCompleted,
            exists: listing.creator !== "0x0000000000000000000000000000000000000000"
        };
    } catch (error) {
        console.error("Error checking listing status:", error);
        throw error;
    }
};

// Helper function to simulate rent transaction
export const simulateRentTransaction = async (params: {
    propertyId: string;
    date: string;
    newRentPrice: string;
    newRentSecurity: string;
    newBookingPrice: string;
    newBookingSecurity: string;
}) => {
    const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);
    const dateTimestamp = BigInt(getDateTimestamp(params.date));

    try {
        console.log("🔍 Debugging rent simulation:");
        console.log("- Property ID:", params.propertyId);
        console.log("- Date string:", params.date);
        console.log("- Date timestamp:", dateTimestamp.toString());
        console.log("- Date timestamp (days since epoch):", dateTimestamp.toString());

        // Get current listing
        const listing = await contract.getListing(BigInt(params.propertyId), dateTimestamp);
        console.log("📋 Current listing:", listing);
        console.log("- Creator:", listing.creator);
        console.log("- Property ID:", listing.propertyId.toString());
        console.log("- Date:", listing.date.toString());
        console.log("- Rent Price:", ethers.formatEther(listing.rentPrice));
        console.log("- Rent Security:", ethers.formatEther(listing.rentSecurity));

        // Check if listing exists
        if (listing.creator === "0x0000000000000000000000000000000000000000") {
            console.log("❌ Listing creator is zero address - listing does not exist");
            throw new Error(`Listing does not exist for property ID ${params.propertyId} and date ${params.date} (timestamp: ${dateTimestamp})`);
        }

        // Check if listing is active
        const isActive = await contract.isListingActive(BigInt(params.propertyId), dateTimestamp);
        console.log("Is listing active:", isActive);

        if (!isActive) {
            throw new Error("Listing is not active (may be booked, completed, or date is in the past)");
        }

        const securityAmount = ethers.formatEther(listing.rentSecurity);
        console.log("Required security amount:", securityAmount);

        // Prepare update parameters
        const updateParams = {
            rentPrice: ethers.parseEther(params.newRentPrice),
            rentSecurity: ethers.parseEther(params.newRentSecurity),
            bookingPrice: ethers.parseEther(params.newBookingPrice),
            bookingSecurity: ethers.parseEther(params.newBookingSecurity)
        };

        console.log("Update params:", updateParams);

        // Simulate the transaction
        console.log("Simulating rentListing transaction...");
        const result = await contract.rentListing.staticCall(
            BigInt(params.propertyId),
            dateTimestamp,
            updateParams,
            { value: ethers.parseEther(securityAmount) }
        );

        console.log("Transaction simulation successful!");
        return {
            success: true,
            message: "Transaction simulation passed",
            result
        };

    } catch (error: any) {
        console.error("Transaction simulation failed:", error);

        // Enhanced error reporting
        const errorInfo = {
            success: false,
            message: error.message || "Unknown error",
            reason: error.reason,
            data: error.data,
            code: error.code,
            details: {
                propertyId: params.propertyId,
                date: params.date,
                dateTimestamp: dateTimestamp.toString(),
                newRentPrice: params.newRentPrice,
                newRentSecurity: params.newRentSecurity,
                newBookingPrice: params.newBookingPrice,
                newBookingSecurity: params.newBookingSecurity
            }
        };

        // Try to decode common error patterns
        if (error.message?.includes("Listing is not active")) {
            errorInfo.message = "The listing is not available for rent (may be booked, completed, or date is in the past)";
        } else if (error.message?.includes("Incorrect rent security")) {
            errorInfo.message = "The security deposit amount is incorrect";
        } else if (error.message?.includes("Cannot rent your own listing")) {
            errorInfo.message = "You cannot rent your own listing";
        } else if (error.message?.includes("Unauthorized")) {
            errorInfo.message = "You are not authorized to perform this action";
        } else if (error.message?.includes("Transfer failed")) {
            errorInfo.message = "Token transfer failed - check if the token exists and is properly approved";
        }

        return errorInfo;
    }
};

// Hook for renting a property (re-rent)
export const useRentProperty = () => {
    return useMutation({
        mutationFn: async (params: {
            propertyId: string;
            date: string;
            newRentPrice: string;
            newRentSecurity: string;
            newBookingPrice: string;
            newBookingSecurity: string;
        }) => {
            const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);
            const dateTimestamp = BigInt(getDateTimestamp(params.date));

            // First get the current listing to know the security amount
            const listing = await contract.getListing(BigInt(params.propertyId), dateTimestamp);
            console.log("Current listing:", listing);

            // Check if listing exists (has non-zero creator)
            if (listing.creator === "0x0000000000000000000000000000000000000000") {
                throw new Error("Listing does not exist for this property and date");
            }

            // Check if listing is active
            const isActive = await contract.isListingActive(BigInt(params.propertyId), dateTimestamp);
            console.log("Is listing active:", isActive);

            if (!isActive) {
                throw new Error("Listing is not active (may be booked, completed, or date is in the past)");
            }

            const securityAmount = ethers.formatEther(listing.rentSecurity);
            console.log("Required security amount:", securityAmount);

            // Prepare update parameters for the new listing
            const updateParams = {
                rentPrice: ethers.parseEther(params.newRentPrice),
                rentSecurity: ethers.parseEther(params.newRentSecurity),
                bookingPrice: ethers.parseEther(params.newBookingPrice),
                bookingSecurity: ethers.parseEther(params.newBookingSecurity)
            };

            console.log("Update params:", updateParams);

            // First, simulate the transaction to get better error messages
            try {
                console.log("Simulating transaction...");
                await contract.rentListing.staticCall(
                    BigInt(params.propertyId),
                    dateTimestamp,
                    updateParams,
                    { value: ethers.parseEther(securityAmount) }
                );
                console.log("Transaction simulation successful!");
            } catch (simulationError: any) {
                console.error("Transaction simulation failed:", simulationError);

                // Try to decode the error for better understanding
                if (simulationError.data) {
                    console.error("Error data:", simulationError.data);
                }

                // Check for specific revert reasons
                if (simulationError.reason) {
                    console.error("Revert reason:", simulationError.reason);
                }

                // Re-throw with more context
                throw new Error(`Transaction simulation failed: ${simulationError.message || simulationError.reason || 'Unknown error'}`);
            }

            const receipt = await sendTransaction(contract, "rentListing", [
                BigInt(params.propertyId),
                dateTimestamp,
                updateParams
            ], securityAmount);

            return receipt;
        },
        onSuccess: (data) => {
            console.log("Property rented successfully:", data);
        },
        onError: (error) => {
            console.error("Failed to rent property:", error);
            throw error;
        },
    });
};

// Hook for simulating rent transaction
export const useSimulateRent = () => {
    return useMutation({
        mutationFn: simulateRentTransaction,
        onSuccess: (data) => {
            if (data.success) {
                console.log("✅ Transaction simulation successful:", data.message);
            } else {
                console.log("❌ Transaction simulation failed:", data.message);
            }
        },
        onError: (error) => {
            console.error("Simulation error:", error);
        },
    });
};

// Hook for booking a property
export const useBookProperty = () => {
    return useMutation({
        mutationFn: async (params: {
            propertyId: string;
            date: string;
        }) => {
            const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);

            // First get the current listing to know the booking security amount
            const listing = await contract.getListing(BigInt(params.propertyId), BigInt(getDateTimestamp(params.date)));
            const securityAmount = ethers.formatEther(listing.bookingSecurity);

            const receipt = await sendTransaction(contract, "bookListing", [
                BigInt(params.propertyId),
                BigInt(getDateTimestamp(params.date))
            ], securityAmount);

            return receipt;
        },
        onSuccess: (data) => {
            console.log("Property booked successfully:", data);
        },
        onError: (error) => {
            console.error("Failed to book property:", error);
            throw error;
        },
    });
};

// Hook for unlocking a room (finalizing booking)
export const useUnlockRoom = () => {
    return useMutation({
        mutationFn: async (params: {
            propertyId: string;
            date: string;
        }) => {
            const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);

            // First get the current listing to know the booking price
            const listing = await contract.getListing(BigInt(params.propertyId), BigInt(getDateTimestamp(params.date)));
            const bookingPrice = ethers.formatEther(listing.bookingPrice);

            const receipt = await sendTransaction(contract, "unlockRoom", [
                BigInt(params.propertyId),
                BigInt(getDateTimestamp(params.date))
            ], bookingPrice);

            return receipt;
        },
        onSuccess: (data) => {
            console.log("Room unlocked successfully:", data);
        },
        onError: (error) => {
            console.error("Failed to unlock room:", error);
            throw error;
        },
    });
};

// Hook for canceling a booking
export const useCancelBooking = () => {
    return useMutation({
        mutationFn: async (params: {
            propertyId: string;
            date: string;
        }) => {
            const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);

            const receipt = await sendTransaction(contract, "cancelBooking", [
                BigInt(params.propertyId),
                BigInt(getDateTimestamp(params.date))
            ]);

            return receipt;
        },
        onSuccess: (data) => {
            console.log("Booking canceled successfully:", data);
        },
        onError: (error) => {
            console.error("Failed to cancel booking:", error);
            throw error;
        },
    });
};

// Hook for reading listing data
export const useGetListingData = () => {
    return useMutation({
        mutationFn: async (params: {
            propertyId: string;
            date: string;
        }) => {
            const contract = createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI);

            const listing = await contract.getListing(BigInt(params.propertyId), BigInt(getDateTimestamp(params.date)));
            const isActive = await contract.isListingActive(BigInt(params.propertyId), BigInt(getDateTimestamp(params.date)));
            const bookingInfo = await contract.listingBooked(BigInt(params.propertyId), BigInt(getDateTimestamp(params.date)));
            const isCompleted = await contract.listingCompleted(BigInt(params.propertyId), BigInt(getDateTimestamp(params.date)));

            return {
                listing: {
                    creator: listing.creator,
                    propertyId: listing.propertyId.toString(),
                    date: listing.date.toString(),
                    rentPrice: ethers.formatEther(listing.rentPrice),
                    rentSecurity: ethers.formatEther(listing.rentSecurity),
                    bookingPrice: ethers.formatEther(listing.bookingPrice),
                    bookingSecurity: ethers.formatEther(listing.bookingSecurity)
                },
                isActive,
                bookingInfo: {
                    receiver: bookingInfo.receiver,
                    booker: bookingInfo.booker,
                    isBooked: bookingInfo.isBooked
                },
                isCompleted
            };
        },
        onError: (error) => {
            console.error("Failed to get listing data:", error);
            throw error;
        },
    });
};
