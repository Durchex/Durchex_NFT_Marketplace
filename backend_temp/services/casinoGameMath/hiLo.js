import { getGameConfig } from '../../config/casinoConfig.js';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RANK_ORDER = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };

export function generateHiLoOutcome(float, config, options) {
  const c = config || getGameConfig('hi_lo');
  const rtp = c?.rtp ?? 0.96;
  const scale = c?.payoutScale ?? 1;
  const idx = Math.floor(float * RANKS.length) % RANKS.length;
  const card = RANKS[idx];
  const guess = (options?.guess || 'higher').toLowerCase();
  const order = RANK_ORDER[card];
  const prevOrder = options?.previousCard ? RANK_ORDER[options.previousCard] : null;
  let payoutMultiplier = 0;
  if (prevOrder == null) {
    payoutMultiplier = 1;
  } else {
    const higher = order > prevOrder;
    const lower = order < prevOrder;
    const same = order === prevOrder;
    if (guess === 'higher' && higher) payoutMultiplier = 2 * rtp * scale;
    else if (guess === 'lower' && lower) payoutMultiplier = 2 * rtp * scale;
    else if (guess === 'same' && same) payoutMultiplier = 4 * rtp * scale;
  }
  return {
    outcome: { card, order, guess, win: payoutMultiplier > 0 },
    payoutMultiplier,
    verificationData: { card, guess, rtp },
  };
}
