// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct VaultEscrowParams {
    uint256 price;
    string listingId;
    address broker;
    address propertyOwner;
    uint256 date;
}

contract VaultEscrow {
    address public propertyOwner;
    address public broker;
    uint256 public price;
    string public listingId;
    uint256 public date;
    address public factoryAddress;
    bool public isDirectBookingAllowed;

    constructor(VaultEscrowParams memory params) {
        propertyOwner = params.propertyOwner;
        broker = params.broker;
        price = params.price;
        listingId = params.listingId;
        date = params.date;
        factoryAddress = msg.sender;
        isDirectBookingAllowed = true;
    }

    function disableDirectBooking() external {
        require(msg.sender == factoryAddress, "Not factory");
        isDirectBookingAllowed = false;
    }

    // // Step 1: Broker reserves with deposit
    // function reserve() external payable {
    //     require(active, "Not active");
    //     require(block.timestamp < startDate, "Booking window passed");
    //     require(broker == address(0), "Already reserved");
    //     require(msg.value == deposit, "Incorrect deposit");

    //     broker = msg.sender;

    //     // Deposit goes straight to owner
    //     payable(pseudoOwner).transfer(msg.value);

    //     emit Reserved(broker, msg.value);
    // }

    // // Step 2: Broker sets rerent price
    // function setReRent(uint256 _newPrice) external {
    //     require(allowReRent, "ReRent not allowed");
    //     require(msg.sender == broker, "Not broker");
    //     require(!reRented, "Already rerented");

    //     reRented = true;
    //     reRentPrice = _newPrice;

    //     emit ReRented(broker, _newPrice);
    // }

    // // Step 3a: Broker confirms (pays basePrice - deposit)
    // function confirmBooking() external payable {
    //     require(msg.sender == broker, "Not broker");
    //     require(!reRented, "Already rerented");
    //     require(!confirmed, "Already confirmed");
    //     require(msg.value == basePrice - deposit, "Incorrect amount");

    //     confirmed = true;
    //     active = false;

    //     payable(pseudoOwner).transfer(msg.value);

    //     emit Confirmed(broker, msg.value);
    // }

    // // Step 3b: Final renter pays rerent price
    // function takeReRent() external payable {
    //     require(active, "Not active");
    //     require(reRented, "Not rerented");
    //     require(msg.value == reRentPrice, "Incorrect price");

    //     uint256 pseudoOwnerRemaining = basePrice - deposit;
    //     uint256 brokerProfit = reRentPrice - basePrice;

    //     payable(pseudoOwner).transfer(pseudoOwnerRemaining);
    //     payable(broker).transfer(brokerProfit);

    //     active = false;

    //     emit Completed(pseudoOwner, broker, pseudoOwnerRemaining, brokerProfit);
    // }
}
