/**
 * Auction API Routes (ESM)
 * Endpoints for listing and creating auctions.
 * On-chain state (Auction.sol) is the source of truth when configured; otherwise falls back to in-memory list.
 */
import express from 'express';
import { ethers } from 'ethers';
import auth from '../middleware/auth.js';
import MultiChainService from '../services/MultiChainService.js';

const router = express.Router();

// In-memory list used only as a fallback when the on-chain auction contract is not configured
const auctionList = [];

// Optional on-chain Auction.sol integration
const AUCTION_CONTRACT_ADDRESS = process.env.AUCTION_CONTRACT_ADDRESS;
const AUCTION_NETWORK = (process.env.AUCTION_NETWORK || 'polygon').toLowerCase();
const AUCTION_VIEW_ABI = [
  'function auctionCounter() view returns (uint256)',
  'function auctions(uint256) view returns (address nftContract,uint256 tokenId,address seller,address currentBidder,uint256 currentBid,uint256 reservePrice,uint256 minBidIncrement,uint256 startTime,uint256 endTime,uint256 extensionTime,uint256 minTimeBeforeEnd,address paymentToken,uint256 fee,uint8 status,bool settled)',
];
const multiChainService = new MultiChainService();

const hasOnChainAuctions =
  !!AUCTION_CONTRACT_ADDRESS &&
  typeof process !== 'undefined' &&
  (!!process.env.ETHEREUM_RPC_URL ||
    !!process.env.POLYGON_RPC_URL ||
    !!process.env.ARBITRUM_RPC_URL ||
    !!process.env.OPTIMISM_RPC_URL ||
    !!process.env.AVALANCHE_RPC_URL);

async function getOnChainAuctions() {
  if (!hasOnChainAuctions) return null;

  let provider;
  try {
    provider = multiChainService.getProvider(AUCTION_NETWORK);
  } catch {
    return null;
  }

  const contract = new ethers.Contract(
    AUCTION_CONTRACT_ADDRESS,
    AUCTION_VIEW_ABI,
    provider
  );

  let counter;
  try {
    counter = await contract.auctionCounter();
  } catch {
    return null;
  }

  const toNumber = (value) => {
    if (typeof value === 'bigint') return Number(value);
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return Number(value);
  };

  const formatEther =
    (ethers.utils && ethers.utils.formatEther) || ethers.formatEther;

  const now = Math.floor(Date.now() / 1000);
  const auctions = [];

  const total = toNumber(counter);
  for (let i = 0; i < total; i++) {
    try {
      const listing = await contract.auctions(i);
      // status: 0 = ACTIVE, 1 = SETTLED, 2 = CANCELLED
      const statusNum = listing.status ?? listing[13];
      const endTime = toNumber(listing.endTime ?? listing[8]);
      const isActive =
        statusNum === 0 && !listing.settled && now < endTime;

      if (!isActive) continue;

      const currentBidWei = listing.currentBid ?? listing[4];
      const reserveWei = listing.reservePrice ?? listing[5];

      auctions.push({
        id: String(i),
        nftContract: listing.nftContract ?? listing[0],
        tokenId: String(toNumber(listing.tokenId ?? listing[1])),
        seller: listing.seller ?? listing[2],
        currentBidder: listing.currentBidder ?? listing[3],
        currentBid: parseFloat(formatEther(currentBidWei || 0)),
        reservePrice: parseFloat(formatEther(reserveWei || 0)),
        minBidIncrement: toNumber(listing.minBidIncrement ?? listing[6]),
        startTime: new Date(
          (listing.startTime ?? listing[7]) * 1000
        ).toISOString(),
        endTime: new Date(endTime * 1000).toISOString(),
        status: 'active',
        createdAt: new Date(
          (listing.startTime ?? listing[7]) * 1000
        ).toISOString(),
        paymentToken: listing.paymentToken ?? listing[11],
      });
    } catch {
      // Skip invalid or missing auctions
    }
  }

  return auctions;
}

/**
 * GET /api/v1/auctions
 * List active auctions
 */
router.get('/', async (req, res) => {
  try {
    const onChainAuctions = await getOnChainAuctions();

    if (onChainAuctions) {
      return res.json({
        success: true,
        data: onChainAuctions,
        count: onChainAuctions.length,
        source: 'on-chain',
      });
    }

    // Fallback: in-memory list (dev/demo)
    const active = auctionList.filter((a) => a.status === 'active');
    res.json({
      success: true,
      data: active,
      count: active.length,
      source: 'memory',
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list auctions' });
  }
});

/**
 * POST /api/v1/auctions/create
 * Create auction (metadata). Frontend does blockchain tx and can call confirm-creation.
 */
router.post('/create', auth, async (req, res) => {
  try {
    const { nftContract, tokenId, reservePrice, durationInSeconds, minBidIncrement = 500 } = req.body || {};
    const userAddress = req.user?.address;
    if (!userAddress) return res.status(401).json({ error: 'Unauthorized' });
    if (!nftContract || !tokenId || reservePrice == null || !durationInSeconds) {
      return res.status(400).json({
        error: 'Missing required fields: nftContract, tokenId, reservePrice, durationInSeconds',
      });
    }
    const duration = Number(durationInSeconds);
    if (duration < 3600 || duration > 2592000) {
      return res.status(400).json({ error: 'Duration must be between 1 hour and 30 days (in seconds)' });
    }
    const reserve = Number(reservePrice);
    if (reserve <= 0) return res.status(400).json({ error: 'Reserve price must be > 0' });

    const id = String(auctionList.length + 1);
    const now = new Date();
    const endAt = new Date(now.getTime() + duration * 1000);
    const auction = {
      id: id,
      nftContract,
      tokenId: String(tokenId),
      seller: userAddress,
      reservePrice: reserve,
      currentBid: 0,
      currentBidder: null,
      minBidIncrement: Number(minBidIncrement) || 500,
      startTime: now.toISOString(),
      endTime: endAt.toISOString(),
      status: 'active',
      createdAt: now.toISOString(),
    };
    auctionList.push(auction);

    res.status(201).json({
      success: true,
      status: 'pending',
      message: 'Auction created. Complete the transaction in your wallet to go live.',
      data: {
        auctionId: id,
        nftContract,
        tokenId: String(tokenId),
        reservePrice: reserve,
        durationInSeconds: duration,
        estimatedEndTime: endAt.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create auction' });
  }
});

/**
 * GET /api/v1/auctions/:auctionId
 * Get one auction
 */
router.get('/:auctionId', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const onChainAuctions = await getOnChainAuctions();

    if (onChainAuctions) {
      const auction = onChainAuctions.find((a) => a.id === String(auctionId));
      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }
      return res.json({ success: true, data: auction, source: 'on-chain' });
    }

    const auction = auctionList.find((a) => a.id === auctionId);
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    res.json({ success: true, data: auction, source: 'memory' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get auction' });
  }
});

export default router;
