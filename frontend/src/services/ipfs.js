import pinataService from './pinataService';

/**
 * IPFS Upload Service
 * Provides a simple interface for uploading files and metadata to IPFS
 */

/**
 * Upload a file to IPFS
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - IPFS CID (hash)
 */
export async function uploadToIPFS(file) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Upload image/file to IPFS
    const result = await pinataService.uploadImage(file);

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload to IPFS');
    }

    // Return the IPFS hash (CID)
    return result.ipfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Upload metadata JSON to IPFS
 * @param {Object} metadata - The metadata object to upload
 * @returns {Promise<string>} - IPFS CID (hash)
 */
export async function uploadMetadataToIPFS(metadata) {
  try {
    if (!metadata) {
      throw new Error('No metadata provided');
    }

    // Upload metadata to IPFS
    const result = await pinataService.uploadMetadata(metadata);

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload metadata to IPFS');
    }

    // Return the IPFS hash (CID)
    return result.ipfsHash;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
}

/**
 * Get IPFS URL from hash
 * @param {string} hash - IPFS hash (CID)
 * @returns {string} - Full IPFS URL
 */
export function getIPFSUrl(hash) {
  return pinataService.getIPFSUrl(hash);
}

/**
 * Fetch metadata from IPFS
 * @param {string} hash - IPFS hash (CID)
 * @returns {Promise<Object>} - Metadata object
 */
export async function fetchMetadataFromIPFS(hash) {
  try {
    const result = await pinataService.fetchMetadata(hash);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch metadata from IPFS');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    throw error;
  }
}
