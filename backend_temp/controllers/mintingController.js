import { nftModel } from '../models/nftModel.js';
import nftContractService from '../services/nftContractService.js';
import Collection from '../models/collectionModel.js';
import ipfsService from '../services/ipfsService.js';
import logger from '../utils/logger.js';

/**
 * Get user's mintable NFTs (unminted NFTs owned by user)
 */
export const getUserMintableNFTs = async (req, res) => {
  try {
    const { walletAddress, page = 1, limit = 20 } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const skip = (page - 1) * limit;

    // Find unminted NFTs where owner is the user
    const nfts = await nftModel.find({
      owner: walletAddress.toLowerCase(),
      isMinted: false,
      currentlyListed: false
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await nftModel.countDocuments({
      owner: walletAddress.toLowerCase(),
      isMinted: false,
      currentlyListed: false
    });

    res.json({
      success: true,
      nfts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching mintable NFTs', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user's minted NFTs
 */
export const getUserMintedNFTs = async (req, res) => {
  try {
    const { walletAddress, page = 1, limit = 20 } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const skip = (page - 1) * limit;

    // Find minted NFTs owned by the user
    const nfts = await nftModel.find({
      owner: walletAddress.toLowerCase(),
      isMinted: true
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ mintedAt: -1 });

    const total = await nftModel.countDocuments({
      owner: walletAddress.toLowerCase(),
      isMinted: true
    });

    res.json({
      success: true,
      nfts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching minted NFTs', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mint an NFT
 */
export const mintNFT = async (req, res) => {
  try {
    const { nftId, collectionId, network = 'sepolia', walletAddress } = req.body;

    if (!nftId || !collectionId) {
      return res.status(400).json({ error: 'NFT ID and collection ID required' });
    }

    // Find the NFT
    const nft = await nftModel.findById(nftId);
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check if already minted
    if (nft.isMinted) {
      return res.status(400).json({ error: 'NFT already minted' });
    }

    // Verify ownership
    if (nft.owner.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Not NFT owner' });
    }

    // Find the collection
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if collection has contract deployed
    if (!collection.contractAddress) {
      return res.status(400).json({ error: 'Collection contract not deployed' });
    }

    // Create/prepare metadata URI if not already set
    let metadataURI = nft.metadataURI;
    if (!metadataURI) {
      try {
        // Upload metadata to IPFS
        const metadata = {
          name: nft.name,
          description: nft.description,
          image: nft.image,
          attributes: nft.properties || [],
          royalties: nft.royalty || 0
        };

        metadataURI = await ipfsService.createNFTMetadata(
          metadata,
          nft.image,
          `${nft.name}-metadata`
        );

        // Update NFT with metadataURI
        nft.metadataURI = metadataURI;
        await nft.save();
      } catch (metadataError) {
        logger.error('Failed to create metadata', { error: metadataError.message });
        return res.status(500).json({ error: 'Failed to create NFT metadata' });
      }
    }

    try {
      // Mint NFT on blockchain
      const mintResult = await nftContractService.mintNFT({
        network,
        collectionAddress: collection.contractAddress,
        toAddress: walletAddress,
        metadataURI
      });

      if (!mintResult.success) {
        return res.status(500).json({
          error: 'Minting failed',
          details: mintResult.error
        });
      }

      // Update NFT with minting information
      nft.isMinted = true;
      nft.tokenId = mintResult.tokenId;
      nft.network = network;
      nft.mintedAt = new Date();
      nft.mintTxHash = mintResult.mintTx;
      nft.deploymentStatus = 'deployed';
      nft.contractAddress = collection.contractAddress;

      // Update chain-specific data
      if (!nft.chainSpecificData) {
        nft.chainSpecificData = new Map();
      }
      nft.chainSpecificData.set(network, {
        contractAddress: collection.contractAddress,
        tokenId: mintResult.tokenId,
        deploymentTx: mintResult.mintTx,
        deploymentBlock: mintResult.mintBlock,
        status: 'deployed',
        deployedAt: new Date()
      });

      await nft.save();

      logger.info('NFT minted successfully', {
        nftId: nft._id,
        tokenId: mintResult.tokenId,
        txHash: mintResult.mintTx
      });

      res.json({
        success: true,
        message: 'NFT minted successfully',
        nft: {
          _id: nft._id,
          tokenId: nft.tokenId,
          transactionHash: nft.mintTxHash,
          network: nft.network,
          contractAddress: nft.contractAddress,
          mintedAt: nft.mintedAt
        }
      });
    } catch (mintError) {
      logger.error('Minting error', { error: mintError.message });
      return res.status(500).json({
        error: 'Minting failed',
        details: mintError.message
      });
    }
  } catch (error) {
    logger.error('Error in mint NFT endpoint', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Batch mint NFTs
 */
export const batchMintNFTs = async (req, res) => {
  try {
    const { nftIds, collectionId, network = 'sepolia', walletAddress } = req.body;

    if (!Array.isArray(nftIds) || nftIds.length === 0) {
      return res.status(400).json({ error: 'NFT IDs array required' });
    }

    if (!collectionId) {
      return res.status(400).json({ error: 'Collection ID required' });
    }

    // Find the collection
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!collection.contractAddress) {
      return res.status(400).json({ error: 'Collection contract not deployed' });
    }

    // Find all NFTs
    const nfts = await nftModel.find({ _id: { $in: nftIds } });

    if (nfts.length !== nftIds.length) {
      return res.status(404).json({ error: 'Some NFTs not found' });
    }

    // Check ownership and mint status
    const unmintedNFTs = nfts.filter(nft => {
      if (nft.isMinted) return false;
      if (nft.owner.toLowerCase() !== walletAddress.toLowerCase()) return false;
      return true;
    });

    if (unmintedNFTs.length === 0) {
      return res.status(400).json({ error: 'No valid unminted NFTs to mint' });
    }

    // Prepare metadata URIs
    const metadataURIs = [];
    for (const nft of unmintedNFTs) {
      let metadataURI = nft.metadataURI;
      if (!metadataURI) {
        try {
          const metadata = {
            name: nft.name,
            description: nft.description,
            image: nft.image,
            attributes: nft.properties || [],
            royalties: nft.royalty || 0
          };

          metadataURI = await ipfsService.createNFTMetadata(
            metadata,
            nft.image,
            `${nft.name}-metadata`
          );

          nft.metadataURI = metadataURI;
        } catch (error) {
          logger.error('Failed to create metadata', { error: error.message });
          return res.status(500).json({ error: `Failed to create metadata for ${nft.name}` });
        }
      }
      metadataURIs.push(metadataURI);
    }

    try {
      // Batch mint on blockchain
      const batchResult = await nftContractService.batchMintNFT({
        network,
        collectionAddress: collection.contractAddress,
        toAddress: walletAddress,
        metadataURIs
      });

      if (!batchResult.success) {
        return res.status(500).json({
          error: 'Batch minting failed',
          details: batchResult.error
        });
      }

      // Update all NFTs with minting information
      const results = [];
      for (let i = 0; i < unmintedNFTs.length; i++) {
        const nft = unmintedNFTs[i];
        nft.isMinted = true;
        nft.tokenId = batchResult.tokenIds[i];
        nft.network = network;
        nft.mintedAt = new Date();
        nft.mintTxHash = batchResult.mintTx;
        nft.deploymentStatus = 'deployed';
        nft.contractAddress = collection.contractAddress;

        if (!nft.chainSpecificData) {
          nft.chainSpecificData = new Map();
        }
        nft.chainSpecificData.set(network, {
          contractAddress: collection.contractAddress,
          tokenId: batchResult.tokenIds[i],
          deploymentTx: batchResult.mintTx,
          deploymentBlock: batchResult.mintBlock,
          status: 'deployed',
          deployedAt: new Date()
        });

        await nft.save();

        results.push({
          _id: nft._id,
          name: nft.name,
          tokenId: nft.tokenId,
          status: 'minted'
        });
      }

      logger.info('Batch mint successful', { count: results.length });

      res.json({
        success: true,
        message: `${results.length} NFTs minted successfully`,
        transactionHash: batchResult.mintTx,
        network,
        mintedNFTs: results
      });
    } catch (mintError) {
      logger.error('Batch minting error', { error: mintError.message });
      return res.status(500).json({
        error: 'Batch minting failed',
        details: mintError.message
      });
    }
  } catch (error) {
    logger.error('Error in batch mint endpoint', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get minting status
 */
export const getMintingStatus = async (req, res) => {
  try {
    const { nftId } = req.params;

    const nft = await nftModel.findById(nftId);
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    res.json({
      success: true,
      nft: {
        _id: nft._id,
        name: nft.name,
        isMinted: nft.isMinted,
        tokenId: nft.tokenId,
        contractAddress: nft.contractAddress,
        network: nft.network,
        mintedAt: nft.mintedAt,
        mintTxHash: nft.mintTxHash
      }
    });
  } catch (error) {
    logger.error('Error fetching minting status', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};
