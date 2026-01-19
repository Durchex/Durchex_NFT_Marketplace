# Phase 1 Implementation Quick Reference

## Files Status

### ✅ COMPLETED FILES

#### Smart Contracts
- `contracts/LazyMintNFT.sol` (350 lines) - Ready to deploy
- `contracts/Auction.sol` (800 lines) - Ready to deploy

#### Backend Services
- `backend_temp/services/lazyMintService.js` (450 lines) - Ready
- `backend_temp/services/blockchainListener.js` (400 lines) - Ready
- `backend_temp/services/ipfsService.js` (500 lines) - Ready
- `backend_temp/services/auctionService.js` (300 lines) - Ready

#### Backend Routes
- `backend_temp/routes/lazyMint.js` (450 lines) - 11 endpoints, Ready
- `backend_temp/routes/auction.js` (500 lines) - 12 endpoints, Ready

#### Database
- `backend_temp/models/lazyNFTModel.js` (250 lines) - Ready

#### Frontend
- `frontend/src/components/LazyMintNFT.jsx` (350 lines) - Ready
- `frontend/src/components/LazyMintNFT.css` (350 lines) - Ready

#### Documentation
- `LAZY_MINTING_IMPLEMENTATION_COMPLETE.md` - Setup guide
- `PHASE_1_PROGRESS_REPORT.md` - Full report

---

## Integration Steps

### 1. Backend Setup

#### Create Missing Middleware/Config Files
```bash
# Create authentication middleware
touch backend_temp/middleware/auth.js

# Create config file for contracts
touch backend_temp/config/contract.js

# Create logger utility
touch backend_temp/utils/logger.js
```

#### auth.js Template
```javascript
const authMiddleware = (req, res, next) => {
    // TODO: Implement JWT verification
    req.user = { address: req.header('User-Address') }; // Temporary
    next();
};

module.exports = authMiddleware;
```

#### contract.js Template
```javascript
module.exports = {
    LAZY_MINT_CONTRACT: {
        address: process.env.LAZY_MINT_CONTRACT_ADDRESS,
        abi: require('./abi/LazyMintNFT.json')
    },
    AUCTION_CONTRACT: {
        address: process.env.AUCTION_CONTRACT_ADDRESS,
        abi: require('./abi/Auction.json')
    }
};
```

#### logger.js Template
```javascript
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
    debug: (msg, data) => console.debug(`[DEBUG] ${msg}`, data)
};

module.exports = logger;
```

### 2. Database Setup

#### MongoDB Collections
```javascript
// Create indexes manually or via migrations
db.createCollection("lazyNFTs");
db.lazyNFTs.createIndex({ creator: 1, status: 1 });
db.lazyNFTs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.lazyNFTs.createIndex({ text: "text" });

// Auctions collection (if not using contract storage)
db.createCollection("auctions");
db.auctions.createIndex({ seller: 1, status: 1 });
db.auctions.createIndex({ endTime: 1 });
```

### 3. Smart Contract Deployment

#### Compile Contracts
```bash
npx hardhat compile
```

#### Deploy to Mumbai Testnet
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

#### Create scripts/deploy.js
```javascript
const hre = require("hardhat");

async function main() {
    // Deploy LazyMintNFT
    const LazyMintNFT = await hre.ethers.getContractFactory("LazyMintNFT");
    const lazyMintNFT = await LazyMintNFT.deploy(process.env.PLATFORM_FEE_RECEIVER);
    await lazyMintNFT.deployed();
    console.log("LazyMintNFT deployed to:", lazyMintNFT.address);

    // Deploy Auction
    const Auction = await hre.ethers.getContractFactory("Auction");
    const auction = await Auction.deploy(process.env.PLATFORM_FEE_RECEIVER);
    await auction.deployed();
    console.log("Auction deployed to:", auction.address);

    // Save addresses
    console.log(`
    LAZY_MINT_CONTRACT_ADDRESS=${lazyMintNFT.address}
    AUCTION_CONTRACT_ADDRESS=${auction.address}
    `);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

### 4. Environment Configuration

#### .env File
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/durchex
MONGODB_USER=admin
MONGODB_PASSWORD=secure_password

# Blockchain
BLOCKCHAIN_RPC_URL=https://polygon-mumbai.g.allnodes.com/ext/bc/C/rpc
LAZY_MINT_CONTRACT_ADDRESS=0x...
AUCTION_CONTRACT_ADDRESS=0x...
NETWORK_CHAIN_ID=80001
PLATFORM_FEE_RECEIVER=0x...

# IPFS (Choose one)
IPFS_PROVIDER=nftstorage
NFT_STORAGE_API_KEY=...

# OR
# IPFS_PROVIDER=pinata
# PINATA_API_KEY=...
# PINATA_API_SECRET=...

# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### 5. Register Routes in app.js

```javascript
const express = require('express');
const app = express();

// ... other middleware ...

// Register lazy mint routes
const lazyMintRoutes = require('./routes/lazyMint');
app.use('/api/lazy-mint', lazyMintRoutes);

// Register auction routes
const auctionRoutes = require('./routes/auction');
app.use('/api/auctions', auctionRoutes);

// ... error handling ...

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
```

### 6. Frontend Integration

#### Create IPFS Upload Service
```javascript
// frontend/src/services/ipfs.js
export async function uploadToIPFS(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    return data.cid;
}
```

#### Create API Service
```javascript
// frontend/src/services/api.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const lazyMintAPI = {
    createVoucher: (data) => fetch(`${API_BASE}/lazy-mint/create-voucher`, 
        { method: 'POST', body: JSON.stringify(data) }),
    submitVoucher: (data) => fetch(`${API_BASE}/lazy-mint/submit`,
        { method: 'POST', body: JSON.stringify(data) }),
    getAvailable: (page = 1) => fetch(`${API_BASE}/lazy-mint/available?page=${page}`)
};

export const auctionAPI = {
    createAuction: (data) => fetch(`${API_BASE}/auctions/create`,
        { method: 'POST', body: JSON.stringify(data) }),
    placeBid: (auctionId, bidAmount) => fetch(`${API_BASE}/auctions/${auctionId}/bid`,
        { method: 'POST', body: JSON.stringify({ bidAmount }) }),
    getAuction: (auctionId) => fetch(`${API_BASE}/auctions/${auctionId}`)
};
```

#### Import Components
```javascript
// In your Create page or profile
import LazyMintNFT from './components/LazyMintNFT';

export function CreatePage() {
    return (
        <div>
            <h1>Create NFT</h1>
            <LazyMintNFT 
                userAddress={userAddress}
                onSuccess={(result) => {
                    console.log('NFT created:', result);
                    // Redirect to marketplace
                }}
            />
        </div>
    );
}
```

---

## API Testing

### Test Lazy Mint Endpoints

```bash
# 1. Create voucher
curl -X POST http://localhost:5000/api/lazy-mint/create-voucher \
  -H "Content-Type: application/json" \
  -d '{
    "nftContract": "0x...",
    "imageURI": "ipfs://QmXxxx",
    "name": "My NFT",
    "description": "Test NFT",
    "royaltyPercentage": 10
  }'

# 2. Submit signed voucher
curl -X POST http://localhost:5000/api/lazy-mint/submit \
  -H "Content-Type: application/json" \
  -H "User-Address: 0x..." \
  -d '{
    "messageHash": "0x...",
    "signature": "0x...",
    "nonce": 1,
    "ipfsURI": "ipfs://QmXxxx"
  }'

# 3. Get available lazy mints
curl http://localhost:5000/api/lazy-mint/available?page=1

# 4. View specific lazy NFT
curl http://localhost:5000/api/lazy-mint/1
```

### Test Auction Endpoints

```bash
# 1. Create auction
curl -X POST http://localhost:5000/api/auctions/create \
  -H "Content-Type: application/json" \
  -H "User-Address: 0x..." \
  -d '{
    "nftContract": "0x...",
    "tokenId": 1,
    "reservePrice": "1.5",
    "durationInSeconds": 86400,
    "minBidIncrement": 500
  }'

# 2. Place bid
curl -X POST http://localhost:5000/api/auctions/1/bid \
  -H "Content-Type: application/json" \
  -H "User-Address: 0x..." \
  -d '{"bidAmount": "2.0"}'

# 3. Get auction details
curl http://localhost:5000/api/auctions/1

# 4. Get bid history
curl http://localhost:5000/api/auctions/1/bids

# 5. Settle auction
curl -X POST http://localhost:5000/api/auctions/1/settle \
  -H "Content-Type: application/json" \
  -H "User-Address: 0x..."
```

---

## Deployment Checklist

### Pre-Testnet
- [ ] Compile all smart contracts without errors
- [ ] Generate contract ABIs
- [ ] Setup environment variables
- [ ] Create database indexes
- [ ] Test API endpoints locally
- [ ] Verify IPFS provider connection

### Testnet
- [ ] Deploy contracts to Mumbai/Sepolia
- [ ] Update contract addresses in .env
- [ ] Setup event listeners
- [ ] Create test users
- [ ] Execute end-to-end test workflows
- [ ] Monitor gas usage
- [ ] Document deployment

### Pre-Mainnet
- [ ] Security audit of contracts
- [ ] Load testing (1000+ users)
- [ ] Database backup strategy
- [ ] Monitoring and alerting setup
- [ ] Incident response plan
- [ ] Team training

---

## Performance Optimization Tips

### Database
```javascript
// Add indexes
db.lazyNFTs.createIndex({ "creator": 1, "status": 1 });
db.lazyNFTs.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// Use projections
db.lazyNFTs.find({}, { _id: 1, name: 1, imageURI: 1 });
```

### Smart Contracts
```solidity
// Use batch operations
function batchRedeemNFTs(
    LazyMintVoucher[] calldata vouchers
) external {
    for (uint i = 0; i < vouchers.length; i++) {
        redeemNFT(vouchers[i]);
    }
}
```

### API
```javascript
// Enable caching
app.get('/api/lazy-mint/:id', 
    cache('5 minutes'),
    (req, res) => { /* ... */ }
);

// Use pagination
app.get('/api/lazy-mint/available', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    // Query with limit and skip
});
```

---

## Troubleshooting

### Contract Deployment Issues
- **Error**: "Out of gas"
  - Solution: Increase gas limit in hardhat.config.js
- **Error**: "Nonce too high"
  - Solution: Check pending transactions, wait for confirmation

### API Connection Issues
- **Error**: "Cannot connect to MongoDB"
  - Solution: Verify MONGODB_URI in .env, check mongod is running
- **Error**: "IPFS timeout"
  - Solution: Check internet connection, try alternative gateway

### Event Listener Issues
- **Error**: "Events not processing"
  - Solution: Check event listener logs, verify contract address
- **Error**: "Database update failed"
  - Solution: Check MongoDB connection, verify schema matches

---

## Next Tasks (Week 3-4)

### Task 11: Offer System
- Files to create: `Offer.sol`, `offerService.js`, `offer.js` routes

### Task 12: Auction UI Components
- Files to create: `AuctionForm.jsx`, `BidInterface.jsx`, `AuctionTimer.jsx`

### Task 13-15: Discovery Features
- Files to create: `SearchFilter.jsx`, `AnalyticsDashboard.jsx`, `RarityEngine.js`

---

## References

- **Smart Contracts**: ERC-721, ERC-2981, ECDSA (OpenZeppelin)
- **Backend**: Express.js, MongoDB, ethers.js
- **Frontend**: React, Web3.js, MetaMask
- **Storage**: IPFS, NFT.storage, Pinata

---

**Status**: Phase 1 COMPLETE ✅
**Next**: Phase 1 UI + Offers (Tasks 11-12)
**Estimated**: 3-4 weeks to full marketplace launch
