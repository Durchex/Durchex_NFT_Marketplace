import { getGameConfig } from '../../config/casinoConfig.js';

export function generateMinesOutcome(float, config, options) {
  const c = config || getGameConfig('mines');
  const totalTiles = c?.totalTiles ?? 25;
  const mineCount = c?.mineCount ?? 5;
  const rtp = c?.rtp ?? 0.96;
  const indices = [];
  for (let i = 0; i < totalTiles; i++) indices.push(i);
  const mineIndices = [];
  let u = float;
  for (let m = 0; m < mineCount && indices.length > 0; m++) {
    const idx = Math.floor(u * indices.length) % indices.length;
    mineIndices.push(indices[idx]);
    indices.splice(idx, 1);
    u = (u * 937 + 0.5) % 1;
  }
  mineIndices.sort((a, b) => a - b);
  return {
    outcome: { mineIndices, totalTiles, mineCount },
    payoutMultiplier: null,
    verificationData: { mineIndices, totalTiles, mineCount, rtp },
  };
}
