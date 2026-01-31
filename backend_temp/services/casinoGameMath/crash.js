/**
 * Crash: one crash point per round. Exponential-style curve so low multipliers
 * are frequent, high are rare. RTP controlled by curve exponent.
 * options.cashOutMultiplier: if player cashed out at this multiplier, payout only when crashPoint >= cashOutMultiplier.
 */

import { getGameConfig } from '../../config/casinoConfig.js';

export function generateCrashOutcome(float, config, options) {
  const c = config || getGameConfig('crash');
  const min = c?.minMultiplier ?? 1;
  const max = c?.maxMultiplier ?? 100;
  const e = c?.curveExponent ?? 0.98;
  const rtp = c?.rtp ?? 0.97;
  const u = Math.max(1e-10, 1 - float);
  const raw = 1 / Math.pow(u, 1 / e);
  const crashPoint = Math.min(max, Math.max(min, raw));
  const rounded = Math.round(crashPoint * 100) / 100;
  const cashOut = options?.cashOutMultiplier != null ? Number(options.cashOutMultiplier) : null;
  let payoutMultiplier = 0;
  if (cashOut != null && rounded >= cashOut) {
    payoutMultiplier = Math.min(cashOut * rtp, max * rtp);
  }
  return {
    outcome: { crashPoint: rounded },
    payoutMultiplier,
    verificationData: { crashPoint: rounded, curveExponent: e, cashOutMultiplier: cashOut },
  };
}
