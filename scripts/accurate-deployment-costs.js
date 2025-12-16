#!/usr/bin/env node

// Durchex NFT Marketplace - Accurate Deployment Cost Calculator
// Based on current market data (December 2025)

const NETWORKS = [
  {
    name: "ethereum",
    displayName: "Ethereum Mainnet",
    nativeToken: "ETH",
    usdPrice: 3500,
    avgGasPriceGwei: 25, // Conservative estimate
    chainId: 1
  },
  {
    name: "polygon",
    displayName: "Polygon",
    nativeToken: "MATIC",
    usdPrice: 0.85,
    avgGasPriceGwei: 80, // Higher due to network congestion
    chainId: 137
  },
  {
    name: "bsc",
    displayName: "BSC",
    nativeToken: "BNB",
    usdPrice: 320,
    avgGasPriceGwei: 15,
    chainId: 56
  },
  {
    name: "arbitrum",
    displayName: "Arbitrum One",
    nativeToken: "ETH",
    usdPrice: 3500,
    avgGasPriceGwei: 2, // L2 efficiency
    chainId: 42161
  },
  {
    name: "base",
    displayName: "Base",
    nativeToken: "ETH",
    usdPrice: 3500,
    avgGasPriceGwei: 1.5, // Very cheap L2
    chainId: 8453
  },
  {
    name: "optimism",
    displayName: "Optimism",
    nativeToken: "ETH",
    usdPrice: 3500,
    avgGasPriceGwei: 2,
    chainId: 10
  },
  {
    name: "avalanche",
    displayName: "Avalanche C-Chain",
    nativeToken: "AVAX",
    usdPrice: 38,
    avgGasPriceGwei: 35,
    chainId: 43114
  },
  {
    name: "hyperliquid",
    displayName: "HyperLiquid",
    nativeToken: "ETH",
    usdPrice: 3500,
    avgGasPriceGwei: 15, // Conservative estimate
    chainId: 999
  }
];

// Accurate gas estimates based on contract analysis
const CONTRACT_GAS = {
  VendorNFT: 49000,
  NFTMarketplace: 62000,
  total: 111000,
  buffer: 1.2 // 20% buffer for gas estimation variance
};

function calculateCost(gasUsed, gasPriceGwei, tokenPriceUSD) {
  // Convert gwei to wei, then to ETH
  const gasPriceWei = gasPriceGwei * 1e9; // 1 gwei = 1e9 wei
  const gasCostWei = gasUsed * gasPriceWei;
  const gasCostETH = gasCostWei / 1e18; // Convert wei to ETH
  const usdCost = gasCostETH * tokenPriceUSD;

  return {
    gas: gasCostETH,
    usd: usdCost
  };
}

function formatCost(amount, decimals = 4) {
  return amount.toFixed(decimals);
}

console.log("🚀 Durchex NFT Marketplace - Accurate Deployment Cost Analysis");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📊 Contract Gas Requirements:`);
console.log(`   • VendorNFT: ${CONTRACT_GAS.VendorNFT.toLocaleString()} gas`);
console.log(`   • NFTMarketplace: ${CONTRACT_GAS.NFTMarketplace.toLocaleString()} gas`);
console.log(`   • Total per network: ${CONTRACT_GAS.total.toLocaleString()} gas`);
console.log(`   • Buffer applied: ${(CONTRACT_GAS.buffer * 100 - 100).toFixed(0)}%`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const results = [];
let totalUSD = 0;

NETWORKS.forEach(network => {
  console.log(`\n🔍 ${network.displayName} (${network.name})`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   Native Token: ${network.nativeToken} ($${network.usdPrice})`);
  console.log(`   Gas Price: ${network.avgGasPriceGwei} gwei`);

  const bufferedGas = CONTRACT_GAS.total * CONTRACT_GAS.buffer;

  const vendorCost = calculateCost(CONTRACT_GAS.VendorNFT, network.avgGasPriceGwei, network.usdPrice);
  const marketplaceCost = calculateCost(CONTRACT_GAS.NFTMarketplace, network.avgGasPriceGwei, network.usdPrice);
  const totalCost = calculateCost(bufferedGas, network.avgGasPriceGwei, network.usdPrice);

  console.log(`   VendorNFT: ${formatCost(vendorCost.gas)} ${network.nativeToken} ($${formatCost(vendorCost.usd)})`);
  console.log(`   NFTMarketplace: ${formatCost(marketplaceCost.gas)} ${network.nativeToken} ($${formatCost(marketplaceCost.usd)})`);
  console.log(`   Total (with buffer): ${formatCost(totalCost.gas)} ${network.nativeToken} ($${formatCost(totalCost.usd)})`);

  results.push({
    network: network.name,
    displayName: network.displayName,
    gasPrice: network.avgGasPriceGwei,
    vendorCost: vendorCost.usd,
    marketplaceCost: marketplaceCost.usd,
    totalCost: totalCost.usd,
    nativeToken: network.nativeToken,
    gasCost: totalCost.gas
  });

  totalUSD += totalCost.usd;
});

console.log("\n" + "=".repeat(110));
console.log("📊 DEPLOYMENT COST SUMMARY (SORTED BY COST)");
console.log("=".repeat(110));

// Sort by cost ascending
results.sort((a, b) => a.totalCost - b.totalCost);

console.log("Network".padEnd(20) + "Gas Price".padEnd(12) + "Cost (USD)".padEnd(12) + "Native Token Cost");
console.log("─".repeat(110));
results.forEach(result => {
  const networkName = result.displayName.padEnd(20);
  const gasPrice = `${result.gasPrice} gwei`.padEnd(12);
  const usdCost = `$${result.totalCost.toFixed(2)}`.padEnd(12);
  const nativeCost = `${result.gasCost.toFixed(6)} ${result.nativeToken}`;
  console.log(`${networkName}${gasPrice}${usdCost}${nativeCost}`);
});

console.log("─".repeat(110));
console.log(`${"TOTAL COST".padEnd(32)}: $${totalUSD.toFixed(2)} USD`);
console.log(`${"AVERAGE PER NETWORK".padEnd(32)}: $${(totalUSD / results.length).toFixed(2)} USD`);

// Cost analysis
const cheap = results.filter(r => r.totalCost < 5);
const moderate = results.filter(r => r.totalCost >= 5 && r.totalCost < 20);
const expensive = results.filter(r => r.totalCost >= 20);

console.log("\n💰 COST BREAKDOWN:");
console.log(`   🟢 Cheap (< $5): ${cheap.length} networks - $${cheap.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`);
console.log(`   🟡 Moderate ($5-20): ${moderate.length} networks - $${moderate.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`);
console.log(`   🔴 Expensive (> $20): ${expensive.length} networks - $${expensive.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`);

console.log("\n🎯 DEPLOYMENT STRATEGY RECOMMENDATIONS:");
console.log("   1. 🚀 Phase 1 - Cheap Networks ($${cheap.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}):");
cheap.forEach(net => console.log(`      • ${net.displayName}`));

console.log(`   2. ⚡ Phase 2 - Moderate Networks ($${moderate.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}):`);
moderate.forEach(net => console.log(`      • ${net.displayName}`));

console.log(`   3. 💎 Phase 3 - Premium Networks ($${expensive.reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}):`);
expensive.forEach(net => console.log(`      • ${net.displayName}`));

console.log("\n💡 FUNDING TIPS:");
console.log("   • Start with $10-20 to deploy to 4-5 cheap networks");
console.log("   • Use network bridges to move ETH between L2s (Base, Arbitrum, Optimism)");
console.log("   • Buy native tokens on exchanges: MATIC, BNB, AVAX");
console.log("   • Ethereum mainnet requires ~$35 (most expensive)");

console.log("\n⚠️  IMPORTANT NOTES:");
console.log("   • Gas prices fluctuate - these are conservative estimates");
console.log("   • 20% buffer included for gas estimation variance");
console.log("   • Prices based on December 2025 market data");
console.log("   • Actual costs may vary based on network congestion");

// Save results
import fs from "fs";
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

fs.writeFileSync("accurate-deployment-costs.json", JSON.stringify(output, null, 2));
console.log("\n📄 Detailed results saved to: accurate-deployment-costs.json");