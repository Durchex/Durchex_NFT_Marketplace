#!/usr/bin/env node

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Network configurations with native token info
const NETWORKS = [
  {
    name: "ethereum",
    displayName: "Ethereum",
    rpc: process.env.ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth",
    chainId: 1,
    nativeToken: "ETH",
    usdPrice: 3500, // Approximate ETH price
    gasPriceMultiplier: 1.0
  },
  {
    name: "polygon",
    displayName: "Polygon",
    rpc: process.env.POLYGON_RPC_URL || "https://rpc.ankr.com/polygon",
    chainId: 137,
    nativeToken: "MATIC",
    usdPrice: 0.8,
    gasPriceMultiplier: 1.0
  },
  {
    name: "bsc",
    displayName: "BSC",
    rpc: process.env.BSC_RPC_URL || "https://rpc.ankr.com/bsc",
    chainId: 56,
    nativeToken: "BNB",
    usdPrice: 320,
    gasPriceMultiplier: 1.0
  },
  {
    name: "arbitrum",
    displayName: "Arbitrum",
    rpc: process.env.ARBITRUM_RPC_URL || "https://rpc.ankr.com/arbitrum",
    chainId: 42161,
    nativeToken: "ETH",
    usdPrice: 3500,
    gasPriceMultiplier: 0.1 // L2 networks have lower gas costs
  },
  {
    name: "base",
    displayName: "Base",
    rpc: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    chainId: 8453,
    nativeToken: "ETH",
    usdPrice: 3500,
    gasPriceMultiplier: 0.1
  },
  {
    name: "optimism",
    displayName: "Optimism",
    rpc: process.env.OPTIMISM_RPC_URL || "https://rpc.ankr.com/optimism",
    chainId: 10,
    nativeToken: "ETH",
    usdPrice: 3500,
    gasPriceMultiplier: 0.1
  },
  {
    name: "avalanche",
    displayName: "Avalanche",
    rpc: process.env.AVALANCHE_RPC_URL || "https://rpc.ankr.com/avalanche",
    chainId: 43114,
    nativeToken: "AVAX",
    usdPrice: 35,
    gasPriceMultiplier: 1.0
  },
  {
    name: "hyperliquid",
    displayName: "HyperLiquid",
    rpc: process.env.HYPERLIQUID_RPC_URL || "https://rpc.hyperliquid.xyz/evm",
    chainId: 999,
    nativeToken: "ETH",
    usdPrice: 3500,
    gasPriceMultiplier: 1.0
  }
];

// Contract deployment gas estimates (from previous analysis)
const CONTRACT_GAS = {
  VendorNFT: 49000,
  NFTMarketplace: 62000,
  total: 111000
};

async function getGasPrice(provider, network) {
  try {
    const gasPrice = await provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
    const adjustedGasPrice = gasPrice.mul(Math.floor(network.gasPriceMultiplier * 100)).div(100);
    return {
      original: gasPrice,
      adjusted: adjustedGasPrice,
      gwei: parseFloat(gasPriceGwei) * network.gasPriceMultiplier
    };
  } catch (error) {
    console.log(`❌ Error getting gas price for ${network.name}: ${error.message}`);
    // Fallback gas prices
    const fallbackGwei = network.name === "ethereum" ? 20 :
                        network.name === "polygon" ? 50 :
                        network.name === "bsc" ? 10 :
                        network.name === "arbitrum" ? 2 :
                        network.name === "base" ? 2 :
                        network.name === "optimism" ? 2 :
                        network.name === "avalanche" ? 30 : 20;

    return {
      original: ethers.utils.parseUnits(fallbackGwei.toString(), "gwei"),
      adjusted: ethers.utils.parseUnits((fallbackGwei * network.gasPriceMultiplier).toString(), "gwei"),
      gwei: fallbackGwei * network.gasPriceMultiplier,
      fallback: true
    };
  }
}

function calculateDeploymentCost(gasUsed, gasPrice, nativeTokenPrice) {
  const gasCost = gasUsed * parseFloat(ethers.utils.formatEther(gasPrice));
  const usdCost = gasCost * nativeTokenPrice;
  return { gasCost, usdCost };
}

async function analyzeNetwork(network) {
  console.log(`\n🔍 Analyzing ${network.displayName} (${network.name})`);
  console.log(`   RPC: ${network.rpc}`);
  console.log(`   Native Token: ${network.nativeToken} ($${network.usdPrice})`);

  try {
    const provider = new ethers.providers.JsonRpcProvider(network.rpc);

    // Get gas price
    const gasInfo = await getGasPrice(provider, network);
    console.log(`   Gas Price: ${gasInfo.gwei.toFixed(2)} gwei${gasInfo.fallback ? ' (fallback)' : ''}`);

    // Calculate costs
    const vendorCost = calculateDeploymentCost(CONTRACT_GAS.VendorNFT, gasInfo.adjusted, network.usdPrice);
    const marketplaceCost = calculateDeploymentCost(CONTRACT_GAS.NFTMarketplace, gasInfo.adjusted, network.usdPrice);
    const totalCost = calculateDeploymentCost(CONTRACT_GAS.total, gasInfo.adjusted, network.usdPrice);

    console.log(`   VendorNFT: ${vendorCost.gasCost.toFixed(6)} ${network.nativeToken} ($${vendorCost.usdCost.toFixed(2)})`);
    console.log(`   NFTMarketplace: ${marketplaceCost.gasCost.toFixed(6)} ${network.nativeToken} ($${marketplaceCost.usdCost.toFixed(2)})`);
    console.log(`   Total: ${totalCost.gasCost.toFixed(6)} ${network.nativeToken} ($${totalCost.usdCost.toFixed(2)})`);

    return {
      network: network.name,
      displayName: network.displayName,
      gasPrice: gasInfo.gwei,
      vendorCost: vendorCost.usdCost,
      marketplaceCost: marketplaceCost.usdCost,
      totalCost: totalCost.usdCost,
      nativeToken: network.nativeToken,
      gasCost: totalCost.gasCost
    };

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("🚀 Durchex NFT Marketplace - Deployment Cost Analysis");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Contract Gas Requirements: VendorNFT (${CONTRACT_GAS.VendorNFT.toLocaleString()}), NFTMarketplace (${CONTRACT_GAS.NFTMarketplace.toLocaleString()})`);
  console.log(`Total Gas per Network: ${CONTRACT_GAS.total.toLocaleString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const results = [];
  let totalUSD = 0;

  for (const network of NETWORKS) {
    const result = await analyzeNetwork(network);
    if (result) {
      results.push(result);
      totalUSD += result.totalCost;
    }
  }

  console.log("\n" + "=".repeat(100));
  console.log("📊 DEPLOYMENT COST SUMMARY");
  console.log("=".repeat(100));

  // Sort by cost
  results.sort((a, b) => a.totalCost - b.totalCost);

  console.log("By Network (sorted by cost):");
  console.log("─".repeat(80));
  results.forEach(result => {
    console.log(`${result.displayName.padEnd(15)}: $${result.totalCost.toFixed(2)} (${result.gasCost.toFixed(6)} ${result.nativeToken})`);
  });

  console.log("─".repeat(80));
  console.log(`TOTAL COST: $${totalUSD.toFixed(2)} USD`);
  console.log(`AVERAGE PER NETWORK: $${(totalUSD / results.length).toFixed(2)} USD`);

  // Group by cost ranges
  const cheap = results.filter(r => r.totalCost < 5);
  const moderate = results.filter(r => r.totalCost >= 5 && r.totalCost < 20);
  const expensive = results.filter(r => r.totalCost >= 20);

  console.log("\n💰 Cost Breakdown:");
  console.log(`   Cheap (< $5): ${cheap.length} networks - $${cheap.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`);
  console.log(`   Moderate ($5-20): ${moderate.length} networks - $${moderate.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`);
  console.log(`   Expensive (> $20): ${expensive.length} networks - $${expensive.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`);

  console.log("\n💡 Recommendations:");
  console.log("   1. Start with cheap networks: Base, Arbitrum, Optimism, Polygon");
  console.log("   2. Deploy in phases to manage costs");
  console.log("   3. Ethereum mainnet is the most expensive at ~$30-50");

  // Save detailed results
  const output = {
    timestamp: new Date().toISOString(),
    contractGas: CONTRACT_GAS,
    networks: results,
    summary: {
      totalUSD: totalUSD,
      averagePerNetwork: totalUSD / results.length,
      networkCount: results.length,
      costRanges: {
        cheap: cheap.length,
        moderate: moderate.length,
        expensive: expensive.length
      }
    }
  };

  fs.writeFileSync("deployment-cost-analysis.json", JSON.stringify(output, null, 2));
  console.log("\n📄 Detailed results saved to: deployment-cost-analysis.json");
}

main().catch(console.error);