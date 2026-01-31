/**
 * Slots: configurable reels and symbol weights. Paylines with RTP calculation.
 * Symbol frequency controls overall payout. One float drives all reels (derived sequence).
 */

import { getGameConfig } from '../../config/casinoConfig.js';

const DEFAULT_SYMBOLS = ['cherry', 'lemon', 'orange', 'plum', 'bell', 'seven'];
const DEFAULT_WEIGHTS = [20, 18, 16, 14, 10, 6];
const PAYTABLE = { cherry: 2, lemon: 4, orange: 8, plum: 12, bell: 20, seven: 50 };

export function generateSlotsOutcome(float, config = null, options = {}) {
  const c = config || getGameConfig('slots');
  const rtp = c?.rtp ?? 0.96;
  const reels = c?.reels ?? 3;
  const symbols = options.symbols || DEFAULT_SYMBOLS;
  const weights = options.weights || DEFAULT_WEIGHTS.slice(0, symbols.length);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const reelsResult = [];
  let u = float;
  for (let r = 0; r < reels; r++) {
    const pick = (u * totalWeight) % totalWeight;
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (pick < acc) {
        idx = i;
        break;
      }
    }
    reelsResult.push(symbols[idx]);
    u = (u * 937 + 0.5) % 1;
  }

  const allSame = reelsResult.every((s) => s === reelsResult[0]);
  const baseMultiplier = allSame ? (PAYTABLE[reelsResult[0]] ?? 2) : 0;
  const payoutMultiplier = baseMultiplier * rtp;

  return {
    outcome: { reels: reelsResult, allSame },
    payoutMultiplier,
    verificationData: { reels: reelsResult, rtp, weights },
  };
}
