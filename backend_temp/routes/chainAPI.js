// Chain API Routes - Multi-Chain Data Aggregation
import express from 'express';
import MultiChainService from '../services/MultiChainService.js';
import MultiChainAggregator from '../services/MultiChainAggregator.js';
import {
  createAPIRateLimiter,
  createPerChainRateLimiter,
  chainRateLimitMiddleware,
  CostBasedRateLimiter,
} from '../middleware/rateLimiter.js';
const router = express.Router();

// Initialize rate limiters
const apiLimiter = createAPIRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

const chainLimiter = createPerChainRateLimiter({
  windowMs: 10 * 1000, // 10 seconds
  maxRequests: 20,
});

const costLimiter = new CostBasedRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxCost: 1000,
});

// Initialize services lazily to prevent startup crashes
let multiChainService = null;
let multiChainAggregator = null;

// Lazy initialization function
function getMultiChainService() {
  if (!multiChainService) {
    try {
      multiChainService = new MultiChainService();
    } catch (error) {
      console.error('Failed to initialize MultiChainService:', error);
      // Return a mock service that handles errors gracefully
      multiChainService = {
        getMultiChainBalance: () => Promise.resolve({ error: 'Service unavailable' }),
        healthCheck: () => Promise.resolve({ healthy: false, error: 'Service unavailable' }),
        getStats: () => ({ error: 'Service unavailable' }),
      };
    }
  }
  return multiChainService;
}

function getMultiChainAggregator() {
  if (!multiChainAggregator) {
    try {
      multiChainAggregator = new MultiChainAggregator(getMultiChainService());
    } catch (error) {
      console.error('Failed to initialize MultiChainAggregator:', error);
      multiChainAggregator = null;
    }
  }
  return multiChainAggregator;
}

/**
 * Get multi-chain balance for address
 * GET /api/v1/chain/balance/:address
 */
router.get('/balance/:address', apiLimiter.middleware(), async (req, res) => {
  try {
    const { address } = req.params;
    const { includeTokens = false } = req.query;

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({
        error: 'Invalid address format',
        message: 'Address must be a valid Ethereum address (0x...)',
      });
    }

    // Check cost-based rate limit
    if (!costLimiter.canPerform(req.user?.address || req.ip, 'read_balance')) {
      return res.status(429).json({
        error: 'Cost limit exceeded',
        message: 'Too many expensive operations in this billing period',
      });
    }

    const balances = await getMultiChainService().getMultiChainBalance(address);

    // Record operation cost
    costLimiter.recordOperation(req.user?.address || req.ip, 'read_balance');

    // Include token balances if requested
    if (includeTokens === 'true') {
      // This would require additional configuration
      // For now, just return native balances
    }

    res.json({
      success: true,
      address,
      balances,
      totalChains: Object.keys(balances).length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: error.message,
    });
  }
});

/**
 * Get aggregated portfolio for address
 * GET /api/v1/chain/portfolio/:address
 */
router.get('/portfolio/:address', apiLimiter.middleware(), async (req, res) => {
  try {
    const { address } = req.params;
    const { details = false } = req.query;

    // Validate address
    if (!address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({
        error: 'Invalid address format',
      });
    }

    // Check rate limit
    if (!costLimiter.canPerform(req.user?.address || req.ip, 'read_history')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
      });
    }

    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const portfolio = await aggregator.getAggregatedPortfolio(address, {
      includeDetails: details === 'true',
    });

    costLimiter.recordOperation(req.user?.address || req.ip, 'read_history');

    res.json({
      success: true,
      address,
      portfolio,
      totalValue: portfolio.totalValue,
      chainBreakdown: portfolio.chainBreakdown,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio',
      message: error.message,
    });
  }
});

/**
 * Get NFT portfolio across chains
 * GET /api/v1/chain/nft-portfolio/:address
 */
router.get('/nft-portfolio/:address', chainRateLimitMiddleware(chainLimiter), async (req, res) => {
  try {
    const { address } = req.params;
    const { contracts, summary = true } = req.query;

    if (!address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({
        error: 'Invalid address format',
      });
    }

    if (!costLimiter.canPerform(req.user?.address || req.ip, 'read_nft')) {
      return res.status(429).json({
        error: 'NFT query limit exceeded',
      });
    }

    let contractsByChain = {};
    if (contracts) {
      // Parse contracts parameter: { chain: ['contract1', 'contract2'] }
      try {
        contractsByChain = JSON.parse(decodeURIComponent(contracts));
      } catch (e) {
        return res.status(400).json({
          error: 'Invalid contracts format',
          message: 'Contracts must be JSON object: {"chain": ["0x..."]}',
        });
      }
    }

    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const nftPortfolio = await aggregator.getAggregatedNFTPortfolio(
      address,
      contractsByChain
    );

    costLimiter.recordOperation(req.user?.address || req.ip, 'read_nft');

    res.json({
      success: true,
      address,
      nftPortfolio,
      totalNFTs: nftPortfolio.totalCount,
      chainSummary: summary === 'true' ? nftPortfolio.chainSummary : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching NFT portfolio:', error);
    res.status(500).json({
      error: 'Failed to fetch NFT portfolio',
      message: error.message,
    });
  }
});

/**
 * Get gas prices across chains
 * GET /api/v1/chain/gas-prices
 */
router.get('/gas-prices', apiLimiter.middleware(), async (req, res) => {
  try {
    const { sortBy = 'price' } = req.query;

    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const gasPrices = await aggregator.getBestGasPrices();

    // Sort results
    let sortedPrices = Object.entries(gasPrices).map(([chain, prices]) => ({
      chain,
      ...prices,
    }));

    if (sortBy === 'price') {
      sortedPrices.sort((a, b) => parseFloat(a.standard) - parseFloat(b.standard));
    } else if (sortBy === 'speed') {
      sortedPrices.sort((a, b) => b.fast - a.fast);
    }

    res.json({
      success: true,
      gasPrices: sortedPrices,
      cheapest: sortedPrices[0] || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    res.status(500).json({
      error: 'Failed to fetch gas prices',
      message: error.message,
    });
  }
});

/**
 * Get overall network status
 * GET /api/v1/chain/status
 */
router.get('/status', apiLimiter.middleware(), async (req, res) => {
  try {
    const { details = false } = req.query;

    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const networkStatus = await aggregator.getNetworkStatus();
    const gasPrices = await aggregator.getBestGasPrices();

    const response = {
      success: true,
      networkStatus: {
        overallHealth: networkStatus.overallHealth,
        activeChains: networkStatus.activeChains,
        gasPrices,
        chains: details === 'true' ? networkStatus.chains : undefined,
      },
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching network status:', error);
    res.status(500).json({
      error: 'Failed to fetch network status',
      message: error.message,
    });
  }
});

/**
 * Get transaction history across chains
 * GET /api/v1/chain/transactions/:address
 */
router.get('/transactions/:address', chainRateLimitMiddleware(chainLimiter), async (req, res) => {
  try {
    const { address } = req.params;
    const { chains = 'all', limit = 50 } = req.query;

    if (!address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({
        error: 'Invalid address format',
      });
    }

    if (!costLimiter.canPerform(req.user?.address || req.ip, 'read_history')) {
      return res.status(429).json({
        error: 'Transaction history limit exceeded',
      });
    }

    const chainList =
      chains === 'all'
        ? ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche']
        : chains.split(',');

    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const transactions = await aggregator.getAggregatedTransactionHistory(
      address,
      chainList
    );

    costLimiter.recordOperation(req.user?.address || req.ip, 'read_history');

    // Sort by timestamp and limit
    const sorted = transactions.sort((a, b) => b.timestamp - a.timestamp).slice(0, parseInt(limit));

    res.json({
      success: true,
      address,
      transactions: sorted,
      total: transactions.length,
      chains: chainList,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

/**
 * Check for arbitrage opportunities
 * GET /api/v1/chain/arbitrage
 */
router.get('/arbitrage', apiLimiter.middleware(), async (req, res) => {
  try {
    const { tokens } = req.query;

    if (!tokens) {
      return res.status(400).json({
        error: 'Missing tokens parameter',
        message: 'Provide comma-separated token addresses',
      });
    }

    const tokenList = tokens.split(',').map(t => t.trim());

    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const opportunities = await aggregator.getArbitrageOpportunities(tokenList);

    res.json({
      success: true,
      opportunities,
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error checking arbitrage:', error);
    res.status(500).json({
      error: 'Failed to check arbitrage opportunities',
      message: error.message,
    });
  }
});

/**
 * Validate chain API request
 * POST /api/v1/chain/validate
 */
router.post('/validate', apiLimiter.middleware(), async (req, res) => {
  try {
    const { address, operation = 'read_balance' } = req.body;

    // Validate address
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({
        error: 'Invalid address',
        valid: false,
      });
    }

    // Check if operation allowed by rate limit
    const canPerform = costLimiter.canPerform(req.user?.address || req.ip, operation);

    const multiChainHealth = await getMultiChainService().healthCheck();

    res.json({
      success: true,
      valid: true,
      address,
      operation,
      allowed: canPerform,
      chainHealth: multiChainHealth,
      usage: costLimiter.getUsage(req.user?.address || req.ip),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error validating request:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message,
      valid: false,
    });
  }
});

/**
 * Get service statistics
 * GET /api/v1/chain/stats
 */
router.get('/stats', apiLimiter.middleware(), async (req, res) => {
  try {
    const multiChainStats = getMultiChainService().getStats();
    const aggregator = getMultiChainAggregator();
    if (!aggregator) {
      return res.status(503).json({ error: 'Multi-chain service unavailable' });
    }
    const networkStatus = await aggregator.getNetworkStatus();

    res.json({
      success: true,
      stats: {
        multiChain: multiChainStats,
        networkStatus,
        rateLimiters: {
          api: apiLimiter.getStats(),
          chain: chainLimiter.getStats(),
        },
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 * GET /api/v1/chain/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getMultiChainService().healthCheck();

    const statusCode = health.healthy ? 200 : 503;

    res.status(statusCode).json({
      success: health.healthy,
      health,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
    });
  }
});

export default router;
