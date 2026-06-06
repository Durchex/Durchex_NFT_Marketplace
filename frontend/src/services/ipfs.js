/**
 * IPFS Upload Service — proxied through the backend so Pinata API keys
 * never leave the server. All uploads hit /api/v1/ipfs/* endpoints.
 */
import axios from 'axios';

function getBase() {
  if (import.meta.env.DEV) return 'http://localhost:3001/api/v1';
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return env.replace(/\/+$/, '');
  return `${window.location.protocol}//${window.location.hostname}/api/v1`;
}

/**
 * Upload a file to IPFS via the backend proxy.
 * @param {File} file
 * @param {Function} [onUploadProgress]
 * @returns {Promise<string>} IPFS CID
 */
export async function uploadToIPFS(file, onUploadProgress = null) {
  if (!file) throw new Error('No file provided');

  const arrayBuffer = await file.arrayBuffer();

  const response = await axios.post(
    `${getBase()}/ipfs/upload-file`,
    arrayBuffer,
    {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': file.name || 'upload',
        'X-File-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120_000, // 2 min for large files
    }
  );

  const { ipfsHash } = response.data;
  if (!ipfsHash) throw new Error('No IPFS hash returned from server');
  return ipfsHash;
}

/**
 * Upload a metadata JSON object to IPFS via the backend proxy.
 * @param {Object} metadata
 * @returns {Promise<string>} IPFS CID
 */
export async function uploadMetadataToIPFS(metadata) {
  if (!metadata) throw new Error('No metadata provided');

  const response = await axios.post(
    `${getBase()}/ipfs/upload-json`,
    metadata,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000,
    }
  );

  const { ipfsHash } = response.data;
  if (!ipfsHash) throw new Error('No IPFS hash returned from server');
  return ipfsHash;
}

/** Convert an IPFS CID to a public gateway URL. */
export function getIPFSUrl(hash) {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

/** Fetch NFT metadata from IPFS. */
export async function fetchMetadataFromIPFS(hash) {
  const response = await axios.get(getIPFSUrl(hash), { timeout: 15_000 });
  return response.data;
}
