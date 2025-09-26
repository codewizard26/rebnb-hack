// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

import {ITokenizedPropertyDate} from "./ITokenizedPropertyDate.sol";
import {ITokenizedProperty} from "./ITokenizedProperty.sol";

/**
 * @title TokenizedPropertyDate
 * @notice A contract for minting tokenized property dates.
 * @dev This contract is used to mint tokenized property dates.
 */
contract TokenizedPropertyDate is ERC721, Ownable, ITokenizedPropertyDate {
    ITokenizedProperty public immutable property_token;
    uint256 public property_id;

    constructor(
        string memory name_,
        string memory symbol_,
        address property_token_,
        uint256 property_id_,
        address admin_
    ) ERC721(name_, symbol_) Ownable(admin_) {
        property_token = ITokenizedProperty(property_token_);
        property_id = property_id_;
    }

    function _baseURI() internal view override returns (string memory) {
        return property_token.baseURI();
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    function mint(address to, uint256 date) external returns (uint256) {
        require(
            msg.sender == owner() || msg.sender == property_token.ownerOf(property_id)
                || msg.sender == property_token.marketplace(),
            "Not owner or property owner or marketplace"
        );
        require(date >= block.timestamp / 86400, "Date must be in the future");
        _mint(to, date);
        return date;
    }

    function _marketplace() internal view returns (address) {
        return property_token.marketplace();
    }

    function isApprovedForAll(address owner, address operator) public view override(ERC721, IERC721) returns (bool) {
        return msg.sender == _marketplace() || ERC721.isApprovedForAll(owner, operator);
    }
}
