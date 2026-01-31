import { getGameConfig } from '../../config/casinoConfig.js';

export function generatePlinkoOutcome(float, config, options) {
  const c = config || getGameConfig('plinko');
  const rows = c?.rows ?? 16;
  const buckets = c?.buckets ?? 17;
  const rtp = c?.rtp ?? 0.96;
  const bucketIndex = Math.min(buckets - 1, Math.floor(float * buckets));
  const mid = (buckets - 1) / 2;
  const distanceFromCenter = Math.abs(bucketIndex - mid);
  const maxDistance = mid;
  const normalizedDistance = maxDistance <= 0 ? 0 : distanceFromCenter / maxDistance;
  const multiplierCurve = 0.5 + 2 * (1 - normalizedDistance);
  const payoutMultiplier = Math.max(0.1, Math.min(10, multiplierCurve * rtp));
  return {
    outcome: { bucketIndex, buckets, payoutMultiplier },
    payoutMultiplier,
    verificationData: { bucketIndex, buckets, rows, rtp },
  };
}
