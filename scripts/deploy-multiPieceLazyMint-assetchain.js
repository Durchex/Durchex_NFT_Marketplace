#!/usr/bin/env node

/**
 * Deploy MultiPieceLazyMintNFT to Asset Chain mainnet (or configured Asset Chain RPC).
 *
 * Usage:
 *   ASSETCHAIN_RPC_URL=https://mainnet-rpc.assetchain.org \
 *   PRIVATE_KEY=0x... \
 *   PLATFORM_FEE_RECEIVER=0xYourTreasury \
 *   npx hardhat run scripts/deploy-multiPieceLazyMint-assetchain.js --network assetchain
 */

import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying MultiPieceLazyMintNFT to Asset Chain…");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.utils.formatEther(balance), "RWA");

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

  const network = await ethers.provider.getNetwork();
  console.log("✅ MultiPieceLazyMintNFT deployed to:", multi.address);
  console.log("Network chainId:", network.chainId.toString());

  const deploymentInfo = {
    network: "assetchain",
    chainId: network.chainId,
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
  const outPath = path.join(deploymentDir, "assetchain-multiPieceLazyMint.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", outPath);

  console.log("\nNext steps:");
  console.log(
    `1. In frontend/.env set:\n   VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_ASSETCHAIN=${multi.address}`
  );
  console.log("2. Rebuild frontend: cd frontend && npm run build");
  console.log("3. Deploy the updated frontend.");
}

main().catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});

