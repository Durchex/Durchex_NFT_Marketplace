#!/usr/bin/env node

/**
 * Contract Deployment from Pre-compiled Artifacts
 * Deploys VendorNFT, NFTMarketplace, MultiPieceLazyMintNFT to all networks.
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const artifactsDir = path.join(process.cwd(), "frontend", "src", "Context");
const vendorArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "VendorNFT.json"), "utf8"));
const marketplaceArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "NFTMarketplace.json"), "utf8"));
const lazyMintArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "MultiPieceLazyMintNFT.json"), "utf8"));

const deploymentResults = {};

const NETWORKS = [
  { name: "ethereum", rpc: process.env.ETHEREUM_RPC_URL || "https://rpc.ankr.com/eth", chainId: 1 },
  { name: "polygon", rpc: process.env.POLYGON_RPC_URL || "https://rpc.ankr.com/polygon", chainId: 137 },
  { name: "bsc", rpc: process.env.BSC_RPC_URL || "https://rpc.ankr.com/bsc", chainId: 56 },
  { name: "arbitrum", rpc: process.env.ARBITRUM_RPC_URL || "https://rpc.ankr.com/arbitrum", chainId: 42161 },
  { name: "base", rpc: process.env.BASE_RPC_URL || "https://mainnet.base.org", chainId: 8453 },
  { name: "optimism", rpc: process.env.OPTIMISM_RPC_URL || "https://rpc.ankr.com/optimism", chainId: 10 },
  { name: "avalanche", rpc: process.env.AVALANCHE_RPC_URL || "https://rpc.ankr.com/avalanche", chainId: 43114 },
  { name: "hyperliquid", rpc: process.env.HYPERLIQUID_RPC_URL || "https://rpc.hyperliquid.xyz/evm", chainId: 999 },
];

async function deployToNetwork(networkConfig) {
  const { name: networkName, rpc, chainId } = networkConfig;
  console.log(`\n🚀 Starting deployment to ${networkName.toUpperCase()}`);

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpc, chainId);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("PRIVATE_KEY not set in environment");

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📝 Deployer: ${wallet.address}`);

    const balance = await wallet.getBalance();
    const balanceInEth = parseFloat(ethers.utils.formatEther(balance));
    console.log(`💰 Balance: ${balanceInEth} (native token)`);

    if (balanceInEth === 0) {
      throw new Error("Insufficient balance (0)");
    }

    const gasPrice = await provider.getGasPrice();
    console.log(`⛽ Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

    const platformFeeReceiver = process.env.PLATFORM_FEE_RECEIVER || wallet.address;
    const platformFeeBps = 250; // 2.5%

    const VendorFactory = new ethers.ContractFactory(vendorArtifact.abi, vendorArtifact.bytecode, wallet);
    const MarketplaceFactory = new ethers.ContractFactory(marketplaceArtifact.abi, marketplaceArtifact.bytecode, wallet);
    const LazyMintFactory = new ethers.ContractFactory(lazyMintArtifact.abi, lazyMintArtifact.bytecode, wallet);

    // Deploy VendorNFT
    console.log(`⏳ Deploying VendorNFT to ${networkName}...`);
    const vendor = await VendorFactory.deploy(wallet.address);
    await vendor.deployed();
    console.log(`✅ VendorNFT: ${vendor.address}`);

    // Deploy NFTMarketplace
    console.log(`⏳ Deploying NFTMarketplace to ${networkName}...`);
    const marketplace = await MarketplaceFactory.deploy(vendor.address, wallet.address);
    await marketplace.deployed();
    console.log(`✅ NFTMarketplace: ${marketplace.address}`);

    // Deploy MultiPieceLazyMintNFT
    console.log(`⏳ Deploying MultiPieceLazyMintNFT to ${networkName}...`);
    const lazyMint = await LazyMintFactory.deploy(platformFeeReceiver, platformFeeBps);
    await lazyMint.deployed();
    console.log(`✅ MultiPieceLazyMintNFT: ${lazyMint.address}`);

    const blockNumber = await provider.getBlockNumber();

    const deploymentInfo = {
      network: networkName,
      chainId,
      rpcUrl: rpc,
      deployer: wallet.address,
      contracts: {
        vendorNFT: vendor.address,
        nftMarketplace: marketplace.address,
        multiPieceLazyMint: lazyMint.address,
      },
      deploymentTime: new Date().toISOString(),
      blockNumber,
    };

    deploymentResults[networkName] = deploymentInfo;

    const deploymentDir = path.join(process.cwd(), "deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(deploymentDir, `${networkName}-deployment.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );

    return deploymentInfo;
  } catch (error) {
    console.error(`❌ Failed on ${networkName}: ${error.message}`);
    deploymentResults[networkName] = { network: networkName, error: error.message, failed: true };
    return null;
  }
}

function generateEnv() {
  let env = `# Contract Addresses - Generated ${new Date().toISOString()}\n\n`;

  const firstSuccess = Object.values(deploymentResults).find(r => r && !r.failed);
  env += `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=${firstSuccess?.contracts?.multiPieceLazyMint || ""}\n\n`;

  env += `# Multi-piece lazy mint contracts (per-network)\n`;
  Object.entries(deploymentResults).forEach(([net, r]) => {
    if (r && !r.failed) env += `VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_${net.toUpperCase()}=${r.contracts.multiPieceLazyMint}\n`;
  });

  env += `\n# Marketplace contract (per-network)\n`;
  Object.entries(deploymentResults).forEach(([net, r]) => {
    if (r && !r.failed) env += `VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_${net.toUpperCase()}=${r.contracts.nftMarketplace}\n`;
  });

  env += `\n# Vendor / NFT contract (per-network)\n`;
  Object.entries(deploymentResults).forEach(([net, r]) => {
    if (r && !r.failed) env += `VITE_APP_VENDORNFT_CONTRACT_ADDRESS_${net.toUpperCase()}=${r.contracts.vendorNFT}\n`;
  });

  env += `\n# RPC URLs (per-network)\n`;
  NETWORKS.forEach(n => {
    env += `VITE_RPC_URL_${n.name.toUpperCase()}=${n.rpc}\n`;
  });

  fs.writeFileSync(path.join(process.cwd(), "frontend", ".env.deployed"), env);
  console.log(`📄 Env vars saved to: frontend/.env.deployed`);
}

async function main() {
  console.log(`🌐 Contract Deployment from Artifacts`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Networks: ${NETWORKS.map(n => n.name).join(", ")}`);
  console.log(`Contracts: VendorNFT, NFTMarketplace, MultiPieceLazyMintNFT`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  for (const network of NETWORKS) {
    await deployToNetwork(network);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n🎉 Deployment Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  let successCount = 0, failCount = 0;
  Object.entries(deploymentResults).forEach(([net, r]) => {
    if (r && !r.failed) {
      successCount++;
      console.log(`✅ ${net.toUpperCase()}:`);
      console.log(`   VendorNFT:           ${r.contracts.vendorNFT}`);
      console.log(`   NFTMarketplace:      ${r.contracts.nftMarketplace}`);
      console.log(`   MultiPieceLazyMint:  ${r.contracts.multiPieceLazyMint}`);
    } else {
      failCount++;
      console.log(`❌ ${net.toUpperCase()}: ${r?.error || "Unknown error"}`);
    }
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 ${successCount} succeeded, ${failCount} failed`);

  generateEnv();

  const deploymentDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentDir)) fs.mkdirSync(deploymentDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentDir, `deployment-summary-${Date.now()}.json`),
    JSON.stringify({ timestamp: new Date().toISOString(), results: deploymentResults }, null, 2)
  );
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("❌ Script failed:", e.message);
  process.exit(1);
});
