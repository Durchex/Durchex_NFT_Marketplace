// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract NFTMarketplaceV2 is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // EIP-712 Domain Separator
    string private constant SIGNING_DOMAIN = "NFTMarketplace";
    string private constant SIGNATURE_VERSION = "1";

    // Structs
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 quantity; // For ERC-1155 support
        uint256 price;
        uint256 startTime;
        uint256 endTime; // 0 for fixed price, timestamp for auction end
        address paymentToken; // address(0) for ETH
        bool isERC1155;
        bool active;
    }

    struct Offer {
        uint256 offerId;
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 expiration;
        address paymentToken;
        bool active;
    }

    struct SignedListing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        address paymentToken;
        bool isERC1155;
        uint256 nonce;
    }

    struct SignedOffer {
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 expiration;
        address paymentToken;
        uint256 nonce;
    }

    // State variables
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(address => uint256) public nonces; // For replay protection

    uint256 public listingCounter;
    uint256 public offerCounter;
    uint256 public platformFeeBps = 250; // 2.5%
    address payable public platformFeeReceiver;

    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId);
    event ListingExecuted(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event OfferCreated(uint256 indexed offerId, address indexed buyer, address indexed nftContract, uint256 tokenId);
    event OfferAccepted(uint256 indexed offerId, address indexed seller, address indexed buyer);
    event OfferCancelled(uint256 indexed offerId, address indexed buyer);

    constructor(address payable _platformFeeReceiver)
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {
        platformFeeReceiver = _platformFeeReceiver;
        transferOwnership(msg.sender);
    }

    // EIP-712 Typed Data Hash for Listings
    function _hashListing(SignedListing memory listing) private view returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("SignedListing(address seller,address nftContract,uint256 tokenId,uint256 quantity,uint256 price,uint256 startTime,uint256 endTime,address paymentToken,bool isERC1155,uint256 nonce)"),
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.quantity,
            listing.price,
            listing.startTime,
            listing.endTime,
            listing.paymentToken,
            listing.isERC1155,
            listing.nonce
        ));
    }

    function _hashOffer(SignedOffer memory offer) private view returns (bytes32) {
        return keccak256(abi.encode(
            keccak256("SignedOffer(address buyer,address nftContract,uint256 tokenId,uint256 quantity,uint256 price,uint256 expiration,address paymentToken,uint256 nonce)"),
            offer.buyer,
            offer.nftContract,
            offer.tokenId,
            offer.quantity,
            offer.price,
            offer.expiration,
            offer.paymentToken,
            offer.nonce
        ));
    }

    function getListingDigest(SignedListing memory listing) public view returns (bytes32) {
        return _hashTypedDataV4(_hashListing(listing));
    }

    function getOfferDigest(SignedOffer memory offer) public view returns (bytes32) {
        return _hashTypedDataV4(_hashOffer(offer));
    }

    // Create listing with signature verification
    function createListing(
        SignedListing memory signedListing,
        bytes memory signature
    ) external nonReentrant {
        require(signedListing.seller == msg.sender, "Only seller can create listing");
        require(signedListing.nonce == nonces[msg.sender], "Invalid nonce");
        require(signedListing.startTime <= block.timestamp, "Start time in future");
        require(signedListing.endTime == 0 || signedListing.endTime > block.timestamp, "Invalid end time");

        // Verify signature
        bytes32 digest = getListingDigest(signedListing);
        address signer = digest.recover(signature);
        require(signer == signedListing.seller, "Invalid signature");

        // Check ownership and approval
        if (signedListing.isERC1155) {
            IERC1155 nft = IERC1155(signedListing.nftContract);
            require(nft.balanceOf(msg.sender, signedListing.tokenId) >= signedListing.quantity, "Insufficient balance");
            require(nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved for ERC1155");
        } else {
            IERC721 nft = IERC721(signedListing.nftContract);
            require(nft.ownerOf(signedListing.tokenId) == msg.sender, "Not token owner");
            require(nft.getApproved(signedListing.tokenId) == address(this) ||
                    nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");
        }

        listingCounter++;
        listings[listingCounter] = Listing({
            listingId: listingCounter,
            seller: signedListing.seller,
            nftContract: signedListing.nftContract,
            tokenId: signedListing.tokenId,
            quantity: signedListing.quantity,
            price: signedListing.price,
            startTime: signedListing.startTime,
            endTime: signedListing.endTime,
            paymentToken: signedListing.paymentToken,
            isERC1155: signedListing.isERC1155,
            active: true
        });

        nonces[msg.sender]++;

        emit ListingCreated(listingCounter, signedListing.seller, signedListing.nftContract, signedListing.tokenId);
    }

    // Execute sale (buy listing)
    function executeSale(
        uint256 listingId,
        uint256 quantity
    ) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.startTime <= block.timestamp, "Listing not started");
        require(listing.endTime == 0 || listing.endTime > block.timestamp, "Listing expired");
        require(quantity > 0 && quantity <= listing.quantity, "Invalid quantity");

        uint256 totalPrice = listing.price * quantity;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Calculate fees
        uint256 platformFee = (totalPrice * platformFeeBps) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyReceiver;

        // Check for royalties (EIP-2981)
        if (!listing.isERC1155) {
            try IERC2981(listing.nftContract).royaltyInfo(listing.tokenId, totalPrice) returns (address receiver, uint256 amount) {
                royaltyReceiver = receiver;
                royaltyAmount = amount;
            } catch {}
        }

        uint256 sellerAmount = totalPrice - platformFee - royaltyAmount;

        // Transfer NFT
        if (listing.isERC1155) {
            IERC1155(listing.nftContract).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId,
                quantity,
                ""
            );
        } else {
            IERC721(listing.nftContract).transferFrom(listing.seller, msg.sender, listing.tokenId);
        }

        // Transfer payments
        if (platformFee > 0 && platformFeeReceiver != address(0)) {
            (bool success,) = platformFeeReceiver.call{value: platformFee}("");
            require(success, "Platform fee transfer failed");
        }

        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool success,) = royaltyReceiver.call{value: royaltyAmount}("");
            require(success, "Royalty transfer failed");
        }

        if (sellerAmount > 0) {
            (bool success,) = listing.seller.call{value: sellerAmount}("");
            require(success, "Seller payment failed");
        }

        // Update listing
        if (quantity >= listing.quantity) {
            listing.active = false;
        } else {
            listing.quantity -= quantity;
        }

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        emit ListingExecuted(listingId, msg.sender, listing.seller, totalPrice);
    }

    // Cancel listing
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender || owner() == msg.sender, "Not authorized");

        listing.active = false;

        emit ListingCancelled(listingId, msg.sender);
    }

    // Create offer with signature
    function createOffer(
        SignedOffer memory signedOffer,
        bytes memory signature
    ) external payable nonReentrant {
        require(signedOffer.buyer == msg.sender, "Only buyer can create offer");
        require(signedOffer.nonce == nonces[msg.sender], "Invalid nonce");
        require(signedOffer.expiration > block.timestamp, "Offer expired");
        require(msg.value >= signedOffer.price, "Insufficient payment");

        // Verify signature
        bytes32 digest = getOfferDigest(signedOffer);
        address signer = digest.recover(signature);
        require(signer == signedOffer.buyer, "Invalid signature");

        offerCounter++;
        offers[offerCounter] = Offer({
            offerId: offerCounter,
            buyer: signedOffer.buyer,
            nftContract: signedOffer.nftContract,
            tokenId: signedOffer.tokenId,
            quantity: signedOffer.quantity,
            price: signedOffer.price,
            expiration: signedOffer.expiration,
            paymentToken: signedOffer.paymentToken,
            active: true
        });

        nonces[msg.sender]++;

        emit OfferCreated(offerCounter, signedOffer.buyer, signedOffer.nftContract, signedOffer.tokenId);
    }

    // Accept offer
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(offer.expiration > block.timestamp, "Offer expired");

        // Check ownership
        if (offer.quantity > 1) {
            // ERC-1155
            IERC1155 nft = IERC1155(offer.nftContract);
            require(nft.balanceOf(msg.sender, offer.tokenId) >= offer.quantity, "Insufficient balance");
            require(nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");
        } else {
            // ERC-721
            IERC721 nft = IERC721(offer.nftContract);
            require(nft.ownerOf(offer.tokenId) == msg.sender, "Not token owner");
            require(nft.getApproved(offer.tokenId) == address(this) ||
                    nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");
        }

        // Calculate fees
        uint256 platformFee = (offer.price * platformFeeBps) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyReceiver;

        // Check for royalties
        if (offer.quantity == 1) {
            try IERC2981(offer.nftContract).royaltyInfo(offer.tokenId, offer.price) returns (address receiver, uint256 amount) {
                royaltyReceiver = receiver;
                royaltyAmount = amount;
            } catch {}
        }

        uint256 sellerAmount = offer.price - platformFee - royaltyAmount;

        // Transfer NFT
        if (offer.quantity > 1) {
            IERC1155(offer.nftContract).safeTransferFrom(
                msg.sender,
                offer.buyer,
                offer.tokenId,
                offer.quantity,
                ""
            );
        } else {
            IERC721(offer.nftContract).transferFrom(msg.sender, offer.buyer, offer.tokenId);
        }

        // Transfer payments
        if (platformFee > 0 && platformFeeReceiver != address(0)) {
            (bool success,) = platformFeeReceiver.call{value: platformFee}("");
            require(success, "Platform fee transfer failed");
        }

        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool success,) = royaltyReceiver.call{value: royaltyAmount}("");
            require(success, "Royalty transfer failed");
        }

        if (sellerAmount > 0) {
            (bool success,) = msg.sender.call{value: sellerAmount}("");
            require(success, "Seller payment failed");
        }

        offer.active = false;

        emit OfferAccepted(offerId, msg.sender, offer.buyer);
    }

    // Cancel offer
    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(offer.buyer == msg.sender || owner() == msg.sender, "Not authorized");

        offer.active = false;

        // Refund buyer
        if (offer.price > 0) {
            payable(offer.buyer).transfer(offer.price);
        }

        emit OfferCancelled(offerId, msg.sender);
    }

    // View functions
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }

    function getActiveListings(uint256 offset, uint256 limit) external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        uint256 totalListings = listingCounter;

        // Count active listings
        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].active &&
                listings[i].startTime <= block.timestamp &&
                (listings[i].endTime == 0 || listings[i].endTime > block.timestamp)) {
                activeCount++;
            }
        }

        uint256 resultCount = limit;
        if (offset + limit > activeCount) {
            resultCount = activeCount > offset ? activeCount - offset : 0;
        }

        Listing[] memory result = new Listing[](resultCount);
        uint256 resultIndex = 0;

        for (uint256 i = 1; i <= totalListings && resultIndex < resultCount; i++) {
            if (listings[i].active &&
                listings[i].startTime <= block.timestamp &&
                (listings[i].endTime == 0 || listings[i].endTime > block.timestamp)) {
                if (offset > 0) {
                    offset--;
                    continue;
                }
                result[resultIndex] = listings[i];
                resultIndex++;
            }
        }

        return result;
    }

    // Admin functions
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _feeBps;
    }

    function setPlatformFeeReceiver(address payable _receiver) external onlyOwner {
        platformFeeReceiver = _receiver;
    }

    // ERC-1155 support
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x4e2312e0; // ERC-1155 Receiver
    }
}