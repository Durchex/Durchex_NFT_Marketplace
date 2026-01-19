# Mainnet Deployment Guide

## Overview

This guide covers deploying the Durchex NFT Marketplace to Ethereum Mainnet with comprehensive safety checks, multi-signature governance, and production readiness verification.

## Prerequisites

- Testnet deployment completed and verified on Sepolia
- 3-5 community members ready to be multi-sig signers
- Minimum 3 ETH for contract deployment + gas fees
- Etherscan API key for verification
- All security audits completed

## Pre-Deployment Checklist

### 1. Run Production Readiness Check

```bash
chmod +x scripts/production-readiness-check.sh
bash scripts/production-readiness-check.sh
```

**Expected Output:**
```
✓ Node.js version >= 18
✓ npm installed
✓ Hardhat installed
✓ .env file exists
✓ MAINNET_RPC_URL set
✓ MAINNET_PRIVATE_KEY set
✓ MAINNET_MULTISIG_ADDRESS set
✓ ETHERSCAN_API_KEY set
✓ Contracts compile
✓ Contract tests pass
✓ No hardcoded secrets
✓ Access controls implemented
...
🎉 All checks passed! Ready for mainnet deployment.
```

### 2. Verify from Testnet

```bash
# Review testnet deployment
cat deployments/sepolia-latest.json

# Validate migration compatibility
npx hardhat run scripts/migrate-to-mainnet.js
```

### 3. Set Environment Variables

```bash
# Update .env with mainnet values
cat >> .env <<EOF

# Mainnet Configuration
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY
MAINNET_PRIVATE_KEY=0x... # Deployer private key
MAINNET_PLATFORM_WALLET=0x... # Platform fee recipient
MAINNET_MULTISIG_ADDRESS=0x... # Multi-sig contract address

# Multi-Sig Signers
MULTISIG_SIGNER_1=0x...
MULTISIG_SIGNER_2=0x...
MULTISIG_SIGNER_3=0x...
MULTISIG_SIGNER_4=0x...
MULTISIG_SIGNER_5=0x...

# Etherscan Verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
EOF
```

## Step 1: Setup Multi-Signature Governance

```bash
# Create multi-sig wallet with 3-of-5 required confirmations
npx hardhat run scripts/setup-multisig.js --network mainnet

# Expected output shows:
# - Multi-sig wallet address
# - List of signers
# - Required confirmations (3 of 5)
# - Daily transaction limit (100 ETH)
```

**Sample Output:**
```
Setting up Multi-Signature Governance Wallet...

Multi-Sig Signers (5 of 5):
  1. 0x1234... (Founder)
  2. 0x5678... (Lead Developer)
  3. 0x9abc... (Treasury Lead)
  4. 0xdef0... (Community Manager)
  5. 0x1111... (Security Lead)

✓ Required confirmations: 3 of 5
✓ Daily limit: 100 ETH

Deploying MultiSigWallet...
✓ MultiSigWallet deployed: 0x2222...

✅ Multi-Sig Wallet setup complete!
```

**SAVE THIS ADDRESS** - it will own all contract instances.

## Step 2: Deploy Contracts to Mainnet

```bash
# Deploy all contracts (takes ~10-15 minutes)
npx hardhat run scripts/deploy-mainnet.js --network mainnet

# Expected output:
# ✓ LazyMintNFT deployed: 0x...
# ✓ Auction deployed: 0x...
# ✓ Offer deployed: 0x...
# ✓ Collection deployed: 0x...
# ✓ Royalties deployed: 0x...
# ✓ All contracts transferred to multi-sig
```

**Gas Estimates:**
- LazyMintNFT: ~1.2M gas
- Auction: ~1.5M gas
- Offer: ~1.8M gas
- Collection: ~0.9M gas
- Royalties: ~1.1M gas
- **Total**: ~6.5M gas (~0.3-0.5 ETH @ current gas prices)

### Monitoring Deployment

```bash
# Watch deployment progress
npx hardhat run scripts/deploy-mainnet.js --network mainnet | tee deployment.log

# Check transaction status
# https://etherscan.io/tx/0x... (from logs)
```

## Step 3: Verify Contracts on Etherscan

```bash
# Verify all contracts
npx hardhat verify --network mainnet 0xLAZY_MINT_ADDRESS "0xPLATFORM_WALLET"
npx hardhat verify --network mainnet 0xAUCTION_ADDRESS "0xLAZY_MINT_ADDRESS" "0xPLATFORM_WALLET"
npx hardhat verify --network mainnet 0xOFFER_ADDRESS "0xLAZY_MINT_ADDRESS" "0xPLATFORM_WALLET"
npx hardhat verify --network mainnet 0xCOLLECTION_ADDRESS "0xPLATFORM_WALLET"
npx hardhat verify --network mainnet 0xROYALTIES_ADDRESS "0xLAZY_MINT_ADDRESS" "0xAUCTION_ADDRESS" "0xOFFER_ADDRESS" "0xPLATFORM_WALLET"

# Alternatively, use the verification URLs provided in deployment logs
```

**Verification Checklist:**
- [ ] All contracts appear as "Verified" on Etherscan
- [ ] Source code matches deployed bytecode
- [ ] Contract constructor parameters are correct
- [ ] Contract ownership shows multi-sig address

## Step 4: Update Frontend with Mainnet Addresses

```bash
# Frontend addresses automatically updated during deployment
cat frontend/src/contracts/addresses.mainnet.json

# Verify addresses match deployment output
```

### Update Environment

```bash
# Update frontend .env for production
cat > frontend/.env.production <<EOF
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://api.durchex.com
REACT_APP_ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
REACT_APP_CHAIN_ID=1
REACT_APP_CONTRACT_ADDRESSES=$(cat frontend/src/contracts/addresses.mainnet.json | jq -c .)
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud
REACT_APP_SENTRY_DSN=https://xxx@sentry.io/xxx
REACT_APP_GA_ID=G-PROD_ID
EOF
```

## Step 5: Backend Configuration

```bash
# Update backend contract addresses
cat > backend/config/contracts.mainnet.json <<EOF
{
  "lazyMint": "0x...",
  "auction": "0x...",
  "offer": "0x...",
  "collection": "0x...",
  "royalties": "0x...",
  "chainId": 1,
  "network": "mainnet"
}
EOF

# Update blockchain listener to mainnet
# 1. Change ETHEREUM_RPC_URL in backend .env
# 2. Update contract addresses in listener service
# 3. Restart blockchain listener service
```

## Step 6: Post-Deployment Verification

### Verify Contract Functionality

```javascript
// Test contract interactions (use frontend or script)
// 1. Test lazy mint authorization
// 2. Test auction creation
// 3. Test offer submissions
// 4. Test royalty distribution
// 5. Verify all events emit correctly
```

### Check Network Activity

```bash
# Monitor transactions on Etherscan
# https://etherscan.io/address/0x... (for each contract)

# Verify gas usage aligns with estimates
# Check for any reverted transactions
```

### Validate Data Integrity

```bash
# Connect to production database
# 1. Verify user accounts migrated correctly
# 2. Check collection metadata in IPFS
# 3. Validate auction/offer states
# 4. Confirm royalty configurations
```

## Step 7: Multi-Sig Wallet Operations

### Authorize Multi-Sig Signers

Each signer needs to confirm their participation:

```bash
# Signer 1 (via Web3 wallet or CLI):
# 1. Open multi-sig dashboard (TBD)
# 2. Confirm signer status
# 3. Add public key if not already done

# Repeat for signers 2-5
```

### Test Multi-Sig Execution

```bash
# Create test transaction
# 1. Submit test proposal (e.g., pause contract)
# 2. Collect 3 signatures
# 3. Execute transaction
# 4. Verify success on Etherscan
```

## Step 8: Go-Live Procedures

### Enable Live Trading

```bash
# 1. Confirm all contracts verified
# 2. Verify multi-sig operational
# 3. Test mainnet transactions with small amounts
# 4. Gradually increase transaction volume
# 5. Monitor gas prices and adjust settings
```

### Monitoring & Alerts

```bash
# Setup alerts for:
# - Failed transactions
# - Unusual gas usage
# - Unauthorized access attempts
# - Contract pause events
```

### Communication

- [ ] Announce mainnet deployment to community
- [ ] Share contract addresses
- [ ] Provide links to Etherscan verified contracts
- [ ] Post launch celebration post

## Rollback Procedure

If critical issues are discovered:

```bash
# 1. Pause all contracts via multi-sig
# 2. Collect 3+ signatures for pause
# 3. Deploy bugfix contracts
# 4. Migrate user state if needed
# 5. Resume on fixed contracts
```

## Security Reminders

⚠️ **CRITICAL:**

- [ ] Never share private keys in version control
- [ ] Multi-sig setup complete before deployment
- [ ] All contracts verified on Etherscan
- [ ] Security audit completed
- [ ] Backup deployment files
- [ ] Backup multi-sig wallet details
- [ ] Document all emergency procedures
- [ ] Setup monitoring and alerts

## Estimated Costs

| Component | Gas (units) | Cost @ 30 Gwei | Cost @ 50 Gwei |
|-----------|-------------|----------------|----------------|
| LazyMintNFT | 1,200,000 | 0.036 ETH | 0.060 ETH |
| Auction | 1,500,000 | 0.045 ETH | 0.075 ETH |
| Offer | 1,800,000 | 0.054 ETH | 0.090 ETH |
| Collection | 900,000 | 0.027 ETH | 0.045 ETH |
| Royalties | 1,100,000 | 0.033 ETH | 0.055 ETH |
| **Total** | **6,500,000** | **0.195 ETH** | **0.325 ETH** |

**Note:** Add 10% buffer for safety. Actual costs vary with network congestion.

## Support & Troubleshooting

### Common Issues

**Q: Insufficient funds for deployment**
- A: Deposit more ETH to deployer account (minimum 3 ETH recommended)

**Q: Contract verification fails**
- A: Verify correct constructor parameters and source code matches

**Q: Multi-sig setup incomplete**
- A: Ensure all 5 signers are configured and have confirmed participation

## Contact & Emergency

- **Technical Support**: [support@durchex.com](mailto:support@durchex.com)
- **Emergency Contacts**: [Listed in separate secure doc]
- **Security Issues**: [security@durchex.com](mailto:security@durchex.com)

## Success Criteria

✅ Deployment complete when:
1. All 5 contracts deployed to mainnet
2. All contracts verified on Etherscan
3. Multi-sig wallet operational
4. Frontend updated with mainnet addresses
5. Backend connected to mainnet
6. Live transactions successful
7. Community can interact with contracts
