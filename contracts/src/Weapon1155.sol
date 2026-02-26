// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title Hero Pull Weapons (ERC-1155)
/// @notice Simple paid mint with configurable price + withdraw.
contract Weapon1155 is ERC1155, Ownable {
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

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "to=0");
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }
}
