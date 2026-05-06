import express from "express";
import {
  createListing,
  getListings,
  getListing,
  cancelListing,
  executeSale,
  getMarketplaceStats
} from "../controllers/marketplaceController.js";

const router = express.Router();

// Create listing
router.post("/listings", createListing);

// Get listings with filters
router.get("/listings", getListings);

// Get single listing
router.get("/listings/:listingId", getListing);

// Cancel listing
router.post("/listings/:listingId/cancel", cancelListing);

// Execute sale (called after on-chain transaction)
router.post("/execute-sale", executeSale);

// Get marketplace stats
router.get("/stats", getMarketplaceStats);

export default router;</content>
<parameter name="filePath">c:\Users\Darker Elf\Documents\GitHub\Durchex_NFT_Marketplace\backend_temp\routes\marketplaceRouter.js