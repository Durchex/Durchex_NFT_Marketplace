import crypto from 'crypto';

/**
 * Provably fair RNG: deterministic outcome from server seed + client seed + nonce.
 * Verification: hash(serverSeed) was shown before round; after round, serverSeed revealed,
 * so client can recompute hash(serverSeed + clientSeed + nonce) and verify outcome.
 */

const HASH_ALG = 'sha256';
const HMAC_ALG = 'sha256';

/**
 * Generate a cryptographically random server seed (hex).
 */
export function generateServerSeed() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a seed for commitment (show before round).
 */
export function hashSeed(seed) {
  return crypto.createHash(HASH_ALG).update(seed).digest('hex');
}

/**
 * Compute HMAC(serverSeed, clientSeed + ':' + nonce) and derive a float in [0, 1).
 * Deterministic: same inputs always yield same float.
 */
export function getProvablyFairFloat(serverSeed, clientSeed, nonce) {
  const message = `${clientSeed}:${nonce}`;
  const hmac = crypto.createHmac(HMAC_ALG, serverSeed).update(message).digest('hex');
  const num = parseInt(hmac.slice(0, 13), 16);
  return num / (0x10000000000000); // 0 .. 1 (exclusive of 1 if we use 13 hex = 52 bits)
}

/**
 * Full verification hash for a round (outcome + seeds for transparency).
 */
export function getVerificationHash(serverSeed, clientSeed, nonce, outcomePayload) {
  const payload = JSON.stringify({
    serverSeed: hashSeed(serverSeed),
    clientSeed,
    nonce,
    outcome: outcomePayload,
  });
  return crypto.createHash(HASH_ALG).update(payload).digest('hex');
}
