# Testnet Deployment Guide

## Overview

This guide covers deploying the Durchex NFT Marketplace to the Sepolia testnet for testing and validation before mainnet launch.

## Prerequisites

- Node.js v16+ and npm/yarn
- Hardhat configured and installed
- An Infura or Alchemy RPC endpoint
- An Etherscan API key for contract verification
- ETH on Sepolia testnet for gas fees

## Quick Start

### 1. Setup Environment Variables

Create a `.env` file in the project root:

```bash
# Sepolia RPC Endpoint
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Deployment Account Private Key (admin wallet)
SEPOLIA_PRIVATE_KEY=0x... (64-character hex string)

# Etherscan API Key for verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Optional: Gas settings
GAS_PRICE_GWEI=30
GAS_LIMIT=8000000

# Optional: Report gas usage
REPORT_GAS=true
COINMARKETCAP_API_KEY=YOUR_COINMARKETCAP_API_KEY
```

### 2. Generate Test Wallets

```bash
npx hardhat run scripts/setup-test-wallets.js
```

This generates:
- 10 test wallets (1 admin, 1 moderator, 8 users)
- Faucet funding instructions
- Test seed data (users, collections, NFTs)
- Environment template

**Files created:**
- `config/test-wallets.json` - Wallet private keys (⚠️ KEEP SECRET)
- `config/faucet-info.json` - Funding instructions
- `config/test-seed-data.json` - Database seed data

### 3. Fund Test Wallets

Use Sepolia faucets to fund wallets with 0.5-1 ETH:

**Recommended faucets:**
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [pk910 Faucet](https://sepolia-faucet.pk910.de)

**Required funding:**
- Admin wallet: 2-3 ETH (for deployments and gas)
- Test users: 0.5 ETH each (for interactions)

### 4. Deploy Contracts

```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

**Output includes:**
- Contract deployment addresses
- Transaction hashes
- Block numbers
- Verification instructions

**Deployed contracts:**
1. LazyMintNFT - Zero-gas minting with ECDSA
2. Auction - English auctions with auto-extension
3. Offer - P2P trading with counter-offers
4. Collection - NFT collection management
5. Royalties - Creator royalty distribution

### 5. Verify Contracts on Etherscan

Option A: Auto-verify during deployment
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

Option B: Batch verify after deployment
```bash
npx hardhat run scripts/verify-contracts.js --network sepolia
```

## Configuration Files

### hardhat.config.testnet.js

Network configuration for Sepolia:
- RPC endpoint and chain ID (11155111)
- Gas settings
- Etherscan verification API
- Optimizer settings (200 runs for balanced gas)

### Scripts

#### deploy-sepolia.js (250 lines)
- Deploys all 5 smart contracts
- Sets up inter-contract connections
- Saves deployment info to JSON
- Exports addresses to frontend
- Provides verification instructions

#### setup-test-wallets.js (250 lines)
- Generates 10 test wallets
- Creates test users (10), NFTs (30), collections (3)
- Provides faucet funding instructions
- Generates .env template

#### verify-contracts.js (150 lines)
- Verifies contracts on Etherscan
- Handles already-verified contracts
- Rate-limit aware (2s delays)
- Summary report

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Admin wallet funded with 2-3 ETH
- [ ] Test wallets generated
- [ ] Test wallets funded with 0.5 ETH each
- [ ] Contracts deployed successfully
- [ ] Contracts verified on Etherscan
- [ ] Frontend contract addresses updated
- [ ] Backend .env updated with contract addresses
- [ ] Database seeded with test data
- [ ] Frontend functional testing passed
- [ ] Backend API testing passed

## Post-Deployment Steps

### 1. Update Frontend

Update contract addresses in frontend:

```json
// frontend/src/contracts/addresses.json
{
  "sepolia": {
    "LazyMintNFT": "0x...",
    "Auction": "0x...",
    "Offer": "0x...",
    "Collection": "0x...",
    "Royalties": "0x..."
  }
}
```

### 2. Configure Backend

Update backend .env:

```
SEPOLIA_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
LAZY_MINT_ADDRESS=0x...
AUCTION_ADDRESS=0x...
OFFER_ADDRESS=0x...
COLLECTION_ADDRESS=0x...
ROYALTIES_ADDRESS=0x...
```

### 3. Seed Test Data

Import test seed data to MongoDB:

```bash
node scripts/import-test-data.js
```

### 4. Testing

Run integration tests:

```bash
npm run test:integration
```

Test scenarios:
- Lazy minting with ECDSA signature
- Auction bidding and extension
- Offer creation and counter-offers
- Collection creation and verification
- Royalty distribution on sale

## Monitoring & Debugging

### View Deployment Progress

```bash
# Check contract deployment
https://sepolia.etherscan.io/address/{CONTRACT_ADDRESS}

# View transaction
https://sepolia.etherscan.io/tx/{TX_HASH}

# View account
https://sepolia.etherscan.io/address/{WALLET_ADDRESS}
```

### Common Issues

**Insufficient gas:**
```
Error: insufficient funds for gas * price + value
Solution: Fund wallet with more ETH
```

**Nonce too low:**
```
Error: nonce too low
Solution: Wait for pending transactions or reset nonce
```

**Contract already verified:**
```
Already Verified
Solution: Normal - contract is already verified on Etherscan
```

## Network Information

**Sepolia Testnet Details:**
- Chain ID: 11155111
- Currency: SepoliaETH (sepETH)
- Block time: ~12 seconds
- RPC endpoints:
  - Infura: `https://sepolia.infura.io/v3/{PROJECT_ID}`
  - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/{API_KEY}`
  - Public: `https://rpc.sepolia.dev`
- Block explorer: https://sepolia.etherscan.io
- Faucets: See faucet-info.json

## Gas Estimates

Approximate gas costs on Sepolia:

| Operation | Gas | Cost (at 30 gwei) |
|-----------|-----|------------------|
| Deploy LazyMintNFT | 2.5M | ~0.075 ETH |
| Deploy Auction | 2.8M | ~0.084 ETH |
| Deploy Offer | 2.6M | ~0.078 ETH |
| Deploy Collection | 2.2M | ~0.066 ETH |
| Deploy Royalties | 2.0M | ~0.06 ETH |
| Lazy Mint (on-chain) | 180k | ~0.0054 ETH |
| Place Bid | 120k | ~0.0036 ETH |
| Create Offer | 90k | ~0.0027 ETH |

**Total deployment cost: ~0.4 ETH**

## Next Steps

After successful testnet deployment:

1. **Extended Testing** - Run full test suite on testnet
2. **Security Audit** - Contract audit before mainnet
3. **Load Testing** - Test with realistic transaction volumes
4. **UI/UX Testing** - User acceptance testing
5. **Mainnet Deployment** - Deploy to Ethereum mainnet

## Support

For issues or questions:
- Check Etherscan for transaction details
- Review deployment logs in `deployments/sepolia/`
- Consult Hardhat documentation: https://hardhat.org/docs
- Sepolia faucet docs: https://ethereum-sepolia.publicnode.com/

## Security Notes

⚠️ **Important:**
- Never commit private keys to Git
- Use `.env` for sensitive data (in .gitignore)
- Rotate test wallets regularly
- Never use testnet private keys on mainnet
- Keep Etherscan API key private
