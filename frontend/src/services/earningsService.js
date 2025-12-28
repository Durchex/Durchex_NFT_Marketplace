import { ethers } from 'ethers';

/**
 * Earnings and Profit Sharing Service
 * Handles calculations for user earnings, partner shares, and withdrawal management
 */

class EarningsService {
  /**
   * Calculate seller's net earnings from a transaction
   * Takes into account platform fees and royalties
   */
  static calculateNetEarnings(salePrice, platformFeeAmount = 0, royaltyAmount = 0) {
    try {
      const sale = BigInt(salePrice);
      const fee = BigInt(platformFeeAmount);
      const royalty = BigInt(royaltyAmount);

      const netEarnings = sale - fee - royalty;
      return netEarnings.toString();
    } catch (error) {
      console.error('Error calculating net earnings:', error);
      return '0';
    }
  }

  /**
   * Calculate partner's share from earnings
   */
  static calculatePartnerShare(amount, sharePercentage) {
    try {
      if (!sharePercentage || sharePercentage === 0) {
        return '0';
      }

      const baseAmount = BigInt(amount);
      const percentage = BigInt(Math.floor(sharePercentage * 100)); // Avoid floating point
      const share = (baseAmount * percentage) / BigInt(10000);

      return share.toString();
    } catch (error) {
      console.error('Error calculating partner share:', error);
      return '0';
    }
  }

  /**
   * Calculate remaining amount after partner share
   */
  static calculateCreatorShare(amount, sharePercentage) {
    try {
      const partnerShare = this.calculatePartnerShare(amount, sharePercentage);
      const remaining = BigInt(amount) - BigInt(partnerShare);
      return remaining.toString();
    } catch (error) {
      console.error('Error calculating creator share:', error);
      return amount;
    }
  }

  /**
   * Calculate total earnings considering multiple partners
   */
  static calculateMultiPartnerDistribution(saleAmount, partners = []) {
    try {
      const distribution = {
        creator: saleAmount,
        partners: {},
      };

      // Sort partners by share percentage (highest first) to avoid rounding issues
      const sortedPartners = [...partners].sort(
        (a, b) => b.sharePercentage - a.sharePercentage
      );

      let totalDistributed = BigInt('0');

      for (const partner of sortedPartners) {
        const share = this.calculatePartnerShare(saleAmount, partner.sharePercentage);
        distribution.partners[partner.partnerWallet] = {
          amount: share,
          percentage: partner.sharePercentage,
          name: partner.partnerName,
        };
        totalDistributed += BigInt(share);
      }

      // Creator gets remainder
      distribution.creator = (BigInt(saleAmount) - totalDistributed).toString();

      return distribution;
    } catch (error) {
      console.error('Error calculating multi-partner distribution:', error);
      return { creator: saleAmount, partners: {} };
    }
  }

  /**
   * Format wei to ETH for display
   */
  static formatToETH(wei, decimals = 4) {
    try {
      if (!wei || wei === '0') return '0.0000';
      const eth = ethers.utils.formatEther(wei);
      return parseFloat(eth).toFixed(decimals);
    } catch {
      return '0.0000';
    }
  }

  /**
   * Parse ETH to wei
   */
  static parseFromETH(eth) {
    try {
      return ethers.utils.parseEther(eth.toString()).toString();
    } catch (error) {
      console.error('Error parsing ETH:', error);
      return '0';
    }
  }

  /**
   * Calculate gas fees impact on earnings
   */
  static calculateGasImpact(earnings, gasCost) {
    try {
      const net = BigInt(earnings) - BigInt(gasCost);
      const percentage = (BigInt(gasCost) * BigInt(100)) / BigInt(earnings);

      return {
        grossEarnings: earnings,
        gasCost: gasCost,
        netEarnings: net.toString(),
        gasPercentage: parseInt(percentage.toString()),
      };
    } catch (error) {
      console.error('Error calculating gas impact:', error);
      return {
        grossEarnings: earnings,
        gasCost: gasCost,
        netEarnings: earnings,
        gasPercentage: 0,
      };
    }
  }

  /**
   * Calculate minimum withdrawal amount with fees
   */
  static calculateMinimumWithdrawal(minimumAmount, platformFeePercentage = 0) {
    try {
      const base = BigInt(minimumAmount);
      const feePercent = BigInt(Math.floor(platformFeePercentage * 100));
      const fee = (base * feePercent) / BigInt(10000);

      return {
        minimumRequired: minimumAmount,
        platformFee: fee.toString(),
        minAfterFees: (base - fee).toString(),
      };
    } catch (error) {
      console.error('Error calculating minimum withdrawal:', error);
      return {
        minimumRequired: minimumAmount,
        platformFee: '0',
        minAfterFees: minimumAmount,
      };
    }
  }

  /**
   * Calculate APY/earnings growth
   */
  static calculateEarningsGrowth(previousPeriodEarnings, currentPeriodEarnings) {
    try {
      if (previousPeriodEarnings === '0' || previousPeriodEarnings === 0) {
        return {
          growth: '100',
          isPositive: true,
          isFirstPeriod: true,
        };
      }

      const prev = BigInt(previousPeriodEarnings);
      const curr = BigInt(currentPeriodEarnings);
      const difference = curr - prev;
      const percentGrowth = (difference * BigInt(100)) / prev;

      return {
        growth: percentGrowth.toString(),
        isPositive: difference >= BigInt(0),
        difference: difference.toString(),
      };
    } catch (error) {
      console.error('Error calculating growth:', error);
      return { growth: '0', isPositive: false };
    }
  }

  /**
   * Validate withdrawal request
   */
  static validateWithdrawal(amount, availableBalance, minimumWithdrawal) {
    const issues = [];

    const amountBig = BigInt(amount);
    const balanceBig = BigInt(availableBalance);
    const minBig = BigInt(minimumWithdrawal);

    if (amountBig > balanceBig) {
      issues.push({
        type: 'insufficient_balance',
        message: 'Requested amount exceeds available balance',
        available: availableBalance,
        requested: amount,
      });
    }

    if (amountBig < minBig) {
      issues.push({
        type: 'below_minimum',
        message: `Amount is below minimum withdrawal of ${this.formatToETH(minimumWithdrawal)}`,
        minimum: minimumWithdrawal,
        requested: amount,
      });
    }

    if (amountBig <= BigInt(0)) {
      issues.push({
        type: 'invalid_amount',
        message: 'Amount must be greater than zero',
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Calculate withdrawal fee
   */
  static calculateWithdrawalFee(amount, feePercentage) {
    try {
      const amountBig = BigInt(amount);
      const feePercent = BigInt(Math.floor(feePercentage * 100));
      const fee = (amountBig * feePercent) / BigInt(10000);

      return {
        amount: amount,
        feePercentage: feePercentage,
        fee: fee.toString(),
        netAmount: (amountBig - fee).toString(),
      };
    } catch (error) {
      console.error('Error calculating withdrawal fee:', error);
      return {
        amount: amount,
        feePercentage: feePercentage,
        fee: '0',
        netAmount: amount,
      };
    }
  }

  /**
   * Estimate total earnings including pending transactions
   */
  static estimateTotalEarnings(confirmedEarnings, pendingEarnings) {
    try {
      const confirmed = BigInt(confirmedEarnings);
      const pending = BigInt(pendingEarnings);
      const total = confirmed + pending;

      return {
        confirmed: confirmedEarnings,
        pending: pendingEarnings,
        total: total.toString(),
      };
    } catch (error) {
      console.error('Error estimating total earnings:', error);
      return {
        confirmed: confirmedEarnings,
        pending: pendingEarnings,
        total: confirmedEarnings,
      };
    }
  }
}

export default EarningsService;
