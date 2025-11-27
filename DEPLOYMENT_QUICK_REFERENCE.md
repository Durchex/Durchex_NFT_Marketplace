# 🚀 Mainnet Deployment - Quick Reference

**Status:** ✅ Tests Passing (50/50) | Ready for Deployment

---

## Step 1: HyperLiquid Testnet (Verification)

```bash
# Configure hardhat.config.js with testnet:
# hyperliquid_testnet: { url: "https://api.hyperliquid-testnet.xyz/evm", chainId: 998 }

cd "c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace"
set PRIVATE_KEY=<your_private_key>
npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid_testnet

# Copy contract addresses and add to .env:
# VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=0x<address>
# VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=0x<address>
```

---

## Step 2: Tezos Ghostnet Testnet (Verification)

```bash
cd "c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace"
set TEZOS_PRIVATE_KEY=<your_edsk_key>
set TEZOS_RPC_URL=https://rpc.ghostnet.teztnets.xyz
node scripts/deploy-tezos-mainnet.js

# Copy contract address and add to .env:
# VITE_APP_TEZOS_MARKETPLACE_TESTNET=KT1<address>
```

---

## Step 3: Test Frontend on Testnet

```bash
cd frontend
npm run dev

# Test HyperLiquid Testnet:
# - Connect MetaMask to HyperLiquid testnet
# - Admin > Contract Management > Select "hyperliquidTestnet"
# - Verify withdraw flow works

# Test Tezos Ghostnet:
# - Connect Temple Wallet to Ghostnet
# - Admin > Contract Management > Select "tezosTestnet"
# - Verify TezosWithdrawUI component works
```

---

## Step 4: HyperLiquid Mainnet Deployment

```bash
# AFTER testnet verification passed!

cd "c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace"
set PRIVATE_KEY=<mainnet_private_key>
npx hardhat run scripts/deploy-hyperliquid-mainnet.js --network hyperliquid

# Update .env with mainnet addresses:
# VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
# VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x<address>
# VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x<address>
```

---

## Step 5: Tezos Mainnet Deployment

```bash
# AFTER HyperLiquid mainnet deployed!

cd "c:\Users\alexa\Documents\GitHub\Durchex_NFT_Marketplace"
set TEZOS_PRIVATE_KEY=<mainnet_edsk_key>
set TEZOS_RPC_URL=https://mainnet.api.tezos.com
node scripts/deploy-tezos-mainnet.js

# Update .env with mainnet address:
# VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
# VITE_APP_TEZOS_MARKETPLACE_MAINNET=KT1<address>
```

---

## Step 6: Final Frontend Test

```bash
cd frontend
# Kill previous dev server (Ctrl+C) then restart
npm run dev

# Test HyperLiquid Mainnet:
# - Connect MetaMask to HyperLiquid mainnet
# - Admin > Contract Management > Select "hyperliquid"
# - Test withdraw with real transaction

# Test Tezos Mainnet:
# - Connect Temple Wallet to Tezos mainnet
# - Admin > Contract Management > Select "tezosMainnet"
# - Test TezosWithdrawUI with real transaction
```

---

## Environment Variable Summary

```env
# HyperLiquid Testnet
VITE_RPC_URL_HYPERLIQUID_TESTNET=https://api.hyperliquid-testnet.xyz/evm
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=0x<to_fill>
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID_TESTNET=0x<to_fill>

# HyperLiquid Mainnet
VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x<to_fill>
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x<to_fill>

# Tezos Testnet (Ghostnet)
VITE_TEZOS_RPC_TESTNET=https://rpc.ghostnet.teztnets.xyz
VITE_APP_TEZOS_MARKETPLACE_TESTNET=KT1<to_fill>

# Tezos Mainnet
VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
VITE_APP_TEZOS_MARKETPLACE_MAINNET=KT1<to_fill>
```

---

## Files Created/Modified

✅ **Created:**
- `scripts/deploy-hyperliquid-mainnet.js` - HyperLiquid deployment
- `scripts/deploy-tezos-mainnet.js` - Tezos deployment
- `MAINNET_DEPLOYMENT_GUIDE.md` - Comprehensive guide
- `DEPLOYMENT_MAINNET_CHECKLIST.md` - Deployment checklist

✅ **Modified:**
- `frontend/.env` - Added mainnet RPC URLs
- `frontend/src/Context/constants.jsx` - Added mainnet network configs
- `frontend/src/__tests__/HyperLiquidAdmin.test.jsx` - Fixed tests for all networks

---

## Deployment Checklist

- [ ] Private key for HyperLiquid deployment (0x...)
- [ ] Tezos private key (edsk...)
- [ ] Testnet deployments verified
- [ ] Frontend testnet testing passed
- [ ] HyperLiquid mainnet deployment completed
- [ ] Tezos mainnet deployment completed
- [ ] .env updated with mainnet addresses
- [ ] Frontend restart with new .env
- [ ] Mainnet withdraw flow tested
- [ ] Contracts verified on explorers

---

## Support & References

- **HyperLiquid Docs:** https://hyperliquid.gitbook.io/
- **HyperLiquid Testnet RPC:** https://api.hyperliquid-testnet.xyz/evm
- **HyperLiquid Mainnet RPC:** https://api.hyperliquid.xyz/evm
- **Tezos Mainnet RPC:** https://mainnet.api.tezos.com
- **TzKT Explorer:** https://tzkt.io
- **Hardhat Docs:** https://hardhat.org/docs
- **Taquito Docs:** https://taquito.io/

---

**Ready to Deploy!** Follow the steps above in order. Contact for any issues.
