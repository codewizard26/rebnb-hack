// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./VaultEscrow.sol";

contract ListingContract {
    using Strings for *;

    struct Listing {
        uint256 propertyId;
        uint256 reRentId;
        uint256 price;
        uint256 securityDeposit;
        uint256 bookingDate;
        address owner;
    }

    struct BookingInfo {
        address vault;
        address broker;
    }

    // propertyId : bookingDate => list of vaults
    mapping(string => uint256) public propertyToLatestReRentId;

    mapping(string => Listing) public propertyListing;
    mapping(uint256 => string[]) public propertyListings;

    // propertyId:bookingDate:reRentId => vault
    mapping(string => BookingInfo) public propertyBooking;

    event VaultCreated(
        address vault,
        uint256 indexed propertyId,
        address indexed pseudoOwner,
        uint256 basePrice,
        uint256 deposit,
        uint256 bookingDate,
        uint256 reRentId
    );

    // // can take multiple vaults at once
    //     function createVaults(
    //         CreateVaultParams[] memory params
    //     ) public  {
    //         for (uint256 i = 0; i < params.length; i++) {
    //             createVault(params[i]);
    //         }
    //     }

    struct CreateListingParams {
        uint256 propertyId;
        uint256 price;
        uint256 securityDeposit;
        uint256 bookingDate;
    }

    function createListing(CreateListingParams memory params) public {
        require(
            params.bookingDate > block.timestamp,
            "Booking date is in the past"
        );
        uint256 normalizedBookingDate = params.bookingDate / 86400;
        string memory listingDateId = string.concat(
            params.propertyId.toString(),
            ":",
            normalizedBookingDate.toString()
        );

        uint256 latestReRentId = propertyToLatestReRentId[listingDateId];
        if (latestReRentId != 0) {
            string memory prevListingId = string.concat(
                listingDateId,
                ":",
                latestReRentId.toString()
            );
            BookingInfo memory booking = propertyBooking[prevListingId];
            VaultEscrow(booking.vault).disableDirectBooking();
        }
        latestReRentId += 1;
        propertyToLatestReRentId[listingDateId] = latestReRentId;
        string memory listingId = string.concat(
            listingDateId,
            ":",
            latestReRentId.toString()
        );
        propertyListing[listingId] = Listing({
            propertyId: params.propertyId,
            reRentId: latestReRentId,
            price: params.price,
            securityDeposit: params.securityDeposit,
            bookingDate: params.bookingDate,
            owner: msg.sender
        });
        propertyListings[params.propertyId].push(listingId);
    }

    // buy listing

    function buyListing(string memory listingId) public payable {
        Listing memory listing = propertyListing[listingId];

        require(listing.owner != address(0), "Listing does not exist");
        uint256 currDate = block.timestamp / 86400;
        require(currDate <= listing.bookingDate, "Listing is not available");
        require(msg.value == listing.securityDeposit, "Insufficient deposit");

        BookingInfo memory booking = propertyBooking[listingId];
        require(booking.broker == address(0), "Listing already booked");

        booking.broker = msg.sender;
        VaultEscrow vault = new VaultEscrow(
            VaultEscrowParams({
                propertyOwner: listing.owner,
                broker: msg.sender,
                price: listing.price - listing.securityDeposit,
                listingId: listingId,
                date: listing.bookingDate
            })
        );
        booking.vault = address(vault);
        propertyBooking[listingId] = booking;
    }
}
