import express from 'express';
import {
  getUserMintableNFTs,
  getUserMintedNFTs,
  mintNFT,
  batchMintNFTs,
  getMintingStatus
} from '../controllers/mintingController.js';

const router = express.Router();

/**
 * Get user's unminted (mintable) NFTs
 * GET /api/minting/mintable?walletAddress=0x...&page=1&limit=20
 */
router.get('/mintable', getUserMintableNFTs);

/**
 * Get user's minted NFTs
 * GET /api/minting/minted?walletAddress=0x...&page=1&limit=20
 */
router.get('/minted', getUserMintedNFTs);

/**
 * Get minting status for a single NFT
 * GET /api/minting/:nftId/status
 */
router.get('/:nftId/status', getMintingStatus);

/**
 * Mint a single NFT
 * POST /api/minting/mint
 * Body: { nftId, collectionId, network, walletAddress }
 */
router.post('/mint', mintNFT);

/**
 * Batch mint multiple NFTs
 * POST /api/minting/batch-mint
 * Body: { nftIds[], collectionId, network, walletAddress }
 */
router.post('/batch-mint', batchMintNFTs);

export default router;
