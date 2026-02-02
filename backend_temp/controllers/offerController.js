import OfferModel from "../models/offerModel.js";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import MultiChainService from "../services/MultiChainService.js";

// Optional on-chain Offer.sol integration
const OFFER_CONTRACT_ADDRESS = process.env.OFFER_CONTRACT_ADDRESS;
const OFFER_VIEW_ABI = [
  "function isOfferActive(uint256 _offerId) view returns (bool)",
];
const multiChainService = new MultiChainService();

const hasOnChainOffers =
  !!OFFER_CONTRACT_ADDRESS &&
  typeof process !== "undefined" &&
  !!process.env.ETHEREUM_RPC_URL;

// Helper: filter a list of DB offers against on-chain status (if configured)
async function filterActiveOnChainOffers(dbOffers) {
  if (!hasOnChainOffers) return dbOffers;
  if (!Array.isArray(dbOffers) || dbOffers.length === 0) return dbOffers;

  const byNetwork = dbOffers.reduce((acc, offer) => {
    const net = (offer.network || "polygon").toLowerCase();
    if (!acc[net]) acc[net] = [];
    acc[net].push(offer);
    return acc;
  }, {});

  const result = [];

  for (const [network, offers] of Object.entries(byNetwork)) {
    let provider;
    try {
      provider = multiChainService.getProvider(network);
    } catch {
      // If we don't have a provider for this network, fall back to DB state
      result.push(...offers);
      continue;
    }

    const contract = new ethers.Contract(
      OFFER_CONTRACT_ADDRESS,
      OFFER_VIEW_ABI,
      provider
    );

    for (const offer of offers) {
      const onChainId = offer.contractOfferId || offer.onChainOfferId;
      if (!onChainId && offer.status === "active") {
        // Pure DB offer (no on-chain id) – keep as-is
        result.push(offer);
        continue;
      }

      if (!onChainId) {
        // Historical / non-active offer – keep for completeness
        result.push(offer);
        continue;
      }

      try {
        const isActive = await contract.isOfferActive(BigInt(onChainId));
        if (isActive) {
          result.push(offer);
        } else if (offer.status === "active") {
          // Best-effort: mark as expired in DB so we don't keep serving stale active offers
          offer.status = "expired";
          await OfferModel.updateOne(
            { _id: offer._id },
            { status: offer.status }
          );
        }
      } catch {
        // On-chain lookup failed – fall back to DB state
        result.push(offer);
      }
    }
  }

  return result;
}

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
      message,
      contractOfferId,
      onChainOfferId
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
      contractOfferId: contractOfferId ?? onChainOfferId,
      onChainOfferId: onChainOfferId ?? contractOfferId,
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

    let offers = await OfferModel.find({
      contractAddress: contractAddress.toLowerCase(),
      nftId: Number(nftId),
      status: 'active'
    }).sort({ offerAmount: -1 });

    // When Offer.sol is configured, ensure only on-chain-active offers are returned
    offers = await filterActiveOnChainOffers(offers);

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
    let offers = await OfferModel.find({
      nftOwner: walletAddress.toLowerCase(),
      status: 'active'
    }).sort({ offerAmount: -1 });

    // When Offer.sol is configured, ensure only on-chain-active offers are returned
    offers = await filterActiveOnChainOffers(offers);

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
