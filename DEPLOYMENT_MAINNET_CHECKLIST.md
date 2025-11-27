# Mainnet Deployment Checklist

**Last Updated:** November 27, 2025  
**Status:** Ready for Deployment  
**Tests:** ✅ All 50 tests passing

---

## Pre-Deployment Requirements

### Part 1: Prepare Keys & Secrets
- [ ] **HyperLiquid Mainnet**
  - [ ] Private key for deployment account (0x55ACfDC3eeC57C2c965F70a69F5192d7C4347f01)
  - [ ] Verify account has at least 0.5 ETH on HyperLiquid mainnet
  - [ ] HyperLiquid Mainnet RPC URL: `https://api.hyperliquid.xyz/evm`
  
- [ ] **Tezos Mainnet**
  - [ ] Tezos private key (EdDSA secret key format: `edsk...`)
  - [ ] Verify account has at least 2 XTZ on Tezos mainnet
  - [ ] Tezos Mainnet RPC: `https://mainnet.api.tezos.com`

### Part 2: Verify Code & Contracts
- [ ] Smart contracts compiled and ready
- [ ] Contract ABI files in `frontend/src/Context/` (NFTMarketplace.json, VendorNFT.json)
- [ ] Tezos contract code ready (Michelson format or compiled)

### Part 3: Test Infrastructure
- [ ] All unit tests passing (`npm run test` = 50/50 passing)
- [ ] Hardhat configured for HyperLiquid network
- [ ] Deployment scripts created and verified
  - [ ] `scripts/deploy-hyperliquid-mainnet.js`
  - [ ] `scripts/deploy-tezos-mainnet.js`

---

## Deployment Sequence

### Step 1: HyperLiquid Testnet Deployment (Verification)

1. **Ensure hardhat.config.js includes HyperLiquid testnet:**
   ```javascript
   hyperliquid_testnet: {
     url: "https://api.hyperliquid-testnet.xyz/evm",
     accounts: [process.env.PRIVATE_KEY],
     chainId: 998,
   }
   ```

2. **Deploy to testnet:**
   ```bash
   cd c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace
   npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid_testnet
   ```

3. **Expected output:**
   - VendorNFT contract address
   - NFTMarketplace contract address
   - Deployment transaction hashes

4. **Verify deployment:**
   - Contract addresses appear in `deployments/hyperliquid-testnet-deployment.json`
   - Check transactions on HyperLiquid testnet explorer (if available)

5. **Update `.env` for testnet testing:**
   ```env
   VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=<address>
   VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=<address>
   ```

---

### Step 2: Tezos Testnet Deployment (Ghostnet Verification)

1. **Prepare private key:**
   ```bash
   # Export Tezos private key from Temple Wallet or get test account
   $env:TEZOS_PRIVATE_KEY = "edsk..."
   ```

2. **Deploy to Ghostnet:**
   ```bash
   cd c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace
   $env:TEZOS_PRIVATE_KEY = "<your_private_key>"
   $env:TEZOS_RPC_URL = "https://rpc.ghostnet.teztnets.xyz"
   node scripts/deploy-tezos-mainnet.js
   ```

3. **Expected output:**
   - Marketplace contract address (KT1...)
   - Deployment transaction hash
   - Block level information

4. **Verify deployment:**
   - Check TzKT Ghostnet: `https://ghostnet.tzkt.io/<contract_address>`
   - Contract storage initialized with admin address

5. **Update `.env` for testnet testing:**
   ```env
   VITE_APP_TEZOS_MARKETPLACE_TESTNET=KT1<address>
   ```

---

### Step 3: Frontend Testing on Testnets

1. **Start development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test HyperLiquid Testnet:**
   - Connect MetaMask to HyperLiquid testnet
   - Navigate to Admin > Contract Management
   - Select "hyperliquidTestnet" from network dropdown
   - Verify contract addresses display correctly
   - Test withdraw flow (if backend connected)

3. **Test Tezos Ghostnet:**
   - Install Temple Wallet extension
   - Connect Temple Wallet to Tezos Ghostnet
   - Select "tezosTestnet" from network dropdown
   - Test TezosWithdrawUI component
   - Verify balance display and transaction signing

---

### Step 4: HyperLiquid Mainnet Deployment

**⚠️ CRITICAL: Do not proceed until testnet passes all checks**

1. **Ensure mainnet configuration:**
   ```javascript
   hyperliquid: {
     url: "https://api.hyperliquid.xyz/evm",
     accounts: [process.env.PRIVATE_KEY],
     chainId: 63,
   }
   ```

2. **Deploy to mainnet:**
   ```bash
   cd c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace
   npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid
   ```

3. **Record deployment info:**
   - VendorNFT address: `_________________`
   - NFTMarketplace address: `_________________`
   - Transaction hash: `_________________`
   - Block number: `_________________`

4. **Save to file:**
   - Deployment info saved to `deployments/hyperliquid-mainnet-deployment.json`

5. **Update `.env`:**
   ```env
   VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
   VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x<address>
   VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x<address>
   ```

---

### Step 5: Tezos Mainnet Deployment

**⚠️ CRITICAL: Do not proceed until testnet passes all checks and HyperLiquid mainnet is live**

1. **Prepare mainnet private key:**
   ```bash
   # Use production Tezos account with at least 2 XTZ
   $env:TEZOS_PRIVATE_KEY = "<mainnet_edsk_key>"
   ```

2. **Deploy to mainnet:**
   ```bash
   cd c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace
   $env:TEZOS_PRIVATE_KEY = "<mainnet_private_key>"
   $env:TEZOS_RPC_URL = "https://mainnet.api.tezos.com"
   node scripts/deploy-tezos-mainnet.js
   ```

3. **Record deployment info:**
   - Marketplace address: `KT1_________________`
   - Deployer address: `tz1_________________`
   - Transaction hash: `_________________`
   - Block level: `_________________`

4. **Verify on TzKT:**
   - Visit `https://tzkt.io/<contract_address>`
   - Confirm storage and operations

5. **Update `.env`:**
   ```env
   VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
   VITE_APP_TEZOS_MARKETPLACE_MAINNET=KT1<address>
   ```

---

### Step 6: Post-Deployment Frontend Testing

1. **Restart frontend:**
   ```bash
   cd frontend
   # Kill previous dev server (Ctrl+C)
   npm run dev
   ```

2. **Test HyperLiquid Mainnet:**
   - Switch MetaMask to HyperLiquid mainnet
   - Admin > Contract Management
   - Select "hyperliquid" from network dropdown
   - Verify correct contract addresses display
   - Test full withdraw flow with real transactions

3. **Test Tezos Mainnet:**
   - Switch Temple Wallet to Tezos mainnet
   - Select "tezosMainnet" from network dropdown
   - Verify contract address displays correctly
   - Test TezosWithdrawUI with real Tezos transactions
   - Monitor transaction on TzKT explorer

---

## Post-Deployment Verification

### HyperLiquid Checks
- [ ] Contracts deployed to mainnet
- [ ] Contract addresses added to `.env`
- [ ] Admin dashboard shows HyperLiquid option
- [ ] Withdraw function works on mainnet
- [ ] All gas costs within budget

### Tezos Checks
- [ ] Contracts originated on mainnet
- [ ] Contract addresses added to `.env`
- [ ] Admin dashboard shows Tezos Mainnet option
- [ ] TezosWithdrawUI connects to Temple Wallet
- [ ] Transactions confirmed on TzKT
- [ ] All transaction costs within budget

### Full System Verification
- [ ] All tests still passing: `npm run test` = 50/50
- [ ] No console errors in frontend
- [ ] Backend API responding correctly
- [ ] WebSocket connections working
- [ ] Database records updated for mainnet deployments

---

## Rollback Plan

If mainnet deployment fails:

### For HyperLiquid:
1. Keep testnet addresses in `.env` as fallback
2. Revert to previous git commit if needed
3. Redeploy to testnet and resolve issues
4. Attempt mainnet deployment again

### For Tezos:
1. Keep Ghostnet addresses in `.env` as fallback
2. Check TzKT explorer for failed transactions
3. Ensure sufficient balance and retry
4. Verify contract code compiles before retry

---

## Deployment Timeline

| Task | Estimated Duration | Status |
|------|-------------------|--------|
| HyperLiquid Testnet | 5-10 minutes | ⏳ Pending |
| Tezos Ghostnet | 5-10 minutes | ⏳ Pending |
| Frontend Testnet Testing | 15-20 minutes | ⏳ Pending |
| HyperLiquid Mainnet | 5-10 minutes | ⏳ Pending |
| Tezos Mainnet | 5-10 minutes | ⏳ Pending |
| Frontend Mainnet Testing | 20-30 minutes | ⏳ Pending |
| **Total** | **60-90 minutes** | ⏳ Ready |

---

## Deployment Readiness Summary

✅ **Code Status:**
- Unit tests: 50/50 passing
- Frontend code: Ready
- Deployment scripts: Created and reviewed
- Environment variables: Configured

⏳ **Pending:**
- Private keys and test accounts
- Testnet deployments
- Mainnet deployments
- Production testing

🎯 **Next Action:**
Provide private keys and execute HyperLiquid testnet deployment to begin mainnet deployment sequence.

---

## Contact & Support

- **HyperLiquid Docs:** https://hyperliquid.gitbook.io/
- **Tezos Docs:** https://tezos.com/developer
- **TzKT Explorer:** https://tzkt.io
- **Hardhat Docs:** https://hardhat.org/docs

---

**Deployment Authorized By:** __________________ **Date:** __________

**Deployment Completed By:** __________________ **Date:** __________

**Verified By:** __________________ **Date:** __________
