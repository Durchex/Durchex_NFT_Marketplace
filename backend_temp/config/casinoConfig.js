/**
 * Casino game system configuration.
 * RTP (Return To Player) between 90% and 96% keeps house edge 4–10%.
 * Adjust these values to change house edge without code rewrites.
 */

const DEFAULT_RTP = 0.96; // 96% default
const MIN_RTP = 0.90;
const MAX_RTP = 0.96;

const GAME_IDS = {
  CRASH: 'crash',
  DICE: 'dice',
  COIN_FLIP: 'coin_flip',
  PLINKO: 'plinko',
  MINES: 'mines',
  ROULETTE: 'roulette',
  HI_LO: 'hi_lo',
  LIMBO: 'limbo',
  SLOTS: 'slots',
};

/**
 * Per-game RTP and limits. House edge = 1 - rtp.
 */
const GAME_CONFIG = {
  [GAME_IDS.CRASH]: {
    rtp: 0.97,
    minMultiplier: 1,
    maxMultiplier: 100,
    /** Exponent for crash curve: higher = steeper (more low multipliers) */
    curveExponent: 0.98,
  },
  [GAME_IDS.DICE]: {
    rtp: 0.96,
    minRoll: 0,
    maxRoll: 100,
  },
  [GAME_IDS.COIN_FLIP]: {
    rtp: 0.98,
    /** Payout multiplier per side (e.g. 1.96 for 2x minus house edge) */
    payoutMultiplier: 1.96,
  },
  [GAME_IDS.PLINKO]: {
    rtp: 0.96,
    rows: 16,
    /** Bucket count = rows + 1 */
    buckets: 17,
  },
  [GAME_IDS.MINES]: {
    rtp: 0.96,
    totalTiles: 25,
    mineCount: 5,
  },
  [GAME_IDS.ROULETTE]: {
    rtp: 0.973,
    /** European: 37 pockets (0–36) */
    pockets: 37,
  },
  [GAME_IDS.HI_LO]: {
    rtp: 0.96,
    /** Payout scaling; card probability is natural, payout adjusted */
    payoutScale: 1,
  },
  [GAME_IDS.LIMBO]: {
    rtp: 0.97,
    minMultiplier: 1,
    maxMultiplier: 1000000,
    curveExponent: 0.98,
  },
  [GAME_IDS.SLOTS]: {
    rtp: 0.96,
    reels: 3,
    symbolsPerReel: 5,
  },
};

function getGameConfig(gameId, overrides = {}) {
  const base = GAME_CONFIG[gameId];
  if (!base) return null;
  return { ...base, ...overrides };
}

function getRTP(gameId) {
  const c = GAME_CONFIG[gameId];
  return c ? (typeof c.rtp === 'number' ? Math.max(MIN_RTP, Math.min(MAX_RTP, c.rtp)) : DEFAULT_RTP) : DEFAULT_RTP;
}

export {
  DEFAULT_RTP,
  MIN_RTP,
  MAX_RTP,
  GAME_IDS,
  GAME_CONFIG,
  getGameConfig,
  getRTP,
};
