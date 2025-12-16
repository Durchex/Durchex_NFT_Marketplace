#!/usr/bin/env node

/**
 * Multi-Network Deployment Script
 *
 * This script deploys NFT Marketplace and VendorNFT contracts to multiple networks.
 *
 * Prerequisites:
 * - Hardhat configured with all networks
 * - Private key set in .env as PRIVATE_KEY
 * - Sufficient funds on all networks
 *
 * Usage:
 * npm run deploy:all
 * or
 * node scripts/deploy-all-networks.js
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

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
    // Switch to network
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
    const balanceInEth = ethers.utils.formatEther(balance);
    console.log(`💰 Balance: ${balanceInEth} ETH`);

    if (parseFloat(balanceInEth) < 0.01) {
      console.warn(`⚠️  Warning: Low balance on ${networkName}. Deployment may fail.`);
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
      },
      deploymentTime: new Date().toISOString(),
      blockNumber: blockNumber,
      gasUsed: {
        vendorNFT: vendorNFT.deployTransaction.gasLimit?.toString(),
        marketplace: marketplace.deployTransaction.gasLimit?.toString(),
      }
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

async function updateEnvFile() {
  console.log(`\n📝 Updating .env file with deployment addresses...`);

  const envPath = path.join(process.cwd(), "frontend", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Update contract addresses for each network
  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed) {
      const networkUpper = network.toUpperCase();

      // Update VendorNFT address
      const vendorPattern = new RegExp(`VITE_APP_VENDORNFT_CONTRACT_ADDRESS_${networkUpper}=.*`, "g");
      envContent = envContent.replace(
        vendorPattern,
        `VITE_APP_VENDORNFT_CONTRACT_ADDRESS_${networkUpper}=${result.contracts.vendorNFT}`
      );

      // Update Marketplace address
      const marketPattern = new RegExp(`VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_${networkUpper}=.*`, "g");
      envContent = envContent.replace(
        marketPattern,
        `VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_${networkUpper}=${result.contracts.nftMarketplace}`
      );

      console.log(`✅ Updated ${network} contract addresses`);
    }
  });

  fs.writeFileSync(envPath, envContent);
  console.log(`📄 .env file updated successfully`);
}

async function main() {
  console.log(`🌐 Multi-Network Contract Deployment`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Networks to deploy: ${NETWORKS.join(", ")}`);
  console.log(`Total networks: ${NETWORKS.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Validate environment
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ Error: PRIVATE_KEY not found in environment variables");
    console.error("Please set PRIVATE_KEY in your .env file");
    process.exit(1);
  }

  // Deploy to each network
  for (const network of NETWORKS) {
    await deployToNetwork(network);

    // Small delay between deployments
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Update environment file
  await updateEnvFile();

  // Print summary
  console.log(`\n🎉 Deployment Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  let successCount = 0;
  let failCount = 0;

  Object.entries(deploymentResults).forEach(([network, result]) => {
    if (result && !result.failed) {
      successCount++;
      console.log(`✅ ${network.toUpperCase()}:`);
      console.log(`   VendorNFT: ${result.contracts.vendorNFT}`);
      console.log(`   Marketplace: ${result.contracts.nftMarketplace}`);
    } else {
      failCount++;
      console.log(`❌ ${network.toUpperCase()}: Failed - ${result?.error || "Unknown error"}`);
    }
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Results: ${successCount} successful, ${failCount} failed`);

  if (successCount > 0) {
    console.log(`\n✅ Contracts deployed successfully to ${successCount} network(s)!`);
    console.log(`📄 Check the deployments/ folder for detailed logs`);
    console.log(`🔧 .env file has been updated with new contract addresses`);
  }

  // Save complete deployment summary
  const summaryPath = path.join(
    process.cwd(),
    "deployments",
    `multi-network-deployment-${Date.now()}.json`
  );

  const summary = {
    timestamp: new Date().toISOString(),
    networks: NETWORKS,
    results: deploymentResults,
    summary: {
      total: NETWORKS.length,
      successful: successCount,
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