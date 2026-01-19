# NEXT IMMEDIATE TASKS - Phase 1 Completion

## Task 6: Deploy and Test on Sepolia Testnet

### Prerequisites
You need:
1. **Sepolia Testnet ETH** (~0.1 ETH minimum)
   - Get from faucet: https://sepoliafaucet.com
2. **Private Key** (stored securely in .env)
3. **RPC URL** (Infura or Alchemy)

### Step 1: Setup Environment

Create/update `.env` in root:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
```

### Step 2: Deploy Contracts

```bash
# From workspace root
npx hardhat run scripts/deployToSepolia.js --network sepolia
```

Expected output:
```
🚀 Deploying to Sepolia Testnet...
📝 Deploying with account: 0x...
💰 Account balance: 0.15 ETH

1️⃣ Deploying DurchexNFT template...
✅ Template deployed to: 0x...

2️⃣ Deploying NFTCollectionFactory...
✅ Factory deployed to: 0x...

3️⃣ Creating test collection...
✅ Collection deployed to: 0x...

4️⃣ Minting test NFT...
✅ NFT minted with token ID: 0

✅ DEPLOYMENT COMPLETE
```

### Step 3: Verify Contracts

Once deployed, verify on Etherscan Sepolia:
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Step 4: Test the Flow

1. **Open MongoDB** and check:
   - Collections have `contractDeploymentStatus: 'deployed'`
   - NFTs have `tokenId` and `isMinted: true`

2. **Call API** to create collection:
```bash
curl -X POST http://localhost:3000/api/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Collection",
    "creatorWallet": "0x...",
    "network": "sepolia",
    "contractAddress": "0x..."
  }'
```

3. **Call API** to create NFT:
```bash
curl -X POST http://localhost:3000/api/nfts \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "test-nft-1",
    "name": "Test NFT",
    "network": "sepolia",
    "contractAddress": "0x...",
    "owner": "0x...",
    "seller": "0x...",
    "price": "1",
    "metadataURI": "ipfs://QmTest/metadata.json"
  }'
```

### Step 5: Verify on Blockchain

Visit Etherscan Sepolia:
- Contract: https://sepolia.etherscan.io/address/0x...
- See deployed contract code
- Check transaction history

---

## Task 7: Update Frontend NFT Display

### File: `frontend/src/pages/NftDetailsPage.jsx`

Update to show blockchain data:

```jsx
// Show on-chain info
<div className="blockchain-info">
  <h3>On-Chain Details</h3>
  <p><strong>Contract:</strong> {nft.contractAddress}</p>
  <p><strong>Token ID:</strong> {nft.tokenId}</p>
  <p><strong>Network:</strong> {nft.network}</p>
  <p><strong>Minted:</strong> {nft.isMinted ? '✅ Yes' : '⏳ Pending'}</p>
  {nft.mintTxHash && (
    <p>
      <strong>Mint TX:</strong> 
      <a href={`https://${network}.etherscan.io/tx/${nft.mintTxHash}`}>
        {nft.mintTxHash.slice(0, 10)}...
      </a>
    </p>
  )}
</div>
```

---

## Task 8: Implement OpenSea Metadata Standard

### File: `backend_temp/services/metadataService.js` (NEW)

```javascript
/**
 * OpenSea Metadata Standard
 * Reference: https://docs.opensea.io/docs/metadata-standards
 */
export function createOpenSeaMetadata(nftData) {
  return {
    // Required
    name: nftData.name,
    description: nftData.description,
    image: nftData.image,
    
    // Recommended
    attributes: nftData.traits || nftData.properties ? 
      Object.entries(nftData.properties || {}).map(([key, value]) => ({
        trait_type: key,
        value: value
      })) : [],
    
    // Optional but useful
    external_url: `https://marketplace.durchex.io/nft/${nftData.itemId}`,
    animation_url: nftData.animationUrl || null,
    background_color: nftData.backgroundColor || null,
    youtube_url: nftData.youtubeUrl || null,
    
    // Custom
    collection: nftData.collection,
    creator: nftData.creator,
    royalty_percentage: nftData.royalties?.percentage || 0,
  };
}
```

Update Create NFT to use this:
```javascript
const metadata = createOpenSeaMetadata(nftData);
const metadataURI = await uploadToIPFS(metadata);
```

---

## Task 9: Phase 1 Checkpoint

### Checklist:

- [ ] Contracts deployed to Sepolia
- [ ] Collection created via factory
- [ ] NFT minted with token ID
- [ ] Database updated with contract address
- [ ] Blockchain data visible in frontend
- [ ] OpenSea metadata standard implemented
- [ ] End-to-end flow tested

### Test Scenario:
1. User creates collection → Contract deploys → Get contract address
2. User creates NFT → Contract mints → Get token ID
3. User views NFT → Sees contract address, token ID, TX hash
4. Verify on Etherscan → See real on-chain NFT

### Success Criteria:
- ✅ Collection has real contract address
- ✅ NFT has real token ID
- ✅ Data persists in database
- ✅ Visible in Etherscan
- ✅ Metadata follows OpenSea standard

---

## ENVIRONMENT SETUP REFERENCE

### .env for Backend
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
PRIVATE_KEY=your_key_here

MONGODB_URI=mongodb://...
PINATA_API_KEY=...
PINATA_API_SECRET=...
```

### Commands
```bash
# Install dependencies
cd backend_temp
npm install

# Start backend
npm start

# Test API
curl http://localhost:3000/api/health
```

---

## TROUBLESHOOTING

### Error: "Not enough balance"
**Solution**: Get more testnet ETH from faucet

### Error: "Factory contract not found"
**Solution**: Update CONTRACT_ADDRESS in .env after deployment

### Error: "IPFS upload failed"
**Solution**: Check Pinata API keys, or use placeholder URIs

### Error: "MongoDB connection failed"
**Solution**: Ensure MongoDB is running locally or set MONGODB_URI env var

---

## NEXT PHASE (After Task 9)

Once Phase 1 is complete:
1. Start Phase 2: Already done! All frontend pages deployed
2. Start Phase 3: Stargate Bridge, ERC-4907 Rental, Staking contracts
3. Timeline: 1-2 weeks to mainnet

---

Generated: January 19, 2026
Status: Ready for immediate execution
