// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

interface ITokenizedPropertyDate is IERC721Metadata {
    function baseURI() external view returns (string memory);

    function mint(address to, uint256 date) external returns (uint256);
}
