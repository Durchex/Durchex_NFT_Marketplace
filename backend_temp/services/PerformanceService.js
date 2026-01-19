/**
 * Performance Optimization Service - Caching, Indexing, Query Optimization
 * Features:
 * - Multi-tier caching (memory, Redis)
 * - Database query optimization
 * - Index management and analysis
 * - Performance metrics and monitoring
 * - Rate limiting and throttling
 */

const logger = require('../utils/logger');

class PerformanceService {
  constructor() {
    // Cache configuration
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Cache TTL (in milliseconds)
    this.cacheTTL = {
      short: 5 * 60 * 1000,      // 5 minutes
      medium: 30 * 60 * 1000,    // 30 minutes
      long: 24 * 60 * 60 * 1000  // 24 hours
    };
    
    // Database indexes
    this.indexes = new Map();
    
    // Performance metrics
    this.metrics = {
      queryTimes: [],
      cacheHitRatio: 0,
      databaseConnections: 0,
      activeRequests: 0,
      slowQueries: []
    };
    
    // Rate limiting buckets
    this.rateLimitBuckets = new Map();
    
    // Query optimization hints
    this.queryOptimizations = this.initializeQueryOptimizations();
  }

  // ========== Caching ==========

  /**
   * Get value from cache
   */
  async getFromCache(key) {
    try {
      const cached = this.memoryCache.get(key);
      
      if (cached) {
        // Check if expired
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
          this.memoryCache.delete(key);
          this.cacheStats.misses++;
          return null;
        }
        
        this.cacheStats.hits++;
        logger.debug('Cache hit', { key });
        return cached.value;
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      logger.error('Cache get error', { error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async setInCache(key, value, ttlType = 'medium') {
    try {
      const ttl = this.cacheTTL[ttlType] || this.cacheTTL.medium;
      
      this.memoryCache.set(key, {
        value,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl
      });

      this.cacheStats.sets++;

      logger.debug('Cache set', { key, ttlType });
      return true;
    } catch (error) {
      logger.error('Cache set error', { error: error.message });
      return false;
    }
  }

  /**
   * Delete from cache
   */
  async deleteFromCache(key) {
    try {
      this.memoryCache.delete(key);
      this.cacheStats.deletes++;
      logger.debug('Cache delete', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { error: error.message });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      const size = this.memoryCache.size;
      this.memoryCache.clear();
      logger.info('Cache cleared', { itemsCleared: size });
      return { itemsCleared: size };
    } catch (error) {
      logger.error('Clear cache error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
      const hitRatio = totalRequests > 0 ? (this.cacheStats.hits / totalRequests * 100).toFixed(2) : 0;

      return {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        sets: this.cacheStats.sets,
        deletes: this.cacheStats.deletes,
        hitRatio: `${hitRatio}%`,
        cacheSize: this.memoryCache.size,
        totalMemory: this.estimateCacheMemory()
      };
    } catch (error) {
      logger.error('Get cache stats error', { error: error.message });
      throw error;
    }
  }

  /**
   * Invalidate cache pattern
   */
  async invalidateCachePattern(pattern) {
    try {
      let invalidatedCount = 0;
      const regex = new RegExp(pattern);

      for (const [key] of this.memoryCache) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          invalidatedCount++;
        }
      }

      logger.info('Cache pattern invalidated', { pattern, count: invalidatedCount });
      return invalidatedCount;
    } catch (error) {
      logger.error('Invalidate cache pattern error', { error: error.message });
      throw error;
    }
  }

  // ========== Database Optimization ==========

  /**
   * Create database index
   */
  async createIndex(collection, field, options = {}) {
    try {
      const index = {
        collection,
        field,
        type: options.type || 'btree',
        unique: options.unique || false,
        sparse: options.sparse || false,
        createdAt: new Date(),
        stats: {
          size: 0,
          queries: 0,
          avgQueryTime: 0
        }
      };

      const indexName = `${collection}_${field}_${index.type}`;
      this.indexes.set(indexName, index);

      logger.info('Index created', {
        collection,
        field,
        type: index.type
      });

      return index;
    } catch (error) {
      logger.error('Create index error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats() {
    try {
      const stats = Array.from(this.indexes.values()).map(index => ({
        name: `${index.collection}_${index.field}`,
        collection: index.collection,
        field: index.field,
        type: index.type,
        unique: index.unique,
        size: index.stats.size,
        queries: index.stats.queries,
        avgQueryTime: index.stats.avgQueryTime.toFixed(3)
      }));

      return stats;
    } catch (error) {
      logger.error('Get index stats error', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(query, executionTime) {
    try {
      this.metrics.queryTimes.push({
        query,
        executionTime,
        timestamp: new Date()
      });

      // Track slow queries (> 1000ms)
      if (executionTime > 1000) {
        this.metrics.slowQueries.push({
          query,
          executionTime,
          timestamp: new Date()
        });

        logger.warn('Slow query detected', {
          query: query.substring(0, 100),
          executionTime
        });
      }

      // Keep only recent metrics
      if (this.metrics.queryTimes.length > 10000) {
        this.metrics.queryTimes = this.metrics.queryTimes.slice(-5000);
      }

      return {
        avgTime: this.calculateAverageQueryTime(),
        slowQueryCount: this.metrics.slowQueries.length
      };
    } catch (error) {
      logger.error('Analyze query error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(limit = 20) {
    try {
      const slowQueries = this.metrics.slowQueries
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, limit)
        .map(q => ({
          query: q.query.substring(0, 200),
          executionTime: q.executionTime.toFixed(2),
          timestamp: q.timestamp
        }));

      return slowQueries;
    } catch (error) {
      logger.error('Get slow queries error', { error: error.message });
      throw error;
    }
  }

  // ========== Rate Limiting ==========

  /**
   * Check rate limit
   */
  async checkRateLimit(identifier, limit, windowMs) {
    try {
      const now = Date.now();
      let bucket = this.rateLimitBuckets.get(identifier);

      if (!bucket) {
        bucket = {
          requests: [],
          firstRequest: now
        };
        this.rateLimitBuckets.set(identifier, bucket);
      }

      // Remove old requests outside the window
      bucket.requests = bucket.requests.filter(time => now - time < windowMs);

      if (bucket.requests.length >= limit) {
        const oldestRequest = Math.min(...bucket.requests);
        const resetTime = oldestRequest + windowMs;
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(resetTime),
          retryAfter: Math.ceil((resetTime - now) / 1000)
        };
      }

      bucket.requests.push(now);

      return {
        allowed: true,
        remaining: limit - bucket.requests.length,
        resetAt: new Date(bucket.firstRequest + windowMs)
      };
    } catch (error) {
      logger.error('Rate limit check error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get rate limit stats
   */
  async getRateLimitStats() {
    try {
      const stats = {
        totalBuckets: this.rateLimitBuckets.size,
        buckets: Array.from(this.rateLimitBuckets.entries()).map(([id, bucket]) => ({
          identifier: id,
          activeRequests: bucket.requests.length,
          firstRequest: bucket.firstRequest
        }))
      };

      return stats;
    } catch (error) {
      logger.error('Get rate limit stats error', { error: error.message });
      throw error;
    }
  }

  /**
   * Reset rate limit
   */
  async resetRateLimit(identifier) {
    try {
      this.rateLimitBuckets.delete(identifier);
      logger.info('Rate limit reset', { identifier });
      return true;
    } catch (error) {
      logger.error('Reset rate limit error', { error: error.message });
      throw error;
    }
  }

  // ========== Performance Monitoring ==========

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    try {
      const cacheStats = await this.getCacheStats();
      const avgQueryTime = this.calculateAverageQueryTime();
      const slowQueryCount = this.metrics.slowQueries.length;

      return {
        cache: cacheStats,
        database: {
          avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
          slowQueryCount,
          totalQueries: this.metrics.queryTimes.length
        },
        indexes: {
          total: this.indexes.size,
          activeIndexes: Array.from(this.indexes.values()).filter(i => i.stats.queries > 0).length
        },
        rateLimiting: {
          activeLimitBuckets: this.rateLimitBuckets.size
        },
        memory: {
          cacheMemory: this.estimateCacheMemory(),
          indexMemory: this.estimateIndexMemory()
        }
      };
    } catch (error) {
      logger.error('Get performance metrics error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations() {
    try {
      const recommendations = [];
      const cacheStats = await this.getCacheStats();
      const avgQueryTime = this.calculateAverageQueryTime();

      // Cache hit ratio recommendation
      const hitRatio = parseFloat(cacheStats.hitRatio);
      if (hitRatio < 50) {
        recommendations.push({
          priority: 'HIGH',
          category: 'caching',
          message: 'Cache hit ratio is low. Consider increasing cache TTL or adding more cache keys.',
          currentRatio: `${hitRatio}%`,
          targetRatio: '80%'
        });
      }

      // Query performance recommendation
      if (avgQueryTime > 500) {
        recommendations.push({
          priority: 'HIGH',
          category: 'database',
          message: 'Average query time is high. Consider creating indexes or optimizing queries.',
          currentTime: `${avgQueryTime.toFixed(2)}ms`,
          targetTime: '100ms'
        });
      }

      // Slow query recommendation
      if (this.metrics.slowQueries.length > 10) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'database',
          message: `${this.metrics.slowQueries.length} slow queries detected. Review and optimize.`,
          slowQueryCount: this.metrics.slowQueries.length
        });
      }

      // Index recommendation
      if (this.indexes.size < 5) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'database',
          message: 'Limited indexes found. Consider creating more indexes on frequently queried fields.',
          currentIndexes: this.indexes.size
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Get recommendations error', { error: error.message });
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  initializeQueryOptimizations() {
    return {
      enableProjection: true,
      enableFiltering: true,
      enablePagination: true,
      enableSorting: true,
      batchSize: 1000,
      maxBatchSize: 10000
    };
  }

  calculateAverageQueryTime() {
    if (this.metrics.queryTimes.length === 0) return 0;
    
    const sum = this.metrics.queryTimes.reduce((acc, q) => acc + q.executionTime, 0);
    return sum / this.metrics.queryTimes.length;
  }

  estimateCacheMemory() {
    let totalSize = 0;
    
    for (const [, cached] of this.memoryCache) {
      totalSize += JSON.stringify(cached.value).length;
    }

    return `${(totalSize / 1024 / 1024).toFixed(2)}MB`;
  }

  estimateIndexMemory() {
    let totalSize = 0;

    for (const [, index] of this.indexes) {
      totalSize += index.stats.size;
    }

    return `${(totalSize / 1024 / 1024).toFixed(2)}MB`;
  }
}

module.exports = PerformanceService;
