// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {ITokenizedProperty} from "../rwa/ITokenizedProperty.sol";
import {ITokenizedPropertyDate} from "../rwa/ITokenizedPropertyDate.sol";

contract Marketplace is Ownable {
    struct Listing {
        address creator;
        uint256 propertyId;
        uint256 date;
        // ReRent Config
        uint256 rentPrice;
        uint256 rentSecurity;
        // Booking Config
        uint256 bookingPrice;
        uint256 bookingSecurity;
        // Split Config
        uint256 cumulativeSplitAmount;
    }

    struct ListingSplit {
        address receiver;
        uint256 amount;
    }

    struct BookingInfo {
        address receiver;
        address booker;
        bool isBooked;
    }

    // propertyId => date => Listing
    mapping(uint256 => mapping(uint256 => Listing)) public listings;
    mapping(uint256 => mapping(uint256 => ListingSplit[])) public listingSplits;
    mapping(uint256 => mapping(uint256 => BookingInfo)) public listingBooked;
    mapping(uint256 => mapping(uint256 => bool)) public listingCompleted;

    ITokenizedProperty public immutable propertyToken;
    uint256 public platformFeePPS = 100000; // Parts per million (10%)

    constructor(address _propertyToken) Ownable(msg.sender) {
        propertyToken = ITokenizedProperty(_propertyToken);
    }

    function createListing(
        uint256 propertyId,
        uint256 date,
        uint256 rentPrice,
        uint256 rentSecurity,
        uint256 bookingPrice,
        uint256 bookingSecurity
    ) external {
        require(date >= block.timestamp / 86400, "Date is in the past");
        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(propertyToken.date_token(propertyId));
        require(propertyToken.ownerOf(propertyId) == msg.sender, "Not property owner");
        dateToken.mint(msg.sender, date);

        listings[propertyId][date] = Listing({
            creator: msg.sender,
            propertyId: propertyId,
            date: date,
            rentPrice: rentPrice,
            rentSecurity: rentSecurity,
            bookingPrice: bookingPrice,
            bookingSecurity: bookingSecurity,
            cumulativeSplitAmount: 0
        });
        ListingSplit[] memory splits = new ListingSplit[](0);
        listingSplits[propertyId][date] = splits;
    }

    struct UpdateListingParams {
        uint256 rentPrice;
        uint256 rentSecurity;
        uint256 bookingPrice;
        uint256 bookingSecurity;
    }

    function updateListing(uint256 propertyId, uint256 date, UpdateListingParams memory params) external {
        _updateListing(propertyId, date, params);
    }

    function _updateListing(uint256 propertyId, uint256 date, UpdateListingParams memory params) internal {
        require(listingBooked[propertyId][date].isBooked == false, "Cannot update booked listing");

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(propertyToken.date_token(propertyId));
        require(dateToken.ownerOf(date) == msg.sender, "Unauthorized");

        Listing memory listing = listings[propertyId][date];

        listings[propertyId][date] = Listing({
            creator: msg.sender,
            propertyId: listing.propertyId,
            date: listing.date,
            rentPrice: params.rentPrice,
            rentSecurity: params.rentSecurity,
            bookingPrice: params.bookingPrice,
            bookingSecurity: params.bookingSecurity,
            cumulativeSplitAmount: listing.cumulativeSplitAmount
        });
    }

    function getListing(uint256 propertyId, uint256 date) external view returns (Listing memory) {
        return listings[propertyId][date];
    }

    function isListingActive(uint256 propertyId, uint256 date) external view returns (bool) {
        return _isListingActive(propertyId, date);
    }

    function _isListingActive(uint256 propertyId, uint256 date) internal view returns (bool) {
        if (listingBooked[propertyId][date].isBooked) {
            return false;
        }
        if (listingCompleted[propertyId][date]) {
            return false;
        }

        // Listing is active only if date is in the future
        if (date < block.timestamp / 86400) {
            return false;
        }
        return true;
    }

    function rentListing(uint256 propertyId, uint256 date, UpdateListingParams memory updateParams) external payable {
        require(_isListingActive(propertyId, date), "Listing is not active");
        Listing memory listing = listings[propertyId][date];

        require(msg.value == listing.rentSecurity, "Incorrect rent security");

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(propertyToken.date_token(propertyId));

        address token_owner = dateToken.ownerOf(date);
        require(token_owner != msg.sender, "Cannot rent your own listing");
        // Transfer date token to renter
        dateToken.transferFrom(token_owner, msg.sender, date);

        // Transfer security deposit to seller
        bool success = payable(token_owner).send(listing.rentSecurity);
        require(success, "Transfer failed");

        uint256 splitAmount = 0;
        if (listing.cumulativeSplitAmount < listing.rentPrice) {
            splitAmount = listing.rentPrice - listing.cumulativeSplitAmount;
        }
        listing.cumulativeSplitAmount += splitAmount;
        listings[propertyId][date] = listing;

        // Add the current owner to the listing splits after deducting the security deposit as its already transafered to token owner
        listingSplits[propertyId][date].push(ListingSplit({receiver: token_owner, amount: listing.rentPrice}));

        // Update listing with new rent price and security deposit
        _updateListing(propertyId, date, updateParams);
    }

    function bookListing(uint256 propertyId, uint256 date) external payable {
        require(_isListingActive(propertyId, date), "Listing is not active");
        Listing memory listing = listings[propertyId][date];
        require(listing.bookingPrice > 0, "Booking price is not available");
        require(msg.value == listing.bookingSecurity, "Incorrect booking price");

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(propertyToken.date_token(propertyId));

        address token_owner = dateToken.ownerOf(date);

        listingBooked[propertyId][date] = BookingInfo({receiver: token_owner, booker: msg.sender, isBooked: true});
        // Transfer date token to renter
        dateToken.transferFrom(token_owner, msg.sender, date);

        // Transfer security deposit to seller
        bool success = payable(token_owner).send(listing.bookingSecurity);
        require(success, "Transfer failed");
        emit SettleSecurity(token_owner, propertyId, date, listing.bookingSecurity);
    }

    function unlockRoom(uint256 propertyId, uint256 date) external payable {
        // Only allow to unlock room for the same day or future
        require(date >= block.timestamp / 86400, "Date is in the past");
        require(listingCompleted[propertyId][date] == false, "Listing is already completed");

        BookingInfo memory booking = listingBooked[propertyId][date];
        require(booking.isBooked, "Listing is not booked");
        listingCompleted[propertyId][date] = true;

        Listing memory listing = listings[propertyId][date];
        require(msg.value == listing.bookingPrice, "Incorrect booking price");

        uint256 amountToSplit = listing.bookingPrice;
        // Split the booking among all the renters. Currently is simple linear split with first renter given preference, we plan to make it more shared based split so everyone can minimize risk
        ListingSplit[] memory splits = listingSplits[propertyId][date];
        for (uint256 i = 0; i < splits.length; i++) {
            uint256 expected = splits[i].amount;
            uint256 amount = expected;
            if (amountToSplit == 0) {
                emit SettlePayment(splits[i].receiver, propertyId, date, expected, 0);
                emit SettleFee(splits[i].receiver, propertyId, date, 0);
                continue;
            }
            if (amount > amountToSplit) {
                amount = amountToSplit;
            }
            amountToSplit -= amount;
            uint256 fee = (amount * platformFeePPS) / 1000000;
            amount -= fee;
            // Transfer amount to renter
            bool success = payable(splits[i].receiver).send(amount);
            require(success, "Transfer failed");
            emit SettlePayment(splits[i].receiver, propertyId, date, expected, amount);
            // Transfer fee to owner
            success = payable(owner()).send(fee);
            require(success, "Transfer failed");
            emit SettleFee(splits[i].receiver, propertyId, date, fee);
        }
        uint256 expected_current = 0;
        if (listing.cumulativeSplitAmount < listing.bookingPrice) {
            expected_current = listing.bookingPrice - listing.cumulativeSplitAmount;
        }
        // Transfer remaining amount to last renter
        if (amountToSplit > 0) {
            uint256 fee = (amountToSplit * platformFeePPS) / 1000000;
            amountToSplit -= fee;
            // Transfer amount to renter
            bool success = payable(booking.receiver).send(amountToSplit);
            require(success, "Transfer failed");
            emit SettlePayment(booking.receiver, propertyId, date, amountToSplit);
            // Transfer fee to owner
            success = payable(owner()).send(fee);
            require(success, "Transfer failed");
            emit SettleFee(booking.receiver, propertyId, date, fee);
        } else {
            emit SettlePayment(booking.receiver, propertyId, date, 0);
            emit SettleFee(booking.receiver, propertyId, date, 0);
        }
    }

    function cancelBooking(uint256 propertyId, uint256 date) external payable {
        require(listingCompleted[propertyId][date] == false, "Listing is completed");

        BookingInfo memory booking = listingBooked[propertyId][date];
        require(booking.isBooked, "Listing is not booked");
        delete listingBooked[propertyId][date];

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(propertyToken.date_token(propertyId));
        dateToken.transferFrom(msg.sender, booking.receiver, date);
    }

    event SettlePayment(address indexed receiver, uint256 indexed propertyId, uint256 indexed date, uint256 amount);

    event SettleSecurity(address indexed receiver, uint256 indexed propertyId, uint256 indexed date, uint256 amount);

    event SettleFee(address indexed payer, uint256 indexed propertyId, uint256 indexed date, uint256 amount);
}
