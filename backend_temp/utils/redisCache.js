/**
 * Small Redis-backed key/value cache with an in-memory fallback.
 *
 * Behavior:
 *   - If REDIS_URL (or REDIS_HOST) is set AND the connection succeeds, all
 *     reads/writes go through Redis.
 *   - Otherwise, falls back to a process-local Map cache. This keeps dev and
 *     small single-instance deployments working without Redis configured.
 *
 * Public API: { get(key), set(key, value, ttlSeconds), del(key) }
 * Values are serialized as JSON strings.
 */
// Dynamic import — Redis is optional. If the package isn't installed or the
// connection fails the module silently falls back to the in-memory Map cache.

const ttlDefaultSeconds = 60 * 5; // 5 minutes
const memCache = new Map(); // fallback when Redis isn't available

let redisClient = null;
let connecting = null;

async function connectRedis() {
  const url = process.env.REDIS_URL
    || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);
  if (!url) return null;
  try {
    const { createClient } = await import('redis');
    const client = createClient({ url, socket: { reconnectStrategy: false } });
    client.on('error', () => { /* silenced — fall back to mem cache */ });
    await client.connect();
    return client;
  } catch (err) {
    console.warn('[redisCache] Redis unavailable, using in-memory cache:', err.message);
    return null;
  }
}

async function getClient() {
  if (redisClient) return redisClient;
  if (!connecting) connecting = connectRedis().then((c) => { redisClient = c; return c; });
  return connecting;
}

function memGet(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key, value, ttlSeconds) {
  memCache.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

export async function cacheGet(key) {
  try {
    const client = await getClient();
    if (client) {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (_) { /* fall through to mem */ }
  return memGet(key);
}

export async function cacheSet(key, value, ttlSeconds = ttlDefaultSeconds) {
  try {
    const client = await getClient();
    if (client) {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    }
  } catch (_) { /* fall through */ }
  memSet(key, value, ttlSeconds);
}

export async function cacheDel(key) {
  try {
    const client = await getClient();
    if (client) await client.del(key);
  } catch (_) { /* ignore */ }
  memCache.delete(key);
}
