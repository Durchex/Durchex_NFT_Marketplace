// Advanced Rate Limiting Middleware
const NodeCache = require('node-cache');

/**
 * Rate limiter using sliding window algorithm
 */
class SlidingWindowRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
    this.maxRequests = options.maxRequests || 100;
    this.keyPrefix = options.keyPrefix || 'rl_';
    this.store = new NodeCache({ stdTTL: Math.ceil(this.windowMs / 1000) });
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
  }

  /**
   * Generate rate limit key
   */
  getKey(req) {
    return this.keyPrefix + (req.user?.address || req.ip);
  }

  /**
   * Increment request count
   */
  increment(key) {
    const current = this.store.get(key) || { count: 0, resetTime: Date.now() + this.windowMs };
    current.count++;
    this.store.set(key, current);
    return current;
  }

  /**
   * Check rate limit
   */
  isLimited(key) {
    const current = this.store.get(key);
    if (!current) return false;
    return current.count > this.maxRequests;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key) {
    const current = this.store.get(key);
    if (!current) return this.maxRequests;
    return Math.max(0, this.maxRequests - current.count);
  }

  /**
   * Get reset time
   */
  getResetTime(key) {
    const current = this.store.get(key);
    return current ? current.resetTime : Date.now() + this.windowMs;
  }

  /**
   * Middleware function
   */
  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const record = this.increment(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.getRemaining(key));
      res.setHeader('X-RateLimit-Reset', Math.ceil(this.getResetTime(key) / 1000));

      if (this.isLimited(key)) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded: ${this.maxRequests} requests per ${this.windowMs / 1000}s`,
          retryAfter: Math.ceil((this.getResetTime(key) - Date.now()) / 1000),
        });
      }

      // Store rate limiter info on request for later use
      req.rateLimit = {
        limit: this.maxRequests,
        current: record.count,
        remaining: this.getRemaining(key),
        resetTime: this.getResetTime(key),
      };

      next();
    };
  }

  /**
   * Reset limit for a key
   */
  reset(key) {
    this.store.del(key);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeLimits: this.store.keys().length,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
    };
  }
}

/**
 * Create rate limiter for API calls
 */
function createAPIRateLimiter(options = {}) {
  return new SlidingWindowRateLimiter({
    windowMs: options.windowMs || 60 * 1000,
    maxRequests: options.maxRequests || 100,
    keyPrefix: 'api_',
  });
}

/**
 * Create rate limiter for blockchain queries
 */
function createBlockchainRateLimiter(options = {}) {
  return new SlidingWindowRateLimiter({
    windowMs: options.windowMs || 10 * 1000,
    maxRequests: options.maxRequests || 10,
    keyPrefix: 'blockchain_',
  });
}

/**
 * Create per-chain rate limiter
 */
function createPerChainRateLimiter(options = {}) {
  return new SlidingWindowRateLimiter({
    windowMs: options.windowMs || 5 * 1000,
    maxRequests: options.maxRequests || 5,
    keyPrefix: 'chain_',
  });
}

/**
 * Chain-specific rate limiter middleware
 */
function chainRateLimitMiddleware(limiter) {
  return (req, res, next) => {
    const chain = req.params.chain || req.query.chain;
    if (!chain) {
      return next();
    }

    const key = `${limiter.keyPrefix}${req.user?.address || req.ip}_${chain}`;
    const record = limiter.increment(key);

    res.setHeader('X-ChainRateLimit-Limit', limiter.maxRequests);
    res.setHeader('X-ChainRateLimit-Remaining', limiter.getRemaining(key));
    res.setHeader('X-ChainRateLimit-Reset', Math.ceil(limiter.getResetTime(key) / 1000));

    if (limiter.isLimited(key)) {
      return res.status(429).json({
        error: 'Chain rate limit exceeded',
        chain,
        retryAfter: Math.ceil((limiter.getResetTime(key) - Date.now()) / 1000),
      });
    }

    next();
  };
}

/**
 * Cost-based rate limiter (for expensive operations)
 */
class CostBasedRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 60 * 1000; // 1 hour
    this.maxCost = options.maxCost || 1000;
    this.costFunctions = options.costFunctions || {};
    this.store = new NodeCache({ stdTTL: Math.ceil(this.windowMs / 1000) });
  }

  /**
   * Get operation cost
   */
  getOperationCost(operation) {
    const costs = {
      'read_balance': 1,
      'read_nft': 2,
      'read_token': 2,
      'write_transaction': 10,
      'write_mint': 20,
      'read_history': 5,
      'cross_chain_query': 8,
    };

    return costs[operation] || this.costFunctions[operation] || 5;
  }

  /**
   * Check if operation allowed
   */
  canPerform(key, operation) {
    const cost = this.getOperationCost(operation);
    const record = this.store.get(key) || { totalCost: 0 };

    return record.totalCost + cost <= this.maxCost;
  }

  /**
   * Record operation
   */
  recordOperation(key, operation) {
    const cost = this.getOperationCost(operation);
    const record = this.store.get(key) || { totalCost: 0, operations: [] };

    record.totalCost += cost;
    record.operations.push({
      operation,
      cost,
      timestamp: Date.now(),
    });

    this.store.set(key, record);
    return {
      cost,
      totalCost: record.totalCost,
      remaining: Math.max(0, this.maxCost - record.totalCost),
    };
  }

  /**
   * Get usage stats
   */
  getUsage(key) {
    const record = this.store.get(key);
    if (!record) {
      return { totalCost: 0, remaining: this.maxCost, operations: [] };
    }

    return {
      totalCost: record.totalCost,
      remaining: Math.max(0, this.maxCost - record.totalCost),
      operations: record.operations,
    };
  }

  /**
   * Reset usage
   */
  reset(key) {
    this.store.del(key);
  }
}

module.exports = {
  SlidingWindowRateLimiter,
  CostBasedRateLimiter,
  createAPIRateLimiter,
  createBlockchainRateLimiter,
  createPerChainRateLimiter,
  chainRateLimitMiddleware,
};
