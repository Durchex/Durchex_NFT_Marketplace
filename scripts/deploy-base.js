#!/usr/bin/env node

/**
 * Base Network Deployment Script
 *
 * Deploys the updated VendorNFT contract to Base network
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting Base network deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.error("❌ Insufficient balance for deployment. Need at least 0.01 ETH");
    process.exit(1);
  }

  // Deploy VendorNFT
  console.log("\n⏳ Deploying VendorNFT...");
  const VendorNFT = await ethers.getContractFactory("VendorNFT");
  const vendorNFT = await VendorNFT.deploy(deployer.address);
  await vendorNFT.deployed();

  console.log("✅ VendorNFT deployed to:", vendorNFT.address);

  // Verify the contract has the vendorMint function
  console.log("\n🔍 Verifying vendorMint function exists...");
  try {
    // This should work now
    const testCall = await vendorNFT.vendorMint("test", deployer.address);
    console.log("❌ vendorMint call succeeded (unexpected - should require signer)");
  } catch (error) {
    if (error.message.includes("vendorMint is not a function")) {
      console.error("❌ vendorMint function missing from contract!");
      process.exit(1);
    } else {
      console.log("✅ vendorMint function exists (failed as expected without proper signer)");
    }
  }

  // Log deployment info
  console.log("\n🎉 Deployment completed!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("VendorNFT:", vendorNFT.address);
  console.log("Network: base");
  console.log("Block number:", await ethers.provider.getBlockNumber());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const deploymentInfo = {
    network: "base",
    chainId: 8453,
    deployer: deployer.address,
    contracts: {
      vendorNFT: vendorNFT.address,
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  const deploymentPath = path.join(deploymentDir, `base-deployment.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  console.log("\n📋 Next steps:");
  console.log("1. Update your .env file with the new contract address:");
  console.log(`   VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BASE=${vendorNFT.address}`);
  console.log("2. Test the contract using the test script");
  console.log("3. Deploy your frontend with the updated address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });