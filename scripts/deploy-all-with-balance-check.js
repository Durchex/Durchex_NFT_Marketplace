#!/usr/bin/env node

/**
 * Multi-Network Deployment Script with Balance Checks
 *
 * This script deploys VendorNFT, NFTMarketplace, and MultiPieceLazyMintNFT contracts to multiple networks.
 * Skips deployment if wallet balance is insufficient for estimated costs.
 *
 * Prerequisites:
 * - Hardhat configured with all networks
 * - Private key set in .env as PRIVATE_KEY
 * - Sufficient funds on networks
 *
 * Usage:
 * node scripts/deploy-all-with-balance-check.js
 */

import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Load deployment costs
const costData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "accurate-deployment-costs.json"), "utf8"));
const networkCosts = {};
costData.networks.forEach(net => {
  networkCosts[net.network] = {
    vendorCost: net.vendorCost,
    marketplaceCost: net.marketplaceCost,
    totalCost: net.totalCost,
    nativeToken: net.nativeToken
  };
});

// Assume MultiPieceLazyMint cost is similar to VendorNFT
const MULTI_PIECE_COST_MULTIPLIER = 1.0; // same as vendor

// Networks to deploy to
const NETWORKS = [
  "ethereum",
  "polygon",
  "bsc",
  "arbitrum",
  "base",
  "optimism",
  "avalanche",
  "hyperliquid"
];

// Deployment results
const deploymentResults = {};

async function deployToNetwork(networkName) {
  console.log(`\n🚀 Starting deployment to ${networkName.toUpperCase()}`);

  try {
    // Switch to network (Hardhat way)
    await hre.network.provider.send("hardhat_reset");

    const networkConfig = hre.config.networks[networkName];
    if (!networkConfig) {
      throw new Error(`Network ${networkName} not configured in hardhat.config.js`);
    }

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📝 Deployer: ${deployer.address}`);

    // Check balance
    const balance = await deployer.getBalance();
    const balanceInEth = parseFloat(ethers.utils.formatEther(balance));
    console.log(`💰 Balance: ${balanceInEth} ${networkCosts[networkName]?.nativeToken || 'ETH'}`);

    // Get costs
    const costs = networkCosts[networkName];
    if (!costs) {
      console.warn(`⚠️  No cost data for ${networkName}, proceeding without balance check.`);
    } else {
      const estimatedTotalCost = costs.totalCost + (costs.vendorCost * MULTI_PIECE_COST_MULTIPLIER); // add multi piece
      console.log(`💸 Estimated cost: ${estimatedTotalCost} ${costs.nativeToken}`);

      if (balanceInEth < estimatedTotalCost) {
        console.log(`⏭️  Skipping ${networkName}: Insufficient balance (${balanceInEth} < ${estimatedTotalCost})`);
        deploymentResults[networkName] = {
          network: networkName,
          skipped: true,
          reason: "Insufficient balance",
          balance: balanceInEth,
          required: estimatedTotalCost
        };
        return null;
      }
    }

    // Deploy VendorNFT first
    console.log(`\n⏳ Deploying VendorNFT to ${networkName}...`);
    const VendorNFT = await ethers.getContractFactory("VendorNFT");
    const vendorNFT = await VendorNFT.deploy(deployer.address);
    await vendorNFT.deployed();
    console.log(`✅ VendorNFT deployed: ${vendorNFT.address}`);

    // Deploy NFTMarketplace
    console.log(`\n⏳ Deploying NFTMarketplace to ${networkName}...`);
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy(vendorNFT.address, deployer.address);
    await marketplace.deployed();
    console.log(`✅ NFTMarketplace deployed: ${marketplace.address}`);

    // Deploy MultiPieceLazyMintNFT
    console.log(`\n⏳ Deploying MultiPieceLazyMintNFT to ${networkName}...`);
    const platformFeeReceiver = process.env.PLATFORM_FEE_RECEIVER || deployer.address;
    const platformFeeBps = 250; // 2.5%
    const MultiPieceLazyMintNFT = await ethers.getContractFactory("MultiPieceLazyMintNFT");
    const multiPiece = await MultiPieceLazyMintNFT.deploy(platformFeeReceiver, platformFeeBps);
    await multiPiece.deployed();
    console.log(`✅ MultiPieceLazyMintNFT deployed: ${multiPiece.address}`);

    // Get deployment info
    const blockNumber = await ethers.provider.getBlockNumber();
    const deploymentInfo = {
      network: networkName,
      chainId: networkConfig.chainId,
      rpcUrl: networkConfig.url,
      deployer: deployer.address,
      contracts: {
        vendorNFT: vendorNFT.address,
        nftMarketplace: marketplace.address,
        multiPieceLazyMint: multiPiece.address,
      },
      deploymentTime: new Date().toISOString(),
      blockNumber: blockNumber,
    };

    deploymentResults[networkName] = deploymentInfo;

    // Save individual network deployment
    const networkDeploymentPath = path.join(
      process.cwd(),
      "deployments",
      `${networkName}-deployment.json`
    );

    const deploymentDir = path.dirname(networkDeploymentPath);
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(networkDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Saved deployment info: ${networkDeploymentPath}`);

    return deploymentInfo;

  } catch (error) {
    console.error(`❌ Deployment failed on ${networkName}:`, error.message);
    deploymentResults[networkName] = {
      network: networkName,
      error: error.message,
      failed: true
    };
    return null;
  }
}

async function generateEnvVars() {
  console.log(`\n📝 Generating environment variables...`);

  let envContent = `# Contract Addresses - Generated on ${new Date().toISOString()}\n`;

  // Lazy Mint default (use base if available, else first successful)
  let defaultLazyMint = "";
  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed && !result.skipped && result.contracts?.multiPieceLazyMint) {
      if (!defaultLazyMint) defaultLazyMint = result.contracts.multiPieceLazyMint;
    }
  });
  envContent += `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=${defaultLazyMint}\n\n`;

  // Per-network lazy mint
  envContent += `# Multi-piece lazy mint contracts (per-network)\n`;
  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed && !result.skipped && result.contracts?.multiPieceLazyMint) {
      const networkUpper = network.toUpperCase();
      envContent += `VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_${networkUpper}=${result.contracts.multiPieceLazyMint}\n`;
    }
  });
  envContent += `\n`;

  // Marketplace contracts
  envContent += `# Marketplace contract (per-network)\n`;
  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed && !result.skipped && result.contracts?.nftMarketplace) {
      const networkUpper = network.toUpperCase();
      envContent += `VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_${networkUpper}=${result.contracts.nftMarketplace}\n`;
    }
  });
  envContent += `\n`;

  // VendorNFT contracts
  envContent += `# Vendor / NFT contract (per-network)\n`;
  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed && !result.skipped && result.contracts?.vendorNFT) {
      const networkUpper = network.toUpperCase();
      envContent += `VITE_APP_VENDORNFT_CONTRACT_ADDRESS_${networkUpper}=${result.contracts.vendorNFT}\n`;
    }
  });
  envContent += `\n`;

  // RPC URLs (placeholders, user needs to fill)
  envContent += `# RPC URLs for frontend (per-network) - FILL THESE IN\n`;
  NETWORKS.forEach(network => {
    const networkUpper = network.toUpperCase();
    envContent += `# VITE_RPC_URL_${networkUpper}=\n`;
  });
  envContent += `\n`;

  // Other placeholders
  envContent += `# API\n`;
  envContent += `VITE_API_BASE_URL=https://your-api.com/api/v1\n\n`;
  envContent += `# Socket (casino multiplayer / optional)\n`;
  envContent += `# VITE_SOCKET_URL=https://your-api.com\n`;

  const envPath = path.join(process.cwd(), "frontend", ".env.deployed");
  fs.writeFileSync(envPath, envContent);
  console.log(`📄 Environment variables saved to: ${envPath}`);
  console.log(`🔧 Copy the contents to frontend/.env and fill in RPC URLs and API URLs.`);
}

async function main() {
  console.log(`🌐 Multi-Network Contract Deployment with Balance Checks`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Networks to deploy: ${NETWORKS.join(", ")}`);
  console.log(`Total networks: ${NETWORKS.length}`);
  console.log(`Contracts: VendorNFT, NFTMarketplace, MultiPieceLazyMintNFT`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Validate environment
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ Error: PRIVATE_KEY not found in environment variables");
    console.error("Please set PRIVATE_KEY in your .env file");
    process.exit(1);
  }

  // Compile contracts first
  console.log(`\n🔨 Compiling contracts...`);
  try {
    await hre.run("compile");
    console.log(`✅ Contracts compiled successfully`);
  } catch (error) {
    console.error(`❌ Failed to compile contracts:`, error.message);
    process.exit(1);
  }

  // Deploy to each network
  for (const network of NETWORKS) {
    await deployToNetwork(network);

    // Small delay between deployments
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate env vars
  await generateEnvVars();

  // Print summary
  console.log(`\n🎉 Deployment Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed && !result.skipped) {
      successCount++;
      console.log(`✅ ${network.toUpperCase()}:`);
      console.log(`   VendorNFT: ${result.contracts.vendorNFT}`);
      console.log(`   Marketplace: ${result.contracts.nftMarketplace}`);
      console.log(`   MultiPieceLazyMint: ${result.contracts.multiPieceLazyMint}`);
    } else if (result?.skipped) {
      skipCount++;
      console.log(`⏭️  ${network.toUpperCase()}: Skipped - ${result.reason}`);
    } else {
      failCount++;
      console.log(`❌ ${network.toUpperCase()}: Failed - ${result?.error || "Unknown error"}`);
    }
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Results: ${successCount} successful, ${skipCount} skipped, ${failCount} failed`);

  if (successCount > 0) {
    console.log(`\n✅ Contracts deployed successfully to ${successCount} network(s)!`);
    console.log(`📄 Check the deployments/ folder for detailed logs`);
    console.log(`🔧 Environment variables generated in frontend/.env.deployed`);
  }

  // Save complete deployment summary
  const summaryPath = path.join(
    process.cwd(),
    "deployments",
    `multi-network-deployment-${Date.now()}.json`
  );

  const summaryDir = path.dirname(summaryPath);
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }

  const summary = {
    timestamp: new Date().toISOString(),
    networks: NETWORKS,
    results: deploymentResults,
    summary: {
      total: NETWORKS.length,
      successful: successCount,
      skipped: skipCount,
      failed: failCount
    }
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📄 Complete summary saved: ${summaryPath}`);
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });