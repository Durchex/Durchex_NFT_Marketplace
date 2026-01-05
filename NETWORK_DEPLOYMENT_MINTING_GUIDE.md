# Network Deployment & Minting Setup Guide - January 5, 2026

## Overview
This guide covers deploying smart contracts to multiple blockchain networks (Polygon, Ethereum, BSC, Arbitrum) so that minting will work live on your VPS and token IDs can be generated.

## Prerequisites
- Smart contracts (VendorNFT.sol and NFTMarketplace.sol) already compiled
- Private key for deployment account
- RPC endpoints for each network
- Sufficient funds in deployment account for gas fees on each network

## Part 1: Smart Contract Deployment

### Step 1: Prepare Environment Variables

**On your VPS (/home/durchex/htdocs/durchex.com/.env or root/.env):**

```bash
# Private key for contract deployment (keep secure!)
PRIVATE_KEY=your_private_key_here

# RPC Endpoints (update with your preferred providers)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Optional: Etherscan API keys for verification
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
BSCSCAN_API_KEY=your_bscscan_key
ARBISCAN_API_KEY=your_arbiscan_key
```

### Step 2: Deploy Contracts

**Deploy to Polygon (primary network):**
```bash
cd /home/durchex/htdocs/durchex.com
npx hardhat run scripts/deploy.js --network polygon
```

**Deploy to Ethereum:**
```bash
npx hardhat run scripts/deploy.js --network ethereum
```

**Deploy to BSC:**
```bash
npx hardhat run scripts/deploy.js --network bsc
```

**Deploy to Arbitrum:**
```bash
npx hardhat run scripts/deploy.js --network arbitrum
```

### Step 3: Record Contract Addresses

After deployment, you'll receive contract addresses. Save them:

```bash
Polygon:
- VendorNFT: 0x...
- NFTMarketplace: 0x...

Ethereum:
- VendorNFT: 0x...
- NFTMarketplace: 0x...

BSC:
- VendorNFT: 0x...
- NFTMarketplace: 0x...

Arbitrum:
- VendorNFT: 0x...
- NFTMarketplace: 0x...
```

## Part 2: Frontend Environment Configuration

### Update Frontend .env Files

**File: /home/durchex/htdocs/durchex.com/frontend/.env**
```env
VITE_API_BASE_URL=https://durchex.com/api/v1

# Polygon (Primary)
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON=0x...from_deployment

# Ethereum
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ETHEREUM=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ETHEREUM=0x...from_deployment

# BSC
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BSC=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BSC=0x...from_deployment

# Arbitrum
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ARBITRUM=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ARBITRUM=0x...from_deployment

# Default RPC URLs (can override if needed)
VITE_APP_WEB3_PROVIDER=https://rpc.ankr.com/polygon

# PINATA Keys
VITE_PINATA_API_KEY=your_pinata_key
VITE_PINATA_SECRET_KEY=your_pinata_secret
VITE_PINATA_JWT=your_pinata_jwt
```

**File: /home/durchex/htdocs/durchex.com/frontend/.env.production**
```env
VITE_API_BASE_URL=https://durchex.com/api/v1

# Production - use same contract addresses as .env
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON=0x...from_deployment

VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ETHEREUM=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ETHEREUM=0x...from_deployment

VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BSC=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BSC=0x...from_deployment

VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ARBITRUM=0x...from_deployment
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ARBITRUM=0x...from_deployment

VITE_APP_WEB3_PROVIDER=https://rpc.ankr.com/polygon
VITE_PINATA_JWT=your_pinata_jwt
```

## Part 3: Backend Configuration

### Update Backend .env

**File: /home/durchex/htdocs/durchex.com/backend_temp/.env**

Add these contract addresses (optional for backend, mainly frontend):

```bash
# Network Configuration
NETWORKS_SUPPORTED=polygon,ethereum,bsc,arbitrum

# Polygon
POLYGON_RPC_URL=https://rpc.ankr.com/polygon
POLYGON_VENDORNFT_ADDRESS=0x...
POLYGON_MARKETPLACE_ADDRESS=0x...

# Ethereum
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth
ETHEREUM_VENDORNFT_ADDRESS=0x...
ETHEREUM_MARKETPLACE_ADDRESS=0x...

# BSC
BSC_RPC_URL=https://rpc.ankr.com/bsc
BSC_VENDORNFT_ADDRESS=0x...
BSC_MARKETPLACE_ADDRESS=0x...

# Arbitrum
ARBITRUM_RPC_URL=https://rpc.ankr.com/arbitrum
ARBITRUM_VENDORNFT_ADDRESS=0x...
ARBITRUM_MARKETPLACE_ADDRESS=0x...
```

## Part 4: Build & Deploy on VPS

### 1. Rebuild Frontend with Contract Addresses

```bash
cd /home/durchex/htdocs/durchex.com/frontend
npm run build
```

### 2. Copy Build to Web Server

```bash
cp -r dist/* /home/durchex/htdocs/durchex.com/public/
```

### 3. Restart Backend Services

```bash
# Using PM2 (if configured)
pm2 restart durchex-backend

# Or restart normally
cd /home/durchex/htdocs/durchex.com/backend_temp
npm start
```

### 4. Verify Deployment

Check that:
1. Contract addresses are loaded in browser (open Developer Console)
2. Web3 connection works (try connecting wallet)
3. Network selection dropdown shows all 4 networks
4. Minting button is enabled and functional

## Part 5: Token ID Generation

### How Token IDs Work

When a user mints an NFT:
1. Frontend calls VendorNFT contract's mint function
2. Contract generates token ID (usually auto-increment)
3. Token ID is stored with NFT metadata in backend database
4. Frontend displays token ID to user

### Ensure Backend Stores Token IDs

**Check: backend_temp/models/nftModel.js**
```javascript
tokenId: {
  type: String,
  required: false, // Set to true after first mint
}
```

**Check: backend_temp/controllers/nftController.js**
Ensure the create/update functions save tokenId from contract.

### Test Minting Flow

1. Connect wallet in browser
2. Go to Create/Mint NFT page
3. Select a network (e.g., Polygon)
4. Upload image (now supports: JPG, PNG, SVG, GIF, WebP, BMP, ICO, TIFF)
5. Enter details and click Mint
6. Confirm transaction in wallet
7. Check that token ID appears in UI
8. Verify NFT shows in Explore page with listing

## Part 6: Image Format Support (Already Implemented)

### Supported Formats
✅ JPG/JPEG (standard)
✅ PNG (transparency support)
✅ SVG (vector graphics)
✅ GIF (animations)
✅ WebP (modern compression)
✅ BMP (bitmap)
✅ ICO (icons)
✅ TIFF (high quality)

### Updated Files
- `frontend/src/pages/Create.jsx` - Added WebP, BMP, ICO, TIFF to SUPPORTED_IMAGE_TYPES
- `frontend/src/components/NftCreatorForm.jsx` - Updated file validation and UI messages

## Troubleshooting

### Issue: "Contract not found" error
**Solution:** Verify contract addresses in .env files match deployed addresses exactly

### Issue: Minting fails with "gas estimate failure"
**Solution:** 
- Ensure account has sufficient balance for gas
- Check contract has proper permissions/initialization
- Verify RPC endpoint is working

### Issue: Token ID not appearing
**Solution:**
- Check blockchain explorer to confirm transaction succeeded
- Verify backend is reading contract logs correctly
- Check database has tokenId field populated

### Issue: Image upload rejected
**Solution:**
- Check file format is in supported list
- Ensure file size < 20MB
- Verify MIME type is correct (use browser Dev Tools)

## Monitoring

### Check VPS Deployment Status

```bash
# Check if services running
pm2 status

# View logs
pm2 logs durchex-backend
pm2 logs durchex-frontend

# Check contract on mainnet
# Go to: https://polygonscan.com/address/YOUR_CONTRACT_ADDRESS
```

### Monitor Minting Transactions

Via Polygonscan/Etherscan:
- View all mints at: `https://polygonscan.com/address/YOUR_VENDORNFT_ADDRESS`
- Track token IDs generated
- Monitor gas costs

## Next Steps

1. **Deploy contracts** to each network (run Step 2 above)
2. **Update environment variables** (Step 1, 3, 4)
3. **Build and deploy frontend** (Step 4)
4. **Test minting** on each network
5. **Monitor** deployment with provided commands

## Support for Multiple Image Formats

Users can now upload:
- **Traditional:** JPG, PNG
- **Modern:** WebP (better compression)
- **Vector:** SVG (scalable)
- **Animated:** GIF
- **Others:** BMP, ICO, TIFF

All formats are validated on both:
1. Frontend (before upload)
2. IPFS (via Pinata)
3. Backend (when storing metadata)

---

**Last Updated:** January 5, 2026
**Status:** Ready for Production Deployment
