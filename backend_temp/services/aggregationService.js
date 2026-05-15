/**
 * Marketplace aggregation service.
 *
 * Fetches NFT listings from external marketplaces (OpenSea, Blur, Magic Eden, …)
 * and normalizes them into Durchex's listing shape so they can be displayed in
 * the explore/collection views alongside native listings.
 *
 * Design:
 *   - Each marketplace is an "adapter" with a uniform interface.
 *   - Adapters are independently optional — if no API key is configured, they
 *     return [] and are silently skipped.
 *   - Results are cached for 5 min by (chain, contract, tokenId) key to keep
 *     external API rate limits from being a problem.
 *
 * Adding a marketplace:
 *   1. Implement `fetchListings({ chain, contract, tokenId? })` in a new adapter
 *      under ./aggregationAdapters/.
 *   2. Register it in `adapters` below.
 *   3. Set the corresponding env var (e.g. OPENSEA_API_KEY) — without it the
 *      adapter returns [] and the aggregator just doesn't include its results.
 */

import axios from 'axios';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key → { value, expiresAt }

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Normalize an external listing into Durchex's shape.
 * Caller passes raw adapter output + the marketplace name.
 */
function normalizeListing(raw, source) {
  return {
    source,                                  // 'opensea' | 'blur' | 'magiceden' | ...
    nftContract: (raw.contract || '').toLowerCase(),
    tokenId: String(raw.tokenId ?? ''),
    seller: (raw.seller || '').toLowerCase(),
    priceWei: String(raw.priceWei ?? '0'),
    paymentToken: raw.paymentToken || '0x0000000000000000000000000000000000000000',
    network: (raw.network || '').toLowerCase(),
    expiresAt: raw.expiresAt || null,
    listingType: raw.listingType || 'fixed',
    externalUrl: raw.externalUrl || null,    // deep link to the source listing
    raw,                                     // keep original payload for debug
  };
}

// ---- OpenSea adapter ----
async function openseaAdapter({ chain, contract, tokenId }) {
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return [];
  try {
    // OpenSea API v2: listings by contract. See https://docs.opensea.io/reference
    const chainSlug = {
      ethereum: 'ethereum', polygon: 'matic', arbitrum: 'arbitrum',
      base: 'base', optimism: 'optimism', avalanche: 'avalanche',
      bsc: 'bsc',
    }[chain] || chain;
    const url = tokenId
      ? `https://api.opensea.io/api/v2/orders/${chainSlug}/seaport/listings?asset_contract_address=${contract}&token_ids=${tokenId}&limit=20`
      : `https://api.opensea.io/api/v2/listings/collection/${contract}/all?limit=50`;
    const res = await axios.get(url, { headers: { 'X-API-KEY': apiKey }, timeout: 8000 });
    const orders = res.data?.orders || res.data?.listings || [];
    return orders.map((o) => normalizeListing({
      contract,
      tokenId: o.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria,
      seller: o.maker?.address || o.protocol_data?.parameters?.offerer,
      priceWei: o.current_price,
      paymentToken: o.payment_token_contract?.address || '0x0000000000000000000000000000000000000000',
      network: chain,
      expiresAt: o.expiration_time ? new Date(o.expiration_time * 1000).toISOString() : null,
      externalUrl: `https://opensea.io/assets/${chainSlug}/${contract}/${o.protocol_data?.parameters?.offer?.[0]?.identifierOrCriteria || tokenId}`,
    }, 'opensea'));
  } catch (err) {
    console.warn('[aggregation] OpenSea fetch failed:', err.message);
    return [];
  }
}

// ---- Magic Eden adapter (EVM) ----
async function magicEdenAdapter({ chain, contract, tokenId }) {
  // Magic Eden public reservoir-backed API. No key needed for basic reads.
  try {
    const supported = ['ethereum', 'polygon', 'base', 'arbitrum'];
    if (!supported.includes(chain)) return [];
    const params = new URLSearchParams();
    if (tokenId) params.set('tokens', `${contract}:${tokenId}`);
    else params.set('contracts', contract);
    params.set('limit', '20');
    params.set('status', 'active');
    const url = `https://api-mainnet.magiceden.dev/v3/rtp/${chain}/orders/asks/v5?${params}`;
    const res = await axios.get(url, { timeout: 8000 });
    const orders = res.data?.orders || [];
    return orders.map((o) => normalizeListing({
      contract,
      tokenId: o.criteria?.data?.token?.tokenId,
      seller: o.maker,
      priceWei: o.price?.amount?.raw,
      paymentToken: o.price?.currency?.contract || '0x0000000000000000000000000000000000000000',
      network: chain,
      expiresAt: o.validUntil ? new Date(o.validUntil * 1000).toISOString() : null,
      externalUrl: `https://magiceden.io/item-details/${chain}/${contract}/${o.criteria?.data?.token?.tokenId}`,
    }, 'magiceden'));
  } catch (err) {
    console.warn('[aggregation] Magic Eden fetch failed:', err.message);
    return [];
  }
}

// ---- Blur adapter (Ethereum only) ----
async function blurAdapter({ chain, contract }) {
  const apiKey = process.env.BLUR_API_KEY;
  if (!apiKey || chain !== 'ethereum') return [];
  try {
    const url = `https://core-api.prod.blur.io/v1/collections/${contract}/executable-listings?limit=20`;
    const res = await axios.get(url, { headers: { 'X-Api-Key': apiKey }, timeout: 8000 });
    const orders = res.data?.listings || [];
    return orders.map((o) => normalizeListing({
      contract,
      tokenId: o.tokenId,
      seller: o.maker,
      priceWei: o.price,
      network: 'ethereum',
      externalUrl: `https://blur.io/asset/${contract}/${o.tokenId}`,
    }, 'blur'));
  } catch (err) {
    console.warn('[aggregation] Blur fetch failed:', err.message);
    return [];
  }
}

const adapters = [openseaAdapter, magicEdenAdapter, blurAdapter];

/**
 * Fetch external listings for an NFT or a whole collection. Results from every
 * configured adapter are merged and de-duped by (source, contract, tokenId).
 */
export async function getExternalListings({ chain, contract, tokenId }) {
  if (!chain || !contract) return [];
  const key = `${chain}:${contract.toLowerCase()}:${tokenId ?? '*'}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const settled = await Promise.allSettled(
    adapters.map((fn) => fn({ chain, contract: contract.toLowerCase(), tokenId }))
  );
  const merged = settled
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value || [])
    .filter(Boolean);

  // De-dupe by source+tokenId+seller; keep cheapest if duplicates.
  const dedup = new Map();
  for (const item of merged) {
    const dkey = `${item.source}:${item.tokenId}:${item.seller}`;
    const existing = dedup.get(dkey);
    if (!existing || BigInt(item.priceWei || '0') < BigInt(existing.priceWei || '0')) {
      dedup.set(dkey, item);
    }
  }
  const result = Array.from(dedup.values()).sort((a, b) => {
    const ap = BigInt(a.priceWei || '0');
    const bp = BigInt(b.priceWei || '0');
    return ap < bp ? -1 : ap > bp ? 1 : 0;
  });

  cacheSet(key, result);
  return result;
}
