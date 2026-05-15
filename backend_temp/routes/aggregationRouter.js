/**
 * Aggregation route. Returns external marketplace listings (OpenSea, Blur,
 * Magic Eden, …) for a single NFT or a whole collection, normalized to the
 * Durchex listing shape. Empty array if no external markets have data or all
 * adapters are unconfigured.
 */
import express from 'express';
import { getExternalListings } from '../services/aggregationService.js';

const router = express.Router();

// GET /api/v1/aggregation/listings?chain=base&contract=0x...&tokenId=42
router.get('/listings', async (req, res) => {
  try {
    const { chain, contract, tokenId } = req.query;
    if (!chain || !contract) {
      return res.status(400).json({ success: false, error: 'chain and contract required' });
    }
    const listings = await getExternalListings({
      chain: String(chain).toLowerCase(),
      contract: String(contract).toLowerCase(),
      tokenId: tokenId ? String(tokenId) : undefined,
    });
    res.json({ success: true, listings, count: listings.length });
  } catch (error) {
    console.error('Aggregation route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
