import { ethers } from 'ethers';
import { gasFeeAPI } from './gasFeeAPI';

class GasService {
  constructor() {
    this.providers = {
      ethereum: 'https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca',
      polygon: 'https://polygon-mumbai.g.alchemy.com/v2/demo',
      bsc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      arbitrum: 'https://arbitrum-goerli.infura.io/v3/demo'
    };
  }

  // Get current gas price for a network with gas fee regulations applied
  async getGasPrice(network = 'ethereum', applyRegulations = true) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.providers[network]);
      const currentGasPrice = await provider.getGasPrice();
      
      // Apply gas fee regulations if enabled
      if (applyRegulations) {
        try {
          const regulatedPrice = await gasFeeAPI.calculateRegulatedGasPrice(
            network,
            currentGasPrice.toString()
          );
          
          if (regulatedPrice.success && regulatedPrice.regulatedGasPrice) {
            return {
              success: true,
              gasPrice: regulatedPrice.regulatedGasPrice,
              gasPriceGwei: ethers.utils.formatUnits(regulatedPrice.regulatedGasPrice, 'gwei'),
              originalGasPrice: currentGasPrice.toString(),
              originalGasPriceGwei: ethers.utils.formatUnits(currentGasPrice, 'gwei'),
              regulated: true
            };
          }
        } catch (regError) {
          console.warn('Gas fee regulation not available, using current gas price:', regError);
          // Fall through to return current gas price
        }
      }
      
      return {
        success: true,
        gasPrice: currentGasPrice.toString(),
        gasPriceGwei: ethers.utils.formatUnits(currentGasPrice, 'gwei'),
        regulated: false
      };
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction options with gas fee regulations applied
  async getTransactionOptions(network, baseOptions = {}) {
    try {
      const networkName = network.toLowerCase();
      let txOptions = { ...baseOptions };

      // Try to get gas fee regulations for this network
      try {
        const regulation = await gasFeeAPI.getGasFeeRegulation(networkName);
        
        if (regulation && regulation.isActive && regulation.regulations?.enabled) {
          // Get current gas price
          const gasPriceResult = await this.getGasPrice(networkName, true);
          
          if (gasPriceResult.success) {
            const regulatedGasPrice = ethers.BigNumber.from(gasPriceResult.gasPrice);
            
            // Apply gas limit from regulations if specified
            if (regulation.gasLimit && !txOptions.gasLimit) {
              txOptions.gasLimit = regulation.gasLimit;
            }
            
            // Apply regulated gas price
            txOptions.gasPrice = regulatedGasPrice;
            
            console.log(`Applied gas fee regulation for ${networkName}:`, {
              gasPrice: ethers.utils.formatUnits(regulatedGasPrice, 'gwei') + ' gwei',
              gasLimit: txOptions.gasLimit
            });
          }
        }
      } catch (regError) {
        console.warn(`Gas fee regulations not available for ${networkName}, using default:`, regError);
        // Continue with base options
      }

      return txOptions;
    } catch (error) {
      console.error('Error getting transaction options:', error);
      return baseOptions;
    }
  }

  // Estimate gas for NFT minting transaction
  async estimateMintGas(network, contractAddress, to, tokenURI) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(this.providers[network]);
      
      // This would be your actual contract ABI
      const contractABI = [
        "function mint(address to, string memory tokenURI) public returns (uint256)"
      ];
      
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      
      // Estimate gas for minting
      const gasEstimate = await contract.estimateGas.mint(to, tokenURI);
      
      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
        gasEstimateHex: gasEstimate.toHexString()
      };
    } catch (error) {
      console.error('Error estimating mint gas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculate total transaction cost
  async calculateTransactionCost(network, gasEstimate, gasPrice) {
    try {
      const gasLimit = ethers.BigNumber.from(gasEstimate);
      const gasPriceBN = ethers.BigNumber.from(gasPrice);
      
      // Add 20% buffer to gas estimate
      const gasLimitWithBuffer = gasLimit.mul(120).intDiv(100);
      
      const totalCost = gasLimitWithBuffer.mul(gasPriceBN);
      
      return {
        success: true,
        gasLimit: gasLimitWithBuffer.toString(),
        gasPrice: gasPriceBN.toString(),
        totalCost: totalCost.toString(),
        totalCostEth: ethers.utils.formatEther(totalCost),
        gasPriceGwei: ethers.utils.formatUnits(gasPriceBN, 'gwei')
      };
    } catch (error) {
      console.error('Error calculating transaction cost:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get comprehensive gas information for minting
  async getMintGasInfo(network, contractAddress, to, tokenURI) {
    try {
      // Get current gas price
      const gasPriceResult = await this.getGasPrice(network);
      if (!gasPriceResult.success) {
        throw new Error(gasPriceResult.error);
      }

      // Estimate gas for minting
      const gasEstimateResult = await this.estimateMintGas(network, contractAddress, to, tokenURI);
      if (!gasEstimateResult.success) {
        throw new Error(gasEstimateResult.error);
      }

      // Calculate total cost
      const costResult = await this.calculateTransactionCost(
        network,
        gasEstimateResult.gasEstimate,
        gasPriceResult.gasPrice
      );

      if (!costResult.success) {
        throw new Error(costResult.error);
      }

      return {
        success: true,
        network,
        gasPrice: gasPriceResult.gasPrice,
        gasPriceGwei: gasPriceResult.gasPriceGwei,
        gasEstimate: gasEstimateResult.gasEstimate,
        gasLimit: costResult.gasLimit,
        totalCost: costResult.totalCost,
        totalCostEth: costResult.totalCostEth,
        estimatedTime: this.getEstimatedConfirmationTime(network)
      };
    } catch (error) {
      console.error('Error getting mint gas info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get estimated confirmation time based on network
  getEstimatedConfirmationTime(network) {
    const times = {
      ethereum: '2-5 minutes',
      polygon: '30 seconds - 2 minutes',
      bsc: '30 seconds - 2 minutes',
      arbitrum: '1-3 minutes'
    };
    return times[network] || '2-5 minutes';
  }

  // Format gas price for display
  formatGasPrice(gasPrice) {
    try {
      const gasPriceBN = ethers.BigNumber.from(gasPrice);
      return {
        wei: gasPriceBN.toString(),
        gwei: ethers.utils.formatUnits(gasPriceBN, 'gwei'),
        eth: ethers.utils.formatEther(gasPriceBN)
      };
    } catch (error) {
      return {
        wei: '0',
        gwei: '0',
        eth: '0'
      };
    }
  }

  // Get network-specific gas recommendations
  getGasRecommendations(network) {
    const recommendations = {
      ethereum: {
        slow: '20',
        standard: '25',
        fast: '30',
        instant: '40'
      },
      polygon: {
        slow: '1',
        standard: '2',
        fast: '5',
        instant: '10'
      },
      bsc: {
        slow: '5',
        standard: '10',
        fast: '15',
        instant: '20'
      },
      arbitrum: {
        slow: '0.1',
        standard: '0.2',
        fast: '0.5',
        instant: '1'
      }
    };
    return recommendations[network] || recommendations.ethereum;
  }
}

// Create singleton instance
const gasService = new GasService();

export default gasService;

