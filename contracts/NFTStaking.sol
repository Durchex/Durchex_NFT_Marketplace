// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTStaking
 * @dev Staking contract for NFT holders to earn rewards
 */
contract NFTStaking is ReentrancyGuard, Ownable {
    // Reward token
    IERC20 public rewardToken;

    // NFT collection
    IERC721 public nftCollection;

    // Staking configuration
    struct StakingConfig {
        uint256 dailyReward; // Reward per NFT per day (in wei)
        uint256 minimumStakingPeriod; // Minimum time to stake (in seconds)
        uint256 earlyUnstakeFee; // Fee for early unstaking (in bps, e.g., 500 = 5%)
        uint256 totalRewardsPool; // Total rewards allocated
        bool paused;
    }

    StakingConfig public config;

    // Staker info
    struct Staker {
        uint256[] stakedTokens;
        uint256 totalRewards;
        uint256 claimedRewards;
        uint256 lastClaimTime;
    }

    // Tier configuration
    struct Tier {
        uint256 minTokens; // Minimum tokens to hold for tier
        uint256 boostPercentage; // Bonus reward percentage
    }

    // Mappings
    mapping(address => Staker) public stakers;
    mapping(uint256 => address) public tokenOwner;
    mapping(uint256 => uint256) public stakedTime;
    mapping(uint256 => uint256) public stakedRewards;
    mapping(address => Tier) public userTier;

    // Tiers
    Tier[] public stakingTiers;

    // Statistics
    uint256 public totalStakedTokens;
    uint256 public totalDistributedRewards;
    uint256 public totalActiveStakers;

    // Events
    event TokenStaked(
        address indexed staker,
        uint256[] tokenIds,
        uint256 timestamp
    );
    event TokenUnstaked(
        address indexed staker,
        uint256[] tokenIds,
        uint256 penalty,
        uint256 timestamp
    );
    event RewardsClaimed(address indexed staker, uint256 rewards, uint256 timestamp);
    event RewardsAccrued(address indexed staker, uint256 amount, uint256 timestamp);
    event ConfigUpdated(uint256 dailyReward, uint256 minimumPeriod, uint256 fee);
    event RewardsPoolFunded(uint256 amount);
    event TierCreated(uint256 minTokens, uint256 boostPercentage);

    constructor(
        address _nftCollection,
        address _rewardToken,
        uint256 _dailyReward,
        uint256 _minimumPeriod
    ) {
        require(_nftCollection != address(0), "Invalid NFT collection");
        require(_rewardToken != address(0), "Invalid reward token");

        nftCollection = IERC721(_nftCollection);
        rewardToken = IERC20(_rewardToken);

        config = StakingConfig({
            dailyReward: _dailyReward,
            minimumStakingPeriod: _minimumPeriod,
            earlyUnstakeFee: 500, // 5%
            totalRewardsPool: 0,
            paused: false,
        });

        // Initialize default tiers
        stakingTiers.push(Tier({minTokens: 1, boostPercentage: 0})); // No boost for 1 token
        stakingTiers.push(Tier({minTokens: 5, boostPercentage: 1000})); // 10% boost for 5 tokens
        stakingTiers.push(Tier({minTokens: 10, boostPercentage: 2000})); // 20% boost for 10 tokens
        stakingTiers.push(Tier({minTokens: 25, boostPercentage: 5000})); // 50% boost for 25 tokens
    }

    /**
     * @dev Stake NFT tokens
     */
    function stakeTokens(uint256[] calldata _tokenIds) external nonReentrant {
        require(!config.paused, "Staking is paused");
        require(_tokenIds.length > 0, "Must stake at least 1 token");

        Staker storage staker = stakers[msg.sender];
        bool isNewStaker = staker.stakedTokens.length == 0;

        // Transfer tokens from user to contract
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];

            // Transfer NFT to contract
            nftCollection.transferFrom(msg.sender, address(this), tokenId);

            // Record ownership and staking time
            tokenOwner[tokenId] = msg.sender;
            stakedTime[tokenId] = block.timestamp;
            stakedRewards[tokenId] = 0;

            staker.stakedTokens.push(tokenId);
        }

        if (isNewStaker) {
            totalActiveStakers++;
            staker.lastClaimTime = block.timestamp;
        }

        totalStakedTokens += _tokenIds.length;

        // Update tier
        updateUserTier(msg.sender);

        emit TokenStaked(msg.sender, _tokenIds, block.timestamp);
    }

    /**
     * @dev Unstake NFT tokens
     */
    function unstakeTokens(uint256[] calldata _tokenIds) external nonReentrant {
        require(_tokenIds.length > 0, "Must unstake at least 1 token");

        Staker storage staker = stakers[msg.sender];
        uint256 totalPenalty = 0;

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(tokenOwner[tokenId] == msg.sender, "Not token owner");

            uint256 stakingDuration = block.timestamp - stakedTime[tokenId];
            uint256 penalty = 0;

            // Apply early unstaking fee
            if (stakingDuration < config.minimumStakingPeriod) {
                uint256 rewards = stakedRewards[tokenId];
                penalty = (rewards * config.earlyUnstakeFee) / 10000;
                totalPenalty += penalty;
            }

            // Remove from staked tokens
            removeToken(staker, tokenId);

            // Transfer NFT back to user
            nftCollection.transferFrom(address(this), msg.sender, tokenId);

            // Clean up
            delete tokenOwner[tokenId];
            delete stakedTime[tokenId];
            delete stakedRewards[tokenId];
        }

        totalStakedTokens -= _tokenIds.length;

        // Update tier
        updateUserTier(msg.sender);

        // Update active stakers
        if (staker.stakedTokens.length == 0) {
            totalActiveStakers--;
        }

        emit TokenUnstaked(msg.sender, _tokenIds, totalPenalty, block.timestamp);
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        Staker storage staker = stakers[msg.sender];
        require(staker.stakedTokens.length > 0, "No staked tokens");

        // Calculate pending rewards
        uint256 pendingRewards = calculatePendingRewards(msg.sender);
        require(pendingRewards > 0, "No rewards to claim");

        // Update rewards
        staker.totalRewards += pendingRewards;
        staker.claimedRewards += pendingRewards;
        staker.lastClaimTime = block.timestamp;
        totalDistributedRewards += pendingRewards;

        // Reset token rewards
        for (uint256 i = 0; i < staker.stakedTokens.length; i++) {
            stakedRewards[staker.stakedTokens[i]] = 0;
        }

        // Transfer rewards to user
        require(
            rewardToken.transfer(msg.sender, pendingRewards),
            "Reward transfer failed"
        );

        emit RewardsClaimed(msg.sender, pendingRewards, block.timestamp);
    }

    /**
     * @dev Calculate pending rewards for a staker
     */
    function calculatePendingRewards(address _staker) public view returns (uint256) {
        Staker memory staker = stakers[_staker];
        if (staker.stakedTokens.length == 0) return 0;

        uint256 totalRewards = 0;
        uint256 tierBoost = getUserTierBoost(_staker);

        for (uint256 i = 0; i < staker.stakedTokens.length; i++) {
            uint256 tokenId = staker.stakedTokens[i];
            uint256 stakingDuration = block.timestamp - stakedTime[tokenId];
            uint256 daysStaked = stakingDuration / 1 days;

            // Calculate base reward
            uint256 baseReward = daysStaked * config.dailyReward;

            // Apply tier boost
            uint256 boost = (baseReward * tierBoost) / 10000;
            uint256 reward = baseReward + boost;

            totalRewards += reward - stakedRewards[tokenId];
        }

        return totalRewards;
    }

    /**
     * @dev Get user tier boost
     */
    function getUserTierBoost(address _staker) public view returns (uint256) {
        uint256 stakedCount = stakers[_staker].stakedTokens.length;

        for (uint256 i = stakingTiers.length; i > 0; i--) {
            if (stakedCount >= stakingTiers[i - 1].minTokens) {
                return stakingTiers[i - 1].boostPercentage;
            }
        }

        return 0;
    }

    /**
     * @dev Update user tier based on staked count
     */
    function updateUserTier(address _staker) internal {
        uint256 stakedCount = stakers[_staker].stakedTokens.length;

        for (uint256 i = stakingTiers.length; i > 0; i--) {
            if (stakedCount >= stakingTiers[i - 1].minTokens) {
                userTier[_staker] = stakingTiers[i - 1];
                return;
            }
        }
    }

    /**
     * @dev Remove token from staked array
     */
    function removeToken(Staker storage staker, uint256 tokenId) internal {
        for (uint256 i = 0; i < staker.stakedTokens.length; i++) {
            if (staker.stakedTokens[i] == tokenId) {
                staker.stakedTokens[i] = staker.stakedTokens[staker.stakedTokens.length - 1];
                staker.stakedTokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Fund rewards pool
     */
    function fundRewardsPool(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be > 0");

        rewardToken.transferFrom(msg.sender, address(this), _amount);
        config.totalRewardsPool += _amount;

        emit RewardsPoolFunded(_amount);
    }

    /**
     * @dev Update configuration
     */
    function updateConfig(
        uint256 _dailyReward,
        uint256 _minimumPeriod,
        uint256 _earlyUnstakeFee
    ) external onlyOwner {
        require(_earlyUnstakeFee <= 10000, "Fee too high");

        config.dailyReward = _dailyReward;
        config.minimumStakingPeriod = _minimumPeriod;
        config.earlyUnstakeFee = _earlyUnstakeFee;

        emit ConfigUpdated(_dailyReward, _minimumPeriod, _earlyUnstakeFee);
    }

    /**
     * @dev Add staking tier
     */
    function addTier(uint256 _minTokens, uint256 _boostPercentage) external onlyOwner {
        require(_boostPercentage <= 100000, "Boost too high"); // Max 1000%

        stakingTiers.push(Tier({minTokens: _minTokens, boostPercentage: _boostPercentage}));

        emit TierCreated(_minTokens, _boostPercentage);
    }

    /**
     * @dev Pause staking
     */
    function setPaused(bool _paused) external onlyOwner {
        config.paused = _paused;
    }

    /**
     * @dev Get staker info
     */
    function getStakerInfo(address _staker)
        external
        view
        returns (
            uint256[] memory stakedTokens,
            uint256 totalRewards,
            uint256 claimedRewards,
            uint256 pendingRewards
        )
    {
        Staker memory staker = stakers[_staker];
        return (
            staker.stakedTokens,
            staker.totalRewards,
            staker.claimedRewards,
            calculatePendingRewards(_staker)
        );
    }

    /**
     * @dev Get staking statistics
     */
    function getStats()
        external
        view
        returns (
            uint256 totalStaked,
            uint256 activeStakers,
            uint256 distributed,
            uint256 poolBalance
        )
    {
        return (
            totalStakedTokens,
            totalActiveStakers,
            totalDistributedRewards,
            rewardToken.balanceOf(address(this))
        );
    }
}
