// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTRental
 * @dev P2P NFT rental marketplace with escrow
 */
contract NFTRental is ReentrancyGuard, Ownable {
    // Rental listing status
    enum ListingStatus {
        Active,
        Rented,
        Cancelled,
        Completed
    }

    // Bid status
    enum BidStatus {
        Pending,
        Accepted,
        Rejected,
        Cancelled,
        Completed
    }

    // Rental listing
    struct Listing {
        address owner;
        address nftContract;
        uint256 tokenId;
        uint256 dailyPrice;
        uint256 minDays;
        uint256 maxDays;
        ListingStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Rental bid/offer
    struct Bid {
        address renter;
        uint256 listingId;
        uint256 rentalDays;
        uint256 totalPrice;
        uint256 startDate;
        uint256 endDate;
        BidStatus status;
        uint256 createdAt;
        uint256 acceptedAt;
    }

    // Active rental
    struct ActiveRental {
        address renter;
        address owner;
        address nftContract;
        uint256 tokenId;
        uint256 dailyPrice;
        uint256 startDate;
        uint256 endDate;
        uint256 totalPrice;
        bool returned;
    }

    // Configuration
    struct Config {
        uint256 platformFeePercentage; // Fee in basis points (e.g., 250 = 2.5%)
        address treasuryAddress;
        bool paused;
    }

    Config public config;

    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid) public bids;
    mapping(uint256 => ActiveRental) public activeRentals;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userBids;
    mapping(address => uint256[]) public userRentals;
    mapping(address => uint256) public userReputation;

    // Statistics
    uint256 public totalListings;
    uint256 public totalBids;
    uint256 public totalRentals;
    uint256 public totalFeesCollected;
    uint256 public lastListingId;
    uint256 public lastBidId;
    uint256 public lastRentalId;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed owner,
        address nftContract,
        uint256 tokenId,
        uint256 dailyPrice
    );
    event ListingCancelled(uint256 indexed listingId);
    event BidCreated(
        uint256 indexed bidId,
        uint256 indexed listingId,
        address indexed renter,
        uint256 rentalDays,
        uint256 totalPrice
    );
    event BidAccepted(uint256 indexed bidId, uint256 indexed listingId, uint256 rentalId);
    event BidRejected(uint256 indexed bidId);
    event RentalStarted(uint256 indexed rentalId, address indexed renter, uint256 startDate);
    event RentalReturned(
        uint256 indexed rentalId,
        address indexed renter,
        uint256 refund,
        bool onTime
    );
    event RentalCompleted(uint256 indexed rentalId, uint256 totalEarnings);
    event ReputationUpdated(address indexed user, uint256 score);
    event ConfigUpdated(uint256 feePercentage, address treasuryAddress);

    constructor(address _treasuryAddress) {
        require(_treasuryAddress != address(0), "Invalid treasury address");

        config = Config({
            platformFeePercentage: 250, // 2.5%
            treasuryAddress: _treasuryAddress,
            paused: false
        });
    }

    /**
     * @dev Create rental listing
     */
    function createListing(
        address _nftContract,
        uint256 _tokenId,
        uint256 _dailyPrice,
        uint256 _minDays,
        uint256 _maxDays
    ) external nonReentrant returns (uint256) {
        require(!config.paused, "Marketplace paused");
        require(_nftContract != address(0), "Invalid contract");
        require(_dailyPrice > 0, "Price must be > 0");
        require(_minDays > 0, "Minimum days must be > 0");
        require(_maxDays >= _minDays, "Max days must be >= min days");

        // Verify NFT ownership
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == msg.sender,
            "Not NFT owner"
        );

        // Create listing
        uint256 listingId = ++lastListingId;
        listings[listingId] = Listing({
            owner: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            dailyPrice: _dailyPrice,
            minDays: _minDays,
            maxDays: _maxDays,
            status: ListingStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        userListings[msg.sender].push(listingId);
        totalListings++;

        emit ListingCreated(
            listingId,
            msg.sender,
            _nftContract,
            _tokenId,
            _dailyPrice
        );

        return listingId;
    }

    /**
     * @dev Cancel rental listing
     */
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.owner == msg.sender, "Not listing owner");
        require(listing.status == ListingStatus.Active, "Cannot cancel");

        listing.status = ListingStatus.Cancelled;
        listing.updatedAt = block.timestamp;

        emit ListingCancelled(_listingId);
    }

    /**
     * @dev Create rental bid
     */
    function createBid(
        uint256 _listingId,
        uint256 _rentalDays,
        address paymentToken
    ) external payable nonReentrant returns (uint256) {
        require(!config.paused, "Marketplace paused");
        require(_rentalDays > 0, "Days must be > 0");

        Listing memory listing = listings[_listingId];
        require(listing.status == ListingStatus.Active, "Listing not active");
        require(_rentalDays >= listing.minDays, "Less than minimum days");
        require(_rentalDays <= listing.maxDays, "More than maximum days");

        // Calculate total price
        uint256 totalPrice = listing.dailyPrice * _rentalDays;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Create bid
        uint256 bidId = ++lastBidId;
        bids[bidId] = Bid({
            renter: msg.sender,
            listingId: _listingId,
            rentalDays: _rentalDays,
            totalPrice: totalPrice,
            startDate: 0,
            endDate: 0,
            status: BidStatus.Pending,
            createdAt: block.timestamp,
            acceptedAt: 0
        });

        userBids[msg.sender].push(bidId);
        totalBids++;

        emit BidCreated(_listingId, bidId, msg.sender, _rentalDays, totalPrice);

        return bidId;
    }

    /**
     * @dev Accept rental bid
     */
    function acceptBid(uint256 _bidId) external nonReentrant returns (uint256) {
        Bid storage bid = bids[_bidId];
        Listing storage listing = listings[bid.listingId];

        require(listing.owner == msg.sender, "Not listing owner");
        require(bid.status == BidStatus.Pending, "Bid not pending");
        require(listing.status == ListingStatus.Active, "Listing not active");

        // Update statuses
        bid.status = BidStatus.Accepted;
        bid.acceptedAt = block.timestamp;
        bid.startDate = block.timestamp;
        bid.endDate = block.timestamp + (bid.rentalDays * 1 days);

        listing.status = ListingStatus.Rented;
        listing.updatedAt = block.timestamp;

        // Create active rental
        uint256 rentalId = ++lastRentalId;
        activeRentals[rentalId] = ActiveRental({
            renter: bid.renter,
            owner: listing.owner,
            nftContract: listing.nftContract,
            tokenId: listing.tokenId,
            dailyPrice: listing.dailyPrice,
            startDate: bid.startDate,
            endDate: bid.endDate,
            totalPrice: bid.totalPrice,
            returned: false
        });

        userRentals[bid.renter].push(rentalId);
        totalRentals++;

        // Transfer NFT to renter (escrow-like custody)
        IERC721(listing.nftContract).transferFrom(
            listing.owner,
            bid.renter,
            listing.tokenId
        );

        emit BidAccepted(_bidId, bid.listingId, rentalId);
        emit RentalStarted(rentalId, bid.renter, bid.startDate);

        return rentalId;
    }

    /**
     * @dev Reject rental bid
     */
    function rejectBid(uint256 _bidId) external nonReentrant {
        Bid storage bid = bids[_bidId];
        Listing memory listing = listings[bid.listingId];

        require(listing.owner == msg.sender, "Not listing owner");
        require(bid.status == BidStatus.Pending, "Bid not pending");

        bid.status = BidStatus.Rejected;

        // Refund renter
        (bool success, ) = payable(bid.renter).call{value: bid.totalPrice}("");
        require(success, "Refund failed");

        emit BidRejected(_bidId);
    }

    /**
     * @dev Return rented NFT
     */
    function returnNFT(uint256 _rentalId) external nonReentrant {
        ActiveRental storage rental = activeRentals[_rentalId];
        require(rental.renter == msg.sender, "Not renter");
        require(!rental.returned, "Already returned");

        rental.returned = true;

        bool onTime = block.timestamp <= rental.endDate;
        uint256 ownerEarnings = rental.totalPrice;
        uint256 platformFee = (rental.totalPrice * config.platformFeePercentage) / 10000;
        uint256 ownerAmount = ownerEarnings - platformFee;

        // Transfer NFT back to owner
        IERC721(rental.nftContract).transferFrom(
            msg.sender,
            rental.owner,
            rental.tokenId
        );

        // Pay owner
        (bool ownerSuccess, ) = payable(rental.owner).call{value: ownerAmount}("");
        require(ownerSuccess, "Payment to owner failed");

        // Transfer platform fee to treasury
        (bool treasurySuccess, ) = payable(config.treasuryAddress).call{
            value: platformFee
        }("");
        require(treasurySuccess, "Treasury transfer failed");

        totalFeesCollected += platformFee;

        // Update reputation
        if (onTime) {
            userReputation[msg.sender] += 10;
        } else {
            userReputation[msg.sender] = userReputation[msg.sender] > 5
                ? userReputation[msg.sender] - 5
                : 0;
        }

        emit RentalReturned(_rentalId, msg.sender, ownerAmount, onTime);
    }

    /**
     * @dev Get user listings
     */
    function getUserListings(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userListings[_user];
    }

    /**
     * @dev Get user bids
     */
    function getUserBids(address _user) external view returns (uint256[] memory) {
        return userBids[_user];
    }

    /**
     * @dev Get user active rentals
     */
    function getUserRentals(address _user) external view returns (uint256[] memory) {
        return userRentals[_user];
    }

    /**
     * @dev Get active rental details
     */
    function getRentalDetails(uint256 _rentalId)
        external
        view
        returns (ActiveRental memory)
    {
        return activeRentals[_rentalId];
    }

    /**
     * @dev Get user reputation
     */
    function getReputation(address _user) external view returns (uint256) {
        return userReputation[_user];
    }

    /**
     * @dev Update configuration
     */
    function updateConfig(uint256 _feePercentage, address _treasuryAddress)
        external
        onlyOwner
    {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        require(_treasuryAddress != address(0), "Invalid treasury");

        config.platformFeePercentage = _feePercentage;
        config.treasuryAddress = _treasuryAddress;

        emit ConfigUpdated(_feePercentage, _treasuryAddress);
    }

    /**
     * @dev Pause/unpause marketplace
     */
    function setPaused(bool _paused) external onlyOwner {
        config.paused = _paused;
    }

    /**
     * @dev Get marketplace statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 listings,
            uint256 bids,
            uint256 rentals,
            uint256 feesCollected
        )
    {
        return (totalListings, totalBids, totalRentals, totalFeesCollected);
    }

    // Receive ETH for payments
    receive() external payable {}
}
