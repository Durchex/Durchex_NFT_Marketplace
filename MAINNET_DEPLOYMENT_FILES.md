# Mainnet Deployment - File Structure & Reference

**Last Updated:** November 27, 2025

---

## 📋 Core Files (Created/Modified)

### Deployment Scripts
| File | Purpose | Type |
|------|---------|------|
| `scripts/deploy-hyperliquid-mainnet.js` | Deploy EVM contracts to HyperLiquid (testnet/mainnet) | Node.js / Hardhat |
| `scripts/deploy-tezos-mainnet.js` | Deploy Tezos contracts (testnet/mainnet) | Node.js / Taquito |

**Usage:**
```bash
# HyperLiquid
npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid_testnet
npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid

# Tezos
TEZOS_PRIVATE_KEY=edsk... TEZOS_RPC_URL=... node scripts/deploy-tezos-mainnet.js
```

### Environment Configuration
| File | What Changed | Status |
|------|--------------|--------|
| `frontend/.env` | Added mainnet/testnet RPC URLs and placeholder contract addresses | ✅ Updated |
| `frontend/src/Context/constants.jsx` | Added tezosMainnet, tezosTestnet, hyperliquidTestnet to rpcUrls and contractAddresses | ✅ Updated |

**Key Variables:**
```
VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm (mainnet)
VITE_RPC_URL_HYPERLIQUID_TESTNET=https://api.hyperliquid-testnet.xyz/evm
VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
VITE_TEZOS_RPC_TESTNET=https://rpc.ghostnet.teztnets.xyz
```

### Test Files
| File | Purpose | Tests |
|------|---------|-------|
| `frontend/src/__tests__/HyperLiquidAdmin.test.jsx` | Admin dashboard HyperLiquid support tests | 15 tests ✅ |
| `frontend/src/__tests__/TezosAdapter.test.jsx` | Tezos adapter functionality tests | 35 tests ✅ |

**Run Tests:**
```bash
npm run test  # All 50 tests
```

### Component Files (Already Created)
| File | Purpose | Status |
|------|---------|--------|
| `frontend/src/components/TezosWithdrawUI.jsx` | Tezos withdraw UI component | ✅ Created |
| `frontend/src/services/TezosAdapter.js` | Taquito client + context layer | ✅ Created |
| `frontend/src/pages/admin/ContractManagement.jsx` | Admin dashboard (TezosWithdrawUI integrated) | ✅ Updated |

---

## 📚 Documentation Files

### Primary Documentation

#### 1. **MAINNET_DEPLOYMENT_SUMMARY.md** (THIS DOCUMENT)
- Executive summary of entire implementation
- Architecture overview
- Deployment path and sequence
- Success criteria
- Version information

**When to use:** Before starting deployment, for overview

---

#### 2. **DEPLOYMENT_QUICK_REFERENCE.md** ⭐ **START HERE**
- Step-by-step bash commands for deployment
- Quick environment variable summary
- Fast reference for each phase
- Support links

**When to use:** During actual deployment execution

**Key Sections:**
```
Step 1: HyperLiquid Testnet
Step 2: Tezos Ghostnet Testnet  
Step 3: Test Frontend on Testnet
Step 4: HyperLiquid Mainnet
Step 5: Tezos Mainnet
Step 6: Final Frontend Test
```

---

#### 3. **DEPLOYMENT_MAINNET_CHECKLIST.md** ✅ **USE DURING DEPLOYMENT**
- Detailed pre-deployment requirements
- Complete deployment sequence (6 steps)
- Testnet verification procedures
- Post-deployment verification
- Rollback plan
- Deployment timeline
- Authorization signatures section

**When to use:** During deployment to track progress

**Estimated Duration:** 60-90 minutes

---

#### 4. **MAINNET_DEPLOYMENT_GUIDE.md**
- Comprehensive 5-part guide
- Prerequisites for both networks
- Detailed deployment instructions
- Safety checklist
- Troubleshooting guide
- Summary table

**When to use:** For deep technical details and troubleshooting

---

### Supporting Documentation (Previously Created)

#### 5. **INTEGRATION_GUIDE_EVM_TEZOS.md**
- Integration guide for EVM + Tezos
- Architecture decisions
- Context branching pattern
- Admin UI integration details

---

#### 6. **README_EVM_TEZOS.md**
- Feature overview
- Installation instructions
- Usage examples
- Testing guide

---

#### 7. **IMPLEMENTATION_SUMMARY.md**
- Implementation details
- Files modified/created
- Testing results
- Integration status

---

## 🗂️ File Organization

```
Durchex_NFT_Marketplace/
│
├── 📁 scripts/
│   ├── deploy-hyperliquid-mainnet.js    ← HyperLiquid deployment
│   └── deploy-tezos-mainnet.js          ← Tezos deployment
│
├── 📁 frontend/
│   ├── .env                             ← Updated with mainnet configs
│   ├── src/
│   │   ├── Context/
│   │   │   └── constants.jsx            ← Updated with new networks
│   │   ├── components/
│   │   │   └── TezosWithdrawUI.jsx      ← Tezos UI (created earlier)
│   │   ├── services/
│   │   │   └── TezosAdapter.js          ← Taquito client (created earlier)
│   │   ├── pages/admin/
│   │   │   └── ContractManagement.jsx   ← Admin dashboard (updated)
│   │   └── __tests__/
│   │       ├── HyperLiquidAdmin.test.jsx ← HyperLiquid tests
│   │       └── TezosAdapter.test.jsx     ← Tezos tests
│   └── vitest.config.js                 ← Test config (created earlier)
│
├── 📄 Documentation (Root)
│   ├── MAINNET_DEPLOYMENT_SUMMARY.md         ← This file
│   ├── DEPLOYMENT_QUICK_REFERENCE.md         ← ⭐ Start here for deployment
│   ├── DEPLOYMENT_MAINNET_CHECKLIST.md       ← Use during deployment
│   ├── MAINNET_DEPLOYMENT_GUIDE.md           ← Comprehensive guide
│   ├── INTEGRATION_GUIDE_EVM_TEZOS.md        ← Technical integration details
│   ├── README_EVM_TEZOS.md                   ← Feature overview
│   └── IMPLEMENTATION_SUMMARY.md             ← Implementation details
│
└── 📁 deployments/  (Will be created after first deployment)
    ├── hyperliquid-mainnet-deployment.json
    └── tezos-mainnet-deployment.json
```

---

## 🔄 Deployment Workflow Reference

### Phase 1: Testnet Verification (15-30 min)
```
1. Deploy to HyperLiquid Testnet
   → scripts/deploy-hyperliquid-mainnet.js --network hyperliquid_testnet
   → Get contract addresses
   → Add to .env (TESTNET vars)

2. Deploy to Tezos Ghostnet
   → node scripts/deploy-tezos-mainnet.js (with testnet RPC)
   → Get contract address
   → Add to .env (TESTNET vars)

3. Test Frontend on Testnets
   → Start: npm run dev
   → Test HyperLiquid withdraw flow
   → Test Tezos withdraw flow
   → All working? → Continue to Phase 2
```

### Phase 2: Mainnet Deployment (45-60 min)
```
1. Deploy to HyperLiquid Mainnet
   → scripts/deploy-hyperliquid-mainnet.js --network hyperliquid
   → Get contract addresses
   → Add to .env (MAINNET vars)
   → Verify on explorer

2. Deploy to Tezos Mainnet  
   → node scripts/deploy-tezos-mainnet.js (with mainnet RPC)
   → Get contract address
   → Add to .env (MAINNET vars)
   → Verify on TzKT

3. Final Frontend Test
   → Restart dev server
   → Test HyperLiquid mainnet withdraw
   → Test Tezos mainnet withdraw
   → Monitor transactions on explorers
```

---

## 📊 Status Dashboard

### ✅ Completed
- [x] Code implementation (HyperLiquid + Tezos)
- [x] Unit tests (50/50 passing)
- [x] Deployment scripts created
- [x] Environment configuration
- [x] Documentation completed
- [x] Frontend integration

### ⏳ Pending
- [ ] Testnet deployment (HyperLiquid + Tezos)
- [ ] Testnet verification
- [ ] Mainnet deployment (HyperLiquid + Tezos)
- [ ] Mainnet verification
- [ ] Production testing

### 📋 Required Actions
1. Provide private keys for deployment
2. Execute deployment scripts (following DEPLOYMENT_QUICK_REFERENCE.md)
3. Update .env with contract addresses from deployment
4. Run frontend testing
5. Verify on block explorers

---

## 🔑 Key Environment Variables

### RPC URLs (Pre-configured)
```env
VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
VITE_RPC_URL_HYPERLIQUID_TESTNET=https://api.hyperliquid-testnet.xyz/evm
VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
VITE_TEZOS_RPC_TESTNET=https://rpc.ghostnet.teztnets.xyz
```

### Contract Addresses (To be filled after deployment)
```env
# HyperLiquid Mainnet
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x<address>
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x<address>

# HyperLiquid Testnet
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=0x<address>
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=0x<address>

# Tezos Mainnet
VITE_APP_TEZOS_MARKETPLACE_MAINNET=KT1<address>

# Tezos Testnet
VITE_APP_TEZOS_MARKETPLACE_TESTNET=KT1<address>
```

### Deployment Secrets (Keep secure!)
```bash
# Not in .env file - pass via environment or command line
PRIVATE_KEY=0x<your_ethereum_private_key>        # For HyperLiquid
TEZOS_PRIVATE_KEY=edsk<your_tezos_private_key>   # For Tezos
```

---

## 🧪 Test Results

**Current Status: ✅ ALL TESTS PASSING**

```
Test Files:  2 passed (2)
      Tests: 50 passed (50)
   
Breakdown:
  ├── HyperLiquid Admin Tests:        15 passed
  └── Tezos Adapter Tests:            35 passed
```

### Test Coverage Areas:
- ✅ Network configuration validation
- ✅ Contract address availability
- ✅ RPC endpoint configuration
- ✅ Admin dropdown compatibility
- ✅ Withdraw function integration
- ✅ Tezos address validation (tz1, tz2, tz3, KT1)
- ✅ Taquito client functionality
- ✅ Context branching patterns
- ✅ Error handling and edge cases

---

## 🚀 Quick Start for Deployment

**1. Read Overview (5 min)**
- Start with this file (MAINNET_DEPLOYMENT_SUMMARY.md)

**2. Prepare Keys (5 min)**
- Get HyperLiquid private key (0x format)
- Get Tezos private key (edsk format)
- Ensure accounts have sufficient balance

**3. Execute Deployment (follow in order)**
```bash
# Open DEPLOYMENT_QUICK_REFERENCE.md
# Follow Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6
# Use DEPLOYMENT_MAINNET_CHECKLIST.md to track progress
```

**4. Verify Deployment (5-10 min)**
- Check HyperLiquid explorer
- Check TzKT (Tezos explorer)
- Test frontend withdraw flows

---

## 📞 Support Resources

### Official Documentation
- **HyperLiquid:** https://hyperliquid.gitbook.io/
- **Tezos:** https://tezos.com/developer
- **Hardhat:** https://hardhat.org/docs
- **Taquito:** https://taquito.io/

### Block Explorers
- **HyperLiquid:** https://explorer.hyperliquid.xyz (if available)
- **Tezos Mainnet:** https://tzkt.io
- **Tezos Testnet:** https://ghostnet.tzkt.io

### Wallet Connections
- **MetaMask:** https://metamask.io
- **Temple Wallet:** https://temple.finance

---

## ✅ Final Checklist

Before starting deployment, verify:
- [ ] All tests passing: `npm run test` = 50/50
- [ ] Private keys obtained and secure
- [ ] Account balances sufficient (0.5+ ETH for HyperLiquid, 2+ XTZ for Tezos)
- [ ] Read DEPLOYMENT_QUICK_REFERENCE.md
- [ ] Have DEPLOYMENT_MAINNET_CHECKLIST.md ready
- [ ] Browser with MetaMask ready for HyperLiquid testing
- [ ] Browser with Temple Wallet ready for Tezos testing
- [ ] Backend API running (if needed for admin functions)

---

## 📝 Notes for Future Reference

After deployment completes:
1. Update this document with deployment dates
2. Record all contract addresses
3. Document any customizations made
4. Keep deployment transaction hashes for reference
5. Update CI/CD with new environment variables
6. Notify team of mainnet availability

---

**Status:** 🟢 READY FOR DEPLOYMENT  
**Last Verified:** November 27, 2025  
**Next Step:** Read DEPLOYMENT_QUICK_REFERENCE.md and begin testnet deployment
