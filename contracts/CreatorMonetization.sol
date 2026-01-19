// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CreatorMonetization
 * @dev Creator monetization platform with tipping, subscriptions, and merchandise
 * Features:
 * - Direct creator tipping system
 * - Subscription tier system
 * - NFT merchandise sales
 * - Referral rewards
 * - Creator revenue splitting
 */
contract CreatorMonetization is Ownable, ReentrancyGuard {
    
    // ========== Types ==========
    struct Creator {
        address creatorAddress;
        string name;
        string bio;
        string profileURI;
        uint256 totalEarnings;
        uint256 totalTips;
        uint256 totalSubscriptionRevenue;
        uint256 totalMerchandiseRevenue;
        bool isVerified;
        uint256 joinedAt;
    }

    struct SubscriptionTier {
        uint256 tierId;
        address creatorAddress;
        string tierName;
        uint256 monthlyPrice;
        string benefits;
        uint256 totalSubscribers;
        bool isActive;
    }

    struct Subscription {
        address subscriber;
        address creatorAddress;
        uint256 tierId;
        uint256 subscriptionStartDate;
        uint256 nextRenewalDate;
        bool isActive;
        uint256 totalPaid;
    }

    struct Merchandise {
        uint256 merchId;
        address creatorAddress;
        string name;
        string description;
        uint256 price;
        uint256 supply;
        uint256 sold;
        string ipfsURI;
        bool isActive;
        uint256 createdAt;
    }

    struct Referral {
        address referrer;
        address referred;
        uint256 commissionEarned;
        uint256 referralCount;
        uint256 tier;
    }

    struct Tip {
        address tipper;
        address creator;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    // ========== State Variables ==========
    mapping(address => Creator) public creators;
    mapping(address => SubscriptionTier[]) public creatorSubscriptionTiers;
    mapping(address => Subscription[]) public userSubscriptions;
    mapping(uint256 => Merchandise) public merchandises;
    mapping(address => Referral) public referrals;
    mapping(address => Tip[]) public tipHistory;
    
    address[] public creatorList;
    uint256 public nextMerchandiseId = 1;
    address public paymentToken;
    address public treasuryAddress;
    
    uint256 public platformFeePercentage = 500; // 5%
    uint256 public referralCommissionPercentage = 1000; // 10%
    uint256 public referralTierThresholds = [10, 50, 100]; // Tier thresholds
    
    uint256 public totalTipsDistributed = 0;
    uint256 public totalSubscriptionRevenue = 0;
    uint256 public totalMerchandiseSales = 0;

    // ========== Events ==========
    event CreatorRegistered(address indexed creator, string name);
    event SubscriptionTierCreated(address indexed creator, uint256 tierId, string tierName, uint256 price);
    event SubscriptionPurchased(address indexed subscriber, address indexed creator, uint256 tierId);
    event SubscriptionCancelled(address indexed subscriber, address indexed creator, uint256 tierId);
    event TipSent(address indexed tipper, address indexed creator, uint256 amount, string message);
    event MerchandiseCreated(uint256 indexed merchId, address indexed creator, string name, uint256 price);
    event MerchandiseSold(uint256 indexed merchId, address indexed buyer, uint256 quantity);
    event ReferralRewardEarned(address indexed referrer, address indexed referred, uint256 reward);
    event CreatorWithdrawal(address indexed creator, uint256 amount);

    // ========== Modifiers ==========
    modifier onlyCreator(address creator) {
        require(creators[creator].creatorAddress != address(0), "Creator not registered");
        _;
    }

    modifier creatorExists(address creator) {
        require(creators[creator].creatorAddress == address(0) || creators[creator].creatorAddress != address(0), "Check creator");
        _;
    }

    // ========== Constructor ==========
    constructor(address _paymentToken, address _treasuryAddress) {
        paymentToken = _paymentToken;
        treasuryAddress = _treasuryAddress;
    }

    // ========== Creator Management ==========

    /**
     * @dev Register as a creator
     */
    function registerCreator(
        string memory _name,
        string memory _bio,
        string memory _profileURI
    ) external returns (address) {
        require(creators[msg.sender].creatorAddress == address(0), "Already registered");
        require(bytes(_name).length > 0, "Name required");
        
        creators[msg.sender] = Creator({
            creatorAddress: msg.sender,
            name: _name,
            bio: _bio,
            profileURI: _profileURI,
            totalEarnings: 0,
            totalTips: 0,
            totalSubscriptionRevenue: 0,
            totalMerchandiseRevenue: 0,
            isVerified: false,
            joinedAt: block.timestamp
        });
        
        creatorList.push(msg.sender);
        
        emit CreatorRegistered(msg.sender, _name);
        return msg.sender;
    }

    /**
     * @dev Verify a creator (admin only)
     */
    function verifyCreator(address creator) external onlyOwner onlyCreator(creator) {
        creators[creator].isVerified = true;
    }

    /**
     * @dev Update creator profile
     */
    function updateCreatorProfile(
        string memory _bio,
        string memory _profileURI
    ) external onlyCreator(msg.sender) {
        creators[msg.sender].bio = _bio;
        creators[msg.sender].profileURI = _profileURI;
    }

    // ========== Tipping System ==========

    /**
     * @dev Send a tip to creator
     */
    function sendTip(
        address creator,
        uint256 amount,
        string memory message
    ) external nonReentrant onlyCreator(creator) {
        require(amount > 0, "Tip amount must be positive");
        require(msg.sender != creator, "Cannot tip yourself");
        
        // Transfer tokens from tipper
        require(IERC20(paymentToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate fees
        uint256 platformFee = (amount * platformFeePercentage) / 10000;
        uint256 creatorAmount = amount - platformFee;
        
        // Update creator earnings
        creators[creator].totalEarnings += creatorAmount;
        creators[creator].totalTips += creatorAmount;
        
        // Record tip
        tipHistory[creator].push(Tip({
            tipper: msg.sender,
            creator: creator,
            amount: creatorAmount,
            message: message,
            timestamp: block.timestamp
        }));
        
        totalTipsDistributed += creatorAmount;
        
        // Transfer to treasury
        if (platformFee > 0) {
            require(IERC20(paymentToken).transfer(treasuryAddress, platformFee), "Fee transfer failed");
        }
        
        emit TipSent(msg.sender, creator, creatorAmount, message);
    }

    // ========== Subscription System ==========

    /**
     * @dev Create subscription tier
     */
    function createSubscriptionTier(
        string memory tierName,
        uint256 monthlyPrice,
        string memory benefits
    ) external onlyCreator(msg.sender) {
        require(monthlyPrice > 0, "Price must be positive");
        
        uint256 tierId = creatorSubscriptionTiers[msg.sender].length;
        
        creatorSubscriptionTiers[msg.sender].push(SubscriptionTier({
            tierId: tierId,
            creatorAddress: msg.sender,
            tierName: tierName,
            monthlyPrice: monthlyPrice,
            benefits: benefits,
            totalSubscribers: 0,
            isActive: true
        }));
        
        emit SubscriptionTierCreated(msg.sender, tierId, tierName, monthlyPrice);
    }

    /**
     * @dev Subscribe to creator tier
     */
    function subscribe(address creator, uint256 tierId) external nonReentrant onlyCreator(creator) {
        require(tierId < creatorSubscriptionTiers[creator].length, "Invalid tier");
        
        SubscriptionTier storage tier = creatorSubscriptionTiers[creator][tierId];
        require(tier.isActive, "Tier not active");
        
        // Transfer subscription fee
        uint256 price = tier.monthlyPrice;
        require(IERC20(paymentToken).transferFrom(msg.sender, address(this), price), "Payment failed");
        
        // Calculate fees
        uint256 platformFee = (price * platformFeePercentage) / 10000;
        uint256 creatorAmount = price - platformFee;
        
        // Update creator earnings
        creators[creator].totalEarnings += creatorAmount;
        creators[creator].totalSubscriptionRevenue += creatorAmount;
        tier.totalSubscribers++;
        
        // Create subscription record
        userSubscriptions[msg.sender].push(Subscription({
            subscriber: msg.sender,
            creatorAddress: creator,
            tierId: tierId,
            subscriptionStartDate: block.timestamp,
            nextRenewalDate: block.timestamp + 30 days,
            isActive: true,
            totalPaid: price
        }));
        
        totalSubscriptionRevenue += creatorAmount;
        
        // Pay platform fee
        if (platformFee > 0) {
            require(IERC20(paymentToken).transfer(treasuryAddress, platformFee), "Fee transfer failed");
        }
        
        emit SubscriptionPurchased(msg.sender, creator, tierId);
    }

    /**
     * @dev Cancel subscription
     */
    function cancelSubscription(address creator, uint256 subscriptionIndex) external {
        require(subscriptionIndex < userSubscriptions[msg.sender].length, "Invalid subscription");
        
        Subscription storage sub = userSubscriptions[msg.sender][subscriptionIndex];
        require(sub.creatorAddress == creator, "Subscription mismatch");
        require(sub.isActive, "Already cancelled");
        
        sub.isActive = false;
        
        // Reduce subscriber count
        SubscriptionTier storage tier = creatorSubscriptionTiers[creator][sub.tierId];
        if (tier.totalSubscribers > 0) {
            tier.totalSubscribers--;
        }
        
        emit SubscriptionCancelled(msg.sender, creator, sub.tierId);
    }

    // ========== Merchandise System ==========

    /**
     * @dev Create merchandise item
     */
    function createMerchandise(
        string memory name,
        string memory description,
        uint256 price,
        uint256 supply,
        string memory ipfsURI
    ) external onlyCreator(msg.sender) returns (uint256) {
        require(price > 0, "Price required");
        require(supply > 0, "Supply required");
        
        uint256 merchId = nextMerchandiseId++;
        
        merchandises[merchId] = Merchandise({
            merchId: merchId,
            creatorAddress: msg.sender,
            name: name,
            description: description,
            price: price,
            supply: supply,
            sold: 0,
            ipfsURI: ipfsURI,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit MerchandiseCreated(merchId, msg.sender, name, price);
        return merchId;
    }

    /**
     * @dev Purchase merchandise
     */
    function purchaseMerchandise(uint256 merchId, uint256 quantity) external nonReentrant {
        Merchandise storage merch = merchandises[merchId];
        require(merch.isActive, "Merchandise not available");
        require(merch.sold + quantity <= merch.supply, "Insufficient stock");
        
        uint256 totalPrice = merch.price * quantity;
        
        // Transfer payment
        require(IERC20(paymentToken).transferFrom(msg.sender, address(this), totalPrice), "Payment failed");
        
        // Calculate fees
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 creatorAmount = totalPrice - platformFee;
        
        // Update creator earnings
        address creator = merch.creatorAddress;
        creators[creator].totalEarnings += creatorAmount;
        creators[creator].totalMerchandiseRevenue += creatorAmount;
        
        merch.sold += quantity;
        totalMerchandiseSales += creatorAmount;
        
        // Pay platform fee
        if (platformFee > 0) {
            require(IERC20(paymentToken).transfer(treasuryAddress, platformFee), "Fee transfer failed");
        }
        
        emit MerchandiseSold(merchId, msg.sender, quantity);
    }

    // ========== Referral System ==========

    /**
     * @dev Set referral code for user
     */
    function setReferral(address referrer) external {
        if (referrals[msg.sender].referrer == address(0)) {
            referrals[msg.sender].referrer = referrer;
            referrals[msg.sender].tier = 0;
        }
    }

    /**
     * @dev Distribute referral reward
     */
    function distributeReferralReward(address user, uint256 purchaseAmount) internal {
        address referrer = referrals[user].referrer;
        if (referrer != address(0)) {
            uint256 reward = (purchaseAmount * referralCommissionPercentage) / 10000;
            referrals[referrer].commissionEarned += reward;
            referrals[referrer].referralCount++;
            
            emit ReferralRewardEarned(referrer, user, reward);
        }
    }

    // ========== Withdrawal System ==========

    /**
     * @dev Withdraw creator earnings
     */
    function withdrawEarnings() external nonReentrant onlyCreator(msg.sender) {
        Creator storage creator = creators[msg.sender];
        uint256 amount = creator.totalEarnings;
        
        require(amount > 0, "No earnings to withdraw");
        
        creator.totalEarnings = 0;
        
        require(IERC20(paymentToken).transfer(msg.sender, amount), "Withdrawal failed");
        
        emit CreatorWithdrawal(msg.sender, amount);
    }

    // ========== View Functions ==========

    /**
     * @dev Get creator info
     */
    function getCreatorInfo(address creator) external view returns (Creator memory) {
        return creators[creator];
    }

    /**
     * @dev Get subscription tiers for creator
     */
    function getSubscriptionTiers(address creator) external view returns (SubscriptionTier[] memory) {
        return creatorSubscriptionTiers[creator];
    }

    /**
     * @dev Get user subscriptions
     */
    function getUserSubscriptions(address user) external view returns (Subscription[] memory) {
        return userSubscriptions[user];
    }

    /**
     * @dev Get tip history
     */
    function getTipHistory(address creator, uint256 limit) external view returns (Tip[] memory) {
        Tip[] memory tips = tipHistory[creator];
        uint256 length = tips.length > limit ? limit : tips.length;
        Tip[] memory result = new Tip[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = tips[tips.length - 1 - i];
        }
        
        return result;
    }

    /**
     * @dev Get creator count
     */
    function getCreatorCount() external view returns (uint256) {
        return creatorList.length;
    }

    /**
     * @dev Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 totalCreators,
        uint256 totalTips,
        uint256 totalSubscriptionRevenue,
        uint256 totalMerchandiseSales
    ) {
        return (
            creatorList.length,
            totalTipsDistributed,
            totalSubscriptionRevenue,
            totalMerchandiseSales
        );
    }
}
