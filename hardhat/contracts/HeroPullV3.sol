// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IHeroPullV1 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IHeroPullV2 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function seedOf(uint256 tokenId) external view returns (uint256);
}

/// @title HeroPullV3
/// @notice ERC-721 with onchain seed + deterministic tier + merge (burn 3 -> mint 1 next tier).
contract HeroPullV3 is ERC721, ERC721Burnable, Ownable {
    uint256 public mintPrice;
    address public paymentReceiver;
    string private base;

    // tokenId => seed
    mapping(uint256 => uint256) public seedOf;

    // tokenId => override tier (0..3), only set for merged tokens
    mapping(uint256 => uint8) private _tierOverride;
    mapping(uint256 => bool) private _hasTierOverride;

    IHeroPullV1 public immutable v1;
    IHeroPullV2 public immutable v2;

    uint256 private _nextId;

    event BaseURIUpdated(string newBaseURI);
    event PaymentReceiverUpdated(address receiver);
    event MintPriceUpdated(uint256 newPriceWei);
    event Merged(address indexed owner, uint256[3] burned, uint256 minted, uint8 newTier);

    constructor(
        address v1Contract,
        address v2Contract,
        string memory baseURI,
        address initialOwner,
        address receiver,
        uint256 priceWei
    ) ERC721("Hero Pull", "HERO") Ownable(initialOwner) {
        require(v1Contract != address(0), "v1=0");
        require(v2Contract != address(0), "v2=0");
        require(receiver != address(0), "recv=0");
        v1 = IHeroPullV1(v1Contract);
        v2 = IHeroPullV2(v2Contract);
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

    function mint() external payable {
        require(msg.value >= mintPrice, "Insufficient ETH");

        uint256 tokenId = _nextId;
        _nextId += 1;

        _safeMint(msg.sender, tokenId);

        seedOf[tokenId] = uint256(keccak256(abi.encodePacked("HEROPULL_V3", tokenId, msg.sender, blockhash(block.number - 1))));

        (bool ok, ) = payable(paymentReceiver).call{value: msg.value}("");
        require(ok, "pay fail");
    }

    /// @notice Claim same tokenId into V3 if you own it in V1.
    /// @dev Sets a deterministic seed (since V1 doesn't expose it).
    function claimFromV1(uint256 tokenId) external {
        require(_ownerOf(tokenId) == address(0), "already claimed");
        address ownerV1 = v1.ownerOf(tokenId);
        require(ownerV1 == msg.sender, "not owner v1");

        _safeMint(msg.sender, tokenId);
        seedOf[tokenId] = uint256(keccak256(abi.encodePacked("HEROPULL_V3_MIGRATE_V1", tokenId)));

        if (tokenId >= _nextId) _nextId = tokenId + 1;
    }

    /// @notice Claim same tokenId into V3 if you own it in V2.
    /// @dev Copies the exact V2 seed so metadata stays consistent.
    function claimFromV2(uint256 tokenId) external {
        require(_ownerOf(tokenId) == address(0), "already claimed");
        address ownerV2 = v2.ownerOf(tokenId);
        require(ownerV2 == msg.sender, "not owner v2");

        _safeMint(msg.sender, tokenId);
        seedOf[tokenId] = v2.seedOf(tokenId);

        if (tokenId >= _nextId) _nextId = tokenId + 1;
    }

    /// @notice Tier enum: 0 Common, 1 Rare, 2 Epic, 3 Legendary
    function tierOf(uint256 tokenId) public view returns (uint8) {
        if (_hasTierOverride[tokenId]) return _tierOverride[tokenId];
        return _tierFromSeed(seedOf[tokenId]);
    }

    /// @notice Merge 3 tokens of the same tier into 1 token of the next tier.
    /// @dev Burns the 3 input tokenIds and mints a fresh tokenId.
    function merge(uint256[3] calldata tokenIds) external {
        uint8 t0 = _requireOwnedAndGetTier(msg.sender, tokenIds[0]);
        uint8 t1 = _requireOwnedAndGetTier(msg.sender, tokenIds[1]);
        uint8 t2 = _requireOwnedAndGetTier(msg.sender, tokenIds[2]);

        require(t0 == t1 && t1 == t2, "tiers mismatch");
        require(t0 < 3, "legendary cant merge");

        // Burn 3
        _burn(tokenIds[0]);
        _burn(tokenIds[1]);
        _burn(tokenIds[2]);

        // Mint 1 next tier
        uint256 newId = _nextId;
        _nextId += 1;
        _safeMint(msg.sender, newId);

        seedOf[newId] = uint256(keccak256(abi.encodePacked("HEROPULL_V3_MERGE", newId, msg.sender, blockhash(block.number - 1))));

        uint8 newTier = t0 + 1;
        _tierOverride[newId] = newTier;
        _hasTierOverride[newId] = true;

        emit Merged(msg.sender, tokenIds, newId, newTier);
    }

    function _requireOwnedAndGetTier(address owner, uint256 tokenId) internal view returns (uint8) {
        require(_ownerOf(tokenId) == owner, "not owner");
        uint256 s = seedOf[tokenId];
        require(s != 0, "no seed");
        return tierOf(tokenId);
    }

    function _tierFromSeed(uint256 seed) internal pure returns (uint8) {
        // 60/25/10/5 using r in [0..9999]
        uint256 r = seed % 10000;
        if (r < 6000) return 0; // Common
        if (r < 8500) return 1; // Rare
        if (r < 9500) return 2; // Epic
        return 3; // Legendary
    }
}
