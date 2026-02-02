// EventIndexer - central on-chain indexer for marketplace contracts
// Uses MultiChainService + ethers to read on-chain state for:
// - Offer.sol (P2P offers)
// - Auction.sol (English auctions)
// - NftLiquidity (piece pools, Trade / LiquidityUpdated / PoolCreated events)
// - NFTStaking (staker info, stats, TokenStaked / TokenUnstaked / RewardsClaimed events)

import { ethers } from 'ethers';
import MultiChainService from './MultiChainService.js';

export default class EventIndexer {
  constructor() {
    this.multiChainService = new MultiChainService();

    this.offerAddress = process.env.OFFER_CONTRACT_ADDRESS || null;
    this.offerNetwork = (process.env.OFFER_NETWORK || 'polygon').toLowerCase();

    this.auctionAddress = process.env.AUCTION_CONTRACT_ADDRESS || null;
    this.auctionNetwork = (process.env.AUCTION_NETWORK || 'polygon').toLowerCase();

    this.nftLiquidityAddress = process.env.NFT_LIQUIDITY_CONTRACT_ADDRESS || null;
    this.nftLiquidityNetwork = (process.env.NFT_LIQUIDITY_NETWORK || process.env.OFFER_NETWORK || 'polygon').toLowerCase();

    this.stakingAddress = process.env.STAKING_CONTRACT_ADDRESS || null;
    this.stakingNetwork = (process.env.STAKING_NETWORK || process.env.OFFER_NETWORK || 'polygon').toLowerCase();
  }

  // ---------- Offers (Offer.sol) ----------

  _getOfferContract() {
    if (!this.offerAddress) return null;
    let provider;
    try {
      provider = this.multiChainService.getProvider(this.offerNetwork);
    } catch {
      return null;
    }
    const abi = ['function isOfferActive(uint256 _offerId) view returns (bool)'];
    return new ethers.Contract(this.offerAddress, abi, provider);
  }

  /**
   * Check if a given on-chain offer is still active.
   * Returns null if on-chain contract or provider is not configured.
   */
  async isOfferActive(offerId) {
    const contract = this._getOfferContract();
    if (!contract) return null;
    try {
      const id = typeof offerId === 'bigint' ? offerId : BigInt(String(offerId));
      return await contract.isOfferActive(id);
    } catch {
      return null;
    }
  }

  // ---------- Auctions (Auction.sol) ----------

  _getAuctionContract() {
    if (!this.auctionAddress) return null;
    let provider;
    try {
      provider = this.multiChainService.getProvider(this.auctionNetwork);
    } catch {
      return null;
    }
    const abi = [
      'function auctionCounter() view returns (uint256)',
      'function auctions(uint256) view returns (address nftContract,uint256 tokenId,address seller,address currentBidder,uint256 currentBid,uint256 reservePrice,uint256 minBidIncrement,uint256 startTime,uint256 endTime,uint256 extensionTime,uint256 minTimeBeforeEnd,address paymentToken,uint256 fee,uint8 status,bool settled)',
    ];
    return new ethers.Contract(this.auctionAddress, abi, provider);
  }

  _toNumber(value) {
    if (typeof value === 'bigint') return Number(value);
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return Number(value);
  }

  _formatEther(value) {
    if (!value) return 0;
    const fmt =
      (ethers.utils && ethers.utils.formatEther) || ethers.formatEther;
    return parseFloat(fmt(value));
  }

  /**
   * Get all currently-active auctions from Auction.sol
   */
  async getActiveAuctions() {
    const contract = this._getAuctionContract();
    if (!contract) return null;

    let counter;
    try {
      counter = await contract.auctionCounter();
    } catch {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const auctions = [];
    const total = this._toNumber(counter);

    for (let i = 0; i < total; i++) {
      try {
        const listing = await contract.auctions(i);
        const statusNum = listing.status ?? listing[13];
        const endTime = this._toNumber(listing.endTime ?? listing[8]);
        const isActive =
          statusNum === 0 && !listing.settled && now < endTime;

        if (!isActive) continue;

        const currentBidWei = listing.currentBid ?? listing[4];
        const reserveWei = listing.reservePrice ?? listing[5];

        auctions.push({
          id: String(i),
          nftContract: listing.nftContract ?? listing[0],
          tokenId: String(this._toNumber(listing.tokenId ?? listing[1])),
          seller: listing.seller ?? listing[2],
          currentBidder: listing.currentBidder ?? listing[3],
          currentBid: this._formatEther(currentBidWei || 0),
          reservePrice: this._formatEther(reserveWei || 0),
          minBidIncrement: this._toNumber(listing.minBidIncrement ?? listing[6]),
          startTime: new Date(
            this._toNumber(listing.startTime ?? listing[7]) * 1000
          ).toISOString(),
          endTime: new Date(endTime * 1000).toISOString(),
          status: 'active',
          createdAt: new Date(
            this._toNumber(listing.startTime ?? listing[7]) * 1000
          ).toISOString(),
          paymentToken: listing.paymentToken ?? listing[11],
        });
      } catch {
        // Skip invalid/missing auctions
      }
    }

    return auctions;
  }

  // ---------- NftLiquidity (piece pools, trades, liquidity) ----------

  _getNftLiquidityContract() {
    if (!this.nftLiquidityAddress) return null;
    let provider;
    try {
      provider = this.multiChainService.getProvider(this.nftLiquidityNetwork);
    } catch {
      return null;
    }
    const abi = [
      'function getPoolInfo(uint256 pieceId) view returns (address nftContract, uint256 nftTokenId, uint256 pieceId, address creator, uint256 totalPieces, uint256 piecesInPool, uint256 reserveBalance, uint256 buyPricePerPiece, uint256 sellPricePerPiece, bool active)',
      'event Trade(uint256 indexed pieceId, address indexed buyer, address indexed seller, uint256 quantity, uint256 pricePerPiece, uint256 totalAmount, uint256 platformFee, uint256 royaltyAmount, bytes32 tradeType, uint256 timestamp)',
      'event LiquidityUpdated(uint256 indexed pieceId, uint256 newReserveBalance, uint256 newPiecesInPool, uint256 newBuyPricePerPiece, uint256 newSellPricePerPiece, uint256 timestamp)',
      'event PoolCreated(uint256 indexed pieceId, address indexed nftContract, uint256 indexed nftTokenId, address creator, uint256 totalPieces, uint256 buyPricePerPiece, uint256 sellPricePerPiece)',
    ];
    return new ethers.Contract(this.nftLiquidityAddress, abi, provider);
  }

  /**
   * Get pool info for a piece (NftLiquidity.getPoolInfo).
   * Returns null if contract/network not configured or pool doesn't exist.
   */
  async getPoolInfo(pieceId) {
    const contract = this._getNftLiquidityContract();
    if (!contract) return null;
    try {
      const id = typeof pieceId === 'bigint' ? pieceId : BigInt(String(pieceId));
      const pool = await contract.getPoolInfo(id);
      if (!pool || !pool.active) return null;
      return {
        pieceId: String(this._toNumber(pool.pieceId ?? pool[2])),
        nftContract: pool.nftContract ?? pool[0],
        nftTokenId: String(this._toNumber(pool.nftTokenId ?? pool[1])),
        creator: pool.creator ?? pool[3],
        totalPieces: this._toNumber(pool.totalPieces ?? pool[4]),
        piecesInPool: this._toNumber(pool.piecesInPool ?? pool[5]),
        reserveBalance: this._formatEther(pool.reserveBalance ?? pool[6]),
        buyPricePerPiece: this._formatEther(pool.buyPricePerPiece ?? pool[7]),
        sellPricePerPiece: this._formatEther(pool.sellPricePerPiece ?? pool[8]),
        active: pool.active ?? pool[9],
      };
    } catch {
      return null;
    }
  }

  /**
   * Query Trade events (NftLiquidity). Optional pieceId filter.
   * @param {number|string} fromBlock - start block
   * @param {number|string} toBlock - end block ('latest' supported)
   * @param {number|string|null} pieceId - optional filter by pieceId
   */
  async getTradeEvents(fromBlock, toBlock, pieceId = null) {
    const contract = this._getNftLiquidityContract();
    if (!contract) return [];
    const filter = pieceId != null
      ? contract.filters.Trade(BigInt(String(pieceId)))
      : contract.filters.Trade();
    try {
      const events = await contract.queryFilter(filter, Number(fromBlock), toBlock === 'latest' ? 'latest' : Number(toBlock));
      return events.map((e) => ({
        pieceId: String(e.args.pieceId ?? e.args[0]),
        buyer: e.args.buyer ?? e.args[1],
        seller: e.args.seller ?? e.args[2],
        quantity: this._toNumber(e.args.quantity ?? e.args[3]),
        pricePerPiece: this._formatEther(e.args.pricePerPiece ?? e.args[4]),
        totalAmount: this._formatEther(e.args.totalAmount ?? e.args[5]),
        platformFee: this._formatEther(e.args.platformFee ?? e.args[6]),
        royaltyAmount: this._formatEther(e.args.royaltyAmount ?? e.args[7]),
        tradeType: e.args.tradeType ?? e.args[8],
        timestamp: this._toNumber(e.args.timestamp ?? e.args[9]),
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Query LiquidityUpdated events (NftLiquidity). Optional pieceId filter.
   */
  async getLiquidityUpdatedEvents(fromBlock, toBlock, pieceId = null) {
    const contract = this._getNftLiquidityContract();
    if (!contract) return [];
    const filter = pieceId != null
      ? contract.filters.LiquidityUpdated(BigInt(String(pieceId)))
      : contract.filters.LiquidityUpdated();
    try {
      const events = await contract.queryFilter(filter, Number(fromBlock), toBlock === 'latest' ? 'latest' : Number(toBlock));
      return events.map((e) => ({
        pieceId: String(e.args.pieceId ?? e.args[0]),
        newReserveBalance: this._formatEther(e.args.newReserveBalance ?? e.args[1]),
        newPiecesInPool: this._toNumber(e.args.newPiecesInPool ?? e.args[2]),
        newBuyPricePerPiece: this._formatEther(e.args.newBuyPricePerPiece ?? e.args[3]),
        newSellPricePerPiece: this._formatEther(e.args.newSellPricePerPiece ?? e.args[4]),
        timestamp: this._toNumber(e.args.timestamp ?? e.args[5]),
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Query PoolCreated events to discover pieceIds and pool metadata.
   */
  async getPoolCreatedEvents(fromBlock, toBlock) {
    const contract = this._getNftLiquidityContract();
    if (!contract) return [];
    try {
      const events = await contract.queryFilter(
        contract.filters.PoolCreated(),
        Number(fromBlock),
        toBlock === 'latest' ? 'latest' : Number(toBlock)
      );
      return events.map((e) => ({
        pieceId: String(e.args.pieceId ?? e.args[0]),
        nftContract: e.args.nftContract ?? e.args[1],
        nftTokenId: String(this._toNumber(e.args.nftTokenId ?? e.args[2])),
        creator: e.args.creator ?? e.args[3],
        totalPieces: this._toNumber(e.args.totalPieces ?? e.args[4]),
        buyPricePerPiece: this._formatEther(e.args.buyPricePerPiece ?? e.args[5]),
        sellPricePerPiece: this._formatEther(e.args.sellPricePerPiece ?? e.args[6]),
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
      }));
    } catch {
      return [];
    }
  }

  // ---------- NFTStaking (staker info, stats, events) ----------

  _getStakingContract() {
    if (!this.stakingAddress) return null;
    let provider;
    try {
      provider = this.multiChainService.getProvider(this.stakingNetwork);
    } catch {
      return null;
    }
    const abi = [
      'function getStakerInfo(address _staker) view returns (uint256[] stakedTokens, uint256 totalRewards, uint256 claimedRewards, uint256 pendingRewards)',
      'function getStats() view returns (uint256 totalStaked, uint256 activeStakers, uint256 distributed, uint256 poolBalance)',
      'function nftCollection() view returns (address)',
      'event TokenStaked(address indexed staker, uint256[] tokenIds, uint256 timestamp)',
      'event TokenUnstaked(address indexed staker, uint256[] tokenIds, uint256 penalty, uint256 timestamp)',
      'event RewardsClaimed(address indexed staker, uint256 rewards, uint256 timestamp)',
    ];
    return new ethers.Contract(this.stakingAddress, abi, provider);
  }

  /**
   * Get staker info from NFTStaking (staked token IDs, rewards).
   */
  async getStakerInfo(stakerAddress) {
    const contract = this._getStakingContract();
    if (!contract) return null;
    try {
      const [stakedTokens, totalRewards, claimedRewards, pendingRewards] = await contract.getStakerInfo(stakerAddress);
      return {
        stakedTokens: (stakedTokens || []).map((id) => String(this._toNumber(id))),
        totalRewards: this._formatEther(totalRewards ?? 0),
        claimedRewards: this._formatEther(claimedRewards ?? 0),
        pendingRewards: this._formatEther(pendingRewards ?? 0),
        stakedCount: (stakedTokens || []).length,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get global staking stats from NFTStaking.
   */
  async getStakingStats() {
    const contract = this._getStakingContract();
    if (!contract) return null;
    try {
      const [totalStaked, activeStakers, distributed, poolBalance] = await contract.getStats();
      return {
        totalStakedNFTs: String(this._toNumber(totalStaked)),
        activeStakers: String(this._toNumber(activeStakers)),
        totalDistributedRewards: this._formatEther(distributed ?? 0),
        rewardPoolBalance: this._formatEther(poolBalance ?? 0),
      };
    } catch {
      return null;
    }
  }

  /**
   * Query TokenStaked events (NFTStaking).
   */
  async getTokenStakedEvents(fromBlock, toBlock) {
    const contract = this._getStakingContract();
    if (!contract) return [];
    try {
      const events = await contract.queryFilter(
        contract.filters.TokenStaked(),
        Number(fromBlock),
        toBlock === 'latest' ? 'latest' : Number(toBlock)
      );
      return events.map((e) => ({
        staker: e.args.staker ?? e.args[0],
        tokenIds: (e.args.tokenIds ?? e.args[1] || []).map((id) => String(this._toNumber(id))),
        timestamp: this._toNumber(e.args.timestamp ?? e.args[2]),
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Query TokenUnstaked events (NFTStaking).
   */
  async getTokenUnstakedEvents(fromBlock, toBlock) {
    const contract = this._getStakingContract();
    if (!contract) return [];
    try {
      const events = await contract.queryFilter(
        contract.filters.TokenUnstaked(),
        Number(fromBlock),
        toBlock === 'latest' ? 'latest' : Number(toBlock)
      );
      return events.map((e) => ({
        staker: e.args.staker ?? e.args[0],
        tokenIds: (e.args.tokenIds ?? e.args[1] || []).map((id) => String(this._toNumber(id))),
        penalty: this._formatEther(e.args.penalty ?? e.args[2] ?? 0),
        timestamp: this._toNumber(e.args.timestamp ?? e.args[3]),
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Query RewardsClaimed events (NFTStaking).
   */
  async getRewardsClaimedEvents(fromBlock, toBlock) {
    const contract = this._getStakingContract();
    if (!contract) return [];
    try {
      const events = await contract.queryFilter(
        contract.filters.RewardsClaimed(),
        Number(fromBlock),
        toBlock === 'latest' ? 'latest' : Number(toBlock)
      );
      return events.map((e) => ({
        staker: e.args.staker ?? e.args[0],
        rewards: this._formatEther(e.args.rewards ?? e.args[1]),
        timestamp: this._toNumber(e.args.timestamp ?? e.args[2]),
        blockNumber: e.blockNumber,
        transactionHash: e.transactionHash,
      }));
    } catch {
      return [];
    }
  }
}

