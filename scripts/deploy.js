#!/usr/bin/env node

/**
 * Single Network Deployment Script
 *
 * Usage:
 * npx hardhat run scripts/deploy.js --network <network-name>
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting contract deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Deploy VendorNFT first
  console.log("\n⏳ Deploying VendorNFT...");
  const VendorNFT = await ethers.getContractFactory("VendorNFT");
  const vendorNFT = await VendorNFT.deploy(deployer.address);
  await vendorNFT.deployed();

  console.log("✅ VendorNFT deployed to:", vendorNFT.address);

  // Deploy NFTMarketplace
  console.log("\n⏳ Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(vendorNFT.address, deployer.address);
  await marketplace.deployed();

  console.log("✅ NFTMarketplace deployed to:", marketplace.address);

  // Log deployment info
  console.log("\n🎉 Deployment completed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("VendorNFT:", vendorNFT.address);
  console.log("NFTMarketplace:", marketplace.address);
  console.log("Network:", hre.network.name);
  console.log("Block number:", await ethers.provider.getBlockNumber());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      vendorNFT: vendorNFT.address,
      nftMarketplace: marketplace.address,
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  const deploymentPath = path.join(deploymentDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📄 Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });