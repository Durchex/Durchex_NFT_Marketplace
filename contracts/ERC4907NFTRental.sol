// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC4907 {
    event UpdateUser(uint256 indexed tokenId, address indexed user, uint64 expires);
    function setUser(uint256 tokenId, address user, uint64 expires) external;
    function userOf(uint256 tokenId) external view returns (address);
    function userExpires(uint256 tokenId) external view returns (uint64);
}

/**
 * @title ERC4907NFTRental
 * @dev Standard ERC-4907 rental contract with time-locked NFT usage rights
 * @notice Users can rent out their NFTs and earn rental fees
 */
contract ERC4907NFTRental is ERC721, ERC721Enumerable, IERC4907, Ownable, ReentrancyGuard {
    
    // ============ Events ============
    
    event RentalListingUpdated(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 pricePerDay,
        bool active
    );
    
    event RentalStarted(
        uint256 indexed tokenId,
        address indexed renter,
        address indexed owner,
        uint64 startTime,
        uint64 endTime,
        uint256 totalPrice
    );
    
    event RentalEnded(
        uint256 indexed tokenId,
        address indexed renter,
        uint256 timestamp
    );
    
    event RentalCancelled(
        uint256 indexed tokenId,
        uint256 timestamp
    );

    // ============ State Variables ============
    
    mapping(uint256 => address) private _users;
    mapping(uint256 => uint64) private _userExpires;
    
    // Rental tracking
    mapping(uint256 => RentalListing) public rentalListings;
    mapping(uint256 => RentalAgreement) public activeRentals;
    mapping(address => uint256) public ownerEarnings;
    
    uint256 public platformFeePercentage = 500; // 5% (divide by 10000)
    uint256 public totalPlatformFees;

    // ============ Structs ============
    
    struct RentalListing {
        address owner;
        uint256 pricePerDay;
        bool active;
        uint256 minRentalDays;
        uint256 maxRentalDays;
    }
    
    struct RentalAgreement {
        address renter;
        address owner;
        uint256 pricePerDay;
        uint64 startTime;
        uint64 endTime;
        uint256 totalPrice;
        bool active;
    }

    // ============ Constructor ============
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    // ============ ERC-4907 Functions ============
    
    /**
     * @dev Set user and expires of an NFT
     * @param tokenId Token ID
     * @param user User address
     * @param expires Expiration timestamp (Unix time)
     */
    function setUser(
        uint256 tokenId,
        address user,
        uint64 expires
    ) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(user != address(0), "Invalid user");
        require(expires > block.timestamp, "Expiration must be in future");
        
        _users[tokenId] = user;
        _userExpires[tokenId] = expires;
        
        emit UpdateUser(tokenId, user, expires);
    }

    /**
     * @dev Get the user of an NFT
     */
    function userOf(uint256 tokenId) public view override returns (address) {
        if (uint64(block.timestamp) >= _userExpires[tokenId]) {
            return address(0);
        }
        return _users[tokenId];
    }

    /**
     * @dev Get user expiration time
     */
    function userExpires(uint256 tokenId) public view override returns (uint64) {
        return _userExpires[tokenId];
    }

    // ============ Rental Functions ============
    
    /**
     * @dev Create a rental listing for an NFT
     * @param tokenId Token ID to list for rental
     * @param pricePerDay Daily rental price in wei
     * @param minDays Minimum rental period in days
     * @param maxDays Maximum rental period in days
     */
    function listForRental(
        uint256 tokenId,
        uint256 pricePerDay,
        uint256 minDays,
        uint256 maxDays
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(pricePerDay > 0, "Price must be > 0");
        require(minDays > 0 && maxDays > 0, "Days must be > 0");
        require(minDays <= maxDays, "Min days > max days");
        
        rentalListings[tokenId] = RentalListing({
            owner: msg.sender,
            pricePerDay: pricePerDay,
            active: true,
            minRentalDays: minDays,
            maxRentalDays: maxDays
        });
        
        emit RentalListingUpdated(tokenId, msg.sender, pricePerDay, true);
    }

    /**
     * @dev Remove rental listing
     */
    function removeRentalListing(uint256 tokenId) external {
        require(rentalListings[tokenId].owner == msg.sender, "Not rental owner");
        rentalListings[tokenId].active = false;
        emit RentalListingUpdated(tokenId, msg.sender, 0, false);
    }

    /**
     * @dev Rent an NFT for a specified period
     * @param tokenId Token ID to rent
     * @param rentalDays Number of days to rent
     */
    function rentNFT(uint256 tokenId, uint256 rentalDays)
        external
        payable
        nonReentrant
    {
        RentalListing memory listing = rentalListings[tokenId];
        require(listing.active, "NFT not available for rental");
        require(rentalDays >= listing.minRentalDays, "Rental period too short");
        require(rentalDays <= listing.maxRentalDays, "Rental period too long");
        
        // Calculate payment
        uint256 totalPrice = listing.pricePerDay * rentalDays;
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 ownerPayment = totalPrice - platformFee;
        
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Calculate expiration
        uint64 expirationTime = uint64(block.timestamp + (rentalDays * 1 days));
        
        // Check for overlapping rentals
        RentalAgreement memory existingRental = activeRentals[tokenId];
        require(
            !existingRental.active || existingRental.endTime <= block.timestamp,
            "NFT already rented"
        );
        
        // Create rental agreement
        activeRentals[tokenId] = RentalAgreement({
            renter: msg.sender,
            owner: listing.owner,
            pricePerDay: listing.pricePerDay,
            startTime: uint64(block.timestamp),
            endTime: expirationTime,
            totalPrice: totalPrice,
            active: true
        });
        
        // Set user with ERC-4907
        setUser(tokenId, msg.sender, expirationTime);
        
        // Track earnings
        ownerEarnings[listing.owner] += ownerPayment;
        totalPlatformFees += platformFee;
        
        emit RentalStarted(
            tokenId,
            msg.sender,
            listing.owner,
            uint64(block.timestamp),
            expirationTime,
            totalPrice
        );
    }

    /**
     * @dev End rental (called by owner after expiration)
     */
    function endRental(uint256 tokenId) external {
        RentalAgreement memory rental = activeRentals[tokenId];
        require(rental.active, "No active rental");
        require(
            rental.endTime <= block.timestamp || msg.sender == rental.renter,
            "Rental still active"
        );
        
        activeRentals[tokenId].active = false;
        _users[tokenId] = address(0);
        _userExpires[tokenId] = 0;
        
        emit RentalEnded(tokenId, rental.renter, block.timestamp);
    }

    /**
     * @dev Cancel rental (owner only)
     */
    function cancelRental(uint256 tokenId) external {
        RentalAgreement memory rental = activeRentals[tokenId];
        require(msg.sender == rental.owner, "Not rental owner");
        require(rental.active, "No active rental");
        
        // Refund renter
        (bool success, ) = rental.renter.call{
            value: rental.totalPrice
        }("");
        require(success, "Refund failed");
        
        activeRentals[tokenId].active = false;
        _users[tokenId] = address(0);
        _userExpires[tokenId] = 0;
        
        // Remove platform fee from total
        uint256 platformFee = (rental.totalPrice * platformFeePercentage) / 10000;
        totalPlatformFees -= platformFee;
        ownerEarnings[rental.owner] -= (rental.totalPrice - platformFee);
        
        emit RentalCancelled(tokenId, block.timestamp);
    }

    // ============ Payment Functions ============
    
    /**
     * @dev Withdraw owner earnings
     */
    function withdrawEarnings(uint256 amount) external nonReentrant {
        require(amount <= ownerEarnings[msg.sender], "Insufficient earnings");
        ownerEarnings[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get owner earnings
     */
    function getEarnings(address owner) external view returns (uint256) {
        return ownerEarnings[owner];
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= totalPlatformFees, "Insufficient fees");
        totalPlatformFees -= amount;
        
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Update platform fee percentage
     */
    function setPlatformFeePercentage(uint256 newPercentage)
        external
        onlyOwner
    {
        require(newPercentage <= 10000, "Percentage too high");
        platformFeePercentage = newPercentage;
    }

    // ============ Query Functions ============
    
    /**
     * @dev Get active rental for an NFT
     */
    function getActiveRental(uint256 tokenId)
        external
        view
        returns (RentalAgreement memory)
    {
        return activeRentals[tokenId];
    }

    /**
     * @dev Get rental listing
     */
    function getRentalListing(uint256 tokenId)
        external
        view
        returns (RentalListing memory)
    {
        return rentalListings[tokenId];
    }

    /**
     * @dev Calculate rental price
     */
    function calculateRentalPrice(uint256 tokenId, uint256 numDays)
        external
        view
        returns (uint256 totalPrice, uint256 platformFee, uint256 ownerPayment)
    {
        RentalListing memory listing = rentalListings[tokenId];
        totalPrice = listing.pricePerDay * numDays;
        platformFee = (totalPrice * platformFeePercentage) / 10000;
        ownerPayment = totalPrice - platformFee;
    }

    /**
     * @dev Check if NFT is currently rented
     */
    function isRented(uint256 tokenId) external view returns (bool) {
        RentalAgreement memory rental = activeRentals[tokenId];
        return rental.active && rental.endTime > block.timestamp;
    }

    // ============ Override Functions ============
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721) {
        super._afterTokenTransfer(from, to, tokenId, batchSize);
        
        // Clear rental on transfer
        if (from != to && activeRentals[tokenId].active) {
            activeRentals[tokenId].active = false;
            _users[tokenId] = address(0);
            _userExpires[tokenId] = 0;
        }
    }

    // ============ Receive Function ============
    
    receive() external payable {}
}
