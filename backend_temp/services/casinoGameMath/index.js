import { GAME_IDS } from '../../config/casinoConfig.js';
import { generateCrashOutcome } from './crash.js';
import { generateDiceOutcome } from './dice.js';
import { generateCoinFlipOutcome } from './coinFlip.js';
import { generatePlinkoOutcome } from './plinko.js';
import { generateMinesOutcome } from './mines.js';
import { generateRouletteOutcome } from './roulette.js';
import { generateHiLoOutcome } from './hiLo.js';
import { generateLimboOutcome } from './limbo.js';
import { generateSlotsOutcome } from './slots.js';

const generators = {
  [GAME_IDS.CRASH]: generateCrashOutcome,
  [GAME_IDS.DICE]: generateDiceOutcome,
  [GAME_IDS.COIN_FLIP]: generateCoinFlipOutcome,
  [GAME_IDS.PLINKO]: generatePlinkoOutcome,
  [GAME_IDS.MINES]: generateMinesOutcome,
  [GAME_IDS.ROULETTE]: generateRouletteOutcome,
  [GAME_IDS.HI_LO]: generateHiLoOutcome,
  [GAME_IDS.LIMBO]: generateLimboOutcome,
  [GAME_IDS.SLOTS]: generateSlotsOutcome,
};

/**
 * Run game math for a given game type. float must be in [0, 1) from provably fair RNG.
 * Returns { outcome, payoutMultiplier, verificationData }.
 */
export function runGameMath(gameId, float, configOverrides = null, options = {}) {
  const fn = generators[gameId];
  if (!fn) return null;
  return fn(float, configOverrides, options);
}

export {
  generateCrashOutcome,
  generateDiceOutcome,
  generateCoinFlipOutcome,
  generatePlinkoOutcome,
  generateMinesOutcome,
  generateRouletteOutcome,
  generateHiLoOutcome,
  generateLimboOutcome,
  generateSlotsOutcome,
};
