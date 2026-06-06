/**
 * IPFS upload proxy — keeps Pinata API keys server-side.
 *
 * POST /api/v1/ipfs/upload-file
 *   Body  : raw binary (Content-Type = file mime type)
 *   Header: X-File-Name — original filename
 *   → { success, ipfsHash }
 *
 * POST /api/v1/ipfs/upload-json
 *   Body  : JSON object (the metadata to pin)
 *   → { success, ipfsHash }
 */
import express from 'express';

const router = express.Router();

function pinataHeaders() {
  const key    = process.env.PINATA_API_KEY    || process.env.VITE_APP_PINATA_API_KEY    || '';
  const secret = process.env.PINATA_SECRET_KEY || process.env.VITE_APP_PINATA_SECRET_KEY || '';
  const jwt    = process.env.PINATA_JWT        || process.env.VITE_APP_PINATA_JWT        || '';

  if (key && secret) return { pinata_api_key: key, pinata_secret_api_key: secret };
  if (jwt)           return { Authorization: `Bearer ${jwt}` };
  return null;
}

// ── Upload binary file ──────────────────────────────────────────────────────
router.post(
  '/upload-file',
  express.raw({ type: () => true, limit: '150mb' }),
  async (req, res) => {
    try {
      const headers = pinataHeaders();
      if (!headers) {
        return res.status(500).json({ error: 'IPFS not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY on the server.' });
      }

      const fileName = req.headers['x-file-name'] || 'upload';
      const mimeType = req.headers['x-file-type'] || req.headers['content-type'] || 'application/octet-stream';

      const formData = new FormData();
      formData.append(
        'file',
        new Blob([req.body], { type: mimeType }),
        fileName
      );
      formData.append(
        'pinataMetadata',
        JSON.stringify({ name: `NFT-${Date.now()}-${fileName}` })
      );

      const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,   // Content-Type with boundary is set automatically by fetch/FormData
        body: formData,
      });

      const data = await pinataRes.json();
      if (!pinataRes.ok) {
        console.error('[IPFS proxy] Pinata file error:', data);
        return res.status(502).json({ error: data?.error?.details || data?.error || 'Pinata upload failed' });
      }

      res.json({ success: true, ipfsHash: data.IpfsHash });
    } catch (err) {
      console.error('[IPFS proxy] upload-file error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── Upload JSON metadata ───────────────────────────────────────────────────
router.post(
  '/upload-json',
  express.json({ limit: '10mb' }),
  async (req, res) => {
    try {
      const headers = pinataHeaders();
      if (!headers) {
        return res.status(500).json({ error: 'IPFS not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY on the server.' });
      }

      const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          pinataContent: req.body,
          pinataMetadata: { name: `NFT-Metadata-${Date.now()}` },
        }),
      });

      const data = await pinataRes.json();
      if (!pinataRes.ok) {
        console.error('[IPFS proxy] Pinata JSON error:', data);
        return res.status(502).json({ error: data?.error?.details || data?.error || 'Pinata metadata upload failed' });
      }

      res.json({ success: true, ipfsHash: data.IpfsHash });
    } catch (err) {
      console.error('[IPFS proxy] upload-json error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
