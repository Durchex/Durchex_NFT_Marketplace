// backend_temp/utils/feeService.js
/**
 * Fee Service - Handles fee calculations for DURCHEX marketplace
 * 
 * Fee Structure:
 * - Creator Fee: 2.5% (goes to NFT creator)
 * - Buyer Fee: 1.5% (marketplace commission)
 * - Total: 4% on purchase price
 */

/**
 * Calculate sales fees
 * @param {number} purchasePrice - The price in ETH or token
 * @returns {Object} Fee breakdown
 */
export const calculateFees = (purchasePrice) => {
  const price = parseFloat(purchasePrice);
  
  if (isNaN(price) || price <= 0) {
    return {
      purchasePrice: 0,
      creatorFee: 0,
      buyerFee: 0,
      totalFees: 0,
      userPayable: 0,
      creatorReceives: 0,
      platformReceives: 0,
    };
  }

  // Fee percentages (as decimals)
  const CREATOR_FEE_PERCENT = 0.025; // 2.5%
  const BUYER_FEE_PERCENT = 0.015;   // 1.5%

  // Calculate fees
  const creatorFee = price * CREATOR_FEE_PERCENT;
  const buyerFee = price * BUYER_FEE_PERCENT;
  const totalFees = creatorFee + buyerFee;

  // What buyer pays (price + buyer fee)
  const userPayable = price + buyerFee;
  
  // What creator receives (price - creator fee)
  const creatorReceives = price - creatorFee;
  
  // What platform receives
  const platformReceives = buyerFee + creatorFee;

  return {
    purchasePrice: parseFloat(price.toFixed(8)),
    creatorFee: parseFloat(creatorFee.toFixed(8)),
    buyerFee: parseFloat(buyerFee.toFixed(8)),
    totalFees: parseFloat(totalFees.toFixed(8)),
    userPayable: parseFloat(userPayable.toFixed(8)),
    creatorReceives: parseFloat(creatorReceives.toFixed(8)),
    platformReceives: parseFloat(platformReceives.toFixed(8)),
  };
};

/**
 * Calculate fees for bulk purchases
 * @param {number} purchasePrice - Unit price in ETH or token
 * @param {number} quantity - Number of items being purchased
 * @returns {Object} Fee breakdown for total purchase
 */
export const calculateBulkFees = (purchasePrice, quantity) => {
  const totalPrice = parseFloat(purchasePrice) * parseInt(quantity);
  return calculateFees(totalPrice);
};

/**
 * Get fee breakdown for display
 * @param {number} purchasePrice - The price in ETH or token
 * @returns {Object} User-friendly fee information
 */
export const getFeeBreakdown = (purchasePrice) => {
  const fees = calculateFees(purchasePrice);
  
  return {
    itemPrice: fees.purchasePrice,
    creatorFee: {
      amount: fees.creatorFee,
      percentage: 2.5,
      label: "Creator Fee",
    },
    buyerFee: {
      amount: fees.buyerFee,
      percentage: 1.5,
      label: "Platform Fee",
    },
    total: {
      fees: fees.totalFees,
      percentage: 4,
    },
    summary: {
      userPays: fees.userPayable,
      creatorReceives: fees.creatorReceives,
      platformReceives: fees.platformReceives,
    },
  };
};

/**
 * Validate fee configuration
 * @returns {Object} Configuration status
 */
export const getFeeConfiguration = () => {
  return {
    creatorFeePercent: 2.5,
    buyerFeePercent: 1.5,
    totalFeePercent: 4,
    minTransactionAmount: 0.0001, // Minimum viable transaction
    maxTransactionAmount: 1000000, // Maximum per transaction
    currencies: ["ETH", "MATIC", "BNB", "ARB", "AVAX", "BASE", "OP"],
    description: "Creator receives 97.5% of sale price, platform retains 4%, buyer pays 1.5% extra",
  };
};

/**
 * Format fee for display
 * @param {number} amount - Fee amount
 * @returns {string} Formatted fee string
 */
export const formatFee = (amount) => {
  return parseFloat(amount).toFixed(8);
};

/**
 * Calculate refund (reverse fees)
 * @param {number} refundAmount - The amount being refunded
 * @returns {Object} Refund breakdown
 */
export const calculateRefund = (refundAmount) => {
  // Refunds should only refund what the user paid (including buyer fee)
  // Creator fee was deducted from the sale amount
  const amount = parseFloat(refundAmount);
  
  // The user paid: price + 1.5% buyer fee
  // So we refund the full amount they paid
  const userRefund = amount;
  
  // From platform perspective:
  // - Creator needs to be refunded their portion (minus 2.5% creator fee)
  // - Platform refunds the 1.5% buyer fee
  
  const creatorFeeRefund = amount * (2.5 / 104); // Proportional creator fee from the amount
  const platformFeeRefund = amount * (1.5 / 104); // Proportional buyer fee from the amount

  return {
    totalRefund: parseFloat(amount.toFixed(8)),
    userRefund: parseFloat(userRefund.toFixed(8)),
    creatorFeeRefund: parseFloat(creatorFeeRefund.toFixed(8)),
    platformFeeRefund: parseFloat(platformFeeRefund.toFixed(8)),
  };
};

export default {
  calculateFees,
  calculateBulkFees,
  getFeeBreakdown,
  getFeeConfiguration,
  formatFee,
  calculateRefund,
};
