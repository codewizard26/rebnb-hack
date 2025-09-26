import { useMutation } from "@tanstack/react-query";
import axios, { Axios } from 'axios'

export interface ICreateListingMsg {
    propertyId: string;
    name: string;
    image: string;
    rentPrice: number;
    rentSecurity: number;
    bookingPrice: number;
    bookingSecurity: number;
    currentLocation: string;
}

export interface ICreatePropertyRequest {
    "propertyId": string,
    "date": string,
    "rentPrice": string,
    "rentSecurity": string,
    "bookingPrice": string,
    "bookingSecurity": string

}

export interface ICreatePropertyResponse {
    success: boolean;
    message?: string;
    data?: any;
}

// Generate a property ID greater than 1
export const generatePropertyId = (): string => {
    // Generate a random number between 2 and 999999 to ensure it's always > 1
    const min = 2;
    const max = 999999;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
};

// API function for creating property
export const createProperty = async (data: ICreatePropertyRequest): Promise<ICreatePropertyResponse> => {
    // Validate property ID is greater than 1
    const propertyIdNum = parseInt(data.propertyId);
    if (isNaN(propertyIdNum) || propertyIdNum <= 1) {
        return {
            success: false,
            message: 'Property ID must be greater than 1'
        };
    }

    try {
        const response = await axios.post('http://10.20.23.172:8080/api/v1/create-listing', {
            propertyId: data.propertyId,
            date: data.date,
            rentPrice: data.rentPrice,
            rentSecurity: data.rentSecurity,
            bookingPrice: data.bookingPrice,
            bookingSecurity: data.bookingSecurity
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Failed to create property'
        };
    }
};





// Hook for creating property
export const useCreateProperty = () => {
    return useMutation({
        mutationFn: createProperty,
        onSuccess: (data) => {
            console.log('Property created successfully:', data);
        },
        onError: (error) => {
            console.error('Failed to create property:', error);
        }
    });
};
