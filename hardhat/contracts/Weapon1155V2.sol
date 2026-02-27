// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Weapon1155V2
/// @notice Paid mint + onchain merge (burn 3 -> mint 1 of next tier).
contract Weapon1155V2 is ERC1155, ERC1155Burnable, Ownable {
    uint256 public mintPriceWei;

    event MintPriceUpdated(uint256 newPriceWei);

    constructor(string memory baseUri, address initialOwner, uint256 _mintPriceWei)
        ERC1155(baseUri)
        Ownable(initialOwner)
    {
        mintPriceWei = _mintPriceWei;
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        mintPriceWei = newPriceWei;
        emit MintPriceUpdated(newPriceWei);
    }

    /// @dev Basic mint: caller pays mintPriceWei and receives `amount` of tokenId.
    function mint(uint256 tokenId, uint256 amount) external payable {
        require(amount > 0, "amount=0");
        require(msg.value == mintPriceWei * amount, "bad value");
        _mint(msg.sender, tokenId, amount, "");
    }

    /// @notice Merge exactly 3 of `tokenId` into 1 of next tier token.
    /// @dev Token id scheme: common 1-5, rare 11-15, epic 21-25, legendary 31-35.
    function merge(uint256 tokenId) external {
        require(_isMergeable(tokenId), "not mergeable");
        // burn 3
        _burn(msg.sender, tokenId, 3);
        // mint next tier
        uint256 nextId = tokenId + 10;
        _mint(msg.sender, nextId, 1, "");
    }

    function _isMergeable(uint256 tokenId) internal pure returns (bool) {
        // merge allowed up to Epic tier
        if (tokenId >= 31) return false;
        // valid ranges
        bool common = tokenId >= 1 && tokenId <= 5;
        bool rare = tokenId >= 11 && tokenId <= 15;
        bool epic = tokenId >= 21 && tokenId <= 25;
        return common || rare || epic;
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "to=0");
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }
}
