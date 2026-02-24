// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HeroPull is ERC721, Ownable {
    uint256 public mintPrice = 0.00066 ether;
    uint256 private _tokenIds;
    address public paymentReceiver = 0xa782922Ff9c54F4264FD049189eC66940f528Eb0;

    constructor() ERC721("Hero Pull", "HERO") Ownable(msg.sender) {}

    function mint() external payable {
        require(msg.value >= mintPrice, "Insufficient ETH");
        _tokenIds++;
        _safeMint(msg.sender, _tokenIds);
        payable(paymentReceiver).transfer(msg.value);
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }
}
