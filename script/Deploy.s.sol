// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2 as console} from "forge-std/console2.sol";

import {TokenizedProperty} from "../src/rwa/TokenizedProperty.sol";
import {Marketplace} from "../src/marketplace/Marketplace.sol";

contract Deploy is Script {
    function run() external {
        string memory name = vm.envOr("TOKEN_NAME", string("AirbnbProperty"));
        string memory symbol = vm.envOr("TOKEN_SYMBOL", string("ABNB"));
        string memory baseURI = vm.envOr(
            "BASE_URI",
            string("https://example.com/metadata/")
        );

        vm.startBroadcast();

        TokenizedProperty property = new TokenizedProperty(
            name,
            symbol,
            baseURI
        );
        Marketplace marketplace = new Marketplace(address(property));

        // Set marketplace on property so it can mint and manage date tokens
        property.setMarketplace(address(marketplace));

        console.log("TokenizedProperty:", address(property));
        console.log("Marketplace:", address(marketplace));

        vm.stopBroadcast();
    }
}
