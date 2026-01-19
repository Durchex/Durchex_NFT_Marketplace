/**
 * rateLimitMiddleware.js
 * Rate limiting middleware for API endpoints
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient();

/**
 * Global rate limiter - 100 requests per 15 minutes
 */
const globalLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:global:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter - 10 requests per minute (for auth endpoints)
 */
const authLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:',
    }),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    skipSuccessfulRequests: false, // Count all requests
    message: 'Too many login attempts, please try again later.',
});

/**
 * Moderate rate limiter - 30 requests per minute
 */
const moderateLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:moderate:',
    }),
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'Too many requests, please try again later.',
});

/**
 * Lenient rate limiter - 60 requests per minute
 */
const lenientLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:lenient:',
    }),
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: 'Too many requests, please try again later.',
});

/**
 * NFT upload rate limiter - 5 requests per hour
 */
const uploadLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:upload:',
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many uploads, please try again later.',
});

/**
 * Search rate limiter - 50 requests per minute
 */
const searchLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:search:',
    }),
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: 'Too many search requests, please try again later.',
});

/**
 * Bidding rate limiter - 20 bids per minute
 */
const biddingLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:bidding:',
    }),
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: 'Too many bids, please try again later.',
});

/**
 * Custom whitelist for trusted IPs
 */
const whitelistedIPs = process.env.WHITELISTED_IPS
    ? process.env.WHITELISTED_IPS.split(',')
    : [];

/**
 * Whitelist middleware
 */
const whitelistMiddleware = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (whitelistedIPs.includes(clientIP)) {
        return next(); // Skip rate limiting for whitelisted IPs
    }

    next();
};

module.exports = {
    globalLimiter,
    authLimiter,
    moderateLimiter,
    lenientLimiter,
    uploadLimiter,
    searchLimiter,
    biddingLimiter,
    whitelistMiddleware,
};
