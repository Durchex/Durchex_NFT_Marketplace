#!/usr/bin/env node

/**
 * Estimate Gas Costs for Contract Deployment
 * Shows how much ETH is needed to deploy on each network
 */

const ethers = require('ethers');
require('dotenv').config();

// Network configurations
const networks = {
  polygon: {
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    name: 'Polygon',
    symbol: 'MATIC'
  },
  ethereum: {
    rpc: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    name: 'Ethereum',
    symbol: 'ETH'
  },
  bsc: {
    rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    name: 'BSC',
    symbol: 'BNB'
  },
  arbitrum: {
    rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    name: 'Arbitrum',
    symbol: 'ETH'
  },
  base: {
    rpc: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    name: 'Base',
    symbol: 'ETH'
  }
};

// Estimated gas usage for contracts (from testing)
const gasEstimates = {
  VendorNFT: 2500000,      // ~2.5M gas
  NFTMarketplace: 3500000   // ~3.5M gas
};

async function estimateCosts() {
  console.log('📊 Gas Cost Estimation for Contract Deployment\n');
  console.log('═'.repeat(80));

  const results = [];

  for (const [networkKey, networkConfig] of Object.entries(networks)) {
    try {
      console.log(`\n🔍 Checking ${networkConfig.name}...`);
      
      const provider = new ethers.providers.JsonRpcProvider(networkConfig.rpc);
      
      // Get gas price
      const gasPrice = await provider.getGasPrice();
      const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
      
      // Calculate costs
      const vendorNFTGas = gasEstimates.VendorNFT;
      const marketplaceGas = gasEstimates.NFTMarketplace;
      const totalGas = vendorNFTGas + marketplaceGas;
      
      const vendorNFTCost = gasPrice.mul(vendorNFTGas).div(ethers.constants.WeiPerEther);
      const marketplaceCost = gasPrice.mul(marketplaceGas).div(ethers.constants.WeiPerEther);
      const totalCost = gasPrice.mul(totalGas).div(ethers.constants.WeiPerEther);
      
      const vendorNFTCostEth = ethers.utils.formatEther(vendorNFTCost);
      const marketplaceCostEth = ethers.utils.formatEther(marketplaceCost);
      const totalCostEth = ethers.utils.formatEther(totalCost);
      
      results.push({
        network: networkKey,
        name: networkConfig.name,
        symbol: networkConfig.symbol,
        gasPrice: gasPriceGwei,
        vendorNFTGas,
        marketplaceGas,
        totalGas,
        vendorNFTCost: vendorNFTCostEth,
        marketplaceCost: marketplaceCostEth,
        totalCost: totalCostEth
      });
      
      console.log(`  ✅ Gas Price: ${gasPriceGwei} gwei`);
      console.log(`  📄 VendorNFT: ~${gasEstimates.VendorNFT.toLocaleString()} gas`);
      console.log(`  💼 Marketplace: ~${gasEstimates.NFTMarketplace.toLocaleString()} gas`);
      console.log(`  💰 Estimated Total: ${totalCostEth} ${networkConfig.symbol}`);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.push({
        network: networkKey,
        name: networkConfig.name,
        error: error.message
      });
    }
  }

  // Summary table
  console.log('\n' + '═'.repeat(80));
  console.log('\n📋 DEPLOYMENT COST SUMMARY\n');
  console.log('Network'.padEnd(15) + 'Gas Price'.padEnd(15) + 'Total ETH Needed'.padEnd(20));
  console.log('─'.repeat(50));
  
  let totalEthNeeded = 0;
  
  for (const result of results) {
    if (!result.error) {
      const networkName = result.name.padEnd(15);
      const gasPrice = `${result.gasPrice} gwei`.padEnd(15);
      const totalCost = `${parseFloat(result.totalCost).toFixed(4)} ${result.symbol}`.padEnd(20);
      
      console.log(networkName + gasPrice + totalCost);
      
      // Track ETH networks
      if (['Ethereum', 'Arbitrum', 'Base'].includes(result.name)) {
        totalEthNeeded += parseFloat(result.totalCost);
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  for (const result of results) {
    if (!result.error) {
      const cost = parseFloat(result.totalCost);
      const recommendedAmount = (cost * 1.5).toFixed(4); // 50% buffer
      
      console.log(`${result.name}:`);
      console.log(`  Minimum: ${cost.toFixed(4)} ${result.symbol}`);
      console.log(`  Recommended: ${recommendedAmount} ${result.symbol} (includes 50% buffer)`);
      console.log();
    }
  }

  console.log('─'.repeat(80));
  console.log('\n⚠️  IMPORTANT NOTES:\n');
  console.log('1. Gas prices fluctuate - these are estimates based on current network conditions');
  console.log('2. Add a 50% buffer to ensure successful deployment');
  console.log('3. For Polygon: costs are in MATIC (need to convert if using ETH)');
  console.log('4. Deployment accounts must be funded on each respective network');
  console.log('5. Failed deployments will still consume gas\n');
}

estimateCosts().catch(console.error);
