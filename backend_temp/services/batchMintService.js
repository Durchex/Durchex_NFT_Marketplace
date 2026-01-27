/**
 * Batch Mint Service
 * Handles bulk NFT minting with bulk operations and status tracking
 */

import LazyMintNFT from '../contracts/LazyMintNFT.js';
import Provider from '../config/provider.js';
import BatchMint from '../models/BatchMint.js';
import NFT from '../models/NFT.js';
import redis from 'redis';
const redisClient = redis.createClient();

class BatchMintService {
    /**
     * Create batch mint operation
     */
    async createBatchMint(userId, nftData, options = {}) {
        const { autoPublish = false, category = null, network = null } = options;

        if (!Array.isArray(nftData) || nftData.length === 0) {
            throw new Error('NFT data array required');
        }

        if (nftData.length > 1000) {
            throw new Error('Maximum 1000 NFTs per batch');
        }

        // Validate all NFTs
        for (const nft of nftData) {
            if (!nft.name || !nft.description || !nft.image) {
                throw new Error('Each NFT requires name, description, and image');
            }
        }

        // Create batch mint record
        const batchMint = new BatchMint({
            creatorId: userId,
            totalCount: nftData.length,
            // Batch-level metadata
            category: category || null,
            network: network || null,
            nfts: nftData.map(nft => ({
                name: nft.name,
                description: nft.description,
                image: nft.image,
                attributes: nft.attributes || [],
                royaltyPercentage: nft.royaltyPercentage || 0,
                category: nft.category || category || null,
                network: nft.network || network || null,
                floorPrice: nft.floorPrice || null,
                unlisted: true,
                status: 'pending'
            })),
            status: 'creating',
            createdAt: new Date()
        });

        await batchMint.save();

        // If autoPublish, start minting immediately
        if (autoPublish) {
            this._processBatchMint(batchMint._id);
        }

        return batchMint;
    }

    /**
     * Process batch mint (internal)
     */
    async _processBatchMint(batchId) {
        try {
            const batch = await BatchMint.findById(batchId);
            if (!batch) return;

            batch.status = 'processing';
            batch.startedAt = new Date();
            await batch.save();

            let successCount = 0;
            let failureCount = 0;
            const errors = [];

            // Process NFTs in chunks of 10
            const chunkSize = 10;
            for (let i = 0; i < batch.nfts.length; i += chunkSize) {
                const chunk = batch.nfts.slice(i, i + chunkSize);

                try {
                    const results = await Promise.allSettled(
                        chunk.map((nft, idx) => this._mintSingleNFT(batch.creatorId, nft, batchId, i + idx))
                    );

                    for (let j = 0; j < results.length; j++) {
                        if (results[j].status === 'fulfilled') {
                            successCount++;
                            batch.nfts[i + j].status = 'minted';
                            batch.nfts[i + j].tokenId = results[j].value;
                        } else {
                            failureCount++;
                            batch.nfts[i + j].status = 'failed';
                            batch.nfts[i + j].error = results[j].reason.message;
                            errors.push({
                                index: i + j,
                                error: results[j].reason.message
                            });
                        }
                    }

                    // Save progress
                    batch.mintedCount = successCount;
                    batch.failedCount = failureCount;
                    await batch.save();
                } catch (err) {
                    console.error('Error processing chunk:', err);
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Mark as complete
            batch.status = 'completed';
            batch.completedAt = new Date();
            batch.errors = errors;
            batch.mintedCount = successCount;
            batch.failedCount = failureCount;
            await batch.save();

            // Clear cache
            await redisClient.del(`batch:${batchId}`);

        } catch (err) {
            console.error('Error processing batch mint:', err);
            const batch = await BatchMint.findById(batchId);
            if (batch) {
                batch.status = 'failed';
                batch.error = err.message;
                await batch.save();
            }
        }
    }

    /**
     * Mint single NFT in batch
     */
    async _mintSingleNFT(userId, nftData, batchId, index) {
        // Upload to IPFS
        const { ipfsService } = require('./ipfsService');
        const metadata = {
            name: nftData.name,
            description: nftData.description,
            image: nftData.image,
            attributes: nftData.attributes
        };

        const ipfsHash = await ipfsService.uploadMetadata(metadata);

        // Create NFT record
        const nft = new NFT({
            creator: userId,
            name: nftData.name,
            description: nftData.description,
            image: nftData.image,
            attributes: nftData.attributes,
            tokenURI: `ipfs://${ipfsHash}`,
            royaltyPercentage: nftData.royaltyPercentage,
            batchId: batchId,
            batchIndex: index,
            unlisted: true
        });

        await nft.save();
        return nft._id;
    }

    /**
     * Get batch mint details
     */
    async getBatchMint(batchId) {
        // Try cache first
        const cached = await redisClient.get(`batch:${batchId}`);
        if (cached) {
            return JSON.parse(cached);
        }

        const batch = await BatchMint.findById(batchId).lean();
        if (!batch) {
            throw new Error('Batch not found');
        }

        // Cache for 1 hour
        await redisClient.setEx(`batch:${batchId}`, 3600, JSON.stringify(batch));

        return batch;
    }

    /**
     * Get batch mint history for user
     */
    async getUserBatches(userId, options = {}) {
        const { limit = 10, skip = 0, status = null } = options;

        const query = { creatorId: userId };
        if (status) query.status = status;

        const batches = await BatchMint.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await BatchMint.countDocuments(query);

        return {
            batches,
            total,
            limit,
            skip
        };
    }

    /**
     * Publish batch NFTs (list on marketplace)
     */
    async publishBatchNFTs(batchId, listings) {
        const batch = await BatchMint.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        if (batch.status !== 'completed') {
            throw new Error('Batch must be completed before publishing');
        }

        let publishedCount = 0;

        for (const listing of listings) {
            const nft = await NFT.findById(listing.nftId);
            if (nft && nft.batchId.toString() === batchId) {
                nft.unlisted = false;
                nft.listingPrice = listing.price;
                nft.forSale = true;
                await nft.save();
                publishedCount++;
            }
        }

        batch.publishedCount = publishedCount;
        batch.publishedAt = new Date();
        await batch.save();

        // Clear cache
        await redisClient.del(`batch:${batchId}`);

        return { publishedCount, total: listings.length };
    }

    /**
     * Get batch statistics
     */
    async getBatchStats(batchId) {
        const batch = await BatchMint.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        const stats = {
            totalCount: batch.totalCount,
            mintedCount: batch.mintedCount || 0,
            failedCount: batch.failedCount || 0,
            publishedCount: batch.publishedCount || 0,
            status: batch.status,
            progress: batch.totalCount > 0 ? ((batch.mintedCount || 0) / batch.totalCount * 100).toFixed(1) : 0,
            createdAt: batch.createdAt,
            completedAt: batch.completedAt,
            errors: batch.errors || []
        };

        return stats;
    }

    /**
     * Export batch as CSV
     */
    async exportBatchAsCSV(batchId) {
        const batch = await BatchMint.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        const csv = [
            ['Index', 'Name', 'Description', 'Status', 'Token ID', 'Royalty %', 'Error']
        ];

        batch.nfts.forEach((nft, idx) => {
            csv.push([
                idx + 1,
                nft.name,
                nft.description,
                nft.status,
                nft.tokenId || '',
                nft.royaltyPercentage || 0,
                nft.error || ''
            ]);
        });

        return csv;
    }

    /**
     * Cancel batch mint
     */
    async cancelBatchMint(batchId) {
        const batch = await BatchMint.findById(batchId);
        if (!batch) {
            throw new Error('Batch not found');
        }

        if (batch.status === 'completed' || batch.status === 'processing') {
            throw new Error('Cannot cancel batch in this status');
        }

        batch.status = 'cancelled';
        batch.cancelledAt = new Date();
        await batch.save();

        // Clear cache
        await redisClient.del(`batch:${batchId}`);

        return batch;
    }

    /**
     * Download batch template
     */
    getCSVTemplate() {
        return [
            ['Name', 'Description', 'Image URL', 'Royalty %', 'Attribute 1', 'Attribute 2'],
            ['Example NFT 1', 'This is an example NFT', 'https://example.com/image.jpg', '10', 'Value 1', 'Value 2'],
            ['Example NFT 2', 'Another example NFT', 'https://example.com/image2.jpg', '5', 'Value 3', 'Value 4']
        ];
    }
}

export default new BatchMintService();
