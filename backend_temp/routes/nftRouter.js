import express from "express";
import {
  fetchCollectionsGroupedByNetwork,
  getNftByAnyId,
  fetchAllNftsByNetwork,
  fetchAllNftsByNetworkForExplore,
  fetchAllNftsAllNetworks,
  fetchAllNftsAllNetworksForExplore,
  fetchCollectionNfts,
  fetchSingleNft,
  fetchSingleNfts,
  editSingleNft,
  editNftInCollection,
  deleteSingleNft,
  deleteNftInCollection,
  checkNftExists,
  createNft,
  createCollection,
  getCollection,
  getUserCollections,
  getAllCollections,
  getCollectionNFTs,
  updateCollection,
  deleteCollection,
  fetchUserNFTs,
  fetchUserNFTsByNetwork,
  fetchUserMintedNFTs,
  updateNftOwner,
  createPendingTransfer,
  getPendingTransfer,
  deletePendingTransfer,
  createPieceSellOrder,
  getPieceSellOrdersByNft,
  getPieceHoldingsByWallet,
  fillPieceSellOrder,
  getNftTrades,
  getNftAnalytics,
  getNftRarityRank,
  attachLiquidityPool,
  quoteSellToLiquidity,
  pieceSellBackToLiquidity,
  recordPoolPurchase,
} from "../controllers/nftController.js"; // Adjust path & file accordingly
// import { createNft } from "../models/nftModel.js";

const router = express.Router();

router.post("/nfts/check", checkNftExists);
router.post("/nfts/update-owner", updateNftOwner);
router.post("/nfts", createNft);

// Piece sell orders (collectors sell pieces back into liquidity — no relist/approval)
router.post("/nfts/piece-sell-orders", createPieceSellOrder);
router.get("/nfts/piece-sell-orders/:network/:itemId", getPieceSellOrdersByNft);
router.get("/nfts/piece-holdings/:wallet", getPieceHoldingsByWallet);
router.post("/nfts/piece-sell-orders/:orderId/fill", fillPieceSellOrder);

// Direct liquidity sell-back (quote + post-chain sync)
router.get("/liquidity/quote-sell", quoteSellToLiquidity);
router.post("/nfts/piece-sell-back", pieceSellBackToLiquidity);
router.post("/nfts/piece-buy-from-pool", recordPoolPurchase);
// Attach on-chain liquidity pool (CreatorLiquidity / NftLiquidity) to an NFT
router.post("/nfts/:network/:itemId/liquidity", attachLiquidityPool);

// Pending transfers (post-buy sync)
router.post("/pending-transfers", createPendingTransfer);
router.get("/pending-transfers/:network/:itemId", getPendingTransfer);
router.delete("/pending-transfers/:network/:itemId", deletePendingTransfer);

// ✅ ISSUE #4: Fetch user's NFTs by wallet address
router.get("/user-nfts/:walletAddress", fetchUserNFTs);
router.get("/user-nfts/:walletAddress/:network", fetchUserNFTsByNetwork);
router.get("/user-minted-nfts/:walletAddress", fetchUserMintedNFTs);

// ============ COLLECTION ROUTES ============
// Create a new collection
router.post("/collections", createCollection);

// Get all collections
router.get("/collections", getAllCollections);

// Get all collections by user - MUST come before :collectionId
router.get("/collections/user/:walletAddress", getUserCollections);

// Get NFTs in a collection - MUST come BEFORE the generic :collectionId route
router.get("/collections/:collectionId/nfts", getCollectionNFTs);

// Get a single collection by ID - MUST come after more specific routes
router.get("/collections/:collectionId", getCollection);

// Update collection
router.patch("/collections/:collectionId", updateCollection);

// Delete collection
router.delete("/collections/:collectionId", deleteCollection);

// NFT trades & analytics (transaction history, price movement, market cap) — MUST be before /nfts/:network
router.get("/nfts/:network/:itemId/trades", getNftTrades);
router.get("/nfts/:network/:itemId/analytics", getNftAnalytics);
router.get("/nfts/:network/:itemId/rarity", getNftRarityRank);

// Get single NFT by id (lazy-mint _id or regular itemId); sold-out lazy mints still findable — MUST be before /nfts/:network
router.get("/nfts/by-id/:id", getNftByAnyId);

// Get all NFTs on a network (for marketplace - only listed)
router.get("/nfts/:network", fetchAllNftsByNetwork);

// Get ALL NFTs across all networks (for marketplace - only listed)
router.get("/nfts", fetchAllNftsAllNetworks);

// Get all NFTs for Explore page (regardless of listing status - admin moderates)
router.get("/nfts-explore/:network", fetchAllNftsByNetworkForExplore);

// Get ALL NFTs for Explore page across all networks
router.get("/nfts-explore", fetchAllNftsAllNetworksForExplore);

// Get all NFTs in a specific collection on a network
router.get("/nfts/:network/collection/:collection", fetchCollectionNfts);

// Get a single NFT by network, collection, itemId, and tokenId (collection optional)
router.get("/nft/:network/:itemId/:tokenId", fetchSingleNft);
router.get("/nft/:network/:itemId/:tokenId/:collection", fetchSingleNft);


// Get all single NFTs (no collection) on a network
router.get("/single-nfts/:network", fetchSingleNfts);

// Edit single NFT (no collection)
router.patch("/nft/:network/:itemId", editSingleNft);

// Edit NFT inside a collection
router.patch("/nft/:network/:collection/:itemId", editNftInCollection);

// Delete single NFT (no collection)
router.delete("/nft/:network/:itemId", deleteSingleNft);

// Delete NFT in a collection
router.delete("/nft/:network/:collection/:itemId", deleteNftInCollection);

export default router;
