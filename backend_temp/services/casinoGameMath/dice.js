/**
 * Dice: roll 0–100. Payout multiplier from probability minus house edge.
 * Roll range 0–100; player picks over/under target; payout = (100 / winChance) * rtp.
 */

import { getGameConfig } from '../../config/casinoConfig.js';

export function generateDiceOutcome(float, config = null, options = {}) {
  const c = config || getGameConfig('dice');
  const rtp = c?.rtp ?? 0.96;
  const minRoll = c?.minRoll ?? 0;
  const maxRoll = c?.maxRoll ?? 100;
  const roll = minRoll + Math.floor(float * (maxRoll - minRoll + 1));
  const clampedRoll = Math.min(maxRoll, Math.max(minRoll, roll));

  const target = options.target != null ? Number(options.target) : 50;
  const choice = (options.choice || 'over').toLowerCase();
  const winChance =
    choice === 'over'
      ? (maxRoll - target) / (maxRoll - minRoll + 1)
      : choice === 'under'
        ? (target - minRoll) / (maxRoll - minRoll + 1)
        : 0.5;
  const fairMultiplier = winChance <= 0 ? 0 : 1 / winChance;
  const payoutMultiplier = Math.min(fairMultiplier * rtp, 9900);

  const winOver = choice === 'over' && clampedRoll > target;
  const winUnder = choice === 'under' && clampedRoll < target;
  const push = (choice === 'over' && clampedRoll === target) || (choice === 'under' && clampedRoll === target);
  let multiplier = 0;
  if (push) multiplier = 1;
  else if (winOver || winUnder) multiplier = payoutMultiplier;

  return {
    outcome: { roll: clampedRoll, target, choice, push, win: winOver || winUnder },
    payoutMultiplier: multiplier,
    verificationData: { roll: clampedRoll, target, choice, winChance, rtp },
  };
}
