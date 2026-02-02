/**
 * Governance Routes - DAO Proposals, Voting, Treasury Management
 * Endpoints for:
 * - Creating and managing proposals
 * - Voting on proposals
 * - Treasury fund management
 * - Governance token operations
 */

import express from 'express';
import auth from '../middleware/auth.js';
import tryCatch from '../middleware/tryCatch.js';
import logger from '../utils/logger.js';
const router = express.Router();

let governanceService = null;

router.use((req, res, next) => {
  governanceService = req.app.locals.governanceService;
  if (!governanceService) {
    return res.status(500).json({ error: 'Governance service not initialized' });
  }
  next();
});

// ========== Proposals ==========

/**
 * POST /api/v1/governance/proposals/create
 * Create new governance proposal
 */
router.post('/proposals/create', auth, tryCatch(async (req, res) => {
  const { title, description, proposalType, targetAmount, targetAddress, duration } = req.body;
  
  if (!title || !description || !proposalType) {
    return res.status(400).json({ error: 'Missing required proposal fields' });
  }
  
  try {
    const actions = targetAddress ? [{ target: targetAddress, calldata: String(targetAmount || 0) }] : [];
    const result = await governanceService.createProposal(
      req.user.address,
      title,
      description,
      proposalType,
      actions,
      duration || 259200
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Proposal created successfully'
    });
  } catch (error) {
    logger.error('Create proposal error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/proposals
 * Get all active proposals
 */
router.get('/proposals', tryCatch(async (req, res) => {
  const { status = 'active', sortBy = 'newest' } = req.query;
  
  try {
    const result = await governanceService.getAllProposals(status, sortBy);
    
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
 * GET /api/v1/governance/proposals/:proposalId
 * Get proposal details
 */
router.get('/proposals/:proposalId', tryCatch(async (req, res) => {
  const { proposalId } = req.params;
  
  try {
    const result = await governanceService.getProposalDetails(proposalId);
    
    if (!result) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/proposals/user/created
 * Get proposals created by user
 */
router.get('/proposals/user/created', auth, tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getUserProposals(req.user.address);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Voting ==========

/**
 * POST /api/v1/governance/votes/cast
 * Cast vote on proposal
 */
router.post('/votes/cast', auth, tryCatch(async (req, res) => {
  const { proposalId, support, votes = 1, reason } = req.body;
  
  if (!proposalId || support === undefined) {
    return res.status(400).json({ error: 'Missing proposalId or support' });
  }
  
  try {
    const result = await governanceService.castVote(
      proposalId,
      req.user.address,
      support,
      Number(votes) || 1,
      reason || ''
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Vote cast successfully'
    });
  } catch (error) {
    logger.error('Cast vote error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/proposals/:proposalId/votes
 * Get proposal votes breakdown
 */
router.get('/proposals/:proposalId/votes', tryCatch(async (req, res) => {
  const { proposalId } = req.params;
  
  try {
    const result = await governanceService.getVotesForProposal(proposalId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/proposals/:proposalId/votes/user
 * Check user's vote on proposal
 */
router.get('/proposals/:proposalId/votes/user', auth, tryCatch(async (req, res) => {
  const { proposalId } = req.params;
  
  try {
    const result = await governanceService.getUserVote(proposalId, req.user.address);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/votes/user
 * Get user's voting history
 */
router.get('/votes/user', auth, tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getUserVotingHistory(req.user.address);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Treasury ==========

/**
 * POST /api/v1/governance/treasury/fund
 * Fund treasury (admin only)
 */
router.post('/treasury/fund', auth, tryCatch(async (req, res) => {
  const { amount, token } = req.body;
  
  if (!amount || !token) {
    return res.status(400).json({ error: 'Missing amount or token' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await governanceService.fundTreasury(amount, token);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Treasury funded successfully'
    });
  } catch (error) {
    logger.error('Fund treasury error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/treasury/balance
 * Get treasury balance
 */
router.get('/treasury/balance', tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getTreasuryBalance();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/treasury/transactions
 * Get treasury transaction history
 */
router.get('/treasury/transactions', tryCatch(async (req, res) => {
  const { limit = 50 } = req.query;
  
  try {
    const result = await governanceService.getTreasuryTransactions(parseInt(limit));
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Delegation ==========

/**
 * POST /api/v1/governance/delegation/delegate
 * Delegate voting power
 */
router.post('/delegation/delegate', auth, tryCatch(async (req, res) => {
  const { delegateAddress } = req.body;
  
  if (!delegateAddress) {
    return res.status(400).json({ error: 'Delegate address required' });
  }
  
  try {
    const result = await governanceService.delegateVotes(req.user.address, delegateAddress);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Votes delegated successfully'
    });
  } catch (error) {
    logger.error('Delegation error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * POST /api/v1/governance/delegation/undelegate
 * Undelegate voting power
 */
router.post('/delegation/undelegate', auth, tryCatch(async (req, res) => {
  try {
    const result = await governanceService.undelegateVotes(req.user.address);
    
    res.json({
      success: true,
      data: result,
      message: 'Votes undelegated successfully'
    });
  } catch (error) {
    logger.error('Undelegation error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/delegation/check
 * Check delegation status
 */
router.get('/delegation/check', auth, tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getDelegationInfo(req.user.address);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/delegation/voters/:delegateAddress
 * Get voters delegated to address
 */
router.get('/delegation/voters/:delegateAddress', tryCatch(async (req, res) => {
  const { delegateAddress } = req.params;
  
  try {
    const result = await governanceService.getDelegatedVoters(delegateAddress);
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Governance Token ==========

/**
 * GET /api/v1/governance/token/balance
 * Get user's governance token balance
 */
router.get('/token/balance', auth, tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getTokenBalance(req.user.address);
    
    res.json({
      success: true,
      data: {
        balance: result,
        votingPower: result // 1 token = 1 vote
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/token/info
 * Get governance token information
 */
router.get('/token/info', tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getTokenInfo();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Analytics ==========

/**
 * GET /api/v1/governance/stats
 * Get governance statistics
 */
router.get('/stats', tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getGovernanceStats();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

/**
 * GET /api/v1/governance/leaderboard
 * Get voting participation leaderboard
 */
router.get('/leaderboard', tryCatch(async (req, res) => {
  const { limit = 50 } = req.query;
  
  try {
    const result = await governanceService.getLeaderboard(parseInt(limit));
    
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
 * GET /api/v1/governance/user/stats
 * Get user's governance participation stats
 */
router.get('/user/stats', auth, tryCatch(async (req, res) => {
  try {
    const result = await governanceService.getUserGovernanceStats(req.user.address);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// ========== Error Handling ==========

router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Governance endpoint not found'
  });
});

export default router;
