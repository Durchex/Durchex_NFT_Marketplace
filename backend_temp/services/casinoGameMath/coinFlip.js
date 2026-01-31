/**
 * Coin Flip: two outcomes. Payout multiplier less than true odds (e.g. 1.96x instead of 2x).
 */

import { getGameConfig } from '../../config/casinoConfig.js';

export function generateCoinFlipOutcome(float, config = null, options = {}) {
  const c = config || getGameConfig('coin_flip');
  const side = float < 0.5 ? 'heads' : 'tails';
  const payoutMultiplier = c?.payoutMultiplier ?? 1.96;
  const playerChoice = (options.choice || 'heads').toLowerCase();
  const win = (playerChoice === 'heads' && side === 'heads') || (playerChoice === 'tails' && side === 'tails');
  const multiplier = win ? payoutMultiplier : 0;

  return {
    outcome: { side, playerChoice, win },
    payoutMultiplier: multiplier,
    verificationData: { side, playerChoice, payoutMultiplier },
  };
}
