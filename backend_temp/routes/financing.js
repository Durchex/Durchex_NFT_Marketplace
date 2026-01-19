/**
 * Financing Routes - NFT-Backed Financing API Endpoints
 * Handles:
 * - Loan creation and management
 * - Payment processing
 * - Risk assessment
 * - Liquidation operations
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tryCatch = require('../middleware/tryCatch');
const logger = require('../utils/logger');

// Financing service will be injected from server
let financingService = null;

// Middleware to inject financing service
router.use((req, res, next) => {
  financingService = req.app.locals.financingService;
  if (!financingService) {
    return res.status(500).json({ error: 'Financing service not initialized' });
  }
  next();
});

// ========== Loan Creation & Management ==========

/**
 * POST /api/v1/financing/loan/create
 * Create a new collateralized loan
 */
router.post('/loan/create', auth, tryCatch(async (req, res) => {
  const { nftContract, nftTokenId, loanAmount, loanDuration } = req.body;
  
  if (!nftContract || !nftTokenId || !loanAmount || !loanDuration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const loan = await financingService.createLoan(
      nftContract,
      nftTokenId,
      parseFloat(loanAmount),
      parseInt(loanDuration)
    );
    
    res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan created successfully'
    });
  } catch (error) {
    logger.error('Loan creation error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/financing/loan/:loanId
 * Get loan details and analytics
 */
router.get('/loan/:loanId', tryCatch(async (req, res) => {
  const { loanId } = req.params;
  
  try {
    const analytics = await financingService.getLoanAnalytics(parseInt(loanId));
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/financing/user/loans
 * Get all loans for authenticated user
 */
router.get('/user/loans', auth, tryCatch(async (req, res) => {
  try {
    const loans = await financingService.getUserLoans(req.user.address);
    
    res.json({
      success: true,
      data: loans,
      total: loans.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Payment Operations ==========

/**
 * POST /api/v1/financing/loan/:loanId/payment
 * Make a payment towards a loan
 */
router.post('/loan/:loanId/payment', auth, tryCatch(async (req, res) => {
  const { loanId } = req.params;
  const { paymentAmount } = req.body;
  
  if (!paymentAmount || paymentAmount <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }
  
  try {
    const result = await financingService.makePayment(
      parseInt(loanId),
      parseFloat(paymentAmount)
    );
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    logger.error('Payment error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/financing/loan/:loanId/repay
 * Repay entire loan
 */
router.post('/loan/:loanId/repay', auth, tryCatch(async (req, res) => {
  const { loanId } = req.params;
  
  try {
    const result = await financingService.repayFullLoan(parseInt(loanId));
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Loan repaid successfully'
    });
  } catch (error) {
    logger.error('Repayment error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/financing/loan/:loanId/payment-schedule
 * Get payment schedule for a loan
 */
router.get('/loan/:loanId/payment-schedule', tryCatch(async (req, res) => {
  const { loanId } = req.params;
  
  try {
    const analytics = await financingService.getLoanAnalytics(parseInt(loanId));
    const daysRemaining = analytics.daysRemaining;
    const monthlyPayment = analytics.monthlyPayment;
    const remainingPayments = Math.ceil(daysRemaining / 30);
    
    const schedule = [];
    for (let i = 0; i < remainingPayments; i++) {
      schedule.push({
        paymentNumber: i + 1,
        dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        principalPayment: monthlyPayment * 0.7,
        interestPayment: monthlyPayment * 0.3,
        totalPayment: monthlyPayment,
        remainingBalance: analytics.currentDebt - (monthlyPayment * (i + 1))
      });
    }
    
    res.json({
      success: true,
      data: {
        loanId,
        monthlyPayment,
        totalPayments: remainingPayments,
        schedule
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Risk Assessment ==========

/**
 * GET /api/v1/financing/loan/:loanId/risk-assessment
 * Get risk assessment for a loan
 */
router.get('/loan/:loanId/risk-assessment', tryCatch(async (req, res) => {
  const { loanId } = req.params;
  
  try {
    const assessment = await financingService.getRiskAssessment(parseInt(loanId));
    
    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}));

// ========== Portfolio Management ==========

/**
 * GET /api/v1/financing/user/portfolio
 * Get user portfolio statistics
 */
router.get('/user/portfolio', auth, tryCatch(async (req, res) => {
  try {
    const portfolio = await financingService.getPortfolioStats(req.user.address);
    
    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/financing/user/payment-history
 * Get user payment history
 */
router.get('/user/payment-history', auth, tryCatch(async (req, res) => {
  try {
    const history = financingService.getPaymentHistory();
    
    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Liquidation ==========

/**
 * POST /api/v1/financing/loan/:loanId/liquidation/initiate
 * Initiate liquidation for underwater loan
 */
router.post('/loan/:loanId/liquidation/initiate', auth, tryCatch(async (req, res) => {
  const { loanId } = req.params;
  
  try {
    const result = await financingService.initiateLiquidation(parseInt(loanId));
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Liquidation initiated'
    });
  } catch (error) {
    logger.error('Liquidation error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

// ========== Fractional Financing ==========

/**
 * POST /api/v1/financing/loan/:loanId/fractional
 * Create fractional position on a loan
 */
router.post('/loan/:loanId/fractional', auth, tryCatch(async (req, res) => {
  const { loanId } = req.params;
  const { sharePercentage } = req.body;
  
  if (!sharePercentage || sharePercentage <= 0 || sharePercentage > 100) {
    return res.status(400).json({ error: 'Invalid share percentage' });
  }
  
  try {
    const result = await financingService.createFractionalPosition(
      parseInt(loanId),
      sharePercentage
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Fractional position created'
    });
  } catch (error) {
    logger.error('Fractional position error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/financing/loan/:loanId/fractional/claim
 * Claim rewards from fractional position
 */
router.post('/loan/:loanId/fractional/claim', auth, tryCatch(async (req, res) => {
  const { loanId } = req.params;
  
  try {
    const result = await financingService.claimFractionalRewards(parseInt(loanId));
    
    res.json({
      success: true,
      data: result,
      message: 'Rewards claimed successfully'
    });
  } catch (error) {
    logger.error('Reward claim error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

// ========== Market & Analytics ==========

/**
 * GET /api/v1/financing/market/overview
 * Get financing market overview
 */
router.get('/market/overview', tryCatch(async (req, res) => {
  try {
    // Placeholder - would aggregate data from service
    const overview = {
      totalLoansCreated: 0,
      totalLoansActive: 0,
      totalLoanVolume: 0,
      averageInterestRate: 0,
      liquidationRate: 0,
      defaultRate: 0,
      platformFeeCollected: 0
    };
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/financing/rates
 * Get current lending rates and APYs
 */
router.get('/rates', tryCatch(async (req, res) => {
  try {
    const rates = {
      baseInterestRate: 5.0,
      riskTiers: [
        { tier: 'LOW', rate: 5.0, description: 'Blue chip collections' },
        { tier: 'MODERATE', rate: 8.0, description: 'Established collections' },
        { tier: 'MEDIUM', rate: 12.0, description: 'Active collections' },
        { tier: 'HIGH', rate: 16.0, description: 'Emerging collections' },
        { tier: 'VERY_HIGH', rate: 25.0, description: 'Speculative/New collections' }
      ],
      platformFee: 2.0,
      insuranceFee: 1.0,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Error Handling ==========

/**
 * 404 handler
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Financing endpoint not found'
  });
});

module.exports = router;
