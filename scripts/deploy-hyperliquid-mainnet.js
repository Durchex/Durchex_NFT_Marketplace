#!/usr/bin/env node

/**
 * HyperLiquid Mainnet Deployment Script
 * 
 * This script deploys NFT Marketplace and VendorNFT contracts to HyperLiquid mainnet.
 * 
 * Prerequisites:
 * - Hardhat configured with HyperLiquid network
 * - Contracts compiled and ready in contracts/ folder
 * - Private key set in .env or passed as PRIVATE_KEY
 * 
 * Usage:
 * npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid
 * 
 * Or with environment variable:
 * PRIVATE_KEY=<key> npm run deploy:hyperliquid:mainnet
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

// Configuration
const NETWORK = "hyperliquid";
const RPC_URL = "https://api.hyperliquid.xyz/evm";
const CHAIN_ID = 63;

async function deployToHyperLiquidMainnet() {
  try {
    console.log(`\n🚀 Starting HyperLiquid ${NETWORK} Deployment`);
    console.log(`📡 RPC URL: ${RPC_URL}`);
    console.log(`⛓️  Chain ID: ${CHAIN_ID}`);

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log(`\n📝 Deployer Address: ${deployer.address}`);

    // Get account balance
    const balance = await deployer.getBalance();
    const balanceInETH = ethers.utils.formatEther(balance);
    console.log(`💰 Account Balance: ${balanceInETH} ETH`);

    if (parseFloat(balanceInETH) < 0.1) {
      console.warn("⚠️  Warning: Account balance might be insufficient for deployment");
    }

    // Deploy VendorNFT contract
    console.log("\n⏳ Deploying VendorNFT contract...");
    const VendorNFT = await ethers.getContractFactory("VendorNFT");
    const vendorNFT = await VendorNFT.deploy(deployer.address);
    await vendorNFT.deployed();

    console.log(`✅ VendorNFT deployed!`);
    console.log(`📍 Contract Address: ${vendorNFT.address}`);
    console.log(`⛽ Deployment Transaction Hash: ${vendorNFT.deployTransaction.hash}`);

    // Deploy NFTMarketplace contract
    console.log("\n⏳ Deploying NFTMarketplace contract...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy(vendorNFT.address);
    await marketplace.deployed();

    console.log(`✅ NFTMarketplace deployed!`);
    console.log(`📍 Contract Address: ${marketplace.address}`);
    console.log(`⛽ Deployment Transaction Hash: ${marketplace.deployTransaction.hash}`);

    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      chainId: CHAIN_ID,
      rpcUrl: RPC_URL,
      deployer: deployer.address,
      contracts: {
        vendorNFT: vendorNFT.address,
        nftMarketplace: marketplace.address,
      },
      deploymentTime: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
    };

    const deploymentPath = path.join(
      process.cwd(),
      "deployments",
      `hyperliquid-mainnet-deployment.json`
    );

    const deploymentDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);

    // Output deployment summary
    console.log(`\n✨ Deployment Summary:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Network:                 ${NETWORK} (Chain ID: ${CHAIN_ID})`);
    console.log(`Deployer:                ${deployer.address}`);
    console.log(`VendorNFT Address:       ${vendorNFT.address}`);
    console.log(`NFTMarketplace Address:  ${marketplace.address}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`\n📋 Update your .env file with:`);
    console.log(`VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=${marketplace.address}`);
    console.log(`VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=${vendorNFT.address}`);

    console.log(`\n🔗 Verify contracts on HyperLiquid Explorer:`);
    console.log(`https://explorer.hyperliquid.xyz/address/${vendorNFT.address}`);
    console.log(`https://explorer.hyperliquid.xyz/address/${marketplace.address}`);

    return {
      vendorNFT: vendorNFT.address,
      marketplace: marketplace.address,
    };
  } catch (error) {
    console.error("\n❌ Deployment failed!");
    console.error("Error:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 Tip: Ensure your account has enough ETH for gas fees on HyperLiquid");
    }
    if (error.message.includes("cannot estimate gas")) {
      console.error("\n💡 Tip: Check that the contract code compiles and constructor is valid");
    }
    if (error.message.includes("ENOENT")) {
      console.error("\n💡 Tip: Ensure contracts are compiled. Run: npx hardhat compile");
    }

    process.exit(1);
  }
}

// Main execution
deployToHyperLiquidMainnet()
  .then((contracts) => {
    console.log(`\n🎉 Contracts deployed successfully to HyperLiquid mainnet!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

export default deployToHyperLiquidMainnet;
