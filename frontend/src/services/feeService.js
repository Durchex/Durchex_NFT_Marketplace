// frontend/src/services/feeService.js
/**
 * Fee Service - Frontend fee calculations
 * Mirrors backend fee structure for consistent display
 * 
 * Fee Structure:
 * - Creator Fee: 2.5% (deducted from creator earnings)
 * - Buyer Fee: 1.5% (added to buyer's payment)
 * - Total: 4%
 */

/**
 * Calculate fees for a purchase
 * @param {number} price - Price in ETH or equivalent token
 * @returns {Object} Fee breakdown
 */
export const calculateFees = (price) => {
  const parsePrice = parseFloat(price);
  
  if (isNaN(parsePrice) || parsePrice <= 0) {
    return {
      price: 0,
      creatorFee: 0,
      buyerFee: 0,
      totalFees: 0,
      totalPrice: 0,
      creatorReceives: 0,
    };
  }

  const creatorFeePercent = 0.025; // 2.5%
  const buyerFeePercent = 0.015;   // 1.5%

  const creatorFee = parsePrice * creatorFeePercent;
  const buyerFee = parsePrice * buyerFeePercent;
  const totalFees = creatorFee + buyerFee;
  const totalPrice = parsePrice + buyerFee; // User pays price + buyer fee
  const creatorReceives = parsePrice - creatorFee; // Creator gets price - creator fee

  return {
    price: parseFloat(parsePrice.toFixed(8)),
    creatorFee: parseFloat(creatorFee.toFixed(8)),
    buyerFee: parseFloat(buyerFee.toFixed(8)),
    totalFees: parseFloat(totalFees.toFixed(8)),
    totalPrice: parseFloat(totalPrice.toFixed(8)),
    creatorReceives: parseFloat(creatorReceives.toFixed(8)),
  };
};

/**
 * Get formatted fee breakdown for UI display
 * @param {number} price - Price in ETH or equivalent
 * @returns {Object} Formatted fee information
 */
export const getFeeBreakdown = (price) => {
  const fees = calculateFees(price);

  return {
    itemPrice: {
      label: "Item Price",
      amount: fees.price,
      displayAmount: formatPrice(fees.price),
    },
    creatorFee: {
      label: "Creator Fee (2.5%)",
      amount: fees.creatorFee,
      displayAmount: formatPrice(fees.creatorFee),
      percentage: 2.5,
      tooltip: "Deducted from creator earnings",
    },
    buyerFee: {
      label: "Platform Fee (1.5%)",
      amount: fees.buyerFee,
      displayAmount: formatPrice(fees.buyerFee),
      percentage: 1.5,
      tooltip: "Added to your total payment",
    },
    summary: {
      userPays: {
        label: "You Pay",
        amount: fees.totalPrice,
        displayAmount: formatPrice(fees.totalPrice),
      },
      creatorReceives: {
        label: "Creator Receives",
        amount: fees.creatorReceives,
        displayAmount: formatPrice(fees.creatorReceives),
      },
      totalFees: {
        label: "Total Fees",
        amount: fees.totalFees,
        displayAmount: formatPrice(fees.totalFees),
        percentage: 4,
      },
    },
  };
};

/**
 * Format price for display (8 decimal places, remove trailing zeros)
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
export const formatPrice = (price) => {
  const value = parseFloat(price).toFixed(8);
  // Remove trailing zeros after decimal
  return value.replace(/\.?0+$/, '');
};

/**
 * Get fee configuration info
 * @returns {Object} Fee configuration
 */
export const getFeeConfig = () => {
  return {
    creatorFeePercent: 2.5,
    buyerFeePercent: 1.5,
    totalFeePercent: 4,
    description: "Creator retains 97.5% after fees, Buyer pays 1.5% platform fee",
  };
};

/**
 * Calculate multiple NFT purchase fees
 * @param {number} unitPrice - Price per NFT
 * @param {number} quantity - Number of NFTs
 * @returns {Object} Total fees breakdown
 */
export const calculateMultipleFees = (unitPrice, quantity) => {
  const totalPrice = parseFloat(unitPrice) * parseInt(quantity);
  return calculateFees(totalPrice);
};

/**
 * Get visual fee breakdown for charts/graphs
 * @param {number} price - Price to break down
 * @returns {Array} Array of fee segments
 */
export const getFeeChartData = (price) => {
  const fees = calculateFees(price);
  
  return [
    {
      label: "Creator Receives",
      amount: fees.creatorReceives,
      percentage: (fees.creatorReceives / fees.totalPrice) * 100,
      color: "#22c55e", // Green
    },
    {
      label: "Creator Fee",
      amount: fees.creatorFee,
      percentage: 2.5,
      color: "#f59e0b", // Amber
    },
    {
      label: "Platform Fee",
      amount: fees.buyerFee,
      percentage: 1.5,
      color: "#ef4444", // Red
    },
  ];
};

/**
 * Validate if price is suitable for fees
 * @param {number} price - Price to validate
 * @returns {Object} Validation result
 */
export const validatePrice = (price) => {
  const parsed = parseFloat(price);
  
  const minTransaction = 0.0001;
  const maxTransaction = 1000000;
  
  return {
    valid: !isNaN(parsed) && parsed >= minTransaction && parsed <= maxTransaction,
    price: parsed,
    error: null,
    ...(isNaN(parsed) && { error: "Invalid price format" }),
    ...(parsed < minTransaction && { error: `Minimum price is ${minTransaction}` }),
    ...(parsed > maxTransaction && { error: `Maximum price is ${maxTransaction}` }),
  };
};

export default {
  calculateFees,
  getFeeBreakdown,
  formatPrice,
  getFeeConfig,
  calculateMultipleFees,
  getFeeChartData,
  validatePrice,
};
