// Mobile Wallet Integration Service using WalletConnect
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

/**
 * WalletConnect Service for Mobile
 */
class MobileWalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
  }

  /**
   * Initialize WalletConnect
   * @param {string} projectId - WalletConnect project ID
   */
  async initialize(projectId) {
    try {
      // Initialize WalletConnect v2
      this.projectId = projectId;
      console.log('WalletConnect initialized with project:', projectId);
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  /**
   * Connect to wallet using WalletConnect
   * @returns {Promise<Object>} Connected wallet info
   */
  async connectWallet() {
    try {
      // Show wallet list and connect
      const wcModal = new WalletConnectModal({
        projectId: this.projectId,
        chains: [1, 137, 42161], // Ethereum, Polygon, Arbitrum
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData_v4',
        ],
        events: ['chainChanged', 'accountsChanged'],
      });

      const provider = await wcModal.connect();

      if (!provider) {
        throw new Error('Failed to connect wallet');
      }

      // Create ethers provider
      this.provider = new ethers.providers.Web3Provider(provider);
      this.signer = this.provider.getSigner();

      // Get connected account and chain
      const accounts = await provider.request({ method: 'eth_accounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });

      this.address = accounts[0];
      this.chainId = parseInt(chainId, 16);
      this.isConnected = true;

      // Save connection info
      await this._saveConnectionInfo();

      return {
        address: this.address,
        chainId: this.chainId,
        provider: this.provider,
        signer: this.signer,
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    try {
      if (this.provider) {
        // Disconnect WalletConnect session
        await this.provider.disconnect?.();
      }

      this.provider = null;
      this.signer = null;
      this.address = null;
      this.chainId = null;
      this.isConnected = false;

      // Clear stored connection
      await AsyncStorage.removeItem('walletConnectSession');
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  }

  /**
   * Restore previous wallet connection
   * @returns {Promise<Object>} Restored wallet info or null
   */
  async restoreConnection() {
    try {
      const sessionData = await AsyncStorage.getItem('walletConnectSession');
      
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      
      // Reconnect to previous session
      // Note: Full implementation depends on WalletConnect SDK version
      this.address = session.address;
      this.chainId = session.chainId;
      this.isConnected = true;

      // Create provider from restored session
      // This requires proper session restoration from WalletConnect
      
      return {
        address: this.address,
        chainId: this.chainId,
      };
    } catch (error) {
      console.error('Failed to restore wallet connection:', error);
      return null;
    }
  }

  /**
   * Switch blockchain chain
   * @param {number} chainId - Target chain ID
   */
  async switchChain(chainId) {
    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: '0x' + chainId.toString(16) },
      ]);
      this.chainId = chainId;
    } catch (error) {
      // Chain not added, try to add it
      if (error.code === 4902) {
        await this.addChain(chainId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add new blockchain network
   * @param {number} chainId - Chain ID to add
   */
  async addChain(chainId) {
    const chainConfig = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum',
        rpcUrls: ['https://eth-mainnet.g.alchemy.com/v2/'],
        blockExplorerUrls: ['https://etherscan.io'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon',
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      },
      42161: {
        chainId: '0xa4b1',
        chainName: 'Arbitrum',
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      },
    };

    const config = chainConfig[chainId];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    try {
      await this.provider.send('wallet_addEthereumChain', [config]);
      this.chainId = chainId;
    } catch (error) {
      console.error('Failed to add chain:', error);
      throw error;
    }
  }

  /**
   * Send transaction
   * @param {Object} txData - Transaction data
   * @returns {Promise<string>} Transaction hash
   */
  async sendTransaction(txData) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const tx = await this.signer.sendTransaction(txData);
      return tx.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Sign message
   * @param {string} message - Message to sign
   * @returns {Promise<string>} Signature
   */
  async signMessage(message) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  /**
   * Sign typed data (EIP-712)
   * @param {Object} domain - Domain data
   * @param {Object} types - Type definitions
   * @param {Object} value - Message value
   * @returns {Promise<string>} Signature
   */
  async signTypedData(domain, types, value) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      // Remove EIP712Domain from types if present
      const typesWithoutDomain = { ...types };
      delete typesWithoutDomain.EIP712Domain;

      const signature = await this.signer._signTypedData(
        domain,
        typesWithoutDomain,
        value
      );
      return signature;
    } catch (error) {
      console.error('Typed data signing failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   * @returns {Promise<string>} Balance in wei
   */
  async getBalance() {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const balance = await this.provider.getBalance(this.address);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get token balance
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<string>} Token balance
   */
  async getTokenBalance(tokenAddress) {
    try {
      const ERC20_ABI = [
        'function balanceOf(address owner) public view returns (uint256)',
        'function decimals() public view returns (uint8)',
      ];

      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const [balance, decimals] = await Promise.all([
        contract.balanceOf(this.address),
        contract.decimals(),
      ]);

      return {
        balance: balance.toString(),
        decimals,
        formatted: ethers.utils.formatUnits(balance, decimals),
      };
    } catch (error) {
      console.error('Failed to get token balance:', error);
      throw error;
    }
  }

  /**
   * Get connected wallet info
   * @returns {Object} Wallet information
   */
  getWalletInfo() {
    return {
      address: this.address,
      chainId: this.chainId,
      isConnected: this.isConnected,
      provider: this.provider,
      signer: this.signer,
    };
  }

  /**
   * Watch for account changes
   * @param {Function} callback - Callback when account changes
   */
  watchAccountChanges(callback) {
    if (this.provider) {
      this.provider.on('accountsChanged', (accounts) => {
        this.address = accounts[0];
        callback(accounts[0]);
      });
    }
  }

  /**
   * Watch for chain changes
   * @param {Function} callback - Callback when chain changes
   */
  watchChainChanges(callback) {
    if (this.provider) {
      this.provider.on('chainChanged', (chainId) => {
        this.chainId = parseInt(chainId, 16);
        callback(this.chainId);
      });
    }
  }

  /**
   * Save connection information locally
   * @private
   */
  async _saveConnectionInfo() {
    try {
      const sessionData = JSON.stringify({
        address: this.address,
        chainId: this.chainId,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem('walletConnectSession', sessionData);
    } catch (error) {
      console.error('Failed to save connection info:', error);
    }
  }

  /**
   * Validate wallet address format
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  static isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  /**
   * Format wallet address (short)
   * @param {string} address - Address to format
   * @returns {string} Formatted address
   */
  static formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Convert wei to formatted value
   * @param {string} wei - Amount in wei
   * @param {number} decimals - Token decimals
   * @returns {string} Formatted value
   */
  static formatValue(wei, decimals = 18) {
    return ethers.utils.formatUnits(wei, decimals);
  }

  /**
   * Convert value to wei
   * @param {string} value - Value to convert
   * @param {number} decimals - Token decimals
   * @returns {string} Amount in wei
   */
  static parseValue(value, decimals = 18) {
    return ethers.utils.parseUnits(value, decimals);
  }
}

export default MobileWalletService;
