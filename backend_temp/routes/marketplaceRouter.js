import express from "express";
import {
  createListing,
  createBulkListings,
  getListings,
  getListing,
  cancelListing,
  executeSale,
  getMarketplaceStats
} from "../controllers/marketplaceController.js";

const router = express.Router();

// Create listing
router.post("/listings", createListing);

// Bulk create listings (one request, many signed listings)
router.post("/listings/bulk", createBulkListings);

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

export default router;
