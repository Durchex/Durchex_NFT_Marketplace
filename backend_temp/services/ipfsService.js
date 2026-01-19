/**
 * IPFS Integration Service
 * Handles NFT metadata and image uploads to IPFS
 * Supports both NFT.storage and Pinata providers
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class IPFSService {
    constructor() {
        this.provider = process.env.IPFS_PROVIDER || 'nftstorage'; // 'nftstorage' or 'pinata'
        this.nftStorageKey = process.env.NFT_STORAGE_API_KEY;
        this.pinataKey = process.env.PINATA_API_KEY;
        this.pinataSecret = process.env.PINATA_API_SECRET;
        this.uploadCache = new Map(); // Cache uploaded files to avoid duplicates
        this.maxFileSize = 50 * 1024 * 1024; // 50MB max
    }

    /**
     * Upload image to IPFS
     * @param {Buffer|string} imageData - Image file buffer or path
     * @param {string} fileName - Original filename
     * @returns {Promise<string>} - IPFS CID
     */
    async uploadImage(imageData, fileName) {
        try {
            let buffer;

            // Handle file path or buffer
            if (typeof imageData === 'string') {
                if (!fs.existsSync(imageData)) {
                    throw new Error(`File not found: ${imageData}`);
                }
                buffer = fs.readFileSync(imageData);
            } else {
                buffer = imageData;
            }

            // Check file size
            if (buffer.length > this.maxFileSize) {
                throw new Error(`File too large: ${buffer.length} > ${this.maxFileSize}`);
            }

            // Check cache
            const hash = this.hashBuffer(buffer);
            if (this.uploadCache.has(hash)) {
                logger.info('Image already uploaded', { fileName, cid: this.uploadCache.get(hash) });
                return this.uploadCache.get(hash);
            }

            // Upload based on provider
            let cid;
            if (this.provider === 'nftstorage') {
                cid = await this.uploadToNFTStorage(buffer, fileName);
            } else if (this.provider === 'pinata') {
                cid = await this.uploadToPinata(buffer, fileName);
            } else {
                throw new Error(`Unknown IPFS provider: ${this.provider}`);
            }

            // Cache result
            this.uploadCache.set(hash, cid);

            logger.info('Image uploaded to IPFS', {
                fileName,
                cid,
                provider: this.provider,
                size: buffer.length
            });

            return cid;
        } catch (error) {
            logger.error('Failed to upload image', { error: error.message, fileName });
            throw error;
        }
    }

    /**
     * Upload metadata JSON to IPFS
     * @param {Object} metadata - NFT metadata object
     * @returns {Promise<string>} - IPFS CID
     */
    async uploadMetadata(metadata) {
        try {
            const jsonString = JSON.stringify(metadata, null, 2);
            const buffer = Buffer.from(jsonString, 'utf-8');

            // Check cache
            const hash = this.hashBuffer(buffer);
            if (this.uploadCache.has(hash)) {
                logger.info('Metadata already uploaded', { cid: this.uploadCache.get(hash) });
                return this.uploadCache.get(hash);
            }

            // Upload based on provider
            let cid;
            if (this.provider === 'nftstorage') {
                cid = await this.uploadToNFTStorage(buffer, 'metadata.json', 'application/json');
            } else if (this.provider === 'pinata') {
                cid = await this.uploadToPinata(buffer, 'metadata.json', 'application/json');
            } else {
                throw new Error(`Unknown IPFS provider: ${this.provider}`);
            }

            // Cache result
            this.uploadCache.set(hash, cid);

            logger.info('Metadata uploaded to IPFS', {
                cid,
                provider: this.provider,
                size: buffer.length
            });

            return cid;
        } catch (error) {
            logger.error('Failed to upload metadata', { error: error.message });
            throw error;
        }
    }

    /**
     * Upload to NFT.storage
     * @private
     */
    async uploadToNFTStorage(buffer, fileName, contentType = 'application/octet-stream') {
        if (!this.nftStorageKey) {
            throw new Error('NFT_STORAGE_API_KEY not configured');
        }

        try {
            const response = await axios.post(
                'https://api.nft.storage/upload',
                buffer,
                {
                    headers: {
                        'Authorization': `Bearer ${this.nftStorageKey}`,
                        'Content-Type': contentType,
                        'Content-Filename': fileName
                    }
                }
            );

            if (!response.data.ok) {
                throw new Error(`NFT.storage error: ${response.data.error}`);
            }

            return response.data.value.cid;
        } catch (error) {
            logger.error('NFT.storage upload failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Upload to Pinata
     * @private
     */
    async uploadToPinata(buffer, fileName, contentType = 'application/octet-stream') {
        if (!this.pinataKey || !this.pinataSecret) {
            throw new Error('PINATA_API_KEY or PINATA_API_SECRET not configured');
        }

        try {
            const formData = new FormData();
            formData.append('file', buffer, {
                filename: fileName,
                contentType: contentType
            });

            const response = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'pinata_api_key': this.pinataKey,
                        'pinata_secret_api_key': this.pinataSecret
                    }
                }
            );

            if (!response.data.IpfsHash) {
                throw new Error('No IPFS hash returned from Pinata');
            }

            return response.data.IpfsHash;
        } catch (error) {
            logger.error('Pinata upload failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Create complete NFT metadata with image
     * @param {Object} nftData - NFT metadata (name, description, etc.)
     * @param {Buffer|string} imageData - Image file buffer or path
     * @param {string} fileName - Image filename
     * @returns {Promise<Object>} - { metadataCID, imageCID, metadataURI }
     */
    async createNFTMetadata(nftData, imageData, fileName) {
        try {
            // Upload image first
            const imageCID = await this.uploadImage(imageData, fileName);

            // Create metadata object with image URL
            const metadata = {
                name: nftData.name,
                description: nftData.description,
                image: `ipfs://${imageCID}`,
                attributes: nftData.attributes || [],
                created: new Date().toISOString(),
                creator: nftData.creator,
                royalties: nftData.royaltyPercentage || 0,
                external_url: nftData.externalUrl || '',
                animation_url: nftData.animationUrl || ''
            };

            // Upload metadata
            const metadataCID = await this.uploadMetadata(metadata);

            // Create metadata URI for smart contract
            const metadataURI = `ipfs://${metadataCID}`;

            logger.info('NFT metadata created', {
                imageCID,
                metadataCID,
                metadataURI,
                name: nftData.name
            });

            return {
                imageCID,
                metadataCID,
                metadataURI,
                metadata
            };
        } catch (error) {
            logger.error('Failed to create NFT metadata', { error: error.message });
            throw error;
        }
    }

    /**
     * Retrieve metadata from IPFS
     * @param {string} cid - IPFS CID
     * @returns {Promise<Object>} - Metadata object
     */
    async getMetadata(cid) {
        try {
            // Remove ipfs:// prefix if present
            const cleanCID = cid.replace('ipfs://', '');

            const response = await axios.get(
                `https://ipfs.io/ipfs/${cleanCID}`,
                { timeout: 10000 }
            );

            return response.data;
        } catch (error) {
            logger.error('Failed to retrieve metadata from IPFS', { error: error.message, cid });
            throw error;
        }
    }

    /**
     * Retrieve image from IPFS
     * @param {string} cid - IPFS CID
     * @returns {string} - IPFS gateway URL
     */
    getImageURL(cid) {
        const cleanCID = cid.replace('ipfs://', '');
        return `https://ipfs.io/ipfs/${cleanCID}`;
    }

    /**
     * Pin file to IPFS (make permanent)
     * @param {string} cid - IPFS CID to pin
     */
    async pinFile(cid) {
        try {
            if (this.provider === 'pinata') {
                const cleanCID = cid.replace('ipfs://', '');
                const response = await axios.post(
                    `https://api.pinata.cloud/pinning/pinByHash`,
                    { hashToPin: cleanCID },
                    {
                        headers: {
                            'pinata_api_key': this.pinataKey,
                            'pinata_secret_api_key': this.pinataSecret
                        }
                    }
                );
                logger.info('File pinned to Pinata', { cid });
            } else {
                // NFT.storage automatically keeps files for 365 days
                logger.info('File already pinned with NFT.storage', { cid });
            }
        } catch (error) {
            logger.error('Failed to pin file', { error: error.message, cid });
            throw error;
        }
    }

    /**
     * Batch upload multiple images
     * @param {Array<{data, fileName}>} images - Array of image objects
     * @returns {Promise<Array<string>>} - Array of CIDs
     */
    async uploadBatchImages(images) {
        try {
            const cids = await Promise.all(
                images.map(img => this.uploadImage(img.data, img.fileName))
            );
            
            logger.info('Batch upload complete', { count: images.length });
            return cids;
        } catch (error) {
            logger.error('Batch upload failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get provider status
     * @returns {Promise<Object>} - Provider health status
     */
    async getProviderStatus() {
        try {
            if (this.provider === 'nftstorage') {
                const response = await axios.get(
                    'https://api.nft.storage//',
                    {
                        headers: {
                            'Authorization': `Bearer ${this.nftStorageKey}`
                        }
                    }
                );
                return {
                    provider: 'nftstorage',
                    status: 'healthy',
                    details: response.data
                };
            } else if (this.provider === 'pinata') {
                const response = await axios.get(
                    'https://api.pinata.cloud/data/testAuthentication',
                    {
                        headers: {
                            'pinata_api_key': this.pinataKey,
                            'pinata_secret_api_key': this.pinataSecret
                        }
                    }
                );
                return {
                    provider: 'pinata',
                    status: 'healthy',
                    details: response.data
                };
            }
        } catch (error) {
            logger.error('Provider status check failed', { error: error.message });
            return {
                provider: this.provider,
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Hash buffer for deduplication
     * @private
     */
    hashBuffer(buffer) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Clear upload cache
     */
    clearCache() {
        this.uploadCache.clear();
        logger.info('IPFS upload cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.uploadCache.size,
            provider: this.provider,
            maxFileSize: this.maxFileSize,
            timestamp: new Date()
        };
    }
}

// Export singleton
module.exports = new IPFSService();
