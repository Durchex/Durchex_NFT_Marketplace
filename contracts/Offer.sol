// contracts/Offer.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Offer
 * @notice P2P offer system for NFT trading
 * Supports:
 * - Buyers making offers on specific NFTs
 * - Counter-offers from sellers
 * - Offer expiration and cancellation
 * - Multiple payment tokens
 * - Offer history and tracking
 */
contract Offer is Ownable, ReentrancyGuard {
    
    enum OfferStatus { PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED }
    
    struct OfferDetails {
        uint256 offerId;
        address nftContract;
        uint256 tokenId;
        address buyer;
        address seller;
        uint256 offerAmount;
        address paymentToken;
        uint256 expiresAt;
        OfferStatus status;
        uint256 createdAt;
        uint256 respondedAt;
        bool isCounterOffer;
        uint256 parentOfferId;
    }
    
    struct CounterOfferDetails {
        uint256 counterId;
        uint256 originalOfferId;
        address counterFrom;
        uint256 counterAmount;
        uint256 expiresAt;
        OfferStatus status;
        uint256 createdAt;
    }
    
    // Events
    event OfferCreated(
        uint256 indexed offerId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address buyer,
        address seller,
        uint256 amount,
        address paymentToken,
        uint256 expiresAt
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        uint256 timestamp
    );
    
    event OfferRejected(
        uint256 indexed offerId,
        address indexed rejectedBy,
        uint256 timestamp
    );
    
    event CounterOfferCreated(
        uint256 indexed offerId,
        uint256 indexed counterId,
        address indexed counterFrom,
        uint256 counterAmount,
        uint256 expiresAt
    );
    
    event OfferExpired(
        uint256 indexed offerId,
        uint256 timestamp
    );
    
    event OfferCancelled(
        uint256 indexed offerId,
        address indexed cancelledBy,
        uint256 timestamp
    );
    
    event OfferAmountIncreased(
        uint256 indexed offerId,
        uint256 newAmount,
        uint256 timestamp
    );
    
    // State variables
    uint256 public offerCounter;
    uint256 public counterOfferCounter;
    uint256 public platformFeePercentage = 250; // 2.5%
    address public platformFeeReceiver;
    uint256 public defaultOfferDuration = 7 days;
    
    mapping(uint256 => OfferDetails) public offers;
    mapping(uint256 => CounterOfferDetails[]) public counterOffers;
    mapping(address => mapping(uint256 => uint256[])) public userOffers; // user -> tokenId -> offerIds
    mapping(address => uint256) public escrowBalances;
    mapping(address => bool) public approvedPaymentTokens;
    
    constructor(address _platformFeeReceiver) {
        platformFeeReceiver = _platformFeeReceiver;
        approvedPaymentTokens[address(0)] = true; // ETH approved by default
    }
    
    // ==================== Offer Creation ====================
    
    /**
     * Create offer on specific NFT
     * @param _nftContract NFT contract address
     * @param _tokenId Token ID
     * @param _seller Current NFT owner
     * @param _offerAmount Amount offering
     * @param _paymentToken Payment token (address(0) = ETH)
     * @param _durationDays Duration in days
     */
    function createOffer(
        address _nftContract,
        uint256 _tokenId,
        address _seller,
        uint256 _offerAmount,
        address _paymentToken,
        uint256 _durationDays
    ) external payable nonReentrant {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(_seller != address(0), "Invalid seller");
        require(_seller != msg.sender, "Cannot offer to yourself");
        require(_offerAmount > 0, "Offer amount must be > 0");
        require(approvedPaymentTokens[_paymentToken], "Payment token not approved");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        
        // Verify seller owns NFT
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == _seller,
            "Seller does not own NFT"
        );
        
        // Handle payment
        if (_paymentToken == address(0)) {
            require(msg.value == _offerAmount, "Incorrect ETH amount");
            escrowBalances[msg.sender] += msg.value;
        } else {
            require(msg.value == 0, "Do not send ETH for ERC20 offer");
            require(
                IERC20(_paymentToken).transferFrom(
                    msg.sender,
                    address(this),
                    _offerAmount
                ),
                "Token transfer failed"
            );
            escrowBalances[msg.sender] += _offerAmount;
        }
        
        // Create offer
        uint256 offerId = offerCounter++;
        uint256 expiresAt = block.timestamp + (_durationDays * 1 days);
        
        offers[offerId] = OfferDetails({
            offerId: offerId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            buyer: msg.sender,
            seller: _seller,
            offerAmount: _offerAmount,
            paymentToken: _paymentToken,
            expiresAt: expiresAt,
            status: OfferStatus.PENDING,
            createdAt: block.timestamp,
            respondedAt: 0,
            isCounterOffer: false,
            parentOfferId: 0
        });
        
        userOffers[msg.sender][_tokenId].push(offerId);
        
        emit OfferCreated(
            offerId,
            _nftContract,
            _tokenId,
            msg.sender,
            _seller,
            _offerAmount,
            _paymentToken,
            expiresAt
        );
    }
    
    // ==================== Offer Response ====================
    
    /**
     * Accept offer and transfer NFT
     */
    function acceptOffer(uint256 _offerId)
        external
        nonReentrant
    {
        OfferDetails storage offer = offers[_offerId];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(msg.sender == offer.seller, "Only seller can accept");
        require(block.timestamp < offer.expiresAt, "Offer expired");
        
        // Verify seller still owns NFT
        require(
            IERC721(offer.nftContract).ownerOf(offer.tokenId) == msg.sender,
            "You no longer own this NFT"
        );
        
        // Transfer NFT to buyer
        IERC721(offer.nftContract).transferFrom(
            msg.sender,
            offer.buyer,
            offer.tokenId
        );
        
        // Calculate and distribute payments
        uint256 feeAmount = (offer.offerAmount * platformFeePercentage) / 10000;
        uint256 sellerAmount = offer.offerAmount - feeAmount;
        
        // Remove from escrow
        escrowBalances[offer.buyer] -= offer.offerAmount;
        
        // Pay seller
        _transferPayment(
            offer.paymentToken,
            offer.seller,
            sellerAmount
        );
        
        // Pay platform fee
        _transferPayment(
            offer.paymentToken,
            platformFeeReceiver,
            feeAmount
        );
        
        // Update status
        offer.status = OfferStatus.ACCEPTED;
        offer.respondedAt = block.timestamp;
        
        emit OfferAccepted(
            _offerId,
            msg.sender,
            offer.buyer,
            offer.offerAmount,
            block.timestamp
        );
    }
    
    /**
     * Reject offer
     */
    function rejectOffer(uint256 _offerId)
        external
        nonReentrant
    {
        OfferDetails storage offer = offers[_offerId];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(
            msg.sender == offer.seller || msg.sender == offer.buyer,
            "Not authorized"
        );
        
        // Refund buyer
        _refundOffer(_offerId, offer);
        
        // Update status
        offer.status = OfferStatus.REJECTED;
        offer.respondedAt = block.timestamp;
        
        emit OfferRejected(_offerId, msg.sender, block.timestamp);
    }
    
    /**
     * Cancel offer
     */
    function cancelOffer(uint256 _offerId)
        external
        nonReentrant
    {
        OfferDetails storage offer = offers[_offerId];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(msg.sender == offer.buyer, "Only buyer can cancel");
        
        // Refund buyer
        _refundOffer(_offerId, offer);
        
        // Update status
        offer.status = OfferStatus.CANCELLED;
        offer.respondedAt = block.timestamp;
        
        emit OfferCancelled(_offerId, msg.sender, block.timestamp);
    }
    
    // ==================== Counter Offers ====================
    
    /**
     * Make counter-offer to existing offer
     */
    function makeCounterOffer(
        uint256 _offerId,
        uint256 _counterAmount,
        uint256 _durationDays
    ) external payable nonReentrant {
        OfferDetails storage offer = offers[_offerId];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(msg.sender == offer.seller, "Only seller can counter");
        require(block.timestamp < offer.expiresAt, "Offer expired");
        require(_counterAmount > 0, "Counter amount must be > 0");
        require(_durationDays > 0 && _durationDays <= 7, "Invalid counter duration");
        
        // Handle payment for counter-offer (seller locks their counter amount)
        if (offer.paymentToken == address(0)) {
            require(msg.value == _counterAmount, "Incorrect ETH amount");
            escrowBalances[msg.sender] += msg.value;
        } else {
            require(msg.value == 0, "Do not send ETH for ERC20 counter");
            require(
                IERC20(offer.paymentToken).transferFrom(
                    msg.sender,
                    address(this),
                    _counterAmount
                ),
                "Token transfer failed"
            );
            escrowBalances[msg.sender] += _counterAmount;
        }
        
        // Create counter-offer
        uint256 counterId = counterOfferCounter++;
        uint256 expiresAt = block.timestamp + (_durationDays * 1 days);
        
        counterOffers[_offerId].push(CounterOfferDetails({
            counterId: counterId,
            originalOfferId: _offerId,
            counterFrom: msg.sender,
            counterAmount: _counterAmount,
            expiresAt: expiresAt,
            status: OfferStatus.PENDING,
            createdAt: block.timestamp
        }));
        
        emit CounterOfferCreated(
            _offerId,
            counterId,
            msg.sender,
            _counterAmount,
            expiresAt
        );
    }
    
    /**
     * Accept counter-offer
     */
    function acceptCounterOffer(uint256 _offerId, uint256 _counterIndex)
        external
        nonReentrant
    {
        OfferDetails storage offer = offers[_offerId];
        CounterOfferDetails storage counter = counterOffers[_offerId][_counterIndex];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(counter.status == OfferStatus.PENDING, "Counter not pending");
        require(msg.sender == offer.buyer, "Only original buyer can accept counter");
        require(block.timestamp < counter.expiresAt, "Counter expired");
        
        // Verify seller still owns NFT
        require(
            IERC721(offer.nftContract).ownerOf(offer.tokenId) == counter.counterFrom,
            "Seller no longer owns NFT"
        );
        
        // Refund original offer from buyer
        _refundOffer(_offerId, offer);
        
        // Transfer NFT to buyer
        IERC721(offer.nftContract).transferFrom(
            counter.counterFrom,
            msg.sender,
            offer.tokenId
        );
        
        // Calculate and distribute counter-offer payments
        uint256 feeAmount = (counter.counterAmount * platformFeePercentage) / 10000;
        uint256 sellerAmount = counter.counterAmount - feeAmount;
        
        // Remove from escrow
        escrowBalances[counter.counterFrom] -= counter.counterAmount;
        
        // Pay seller
        _transferPayment(
            offer.paymentToken,
            counter.counterFrom,
            sellerAmount
        );
        
        // Pay platform fee
        _transferPayment(
            offer.paymentToken,
            platformFeeReceiver,
            feeAmount
        );
        
        // Update status
        offer.status = OfferStatus.ACCEPTED;
        counter.status = OfferStatus.ACCEPTED;
        offer.respondedAt = block.timestamp;
        
        emit OfferAccepted(
            _offerId,
            counter.counterFrom,
            msg.sender,
            counter.counterAmount,
            block.timestamp
        );
    }
    
    // ==================== Offer Management ====================
    
    /**
     * Increase offer amount
     */
    function increaseOfferAmount(uint256 _offerId, uint256 _additionalAmount)
        external
        payable
        nonReentrant
    {
        OfferDetails storage offer = offers[_offerId];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(msg.sender == offer.buyer, "Only buyer can increase");
        require(block.timestamp < offer.expiresAt, "Offer expired");
        require(_additionalAmount > 0, "Additional amount must be > 0");
        
        // Handle payment
        if (offer.paymentToken == address(0)) {
            require(msg.value == _additionalAmount, "Incorrect ETH amount");
            escrowBalances[msg.sender] += msg.value;
        } else {
            require(msg.value == 0, "Do not send ETH for ERC20");
            require(
                IERC20(offer.paymentToken).transferFrom(
                    msg.sender,
                    address(this),
                    _additionalAmount
                ),
                "Token transfer failed"
            );
            escrowBalances[msg.sender] += _additionalAmount;
        }
        
        uint256 newAmount = offer.offerAmount + _additionalAmount;
        offer.offerAmount = newAmount;
        
        emit OfferAmountIncreased(_offerId, newAmount, block.timestamp);
    }
    
    /**
     * Auto-expire old offers
     */
    function expireOffer(uint256 _offerId)
        external
    {
        OfferDetails storage offer = offers[_offerId];
        
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(block.timestamp >= offer.expiresAt, "Offer not expired");
        
        // Refund buyer
        _refundOffer(_offerId, offer);
        
        // Update status
        offer.status = OfferStatus.EXPIRED;
        
        emit OfferExpired(_offerId, block.timestamp);
    }
    
    /**
     * Internal: Refund offer amount to buyer
     */
    function _refundOffer(uint256 _offerId, OfferDetails storage offer)
        internal
    {
        escrowBalances[offer.buyer] -= offer.offerAmount;
        
        if (offer.paymentToken == address(0)) {
            (bool success, ) = offer.buyer.call{value: offer.offerAmount}("");
            require(success, "ETH refund failed");
        } else {
            require(
                IERC20(offer.paymentToken).transfer(offer.buyer, offer.offerAmount),
                "ERC20 refund failed"
            );
        }
    }
    
    /**
     * Internal: Transfer payment
     */
    function _transferPayment(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal {
        if (_amount == 0) return;
        
        if (_token == address(0)) {
            (bool success, ) = _recipient.call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(
                IERC20(_token).transfer(_recipient, _amount),
                "ERC20 transfer failed"
            );
        }
    }
    
    // ==================== View Functions ====================
    
    /**
     * Get offer details
     */
    function getOffer(uint256 _offerId)
        external
        view
        returns (OfferDetails memory)
    {
        return offers[_offerId];
    }
    
    /**
     * Get counter-offers for offer
     */
    function getCounterOffers(uint256 _offerId)
        external
        view
        returns (CounterOfferDetails[] memory)
    {
        return counterOffers[_offerId];
    }
    
    /**
     * Check if offer is active
     */
    function isOfferActive(uint256 _offerId)
        external
        view
        returns (bool)
    {
        OfferDetails storage offer = offers[_offerId];
        return offer.status == OfferStatus.PENDING && block.timestamp < offer.expiresAt;
    }
    
    /**
     * Get time until offer expires
     */
    function getTimeUntilExpiry(uint256 _offerId)
        external
        view
        returns (int256)
    {
        OfferDetails storage offer = offers[_offerId];
        return int256(offer.expiresAt) - int256(block.timestamp);
    }
    
    // ==================== Admin Functions ====================
    
    /**
     * Set platform fee
     */
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 2500, "Fee too high");
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
     * Set default offer duration
     */
    function setDefaultOfferDuration(uint256 _durationDays) external onlyOwner {
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        defaultOfferDuration = _durationDays * 1 days;
    }
    
    /**
     * Approve payment token
     */
    function approvePaymentToken(address _token) external onlyOwner {
        approvedPaymentTokens[_token] = true;
    }
    
    /**
     * Revoke payment token
     */
    function revokePaymentToken(address _token) external onlyOwner {
        approvedPaymentTokens[_token] = false;
    }
    
    // ==================== Emergency ====================
    
    /**
     * Emergency withdrawal (admin only)
     */
    function emergencyWithdraw(address _token, uint256 _amount)
        external
        onlyOwner
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
