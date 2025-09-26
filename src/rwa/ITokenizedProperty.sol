// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

interface ITokenizedProperty is IERC721 {
    function setBaseURI(string memory newBaseURI) external;

    function baseURI() external view returns (string memory);

    function mint(address to, uint256 propertyId) external returns (uint256);

    function date_token(uint256 propertyId) external view returns (address);

    function setMarketplace(address marketplace) external;

    function marketplace() external view returns (address);
}
