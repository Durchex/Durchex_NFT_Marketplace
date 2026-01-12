import express from "express";
import {
  createOffer,
  getOfferById,
  getNFTOffers,
  getUserOffers,
  getReceivedOffers,
  acceptOffer,
  rejectOffer,
  cancelOffer,
  updateOfferPrice
} from "../controllers/offerController.js";

const router = express.Router();

// Create new offer
router.post("/", createOffer);

// Get offer by ID
router.get("/:offerId", getOfferById);

// Get all offers for a specific NFT
router.get("/nft/:contractAddress/:nftId", getNFTOffers);

// Get user's offers (made by user)
router.get("/user/:walletAddress", getUserOffers);

// Get offers received by user (offers on NFTs they own)
router.get("/received/:walletAddress", getReceivedOffers);

// Accept an offer
router.post("/:offerId/accept", acceptOffer);

// Reject an offer
router.post("/:offerId/reject", rejectOffer);

// Cancel an offer (by maker)
router.post("/:offerId/cancel", cancelOffer);

// Update offer price
router.patch("/:offerId/update-price", updateOfferPrice);

export default router;
