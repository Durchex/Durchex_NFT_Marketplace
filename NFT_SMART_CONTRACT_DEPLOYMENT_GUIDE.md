# NFT Smart Contract Deployment Integration Guide

**Critical Priority**: YES - This is the foundation for marketplace functionality  
**Estimated Time**: 3-4 days  
**Complexity**: HIGH

---

## CURRENT PROBLEM

**What happens now when user creates an NFT:**
1. Creates DB record in `nftCollection`
2. Uploads image to IPFS
3. Creates metadata JSON
4. **Stops** ❌ No contract deployment

**What should happen (OpenSea/Rarible standard):**
1. User creates collection OR NFT goes to default collection
2. **Deploy ERC-721 smart contract** ← MISSING
3. Store contract address in database
4. User creates NFT within that collection
5. Mint token on collection contract
6. Store token ID and contract address
7. Upload metadata referencing contract

---

## SOLUTION ARCHITECTURE

### Phase A: Smart Contract Layer

#### 1. Create Factory Contract (`contracts/NFTCollectionFactory.sol`)

```solidity
// Deploys ERC-721 contracts for each collection
pragma solidity ^0.8.0;

interface INFTCollection {
    function transferOwnership(address newOwner) external;
}

contract NFTCollectionFactory {
    address public owner;
    mapping(address => address[]) public userCollections;
    
    event CollectionCreated(
        address indexed creator,
        address indexed collectionAddress,
        string name
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    function createCollection(
        string memory _name,
        string memory _symbol,
        address _creator
    ) external returns (address) {
        // Deploy new ERC-721 contract
        // Set creator as owner
        // Track in mapping
        // Emit event
        // Return contract address
    }
}
```

#### 2. Standard ERC-721 Contract (`contracts/DurchexNFT.sol`)

```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract DurchexNFT is ERC721, Ownable, ERC2981 {
    string private baseURI;
    uint256 private tokenCounter;
    mapping(uint256 => string) private tokenURIs;
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _creator
    ) ERC721(_name, _symbol) {
        _transferOwnership(_creator);
    }
    
    function mint(
        address to,
        string memory metadataURI,
        uint96 royaltyPercentage
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter++;
        _safeMint(to, tokenId);
        tokenURIs[tokenId] = metadataURI;
        
        // Set royalties (EIP-2981)
        _setTokenRoyalty(tokenId, owner(), royaltyPercentage);
        
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        return tokenURIs[tokenId];
    }
    
    // Support royalty interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

### Phase B: Database Layer

#### 1. Update Collection Model

**File**: `backend_temp/models/collectionModel.js`

Add these fields:
```javascript
const collectionSchema = new Schema({
  // ... existing fields ...
  
  // Smart Contract Fields
  contractDeployment: {
    ethereum: {
      contractAddress: String,
      deploymentTx: String,
      deployedAt: Date,
      deploymentBlock: Number
    },
    polygon: {
      contractAddress: String,
      deploymentTx: String,
      deployedAt: Date,
      deploymentBlock: Number
    },
    arbitrum: {
      contractAddress: String,
      deploymentTx: String,
      deployedAt: Date,
      deploymentBlock: Number
    }
    // Add other chains as needed
  },
  
  contractABI: {
    type: Schema.Types.Mixed,
    description: "Contract ABI for frontend interaction"
  },
  
  verified: {
    type: Boolean,
    default: false,
    description: "Marketplace verified collection"
  },
  
  royaltyPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 50
  }
});
```

#### 2. Update NFT Model

**File**: `backend_temp/models/nftModel.js`

Update fields:
```javascript
const nftSchema = new Schema({
  // ... existing fields ...
  
  // Contract Reference Fields
  contractAddress: {
    type: String,
    description: "Collection contract address where this NFT was minted"
  },
  
  tokenId: {
    type: String,
    description: "Token ID from smart contract"
  },
  
  chainSpecificData: {
    ethereum: {
      contractAddress: String,
      tokenId: String,
      transactionHash: String,
      blockNumber: Number
    },
    polygon: {
      contractAddress: String,
      tokenId: String,
      transactionHash: String,
      blockNumber: Number
    },
    arbitrum: {
      contractAddress: String,
      tokenId: String,
      transactionHash: String,
      blockNumber: Number
    }
  },
  
  metadataStandard: {
    type: String,
    enum: ['opensea', 'rarible', 'generic'],
    default: 'opensea',
    description: "Which metadata standard this NFT follows"
  },
  
  traits: [{
    trait_type: String,
    value: String,
    rarity_percentage: Number
  }],
  
  contractDeploymentTx: String
});
```

### Phase C: Backend Service Layer

#### Create NFT Contract Service

**File**: `backend_temp/services/nftContractService.js`

```javascript
import { ethers } from 'ethers';
import NFTCollection from '../models/collectionModel.js';
import NFT from '../models/nftModel.js';

class NFTContractService {
  
  // Deploy collection contract
  async deployCollectionContract(collectionData, network = 'ethereum') {
    try {
      // 1. Get signer/deployer
      const signer = this.getSigner(network);
      
      // 2. Deploy factory contract or ERC-721
      const factory = await ethers.getContractFactory('DurchexNFT');
      const contract = await factory.connect(signer).deploy(
        collectionData.name,
        collectionData.symbol,
        collectionData.creator
      );
      
      await contract.deployed();
      
      // 3. Store in database
      const deploymentInfo = {
        contractAddress: contract.address,
        deploymentTx: contract.deployTransaction.hash,
        deployedAt: new Date(),
        deploymentBlock: await ethers.provider.getBlockNumber()
      };
      
      // 4. Update collection
      await NFTCollection.findByIdAndUpdate(
        collectionData._id,
        {
          [`contractDeployment.${network}`]: deploymentInfo,
          contractABI: factory.interface.format('json')
        }
      );
      
      return {
        success: true,
        contractAddress: contract.address,
        deploymentTx: contract.deployTransaction.hash,
        network
      };
      
    } catch (error) {
      console.error('Error deploying collection contract:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Mint NFT on collection contract
  async mintNFTOnContract(nftData, collectionId, network = 'ethereum') {
    try {
      // 1. Get collection data
      const collection = await NFTCollection.findById(collectionId);
      if (!collection) throw new Error('Collection not found');
      
      // 2. Get contract address for network
      const contractAddress = collection.contractDeployment[network]?.contractAddress;
      if (!contractAddress) {
        throw new Error(`Contract not deployed on ${network}`);
      }
      
      // 3. Get contract instance
      const contract = new ethers.Contract(
        contractAddress,
        collection.contractABI,
        this.getSigner(network)
      );
      
      // 4. Mint token
      const tx = await contract.mint(
        nftData.owner,
        nftData.metadataURI,
        Math.floor(nftData.royalty * 100) // Convert to basis points
      );
      
      const receipt = await tx.wait();
      
      // 5. Extract token ID from event
      const mintedEvent = receipt.events?.find(e => e.event === 'Transfer');
      const tokenId = mintedEvent?.args?.tokenId?.toString();
      
      // 6. Update NFT in database
      await NFT.findByIdAndUpdate(nftData._id, {
        contractAddress: contractAddress,
        tokenId: tokenId,
        [`chainSpecificData.${network}`]: {
          contractAddress,
          tokenId,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber
        },
        isMinted: true,
        mintedAt: new Date(),
        mintTxHash: tx.hash
      });
      
      return {
        success: true,
        tokenId,
        transactionHash: tx.hash,
        contractAddress
      };
      
    } catch (error) {
      console.error('Error minting NFT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  getSigner(network) {
    // Return configured signer for network
    // Implementation depends on your setup
    const provider = new ethers.providers.JsonRpcProvider(
      this.getRPCUrl(network)
    );
    return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  }
  
  getRPCUrl(network) {
    const urls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL
    };
    return urls[network];
  }
}

export default new NFTContractService();
```

### Phase D: API Integration

#### Update NFT Controller

**File**: `backend_temp/controllers/nftController.js`

```javascript
import nftContractService from '../services/nftContractService.js';

export const createNft = async (req, res) => {
  try {
    const { collectionId, name, description, image, price, royalty, network } = req.body;
    
    // 1. Create collection if needed
    let collection = null;
    if (collectionId) {
      collection = await Collection.findById(collectionId);
    } else {
      // Create default collection
      collection = await Collection.create({
        name: `${req.user.username}'s Collection`,
        creator: req.user.address,
        creator_name: req.user.username
      });
    }
    
    // 2. Deploy collection contract if not yet deployed
    if (!collection.contractDeployment[network]?.contractAddress) {
      const deployResult = await nftContractService.deployCollectionContract(
        collection,
        network
      );
      
      if (!deployResult.success) {
        return res.status(500).json({ 
          success: false, 
          error: 'Contract deployment failed: ' + deployResult.error 
        });
      }
    }
    
    // 3. Upload metadata to IPFS
    const metadata = {
      name,
      description,
      image,
      attributes: req.body.attributes || [],
      external_url: req.body.externalUrl
    };
    
    const ipfsResult = await ipfsService.uploadMetadata(metadata);
    
    // 4. Create NFT record
    const nft = await NFT.create({
      collection: collectionId,
      name,
      description,
      image,
      price,
      royalty,
      network,
      owner: req.user.address,
      seller: req.user.address,
      metadataURI: ipfsResult.metadataURI,
      currentlyListed: false,
      isMinted: false
    });
    
    // 5. Mint on blockchain
    const mintResult = await nftContractService.mintNFTOnContract(
      nft,
      collection._id,
      network
    );
    
    if (!mintResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Minting failed: ' + mintResult.error
      });
    }
    
    // 6. Return success
    res.status(201).json({
      success: true,
      nft: {
        ...nft.toObject(),
        contractAddress: mintResult.contractAddress,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash
      }
    });
    
  } catch (error) {
    console.error('Error creating NFT:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Phase E: Frontend Integration

#### Update Create NFT Component

**File**: `frontend/src/components/NFTMintingInterface.jsx`

```javascript
const handleMint = async () => {
  try {
    setIsMinting(true);
    
    // 1. Get or create collection
    let collection;
    if (formData.collectionId) {
      collection = await api.getCollection(formData.collectionId);
    } else {
      collection = await api.createCollection({
        name: `${userProfile.username}'s Collection`,
        description: 'My NFT Collection'
      });
    }
    
    // 2. Create NFT with contract deployment
    const response = await api.post('/api/nfts', {
      collectionId: collection._id,
      name: formData.name,
      description: formData.description,
      image: formData.image,
      price: formData.price,
      royalty: formData.royalty,
      network: formData.network,
      attributes: formData.attributes,
      externalUrl: formData.externalUrl
    });
    
    if (response.success) {
      toast.success(`NFT minted! Token ID: ${response.nft.tokenId}`);
      
      // 3. Update user's collection display
      navigate(`/nft-detail/${response.nft._id}`, {
        state: {
          nft: response.nft,
          contractAddress: response.nft.contractAddress,
          tokenId: response.nft.tokenId
        }
      });
    }
    
  } catch (error) {
    toast.error('Minting failed: ' + error.message);
  } finally {
    setIsMinting(false);
  }
};
```

---

## DEPLOYMENT STEPS

### 1. Pre-Deployment Setup (Day 1)

- [ ] Deploy NFTCollectionFactory to testnet
- [ ] Deploy DurchexNFT template to testnet
- [ ] Test factory creates valid ERC-721 contracts
- [ ] Document contract addresses
- [ ] Update environment variables

```bash
# .env
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/...
ARBITRUM_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/...
COLLECTION_FACTORY_ADDRESS=0x...
NFT_COLLECTION_ABI=...
PRIVATE_KEY=0x...
```

### 2. Smart Contract Deployment (Day 1)

```bash
# Deploy factory contract
npx hardhat run scripts/deploy-factory.js --network sepolia

# Deploy standard NFT template
npx hardhat run scripts/deploy-nft-template.js --network sepolia

# Verify on block explorer
npx hardhat verify --network sepolia 0x... "constructorArgs"
```

### 3. Backend Updates (Day 2)

- [ ] Create NFTContractService
- [ ] Update collection and NFT models
- [ ] Update nftController.js
- [ ] Add environment configuration
- [ ] Test API endpoints
- [ ] Add error handling

### 4. Testing (Day 2-3)

```javascript
// Test: Create collection with contract
POST /api/collections
{
  "name": "Test Collection",
  "symbol": "TEST",
  "network": "sepolia"
}

// Test: Create NFT with minting
POST /api/nfts
{
  "collectionId": "...",
  "name": "Test NFT",
  "metadataURI": "ipfs://...",
  "network": "sepolia"
}

// Verify: Check blockchain
etherscan.io/token/0xcontractAddress/inventory
```

### 5. Frontend Integration (Day 3-4)

- [ ] Update Create NFT component
- [ ] Add contract interaction
- [ ] Test minting flow
- [ ] Display token ID in UI
- [ ] Add transaction link
- [ ] Test on all networks

### 6. Production Deployment (Day 4)

- [ ] Deploy to mainnet
- [ ] Update production environment variables
- [ ] Monitor transactions
- [ ] Handle edge cases
- [ ] Enable user creation flows

---

## TESTING CHECKLIST

- [ ] Create collection deploys contract on Ethereum testnet
- [ ] Contract address stored in database
- [ ] Create NFT mints token on collection contract
- [ ] Token ID returned and stored
- [ ] Metadata URI points to IPFS
- [ ] OpenSea recognizes contract
- [ ] Royalties enforced (EIP-2981)
- [ ] Multi-network deployment works
- [ ] Gas estimation accurate
- [ ] Error handling for failed deployments
- [ ] Frontend displays all contract info
- [ ] User can view NFT on block explorer

---

## ROLLBACK PLAN

If issues arise:
1. Keep old DB records separate from new contract data
2. Don't delete old NFTs, mark as legacy
3. Create migration script to update existing NFTs
4. Test migration on staging first
5. Plan gradual rollout to users

---

## SUCCESS METRICS

- ✅ 100% of new collections have deployed contracts
- ✅ 100% of new NFTs have token IDs and contract addresses
- ✅ Metadata viewable on OpenSea/Rarible
- ✅ Royalties enforced and paid correctly
- ✅ < 5% minting failure rate
- ✅ < 30 second end-to-end minting time

---

**Estimated Effort**: 3-4 days  
**Team Size**: 2-3 engineers  
**Risk Level**: MEDIUM (new contract deployment logic)  
**Testing Required**: HIGH (blockchain interactions)
