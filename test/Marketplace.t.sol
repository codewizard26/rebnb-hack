// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {Marketplace} from "../src/marketplace/Marketplace.sol";
import {TokenizedProperty} from "../src/rwa/TokenizedProperty.sol";
import {TokenizedPropertyDate} from "../src/rwa/TokenizedPropertyDate.sol";
import {ITokenizedProperty} from "../src/rwa/ITokenizedProperty.sol";
import {ITokenizedPropertyDate} from "../src/rwa/ITokenizedPropertyDate.sol";

import {IERC721Errors} from "../lib/openzeppelin-contracts/contracts/interfaces/draft-IERC6093.sol";

contract MarketplaceTest is Test {
    Marketplace marketplace;
    TokenizedProperty propertyToken;
    address owner = vm.randomAddress();
    address renter = vm.randomAddress();
    address booker = vm.randomAddress();
    uint256 propertyId = 1;

    function setUp() public {
        vm.label(owner, "Owner");
        vm.label(renter, "Renter");
        vm.label(booker, "Booker");
        vm.roll(1727347200);
        vm.warp(1727347200);
        vm.prank(owner);
        // Deploy property token with required constructor args
        propertyToken = new TokenizedProperty(
            "TestProperty",
            "TPROP",
            "https://base.uri/"
        );
        vm.prank(owner);
        // Deploy marketplace with property token address
        marketplace = new Marketplace(address(propertyToken));
        // Set marketplace in property token
        vm.prank(owner);
        propertyToken.setMarketplace(address(marketplace));
        // Mint a property token to owner
        vm.prank(owner);
        propertyToken.mint(owner, propertyId);
    }

    function testCreateListing() public {
        uint256 date = block.timestamp / 86400 + 1;
        vm.prank(owner);
        // ApprovListing expects 6 args
        marketplace.createListing(
            propertyId,
            date,
            1 ether, // rentPrice
            0.1 ether, // rentSecurity
            2 ether, // bookingPrice
            0.2 ether // bookingSecurity
        );
        // Add assertion for listing existence
        Marketplace.Listing memory listing = marketplace.getListing(
            propertyId,
            date
        );
        assertEq(listing.creator, owner, "Listing creator is not owner");
        assertEq(
            listing.rentPrice,
            1 ether,
            "Listing rent price is not 1 ether"
        );
        assertEq(
            listing.rentSecurity,
            0.1 ether,
            "Listing rent security is not 0.1 ether"
        );
        assertEq(
            listing.bookingPrice,
            2 ether,
            "Listing booking price is not 2 ether"
        );
        assertEq(
            listing.bookingSecurity,
            0.2 ether,
            "Listing booking security is not 0.2 ether"
        );

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(
            propertyToken.date_token(propertyId)
        );
        assertEq(
            dateToken.ownerOf(date),
            owner,
            "Date token owner is not owner"
        );
    }

    function testInvalidListingCreation() public {
        uint256 date = block.timestamp / 86400 + 1;
        vm.prank(owner);
        marketplace.createListing(
            propertyId,
            date,
            1 ether, // rentPrice
            0.1 ether, // rentSecurity
            2 ether, // bookingPrice
            0.2 ether // bookingSecurity
        );
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC721Errors.ERC721InvalidSender.selector,
                address(0)
            )
        );
        marketplace.createListing(
            propertyId,
            date,
            1 ether, // rentPrice
            0.1 ether, // rentSecurity
            2 ether, // bookingPrice
            0.2 ether // bookingSecurity
        );

        vm.prank(vm.randomAddress());
        vm.expectRevert("Not property owner");
        marketplace.createListing(
            propertyId,
            date,
            1 ether, // rentPrice
            0.1 ether, // rentSecurity
            2 ether, // bookingPrice
            0.2 ether // bookingSecurity
        );

        vm.prank(owner);
        vm.expectRevert("Date is in the past");
        marketplace.createListing(
            propertyId,
            date - 2,
            1 ether, // rentPrice
            0.1 ether, // rentSecurity
            2 ether, // bookingPrice
            0.2 ether // bookingSecurity
        );
    }

    function testRentListing() public {
        uint256 date = block.timestamp / 86400 + 1;
        uint256 rentSecurity = 0.1 ether;
        uint256 rentPrice = 1 ether;
        uint256 bookingPrice = 2 ether;
        uint256 bookingSecurity = 0.2 ether;
        vm.prank(owner);
        marketplace.createListing(
            propertyId,
            date,
            rentPrice,
            rentSecurity,
            bookingPrice,
            bookingSecurity
        );

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(
            propertyToken.date_token(propertyId)
        );
        assertEq(
            dateToken.ownerOf(date),
            owner,
            "Date token owner is not owner"
        );
        // Prepare update params
        Marketplace.UpdateListingParams memory params = Marketplace
            .UpdateListingParams({
                rentPrice: 1 ether,
                rentSecurity: 0.1 ether,
                bookingPrice: 2 ether,
                bookingSecurity: 0.2 ether
            });
        vm.deal(renter, rentSecurity);
        vm.prank(renter);
        marketplace.rentListing{value: rentSecurity}(propertyId, date, params);
        assertEq(
            dateToken.ownerOf(date),
            renter,
            "Date token owner is not renter"
        );
        assertEq(
            owner.balance,
            rentSecurity,
            "Owner balance is not rent security"
        );
    }

    function testDoubleRentShouldFail() public {
        uint256 date = block.timestamp / 86400 + 1;
        uint256 rentSecurity = 0.1 ether;
        uint256 rentPrice = 1 ether;
        uint256 bookingPrice = 2 ether;
        uint256 bookingSecurity = 0.2 ether;
        vm.prank(owner);
        marketplace.createListing(
            propertyId,
            date,
            rentPrice,
            rentSecurity,
            bookingPrice,
            bookingSecurity
        );
        Marketplace.UpdateListingParams memory params = Marketplace
            .UpdateListingParams({
                rentPrice: 1 ether,
                rentSecurity: 0.1 ether,
                bookingPrice: 2 ether,
                bookingSecurity: 0.2 ether
            });

        vm.deal(renter, rentSecurity);
        vm.prank(renter);
        marketplace.rentListing{value: rentSecurity}(propertyId, date, params);

        vm.deal(renter, 0.1 ether);
        vm.prank(renter);
        vm.expectRevert("Cannot rent your own listing");
        marketplace.rentListing{value: 0.1 ether}(propertyId, date, params);
    }

    function testBookListing() public {
        uint256 date = block.timestamp / 86400 + 1;
        vm.prank(owner);
        marketplace.createListing(
            propertyId,
            date,
            1 ether,
            0.1 ether,
            2 ether,
            0.2 ether
        );
        vm.deal(booker, 0.2 ether);
        vm.prank(booker);
        // bookListing expects 2 args
        marketplace.bookListing{value: 0.2 ether}(propertyId, date);

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(
            propertyToken.date_token(propertyId)
        );

        assertEq(
            dateToken.ownerOf(date),
            booker,
            "Date token owner is not booker"
        );
        assertEq(
            owner.balance,
            0.2 ether,
            "Owner balance is not booking security"
        );
    }

    function testBookListingAfterTwoRents() public {
        Marketplace.UpdateListingParams memory renter0params = Marketplace
            .UpdateListingParams({
                rentPrice: 1 ether,
                rentSecurity: 0.1 ether,
                bookingPrice: 2 ether,
                bookingSecurity: 0.2 ether
            });

        uint256 date = block.timestamp / 86400 + 1;
        vm.prank(owner);
        marketplace.createListing(
            propertyId,
            date,
            renter0params.rentPrice,
            renter0params.rentSecurity,
            renter0params.bookingPrice,
            renter0params.bookingSecurity
        );

        ITokenizedPropertyDate dateToken = ITokenizedPropertyDate(
            propertyToken.date_token(propertyId)
        );
        assertEq(
            dateToken.ownerOf(date),
            owner,
            "Date token owner is not owner"
        );
        _assertListing(propertyId, date, renter0params, "Renter0:");

        // First rent
        address renter1 = vm.randomAddress();
        vm.label(renter1, "Renter1");
        Marketplace.UpdateListingParams memory renter1Params = Marketplace
            .UpdateListingParams({
                rentPrice: renter0params.rentPrice + 0.1 ether,
                rentSecurity: renter0params.rentSecurity + 0.1 ether,
                bookingPrice: renter0params.bookingPrice + 0.1 ether,
                bookingSecurity: renter0params.bookingSecurity + 0.1 ether
            });
        vm.deal(renter1, renter0params.rentSecurity);
        vm.prank(renter1);
        marketplace.rentListing{value: renter0params.rentSecurity}(
            propertyId,
            date,
            renter1Params
        );

        assertEq(
            owner.balance,
            renter0params.rentSecurity,
            "Owner balance is not rent security"
        );
        assertEq(
            dateToken.ownerOf(date),
            renter1,
            "Date token owner is not renter1"
        );
        _assertListing(propertyId, date, renter1Params, "Renter1:");

        // Second rent
        address renter2 = vm.randomAddress();
        vm.label(renter2, "Renter2");
        Marketplace.UpdateListingParams memory renter2Params = Marketplace
            .UpdateListingParams({
                rentPrice: renter1Params.rentPrice + 0.2 ether,
                rentSecurity: renter1Params.rentSecurity + 0.2 ether,
                bookingPrice: renter1Params.bookingPrice + 0.2 ether,
                bookingSecurity: renter1Params.bookingSecurity + 0.2 ether
            });
        vm.deal(renter2, renter1Params.rentSecurity);
        vm.prank(renter2);
        marketplace.rentListing{value: renter1Params.rentSecurity}(
            propertyId,
            date,
            renter2Params
        );

        assertEq(
            renter1.balance,
            renter1Params.rentSecurity,
            "Renter1 balance is not rent security"
        );

        assertEq(
            dateToken.ownerOf(date),
            renter2,
            "Date token owner is not renter2"
        );
        _assertListing(propertyId, date, renter2Params, "Renter2:");

        // Try to book after 2 rents
        vm.deal(booker, renter2Params.bookingSecurity);
        vm.prank(booker);
        marketplace.bookListing{value: renter2Params.bookingSecurity}(
            propertyId,
            date
        );

        assertEq(
            renter2.balance,
            renter2Params.bookingSecurity,
            "Renter2 balance is not rent security"
        );

        vm.deal(booker, renter2Params.bookingPrice);
        vm.prank(booker);
        marketplace.unlockRoom{value: renter2Params.bookingPrice}(
            propertyId,
            date
        );
    }

    function _assertListing(
        uint256 propertyId_,
        uint256 date_,
        Marketplace.UpdateListingParams memory params,
        string memory errorPrefix
    ) internal view {
        Marketplace.Listing memory listing = marketplace.getListing(
            propertyId_,
            date_
        );
        assertEq(
            listing.rentPrice,
            params.rentPrice,
            string.concat(
                errorPrefix,
                "Listing rent price is not params.rentPrice"
            )
        );
        assertEq(
            listing.rentSecurity,
            params.rentSecurity,
            string.concat(
                errorPrefix,
                "Listing rent security is not params.rentSecurity"
            )
        );
        assertEq(
            listing.bookingPrice,
            params.bookingPrice,
            string.concat(
                errorPrefix,
                "Listing booking price is not params.bookingPrice"
            )
        );
        assertEq(
            listing.bookingSecurity,
            params.bookingSecurity,
            string.concat(
                errorPrefix,
                "Listing booking security is not params.bookingSecurity"
            )
        );
    }
}
