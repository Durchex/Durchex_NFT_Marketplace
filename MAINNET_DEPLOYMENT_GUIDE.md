# Mainnet Deployment Guide: HyperLiquid & Tezos

## Current Status

✅ **EVM Networks Deployed to Mainnet:**
- Polygon: VendorNFT=0xCbc8712cD4477A813e23150642F6466D5741f2A9, NFTMarketplace=0x6Df8f108B61cb4C0e456BaBBeA82a5E91388b3bd
- Arbitrum: VendorNFT=0x2033eE90f76496E26bEF4a1A8FF8712Afbd0d39b, NFTMarketplace=0x577D9b2E9Ce9f390b8D6c9388974Ee04f4Ca5592
- Ethereum: VendorNFT=0x1BBE1EC42D897e2f0dd39B6Cc6c1070515f7B307, NFTMarketplace=0x2033eE90f76496E26bEF4a1A8FF8712Afbd0d39b
- BSC: VendorNFT=0x4dFCb19D3E4eE0989b51364e3038076ee96808c9, NFTMarketplace=0x704798eCb33d44E6c66048b15E60991367781C01
- Base: VendorNFT=0xb0F0733302967e210B61f50b59511B3F119aE869, NFTMarketplace=0x1BBE1EC42D897e2f0dd39B6Cc6c1070515f7B307

❌ **Pending Mainnet Deployments:**
- HyperLiquid Mainnet (EVM-compatible)
- Tezos Mainnet

---

## Part 1: HyperLiquid Mainnet Deployment

### Prerequisites

1. **HyperLiquid Mainnet RPC URL:** `https://api.hyperliquid.xyz/evm` (mainnet)
2. **Private Key:** Have the deployment private key ready (currently 0x55ACfDC3eeC57C2c965F70a69F5192d7C4347f01 is owner)
3. **Hardhat Setup:** Ensure you have `hardhat.config.js` and smart contracts in a contracts folder

### Steps

1. **Update HyperLiquid RPC in `.env`:**
   ```env
   VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
   ```

2. **Update Hardhat config** (if you have hardhat.config.js):
   ```javascript
   hyperliquid: {
     url: "https://api.hyperliquid.xyz/evm",
     accounts: [process.env.PRIVATE_KEY], // Your deployment key
     chainId: 63,
   }
   ```

3. **Deploy contracts:**
   ```bash
   npx hardhat run scripts/deploy.ts --network hyperliquid
   ```

4. **Update `.env` with deployed addresses:**
   ```env
   VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=<deployed_marketplace_address>
   VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=<deployed_vendor_address>
   ```

5. **Verify deployment** (optional):
   ```bash
   npx hardhat verify --network hyperliquid <contract_address> <constructor_args>
   ```

---

## Part 2: Tezos Mainnet Deployment

### Prerequisites

1. **Tezos RPC:** `https://mainnet.api.tezos.com` (already in `.env`)
2. **Smart Contracts:** Need to compile Tezos contracts (if using Michelson or higher-level language)
3. **Deployment Tool:** Use Taquito client + deployment script OR Tezos CLI

### Option A: Using Taquito Deployment Script

1. **Create a Tezos deployment script** (`scripts/deploy-tezos.js`):
   ```javascript
   import { TezosToolkit } from "@taquito/taquito";
   import { InMemorySigner } from "@taquito/signer";
   
   const Tezos = new TezosToolkit("https://mainnet.api.tezos.com");
   
   async function deploy() {
     // Set signer with private key
     const signer = new InMemorySigner(process.env.TEZOS_PRIVATE_KEY);
     Tezos.setSignerProvider(signer);
     
     const contract = await Tezos.contract.originate({
       code: nftMarketplaceCode, // Your Michelson contract code
       init: nftMarketplaceInit, // Initialization values
       storage: initialStorage,
     });
     
     console.log(`✅ Contract originated at: ${contract.contractAddress}`);
     return contract.contractAddress;
   }
   
   deploy().catch(console.error);
   ```

2. **Set environment variables:**
   ```env
   VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
   TEZOS_PRIVATE_KEY=<your_tezos_private_key>
   VITE_APP_TEZOS_MARKETPLACE_MAINNET=<deployed_contract_address>
   ```

3. **Run deployment:**
   ```bash
   node scripts/deploy-tezos.js
   ```

### Option B: Using Tezos CLI

1. **Originate contract using CLI:**
   ```bash
   tezos-client -A https://mainnet.api.tezos.com \
     originate contract marketplace \
     for <account> \
     transferring 0 from <account> \
     running <path_to_contract.tz> \
     --burn-cap 10
   ```

2. **Get the contract address from the output and update `.env`**

---

## Part 3: Update Frontend Environment

### Update `.env` file with mainnet addresses:

```env
# HyperLiquid Mainnet
VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=<mainnet_address>
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=<mainnet_address>

# Tezos Mainnet
VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
VITE_APP_TEZOS_MARKETPLACE_MAINNET=<KT1_mainnet_address>
```

### Update `frontend/src/Context/constants.jsx`:

Add HyperLiquid mainnet and Tezos mainnet to the network lists:

```javascript
export const rpcUrls = {
  polygon: import.meta.env.VITE_RPC_URL_POLYGON || "...",
  arbitrum: import.meta.env.VITE_RPC_URL_ARBITRUM || "...",
  ethereum: import.meta.env.VITE_RPC_URL_ETHEREUM || "...",
  bsc: import.meta.env.VITE_RPC_URL_BSC || "...",
  base: import.meta.env.VITE_RPC_URL_BASE || "...",
  hyperliquid: import.meta.env.VITE_RPC_URL_HYPERLIQUID || "https://api.hyperliquid.xyz/evm",
  tezosMainnet: import.meta.env.VITE_TEZOS_RPC_MAINNET || "https://mainnet.api.tezos.com",
};

export const contractAddresses = {
  polygon: {
    nftMarketplace: import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON,
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON,
  },
  // ... other networks
  hyperliquid: {
    nftMarketplace: import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID,
    vendorNFT: import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID,
  },
  tezosMainnet: {
    nftMarketplace: import.meta.env.VITE_APP_TEZOS_MARKETPLACE_MAINNET,
  },
};
```

---

## Part 4: Testing Mainnet Deployments

### Frontend Testing

1. **Update UI to show mainnet networks:**
   ```javascript
   // In ContractManagement.jsx or network selector
   const networks = ["polygon", "arbitrum", "ethereum", "bsc", "base", "hyperliquid", "tezosMainnet"];
   ```

2. **Test with real wallet:**
   - For EVM (HyperLiquid): Connect with MetaMask/Wallet Connect to HyperLiquid Mainnet
   - For Tezos: Connect Temple Wallet to Tezos Mainnet

3. **Test withdraw flow:**
   - Select HyperLiquid mainnet and test withdraw
   - Select Tezos Mainnet and test withdraw via TezosWithdrawUI

### Verification

- **EVM Explorer:** Check HyperLiquid explorer (once available)
- **Tezos Explorer:** Check TzKT (https://tzkt.io) for contract operations

---

## Part 5: Safety Checklist

- [ ] Mainnet RPC URLs verified
- [ ] Private keys stored securely (not in git)
- [ ] Contract ownership transferred to correct address
- [ ] Testnet deployment completed before mainnet
- [ ] Contract addresses verified on block explorers
- [ ] Frontend `.env` updated with correct mainnet addresses
- [ ] Admin dashboard can select mainnet networks
- [ ] Withdraw functionality tested on mainnet

---

## Troubleshooting

### HyperLiquid Deployment Issues

- **Connection Error:** Verify RPC URL is correct (https://api.hyperliquid.xyz/evm)
- **Insufficient Balance:** Ensure account has enough funds for gas
- **Verification Failed:** HyperLiquid may not have public block explorer

### Tezos Deployment Issues

- **Contract Origination Failed:** Check contract code syntax and storage initialization
- **Insufficient Balance:** Ensure account has at least 1 XTZ for burn cap
- **Invalid Private Key:** Ensure TEZOS_PRIVATE_KEY is valid hex format

---

## Summary

| Network | Status | Mainnet Address | Type |
|---------|--------|-----------------|------|
| Polygon | ✅ Complete | 0xCbc8712cd... | EVM |
| Arbitrum | ✅ Complete | 0x2033eE90f... | EVM |
| Ethereum | ✅ Complete | 0x1BBE1EC42... | EVM |
| BSC | ✅ Complete | 0x4dFCb19D3... | EVM |
| Base | ✅ Complete | 0xb0F0733302... | EVM |
| HyperLiquid | ⏳ Pending | Deploy & Update | EVM |
| Tezos | ⏳ Pending | Deploy & Update | Tezos |

Once deployments are complete, update `.env` and the admin UI will automatically support these networks for withdraw operations.
