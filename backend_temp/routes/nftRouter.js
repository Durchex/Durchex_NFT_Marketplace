import express from "express";
import {
  fetchCollectionsGroupedByNetwork,
  fetchAllNftsByNetwork,
  fetchAllNftsByNetworkForExplore,
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
} from "../controllers/nftController.js"; // Adjust path & file accordingly
// import { createNft } from "../models/nftModel.js";

const router = express.Router();

router.post("/nfts/check", checkNftExists);
router.post("/nfts", createNft);

// ✅ ISSUE #4: Fetch user's NFTs by wallet address
router.get("/user-nfts/:walletAddress", fetchUserNFTs);
router.get("/user-nfts/:walletAddress/:network", fetchUserNFTsByNetwork);
router.get("/user-minted-nfts/:walletAddress", fetchUserMintedNFTs);

// ============ COLLECTION ROUTES ============
// Create a new collection
router.post("/collections", createCollection);

// Get all collections
router.get("/collections", getAllCollections);

// Get a single collection by ID
router.get("/collections/single/:collectionId", getCollection);

// Get all collections by user
router.get("/collections/user/:walletAddress", getUserCollections);

// Get NFTs in a collection - MUST come BEFORE the generic :network route
router.get("/collections/:collectionId/nfts", getCollectionNFTs);

// Update collection
router.patch("/collections/:collectionId", updateCollection);

// Delete collection
router.delete("/collections/:collectionId", deleteCollection);

// Route to get collections grouped by network - MUST come AFTER more specific routes
router.get("/collections/:network", fetchCollectionsGroupedByNetwork);

// Other example routes (you can add all you want similarly)

// Get all NFTs on a network (for marketplace - only listed)
router.get("/nfts/:network", fetchAllNftsByNetwork);

// Get all NFTs for Explore page (regardless of listing status - admin moderates)
router.get("/nfts-explore/:network", fetchAllNftsByNetworkForExplore);

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
