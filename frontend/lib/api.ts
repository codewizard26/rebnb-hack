import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://10.20.23.172:8080';

// Types
export interface CreatePropertyRequest {
    to: string;
    propertyId: string;
}

export interface CreatePropertyResponse {
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

// API Functions
export const createProperty = async (data: CreatePropertyRequest): Promise<CreatePropertyResponse> => {
    // Validate property ID is greater than 1
    const propertyIdNum = parseInt(data.propertyId);
    if (isNaN(propertyIdNum) || propertyIdNum <= 1) {
        return {
            success: false,
            message: 'Property ID must be greater than 1'
        };
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/create-property`, {
            to: data.to,
            propertyId: data.propertyId
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

// Example usage function
export const exampleCreateProperty = async () => {
    const propertyId = generatePropertyId(); // Generate a valid property ID > 1

    const result = await createProperty({
        to: "0xd81252d06C67A2f3cF3B377d9Aae5d827f14f3b1",
        propertyId: propertyId
    });

    if (result.success) {
        console.log('Property created successfully:', result.data);
        return result.data;
    } else {
        console.error('Failed to create property:', result.message);
        throw new Error(result.message);
    }
};
