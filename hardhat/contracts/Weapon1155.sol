// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

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
