// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "../../lib/openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {ECDSA} from "../../lib/openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "../../lib/openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

import {ITokenizedProperty} from "./ITokenizedProperty.sol";

import {TokenizedPropertyDate} from "./TokenizedPropertyDate.sol";

contract TokenizedProperty is ERC721, Ownable, ITokenizedProperty {
    string private _baseTokenURI;
    address private _marketplace;
    mapping(uint256 propertyId => address date_token) public date_tokens;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI_;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    function mint(address to, uint256 propertyId) external returns (uint256) {
        require(
            msg.sender == owner() || msg.sender == _marketplace,
            "Not owner or marketplace"
        );
        _mint(to, propertyId);
        date_tokens[propertyId] = address(
            new TokenizedPropertyDate(
                name(),
                symbol(),
                address(this),
                propertyId,
                msg.sender
            )
        );
        return propertyId;
    }

    function date_token(uint256 propertyId) external view returns (address) {
        return date_tokens[propertyId];
    }

    function setMarketplace(address marketplace_) external onlyOwner {
        _marketplace = marketplace_;
    }

    function marketplace() external view returns (address) {
        return _marketplace;
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) public view override(ERC721, IERC721) returns (bool) {
        return
            msg.sender == _marketplace ||
            ERC721.isApprovedForAll(owner, operator);
    }
}
