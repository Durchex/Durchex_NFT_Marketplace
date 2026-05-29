#!/usr/bin/env node

/**
 * Lazy-Mint-Only Deployment
 * Deploys only MultiPieceLazyMintNFT — the minimum required for lazy minting.
 * Buyers pay gas + price at redemption time; creators sign vouchers off-chain.
 *
 * Pick networks via CLI args, e.g.:
 *   node scripts/deploy-lazy-mint-only.js base polygon
 *   node scripts/deploy-lazy-mint-only.js all
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const artifactsDir = path.join(process.cwd(), "frontend", "src", "Context");
const lazyMintArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "MultiPieceLazyMintNFT.json"), "utf8"));
const vendorArtifact = JSON.parse(fs.readFileSync(path.join(artifactsDir, "VendorNFT.json"), "utf8"));
// Prefer V2 marketplace (EIP-2981 royalty enforcement) when its artifact exists,
// fall back to V1 for backward compatibility.
const marketplaceV2Path = path.join(artifactsDir, "NFTMarketplaceV2.json");
const marketplaceArtifact = fs.existsSync(marketplaceV2Path)
  ? JSON.parse(fs.readFileSync(marketplaceV2Path, "utf8"))
  : JSON.parse(fs.readFileSync(path.join(artifactsDir, "NFTMarketplace.json"), "utf8"));
const isMarketplaceV2 = marketplaceArtifact.contractName === "NFTMarketplaceV2";

// Set DEPLOY_MARKETPLACE=false to deploy only lazy mint (cheapest path).
const DEPLOY_MARKETPLACE = (process.env.DEPLOY_MARKETPLACE || "true").toLowerCase() !== "false";

const ALL_NETWORKS = {
  ethereum:    { rpc: process.env.ETHEREUM_RPC_URL    || "https://ethereum-rpc.publicnode.com",      chainId: 1     },
  polygon:     { rpc: process.env.POLYGON_RPC_URL     || "https://polygon-bor-rpc.publicnode.com",   chainId: 137   },
  bsc:         { rpc: process.env.BSC_RPC_URL         || "https://bsc-rpc.publicnode.com",          chainId: 56    },
  arbitrum:    { rpc: process.env.ARBITRUM_RPC_URL    || "https://arbitrum-one-rpc.publicnode.com", chainId: 42161 },
  base:        { rpc: process.env.BASE_RPC_URL        || "https://base-rpc.publicnode.com",         chainId: 8453  },
  optimism:    { rpc: process.env.OPTIMISM_RPC_URL    || "https://optimism-rpc.publicnode.com",     chainId: 10    },
  avalanche:   { rpc: process.env.AVALANCHE_RPC_URL   || "https://avalanche-c-chain-rpc.publicnode.com", chainId: 43114 },
  assetchain:  { rpc: process.env.ASSETCHAIN_RPC_URL  || "https://mainnet-rpc.assetchain.org",     chainId: 42420 },
  hyperliquid: { rpc: process.env.HYPERLIQUID_RPC_URL || "https://rpc.hyperliquid.xyz/evm",         chainId: 999   },
};

function pickNetworks() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("all")) return Object.keys(ALL_NETWORKS);
  const unknown = args.filter(a => !ALL_NETWORKS[a]);
  if (unknown.length) {
    console.error(`❌ Unknown network(s): ${unknown.join(", ")}`);
    console.error(`   Available: ${Object.keys(ALL_NETWORKS).join(", ")}`);
    process.exit(1);
  }
  return args;
}

const results = {};

async function deployTo(name) {
  const { rpc, chainId } = ALL_NETWORKS[name];
  console.log(`\n🚀 ${name.toUpperCase()} (chainId ${chainId})`);

  try {
    const provider = new ethers.providers.JsonRpcProvider(rpc, chainId);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`📝 Deployer: ${wallet.address}`);

    const balance = await wallet.getBalance();
    const balanceEth = parseFloat(ethers.utils.formatEther(balance));
    console.log(`💰 Balance: ${balanceEth}`);
    if (balanceEth === 0) throw new Error("Wallet has 0 balance on this network");

    const envFeeReceiver = process.env.PLATFORM_FEE_RECEIVER;
    const platformFeeReceiver = ethers.utils.isAddress(envFeeReceiver) ? envFeeReceiver : wallet.address;
    if (envFeeReceiver && !ethers.utils.isAddress(envFeeReceiver)) {
      console.log(`⚠️  PLATFORM_FEE_RECEIVER in .env is not a valid address — using deployer instead`);
    }
    const platformFeeBps = parseInt(process.env.PLATFORM_FEE_BPS || "250", 10); // 2.5% default

    // Use the network's actual gas price (legacy mode) so we don't get crushed
    // by ethers' inflated EIP-1559 maxFeePerGas default on cheap L2s.
    const currentGasPrice = await provider.getGasPrice();
    console.log(`⛽ Using gas price: ${ethers.utils.formatUnits(currentGasPrice, "gwei")} gwei`);

    const deployArtifact = async (label, artifact, args) => {
      const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
      const deployTx = Factory.getDeployTransaction(...args);
      const estimatedGas = await provider.estimateGas({ ...deployTx, from: wallet.address });
      const estimatedCost = estimatedGas.mul(currentGasPrice);
      console.log(`⏳ ${label}: est gas ${estimatedGas}, est cost ${ethers.utils.formatEther(estimatedCost)}`);
      const c = await Factory.deploy(...args, {
        gasPrice: currentGasPrice,
        gasLimit: estimatedGas.mul(12).div(10),
      });
      await c.deployed();
      console.log(`✅ ${label}: ${c.address}`);
      return c;
    };

    const lazyMint = await deployArtifact("MultiPieceLazyMintNFT", lazyMintArtifact, [platformFeeReceiver, platformFeeBps]);

    let vendor = null;
    let marketplace = null;
    if (DEPLOY_MARKETPLACE) {
      vendor = await deployArtifact("VendorNFT", vendorArtifact, [wallet.address]);
      // V2 constructor takes (platformFeeReceiver) only; V1 takes (vendor, owner).
      const marketplaceArgs = isMarketplaceV2 ? [platformFeeReceiver] : [vendor.address, wallet.address];
      marketplace = await deployArtifact(
        isMarketplaceV2 ? "NFTMarketplaceV2" : "NFTMarketplace",
        marketplaceArtifact,
        marketplaceArgs
      );
    }

    results[name] = {
      network: name,
      chainId,
      address: lazyMint.address,
      multiPieceLazyMint: lazyMint.address,
      vendorNFT: vendor?.address || null,
      nftMarketplace: marketplace?.address || null,
      deployer: wallet.address,
      platformFeeReceiver,
      platformFeeBps,
      deployedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    results[name] = { network: name, error: e.message, failed: true };
  }
}

function writeEnv() {
  let env = `# Deployed Contract Addresses - ${new Date().toISOString()}\n\n`;

  const first = Object.values(results).find(r => r && !r.failed);
  env += `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=${first?.multiPieceLazyMint || ""}\n\n`;

  env += `# Per-network lazy mint contracts\n`;
  Object.entries(results).forEach(([net, r]) => {
    if (r && !r.failed) env += `VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_${net.toUpperCase()}=${r.multiPieceLazyMint}\n`;
  });

  if (DEPLOY_MARKETPLACE) {
    env += `\n# Per-network marketplace contracts\n`;
    Object.entries(results).forEach(([net, r]) => {
      if (r && !r.failed && r.nftMarketplace) env += `VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_${net.toUpperCase()}=${r.nftMarketplace}\n`;
    });

    env += `\n# Per-network vendor NFT contracts\n`;
    Object.entries(results).forEach(([net, r]) => {
      if (r && !r.failed && r.vendorNFT) env += `VITE_APP_VENDORNFT_CONTRACT_ADDRESS_${net.toUpperCase()}=${r.vendorNFT}\n`;
    });
  }

  fs.writeFileSync(path.join(process.cwd(), "frontend", ".env.lazymint"), env);
  console.log(`\n📄 Env vars saved to: frontend/.env.lazymint`);
}

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  const networks = pickNetworks();
  console.log(`🌐 Lazy-Mint-Only Deployment`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Networks: ${networks.join(", ")}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  for (const net of networks) {
    await deployTo(net);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n🎉 Summary`);
  let ok = 0, fail = 0;
  Object.entries(results).forEach(([net, r]) => {
    if (r && !r.failed) {
      ok++;
      console.log(`✅ ${net.toUpperCase()}:`);
      console.log(`   MultiPieceLazyMint: ${r.multiPieceLazyMint}`);
      if (r.vendorNFT) console.log(`   VendorNFT:          ${r.vendorNFT}`);
      if (r.nftMarketplace) console.log(`   NFTMarketplace:     ${r.nftMarketplace}`);
    } else {
      fail++;
      console.log(`❌ ${net.toUpperCase()}: ${r?.error || "unknown"}`);
    }
  });
  console.log(`\n📊 ${ok} succeeded, ${fail} failed`);

  if (ok > 0) writeEnv();

  const dir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `lazy-mint-${Date.now()}.json`),
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
