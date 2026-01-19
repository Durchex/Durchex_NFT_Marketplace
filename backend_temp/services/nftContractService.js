import ethers from 'ethers';
import dotenv from 'dotenv';
import { collectionModel } from '../models/collectionModel.js';
import { nftModel } from '../models/nftModel.js';

dotenv.config();

/**
 * NFTContractService - Handles all blockchain interactions
 * - Factory contract deployment
 * - Collection contract deployment
 * - NFT minting
 * - Metadata management
 */
class NFTContractService {
  constructor() {
    this.providers = {};
    this.signers = {};
    this.factoryContract = null;
    this.initializeProviders();
  }

  /**
   * Initialize providers for all supported networks
   */
  initializeProviders() {
    const networks = {
      ethereum: {
        rpc: process.env.ETHEREUM_RPC_URL || 'https://rpc.ankr.com/eth',
        chainId: 1
      },
      sepolia: {
        rpc: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
        chainId: 11155111
      },
      polygon: {
        rpc: process.env.POLYGON_RPC_URL || 'https://rpc.ankr.com/polygon',
        chainId: 137
      },
      arbitrum: {
        rpc: process.env.ARBITRUM_RPC_URL || 'https://rpc.ankr.com/arbitrum',
        chainId: 42161
      },
      base: {
        rpc: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
        chainId: 8453
      }
    };

    for (const [network, config] of Object.entries(networks)) {
      this.providers[network] = new ethers.JsonRpcProvider(config.rpc);
    }

    // Create signer with private key if available
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      for (const network of Object.keys(networks)) {
        this.signers[network] = new ethers.Wallet(privateKey, this.providers[network]);
      }
    }
  }

  /**
   * Get network provider
   */
  getProvider(network) {
    if (!this.providers[network]) {
      throw new Error(`Network ${network} not supported`);
    }
    return this.providers[network];
  }

  /**
   * Get signer for network (requires private key)
   */
  getSigner(network) {
    if (!this.signers[network]) {
      throw new Error(`Signer not available for ${network}. Set PRIVATE_KEY env variable.`);
    }
    return this.signers[network];
  }

  /**
   * Deploy NFT Collection (factory creates new collection contract)
   * @param {Object} params - Deployment parameters
   * @returns {Object} Deployment result with contract address and tx hash
   */
  async deployCollection(params) {
    const {
      network = 'sepolia',
      collectionName,
      collectionSymbol,
      creatorAddress,
      royaltyPercentage = 250, // 2.5% default
      royaltyRecipient,
      factoryAddress
    } = params;

    try {
      if (!factoryAddress) {
        throw new Error('Factory contract address required');
      }

      const signer = this.getSigner(network);

      // Factory ABI (minimal - just the function we need)
      const factoryABI = [
        'function createCollection(string name, string symbol, uint256 royaltyPercentage, address royaltyRecipient) public nonReentrant returns (address)'
      ];

      const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

      console.log(`🚀 Deploying collection: ${collectionName} on ${network}`);

      // Call factory to create new collection
      const tx = await factory.createCollection(
        collectionName,
        collectionSymbol,
        royaltyPercentage,
        royaltyRecipient || creatorAddress
      );

      console.log(`📝 Deployment tx: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);

      console.log(`✅ Collection deployed at block ${receipt.blockNumber}`);

      // Extract collection address from event logs
      // Event: CollectionCreated(address indexed collectionAddress, string name, string symbol, address indexed creator, uint256 timestamp)
      const event = receipt.logs
        .map(log => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e && e.name === 'CollectionCreated');

      const collectionAddress = event ? event.args.collectionAddress : null;

      return {
        success: true,
        collectionAddress,
        deploymentTx: tx.hash,
        deploymentBlock: receipt.blockNumber,
        network,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Collection deployment failed:', error.message);
      return {
        success: false,
        error: error.message,
        network
      };
    }
  }

  /**
   * Mint NFT on deployed collection contract
   * @param {Object} params - Minting parameters
   * @returns {Object} Minting result with token ID and tx hash
   */
  async mintNFT(params) {
    const {
      network = 'sepolia',
      collectionAddress,
      toAddress,
      metadataURI,
      minterPrivateKey
    } = params;

    try {
      if (!collectionAddress || !toAddress || !metadataURI) {
        throw new Error('collectionAddress, toAddress, and metadataURI required');
      }

      // Use provided minter key or default signer
      let signer = this.getSigner(network);
      if (minterPrivateKey) {
        signer = new ethers.Wallet(minterPrivateKey, this.getProvider(network));
      }

      // DurchexNFT ABI (minimal functions needed)
      const nftABI = [
        'function mint(address to, string uri) public returns (uint256)',
        'function batchMint(address to, string[] uris) public returns (uint256[])',
        'function getNextTokenId() public view returns (uint256)'
      ];

      const nftContract = new ethers.Contract(collectionAddress, nftABI, signer);

      console.log(`🎨 Minting NFT on ${collectionAddress}`);

      // Mint the NFT
      const tx = await nftContract.mint(toAddress, metadataURI);

      console.log(`📝 Mint tx: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait(1);

      console.log(`✅ NFT minted at block ${receipt.blockNumber}`);

      // Get the token ID
      const tokenId = await nftContract.getNextTokenId();
      const mintedTokenId = tokenId - 1n; // Previous ID since counter was incremented

      return {
        success: true,
        tokenId: mintedTokenId.toString(),
        mintTx: tx.hash,
        mintBlock: receipt.blockNumber,
        network,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ NFT minting failed:', error.message);
      return {
        success: false,
        error: error.message,
        network
      };
    }
  }

  /**
   * Batch mint multiple NFTs
   * @param {Object} params - Batch minting parameters
   * @returns {Object} Minting result with token IDs and tx hash
   */
  async batchMintNFT(params) {
    const {
      network = 'sepolia',
      collectionAddress,
      toAddress,
      metadataURIs = [],
      minterPrivateKey
    } = params;

    try {
      if (!collectionAddress || !toAddress || metadataURIs.length === 0) {
        throw new Error('collectionAddress, toAddress, and metadataURIs required');
      }

      let signer = this.getSigner(network);
      if (minterPrivateKey) {
        signer = new ethers.Wallet(minterPrivateKey, this.getProvider(network));
      }

      const nftABI = [
        'function batchMint(address to, string[] uris) public returns (uint256[])',
        'function getNextTokenId() public view returns (uint256)'
      ];

      const nftContract = new ethers.Contract(collectionAddress, nftABI, signer);

      console.log(`🎨 Batch minting ${metadataURIs.length} NFTs on ${collectionAddress}`);

      const tx = await nftContract.batchMint(toAddress, metadataURIs);

      console.log(`📝 Batch mint tx: ${tx.hash}`);

      const receipt = await tx.wait(1);

      console.log(`✅ NFTs minted at block ${receipt.blockNumber}`);

      const tokenId = await nftContract.getNextTokenId();
      const startId = Number(tokenId) - metadataURIs.length;

      const tokenIds = Array.from(
        { length: metadataURIs.length },
        (_, i) => (startId + i).toString()
      );

      return {
        success: true,
        tokenIds,
        batchMintTx: tx.hash,
        mintBlock: receipt.blockNumber,
        count: metadataURIs.length,
        network,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Batch minting failed:', error.message);
      return {
        success: false,
        error: error.message,
        network
      };
    }
  }

  /**
   * Get NFT metadata from IPFS
   * @param {string} metadataURI - IPFS URI
   * @returns {Object} Metadata object
   */
  async getMetadata(metadataURI) {
    try {
      if (!metadataURI) {
        throw new Error('Metadata URI required');
      }

      // Convert IPFS URI to HTTP gateway
      let httpURI = metadataURI;
      if (metadataURI.startsWith('ipfs://')) {
        const cid = metadataURI.replace('ipfs://', '');
        httpURI = `https://ipfs.io/ipfs/${cid}`;
      }

      const response = await fetch(httpURI);
      const metadata = await response.json();

      return metadata;
    } catch (error) {
      console.error('❌ Failed to fetch metadata:', error.message);
      throw error;
    }
  }

  /**
   * Verify contract on block explorer (requires API key)
   * @param {Object} params - Verification parameters
   * @returns {Promise} Verification result
   */
  async verifyContract(params) {
    const { network, contractAddress, constructorArgs = [], apiKey } = params;

    try {
      // This would typically use etherscan-verify or similar
      console.log(`🔍 Verifying contract ${contractAddress} on ${network}`);
      
      // For now, just log - real implementation would call explorer API
      console.log(`Note: Manual verification needed via block explorer`);

      return {
        success: true,
        message: 'Use Etherscan/PolygonScan to verify manually'
      };
    } catch (error) {
      console.error('Verification error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update database with contract deployment info
   */
  async updateCollectionWithContract(collectionId, deploymentResult) {
    try {
      const { success, collectionAddress, deploymentTx, deploymentBlock, network } = deploymentResult;

      if (!success) {
        throw new Error('Deployment failed');
      }

      const updateData = {
        chainContracts: {
          [network]: {
            contractAddress: collectionAddress,
            deploymentTx,
            deploymentBlock,
            status: 'deployed',
            deployedAt: new Date()
          }
        },
        contractDeploymentStatus: 'deployed',
        contractDeploymentTx: deploymentTx,
        contractDeploymentBlock: deploymentBlock,
        contractAddress: collectionAddress, // Store primary address
        isContractVerified: false
      };

      const collection = await collectionModel.findByIdAndUpdate(
        collectionId,
        updateData,
        { new: true }
      );

      console.log(`✅ Collection ${collectionId} updated with contract address ${collectionAddress}`);

      return collection;
    } catch (error) {
      console.error('❌ Failed to update collection:', error.message);
      throw error;
    }
  }

  /**
   * Update database with NFT minting info
   */
  async updateNFTWithTokenId(nftItemId, mintingResult) {
    try {
      const { success, tokenId, mintTx, mintBlock, network } = mintingResult;

      if (!success) {
        throw new Error('Minting failed');
      }

      const updateData = {
        tokenId,
        isMinted: true,
        mintedAt: new Date(),
        mintTxHash: mintTx,
        deploymentStatus: 'deployed',
        chainSpecificData: {
          [network]: {
            tokenId,
            deploymentTx: mintTx,
            deploymentBlock: mintBlock,
            status: 'deployed'
          }
        }
      };

      const nft = await nftModel.findOneAndUpdate(
        { itemId: nftItemId },
        updateData,
        { new: true }
      );

      console.log(`✅ NFT ${nftItemId} updated with token ID ${tokenId}`);

      return nft;
    } catch (error) {
      console.error('❌ Failed to update NFT:', error.message);
      throw error;
    }
  }
}

export default new NFTContractService();
