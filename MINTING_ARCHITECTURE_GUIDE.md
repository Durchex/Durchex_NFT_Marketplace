# NFT Minting Architecture Guide
## Direct On-Chain Minting Without Contract Deployment

**Document Date:** January 17, 2026  
**Purpose:** Explain how to implement user-minted NFTs that your marketplace can track

---

## Executive Summary

**YES, you can absolutely implement direct on-chain minting without deploying your own contracts!**

Here are the **3 main approaches**:

1. **Factory Contract Pattern** ✅ (Most Common)
   - Deploy ONE factory contract once
   - Users create collections through factory
   - Each collection gets its own contract deployed on-chain
   - Marketplace tracks all via factory address

2. **Shared Contract Pattern** ✅ (Simpler)
   - Deploy ONE shared contract once
   - Multiple users mint to same contract
   - Marketplace tracks user by minter address
   - No new contracts deployed per user

3. **Lazy Minting Pattern** ✅ (Most Efficient)
   - User signs metadata, pays on first sale
   - Minting happens on buyer, not creator
   - Zero upfront gas for creators
   - Marketplace holds signed vouchers

---

## Architecture Option 1: Factory Contract Pattern

### How It Works

```
User wants to create NFT collection
          ↓
User clicks "Create Collection" on Durchex
          ↓
Frontend signs transaction (user's wallet pays gas)
          ↓
Transaction calls Factory Contract: createCollection(name, symbol, royalty)
          ↓
Factory deploys new ERC-721 contract
          ↓
New contract address returned
          ↓
Marketplace stores: collection address, creator, metadata in MongoDB
          ↓
User can now mint NFTs to their collection
          ↓
When user mints, transaction calls: mintNFT(to, tokenId, ipfsURI)
          ↓
NFT is minted and transferred to user's wallet
          ↓
Marketplace tracks: collection address + tokenId + owner in database
          ↓
NFT appears on marketplace for that collection
```

### Smart Contracts Needed

**1. Factory Contract (Deploy ONCE)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC721Collection.sol";

contract DurchexNFTFactory is Ownable {
    address public implementationAddress;
    
    event CollectionCreated(
        address indexed collectionAddress,
        address indexed creator,
        string name,
        string symbol
    );
    
    constructor(address _implementation) {
        implementationAddress = _implementation;
    }
    
    // Users call this to create their collection
    function createCollection(
        string memory name,
        string memory symbol,
        uint256 royaltyPercentage,
        address royaltyRecipient
    ) external returns (address) {
        // Clone the implementation contract
        address clone = Clones.clone(implementationAddress);
        
        // Initialize the cloned contract
        ERC721Collection(clone).initialize(
            name,
            symbol,
            msg.sender,  // creator is the caller
            royaltyPercentage,
            royaltyRecipient
        );
        
        // Emit event for indexing
        emit CollectionCreated(clone, msg.sender, name, symbol);
        
        // Marketplace backend listens for this event
        return clone;
    }
    
    // Admin can update implementation (for upgrades)
    function setImplementation(address _newImplementation) external onlyOwner {
        implementationAddress = _newImplementation;
    }
}

```

**2. Collection Contract (Deploy once, then clone)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721Collection is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    address public creator;
    uint256 public royaltyPercentage;
    address public royaltyRecipient;
    
    string private baseURI;
    
    event MetadataUpdate(uint256 indexed tokenId, string uri);
    
    // Initialize function (called by factory)
    function initialize(
        string memory name,
        string memory symbol,
        address _creator,
        uint256 _royaltyPercentage,
        address _royaltyRecipient
    ) external {
        require(creator == address(0), "Already initialized");
        
        ERC721._name = name;
        ERC721._symbol = symbol;
        creator = _creator;
        royaltyPercentage = _royaltyPercentage;
        royaltyRecipient = _royaltyRecipient;
        
        transferOwnership(_creator);
    }
    
    // Creator mints NFTs
    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit MetadataUpdate(tokenId, uri);
        
        return tokenId;
    }
    
    // Batch minting for creators
    function batchMint(address to, string[] memory uris) external onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](uris.length);
        
        for (uint256 i = 0; i < uris.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _mint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            tokenIds[i] = tokenId;
            emit MetadataUpdate(tokenId, uris[i]);
        }
        
        return tokenIds;
    }
    
    // Standard royalty function for marketplaces
    function royaltyInfo(uint256 tokenId, uint256 salePrice) 
        external view returns (address, uint256) {
        return (royaltyRecipient, (salePrice * royaltyPercentage) / 100);
    }
}
```

### Marketplace Integration (Backend)

**1. Listen for CollectionCreated Events**

```javascript
// backend/services/blockchainListener.js
const ethers = require('ethers');
const Collection = require('../models/collectionModel');

const FACTORY_ADDRESS = '0x...';
const FACTORY_ABI = [...]; // Factory contract ABI

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

// Listen for CollectionCreated events
contract.on('CollectionCreated', async (collectionAddress, creator, name, symbol) => {
    console.log(`New collection created: ${name} at ${collectionAddress}`);
    
    // Save to MongoDB
    const collection = new Collection({
        contractAddress: collectionAddress,
        name: name,
        symbol: symbol,
        creator: creator,
        blockchain: 'ethereum', // or whatever chain
        type: 'user-created',
        createdAt: new Date(),
    });
    
    await collection.save();
    console.log('Collection saved to database');
});

// Start listening from latest block
provider.on('block', (blockNumber) => {
    console.log(`Block: ${blockNumber}`);
});
```

**2. Index Minted NFTs**

```javascript
// backend/services/nftIndexer.js
const ethers = require('ethers');
const NFT = require('../models/nftModel');

const ERC721_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

async function indexUserCollectionNFTs(collectionAddress) {
    const contract = new ethers.Contract(
        collectionAddress,
        ERC721_ABI,
        provider
    );
    
    // Listen for transfers (mints = transfer from 0x0)
    contract.on('Transfer', async (from, to, tokenId) => {
        if (from === '0x0000000000000000000000000000000000000000') {
            // This is a mint
            console.log(`NFT minted: ${tokenId} to ${to}`);
            
            // Fetch metadata
            const tokenURI = await contract.tokenURI(tokenId);
            const metadata = await fetchIPFSMetadata(tokenURI);
            
            // Save NFT to database
            const nft = new NFT({
                tokenId: tokenId,
                contractAddress: collectionAddress,
                owner: to,
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                attributes: metadata.attributes,
                currentlyListed: false,
            });
            
            await nft.save();
        }
    });
}

async function fetchIPFSMetadata(tokenURI) {
    const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    const response = await fetch(url);
    return await response.json();
}
```

**3. Display Collections in Marketplace**

```javascript
// backend/routes/collections.js
router.get('/user-collections/:creatorAddress', async (req, res) => {
    const collections = await Collection.find({
        creator: req.params.creatorAddress,
        type: 'user-created'
    });
    
    // Fetch NFT count for each collection
    const collectionsWithCounts = await Promise.all(
        collections.map(async (col) => {
            const nftCount = await NFT.countDocuments({
                contractAddress: col.contractAddress
            });
            
            return {
                ...col.toObject(),
                nftCount: nftCount,
                floorPrice: await getFloorPrice(col.contractAddress),
            };
        })
    );
    
    res.json(collectionsWithCounts);
});
```

---

## Architecture Option 2: Shared Contract Pattern

### How It Works

```
User wants to mint NFT
          ↓
User uploads image and metadata
          ↓
Frontend uploads image to IPFS, gets CID
          ↓
Frontend calls Marketplace Contract: mint(name, description, imageIPFS)
          ↓
Contract stores metadata and mints NFT to user
          ↓
Marketplace database records: contractAddress + tokenId + minter = owner
          ↓
NFT appears on marketplace under "My NFTs"
```

### Key Difference from Factory Pattern

- **One contract** holds all NFTs from all users
- Users identified by `minter` address (who called mint)
- Simpler, cheaper gas
- Less flexible (all NFTs in one contract)

### Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DurchexNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct NFTMetadata {
        address creator;
        string name;
        string description;
        uint256 royaltyPercentage;
    }
    
    mapping(uint256 => NFTMetadata) public nftMetadata;
    
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        string ipfsURI
    );
    
    constructor() ERC721("DurchexNFT", "THRX") {}
    
    // Users call this to mint
    function mint(
        string memory name,
        string memory description,
        string memory ipfsURI,
        uint256 royaltyPercentage
    ) external returns (uint256) {
        require(royaltyPercentage <= 50, "Royalty too high");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint to caller
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsURI);
        
        // Store metadata
        nftMetadata[tokenId] = NFTMetadata({
            creator: msg.sender,
            name: name,
            description: description,
            royaltyPercentage: royaltyPercentage
        });
        
        emit NFTMinted(tokenId, msg.sender, name, ipfsURI);
        
        return tokenId;
    }
    
    // Batch mint
    function batchMint(
        string[] memory names,
        string[] memory descriptions,
        string[] memory ipfsURIs,
        uint256[] memory royalties
    ) external returns (uint256[] memory) {
        require(
            names.length == descriptions.length &&
            descriptions.length == ipfsURIs.length &&
            ipfsURIs.length == royalties.length,
            "Array lengths don't match"
        );
        
        uint256[] memory tokenIds = new uint256[](names.length);
        
        for (uint256 i = 0; i < names.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _mint(msg.sender, tokenId);
            _setTokenURI(tokenId, ipfsURIs[i]);
            
            nftMetadata[tokenId] = NFTMetadata({
                creator: msg.sender,
                name: names[i],
                description: descriptions[i],
                royaltyPercentage: royalties[i]
            });
            
            emit NFTMinted(tokenId, msg.sender, names[i], ipfsURIs[i]);
            tokenIds[i] = tokenId;
        }
        
        return tokenIds;
    }
    
    // Royalty info for marketplaces
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external view returns (address, uint256) {
        NFTMetadata memory meta = nftMetadata[tokenId];
        return (meta.creator, (salePrice * meta.royaltyPercentage) / 100);
    }
}
```

### Marketplace Integration

```javascript
// Much simpler - just listen to Transfer events
const CONTRACT_ADDRESS = '0x...';

contract.on('NFTMinted', async (tokenId, creator, name, ipfsURI) => {
    const metadata = await fetchIPFSMetadata(ipfsURI);
    
    const nft = new NFT({
        tokenId: tokenId.toString(),
        contractAddress: CONTRACT_ADDRESS,
        owner: creator,
        name: name,
        creator: creator,
        image: metadata.image,
        currentlyListed: false,
    });
    
    await nft.save();
});
```

---

## Architecture Option 3: Lazy Minting Pattern

### How It Works

```
User wants to create NFT
          ↓
User uploads image and metadata to marketplace
          ↓
User signs NFT metadata (NO blockchain transaction)
          ↓
Marketplace stores signed NFT in database
          ↓
Marketplace shows NFT as "available" but not yet minted
          ↓
BUYER wants to buy the NFT
          ↓
Buyer's transaction includes:
   - NFT metadata
   - Creator's signature
   - Buyer's payment
          ↓
Smart contract verifies creator's signature
          ↓
Contract mints NFT directly to buyer
          ↓
Buyer receives NFT
          ↓
Creator gets payment
```

### Key Advantage

**Zero gas cost for creators** - Users only pay when their NFT sells

### Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract LazyMintNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    
    Counters.Counter private _tokenIdCounter;
    
    struct LazyNFT {
        uint256 tokenId;
        address creator;
        string uri;
        uint256 royaltyPercentage;
    }
    
    mapping(address => uint256) public nonces;
    
    event Redeemed(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed buyer,
        string uri
    );
    
    constructor() ERC721("DurchexLazyNFT", "THRX-LAZY") {}
    
    // Creator signs NFT metadata (off-chain)
    function getMessageHash(
        string memory uri,
        uint256 royaltyPercentage,
        uint256 nonce
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(uri, royaltyPercentage, nonce));
    }
    
    function getEthSignedMessageHash(bytes32 messageHash) 
        public pure returns (bytes32) {
        return messageHash.toEthSignedMessageHash();
    }
    
    // Verify creator's signature
    function recoverSigner(
        bytes32 message,
        bytes memory sig
    ) public pure returns (address) {
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(message);
        return ethSignedMessageHash.recover(sig);
    }
    
    // Buyer calls this to mint
    // Payment handled separately (in marketplace contract)
    function redeemNFT(
        address creator,
        string memory uri,
        uint256 royaltyPercentage,
        bytes memory signature
    ) external returns (uint256) {
        uint256 nonce = nonces[creator];
        
        bytes32 messageHash = getMessageHash(uri, royaltyPercentage, nonce);
        require(recoverSigner(messageHash, signature) == creator, "Invalid signature");
        
        // Increment nonce to prevent replay
        nonces[creator]++;
        
        // Mint to buyer
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit Redeemed(tokenId, creator, msg.sender, uri);
        
        return tokenId;
    }
}
```

### Frontend Implementation

```javascript
// frontend/services/lazyMinting.js
import { ethers } from 'ethers';

// Step 1: Creator signs NFT (happens when user creates NFT)
export async function signNFTMetadata(
    creatorAddress,
    uri,
    royaltyPercentage,
    signer
) {
    const nonce = await fetchCreatorNonce(creatorAddress);
    
    const messageHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'uint256'],
        [uri, royaltyPercentage, nonce]
    );
    
    const ethSignedMessageHash = ethers.utils.hashMessage(
        ethers.utils.arrayify(messageHash)
    );
    
    const signature = await signer.signMessage(
        ethers.utils.arrayify(messageHash)
    );
    
    return {
        uri,
        royaltyPercentage,
        nonce,
        signature,
        messageHash
    };
}

// Step 2: Store signed NFT in database
export async function createLazyNFT(metadata) {
    const response = await fetch('/api/nft/lazy-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            uri: metadata.uri,
            royaltyPercentage: metadata.royaltyPercentage,
            signature: metadata.signature,
            creator: metadata.creator,
        })
    });
    
    return await response.json();
}

// Step 3: Buyer redeems (mints and pays in one transaction)
export async function buyLazyNFT(lazyNFT, price, signer) {
    const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
    );
    
    const tx = await contract.redeemNFT(
        lazyNFT.creator,
        lazyNFT.uri,
        lazyNFT.royaltyPercentage,
        lazyNFT.signature,
        { value: price }
    );
    
    return await tx.wait();
}
```

---

## Comparison Table

| Feature | Factory | Shared | Lazy Mint |
|---------|---------|--------|-----------|
| Creator Gas Cost | 🔴 High (deploy contract) | 🟢 Low | 🟢 Zero |
| Marketplace Gas | 🟢 Low | 🟢 Low | 🟢 Low |
| Flexibility | 🟢 High | 🟡 Medium | 🟡 Medium |
| Creator Collections | 🟢 Separate | 🟡 Shared | 🟡 Shared |
| Complexity | 🟡 Medium | 🟢 Simple | 🟡 Medium |
| Scalability | 🟢 Good | 🟢 Excellent | 🟢 Excellent |
| **Best For** | Professional creators | Community NFTs | Mass adoption |

---

## Recommended Implementation Path

### For Durchex: **Factory Pattern (Most Professional)**

**Why:**
- Each creator gets their own verified collection contract
- Best UX for brand-building creators
- Matches OpenSea/Rarible standard
- Enables collection verification
- Professional appearance

### Implementation Steps

**1. Deploy Factory Contract (One-Time)**

```bash
# Deploy using Hardhat/Truffle
npx hardhat run scripts/deployFactory.js --network ethereum

# Save deployed address to environment
FACTORY_ADDRESS=0x...
```

**2. Update Create.jsx to Create Collections**

```javascript
// frontend/src/pages/Create.jsx
import { createCollection } from '../services/factory';

async function handleCreateCollection(e) {
    e.preventDefault();
    
    const collectionTx = await createCollection({
        name: formData.collectionName,
        symbol: formData.collectionSymbol,
        royaltyPercentage: formData.royalty,
        royaltyRecipient: userAddress,
    });
    
    console.log('Collection created at:', collectionTx.collectionAddress);
    
    // Save to marketplace
    await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contractAddress: collectionTx.collectionAddress,
            name: formData.collectionName,
            creator: userAddress,
        })
    });
}
```

**3. Start Event Listener in Backend**

```javascript
// backend/index.js
const { startBlockchainListener } = require('./services/blockchainListener');

// Start listening for new collections
startBlockchainListener();
```

**4. Users Mint to Their Collection**

```javascript
// User can mint directly to their collection contract
const tx = await collectionContract.mint(userAddress, metadataURI);
```

---

## Complete Flow for Durchex

```
┌─────────────────────────────────────────────────────┐
│ 1. USER VISITS MARKETPLACE                          │
├─────────────────────────────────────────────────────┤
│ - Clicks "Create Collection"                        │
│ - Fills: Name, Symbol, Royalty %                   │
│ - Confirms transaction in wallet                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. FACTORY CONTRACT DEPLOYS NEW COLLECTION          │
├─────────────────────────────────────────────────────┤
│ - Factory.createCollection() called                 │
│ - Clones ERC721Collection.sol                       │
│ - New contract deployed                             │
│ - Emits CollectionCreated event                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. BACKEND LISTENS & INDEXES                        │
├─────────────────────────────────────────────────────┤
│ - Event listener detects CollectionCreated          │
│ - Saves to MongoDB: collection metadata             │
│ - Displays in user profile                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. USER MINTS NFTs TO COLLECTION                    │
├─────────────────────────────────────────────────────┤
│ - Uploads image to IPFS via Durchex                 │
│ - Fills: Name, Description, Royalty                │
│ - Calls collection.mint(userAddress, ipfsURI)      │
│ - NFT minted and transferred to user                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. BACKEND TRACKS NFT                               │
├─────────────────────────────────────────────────────┤
│ - Listens to Transfer events                        │
│ - Detects mint (from = 0x0)                        │
│ - Fetches IPFS metadata                             │
│ - Saves NFT to MongoDB                              │
│ - Updates collection stats                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 6. NFT APPEARS ON MARKETPLACE                       │
├─────────────────────────────────────────────────────┤
│ - Shows in user's "My NFTs"                         │
│ - Can be listed for sale                            │
│ - Shown in collection                               │
│ - Available for bidding/trading                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 7. BUYER PURCHASES NFT                              │
├─────────────────────────────────────────────────────┤
│ - Pays via marketplace                              │
│ - NFT transferred to buyer                          │
│ - Royalties sent to original creator                │
│ - Marketplace takes fee                             │
└─────────────────────────────────────────────────────┘
```

---

## IPFS Integration

Store metadata on IPFS so it's permanent:

```javascript
// frontend/services/ipfs.js
import axios from 'axios';

export async function uploadToIPFS(file, metadata) {
    // Using NFT.storage or Pinata
    const formData = new FormData();
    
    // Upload image
    formData.append('file', file);
    
    const imageResponse = await axios.post(
        'https://api.nft.storage/upload',
        formData,
        {
            headers: {
                Authorization: `Bearer ${process.env.REACT_APP_NFT_STORAGE_KEY}`,
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    
    const imageHash = imageResponse.data.value.cid;
    
    // Upload metadata (JSON pointing to image)
    const metadataJSON = {
        name: metadata.name,
        description: metadata.description,
        image: `ipfs://${imageHash}`,
        attributes: metadata.attributes,
    };
    
    const metadataResponse = await axios.post(
        'https://api.nft.storage/upload',
        JSON.stringify(metadataJSON),
        {
            headers: {
                Authorization: `Bearer ${process.env.REACT_APP_NFT_STORAGE_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    return `ipfs://${metadataResponse.data.value.cid}`;
}
```

---

## Security Considerations

### 1. Verify Creator Ownership
```javascript
// Ensure only collection owner can mint
modifier onlyCreator() {
    require(msg.sender == creator, "Only creator can mint");
    _;
}
```

### 2. Prevent Duplicate Metadata
```javascript
// Track used URIs to prevent duplicates
mapping(bytes32 => bool) public usedURIs;

function mint(address to, string memory uri) external onlyOwner {
    bytes32 uriHash = keccak256(abi.encodePacked(uri));
    require(!usedURIs[uriHash], "URI already used");
    usedURIs[uriHash] = true;
    // ... mint logic
}
```

### 3. Validate IPFS Metadata
```javascript
// Backend validation
function validateMetadata(metadata) {
    if (!metadata.name || metadata.name.length < 1) {
        throw new Error('Invalid name');
    }
    if (!metadata.image || !metadata.image.startsWith('ipfs://')) {
        throw new Error('Invalid IPFS image URL');
    }
    return true;
}
```

---

## Deployment Checklist

- [ ] Deploy Factory Contract to blockchain
- [ ] Deploy ERC721Collection implementation contract
- [ ] Save addresses to environment variables
- [ ] Start blockchain event listener
- [ ] Create Collection modal in frontend
- [ ] Mint NFT form in frontend
- [ ] IPFS upload service working
- [ ] Database models updated
- [ ] Test factory flow end-to-end
- [ ] Test event listener and indexing
- [ ] Security audit of contracts
- [ ] Gas optimization review

---

## Cost Analysis

### One-Time Setup Costs
- Factory Contract Deployment: ~$150-300 (varies by network)
- Implementation Contract: ~$100-200
- **Total Initial: $250-500**

### Per-User Costs
- Factory Pattern: Each user pays ~$300-500 to create collection
- Shared Pattern: Zero per-user (one-time contract)
- Lazy Mint Pattern: Zero per-user

### Per-Transaction Costs
- Minting: $10-50 (depends on network)
- Buying/Selling: $5-30 (marketplace handles)

**Recommendation:** Use Polygon for cheaper gas (~$1-5 per transaction)

---

## Migration from Current System

If you're already storing NFTs in database, transition to on-chain:

1. **Create smart contract** with migration function
2. **Export NFT data** from MongoDB
3. **Batch mint** existing NFTs to real owners
4. **Update database** to reference on-chain token IDs
5. **Start listening** for future mints

---

## Conclusion

You have **multiple options** for implementing on-chain minting:

- **Factory Pattern** ✅ Best for professional collections
- **Shared Pattern** ✅ Simplest to build
- **Lazy Minting** ✅ Best for user adoption

**Recommendation for Durchex:** Start with **Factory Pattern** for professional positioning, migrate to **Lazy Minting** for mass adoption once established.

Deploy factory contract **once**, then all users can create collections **without you deploying more contracts**.

The marketplace automatically tracks everything via:
1. Event listeners (detect creates, mints, transfers)
2. API queries (fetch current state)
3. Database indexing (search and sort)

This is exactly how OpenSea and Rarible work!

