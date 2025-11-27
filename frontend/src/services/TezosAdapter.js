/**
 * Tezos Adapter - TaquitoClient
 * 
 * Provides a skeleton implementation for Tezos blockchain integration
 * using the Taquito library. Includes context branching for wallet management
 * and contract interaction patterns compatible with the existing EVM setup.
 * 
 * Installation:
 * npm install @taquito/taquito @taquito/local-forging
 */

import { TezosToolkit } from '@taquito/taquito';

/**
 * TaquitoClient - Tezos blockchain interaction wrapper
 * 
 * Mirrors the ethers.js API structure for consistency with EVM implementations
 */
export class TaquitoClient {
  constructor(rpcUrl = 'https://mainnet.api.tezos.com') {
    this.rpcUrl = rpcUrl;
    this.tezos = new TezosToolkit(rpcUrl);
    this.wallet = null;
    this.contract = null;
  }

  /**
   * Connect wallet - supports Temple Wallet (Kukai, KeepWallet)
   * @param {string} walletType - 'temple', 'kukai', or 'keepwallet'
   * @returns {Promise<string>} User's Tezos account (tz1...)
   */
  async connectWallet(walletType = 'temple') {
    try {
      let wallet;

      switch (walletType) {
        case 'temple':
          // Temple Wallet API
          wallet = window.templeWallet || window.thanosWallet;
          if (!wallet) {
            throw new Error('Temple Wallet not installed');
          }
          await wallet.connect();
          break;

        case 'kukai':
          // Kukai integration
          wallet = window.kekaiWallet;
          if (!wallet) {
            throw new Error('Kukai Wallet not installed');
          }
          break;

        case 'keepwallet':
          // Keep Wallet integration
          wallet = window.keepWallet;
          if (!wallet) {
            throw new Error('Keep Wallet not installed');
          }
          break;

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      // Set up Taquito with wallet
      await this.tezos.setWallet(wallet);
      this.wallet = wallet;

      // Get account
      const account = await this.tezos.wallet.pkh();
      console.log('Connected to Tezos:', account);
      return account;
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Get contract instance
   * @param {string} contractAddress - Tezos contract address (KT1...)
   * @returns {Promise<ContractAbstraction>}
   */
  async getContract(contractAddress) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      const contract = await this.tezos.wallet.at(contractAddress);
      this.contract = contract;
      return contract;
    } catch (error) {
      console.error('Contract fetch error:', error);
      throw error;
    }
  }

  /**
   * Call a contract entrypoint
   * @param {string} entrypoint - Contract method name
   * @param {any} param - Parameter to pass
   * @returns {Promise<TransactionWalletOperation>}
   */
  async callContractEntrypoint(entrypoint, param) {
    try {
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }

      const operation = await this.contract.methods[entrypoint](param).send();
      await operation.confirmation();
      console.log(`Entrypoint ${entrypoint} called successfully`);
      return operation;
    } catch (error) {
      console.error(`Error calling ${entrypoint}:`, error);
      throw error;
    }
  }

  /**
   * Read contract storage (state)
   * @returns {Promise<any>}
   */
  async readStorage() {
    try {
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }

      const storage = await this.contract.storage();
      return storage;
    } catch (error) {
      console.error('Storage read error:', error);
      throw error;
    }
  }

  /**
   * Get account balance in mutez (smallest unit of XTZ)
   * @param {string} accountAddress - Tezos account (tz1...)
   * @returns {Promise<number>} Balance in mutez
   */
  async getBalance(accountAddress) {
    try {
      const balance = await this.tezos.tz.getBalance(accountAddress);
      return balance.toNumber();
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error;
    }
  }

  /**
   * Convert mutez to XTZ
   * @param {number} mutez
   * @returns {number} XTZ amount
   */
  static mutezToXTZ(mutez) {
    return mutez / 1000000;
  }

  /**
   * Convert XTZ to mutez
   * @param {number} xtz
   * @returns {number} Mutez amount
   */
  static xtzToMutez(xtz) {
    return Math.floor(xtz * 1000000);
  }
}

/**
 * Tezos Context - manages state and wallet connection
 * Mirrors the structure of EVM context for consistency
 */
export class TezosContext {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.account = null;
    this.balance = null;
    this.network = 'mainnet';
    this.contractAddresses = {
      mainnet: {
        marketplace: 'KT1...',
        vendorNFT: 'KT1...',
      },
      testnet: {
        marketplace: 'KT1...',
        vendorNFT: 'KT1...',
      },
    };
  }

  /**
   * Initialize context with network
   * @param {string} network - 'mainnet' or 'testnet'
   */
  async initialize(network = 'mainnet') {
    const rpcUrls = {
      mainnet: 'https://mainnet.api.tezos.com',
      testnet: 'https://rpc.ghostnet.teztnets.xyz',
    };

    this.network = network;
    this.client = new TaquitoClient(rpcUrls[network]);
  }

  /**
   * Connect to wallet and update context
   * @param {string} walletType - wallet provider
   */
  async connectWallet(walletType = 'temple') {
    try {
      const account = await this.client.connectWallet(walletType);
      this.wallet = this.client.wallet;
      this.account = account;

      // Fetch balance
      const balanceMutez = await this.client.getBalance(account);
      this.balance = TaquitoClient.mutezToXTZ(balanceMutez);

      console.log(`Connected: ${account}, Balance: ${this.balance} XTZ`);
      return { account, balance: this.balance };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Get contract address for current network
   * @param {string} contractType - 'marketplace' or 'vendorNFT'
   */
  getContractAddress(contractType = 'marketplace') {
    const addresses = this.contractAddresses[this.network];
    return addresses ? addresses[contractType] : null;
  }

  /**
   * Branch context for specific contract operation
   * Returns isolated context for contract calls
   */
  branchContext(contractType = 'marketplace') {
    return {
      network: this.network,
      account: this.account,
      contractAddress: this.getContractAddress(contractType),
      client: this.client,
      balance: this.balance,
    };
  }
}

/**
 * Helper: Get minimum withdrawal amount
 * Useful for UI validation before calling withdraw function
 * 
 * Tezos storage ops cost ~200-500 mutez in fees
 * Recommended minimum for user-facing withdrawal: 1 XTZ
 */
export function getTezosMinWithdrawal() {
  return {
    mutez: 1000000, // 1 XTZ
    xtz: 1.0,
    networkFee: 0.0002, // estimate
    recommendedMinimum: 1.0002,
  };
}

/**
 * Helper: Validate Tezos address format
 */
export function isValidTezosAddress(address) {
  // Tezos addresses start with tz1, tz2, tz3 (implicit) or KT1 (contract)
  // Implicit: tz1 + 32 chars = 35 total
  // Contract: KT1 + 33 chars = 36 total
  // Accept tz1/tz2/tz3 with 32 chars after prefix, or KT1 with 33 chars
  return /^(?:tz[123][a-zA-Z0-9]{32}|KT1[a-zA-Z0-9]{33})$/.test(address);
}

/**
 * Example Context Hook Pattern (for use in React)
 * 
 * Usage:
 * const { connectWallet, withdraw, balance } = useTezosContext();
 */
export const createTezosContextHook = () => {
  const context = new TezosContext();

  return {
    initialize: (network) => context.initialize(network),
    connectWallet: (walletType) => context.connectWallet(walletType),
    
    getBalance: () => context.balance,
    getAccount: () => context.account,
    getNetwork: () => context.network,

    /**
     * Withdraw from marketplace contract
     * @param {number} amountXTZ - Amount to withdraw in XTZ
     */
    withdraw: async (amountXTZ) => {
      try {
        const contractAddr = context.getContractAddress('marketplace');
        const contract = await context.client.getContract(contractAddr);
        const amountMutez = TaquitoClient.xtzToMutez(amountXTZ);

        // Call withdraw entrypoint
        const operation = await context.client.callContractEntrypoint('withdraw', {
          amount: amountMutez,
        });

        return operation;
      } catch (error) {
        console.error('Withdrawal failed:', error);
        throw error;
      }
    },

    /**
     * Get minimum withdrawal amount
     */
    getMinWithdrawal: () => getTezosMinWithdrawal(),

    /**
     * Validate address before use
     */
    validateAddress: (address) => isValidTezosAddress(address),

    /**
     * Switch network and reinitialize
     */
    switchNetwork: async (network) => {
      await context.initialize(network);
      // Re-connect wallet if already connected
      if (context.account) {
        await context.connectWallet();
      }
    },
  };
};
