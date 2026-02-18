import { nftUserModel } from '../models/userModel.js';
import { casinoRoundModel, createRound, findRoundById } from '../models/casinoRoundModel.js';
import { atomicDeduct, creditPayout } from '../services/gameWalletService.js';
import { GAME_IDS, getGameConfig, getRTP } from '../config/casinoConfig.js';
import { generateServerSeed, hashSeed, getProvablyFairFloat, getVerificationHash } from '../utils/provablyFair.js';
import { runGameMath } from '../services/casinoGameMath/index.js';

const VALID_GAME_IDS = Object.values(GAME_IDS);

// Use shared atomicDeduct and creditPayout from services/gameWalletService.js

/**
 * POST /api/v1/casino/place-bet
 * Body: { walletAddress, gameId, betAmount, clientSeed?, options? }
 * - Deducts bet atomically, runs provably fair game math, credits payout, saves round.
 * - For mines: deduct only, no credit; use mines-cashout to credit.
 */
export async function placeBet(req, res) {
  try {
    const { walletAddress, gameId, betAmount, clientSeed, options = {} } = req.body || {};
    const w = (walletAddress || '').toLowerCase();
    const bet = Math.max(0, Number(betAmount) || 0);
    if (!w) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }
    if (!VALID_GAME_IDS.includes(gameId)) {
      return res.status(400).json({ error: 'Invalid gameId', validGames: VALID_GAME_IDS });
    }
    if (bet < 0.01) {
      return res.status(400).json({ error: 'betAmount must be at least 0.01' });
    }

    const userBefore = await atomicDeduct(w, bet);
    if (!userBefore) {
      return res.status(400).json({ error: 'Insufficient balance or invalid wallet' });
    }

    const serverSeed = generateServerSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const client = (clientSeed != null && String(clientSeed).trim()) ? String(clientSeed).trim() : generateServerSeed().slice(0, 16);
    const nonce = Date.now();

    const float = getProvablyFairFloat(serverSeed, client, nonce);
    const config = getGameConfig(gameId);
    const result = runGameMath(gameId, float, config, options);
    if (!result) {
      await creditPayout(w, bet);
      return res.status(400).json({ error: 'Game math failed' });
    }

    const { outcome, payoutMultiplier, verificationData } = result;
    const payoutMultiplierNum = payoutMultiplier == null ? 0 : Number(payoutMultiplier);
    const payout = gameId === GAME_IDS.MINES ? 0 : bet * payoutMultiplierNum;
    const verificationHash = getVerificationHash(serverSeed, client, nonce, outcome);

    if (gameId !== GAME_IDS.MINES) {
      await creditPayout(w, payout);
    }

    const roundData = {
      walletAddress: w,
      gameId,
      bet,
      payout: gameId === GAME_IDS.MINES ? 0 : payout,
      serverSeedHash,
      serverSeed: null,
      clientSeed: client,
      nonce,
      outcome,
      verificationHash,
      status: gameId === GAME_IDS.MINES ? 'pending_cashout' : 'resolved',
    };
    const round = await createRound(roundData);
    const newBalance = gameId === GAME_IDS.MINES
      ? (userBefore.gameBalance - bet)
      : (userBefore.gameBalance - bet + payout);

    const responseOutcome = gameId === GAME_IDS.MINES
      ? { totalTiles: outcome.totalTiles, mineCount: outcome.mineCount }
      : outcome;

    res.status(200).json({
      roundId: round._id.toString(),
      gameId,
      outcome: responseOutcome,
      bet,
      payout: gameId === GAME_IDS.MINES ? 0 : payout,
      payoutMultiplier: payoutMultiplierNum,
      newBalance,
      verification: {
        serverSeedHash,
        clientSeed: client,
        nonce,
        verificationHash,
      },
      rtp: getRTP(gameId),
    });
  } catch (err) {
    console.error('[Casino] placeBet error', err);
    res.status(500).json({ error: 'Place bet failed' });
  }
}

/**
 * POST /api/v1/casino/mines-reveal
 * Body: { walletAddress, roundId, tileIndex }
 * - Returns { isMine } for that tile (does not expose other mines).
 */
export async function minesReveal(req, res) {
  try {
    const { walletAddress, roundId, tileIndex } = req.body || {};
    const w = (walletAddress || '').toLowerCase();
    const index = Number(tileIndex);
    if (!w || !roundId || (index !== 0 && !index)) {
      return res.status(400).json({ error: 'walletAddress, roundId, and tileIndex are required' });
    }

    const round = await findRoundById(roundId);
    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.walletAddress !== w) return res.status(403).json({ error: 'Not your round' });
    if (round.gameId !== GAME_IDS.MINES) return res.status(400).json({ error: 'Not a mines round' });
    if (round.status !== 'pending_cashout') return res.status(400).json({ error: 'Round already resolved' });

    const totalTiles = round.outcome?.totalTiles ?? 25;
    if (index < 0 || index >= totalTiles) {
      return res.status(400).json({ error: 'Invalid tileIndex' });
    }

    const mineIndices = round.outcome?.mineIndices || [];
    const isMine = mineIndices.includes(index);
    res.status(200).json({ isMine, tileIndex: index });
  } catch (err) {
    console.error('[Casino] minesReveal error', err);
    res.status(500).json({ error: 'Reveal failed' });
  }
}

/**
 * POST /api/v1/casino/mines-cashout
 * Body: { walletAddress, roundId, revealedIndices }
 * - Verifies round is mines and pending; checks none of revealedIndices are mines; credits payout.
 */
export async function minesCashout(req, res) {
  try {
    const { walletAddress, roundId, revealedIndices = [] } = req.body || {};
    const w = (walletAddress || '').toLowerCase();
    if (!w || !roundId) {
      return res.status(400).json({ error: 'walletAddress and roundId are required' });
    }

    const round = await findRoundById(roundId);
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }
    if (round.walletAddress !== w) {
      return res.status(403).json({ error: 'Not your round' });
    }
    if (round.gameId !== GAME_IDS.MINES) {
      return res.status(400).json({ error: 'Not a mines round' });
    }
    if (round.status !== 'pending_cashout') {
      return res.status(400).json({ error: 'Round already resolved' });
    }

    const mineIndices = round.outcome?.mineIndices || [];
    const revealed = Array.isArray(revealedIndices) ? revealedIndices.map(Number) : [];
    const hitMine = revealed.some((i) => mineIndices.includes(i));
    if (hitMine) {
      await casinoRoundModel.findByIdAndUpdate(roundId, { status: 'resolved' });
      return res.status(200).json({
        roundId,
        cashedOut: false,
        hitMine: true,
        payout: 0,
        newBalance: (await nftUserModel.findOne({ walletAddress: w }).lean())?.gameBalance ?? 0,
      });
    }

    const k = revealed.length;
    const config = getGameConfig(GAME_IDS.MINES);
    const rtp = config?.rtp ?? 0.96;
    const multiplier = Math.min(10, 1 + (k * 0.2) * rtp);
    const payout = round.bet * multiplier;
    await creditPayout(w, payout);
    await updateRoundRevealSeed(roundId, round.serverSeed);

    const updated = await nftUserModel.findOne({ walletAddress: w }).lean();
    res.status(200).json({
      roundId,
      cashedOut: true,
      hitMine: false,
      payout,
      multiplier,
      newBalance: updated?.gameBalance ?? 0,
    });
  } catch (err) {
    console.error('[Casino] minesCashout error', err);
    res.status(500).json({ error: 'Mines cashout failed' });
  }
}

/**
 * GET /api/v1/casino/round/:id
 * Returns round for verification (serverSeed revealed after round resolved).
 */
export async function getRound(req, res) {
  try {
    const { id } = req.params;
    const round = await findRoundById(id);
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }
    res.status(200).json({
      roundId: round._id.toString(),
      gameId: round.gameId,
      bet: round.bet,
      payout: round.payout,
      serverSeedHash: round.serverSeedHash,
      serverSeed: round.serverSeed ?? undefined,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      outcome: round.outcome,
      verificationHash: round.verificationHash,
      status: round.status,
      createdAt: round.createdAt,
    });
  } catch (err) {
    console.error('[Casino] getRound error', err);
    res.status(500).json({ error: 'Get round failed' });
  }
}

/**
 * GET /api/v1/casino/config
 * Returns RTP and game config (no secrets).
 */
export async function getConfig(req, res) {
  try {
    const configs = {};
    for (const id of VALID_GAME_IDS) {
      configs[id] = { rtp: getRTP(id), ...getGameConfig(id) };
    }
    res.status(200).json({ games: VALID_GAME_IDS, config: configs });
  } catch (err) {
    console.error('[Casino] getConfig error', err);
    res.status(500).json({ error: 'Get config failed' });
  }
}

/**
 * GET /api/v1/casino/analytics
 * Aggregates: totalBets, totalPayouts, netHouseProfit per game (from rounds).
 */
export async function getAnalytics(req, res) {
  try {
    const byGame = await casinoRoundModel.aggregate([
      { $match: { status: 'resolved' } },
      { $group: { _id: '$gameId', totalBets: { $sum: '$bet' }, totalPayouts: { $sum: '$payout' } } },
    ]);
    const analytics = { byGame: {}, totalBets: 0, totalPayouts: 0 };
    for (const row of byGame) {
      analytics.byGame[row._id] = {
        totalBets: row.totalBets,
        totalPayouts: row.totalPayouts,
        netHouseProfit: row.totalBets - row.totalPayouts,
      };
      analytics.totalBets += row.totalBets;
      analytics.totalPayouts += row.totalPayouts;
    }
    analytics.netHouseProfit = analytics.totalBets - analytics.totalPayouts;
    res.status(200).json(analytics);
  } catch (err) {
    console.error('[Casino] getAnalytics error', err);
    res.status(500).json({ error: 'Analytics failed' });
  }
}
