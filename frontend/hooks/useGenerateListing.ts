import { useMutation } from "@tanstack/react-query";
import axios, { Axios } from 'axios'

 export interface ICreateListingMsg{
  name: string;
  image: string;
  rentPrice: number;
  rentSecurity: number;
  bookingPrice: number;
  bookingSecurity: number;
  currentLocation: string;
 }
export const useGenerateListingMsg=()=>{
    return useMutation({
        mutationFn:async(data:ICreateListingMsg)=>{
            const msg= await axios.post("",{
               name:data.name,
               image:data.image,
               rentPrice: data.rentPrice,
               rentSecurity: data.rentSecurity,
               bookingPrice: data.bookingPrice,
               bookingSecurity: data.bookingPrice,
               currentLocation: data.currentLocation
            })
        }
    })
}