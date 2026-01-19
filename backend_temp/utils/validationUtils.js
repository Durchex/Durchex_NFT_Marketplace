/**
 * validationUtils.js
 * Input validation utilities
 */

const validator = require('validator');

class ValidationUtils {
    /**
     * Validate email
     */
    static isValidEmail(email) {
        return validator.isEmail(email);
    }

    /**
     * Validate Ethereum address
     */
    static isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Validate token ID (numeric)
     */
    static isValidTokenId(tokenId) {
        return /^\d+$/.test(String(tokenId));
    }

    /**
     * Validate price (positive number)
     */
    static isValidPrice(price) {
        const num = parseFloat(price);
        return !isNaN(num) && num > 0 && num <= 1000000; // Max 1M
    }

    /**
     * Validate percentage (0-100)
     */
    static isValidPercentage(percentage) {
        const num = parseFloat(percentage);
        return !isNaN(num) && num >= 0 && num <= 100;
    }

    /**
     * Validate string length
     */
    static isValidLength(str, min = 1, max = 500) {
        const len = String(str).trim().length;
        return len >= min && len <= max;
    }

    /**
     * Validate URL
     */
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate IPFS hash
     */
    static isValidIPFSHash(hash) {
        return /^Qm[A-Z0-9]{44}$/.test(hash) || /^bafy[A-Z0-9]{50,}$/.test(hash);
    }

    /**
     * Validate JSON
     */
    static isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sanitize string input
     */
    static sanitizeString(str) {
        return validator.trim(validator.escape(String(str)));
    }

    /**
     * Sanitize object - recursively sanitize all string properties
     */
    static sanitizeObject(obj) {
        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Validate NFT metadata
     */
    static isValidNFTMetadata(metadata) {
        const required = ['name', 'description', 'image'];

        for (const field of required) {
            if (!metadata[field] || !this.isValidLength(metadata[field])) {
                return false;
            }
        }

        if (
            metadata.image &&
            !this.isValidURL(metadata.image) &&
            !this.isValidIPFSHash(metadata.image)
        ) {
            return false;
        }

        return true;
    }

    /**
     * Validate pagination params
     */
    static isValidPagination(limit, skip) {
        const lim = parseInt(limit) || 20;
        const skp = parseInt(skip) || 0;

        return (
            lim > 0 &&
            lim <= 100 &&
            skp >= 0 &&
            skp <= 1000000
        );
    }

    /**
     * Validate filter params
     */
    static isValidFilters(filters) {
        if (!filters || typeof filters !== 'object') {
            return true; // Filters are optional
        }

        // Validate price range
        if (filters.minPrice || filters.maxPrice) {
            const minPrice = parseFloat(filters.minPrice) || 0;
            const maxPrice = parseFloat(filters.maxPrice) || Infinity;

            if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
                return false;
            }
        }

        // Validate collection
        if (filters.collection && !this.isValidLength(filters.collection, 1, 100)) {
            return false;
        }

        // Validate rarity
        if (filters.rarity && !['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(filters.rarity)) {
            return false;
        }

        return true;
    }

    /**
     * Validate sort params
     */
    static isValidSort(sort) {
        const validSorts = ['newest', 'oldest', 'price-low', 'price-high', 'most-viewed', 'most-liked'];
        return !sort || validSorts.includes(sort);
    }

    /**
     * Validate transaction type
     */
    static isValidTransactionType(type) {
        const validTypes = ['sale', 'resale', 'auction', 'offer', 'mint'];
        return validTypes.includes(type);
    }

    /**
     * Check for SQL injection patterns
     */
    static hasSQLInjectionPatterns(str) {
        const patterns = [
            /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\bdrop\b|\bdelete\b|\bupdate\b|\binsert\b)/gi,
            /(-{2}|\/\*|\*\/|;)/g,
        ];

        return patterns.some(pattern => pattern.test(String(str)));
    }

    /**
     * Check for XSS patterns
     */
    static hasXSSPatterns(str) {
        const patterns = [
            /<script[^>]*>[\s\S]*?<\/script>/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
            /javascript:/gi,
        ];

        return patterns.some(pattern => pattern.test(String(str)));
    }

    /**
     * Comprehensive validation
     */
    static validateInput(input, rules) {
        const errors = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = input[field];

            if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
                errors.push(`${field} is required`);
                continue;
            }

            if (value) {
                if (rule.type === 'email' && !this.isValidEmail(value)) {
                    errors.push(`${field} must be a valid email`);
                }

                if (rule.type === 'address' && !this.isValidAddress(value)) {
                    errors.push(`${field} must be a valid address`);
                }

                if (rule.type === 'price' && !this.isValidPrice(value)) {
                    errors.push(`${field} must be a valid price`);
                }

                if (rule.type === 'percentage' && !this.isValidPercentage(value)) {
                    errors.push(`${field} must be between 0 and 100`);
                }

                if (rule.type === 'url' && !this.isValidURL(value)) {
                    errors.push(`${field} must be a valid URL`);
                }

                if (rule.minLength && !this.isValidLength(value, rule.minLength)) {
                    errors.push(`${field} must be at least ${rule.minLength} characters`);
                }

                if (rule.maxLength && !this.isValidLength(value, 0, rule.maxLength)) {
                    errors.push(`${field} must not exceed ${rule.maxLength} characters`);
                }

                if (rule.custom && !rule.custom(value)) {
                    errors.push(rule.errorMessage || `${field} is invalid`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

module.exports = ValidationUtils;
