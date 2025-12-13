// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace is Ownable, ReentrancyGuard {
    // Structs
    struct ListedToken {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }

    struct Offer {
        uint256 offerId;
        address buyer;
        uint256 amount;
    }

    // State variables
    address public vendorNFT;
    uint256 public listingFee = 0.0001 ether; // 0.0001 ETH
    uint256 public pointThreshold = 100; // Points needed for airdrop eligibility

    mapping(uint256 => ListedToken) public idToListedToken;
    mapping(address => mapping(uint256 => Offer[])) public nftOffers;
    mapping(address => mapping(uint256 => mapping(uint256 => Offer))) public collectionOffers;
    mapping(address => uint256) public escrowBalance;
    mapping(address => uint256) public userPoints;

    uint256 public _listedItems;
    uint256 public _offers;

    // Events
    event NFTListed(uint256 indexed itemId, address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price);
    event NFTDelisted(uint256 indexed itemId, address indexed seller);
    event NFTBought(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event OfferMade(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 offerId, uint256 amount);
    event OfferCanceled(address indexed buyer, address indexed nftContract, uint256 indexed offerId);
    event OfferAccepted(address indexed seller, address indexed buyer, address nftContract, uint256 tokenId, uint256 amount);
    event ListingFeeUpdated(uint256 newFee);

    constructor(address _vendorNFT, address payable _owner) {
        vendorNFT = _vendorNFT;
        transferOwnership(_owner);
    }

    // List NFT for sale
    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external payable nonReentrant {
        require(_price > 0, "Price must be greater than 0");
        require(msg.value >= listingFee, "Insufficient listing fee");

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "You don't own this NFT");
        require(nft.getApproved(_tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        _listedItems++;
        uint256 itemId = _listedItems;

        idToListedToken[itemId] = ListedToken(
            itemId,
            _nftContract,
            _tokenId,
            payable(msg.sender),
            payable(msg.sender),
            _price,
            true
        );

        // Transfer NFT to marketplace
        nft.transferFrom(msg.sender, address(this), _tokenId);

        emit NFTListed(itemId, _nftContract, _tokenId, msg.sender, _price);
    }

    // Delist NFT
    function delistNFT(uint256 _itemId) external nonReentrant {
        ListedToken storage token = idToListedToken[_itemId];
        require(token.currentlyListed, "NFT not listed");
        require(token.seller == msg.sender || owner() == msg.sender, "Not authorized");

        token.currentlyListed = false;

        // Transfer NFT back to seller
        IERC721(token.nftContract).transferFrom(address(this), token.seller, token.tokenId);

        emit NFTDelisted(_itemId, msg.sender);
    }

    // Buy NFT
    function buyNFT(address _nftContract, uint256 _itemId) external payable nonReentrant {
        ListedToken storage token = idToListedToken[_itemId];
        require(token.currentlyListed, "NFT not listed");
        require(msg.value >= token.price, "Insufficient payment");
        require(token.nftContract == _nftContract, "Contract mismatch");

        token.currentlyListed = false;

        // Transfer NFT to buyer
        IERC721(token.nftContract).transferFrom(address(this), msg.sender, token.tokenId);

        // Pay seller
        token.seller.transfer(token.price);

        // Refund excess payment
        if (msg.value > token.price) {
            payable(msg.sender).transfer(msg.value - token.price);
        }

        // Add points to buyer for airdrop eligibility
        userPoints[msg.sender] += 10;

        emit NFTBought(msg.sender, token.tokenId, token.price);
    }

    // Buy NFT with offchain payment (for fiat payments)
    function buyNFTWithOffchainPayment(address _buyer, uint256 _itemId) external payable onlyOwner nonReentrant {
        ListedToken storage token = idToListedToken[_itemId];
        require(token.currentlyListed, "NFT not listed");
        require(msg.value >= token.price, "Insufficient payment");

        token.currentlyListed = false;

        // Transfer NFT to buyer
        IERC721(token.nftContract).transferFrom(address(this), _buyer, token.tokenId);

        // Pay seller
        token.seller.transfer(token.price);

        // Refund excess payment to contract owner
        if (msg.value > token.price) {
            payable(owner()).transfer(msg.value - token.price);
        }

        // Add points to buyer
        userPoints[_buyer] += 10;

        emit NFTBought(_buyer, token.tokenId, token.price);
    }

    // Edit NFT price
    function editNftPrice(uint256 _itemId, uint256 _newPrice) external nonReentrant {
        ListedToken storage token = idToListedToken[_itemId];
        require(token.currentlyListed, "NFT not listed");
        require(token.seller == msg.sender || owner() == msg.sender, "Not authorized");
        require(_newPrice > 0, "Price must be greater than 0");

        token.price = _newPrice;
    }

    // Place offer on NFT
    function placeOffer(address _nftContract, uint256 _tokenId) external payable nonReentrant {
        require(msg.value > 0, "Offer amount must be greater than 0");

        _offers++;
        uint256 offerId = _offers;

        Offer memory newOffer = Offer(offerId, msg.sender, msg.value);
        nftOffers[_nftContract][_tokenId].push(newOffer);

        emit OfferMade(msg.sender, _nftContract, _tokenId, offerId, msg.value);
    }

    // Cancel offer
    function cancelOffer(address _nftContract, uint256 _offerId) external nonReentrant {
        // Find and remove offer
        Offer[] storage offers = nftOffers[_nftContract][_offerId];
        for (uint256 i = 0; i < offers.length; i++) {
            if (offers[i].offerId == _offerId && offers[i].buyer == msg.sender) {
                uint256 amount = offers[i].amount;
                // Remove offer
                offers[i] = offers[offers.length - 1];
                offers.pop();
                // Refund buyer
                payable(msg.sender).transfer(amount);
                emit OfferCanceled(msg.sender, _nftContract, _offerId);
                return;
            }
        }
        revert("Offer not found");
    }

    // Edit offer
    function editOffer(address _nftContract, uint256 _offerId, uint256 _newAmount) external payable nonReentrant {
        require(_newAmount > 0, "New amount must be greater than 0");

        Offer[] storage offers = nftOffers[_nftContract][_offerId];
        for (uint256 i = 0; i < offers.length; i++) {
            if (offers[i].offerId == _offerId && offers[i].buyer == msg.sender) {
                uint256 oldAmount = offers[i].amount;
                offers[i].amount = _newAmount;

                if (_newAmount > oldAmount) {
                    // Need additional payment
                    require(msg.value >= _newAmount - oldAmount, "Insufficient additional payment");
                    escrowBalance[msg.sender] += _newAmount - oldAmount;
                } else {
                    // Refund difference
                    uint256 refund = oldAmount - _newAmount;
                    payable(msg.sender).transfer(refund);
                    escrowBalance[msg.sender] -= refund;
                }
                return;
            }
        }
        revert("Offer not found");
    }

    // Accept offer (simplified - would need more complex logic for specific offers)
    function acceptOffer(address _nftContract, uint256 _offerId) external nonReentrant {
        // This is a simplified implementation
        // In production, you'd want to accept specific offers
        revert("Offer acceptance not implemented yet");
    }

    // Get all active listings
    function getActiveListings() external view returns (ListedToken[] memory) {
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 1; i <= _listedItems; i++) {
            if (idToListedToken[i].currentlyListed) {
                activeCount++;
            }
        }

        ListedToken[] memory activeListings = new ListedToken[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= _listedItems; i++) {
            if (idToListedToken[i].currentlyListed) {
                activeListings[index] = idToListedToken[i];
                index++;
            }
        }

        return activeListings;
    }

    // Get all listings (including inactive)
    function getAllListings() external view returns (ListedToken[] memory) {
        ListedToken[] memory allListings = new ListedToken[](_listedItems);

        for (uint256 i = 1; i <= _listedItems; i++) {
            allListings[i - 1] = idToListedToken[i];
        }

        return allListings;
    }

    // Get user's NFTs
    function getMyNFTs() external view returns (ListedToken[] memory) {
        uint256 myNFTCount = 0;

        for (uint256 i = 1; i <= _listedItems; i++) {
            if (idToListedToken[i].owner == msg.sender) {
                myNFTCount++;
            }
        }

        ListedToken[] memory myNFTs = new ListedToken[](myNFTCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= _listedItems; i++) {
            if (idToListedToken[i].owner == msg.sender) {
                myNFTs[index] = idToListedToken[i];
                index++;
            }
        }

        return myNFTs;
    }

    // Get NFT by ID
    function getNFTById(uint256 _itemId) external view returns (
        uint256 tokenId,
        address owner,
        address seller,
        uint256 price,
        string memory uri,
        bool currentlyListed
    ) {
        ListedToken memory token = idToListedToken[_itemId];
        return (
            token.tokenId,
            token.owner,
            token.seller,
            token.price,
            "", // URI would be fetched from NFT contract
            token.currentlyListed
        );
    }

    // Get offers for NFT
    function getOffers(address _nftContract, uint256 _tokenId) external view returns (Offer[] memory) {
        return nftOffers[_nftContract][_tokenId];
    }

    // Get user status (points and eligibility)
    function getUserStatus(address _user) external view returns (uint256 points, bool eligible) {
        points = userPoints[_user];
        eligible = points >= pointThreshold;
    }

    // Check airdrop eligibility
    function isEligibleForAirdrop(address _user) external view returns (bool) {
        return userPoints[_user] >= pointThreshold;
    }

    // Get listing fee
    function getListingFee() external view returns (uint256) {
        return listingFee;
    }

    // Update listing fee
    function updateListingFee(uint256 _newFee) external onlyOwner {
        listingFee = _newFee;
        emit ListingFeeUpdated(_newFee);
    }

    // Withdraw escrow balance
    function withdrawEscrow() external nonReentrant {
        uint256 amount = escrowBalance[msg.sender];
        require(amount > 0, "No escrow balance");

        escrowBalance[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Owner withdraw function
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Receive function
    receive() external payable {}
}