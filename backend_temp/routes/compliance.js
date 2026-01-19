/**
 * Security & Compliance Routes - KYC, AML, Audits, Fraud Detection
 * Endpoints for compliance management and security operations
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const tryCatch = require('../middleware/tryCatch');
const logger = require('../utils/logger');

let complianceService = null;

router.use((req, res, next) => {
  complianceService = req.app.locals.complianceService;
  if (!complianceService) {
    return res.status(500).json({ error: 'Compliance service not initialized' });
  }
  next();
});

// ========== KYC Verification ==========

/**
 * POST /api/v1/compliance/kyc/initiate
 * Start KYC verification process
 */
router.post('/kyc/initiate', auth, tryCatch(async (req, res) => {
  const { firstName, lastName, dateOfBirth, country, documentType, documentId } = req.body;

  if (!firstName || !lastName || !dateOfBirth || !country) {
    return res.status(400).json({ error: 'Missing required KYC fields' });
  }

  try {
    const result = await complianceService.initiateKYCVerification(req.user.address, {
      firstName,
      lastName,
      dateOfBirth,
      country,
      documentType,
      documentId
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'KYC verification initiated'
    });
  } catch (error) {
    logger.error('Initiate KYC error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/compliance/kyc/status
 * Get KYC status for current user
 */
router.get('/kyc/status', auth, tryCatch(async (req, res) => {
  try {
    const result = await complianceService.getKYCStatus(req.user.address);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/compliance/kyc/:userAddress/approve
 * Approve KYC verification (Admin only)
 */
router.post('/kyc/:userAddress/approve', adminAuth, tryCatch(async (req, res) => {
  const { userAddress } = req.params;
  const { level = 'LEVEL_1' } = req.body;

  try {
    const result = await complianceService.approveKYCVerification(
      userAddress,
      req.user.address,
      level
    );

    res.json({
      success: true,
      data: result,
      message: 'KYC verification approved'
    });
  } catch (error) {
    logger.error('Approve KYC error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/compliance/kyc/:userAddress/reject
 * Reject KYC verification (Admin only)
 */
router.post('/kyc/:userAddress/reject', adminAuth, tryCatch(async (req, res) => {
  const { userAddress } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason required' });
  }

  try {
    const result = await complianceService.rejectKYCVerification(
      userAddress,
      reason,
      req.user.address
    );

    res.json({
      success: true,
      data: result,
      message: 'KYC verification rejected'
    });
  } catch (error) {
    logger.error('Reject KYC error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

// ========== AML Screening ==========

/**
 * POST /api/v1/compliance/aml/screen
 * Screen transaction for AML compliance
 */
router.post('/aml/screen', tryCatch(async (req, res) => {
  const { fromAddress, toAddress, amount, token, transactionHash } = req.body;

  if (!fromAddress || !toAddress || !amount || !transactionHash) {
    return res.status(400).json({ error: 'Missing required transaction fields' });
  }

  try {
    const result = await complianceService.screenTransaction({
      fromAddress,
      toAddress,
      amount,
      token,
      transactionHash
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('AML screening error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/compliance/aml/flags
 * Get flagged transactions for review (Admin only)
 */
router.get('/aml/flags', adminAuth, tryCatch(async (req, res) => {
  const { limit = 50 } = req.query;

  try {
    const result = await complianceService.getAMLFlags(parseInt(limit));

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/compliance/aml/flags/:transactionHash/resolve
 * Resolve AML flag (Admin only)
 */
router.post('/aml/flags/:transactionHash/resolve', adminAuth, tryCatch(async (req, res) => {
  const { transactionHash } = req.params;
  const { resolution } = req.body;

  if (!resolution) {
    return res.status(400).json({ error: 'Resolution required' });
  }

  try {
    const result = await complianceService.resolveAMLFlag(
      transactionHash,
      resolution,
      req.user.address
    );

    res.json({
      success: true,
      data: result,
      message: 'AML flag resolved'
    });
  } catch (error) {
    logger.error('Resolve AML flag error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

// ========== Security Audits ==========

/**
 * POST /api/v1/compliance/audits/create
 * Create security audit (Admin only)
 */
router.post('/audits/create', adminAuth, tryCatch(async (req, res) => {
  const { contractAddress, type } = req.body;

  if (!contractAddress || !type) {
    return res.status(400).json({ error: 'Contract address and type required' });
  }

  try {
    const result = await complianceService.createSecurityAudit(
      contractAddress,
      type,
      req.user.address
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Security audit created'
    });
  } catch (error) {
    logger.error('Create audit error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/compliance/audits/:auditId/findings
 * Add finding to audit (Admin only)
 */
router.post('/audits/:auditId/findings', adminAuth, tryCatch(async (req, res) => {
  const { auditId } = req.params;
  const { severity, title, description, recommendation } = req.body;

  if (!severity || !title) {
    return res.status(400).json({ error: 'Severity and title required' });
  }

  try {
    const result = await complianceService.addAuditFinding(auditId, {
      severity,
      title,
      description,
      recommendation
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Finding added to audit'
    });
  } catch (error) {
    logger.error('Add audit finding error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/compliance/audits/:auditId/complete
 * Complete security audit (Admin only)
 */
router.post('/audits/:auditId/complete', adminAuth, tryCatch(async (req, res) => {
  const { auditId } = req.params;

  try {
    const result = await complianceService.completeSecurityAudit(auditId, req.user.address);

    res.json({
      success: true,
      data: result,
      message: 'Security audit completed'
    });
  } catch (error) {
    logger.error('Complete audit error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/compliance/audits/:auditId
 * Get security audit details
 */
router.get('/audits/:auditId', tryCatch(async (req, res) => {
  const { auditId } = req.params;

  try {
    const result = await complianceService.getSecurityAudit(auditId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Fraud Detection ==========

/**
 * POST /api/v1/compliance/fraud/score
 * Calculate fraud score for user activity
 */
router.post('/fraud/score', auth, tryCatch(async (req, res) => {
  const {
    transactionCount,
    timeWindow,
    averageAmount,
    currentAmount,
    previousCountry,
    currentCountry,
    newRecipientCount,
    historicalCount,
    chainSwaps
  } = req.body;

  try {
    const result = await complianceService.calculateFraudScore(req.user.address, {
      transactionCount,
      timeWindow,
      averageAmount,
      currentAmount,
      previousCountry,
      currentCountry,
      newRecipientCount,
      historicalCount,
      chainSwaps
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Calculate fraud score error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/compliance/fraud/score
 * Get fraud score for current user
 */
router.get('/fraud/score', auth, tryCatch(async (req, res) => {
  try {
    const result = await complianceService.getFraudScore(req.user.address);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Compliance Reporting ==========

/**
 * POST /api/v1/compliance/reports/generate
 * Generate compliance report (Admin only)
 */
router.post('/reports/generate', adminAuth, tryCatch(async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates required' });
  }

  try {
    const result = await complianceService.generateComplianceReport(
      new Date(startDate),
      new Date(endDate)
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Compliance report generated'
    });
  } catch (error) {
    logger.error('Generate report error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/compliance/reports
 * Get compliance reports (Admin only)
 */
router.get('/reports', adminAuth, tryCatch(async (req, res) => {
  const { limit = 10 } = req.query;

  try {
    const result = await complianceService.getComplianceReports(parseInt(limit));

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Error Handling ==========

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Compliance endpoint not found'
  });
});

module.exports = router;
