// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

interface ITokenizedPropertyDate is IERC721 {
    function baseURI() external view returns (string memory);

    function mint(address to, uint256 date) external returns (uint256);
}
