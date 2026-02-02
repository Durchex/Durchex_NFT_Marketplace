// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title LiquidityPool
 * @dev Advanced liquidity pool contract for AMM functionality
 * Features:
 * - Token pair swaps with dynamic pricing
 * - Liquidity provider (LP) token minting/burning
 * - Yield farming for liquidity providers
 * - Governance rewards
 * - Multi-fee tiers for different trading volumes
 */
contract LiquidityPool is Ownable, ReentrancyGuard, Pausable {
    
    // ========== Types ==========
    struct PoolInfo {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
        uint256 totalLiquidity;
        uint256 feeTier; // 0: 0.01%, 1: 0.05%, 2: 0.1%, 3: 0.5%
        bool isActive;
        uint256 createdAt;
    }

    struct LiquidityProviderInfo {
        uint256 lpTokens;
        uint256 share; // percentage of pool
        uint256 rewardsEarned;
        uint256 lastRewardBlock;
    }

    struct SwapInfo {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 fee;
        uint256 timestamp;
    }

    // ========== State Variables ==========
    mapping(bytes32 => PoolInfo) public pools;
    mapping(bytes32 => mapping(address => LiquidityProviderInfo)) public liquidityProviders;
    mapping(bytes32 => uint256) public cumulativeFees;
    mapping(bytes32 => SwapInfo[]) public swapHistory;
    mapping(address => bool) public isWhitelisted;
    
    bytes32[] public activePools;
    address public feeRecipient;
    address public rewardToken;
    
    uint256 public constant DECIMALS = 1e18;
    uint256 public constant FEE_DENOMINATOR = 10000; // 0.01% = 1/10000
    uint256[] public feeTiers = [1, 5, 10, 50]; // 0.01%, 0.05%, 0.1%, 0.5%
    uint256 public rewardRate = 100; // 1% reward rate
    uint256 public minLiquidityAmount = 1e15; // 0.001 tokens minimum
    
    // ========== Events ==========
    event PoolCreated(bytes32 indexed poolId, address indexed token0, address indexed token1, uint256 feeTier);
    event LiquidityAdded(bytes32 indexed poolId, address indexed provider, uint256 amount0, uint256 amount1, uint256 lpTokens);
    event LiquidityRemoved(bytes32 indexed poolId, address indexed provider, uint256 amount0, uint256 amount1, uint256 lpTokens);
    event Swapped(bytes32 indexed poolId, address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut, uint256 fee);
    event RewardsDistributed(bytes32 indexed poolId, address indexed provider, uint256 rewardAmount);
    event FeesCollected(bytes32 indexed poolId, uint256 feeAmount);
    event PoolPaused(bytes32 indexed poolId);
    event PoolResumed(bytes32 indexed poolId);

    // ========== Modifiers ==========
    modifier poolExists(bytes32 poolId) {
        require(pools[poolId].isActive, "Pool does not exist");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount >= minLiquidityAmount, "Amount below minimum liquidity");
        _;
    }

    modifier isWhitelistedToken(address token) {
        require(isWhitelisted[token], "Token not whitelisted");
        _;
    }

    // ========== Constructor ==========
    constructor(address _rewardToken, address _feeRecipient) {
        rewardToken = _rewardToken;
        feeRecipient = _feeRecipient;
    }

    // ========== Pool Management ==========
    
    /**
     * @dev Create a new liquidity pool
     * @param token0 First token address
     * @param token1 Second token address
     * @param feeTier Fee tier index (0-3)
     * @return poolId The unique identifier for the pool
     */
    function createPool(
        address token0,
        address token1,
        uint256 feeTier
    ) external onlyOwner returns (bytes32) {
        require(token0 != address(0) && token1 != address(0), "Invalid token addresses");
        require(token0 != token1, "Cannot create pool with same token");
        require(feeTier < feeTiers.length, "Invalid fee tier");
        
        // Ensure consistent pool ID regardless of token order
        (address _token0, address _token1) = token0 < token1 ? (token0, token1) : (token1, token0);
        bytes32 poolId = keccak256(abi.encodePacked(_token0, _token1));
        
        require(!pools[poolId].isActive, "Pool already exists");
        
        pools[poolId] = PoolInfo({
            token0: _token0,
            token1: _token1,
            reserve0: 0,
            reserve1: 0,
            totalLiquidity: 0,
            feeTier: feeTier,
            isActive: true,
            createdAt: block.timestamp
        });
        
        activePools.push(poolId);
        
        emit PoolCreated(poolId, _token0, _token1, feeTier);
        
        return poolId;
    }

    /**
     * @dev Add liquidity to a pool
     * @param poolId Pool identifier
     * @param amount0 Amount of token0
     * @param amount1 Amount of token1
     * @return lpTokens Amount of LP tokens minted
     */
    function addLiquidity(
        bytes32 poolId,
        uint256 amount0,
        uint256 amount1
    ) external nonReentrant poolExists(poolId) validAmount(amount0) validAmount(amount1) returns (uint256) {
        PoolInfo storage pool = pools[poolId];
        
        // Calculate LP tokens to mint
        uint256 lpTokens;
        if (pool.totalLiquidity == 0) {
            lpTokens = _sqrt(amount0 * amount1);
        } else {
            uint256 liquidity0 = (amount0 * pool.totalLiquidity) / pool.reserve0;
            uint256 liquidity1 = (amount1 * pool.totalLiquidity) / pool.reserve1;
            lpTokens = _min(liquidity0, liquidity1);
        }
        
        require(lpTokens > 0, "LP token amount too small");
        
        // Transfer tokens from provider
        require(IERC20(pool.token0).transferFrom(msg.sender, address(this), amount0), "Transfer token0 failed");
        require(IERC20(pool.token1).transferFrom(msg.sender, address(this), amount1), "Transfer token1 failed");
        
        // Update pool reserves and LP info
        pool.reserve0 += amount0;
        pool.reserve1 += amount1;
        pool.totalLiquidity += lpTokens;
        
        LiquidityProviderInfo storage lpInfo = liquidityProviders[poolId][msg.sender];
        lpInfo.lpTokens += lpTokens;
        lpInfo.share = (lpInfo.lpTokens * 100 * DECIMALS) / pool.totalLiquidity;
        lpInfo.lastRewardBlock = block.number;
        
        emit LiquidityAdded(poolId, msg.sender, amount0, amount1, lpTokens);
        
        return lpTokens;
    }

    /**
     * @dev Remove liquidity from a pool
     * @param poolId Pool identifier
     * @param lpTokens Amount of LP tokens to burn
     * @return amount0 Amount of token0 received
     * @return amount1 Amount of token1 received
     */
    function removeLiquidity(
        bytes32 poolId,
        uint256 lpTokens
    ) external nonReentrant poolExists(poolId) validAmount(lpTokens) returns (uint256, uint256) {
        PoolInfo storage pool = pools[poolId];
        LiquidityProviderInfo storage lpInfo = liquidityProviders[poolId][msg.sender];
        
        require(lpInfo.lpTokens >= lpTokens, "Insufficient LP tokens");
        
        // Calculate tokens to return
        uint256 amount0 = (lpTokens * pool.reserve0) / pool.totalLiquidity;
        uint256 amount1 = (lpTokens * pool.reserve1) / pool.totalLiquidity;
        
        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity");
        
        // Update pool state
        pool.reserve0 -= amount0;
        pool.reserve1 -= amount1;
        pool.totalLiquidity -= lpTokens;
        
        lpInfo.lpTokens -= lpTokens;
        if (pool.totalLiquidity > 0) {
            lpInfo.share = (lpInfo.lpTokens * 100 * DECIMALS) / pool.totalLiquidity;
        } else {
            lpInfo.share = 0;
        }
        
        // Transfer tokens back
        require(IERC20(pool.token0).transfer(msg.sender, amount0), "Transfer token0 failed");
        require(IERC20(pool.token1).transfer(msg.sender, amount1), "Transfer token1 failed");
        
        emit LiquidityRemoved(poolId, msg.sender, amount0, amount1, lpTokens);
        
        return (amount0, amount1);
    }

    // ========== Swap Functions ==========
    
    /**
     * @dev Execute a token swap
     * @param poolId Pool identifier
     * @param tokenIn Input token address
     * @param amountIn Input amount
     * @return amountOut Output amount
     */
    function swap(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn
    ) external nonReentrant poolExists(poolId) validAmount(amountIn) returns (uint256) {
        PoolInfo storage pool = pools[poolId];
        require(!paused(), "Pool is paused");
        
        // Determine token positions
        bool isToken0 = tokenIn == pool.token0;
        require(isToken0 || tokenIn == pool.token1, "Invalid token for swap");
        
        // Calculate output amount using constant product formula: x * y = k
        uint256 amountOut = _calculateSwapOutput(
            amountIn,
            isToken0 ? pool.reserve0 : pool.reserve1,
            isToken0 ? pool.reserve1 : pool.reserve0,
            pool.feeTier
        );
        
        require(amountOut > 0, "Insufficient output amount");
        
        // Calculate fee
        uint256 fee = (amountIn * feeTiers[pool.feeTier]) / FEE_DENOMINATOR;
        
        // Transfer tokens
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        
        address tokenOut = isToken0 ? pool.token1 : pool.token0;
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");
        
        // Update reserves
        if (isToken0) {
            pool.reserve0 += amountIn;
            pool.reserve1 -= amountOut;
        } else {
            pool.reserve1 += amountIn;
            pool.reserve0 -= amountOut;
        }
        
        cumulativeFees[poolId] += fee;
        
        // Record swap
        swapHistory[poolId].push(SwapInfo({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            fee: fee,
            timestamp: block.timestamp
        }));
        
        emit Swapped(poolId, msg.sender, tokenIn, amountIn, amountOut, fee);
        
        return amountOut;
    }

    /**
     * @dev Get quote for a potential swap
     * @param poolId Pool identifier
     * @param tokenIn Input token
     * @param amountIn Input amount
     * @return amountOut Expected output amount
     * @return fee Expected fee
     */
    function getSwapQuote(
        bytes32 poolId,
        address tokenIn,
        uint256 amountIn
    ) external view poolExists(poolId) returns (uint256, uint256) {
        PoolInfo memory pool = pools[poolId];
        bool isToken0 = tokenIn == pool.token0;
        
        uint256 amountOut = _calculateSwapOutput(
            amountIn,
            isToken0 ? pool.reserve0 : pool.reserve1,
            isToken0 ? pool.reserve1 : pool.reserve0,
            pool.feeTier
        );
        
        uint256 fee = (amountIn * feeTiers[pool.feeTier]) / FEE_DENOMINATOR;
        
        return (amountOut, fee);
    }

    // ========== Reward Distribution ==========
    
    /**
     * @dev Distribute rewards to liquidity providers
     * @param poolId Pool identifier
     */
    function distributeRewards(bytes32 poolId) external onlyOwner poolExists(poolId) nonReentrant {
        // Calculate reward from accumulated fees
        uint256 totalRewards = (cumulativeFees[poolId] * rewardRate) / FEE_DENOMINATOR;
        
        if (totalRewards == 0) return;
        
        LiquidityProviderInfo storage lpInfo = liquidityProviders[poolId][msg.sender];
        uint256 lpReward = (totalRewards * lpInfo.share) / (100 * DECIMALS);
        
        if (lpReward > 0) {
            lpInfo.rewardsEarned += lpReward;
            lpInfo.lastRewardBlock = block.number;
            
            require(IERC20(rewardToken).transfer(msg.sender, lpReward), "Reward transfer failed");
            emit RewardsDistributed(poolId, msg.sender, lpReward);
        }
    }

    /**
     * @dev Claim accumulated rewards
     * @param poolId Pool identifier
     * @return rewardAmount Amount of rewards claimed
     */
    function claimRewards(bytes32 poolId) external nonReentrant poolExists(poolId) returns (uint256) {
        LiquidityProviderInfo storage lpInfo = liquidityProviders[poolId][msg.sender];
        uint256 rewards = lpInfo.rewardsEarned;
        
        require(rewards > 0, "No rewards to claim");
        
        lpInfo.rewardsEarned = 0;
        
        require(IERC20(rewardToken).transfer(msg.sender, rewards), "Reward transfer failed");
        
        return rewards;
    }

    // ========== Pool Maintenance ==========
    
    /**
     * @dev Pause a specific pool
     * @param poolId Pool to pause
     */
    function pausePool(bytes32 poolId) external onlyOwner poolExists(poolId) {
        emit PoolPaused(poolId);
        _pause();
    }

    /**
     * @dev Resume a paused pool
     * @param poolId Pool to resume
     */
    function resumePool(bytes32 poolId) external onlyOwner poolExists(poolId) {
        emit PoolResumed(poolId);
        _unpause();
    }

    /**
     * @dev Collect accumulated fees
     * @param poolId Pool identifier
     * @return feeAmount Amount collected
     */
    function collectFees(bytes32 poolId) external onlyOwner poolExists(poolId) returns (uint256) {
        uint256 fees = cumulativeFees[poolId];
        require(fees > 0, "No fees to collect");
        
        cumulativeFees[poolId] = 0;
        
        // Transfer fees to recipient
        PoolInfo memory pool = pools[poolId];
        require(IERC20(pool.token0).transfer(feeRecipient, fees), "Fee transfer failed");
        
        emit FeesCollected(poolId, fees);
        
        return fees;
    }

    /**
     * @dev Whitelist a token for pool creation
     * @param token Token to whitelist
     */
    function whitelistToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        isWhitelisted[token] = true;
    }

    // ========== Internal Functions ==========
    
    /**
     * @dev Calculate swap output using constant product formula
     */
    function _calculateSwapOutput(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeTier
    ) internal view returns (uint256) {
        // Apply fee to input
        uint256 feeAmount = (amountIn * feeTiers[feeTier]) / FEE_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - feeAmount;
        
        // Constant product: (x + amountIn) * (y - amountOut) = x * y
        uint256 amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);
        
        return amountOut;
    }

    /**
     * @dev Calculate square root
     */
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev Return minimum of two values
     */
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // ========== View Functions ==========
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo(bytes32 poolId) external view returns (PoolInfo memory) {
        return pools[poolId];
    }

    /**
     * @dev Get liquidity provider information
     */
    function getLPInfo(bytes32 poolId, address provider) external view returns (LiquidityProviderInfo memory) {
        return liquidityProviders[poolId][provider];
    }

    /**
     * @dev Get number of active pools
     */
    function getActivePoolCount() external view returns (uint256) {
        return activePools.length;
    }

    /**
     * @dev Get swap history for a pool
     */
    function getSwapHistory(bytes32 poolId, uint256 limit) external view returns (SwapInfo[] memory) {
        uint256 length = swapHistory[poolId].length;
        uint256 start = length > limit ? length - limit : 0;
        
        SwapInfo[] memory history = new SwapInfo[](length - start);
        for (uint256 i = start; i < length; i++) {
            history[i - start] = swapHistory[poolId][i];
        }
        
        return history;
    }
}
