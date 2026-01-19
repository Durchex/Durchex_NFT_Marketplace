/**
 * securityService.js
 * Security service for API protection
 */

const redis = require('redis');
const redisClient = redis.createClient();

class SecurityService {
    /**
     * Track suspicious activity
     */
    async trackSuspiciousActivity(ipAddress, action, severity = 'low') {
        try {
            const key = `security:activity:${ipAddress}`;
            const timestamp = Date.now();

            // Get current activity count
            const currentData = await redisClient.get(key);
            const data = currentData ? JSON.parse(currentData) : [];

            // Add new activity
            data.push({
                action,
                severity,
                timestamp,
            });

            // Keep only last 100 activities
            const recentData = data.slice(-100);

            // Store with 24-hour TTL
            await redisClient.setEx(
                key,
                24 * 60 * 60,
                JSON.stringify(recentData)
            );

            return recentData;
        } catch (error) {
            console.error('Error tracking suspicious activity:', error);
            throw error;
        }
    }

    /**
     * Check if IP is blocked
     */
    async isIPBlocked(ipAddress) {
        try {
            const blocked = await redisClient.get(`security:blocked:${ipAddress}`);
            return !!blocked;
        } catch (error) {
            console.error('Error checking IP block:', error);
            return false;
        }
    }

    /**
     * Block IP address
     */
    async blockIP(ipAddress, reason, duration = 24 * 60 * 60) {
        try {
            await redisClient.setEx(
                `security:blocked:${ipAddress}`,
                duration,
                JSON.stringify({
                    reason,
                    blockedAt: new Date(),
                })
            );

            console.log(`IP ${ipAddress} blocked for: ${reason}`);
        } catch (error) {
            console.error('Error blocking IP:', error);
            throw error;
        }
    }

    /**
     * Unblock IP address
     */
    async unblockIP(ipAddress) {
        try {
            await redisClient.del(`security:blocked:${ipAddress}`);
        } catch (error) {
            console.error('Error unblocking IP:', error);
            throw error;
        }
    }

    /**
     * Detect DDoS patterns
     */
    async detectDDoS(ipAddress, threshold = 100) {
        try {
            const key = `security:activity:${ipAddress}`;
            const currentData = await redisClient.get(key);
            const data = currentData ? JSON.parse(currentData) : [];

            // Count requests in last minute
            const oneMinuteAgo = Date.now() - 60 * 1000;
            const recentRequests = data.filter(
                (activity) => activity.timestamp > oneMinuteAgo
            );

            const isDDoS = recentRequests.length > threshold;

            if (isDDoS) {
                await this.blockIP(ipAddress, 'Suspected DDoS activity', 3600); // Block for 1 hour
            }

            return {
                isDDoS,
                recentRequests: recentRequests.length,
                threshold,
            };
        } catch (error) {
            console.error('Error detecting DDoS:', error);
            return { isDDoS: false, recentRequests: 0, threshold };
        }
    }

    /**
     * Get security report for IP
     */
    async getSecurityReport(ipAddress) {
        try {
            const key = `security:activity:${ipAddress}`;
            const currentData = await redisClient.get(key);
            const activities = currentData ? JSON.parse(currentData) : [];

            const blocked = await this.isIPBlocked(ipAddress);

            // Analyze activities
            const actionCounts = {};
            const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };

            activities.forEach((activity) => {
                actionCounts[activity.action] =
                    (actionCounts[activity.action] || 0) + 1;
                severityCounts[activity.severity] =
                    (severityCounts[activity.severity] || 0) + 1;
            });

            return {
                ipAddress,
                blocked,
                totalActivities: activities.length,
                actionCounts,
                severityCounts,
                recentActivities: activities.slice(-10),
            };
        } catch (error) {
            console.error('Error generating security report:', error);
            throw error;
        }
    }

    /**
     * Verify CAPTCHA token (placeholder for external service)
     */
    async verifyCAPTCHA(token) {
        try {
            if (!token) {
                return false;
            }

            // Call CAPTCHA service (e.g., reCAPTCHA, hCaptcha)
            // This is a placeholder implementation
            const isValid = await this._verifyCAPTCHAToken(token);

            return isValid;
        } catch (error) {
            console.error('Error verifying CAPTCHA:', error);
            return false;
        }
    }

    /**
     * Generate security headers
     */
    static getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        };
    }

    /**
     * Validate request signature
     */
    static validateSignature(data, signature, secret) {
        const crypto = require('crypto');
        const hmac = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(data))
            .digest('hex');

        return hmac === signature;
    }

    /**
     * Generate secure token
     */
    static generateSecureToken(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Hash password
     */
    static hashPassword(password) {
        const bcrypt = require('bcryptjs');
        return bcrypt.hashSync(password, 10);
    }

    /**
     * Compare password
     */
    static comparePassword(password, hash) {
        const bcrypt = require('bcryptjs');
        return bcrypt.compareSync(password, hash);
    }

    /**
     * Internal: Verify CAPTCHA token
     */
    async _verifyCAPTCHAToken(token) {
        // Placeholder - implement based on chosen CAPTCHA service
        return true;
    }

    /**
     * Log security event
     */
    async logSecurityEvent(event) {
        try {
            const eventKey = `security:events:${Date.now()}`;
            const eventData = {
                ...event,
                timestamp: new Date(),
            };

            await redisClient.setEx(
                eventKey,
                7 * 24 * 60 * 60, // 7 days
                JSON.stringify(eventData)
            );

            // Also log to database for long-term analysis
            console.log(`Security Event: ${JSON.stringify(eventData)}`);
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    }
}

module.exports = new SecurityService();
