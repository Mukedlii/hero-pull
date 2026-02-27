// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IHeroPullV1 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/// @title HeroPullV2
/// @notice ERC-721 with onchain stored seed per tokenId + claim-from-V1 migration.
contract HeroPullV2 is ERC721, Ownable {
    uint256 public mintPrice;
    address public paymentReceiver;
    string private base;

    // tokenId => seed
    mapping(uint256 => uint256) public seedOf;

    IHeroPullV1 public immutable v1;

    uint256 private _nextId;

    event BaseURIUpdated(string newBaseURI);
    event PaymentReceiverUpdated(address receiver);
    event MintPriceUpdated(uint256 newPriceWei);

    constructor(
        address v1Contract,
        string memory baseURI,
        address initialOwner,
        address receiver,
        uint256 priceWei
    ) ERC721("Hero Pull", "HERO") Ownable(initialOwner) {
        require(v1Contract != address(0), "v1=0");
        require(receiver != address(0), "recv=0");
        v1 = IHeroPullV1(v1Contract);
        base = baseURI;
        paymentReceiver = receiver;
        mintPrice = priceWei;
        _nextId = 1;
    }

    function _baseURI() internal view override returns (string memory) {
        return base;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        base = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setPaymentReceiver(address receiver) external onlyOwner {
        require(receiver != address(0), "recv=0");
        paymentReceiver = receiver;
        emit PaymentReceiverUpdated(receiver);
    }

    function setMintPrice(uint256 newPriceWei) external onlyOwner {
        mintPrice = newPriceWei;
        emit MintPriceUpdated(newPriceWei);
    }

    /// @notice Paid mint (new tokenId)
    function mint() external payable {
        require(msg.value >= mintPrice, "Insufficient ETH");

        uint256 tokenId = _nextId;
        _nextId += 1;

        _safeMint(msg.sender, tokenId);

        // pseudo-random seed for new mints
        seedOf[tokenId] = uint256(keccak256(abi.encodePacked("HEROPULL_V2", tokenId, msg.sender, blockhash(block.number - 1))));

        (bool ok, ) = payable(paymentReceiver).call{value: msg.value}("");
        require(ok, "pay fail");
    }

    /// @notice Claim the same tokenId in V2 if you own it in V1.
    /// @dev Free, 1:1 tokenId mapping.
    function claimFromV1(uint256 tokenId) external {
        require(_ownerOf(tokenId) == address(0), "already claimed");

        address ownerV1 = v1.ownerOf(tokenId);
        require(ownerV1 == msg.sender, "not owner v1");

        _safeMint(msg.sender, tokenId);

        // deterministic seed for migrated tokens
        seedOf[tokenId] = uint256(keccak256(abi.encodePacked("HEROPULL_V2_MIGRATE", tokenId)));

        // keep _nextId ahead
        if (tokenId >= _nextId) _nextId = tokenId + 1;
    }
}
