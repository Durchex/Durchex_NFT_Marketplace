// Bridge Service for Cross-Chain Operations
import * as ethers from 'ethers';

// Use ethers.JsonRpcProvider for v6+

class BridgeService {
  constructor() {
    this.bridgeContracts = new Map();
    this.chainProviders = new Map();
    this.chainGateways = new Map();
    this.initializeChains();
  }

  /**
   * Initialize blockchain providers and gateways for all chains
   */
  initializeChains() {
    // Ethereum
    this.chainProviders.set('ethereum', new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'
    ));
    this.chainGateways.set('ethereum', {
      chainId: 101,
      lzEndpoint: process.env.ETHEREUM_LZ_ENDPOINT,
      nativeCurrency: 'ETH'
    });

    // Polygon
    this.chainProviders.set('polygon', new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo'
    ));
    this.chainGateways.set('polygon', {
      chainId: 109,
      lzEndpoint: process.env.POLYGON_LZ_ENDPOINT,
      nativeCurrency: 'MATIC'
    });

    // Arbitrum
    this.chainProviders.set('arbitrum', new ethers.JsonRpcProvider(
      process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/demo'
    ));
    this.chainGateways.set('arbitrum', {
      chainId: 110,
      lzEndpoint: process.env.ARBITRUM_LZ_ENDPOINT,
      nativeCurrency: 'ETH'
    });
  }

  /**
   * Get provider for specific chain
   * @param {string} chain - Chain name (ethereum, polygon, arbitrum)
   * @returns {ethers.providers.Provider}
   */
  getProvider(chain) {
    const provider = this.chainProviders.get(chain.toLowerCase());
    if (!provider) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    return provider;
  }

  /**
   * Get bridge contract instance for a chain
   * @param {string} chain - Chain name
   * @param {string} bridgeAddress - Bridge contract address
   * @returns {ethers.Contract}
   */
  getBridgeContract(chain, bridgeAddress) {
    const key = `${chain}-${bridgeAddress}`;
    
    if (!this.bridgeContracts.has(key)) {
      const provider = this.getProvider(chain);
      const ABI = [
        'function bridgeERC721(address nftAddress, uint256 tokenId, uint16 destinationChain, address recipient) payable returns (bytes32)',
        'function bridgeERC1155(address nftAddress, uint256 tokenId, uint256 amount, uint16 destinationChain, address recipient) payable returns (bytes32)',
        'function getTransferDetails(bytes32 transferId) view returns (tuple(address initiator, address tokenAddress, uint8 tokenType, uint256 tokenId, uint256 amount, uint16 sourceChain, uint16 destinationChain, address destinationAddress, uint8 status, uint256 timestamp, bytes32 transactionHash))',
        'function getUserTransfers(address user) view returns (bytes32[])',
        'function getBridgeStats() view returns (uint256, uint256, uint256, bool)'
      ];
      
      const contract = new ethers.Contract(bridgeAddress, ABI, provider);
      this.bridgeContracts.set(key, contract);
    }
    
    return this.bridgeContracts.get(key);
  }

  /**
   * Initiate NFT bridge transfer
   * @param {Object} params - Transfer parameters
   * @returns {Promise<Object>} Transfer result with transaction hash
   */
  async initiateBridge(params) {
    const {
      userAddress,
      sourceChain,
      destinationChain,
      nftAddress,
      tokenId,
      amount,
      tokenType, // 'ERC721' or 'ERC1155'
      bridgeAddress,
      recipientAddress,
      estimatedGasPrice
    } = params;

    try {
      // Get signer
      const signer = await this.getSigner(sourceChain, userAddress);
      const bridgeContract = this.getBridgeContract(sourceChain, bridgeAddress);
      const contractWithSigner = bridgeContract.connect(signer);

      // Calculate fees and gas
      const bridgeStats = await this.getBridgeStats(sourceChain, bridgeAddress);
      const platformFee = ethers.utils.parseEther('0.01'); // Base fee in ETH
      
      let tx;
      if (tokenType === 'ERC721') {
        tx = await contractWithSigner.bridgeERC721(
          nftAddress,
          tokenId,
          this.getChainId(destinationChain),
          recipientAddress || userAddress,
          { value: platformFee }
        );
      } else if (tokenType === 'ERC1155') {
        tx = await contractWithSigner.bridgeERC1155(
          nftAddress,
          tokenId,
          amount || 1,
          this.getChainId(destinationChain),
          recipientAddress || userAddress,
          { value: platformFee }
        );
      } else {
        throw new Error(`Unsupported token type: ${tokenType}`);
      }

      // Wait for confirmation
      const receipt = await tx.wait(1);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'initiated',
        estimatedDeliveryTime: '5-15 minutes'
      };
    } catch (error) {
      throw new Error(`Bridge initiation failed: ${error.message}`);
    }
  }

  /**
   * Check transfer status
   * @param {string} sourceChain - Source chain
   * @param {string} bridgeAddress - Bridge address
   * @param {string} transferId - Transfer ID
   * @returns {Promise<Object>} Transfer status
   */
  async getTransferStatus(sourceChain, bridgeAddress, transferId) {
    try {
      const bridgeContract = this.getBridgeContract(sourceChain, bridgeAddress);
      const transfer = await bridgeContract.getTransferDetails(transferId);

      const statusMap = {
        0: 'Pending',
        1: 'Completed',
        2: 'Failed',
        3: 'Cancelled'
      };

      return {
        id: transferId,
        initiator: transfer.initiator,
        tokenAddress: transfer.tokenAddress,
        tokenType: transfer.tokenType === 0 ? 'ERC721' : 'ERC1155',
        amount: transfer.amount.toString(),
        sourceChain: this.getChainName(transfer.sourceChain),
        destinationChain: this.getChainName(transfer.destinationChain),
        recipient: transfer.destinationAddress,
        status: statusMap[transfer.status],
        timestamp: new Date(transfer.timestamp * 1000),
        transactionHash: transfer.transactionHash
      };
    } catch (error) {
      throw new Error(`Failed to get transfer status: ${error.message}`);
    }
  }

  /**
   * Get user's transfer history
   * @param {string} chain - Chain name
   * @param {string} bridgeAddress - Bridge address
   * @param {string} userAddress - User address
   * @returns {Promise<Array>} Array of transfers
   */
  async getUserTransferHistory(chain, bridgeAddress, userAddress) {
    try {
      const bridgeContract = this.getBridgeContract(chain, bridgeAddress);
      const transferIds = await bridgeContract.getUserTransfers(userAddress);

      const transfers = [];
      for (const transferId of transferIds) {
        const transfer = await this.getTransferStatus(chain, bridgeAddress, transferId);
        transfers.push(transfer);
      }

      return transfers;
    } catch (error) {
      throw new Error(`Failed to get transfer history: ${error.message}`);
    }
  }

  /**
   * Get bridge statistics
   * @param {string} chain - Chain name
   * @param {string} bridgeAddress - Bridge address
   * @returns {Promise<Object>} Bridge statistics
   */
  async getBridgeStats(chain, bridgeAddress) {
    try {
      const bridgeContract = this.getBridgeContract(chain, bridgeAddress);
      const [totalTransfers, totalVolume, platformFee, isPaused] = await bridgeContract.getBridgeStats();

      return {
        totalTransfers: totalTransfers.toString(),
        totalVolume: totalVolume.toString(),
        platformFee: platformFee.toString(),
        isPaused,
        supportedChains: ['ethereum', 'polygon', 'arbitrum']
      };
    } catch (error) {
      throw new Error(`Failed to get bridge stats: ${error.message}`);
    }
  }

  /**
   * Estimate bridge transfer cost
   * @param {Object} params - Estimation parameters
   * @returns {Promise<Object>} Cost estimation
   */
  async estimateTransferCost(params) {
    const {
      sourceChain,
      destinationChain,
      tokenType,
      quantity
    } = params;

    try {
      // Base costs in USD
      const baseCosts = {
        'ethereum-to-polygon': 8.50,
        'ethereum-to-arbitrum': 7.20,
        'polygon-to-ethereum': 12.30,
        'polygon-to-arbitrum': 6.80,
        'arbitrum-to-ethereum': 10.50,
        'arbitrum-to-polygon': 9.30
      };

      const route = `${sourceChain}-to-${destinationChain}`;
      const baseCost = baseCosts[route] || 10.00;
      const platformFee = baseCost * 0.05; // 5% platform fee
      const totalCost = baseCost + platformFee;

      return {
        routeEstimate: baseCost,
        platformFee: platformFee.toFixed(2),
        totalEstimate: totalCost.toFixed(2),
        currency: 'USD',
        estimatedTime: '5-15 minutes',
        sourceChain,
        destinationChain,
        tokenType,
        quantity
      };
    } catch (error) {
      throw new Error(`Cost estimation failed: ${error.message}`);
    }
  }

  /**
   * Get supported chains information
   * @returns {Array} Array of supported chains
   */
  getSupportedChains() {
    return [
      {
        name: 'ethereum',
        chainId: 101,
        nativeCurrency: 'ETH',
        explorer: 'https://etherscan.io',
        icon: '🔷'
      },
      {
        name: 'polygon',
        chainId: 109,
        nativeCurrency: 'MATIC',
        explorer: 'https://polygonscan.com',
        icon: '🟣'
      },
      {
        name: 'arbitrum',
        chainId: 110,
        nativeCurrency: 'ETH',
        explorer: 'https://arbiscan.io',
        icon: '🔵'
      }
    ];
  }

  /**
   * Convert chain name to LayerZero chain ID
   * @param {string} chain - Chain name
   * @returns {number} Chain ID
   */
  getChainId(chain) {
    const chainMap = {
      'ethereum': 101,
      'polygon': 109,
      'arbitrum': 110
    };
    return chainMap[chain.toLowerCase()];
  }

  /**
   * Convert LayerZero chain ID to chain name
   * @param {number} chainId - Chain ID
   * @returns {string} Chain name
   */
  getChainName(chainId) {
    const nameMap = {
      101: 'ethereum',
      109: 'polygon',
      110: 'arbitrum'
    };
    return nameMap[chainId] || 'unknown';
  }

  /**
   * Get signer for user (stub - would integrate with wallet service)
   * @private
   */
  async getSigner(chain, userAddress) {
    // In production, this would retrieve the signer from a secure wallet
    // For now, return a placeholder
    const provider = this.getProvider(chain);
    return provider.getSigner(userAddress);
  }

  /**
   * Validate bridge parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result
   */
  validateBridgeParams(params) {
    const errors = [];

    if (!params.sourceChain || !this.getChainId(params.sourceChain)) {
      errors.push('Invalid source chain');
    }
    if (!params.destinationChain || !this.getChainId(params.destinationChain)) {
      errors.push('Invalid destination chain');
    }
    if (params.sourceChain === params.destinationChain) {
      errors.push('Source and destination chains cannot be the same');
    }
    if (!ethers.utils.isAddress(params.nftAddress)) {
      errors.push('Invalid NFT address');
    }
    if (!ethers.utils.isAddress(params.recipientAddress)) {
      errors.push('Invalid recipient address');
    }
    if (params.tokenType !== 'ERC721' && params.tokenType !== 'ERC1155') {
      errors.push('Invalid token type');
    }
    if (params.amount && params.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default BridgeService;
