/**
 * Collection Service
 * Handles collection management and operations
 */

const { ethers } = require('ethers');
const logger = require('../utils/logger');

class CollectionService {
    constructor(provider, contractAddress, contractABI) {
        this.provider = provider;
        this.contract = new ethers.Contract(contractAddress, contractABI, provider);
    }

    /**
     * Initialize with signer
     */
    async initialize(signer) {
        this.contractWithSigner = this.contract.connect(signer);
    }

    /**
     * Create collection
     */
    async createCollection(name, description, imageURI, externalLink) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Service not initialized with signer');
            }

            logger.info('Creating collection', { name });

            const tx = await this.contractWithSigner.createCollection(
                name,
                description,
                imageURI,
                externalLink
            );

            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === 'CollectionCreated');
            const collectionId = event?.args?.collectionId?.toString();

            logger.info('Collection created', { collectionId, name });

            return {
                collectionId,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to create collection', { error: error.message });
            throw error;
        }
    }

    /**
     * Add NFT to collection
     */
    async addNFTToCollection(collectionId, nftContract, tokenId) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Service not initialized with signer');
            }

            logger.info('Adding NFT to collection', {
                collectionId,
                nftContract,
                tokenId
            });

            const tx = await this.contractWithSigner.addNFTToCollection(
                collectionId,
                nftContract,
                tokenId
            );

            const receipt = await tx.wait();

            logger.info('NFT added to collection', {
                collectionId,
                transactionHash: tx.hash
            });

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to add NFT to collection', { error: error.message });
            throw error;
        }
    }

    /**
     * Remove NFT from collection
     */
    async removeNFTFromCollection(collectionId, nftContract, tokenId) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Service not initialized with signer');
            }

            logger.info('Removing NFT from collection', {
                collectionId,
                nftContract,
                tokenId
            });

            const tx = await this.contractWithSigner.removeNFTFromCollection(
                collectionId,
                nftContract,
                tokenId
            );

            const receipt = await tx.wait();

            logger.info('NFT removed from collection', {
                collectionId,
                transactionHash: tx.hash
            });

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to remove NFT from collection', { error: error.message });
            throw error;
        }
    }

    /**
     * Update collection metadata
     */
    async updateCollectionMetadata(collectionId, name, description, imageURI, externalLink) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Service not initialized with signer');
            }

            logger.info('Updating collection metadata', { collectionId, name });

            const tx = await this.contractWithSigner.updateCollectionMetadata(
                collectionId,
                name,
                description,
                imageURI,
                externalLink
            );

            const receipt = await tx.wait();

            logger.info('Collection metadata updated', {
                collectionId,
                transactionHash: tx.hash
            });

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to update collection metadata', { error: error.message });
            throw error;
        }
    }

    /**
     * Delete collection
     */
    async deleteCollection(collectionId) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Service not initialized with signer');
            }

            logger.info('Deleting collection', { collectionId });

            const tx = await this.contractWithSigner.deleteCollection(collectionId);
            const receipt = await tx.wait();

            logger.info('Collection deleted', {
                collectionId,
                transactionHash: tx.hash
            });

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            logger.error('Failed to delete collection', { error: error.message });
            throw error;
        }
    }

    /**
     * Get collection details
     */
    async getCollectionDetails(collectionId) {
        try {
            const collection = await this.contract.getCollection(collectionId);
            const nftCount = await this.contract.getNFTCount(collectionId);

            return {
                id: collectionId,
                name: collection.name,
                description: collection.description,
                imageURI: collection.imageURI,
                externalLink: collection.externalLink,
                creator: collection.creator,
                createdAt: new Date(collection.createdAt.toNumber() * 1000),
                updatedAt: new Date(collection.updatedAt.toNumber() * 1000),
                isVerified: collection.isVerified,
                isActive: collection.isActive,
                nftCount: nftCount.toNumber()
            };
        } catch (error) {
            logger.error('Failed to get collection details', { error: error.message });
            throw error;
        }
    }

    /**
     * Get collection NFTs
     */
    async getCollectionNFTs(collectionId) {
        try {
            const nfts = await this.contract.getCollectionNFTs(collectionId);

            return nfts.map(nft => ({
                nftContract: nft.nftContract,
                tokenId: nft.tokenId.toString(),
                addedAt: new Date(nft.addedAt.toNumber() * 1000)
            }));
        } catch (error) {
            logger.error('Failed to get collection NFTs', { error: error.message });
            throw error;
        }
    }

    /**
     * Get user collections
     */
    async getUserCollections(userAddress) {
        try {
            const collectionIds = await this.contract.getUserCollections(userAddress);

            const collections = await Promise.all(
                collectionIds.map(id => this.getCollectionDetails(id.toString()))
            );

            return collections;
        } catch (error) {
            logger.error('Failed to get user collections', { error: error.message });
            throw error;
        }
    }

    /**
     * Get total collections count
     */
    async getTotalCollections() {
        try {
            const count = await this.contract.getTotalCollections();
            return count.toNumber();
        } catch (error) {
            logger.error('Failed to get total collections', { error: error.message });
            throw error;
        }
    }

    /**
     * Check if NFT is in collection
     */
    async isNFTInCollection(collectionId, nftContract, tokenId) {
        try {
            return await this.contract.isNFTInCollection(collectionId, nftContract, tokenId);
        } catch (error) {
            logger.error('Failed to check if NFT is in collection', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate collection creation
     */
    validateCollectionCreation(name, description) {
        if (!name || name.trim().length === 0) {
            throw new Error('Collection name is required');
        }

        if (name.length > 100) {
            throw new Error('Collection name is too long');
        }

        if (description && description.length > 1000) {
            throw new Error('Collection description is too long');
        }

        return true;
    }

    /**
     * Get collection statistics
     */
    async getCollectionStats(collectionId) {
        try {
            const collection = await this.getCollectionDetails(collectionId);
            const nftCount = await this.contract.getNFTCount(collectionId);

            return {
                collectionId,
                nftCount: nftCount.toNumber(),
                creator: collection.creator,
                isVerified: collection.isVerified,
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt
            };
        } catch (error) {
            logger.error('Failed to get collection statistics', { error: error.message });
            throw error;
        }
    }

    /**
     * Batch add NFTs to collection
     */
    async batchAddNFTs(collectionId, nfts) {
        try {
            if (!this.contractWithSigner) {
                throw new Error('Service not initialized with signer');
            }

            logger.info('Batch adding NFTs to collection', {
                collectionId,
                count: nfts.length
            });

            const results = [];
            for (const nft of nfts) {
                try {
                    const result = await this.addNFTToCollection(
                        collectionId,
                        nft.nftContract,
                        nft.tokenId
                    );
                    results.push({ success: true, ...result });
                } catch (error) {
                    results.push({
                        success: false,
                        error: error.message,
                        nft: nft
                    });
                }
            }

            logger.info('Batch add completed', {
                collectionId,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            });

            return results;
        } catch (error) {
            logger.error('Failed to batch add NFTs', { error: error.message });
            throw error;
        }
    }
}

module.exports = CollectionService;
