import { getGameConfig } from '../../config/casinoConfig.js';

const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function generateRouletteOutcome(float, config, options) {
  const c = config || getGameConfig('roulette');
  const pockets = c?.pockets ?? 37;
  const rtp = c?.rtp ?? 0.973;
  const number = Math.floor(float * pockets) % pockets;
  const isRed = RED.includes(number);
  const betType = (options?.betType || 'red').toLowerCase();
  const numberBet = options?.numberBet != null ? Number(options.numberBet) : 17;
  let payoutMultiplier = 0;
  if (betType === 'number') {
    payoutMultiplier = number === numberBet ? 36 * rtp : 0;
  } else if (betType === 'red') {
    payoutMultiplier = isRed ? 2 * rtp : 0;
  } else {
    payoutMultiplier = !isRed && number !== 0 ? 2 * rtp : 0;
  }
  return {
    outcome: { number, isRed, betType, numberBet },
    payoutMultiplier,
    verificationData: { number, pockets, betType, numberBet, rtp },
  };
}
