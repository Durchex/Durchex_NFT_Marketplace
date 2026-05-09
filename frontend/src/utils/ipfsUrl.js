// Shared IPFS URL resolver. Browsers can't load `ipfs://` URIs natively,
// so any URI in that form (or a bare CID) must be rewritten to a gateway URL.
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export function resolveIpfsUrl(uri) {
  if (!uri) return uri;
  const s = String(uri).trim();
  if (s.startsWith('ipfs://')) return `${PINATA_GATEWAY}${s.slice(7)}`;
  // Heuristic: a bare CIDv0 (Qm…) or CIDv1 (b…/k…) without a scheme.
  // Don't accidentally rewrite paths like "image.png" — require typical CID length and base32/58 charset.
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{50,}|k[0-9a-z]{50,})$/.test(s)) {
    return `${PINATA_GATEWAY}${s}`;
  }
  return s;
}

// Walks an NFT-like object (or array of them) and rewrites image-bearing fields
// in place. Returns the same reference for convenience. Safe to call on null/undefined.
const IMAGE_FIELDS = ['image', 'imageURL', 'imageUrl', 'thumbnail', 'cover', 'coverImage', 'avatar', 'logo'];

export function resolveNftImages(value) {
  if (!value) return value;
  if (Array.isArray(value)) {
    value.forEach(resolveNftImages);
    return value;
  }
  if (typeof value !== 'object') return value;
  for (const field of IMAGE_FIELDS) {
    if (typeof value[field] === 'string' && value[field]) {
      value[field] = resolveIpfsUrl(value[field]);
    }
  }
  // Common nested shapes: { nft: {...} }, { collection: {...} }, { collections: [...] }
  if (value.nft) resolveNftImages(value.nft);
  if (value.nfts) resolveNftImages(value.nfts);
  if (value.collection && typeof value.collection === 'object') resolveNftImages(value.collection);
  if (value.collections) resolveNftImages(value.collections);
  if (value.data && typeof value.data === 'object') resolveNftImages(value.data);
  if (value.items) resolveNftImages(value.items);
  if (value.results) resolveNftImages(value.results);
  return value;
}
