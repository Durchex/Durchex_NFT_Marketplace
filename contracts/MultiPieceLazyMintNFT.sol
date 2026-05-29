// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title MultiPieceLazyMintNFT
 * @dev Lazy minting implementation that supports multi-buyer, multi-piece listings.
 *
 * Key idea:
 * - One signed voucher (listing) per NFT, re-usable until maxSupply is reached.
 * - No creator-wide nonce, no per-signature "already used" flag.
 * - Contract tracks how many pieces have been minted per listingId.
 *
 * The off-chain system (backend + DB) is responsible for:
 * - Tracking remainingPieces per listing
 * - Tracking how many pieces each wallet owns
 * - Driving marketplace visibility & trading
 *
 * This contract is responsible only for:
 * - Minting ERC-721 tokens to buyers
 * - Splitting primary sale proceeds between creator and platform
 * - Reporting royalty info (EIP-2981) so secondary marketplaces honor it
 */
contract MultiPieceLazyMintNFT is ERC721URIStorage, Ownable, IERC2981 {
    using ECDSA for bytes32;

    struct ListingConfig {
        address creator;
        uint96 royaltyBps;      // e.g. 1000 = 10%
        uint96 maxSupply;       // total pieces allowed
        uint96 pricePerPiece;   // in wei
    }

    // listingId => pieces minted so far
    mapping(bytes32 => uint96) public mintedSupply;

    // Optional: listingId => config (for indexing / analytics)
    mapping(bytes32 => ListingConfig) public listings;

    // Per-token royalty info, captured at mint time so secondary sales can read
    // EIP-2981 royaltyInfo even after the listing is fully redeemed.
    struct TokenRoyalty {
        address receiver;       // creator wallet that gets the royalty
        uint96 bps;             // basis points (max 5000 = 50%)
    }
    mapping(uint256 => TokenRoyalty) public tokenRoyalty;

    uint256 private _nextTokenId;

    address payable public platformFeeReceiver;
    uint96 public platformFeeBps; // e.g. 250 = 2.5% (basis points)

    event ListingMinted(
        bytes32 indexed listingId,
        address indexed creator,
        address indexed buyer,
        uint256 firstTokenId,
        uint96 quantity,
        string uri,
        uint96 pricePerPiece
    );

    constructor(address payable _platformFeeReceiver, uint96 _platformFeeBps)
        ERC721("DurchexMultiLazyNFT", "DUR-MP")
    {
        platformFeeReceiver = _platformFeeReceiver;
        platformFeeBps = _platformFeeBps; // 250 = 2.5%
    }

    function setPlatformFee(address payable receiver, uint96 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Fee too high"); // max 10%
        platformFeeReceiver = receiver;
        platformFeeBps = feeBps;
    }

    /**
     * @dev Compute listing id from immutable listing parameters.
     * MUST match frontend/backend when constructing the voucher.
     */
    function getListingId(
        address creator,
        string memory uri,
        uint256 royaltyBps,
        uint256 pricePerPieceWei,
        uint256 maxSupply
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(creator, uri, royaltyBps, pricePerPieceWei, maxSupply));
    }

    /**
     * @dev Message hash creator signs off-chain to authorize a listing.
     */
    function getListingMessageHash(
        address creator,
        string memory uri,
        uint256 royaltyBps,
        uint256 pricePerPieceWei,
        uint256 maxSupply
    ) public pure returns (bytes32) {
        bytes32 listingId = getListingId(creator, uri, royaltyBps, pricePerPieceWei, maxSupply);
        return keccak256(abi.encodePacked(listingId));
    }

    function _verifyListingSignature(
        address creator,
        string memory uri,
        uint256 royaltyBps,
        uint256 pricePerPieceWei,
        uint256 maxSupply,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 msgHash = getListingMessageHash(creator, uri, royaltyBps, pricePerPieceWei, maxSupply);
        bytes32 ethSigned = msgHash.toEthSignedMessageHash();
        address signer = ethSigned.recover(signature);
        return signer == creator;
    }

    /**
     * @dev Buyer mints `quantity` pieces from a listing. Creator signed the listing once.
     * No per-call nonce; contract enforces total minted <= maxSupply.
     */
    function redeemListing(
        address creator,
        string memory uri,
        uint256 royaltyBps,
        uint256 pricePerPieceWei,
        uint256 maxSupply,
        uint96 quantity,
        bytes memory signature
    ) external payable returns (uint256 firstTokenId) {
        require(quantity >= 1, "Quantity must be >= 1");
        require(royaltyBps <= 5000, "Royalty too high"); // max 50%

        // Verify creator's signature on listing params
        require(
            _verifyListingSignature(creator, uri, royaltyBps, pricePerPieceWei, maxSupply, signature),
            "Invalid listing signature"
        );

        bytes32 listingId = getListingId(creator, uri, royaltyBps, pricePerPieceWei, maxSupply);

        uint96 mintedSoFar = mintedSupply[listingId];
        require(mintedSoFar + quantity <= maxSupply, "Sold out");

        uint256 totalPrice = uint256(pricePerPieceWei) * uint256(quantity);
        require(msg.value >= totalPrice, "Insufficient value");

        // Store listing config on first mint (optional, for indexing)
        if (mintedSoFar == 0) {
            listings[listingId] = ListingConfig({
                creator: creator,
                royaltyBps: uint96(royaltyBps),
                maxSupply: uint96(maxSupply),
                pricePerPiece: uint96(pricePerPieceWei)
            });
        }

        // mint NFTs and record per-token royalty so secondary marketplaces
        // honor EIP-2981 even after the listing is fully redeemed.
        firstTokenId = _nextTokenId;
        for (uint96 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            _mint(msg.sender, tokenId);
            _setTokenURI(tokenId, uri);
            tokenRoyalty[tokenId] = TokenRoyalty({
                receiver: creator,
                bps: uint96(royaltyBps)
            });
        }

        mintedSupply[listingId] = mintedSoFar + quantity;

        // Split payment
        uint256 feeAmount = (totalPrice * platformFeeBps) / 10000;
        uint256 creatorAmount = totalPrice - feeAmount;

        if (feeAmount > 0 && platformFeeReceiver != address(0)) {
            (bool okFee, ) = platformFeeReceiver.call{value: feeAmount}("");
            require(okFee, "Platform fee transfer failed");
        }
        if (creatorAmount > 0) {
            (bool okCreator, ) = payable(creator).call{value: creatorAmount}("");
            require(okCreator, "Creator payment failed");
        }

        // Refund any excess
        if (msg.value > totalPrice) {
            (bool okRefund, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(okRefund, "Refund failed");
        }

        emit ListingMinted(
            listingId,
            creator,
            msg.sender,
            firstTokenId,
            quantity,
            uri,
            uint96(pricePerPieceWei)
        );
    }

    // --------------------------------------------------------------------
    // EIP-2981 royalty info — read by secondary marketplaces (incl. our own
    // NFTMarketplaceV2 and external marketplaces like OpenSea, Magic Eden).
    // royaltyAmount = salePrice * bps / 10000, capped at salePrice.
    // --------------------------------------------------------------------
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        TokenRoyalty memory r = tokenRoyalty[tokenId];
        if (r.receiver == address(0) || r.bps == 0) {
            return (address(0), 0);
        }
        receiver = r.receiver;
        royaltyAmount = (salePrice * r.bps) / 10000;
        if (royaltyAmount > salePrice) royaltyAmount = salePrice;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId
            || super.supportsInterface(interfaceId);
    }
}

