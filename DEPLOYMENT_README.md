# Smart Contract Deployment Guide

This guide will help you deploy the NFT Marketplace and VendorNFT contracts to multiple blockchain networks.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Private Key** with sufficient funds on all target networks
3. **Environment Variables** configured

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your private key and API keys
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Deploy to All Networks
```bash
npm run deploy:all
```

## 🎯 Deployment Options

### Deploy to Specific Network
```bash
# Deploy to a single network
npm run deploy:network polygon

# Available networks: ethereum, polygon, bsc, arbitrum, base, optimism, avalanche, hyperliquid
```

### Deploy to HyperLiquid
```bash
npm run deploy:hyperliquid
```

### Deploy to Tezos
```bash
npm run deploy:tezos
```

## 📊 Current Deployment Status

| Network | VendorNFT | NFTMarketplace | Status |
|---------|-----------|----------------|--------|
| Ethereum | ✅ Deployed | ✅ Deployed | Live |
| Polygon | ✅ Deployed | ✅ Deployed | Live |
| BSC | ✅ Deployed | ✅ Deployed | Live |
| Arbitrum | ✅ Deployed | ✅ Deployed | Live |
| Base | ✅ Deployed | ✅ Deployed | Live |
| Optimism | ❌ Pending | ❌ Pending | Ready |
| Avalanche | ❌ Pending | ❌ Pending | Ready |
| HyperLiquid | ❌ Pending | ❌ Pending | Ready |
| Tezos | ❌ Pending | ❌ Pending | Ready |
| SIU | ❌ Custom | ❌ Custom | Needs Config |
| Monarch | ❌ Custom | ❌ Custom | Needs Config |

## 🔧 Environment Setup

### Required Environment Variables

```env
# REQUIRED: Your deployment private key
PRIVATE_KEY=your_private_key_without_0x_prefix

# OPTIONAL: For contract verification
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
# ... other API keys
```

### Funding Requirements

Ensure your deployment account has sufficient funds:

- **Ethereum**: ~0.01 ETH
- **Polygon**: ~0.01 MATIC
- **BSC**: ~0.01 BNB
- **Arbitrum**: ~0.01 ETH
- **Base**: ~0.01 ETH
- **Optimism**: ~0.01 ETH
- **Avalanche**: ~0.01 AVAX
- **HyperLiquid**: ~0.01 HYPE

## 📁 Project Structure

```
contracts/
├── NFTMarketplace.sol    # Main marketplace contract
└── VendorNFT.sol         # NFT creation contract

scripts/
├── deploy-all-networks.js    # Multi-network deployment
├── deploy-hyperliquid-mainnet.js
└── deploy-tezos-mainnet.js

deployments/              # Deployment logs and addresses
├── ethereum-deployment.json
├── polygon-deployment.json
└── ...
```

## 🔍 Contract Features

### NFTMarketplace Contract
- ✅ NFT listing and delisting
- ✅ Direct NFT purchases
- ✅ Offer system for negotiations
- ✅ Escrow system for secure payments
- ✅ User points and airdrop eligibility
- ✅ Admin controls and fee management

### VendorNFT Contract
- ✅ ERC-721 compliant NFTs
- ✅ Authorized vendor system
- ✅ Minting fees
- ✅ Developer minting capabilities
- ✅ Metadata management

## 🛠️ Troubleshooting

### Common Issues

1. **Insufficient Funds**
   ```
   Error: insufficient funds
   ```
   **Solution**: Add funds to your deployment account

2. **Network Not Configured**
   ```
   Error: Network not found
   ```
   **Solution**: Check hardhat.config.js network configuration

3. **Private Key Issues**
   ```
   Error: invalid private key
   ```
   **Solution**: Ensure PRIVATE_KEY is set without 0x prefix

### Manual Deployment

If automated deployment fails, deploy manually:

```bash
# Deploy VendorNFT first
npx hardhat run scripts/deploy.js --network polygon

# Then deploy Marketplace with VendorNFT address
# Edit the script with the VendorNFT address
npx hardhat run scripts/deploy.js --network polygon
```

## 📋 Post-Deployment

After successful deployment:

1. **Update Frontend**: Contract addresses are automatically updated in `frontend/.env`
2. **Verify Contracts**: Use Etherscan verification for transparency
3. **Test Transactions**: Test buying/selling NFTs on each network
4. **Update Documentation**: Update network status in README

## 🔐 Security Notes

- ✅ Contracts use OpenZeppelin standards
- ✅ Reentrancy protection implemented
- ✅ Access controls in place
- ✅ Emergency pause functionality available

## 📞 Support

For deployment issues:
1. Check deployment logs in `deployments/` folder
2. Verify network RPC URLs are accessible
3. Ensure sufficient gas funds
4. Check contract verification on block explorers

---

**Happy Deploying! 🚀**