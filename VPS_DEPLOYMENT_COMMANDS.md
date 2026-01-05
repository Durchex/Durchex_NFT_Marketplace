# VPS Deployment Commands - Copy & Paste Ready

## Prerequisites Check
```bash
# SSH into VPS
ssh root@213.130.144.229

# Navigate to project
cd /home/durchex/htdocs/durchex.com

# Check Node.js and npm
node --version
npm --version

# Check hardhat
npx hardhat --version
```

## Step 1: Set Up Environment Variables

```bash
# Create/edit .env file
nano .env

# Add these lines:
PRIVATE_KEY=your_private_key_here
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY

# Exit: CTRL+X, then Y, then Enter
```

## Step 2: Compile Smart Contracts

```bash
cd /home/durchex/htdocs/durchex.com

# Clean previous builds
npx hardhat clean

# Compile
npx hardhat compile

# Should output: X artifacts written to ./artifacts
```

## Step 3: Deploy to Polygon (Primary Network)

```bash
npx hardhat run scripts/deploy.js --network polygon

# Expected output:
# VendorNFT deployed to: 0x...
# NFTMarketplace deployed to: 0x...
# Save these addresses!
```

## Step 4: Deploy to Ethereum

```bash
npx hardhat run scripts/deploy.js --network ethereum

# Record the addresses
```

## Step 5: Deploy to BSC

```bash
npx hardhat run scripts/deploy.js --network bsc

# Record the addresses
```

## Step 6: Deploy to Arbitrum

```bash
npx hardhat run scripts/deploy.js --network arbitrum

# Record the addresses
```

## Step 7: Update Frontend Environment

```bash
# Edit frontend .env
nano frontend/.env

# Add all contract addresses you recorded:
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON=0x...paste_from_step3
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON=0x...paste_from_step3
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ETHEREUM=0x...paste_from_step4
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ETHEREUM=0x...paste_from_step4
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_BSC=0x...paste_from_step5
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_BSC=0x...paste_from_step5
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_ARBITRUM=0x...paste_from_step6
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_ARBITRUM=0x...paste_from_step6

# Exit: CTRL+X, then Y, then Enter
```

## Step 8: Update Frontend .env.production

```bash
nano frontend/.env.production

# Add the same contract addresses
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_POLYGON=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_POLYGON=0x...
# ... etc for all networks

# Exit: CTRL+X, then Y, then Enter
```

## Step 9: Build Frontend

```bash
cd /home/durchex/htdocs/durchex.com/frontend

# Install dependencies (if needed)
npm install

# Build
npm run build

# Should output:
# ✓ built in XXs
```

## Step 10: Deploy Build to Web Server

```bash
# Copy build to web server directory
cp -r dist/* /home/durchex/htdocs/durchex.com/public/

# Verify
ls -la /home/durchex/htdocs/durchex.com/public/
```

## Step 11: Restart Backend

```bash
# Check PM2 status
pm2 status

# Restart backend
pm2 restart durchex-backend

# Or if using npm start
cd /home/durchex/htdocs/durchex.com/backend_temp
npm start

# Restart frontend (if needed)
pm2 restart durchex-frontend
```

## Step 12: Verify Deployment

```bash
# Check services
pm2 status

# View logs
pm2 logs durchex-backend

# Check build was copied
ls -la /home/durchex/htdocs/durchex.com/public/assets/ | head -20
```

## Step 13: Test in Browser

1. Open https://durchex.com in browser
2. Open Developer Console (F12)
3. Check for contract addresses logged
4. Connect wallet
5. Go to Create NFT
6. Try uploading a WebP/BMP/ICO/TIFF image (new formats)
7. Select network (should see all 4 networks)
8. Try to mint
9. Check Explore page for new NFT with token ID

## Verification Commands

```bash
# Check contract on blockchain explorers
# Polygon: https://polygonscan.com/address/YOUR_POLYGON_CONTRACT
# Ethereum: https://etherscan.io/address/YOUR_ETHEREUM_CONTRACT
# BSC: https://bscscan.com/address/YOUR_BSC_CONTRACT
# Arbitrum: https://arbiscan.io/address/YOUR_ARBITRUM_CONTRACT

# Check VPS service health
pm2 status

# View real-time logs
pm2 logs

# Check disk space
df -h

# Check memory usage
free -h
```

## Troubleshooting Commands

```bash
# If deployment fails, check errors
npx hardhat verify --network polygon YOUR_CONTRACT_ADDRESS

# Check contract state
npm test

# Clear cache and rebuild
rm -rf frontend/dist
npm run build

# Restart everything
pm2 restart all

# Check network connectivity
curl https://rpc.ankr.com/polygon

# Check if port is listening
netstat -tuln | grep 3000  # or your backend port
```

## Quick Status Check Script

```bash
#!/bin/bash
# Save as: check_deployment.sh
# Run: bash check_deployment.sh

echo "=== Deployment Status ==="
echo ""
echo "1. Services:"
pm2 status
echo ""
echo "2. Build Status:"
ls -la /home/durchex/htdocs/durchex.com/public/assets/ 2>/dev/null | wc -l
echo "   Built assets found"
echo ""
echo "3. Environment:"
echo "   Frontend .env:"
grep "VITE_APP" frontend/.env | wc -l
echo "   Environment vars set"
echo ""
echo "4. Recent Logs:"
pm2 logs --lines 10
```

## Network URLs for Reference

- Polygon: https://polygonscan.com
- Ethereum: https://etherscan.io
- BSC: https://bscscan.com
- Arbitrum: https://arbiscan.io

---

## Quick Reference - What Changed in This Update

### Image Format Support
✅ Users can now upload: JPG, PNG, SVG, GIF, WebP, BMP, ICO, TIFF
- `frontend/src/pages/Create.jsx` - SUPPORTED_IMAGE_TYPES updated
- `frontend/src/components/NftCreatorForm.jsx` - File validation updated

### Network Deployment
📋 Hardhat config already supports: Polygon, Ethereum, BSC, Arbitrum
- Contract addresses managed via environment variables
- RPC endpoints configured

---

**Pro Tip:** Copy each step into your VPS terminal one at a time, wait for completion, then move to next step. Save contract addresses in a safe location as you deploy to each network.

**Status:** All changes ready. Follow these commands in order for successful deployment.
