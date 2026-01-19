const logger = require('../../utils/logger');
const ethers = require('ethers');

class StakingService {
  constructor() {
    this.stakingABI = require('../../contracts/abi/NFTStaking.json');
  }

  /**
   * Calculate rewards for staker
   */
  async calculateRewards(stakerAddress, stakingContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        stakingContractAddress,
        this.stakingABI,
        provider
      );

      const pendingRewards = await contract.calculatePendingRewards(stakerAddress);
      return ethers.formatEther(pendingRewards);
    } catch (error) {
      logger.error('Error calculating rewards:', error);
      throw error;
    }
  }

  /**
   * Get staker information
   */
  async getStakerInfo(stakerAddress, stakingContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        stakingContractAddress,
        this.stakingABI,
        provider
      );

      const [stakedTokens, totalRewards, claimedRewards, pendingRewards] =
        await contract.getStakerInfo(stakerAddress);

      return {
        stakedTokens: stakedTokens.map((id) => id.toString()),
        totalRewards: ethers.formatEther(totalRewards),
        claimedRewards: ethers.formatEther(claimedRewards),
        pendingRewards: ethers.formatEther(pendingRewards),
        stakedCount: stakedTokens.length,
      };
    } catch (error) {
      logger.error('Error fetching staker info:', error);
      throw error;
    }
  }

  /**
   * Get user tier and boost
   */
  async getUserTier(stakerAddress, stakingContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        stakingContractAddress,
        this.stakingABI,
        provider
      );

      const stakerInfo = await this.getStakerInfo(
        stakerAddress,
        stakingContractAddress,
        provider
      );
      const tierBoost = await contract.getUserTierBoost(stakerAddress);

      const tiers = [
        { name: 'Bronze', minTokens: 1, boostPercentage: 0 },
        { name: 'Silver', minTokens: 5, boostPercentage: 10 },
        { name: 'Gold', minTokens: 10, boostPercentage: 20 },
        { name: 'Platinum', minTokens: 25, boostPercentage: 50 },
      ];

      const currentTier = tiers.find(
        (t) => stakerInfo.stakedCount >= t.minTokens
      ) || tiers[0];

      return {
        tier: currentTier.name,
        boostPercentage: tierBoost.toNumber() / 100,
        stakedCount: stakerInfo.stakedCount,
        nextTierRequires:
          currentTier.minTokens < 25
            ? tiers.find((t) => t.minTokens > currentTier.minTokens)?.minTokens || 25
            : null,
      };
    } catch (error) {
      logger.error('Error fetching user tier:', error);
      throw error;
    }
  }

  /**
   * Calculate APY
   */
  calculateAPY(dailyReward, nftPrice, tierBoost = 0) {
    try {
      // APY = (Daily Reward * 365 * (1 + Tier Boost) / NFT Price) * 100
      const yearlyReward = dailyReward * 365;
      const boostedReward = yearlyReward * (1 + tierBoost);
      const apy = (boostedReward / nftPrice) * 100;

      return apy.toFixed(2);
    } catch (error) {
      logger.error('Error calculating APY:', error);
      return 0;
    }
  }

  /**
   * Get staking statistics
   */
  async getStakingStats(stakingContractAddress, provider) {
    try {
      const contract = new ethers.Contract(
        stakingContractAddress,
        this.stakingABI,
        provider
      );

      const [
        totalStaked,
        activeStakers,
        totalDistributed,
        poolBalance,
      ] = await contract.getStats();

      return {
        totalStakedNFTs: totalStaked.toString(),
        activeStakers: activeStakers.toString(),
        totalDistributedRewards: ethers.formatEther(totalDistributed),
        rewardPoolBalance: ethers.formatEther(poolBalance),
      };
    } catch (error) {
      logger.error('Error fetching staking stats:', error);
      throw error;
    }
  }

  /**
   * Get staking tiers
   */
  async getStakingTiers(stakingContractAddress, provider) {
    try {
      // Return predefined tiers
      const tiers = [
        {
          name: 'Bronze',
          minTokens: 1,
          boostPercentage: 0,
          color: '#CD7F32',
          benefits: ['Basic staking rewards', 'No APY boost'],
        },
        {
          name: 'Silver',
          minTokens: 5,
          boostPercentage: 10,
          color: '#C0C0C0',
          benefits: ['10% APY boost', 'Priority support'],
        },
        {
          name: 'Gold',
          minTokens: 10,
          boostPercentage: 20,
          color: '#FFD700',
          benefits: ['20% APY boost', 'Governance voting priority'],
        },
        {
          name: 'Platinum',
          minTokens: 25,
          boostPercentage: 50,
          color: '#E5E4E2',
          benefits: [
            '50% APY boost',
            'VIP access to new features',
            'Exclusive events',
          ],
        },
      ];

      return tiers;
    } catch (error) {
      logger.error('Error fetching staking tiers:', error);
      throw error;
    }
  }

  /**
   * Estimate daily earnings
   */
  async estimateDailyEarnings(
    stakedCount,
    dailyReward,
    tierBoost,
    nftPrice = 1
  ) {
    try {
      const baseDaily = dailyReward * stakedCount;
      const boostedDaily = baseDaily * (1 + tierBoost / 100);

      return {
        baseDaily: baseDaily.toFixed(6),
        boostedDaily: boostedDaily.toFixed(6),
        monthly: (boostedDaily * 30).toFixed(6),
        yearly: (boostedDaily * 365).toFixed(6),
      };
    } catch (error) {
      logger.error('Error estimating earnings:', error);
      throw error;
    }
  }

  /**
   * Get reward history
   */
  async getRewardHistory(stakerAddress, limit = 20) {
    try {
      // In production, fetch from database
      const history = [
        {
          date: new Date(Date.now() - 86400000),
          amount: 0.5,
          type: 'claim',
          txHash: '0x...',
        },
        {
          date: new Date(Date.now() - 172800000),
          amount: 0.48,
          type: 'accrued',
          txHash: '0x...',
        },
      ];

      return history.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching reward history:', error);
      throw error;
    }
  }

  /**
   * Get staking leaderboard
   */
  async getLeaderboard(limit = 20) {
    try {
      const leaderboard = [
        {
          rank: 1,
          address: '0x1234...5678',
          stakedCount: 150,
          totalRewards: 250.5,
          tier: 'Platinum',
        },
        {
          rank: 2,
          address: '0x9876...5432',
          stakedCount: 95,
          totalRewards: 145.2,
          tier: 'Gold',
        },
        {
          rank: 3,
          address: '0xabcd...efgh',
          stakedCount: 45,
          totalRewards: 68.3,
          tier: 'Silver',
        },
      ];

      return leaderboard.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get staking projections
   */
  async getProjections(
    stakedCount,
    dailyReward,
    tierBoost,
    projectionMonths = 12
  ) {
    try {
      const projections = [];

      const dailyEarnings =
        dailyReward * stakedCount * (1 + tierBoost / 100);

      for (let i = 1; i <= projectionMonths; i++) {
        projections.push({
          month: i,
          projected: (dailyEarnings * 30 * i).toFixed(6),
        });
      }

      return projections;
    } catch (error) {
      logger.error('Error calculating projections:', error);
      throw error;
    }
  }
}

module.exports = new StakingService();
