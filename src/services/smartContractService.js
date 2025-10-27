import { ethers } from 'ethers';
import { NFTMARKETPLACE_CONTRACT_ADDRESS, VENDORNFT_CONTRACT_ADDRESS, NFTMarketplace_ABI, VendorNFT_ABI } from '../Context/constants';

class SmartContractService {
  constructor() {
    this.providers = {
      ethereum: 'https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca',
      polygon: 'https://polygon-mumbai.g.alchemy.com/v2/demo',
      bsc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      arbitrum: 'https://arbitrum-goerli.infura.io/v3/demo',
      tezos: 'https://rpc.ghostnet.teztnets.xyz',
      hyperliquid: 'https://api.hyperliquid-testnet.xyz/evm'
    };
    this.contracts = {};
  }

  // Get provider for specific network
  getProvider(network = 'ethereum') {
    try {
      if (window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
      }
      return new ethers.providers.JsonRpcProvider(this.providers[network]);
    } catch (error) {
      console.error(`Error creating provider for ${network}:`, error);
      return null;
    }
  }

  // Get contract instance
  async getContract(network = 'ethereum', contractType = 'marketplace') {
    try {
      const provider = this.getProvider(network);
      if (!provider) return null;

      const contractKey = `${network}_${contractType}`;
      if (this.contracts[contractKey]) {
        return this.contracts[contractKey];
      }

      let address, abi;
      
      if (contractType === 'marketplace') {
        address = NFTMARKETPLACE_CONTRACT_ADDRESS;
        abi = NFTMarketplace_ABI;
      } else if (contractType === 'vendor') {
        address = VENDORNFT_CONTRACT_ADDRESS;
        abi = VendorNFT_ABI;
      }

      if (!address || address === "0x0000000000000000000000000000000000000000") {
        throw new Error(`Contract address not configured for ${contractType} on ${network}`);
      }

      const contract = new ethers.Contract(address, abi, provider);
      this.contracts[contractKey] = contract;
      
      return contract;
    } catch (error) {
      console.error(`Error getting contract for ${network} ${contractType}:`, error);
      return null;
    }
  }

  // Test contract functionality
  async testContractFunctionality(network = 'ethereum') {
    try {
      const marketplaceContract = await this.getContract(network, 'marketplace');
      const vendorContract = await this.getContract(network, 'vendor');
      
      if (!marketplaceContract || !vendorContract) {
        return {
          success: false,
          error: 'Contracts not available'
        };
      }

      const tests = [];

      // Test 1: Check contract addresses
      try {
        const marketplaceAddress = await marketplaceContract.address;
        const vendorAddress = await vendorContract.address;
        tests.push({
          name: 'Contract Addresses',
          status: 'pass',
          details: {
            marketplace: marketplaceAddress,
            vendor: vendorAddress
          }
        });
      } catch (error) {
        tests.push({
          name: 'Contract Addresses',
          status: 'fail',
          error: error.message
        });
      }

      // Test 2: Check marketplace owner
      try {
        const owner = await marketplaceContract.owner();
        tests.push({
          name: 'Marketplace Owner',
          status: 'pass',
          details: { owner }
        });
      } catch (error) {
        tests.push({
          name: 'Marketplace Owner',
          status: 'fail',
          error: error.message
        });
      }

      // Test 3: Check vendor NFT details
      try {
        const name = await vendorContract.name();
        const symbol = await vendorContract.symbol();
        tests.push({
          name: 'Vendor NFT Details',
          status: 'pass',
          details: { name, symbol }
        });
      } catch (error) {
        tests.push({
          name: 'Vendor NFT Details',
          status: 'fail',
          error: error.message
        });
      }

      // Test 4: Check marketplace fee
      try {
        const listingFee = await marketplaceContract.getListingFee();
        tests.push({
          name: 'Listing Fee',
          status: 'pass',
          details: { listingFee: listingFee.toString() }
        });
      } catch (error) {
        tests.push({
          name: 'Listing Fee',
          status: 'fail',
          error: error.message
        });
      }

      // Test 5: Check active listings count
      try {
        const activeListings = await marketplaceContract.getActiveListings();
        tests.push({
          name: 'Active Listings',
          status: 'pass',
          details: { count: activeListings.length }
        });
      } catch (error) {
        tests.push({
          name: 'Active Listings',
          status: 'fail',
          error: error.message
        });
      }

      const passedTests = tests.filter(test => test.status === 'pass').length;
      const totalTests = tests.length;

      return {
        success: passedTests === totalTests,
        network,
        passedTests,
        totalTests,
        tests,
        contractAddresses: {
          marketplace: NFTMARKETPLACE_CONTRACT_ADDRESS,
          vendor: VENDORNFT_CONTRACT_ADDRESS
        }
      };
    } catch (error) {
      console.error('Error testing contract functionality:', error);
      return {
        success: false,
        error: error.message,
        network
      };
    }
  }

  // Get contract health status
  async getContractHealth(network = 'ethereum') {
    try {
      const contract = await this.getContract(network, 'marketplace');
      if (!contract) {
        return {
          status: 'unhealthy',
          reason: 'Contract not available'
        };
      }

      // Check if contract is responsive
      const startTime = Date.now();
      await contract.owner();
      const responseTime = Date.now() - startTime;

      // Check network status
      const provider = this.getProvider(network);
      const blockNumber = await provider.getBlockNumber();
      const networkId = await provider.getNetwork();

      return {
        status: 'healthy',
        responseTime,
        blockNumber,
        networkId: networkId.chainId.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Enhanced NFT operations
  async mintNFT(network, to, tokenURI, options = {}) {
    try {
      const contract = await this.getContract(network, 'vendor');
      if (!contract) throw new Error('Contract not available');

      const signer = this.getProvider(network).getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.mint(to, tokenURI, options);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        receipt,
        tokenId: receipt.events[0].args.tokenId.toString()
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listNFT(network, tokenId, price, options = {}) {
    try {
      const contract = await this.getContract(network, 'marketplace');
      if (!contract) throw new Error('Contract not available');

      const signer = this.getProvider(network).getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.listItem(tokenId, price, options);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error listing NFT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async buyNFT(network, tokenId, options = {}) {
    try {
      const contract = await this.getContract(network, 'marketplace');
      if (!contract) throw new Error('Contract not available');

      const signer = this.getProvider(network).getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.buyItem(tokenId, options);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('Error buying NFT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all supported networks
  getSupportedNetworks() {
    return Object.keys(this.providers).map(network => ({
      id: network,
      name: this.getNetworkName(network),
      rpcUrl: this.providers[network],
      chainId: this.getChainId(network),
      nativeCurrency: this.getNativeCurrency(network),
      blockExplorer: this.getBlockExplorer(network)
    }));
  }

  getNetworkName(network) {
    const names = {
      ethereum: 'Ethereum',
      polygon: 'Polygon',
      bsc: 'BSC',
      arbitrum: 'Arbitrum',
      tezos: 'Tezos',
      hyperliquid: 'Hyperliquid'
    };
    return names[network] || network;
  }

  getChainId(network) {
    const chainIds = {
      ethereum: 1,
      polygon: 137,
      bsc: 56,
      arbitrum: 42161,
      tezos: 1729,
      hyperliquid: 421614
    };
    return chainIds[network] || 1;
  }

  getNativeCurrency(network) {
    const currencies = {
      ethereum: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      polygon: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
      bsc: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      arbitrum: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      tezos: { name: 'Tezos', symbol: 'XTZ', decimals: 6 },
      hyperliquid: { name: 'Hyperliquid', symbol: 'HL', decimals: 18 }
    };
    return currencies[network] || currencies.ethereum;
  }

  getBlockExplorer(network) {
    const explorers = {
      ethereum: 'https://etherscan.io',
      polygon: 'https://polygonscan.com',
      bsc: 'https://bscscan.com',
      arbitrum: 'https://arbiscan.io',
      tezos: 'https://tzkt.io',
      hyperliquid: 'https://explorer.hyperliquid.xyz'
    };
    return explorers[network] || explorers.ethereum;
  }
}

// Create singleton instance
const smartContractService = new SmartContractService();

export default smartContractService;
