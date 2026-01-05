# ETH Cost Estimates for Contract Deployment

## Deployment Gas Requirements

Each deployment requires 2 smart contracts:
- **VendorNFT**: ~2.5M gas
- **NFTMarketplace**: ~3.5M gas
- **Total**: ~6M gas

---

## Network-by-Network Breakdown

### 1. **BASE** (where you had insufficient funds)
- **Current Gas Price**: ~20-50 gwei (very cheap)
- **Estimated Cost**: 0.12 - 0.30 ETH
- **Recommended Amount**: **0.5 ETH** (with buffer)
- **Status**: CHEAPEST - Base is optimized for low costs

### 2. **POLYGON**
- **Current Gas Price**: ~100-300 gwei
- **Estimated Cost**: 0.60 - 1.80 ETH equivalent (paid in MATIC)
- **USD Equivalent**: $0.30 - $0.90 (very cheap)
- **Recommended Amount**: **2 MATIC** (~$1 USD)
- **Status**: VERY CHEAP - Most economical option

### 3. **ARBITRUM**
- **Current Gas Price**: ~0.1-1 gwei (heavily subsidized)
- **Estimated Cost**: 0.0006 - 0.006 ETH
- **Recommended Amount**: **0.02 ETH** (with buffer)
- **Status**: ULTRA-CHEAP - Best L2 pricing

### 4. **BSC** (Binance Smart Chain)
- **Current Gas Price**: ~1-5 gwei
- **Estimated Cost**: 0.006 - 0.03 ETH
- **Recommended Amount**: **0.05 ETH** (with buffer)
- **Status**: CHEAP - Good alternative

### 5. **ETHEREUM** (Mainnet)
- **Current Gas Price**: **50-150 gwei** (typical)
- **Estimated Cost**: **0.3 - 0.9 ETH**
- **USD Equivalent**: **$1,000 - $3,000** at current ETH prices
- **Recommended Amount**: **1.5 ETH** (with 50% buffer)
- **Status**: MOST EXPENSIVE

---

## Total Deployment Cost Summary

| Network | Min Cost | Recommended | Currency |
|---------|----------|------------|----------|
| Arbitrum | 0.001 ETH | 0.02 ETH | ETH |
| Base | 0.12 ETH | 0.5 ETH | ETH |
| BSC | 0.006 ETH | 0.05 ETH | BNB |
| Polygon | 0.6 ETH | 2 MATIC | MATIC |
| Ethereum | 0.3 ETH | 1.5 ETH | ETH |

---

## Deployment Strategy (Cost Optimized)

### Option 1: Deploy to Low-Cost Networks First (RECOMMENDED)
1. **Arbitrum** - 0.02 ETH (test deployment)
2. **Base** - 0.5 ETH (main alternative)
3. **BSC** - 0.05 ETH (backup option)
4. **Polygon** - 2 MATIC (alternative layer 2)
5. **Ethereum** - 1.5 ETH (optional - only if needed for prestige)

**Total ETH needed**: ~2.1 ETH (excluding Polygon which uses MATIC)

### Option 2: Minimal Deployment (Most Affordable)
Deploy only to:
1. **Arbitrum** - 0.02 ETH
2. **Base** - 0.5 ETH
3. **Polygon** - 2 MATIC

**Total**: 0.52 ETH + 2 MATIC

---

## Why You Have 0 Balance on Base

The account `0xC2302A56B866fAF67A11426709Bfd8E03f97C65D` has no funds because:
- ✅ You have $1+ of ETH somewhere (confirmed)
- ❌ But it's in a DIFFERENT wallet address
- ❌ You haven't transferred it to the deployment account

### To Fix:
1. Send **0.5+ ETH** from your funded wallet to: `0xC2302A56B866fAF67A11426709Bfd8E03f97C65D`
2. Wait 5-15 seconds for confirmation on Base
3. Try deployment again

---

## Gas Price Monitoring

To check current gas prices before deploying:

```bash
# Check Ethereum gas
curl https://api.etherscan.io/api?module=gastracker&action=gasoracle

# Check Polygon gas
curl https://gasstation.polygon.technology/v2

# Check Arbitrum gas
curl https://api.arbiscan.io/api?module=gastracker&action=gasoracle
```

---

## Important Notes

1. **Gas prices fluctuate** - Use 50% buffer for safety
2. **Failed transactions still cost gas** - Even if deployment fails
3. **Different tokens per network**:
   - Ethereum/Arbitrum/Base: ETH
   - Polygon: MATIC
   - BSC: BNB
4. **All accounts must be funded on their respective networks** - You can't use Polygon MATIC to pay for Ethereum gas
5. **Recommended minimum holdings**:
   - Ethereum: 2 ETH (for safety)
   - Arbitrum: 0.05 ETH
   - Base: 1 ETH
   - BSC: 0.1 BNB
   - Polygon: 5 MATIC

---

## Quick Reference

**For Base deployment specifically:**
- You need: **0.5 ETH minimum** on Base network
- Cost will be: **0.12-0.30 ETH**
- Send to: `0xC2302A56B866fAF67A11426709Bfd8E03f97C65D`
- Wait: 5-15 seconds
- Command: `npx hardhat run scripts/deploy.js --network base`
