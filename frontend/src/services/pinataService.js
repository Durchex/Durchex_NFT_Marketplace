import axios from 'axios';

// Pinata IPFS Configuration
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

class PinataService {
  constructor() {
    this.apiKey = PINATA_API_KEY;
    this.secretKey = PINATA_SECRET_KEY;
    this.baseURL = 'https://api.pinata.cloud';
  }

  // Upload JSON metadata to IPFS
  async uploadMetadata(metadata) {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw new Error('Pinata API keys not configured');
      }

      const response = await axios.post(
        `${this.baseURL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: metadata,
          pinataMetadata: {
            name: `NFT-Metadata-${Date.now()}`,
            keyvalues: {
              type: 'nft-metadata',
              timestamp: new Date().toISOString()
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey
          }
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp
      };
    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Upload image file to IPFS
  async uploadImage(file) {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw new Error('Pinata API keys not configured');
      }

      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: `NFT-Image-${Date.now()}`,
        keyvalues: {
          type: 'nft-image',
          timestamp: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        `${this.baseURL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey
          }
        }
      );

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp
      };
    } catch (error) {
      console.error('Error uploading image to Pinata:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Get IPFS URL for accessing content
  getIPFSUrl(ipfsHash) {
    return `${PINATA_GATEWAY_URL}${ipfsHash}`;
  }

  // Create NFT metadata object
  createNFTMetadata({
    name,
    description,
    image,
    attributes = [],
    external_url = '',
    animation_url = '',
    background_color = '',
    youtube_url = ''
  }) {
    return {
      name,
      description,
      image,
      attributes,
      external_url,
      animation_url,
      background_color,
      youtube_url,
      // Standard NFT metadata fields
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Fetch metadata from IPFS
  async fetchMetadata(ipfsHash) {
    try {
      const url = this.getIPFSUrl(ipfsHash);
      const response = await axios.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching metadata from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test Pinata connection
  async testConnection() {
    try {
      if (!this.apiKey || !this.secretKey) {
        return {
          success: false,
          error: 'Pinata API keys not configured'
        };
      }

      const response = await axios.get(
        `${this.baseURL}/data/testAuthentication`,
        {
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey
          }
        }
      );

      return {
        success: true,
        message: 'Pinata connection successful',
        data: response.data
      };
    } catch (error) {
      console.error('Pinata connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

// Create singleton instance
const pinataService = new PinataService();

export default pinataService;

