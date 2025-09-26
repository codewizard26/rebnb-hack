// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

interface ITokenizedProperty is IERC721Metadata {
    function setBaseURI(string memory newBaseURI) external;

    function baseURI() external view returns (string memory);

    function mint(address to, uint256 propertyId) external returns (uint256);

    function date_token(uint256 propertyId) external view returns (address);

    function setMarketplace(address marketplace) external;

    function marketplace() external view returns (address);
}
