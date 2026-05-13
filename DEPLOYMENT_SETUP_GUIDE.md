# Complete Deployment & Environment Setup Guide

## Overview
This guide explains how to deploy your NFT marketplace contracts to multiple blockchains and configure all necessary environment variables for full marketplace functionality.

## Prerequisites

- **Node.js 18+** installed
- **npm 11+** installed
- A deployer wallet with sufficient funds across networks you want to deploy to
- Hardhat properly configured (included in package.json)

## Step 1: Local Setup

### 1.1 Create Environment File

```bash
cp .env.example .env
```

### 1.2 Add Your Private Key

Edit `.env` and add your deployer wallet's private key:

```env
PRIVATE_KEY=your_private_key_without_0x_prefix_here
PLATFORM_FEE_RECEIVER=0xYourFeeReceiverWalletAddress
```

**Security Note:** Never commit `.env` to version control. The `.gitignore` should already exclude it.

### 1.3 Install Dependencies

```bash
npm install
```

This installs all required packages including Hardhat, ethers.js, and other deployment tools.

## Step 2: Review Deployment Costs

Before deployment, check estimated costs for each network:

```bash
node scripts/accurate-deployment-costs.js
```

This shows:
- Gas costs per network
- Native token required amounts
- Which networks are cheapest

**Current Estimated Costs:**
- **Polygon**: 0.0091 MATIC (cheapest)
- **Base**: 0.699 ETH  
- **Arbitrum**: 0.932 ETH
- **Optimism**: 0.932 ETH
- **Ethereum**: 11.655 ETH (most expensive)
- **BSC**: 0.639 BNB
- **Avalanche**: 0.177 AVAX
- **HyperLiquid**: 6.993 ETH

## Step 3: Deploy Contracts

### 3.1 Deploy All Networks (with Balance Checks)

```bash
node scripts/deploy-all-with-balance-check.js
```

This script:
- ✅ Checks wallet balance on each network
- ✅ Skips networks where balance is insufficient
- ✅ Deploys VendorNFT, NFTMarketplace, and MultiPieceLazyMintNFT
- ✅ Generates env vars file with all contract addresses
- ✅ Saves deployment logs to `deployments/` folder

### 3.2 Deploy to Specific Network Only

```bash
# Deploy to Base (example)
npm run deploy:hyperliquid

# Or manually:
hardhat run scripts/deploy-multiPieceLazyMint-base.js --network base
```

## Step 4: Configure Frontend Environment

### 4.1 Copy Generated Env Vars

After successful deployment:

```bash
cp frontend/.env.deployed frontend/.env
```

### 4.2 Complete Frontend .env

Update `frontend/.env` with the following:

```env
# Contract Addresses (auto-populated from deployment)
VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_BASE=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_POLYGON=0x...
# ... etc for all networks

# Marketplace (auto-populated)
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BASE=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON=0x...
# ... etc

# VendorNFT (auto-populated)
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BASE=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON=0x...
# ... etc

# RPC URLs (REQUIRED - fill these in)
VITE_RPC_URL_ETHEREUM=https://rpc.ankr.com/eth
VITE_RPC_URL_POLYGON=https://rpc.ankr.com/polygon
VITE_RPC_URL_BSC=https://rpc.ankr.com/bsc
VITE_RPC_URL_ARBITRUM=https://rpc.ankr.com/arbitrum
VITE_RPC_URL_BASE=https://mainnet.base.org
VITE_RPC_URL_OPTIMISM=https://rpc.ankr.com/optimism
VITE_RPC_URL_AVALANCHE=https://rpc.ankr.com/avalanche
VITE_RPC_URL_HYPERLIQUID=https://rpc.hyperliquid.xyz/evm

# API Configuration (REQUIRED)
VITE_API_BASE_URL=https://your-deployed-backend-api.com/api/v1

# WebSocket (optional - for multiplayer)
VITE_SOCKET_URL=https://your-deployed-api.com
```

## Complete Environment Variables Reference

### Lazy Mint Contracts

These are critical for the "Buy & Mint" feature:

```env
# Default lazy mint (fallback)
VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=0x...

# Per-network multi-piece lazy mint
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_ETHEREUM=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_POLYGON=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_BSC=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_ARBITRUM=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_BASE=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_OPTIMISM=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_AVALANCHE=0x...
VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS_HYPERLIQUID=0x...
```

### Marketplace Contracts

For NFT buying/selling:

```env
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ETHEREUM=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BSC=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ARBITRUM=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BASE=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_OPTIMISM=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_AVALANCHE=0x...
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x...
```

### Vendor NFT Contracts

For creators to mint/manage NFTs:

```env
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ETHEREUM=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BSC=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ARBITRUM=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BASE=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_OPTIMISM=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_AVALANCHE=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x...
```

### RPC URLs

Essential for network connectivity:

```env
VITE_RPC_URL_ETHEREUM=https://rpc.ankr.com/eth
VITE_RPC_URL_POLYGON=https://rpc.ankr.com/polygon
VITE_RPC_URL_BSC=https://rpc.ankr.com/bsc
VITE_RPC_URL_ARBITRUM=https://rpc.ankr.com/arbitrum
VITE_RPC_URL_BASE=https://mainnet.base.org
VITE_RPC_URL_OPTIMISM=https://rpc.ankr.com/optimism
VITE_RPC_URL_AVALANCHE=https://rpc.ankr.com/avalanche
VITE_RPC_URL_HYPERLIQUID=https://rpc.hyperliquid.xyz/evm
```

### Backend API

**CRITICAL for marketplace to function:**

```env
# Backend API endpoint
VITE_API_BASE_URL=https://your-api-domain.com/api/v1

# WebSocket for real-time features
VITE_SOCKET_URL=https://your-api-domain.com
```

## Step 5: Verify Deployment

### 5.1 Check Deployment Logs

```bash
ls -la deployments/
# Look for: {network}-deployment.json files
```

### 5.2 Verify Contracts on Block Explorers

After deployment, you can verify contracts:

- **Ethereum**: https://etherscan.io/address/{contractAddress}
- **Polygon**: https://polygonscan.com/address/{contractAddress}
- **Base**: https://basescan.org/address/{contractAddress}
- **Arbitrum**: https://arbiscan.io/address/{contractAddress}
- **Optimism**: https://optimistic.etherscan.io/address/{contractAddress}
- **BSC**: https://bscscan.com/address/{contractAddress}
- **Avalanche**: https://snowtrace.io/address/{contractAddress}

### 5.3 Test Frontend

```bash
cd frontend
npm run dev
```

Navigate to BuyMintPage and verify:
- ✅ Wallet connects
- ✅ Contract addresses load correctly
- ✅ No console errors
- ✅ Can interact with contracts

## Troubleshooting

### Problem: "Cannot find package 'hardhat'"

**Solution:**
```bash
npm install
```

### Problem: Insufficient Balance Error

**Solution:** The script automatically skips networks where your wallet balance is too low. Fund your deployer wallet on those networks and run again.

### Problem: Private Key Not Found

**Solution:** Ensure `.env` file exists and has `PRIVATE_KEY=your_key_here`

### Problem: RPC Connection Errors

**Solution:** Verify RPC URLs are correct in `frontend/.env`. Try using alternative RPC providers:
- **Ankr**: https://rpc.ankr.com/{network}
- **Alchemy**: https://alchemy.com/ (needs API key)
- **Infura**: https://infura.io/ (needs API key)

## Security Best Practices

1. **Never commit `.env` files** - They contain private keys
2. **Use different wallets** for development and production
3. **Keep private keys secure** - Use hardware wallets in production
4. **Verify contract addresses** before using in frontend
5. **Test on testnets first** before mainnet deployment
6. **Use `.env.local`** for local overrides (add to `.gitignore`)

## What Each Deployed Contract Does

### MultiPieceLazyMintNFT
- Allows creators to mint NFTs in pieces/editions
- Supports lazy minting (mint on demand)
- Handles royalties and platform fees
- Platform fee: 2.5% (250 bps)

### NFTMarketplace
- Enables buying/selling of NFTs
- Handles payments and transactions
- Manages order books and offers
- Supports multiple payment tokens

### VendorNFT
- Stores creator/vendor information
- Manages NFT metadata
- Handles ownership and transfers
- Base contract for NFT management

## Next Steps After Deployment

1. ✅ Verify contracts on block explorers
2. ✅ Update `frontend/.env` with all addresses
3. ✅ Test Buy & Mint functionality
4. ✅ Test Marketplace trading
5. ✅ Test WalletConnect on multiple networks
6. ✅ Deploy backend API
7. ✅ Configure WebSocket server (if using multiplayer)
8. ✅ Deploy frontend to production
9. ✅ Run end-to-end tests
10. ✅ Monitor contract activity

## Deployment Cost Optimization

To minimize costs:

1. **Deploy to cheaper networks first**
   - Polygon (lowest gas)
   - Base (very low)
   - Arbitrum (low)

2. **Skip expensive networks initially**
   - Ethereum (most expensive, only if high revenue expected)
   - HyperLiquid (expensive)

3. **Batch deployments** if possible to shared contract instances

## Support Resources

- **Hardhat Docs**: https://hardhat.org/
- **Ethers.js Docs**: https://docs.ethers.org/
- **Network RPC Providers**: https://chainlist.org/
- **Block Explorers**: https://www.chainbase.com/chainlist

---

**Last Updated:** 2026-05-11  
**Deployment Script:** `scripts/deploy-all-with-balance-check.js`  
**Status:** Ready for production deployment
