/**
 * Limbo: player selects target multiplier. Outcome is a multiplier; if outcome >= target
 * player wins (payout = target * bet). RNG uses inverse crash-like logic: high targets
 * have exponentially lower hit chance.
 */

import { getGameConfig } from '../../config/casinoConfig.js';

export function generateLimboOutcome(float, config = null, options = {}) {
  const c = config || getGameConfig('limbo');
  const rtp = c?.rtp ?? 0.97;
  const minMultiplier = c?.minMultiplier ?? 1;
  const maxMultiplier = c?.maxMultiplier ?? 1000000;
  const e = c?.curveExponent ?? 0.98;
  const targetMultiplier = Math.max(1, Number(options.targetMultiplier) || 1);

  const u = Math.max(1e-10, 1 - float);
  const raw = 1 / Math.pow(u, 1 / e);
  const outcomeMultiplier = Math.min(maxMultiplier, Math.max(minMultiplier, raw));
  const win = outcomeMultiplier >= targetMultiplier;
  const payoutMultiplier = win ? targetMultiplier * rtp : 0;

  return {
    outcome: { outcomeMultiplier: Math.round(outcomeMultiplier * 100) / 100, targetMultiplier, win },
    payoutMultiplier,
    verificationData: { outcomeMultiplier, targetMultiplier, curveExponent: e, rtp },
  };
}
