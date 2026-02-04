#!/usr/bin/env node

/**
 * Deploy MultiPieceLazyMintNFT to Base mainnet (or configured Base RPC)
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying MultiPieceLazyMintNFT to Base…");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.utils.formatEther(balance), "ETH");
  // NOTE: We no longer hard-stop on a minimum balance.
  // If gas is insufficient, the network will reject the tx and Hardhat will surface the error.

  const platformFeeReceiver =
    process.env.PLATFORM_FEE_RECEIVER || deployer.address; // your treasury or deployer
  const platformFeeBps = 250; // 2.5% fee in basis points

  const MultiPieceLazyMintNFT = await ethers.getContractFactory(
    "MultiPieceLazyMintNFT"
  );
  const multi = await MultiPieceLazyMintNFT.deploy(
    platformFeeReceiver,
    platformFeeBps
  );
  await multi.deployed();

  console.log("✅ MultiPieceLazyMintNFT deployed to:", multi.address);
  console.log("Network chainId:", (await ethers.provider.getNetwork()).chainId);

  const deploymentInfo = {
    network: "base",
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      multiPieceLazyMint: multi.address,
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }
  const outPath = path.join(deploymentDir, "base-multiPieceLazyMint.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", outPath);

  console.log("\nNext steps:");
  console.log(
    `1. In frontend/.env set:\n   VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_BASE=${multi.address}`
  );
  console.log("2. Rebuild frontend: cd frontend && npm run build");
  console.log("3. Redeploy the frontend (durchex.com) with the new build.");
}

main().catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});

