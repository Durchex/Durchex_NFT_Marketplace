import OfferModel from "../models/offerModel.js";
import { v4 as uuidv4 } from "uuid";

// Create a new offer
export const createOffer = async (req, res) => {
  try {
    const {
      maker,
      nftId,
      contractAddress,
      nftOwner,
      offerPrice,
      offerAmount,
      currency,
      network,
      nftName,
      nftImage,
      collectionName,
      message
    } = req.body;

    // Validate required fields
    if (!maker || !nftId || !contractAddress || !offerPrice || !offerAmount || !currency || !network) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // Create offer ID
    const offerId = `OFF-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Set expiration to 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const offer = new OfferModel({
      offerId,
      maker: maker.toLowerCase(),
      nftId,
      contractAddress: contractAddress.toLowerCase(),
      nftOwner: nftOwner?.toLowerCase(),
      offerPrice,
      offerAmount,
      currency,
      network,
      nftName,
      nftImage,
      collectionName,
      message,
      status: 'active',
      expiresAt
    });

    await offer.save();

    res.status(201).json({
      success: true,
      offer,
      message: "Offer created successfully"
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get offer by ID
export const getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await OfferModel.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all offers for a specific NFT
export const getNFTOffers = async (req, res) => {
  try {
    const { contractAddress, nftId } = req.params;

    const offers = await OfferModel.find({
      contractAddress: contractAddress.toLowerCase(),
      nftId: Number(nftId),
      status: 'active'
    }).sort({ offerAmount: -1 });

    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's offers (made by user)
export const getUserOffers = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const offers = await OfferModel.find({
      maker: walletAddress.toLowerCase()
    }).sort({ createdAt: -1 });

    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get offers received by user (offers on NFTs they own)
export const getReceivedOffers = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const offers = await OfferModel.find({
      nftOwner: walletAddress.toLowerCase(),
      status: 'active'
    }).sort({ offerAmount: -1 });

    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept an offer
export const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await OfferModel.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (offer.status !== 'active') {
      return res.status(400).json({
        error: `Cannot accept a ${offer.status} offer`
      });
    }

    offer.status = 'accepted';
    offer.acceptedAt = new Date();

    await offer.save();

    res.status(200).json({
      success: true,
      offer,
      message: "Offer accepted successfully"
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({ error: error.message });
  }
};

// Reject an offer
export const rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { reason } = req.body;

    const offer = await OfferModel.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (offer.status !== 'active') {
      return res.status(400).json({
        error: `Cannot reject a ${offer.status} offer`
      });
    }

    offer.status = 'rejected';
    offer.rejectedAt = new Date();
    offer.rejectionReason = reason || 'Offer rejected';

    await offer.save();

    res.status(200).json({
      success: true,
      offer,
      message: "Offer rejected successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel an offer (by maker)
export const cancelOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await OfferModel.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (offer.status !== 'active') {
      return res.status(400).json({
        error: `Cannot cancel a ${offer.status} offer`
      });
    }

    offer.status = 'cancelled';

    await offer.save();

    res.status(200).json({
      success: true,
      offer,
      message: "Offer cancelled successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update offer price
export const updateOfferPrice = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { newPrice, newAmount } = req.body;

    if (!newPrice || !newAmount) {
      return res.status(400).json({
        error: "newPrice and newAmount are required"
      });
    }

    const offer = await OfferModel.findOne({ offerId });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (offer.status !== 'active') {
      return res.status(400).json({
        error: "Can only update active offers"
      });
    }

    offer.offerPrice = newPrice;
    offer.offerAmount = newAmount;
    offer.updatedAt = new Date();

    await offer.save();

    res.status(200).json({
      success: true,
      offer,
      message: "Offer updated successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
