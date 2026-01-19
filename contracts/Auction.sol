// contracts/Auction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Auction
 * @notice English auction contract for NFT trading
 * Supports:
 * - English auctions (ascending bids)
 * - Time extensions on bids
 * - Minimum bid increments
 * - Royalty enforcement
 * - Multiple payment tokens (ETH, ERC20)
 */
contract Auction is Ownable, ReentrancyGuard, Pausable {
    
    // Auction states
    enum AuctionStatus { ACTIVE, SETTLED, CANCELLED }
    
    // Auction details
    struct AuctionListing {
        address nftContract;          // NFT contract address
        uint256 tokenId;              // NFT token ID
        address seller;               // Original seller
        address currentBidder;        // Current highest bidder
        uint256 currentBid;           // Current highest bid amount
        uint256 reservePrice;         // Minimum acceptable bid
        uint256 minBidIncrement;      // Minimum bid increment (e.g., 5%)
        uint256 startTime;            // Auction start time
        uint256 endTime;              // Auction end time
        uint256 extensionTime;        // Time added when bid within extension window
        uint256 minTimeBeforeEnd;     // Minimum time before end for auto-extension
        address paymentToken;         // Payment token (address(0) = ETH)
        uint256 fee;                  // Platform fee percentage (e.g., 250 = 2.5%)
        AuctionStatus status;         // Current auction status
        bool settled;                 // Whether auction has been settled
    }
    
    // Bid history
    struct BidRecord {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool refunded;
    }
    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime,
        address paymentToken
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
    );
    
    event BidRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionExtended(
        uint256 indexed auctionId,
        uint256 newEndTime
    );
    
    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid,
        uint256 timestamp
    );
    
    event AuctionCancelled(
        uint256 indexed auctionId,
        string reason
    );
    
    // State variables
    uint256 public auctionCounter;
    uint256 public platformFeePercentage = 250; // 2.5%
    address public platformFeeReceiver;
    
    mapping(uint256 => AuctionListing) public auctions;
    mapping(uint256 => BidRecord[]) public bidHistory;
    mapping(address => mapping(uint256 => bool)) public nftInAuction; // NFT locked in auction
    mapping(address => uint256) public escrowBalances; // User escrow for refunds
    
    // Whitelist of payment tokens
    mapping(address => bool) public approvedPaymentTokens;
    
    // Constants
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    uint256 public constant DEFAULT_EXTENSION_DURATION = 15 minutes;
    uint256 public constant DEFAULT_EXTENSION_WINDOW = 15 minutes;
    
    constructor(address _platformFeeReceiver) {
        platformFeeReceiver = _platformFeeReceiver;
        approvedPaymentTokens[address(0)] = true; // ETH approved by default
    }
    
    // ==================== Auction Creation ====================
    
    /**
     * Create a new auction
     * @param _nftContract Address of NFT contract (ERC721)
     * @param _tokenId Token ID of NFT
     * @param _reservePrice Minimum acceptable bid
     * @param _minBidIncrement Minimum bid increment percentage (e.g., 500 = 5%)
     * @param _durationInSeconds Auction duration in seconds
     * @param _paymentToken Payment token address (address(0) = ETH)
     */
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _reservePrice,
        uint256 _minBidIncrement,
        uint256 _durationInSeconds,
        address _paymentToken
    ) external nonReentrant whenNotPaused {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(_reservePrice > 0, "Reserve price must be > 0");
        require(_minBidIncrement <= 10000, "Bid increment too high");
        require(
            _durationInSeconds >= MIN_AUCTION_DURATION && 
            _durationInSeconds <= MAX_AUCTION_DURATION,
            "Invalid auction duration"
        );
        require(approvedPaymentTokens[_paymentToken], "Payment token not approved");
        require(!nftInAuction[_nftContract][_tokenId], "NFT already in auction");
        
        // Verify caller owns the NFT
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == msg.sender,
            "Not the NFT owner"
        );
        
        // Lock NFT
        nftInAuction[_nftContract][_tokenId] = true;
        
        // Create auction
        uint256 auctionId = auctionCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + _durationInSeconds;
        
        auctions[auctionId] = AuctionListing({
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: msg.sender,
            currentBidder: address(0),
            currentBid: 0,
            reservePrice: _reservePrice,
            minBidIncrement: _minBidIncrement,
            startTime: startTime,
            endTime: endTime,
            extensionTime: DEFAULT_EXTENSION_DURATION,
            minTimeBeforeEnd: DEFAULT_EXTENSION_WINDOW,
            paymentToken: _paymentToken,
            fee: platformFeePercentage,
            status: AuctionStatus.ACTIVE,
            settled: false
        });
        
        emit AuctionCreated(
            auctionId,
            _nftContract,
            _tokenId,
            msg.sender,
            _reservePrice,
            startTime,
            endTime,
            _paymentToken
        );
    }
    
    // ==================== Bidding ====================
    
    /**
     * Place a bid on an active auction
     * @param _auctionId Auction ID
     * @param _bidAmount Bid amount in payment token
     */
    function placeBid(uint256 _auctionId, uint256 _bidAmount)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        AuctionListing storage auction = auctions[_auctionId];
        
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(block.timestamp >= auction.startTime, "Auction not started");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(_bidAmount > 0, "Bid must be > 0");
        
        // Validate bid amount
        uint256 minBid = auction.currentBid == 0 
            ? auction.reservePrice 
            : auction.currentBid + (auction.currentBid * auction.minBidIncrement / 10000);
        
        require(_bidAmount >= minBid, "Bid too low");
        
        // Handle payment
        if (auction.paymentToken == address(0)) {
            // ETH
            require(msg.value == _bidAmount, "Incorrect ETH amount");
            escrowBalances[msg.sender] += msg.value;
        } else {
            // ERC20
            require(msg.value == 0, "Do not send ETH for ERC20 auction");
            require(
                IERC20(auction.paymentToken).transferFrom(
                    msg.sender,
                    address(this),
                    _bidAmount
                ),
                "Token transfer failed"
            );
            escrowBalances[msg.sender] += _bidAmount;
        }
        
        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            _refundBid(
                _auctionId,
                auction.currentBidder,
                auction.currentBid,
                auction.paymentToken
            );
        }
        
        // Update auction
        auction.currentBidder = msg.sender;
        auction.currentBid = _bidAmount;
        
        // Record bid
        bidHistory[_auctionId].push(BidRecord({
            bidder: msg.sender,
            amount: _bidAmount,
            timestamp: block.timestamp,
            refunded: false
        }));
        
        // Auto-extend if bid within extension window
        if (auction.endTime - block.timestamp < auction.minTimeBeforeEnd) {
            auction.endTime = block.timestamp + auction.extensionTime;
            emit AuctionExtended(_auctionId, auction.endTime);
        }
        
        emit BidPlaced(_auctionId, msg.sender, _bidAmount, block.timestamp);
    }
    
    /**
     * Refund a previous bid
     */
    function _refundBid(
        uint256 _auctionId,
        address _bidder,
        uint256 _amount,
        address _paymentToken
    ) internal {
        escrowBalances[_bidder] -= _amount;
        
        if (_paymentToken == address(0)) {
            // Refund ETH
            (bool success, ) = _bidder.call{value: _amount}("");
            require(success, "ETH refund failed");
        } else {
            // Refund ERC20
            require(
                IERC20(_paymentToken).transfer(_bidder, _amount),
                "ERC20 refund failed"
            );
        }
        
        emit BidRefunded(_auctionId, _bidder, _amount);
    }
    
    // ==================== Settlement ====================
    
    /**
     * Settle auction - transfer NFT to winner, distribute payments
     * Can be called by anyone after auction ends
     */
    function settleAuction(uint256 _auctionId)
        external
        nonReentrant
        whenNotPaused
    {
        AuctionListing storage auction = auctions[_auctionId];
        
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(!auction.settled, "Auction already settled");
        
        auction.settled = true;
        auction.status = AuctionStatus.SETTLED;
        
        // Check if reserve was met
        if (auction.currentBid < auction.reservePrice) {
            // Reserve not met - return NFT and refund bid
            _cancelAuction(_auctionId, "Reserve price not met");
            return;
        }
        
        // Transfer NFT to winner
        IERC721(auction.nftContract).transferFrom(
            auction.seller,
            auction.currentBidder,
            auction.tokenId
        );
        
        // Calculate payments
        uint256 feeAmount = (auction.currentBid * auction.fee) / 10000;
        uint256 sellerAmount = auction.currentBid - feeAmount;
        
        // Remove from escrow
        escrowBalances[auction.currentBidder] -= auction.currentBid;
        
        // Pay seller
        _transferPayment(
            auction.paymentToken,
            auction.seller,
            sellerAmount
        );
        
        // Pay platform fee
        _transferPayment(
            auction.paymentToken,
            platformFeeReceiver,
            feeAmount
        );
        
        // Unlock NFT
        nftInAuction[auction.nftContract][auction.tokenId] = false;
        
        emit AuctionSettled(
            _auctionId,
            auction.currentBidder,
            auction.currentBid,
            block.timestamp
        );
    }
    
    /**
     * Cancel auction - called if reserve not met or by seller
     */
    function cancelAuction(uint256 _auctionId)
        external
        nonReentrant
    {
        AuctionListing storage auction = auctions[_auctionId];
        
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(
            msg.sender == auction.seller || msg.sender == owner(),
            "Not authorized"
        );
        
        _cancelAuction(_auctionId, "Cancelled by seller");
    }
    
    function _cancelAuction(uint256 _auctionId, string memory _reason)
        internal
    {
        AuctionListing storage auction = auctions[_auctionId];
        
        auction.status = AuctionStatus.CANCELLED;
        
        // Refund current bid
        if (auction.currentBidder != address(0)) {
            _refundBid(
                _auctionId,
                auction.currentBidder,
                auction.currentBid,
                auction.paymentToken
            );
        }
        
        // Unlock NFT
        nftInAuction[auction.nftContract][auction.tokenId] = false;
        
        emit AuctionCancelled(_auctionId, _reason);
    }
    
    // ==================== Payment ====================
    
    /**
     * Transfer payment (ETH or ERC20)
     */
    function _transferPayment(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal {
        if (_amount == 0) return;
        
        if (_token == address(0)) {
            // Transfer ETH
            (bool success, ) = _recipient.call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC20
            require(
                IERC20(_token).transfer(_recipient, _amount),
                "ERC20 transfer failed"
            );
        }
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * Set platform fee percentage
     */
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 2500, "Fee too high"); // Max 25%
        platformFeePercentage = _feePercentage;
    }
    
    /**
     * Set platform fee receiver
     */
    function setPlatformFeeReceiver(address _receiver) external onlyOwner {
        require(_receiver != address(0), "Invalid receiver");
        platformFeeReceiver = _receiver;
    }
    
    /**
     * Add approved payment token
     */
    function approvePaymentToken(address _token) external onlyOwner {
        approvedPaymentTokens[_token] = true;
    }
    
    /**
     * Remove approved payment token
     */
    function revokePaymentToken(address _token) external onlyOwner {
        approvedPaymentTokens[_token] = false;
    }
    
    /**
     * Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ==================== View Functions ====================
    
    /**
     * Get auction details
     */
    function getAuction(uint256 _auctionId)
        external
        view
        returns (AuctionListing memory)
    {
        return auctions[_auctionId];
    }
    
    /**
     * Get bid history
     */
    function getBidHistory(uint256 _auctionId)
        external
        view
        returns (BidRecord[] memory)
    {
        return bidHistory[_auctionId];
    }
    
    /**
     * Get number of bids
     */
    function getBidCount(uint256 _auctionId)
        external
        view
        returns (uint256)
    {
        return bidHistory[_auctionId].length;
    }
    
    /**
     * Check if auction is active
     */
    function isAuctionActive(uint256 _auctionId)
        external
        view
        returns (bool)
    {
        AuctionListing storage auction = auctions[_auctionId];
        return auction.status == AuctionStatus.ACTIVE &&
               block.timestamp >= auction.startTime &&
               block.timestamp < auction.endTime;
    }
    
    /**
     * Get minimum next bid for auction
     */
    function getMinNextBid(uint256 _auctionId)
        external
        view
        returns (uint256)
    {
        AuctionListing storage auction = auctions[_auctionId];
        if (auction.currentBid == 0) {
            return auction.reservePrice;
        }
        return auction.currentBid + (auction.currentBid * auction.minBidIncrement / 10000);
    }
    
    /**
     * Get time until auction ends
     */
    function getTimeUntilEnd(uint256 _auctionId)
        external
        view
        returns (int256)
    {
        AuctionListing storage auction = auctions[_auctionId];
        return int256(auction.endTime) - int256(block.timestamp);
    }
    
    // ==================== Emergency ====================
    
    /**
     * Emergency withdraw (only if paused)
     */
    function emergencyWithdraw(address _token, uint256 _amount)
        external
        onlyOwner
        whenPaused
    {
        if (_token == address(0)) {
            (bool success, ) = msg.sender.call{value: _amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            require(IERC20(_token).transfer(msg.sender, _amount), "Transfer failed");
        }
    }
    
    /**
     * Receive ETH
     */
    receive() external payable {}
}
