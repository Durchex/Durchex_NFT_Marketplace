#!/usr/bin/env node

import pkg from "hardhat";
const { ethers } = pkg;
import dotenv from "dotenv";

dotenv.config();

const networks = [
  { name: "ethereum", rpc: process.env.ETHEREUM_RPC_URL },
  { name: "polygon", rpc: process.env.POLYGON_RPC_URL },
  { name: "bsc", rpc: process.env.BSC_RPC_URL },
  { name: "arbitrum", rpc: process.env.ARBITRUM_RPC_URL },
  { name: "base", rpc: process.env.BASE_RPC_URL },
  { name: "optimism", rpc: process.env.OPTIMISM_RPC_URL },
  { name: "avalanche", rpc: process.env.AVALANCHE_RPC_URL },
  { name: "hyperliquid", rpc: process.env.HYPERLIQUID_RPC_URL }
];

async function checkBalances() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.log("❌ PRIVATE_KEY not found in .env");
    return;
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log("📝 Wallet Address:", wallet.address);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const network of networks) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(network.rpc);
      const balance = await provider.getBalance(wallet.address);
      const balanceInEth = ethers.utils.formatEther(balance);
      console.log(`${network.name.toUpperCase().padEnd(12)}: ${balanceInEth} ETH`);
    } catch (error) {
      console.log(`${network.name.toUpperCase().padEnd(12)}: ❌ Error - ${error.message}`);
    }
  }
}

checkBalances().catch(console.error);