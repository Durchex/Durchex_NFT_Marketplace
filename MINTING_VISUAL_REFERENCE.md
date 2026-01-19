# Minting Architecture - Visual Quick Reference
## Factory Pattern, Shared Contract & Lazy Minting Explained

---

## Visual Comparison: Three Minting Approaches

### APPROACH 1: Factory Pattern ⭐ RECOMMENDED

```
┌─────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN                              │
│                                                              │
│   ┌──────────────────────────────────────────────────┐     │
│   │         FACTORY CONTRACT (Deploy ONCE)           │     │
│   │   address factoryAddress = 0x123...             │     │
│   │   function createCollection(name, symbol)       │     │
│   └──────────────┬───────────────────────────────────┘     │
│                  │                                          │
│    Creates these on demand:                                │
│    ┌─────────────┼─────────────┬──────────────┐            │
│    ↓             ↓             ↓              ↓            │
│ ┌──────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐      │
│ │Col.1 │  │ Col. 2   │  │ Col. 3   │  │ Col. N...  │      │
│ │User A│  │ User B   │  │ User C   │  │ User N     │      │
│ │ERC721│  │ ERC721   │  │ ERC721   │  │ ERC721     │      │
│ └──────┘  └──────────┘  └──────────┘  └────────────┘      │
│    ↓             ↓             ↓              ↓            │
│  Token 0     Token 0,1     Token 0        Token 0-99      │
│  Token 1     Token 2       Token 1,...    ...             │
│  Token 2     ...           Token 2        ...             │
└─────────────────────────────────────────────────────────────┘

FLOW:
User A: "Create collection" → Factory deploys Col.1 → User A can mint to Col.1
User B: "Create collection" → Factory deploys Col.2 → User B can mint to Col.2
User C: "Create collection" → Factory deploys Col.3 → User C can mint to Col.3

MARKETPLACE TRACKS:
- Factory address (known)
- All collection addresses (discovered via events)
- All token IDs (discovered via Transfer events)
```

### APPROACH 2: Shared Contract Pattern

```
┌────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN                            │
│                                                        │
│   ┌──────────────────────────────────────────────┐   │
│   │     SHARED MARKETPLACE CONTRACT (1 only)     │   │
│   │     DurchexNFT.sol                           │   │
│   │     address marketplaceAddress = 0x456...    │   │
│   └──────────────────────────────────────────────┘   │
│                    ↑                                   │
│  All NFTs minted here, regardless of creator:        │
│                                                        │
│  TokenID 0   → Creator: 0xAAA...  (User A)           │
│  TokenID 1   → Creator: 0xBBB...  (User B)           │
│  TokenID 2   → Creator: 0xCCC...  (User C)           │
│  TokenID 3   → Creator: 0xAAA...  (User A)           │
│  TokenID 4   → Creator: 0xDDD...  (User D)           │
│  ...         → ...                                    │
│  TokenID 999 → Creator: 0xEEE...  (User E)           │
│                                                        │
└────────────────────────────────────────────────────────┘

FLOW:
User A: Calls mint(name, description, ipfs://)
        → Mints TokenID 0,3 to contract
        → Marketplace knows 0,3 belong to User A

MARKETPLACE TRACKS:
- 1 contract address (known, never changes)
- All minter addresses (tracked in contract)
- All token IDs (all in same contract)
```

### APPROACH 3: Lazy Minting Pattern

```
┌────────────────────────────────────────────────────────┐
│              OFFLINE / METADATA SIGNED                 │
│                                                        │
│  User creates NFT signature (NO blockchain):          │
│  ┌──────────────────────────────────────────────┐    │
│  │ Signed Message:                              │    │
│  │ {                                            │    │
│  │   "ipfs": "ipfs://QmABC...",                │    │
│  │   "royalty": 10%,                           │    │
│  │   "nonce": 0,                               │    │
│  │   "signature": "0x1234..."  ← Creator signs!│    │
│  │ }                                            │    │
│  └──────────────────────────────────────────────┘    │
│                   ↓                                    │
│  Marketplace stores in MongoDB:                       │
│  nft_lazy_mints collection                           │
└────────────────────────────────────────────────────────┘
                     ↓↓↓↓↓ LATER ↓↓↓↓↓
┌────────────────────────────────────────────────────────┐
│              BLOCKCHAIN (AT PURCHASE)                   │
│                                                        │
│  Buyer clicks "Buy NFT":                              │
│  ┌──────────────────────────────────────────────┐    │
│  │ Buyer's transaction includes:                │    │
│  │ - Creator's signature                        │    │
│  │ - NFT metadata                               │    │
│  │ - Buyer's payment                            │    │
│  │ - Smart contract verifies signature          │    │
│  │ - Contract mints directly to buyer           │    │
│  │ - Creator gets payment                       │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Result: NFT exists, buyer owns it, creator paid ✓   │
└────────────────────────────────────────────────────────┘

KEY: Creator never paid gas ✓
     NFT only minted when someone buys
```

---

## Data Flow Comparison

### Factory Pattern: Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User creates collection                             │
└─────────────────────────────────────────────────────────────┘
User: "Create collection" → Frontend → Smart Contract
                                          Factory.createCollection()
                                          ↓
                                     Deploys new ERC721
                                     Emits: CollectionCreated
                                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Backend hears event                                 │
└─────────────────────────────────────────────────────────────┘
Event: CollectionCreated
  ↓
Backend Event Listener
  ↓
Save to MongoDB:
{
  contractAddress: "0xAAA...",
  creator: "0x123...",
  name: "Art Collection",
  createdAt: ISODate(),
  blockchain: "ethereum"
}
  ↓
Frontend shows: "Collection created!"

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: User mints NFTs                                     │
└─────────────────────────────────────────────────────────────┘
User: Calls collection.mint(ipfs://QmABC...)
  ↓
Smart Contract:
  - Mints token #0 to user
  - Emits: Transfer event (from=0x0, to=user, tokenId=0)
  ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Backend indexes NFT                                 │
└─────────────────────────────────────────────────────────────┘
Event: Transfer
  ↓
Backend Event Listener
  ↓
Fetch from contract:
  - tokenURI(0) → ipfs://QmABC...
  - balanceOf(user) → 1
  ↓
Fetch metadata from IPFS:
  {
    "name": "Digital Art",
    "description": "...",
    "image": "ipfs://...",
    "attributes": [...]
  }
  ↓
Save to MongoDB:
{
  tokenId: "0",
  contractAddress: "0xAAA...",
  owner: "0x123...",
  name: "Digital Art",
  image: "ipfs://...",
  currentlyListed: false
}
  ↓
Frontend shows:
  - In user's "My NFTs"
  - In collection page
  - Available for sale
```

---

## Smart Contract Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    FACTORY PATTERN                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ DurchexNFTFactory.sol                               │    │
│  │                                                      │    │
│  │ Attributes:                                         │    │
│  │ - implementationAddress: 0x...                      │    │
│  │ - factoryOwner: 0x...                               │    │
│  │                                                      │    │
│  │ Functions:                                          │    │
│  │ - createCollection(name, symbol, royalty)          │    │
│  │ - setImplementation(newImpl)                         │    │
│  │                                                      │    │
│  │ Events:                                             │    │
│  │ - CollectionCreated(collectionAddress, creator)    │    │
│  └──────────────────────────────────────────────────────┘    │
│         ↓                                                      │
│    Uses Clones.sol (OpenZeppelin)                             │
│    to create cheap copies                                     │
│         ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ ERC721Collection.sol (template to be cloned)       │    │
│  │                                                      │    │
│  │ Attributes:                                         │    │
│  │ - creator: address                                  │    │
│  │ - royaltyPercentage: uint256                        │    │
│  │ - royaltyRecipient: address                         │    │
│  │ - _tokenIdCounter: counter                          │    │
│  │                                                      │    │
│  │ Functions:                                          │    │
│  │ - initialize(name, symbol, creator, royalty)       │    │
│  │ - mint(to, uri) → returns tokenId                   │    │
│  │ - batchMint(to, uris[]) → returns tokenIds[]       │    │
│  │ - royaltyInfo(tokenId, salePrice)                  │    │
│  │                                                      │    │
│  │ Events:                                             │    │
│  │ - MetadataUpdate(tokenId, uri)                      │    │
│  │ - Transfer (inherited from ERC721)                  │    │
│  └──────────────────────────────────────────────────────┘    │
│         ↑                                                      │
│    Cloned many times (once per collection)                    │
│         ↑                                                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ DurchexMarketplace.sol (Handles trading)           │    │
│  │                                                      │    │
│  │ Functions:                                          │    │
│  │ - listNFT(collectionAddr, tokenId, price)          │    │
│  │ - buyNFT(collectionAddr, tokenId)                  │    │
│  │ - makeOffer(collectionAddr, tokenId, offer)        │    │
│  │ - createAuction(collectionAddr, tokenId, startPrice)       │    │
│  │                                                      │    │
│  │ Internal:                                           │    │
│  │ - Handles escrow                                    │    │
│  │ - Pays royalties to creator                        │    │
│  │ - Takes marketplace fee                            │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

---

## Event Flow: What Backend Listens For

```
┌─────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN EVENTS TO LISTEN FOR                │
└─────────────────────────────────────────────────────────────┘

EVENT 1: CollectionCreated (from Factory)
─────────────────────────────────────────
Emitted when: User creates collection
Data:
  - collectionAddress: address
  - creator: address  
  - name: string
  - symbol: string
Backend action:
  → Save collection to MongoDB
  → Start listening to this collection
  → Add to collections list
  
Example:
CollectionCreated(
  "0xAAA1234...",
  "0x123abc...",
  "My Art",
  "ART"
)

─────────────────────────────────────────

EVENT 2: Transfer (from ERC721)
────────────────────────────────
Emitted when: NFT minted, transferred, or burned
Data:
  - from: address
  - to: address
  - tokenId: uint256
Backend action:
  IF from == 0x0:
    → New NFT minted
    → Fetch metadata from IPFS
    → Save to MongoDB as "owned by: to"
  ELSE IF to == 0x0:
    → NFT burned
    → Mark as deleted
  ELSE:
    → NFT transferred
    → Update owner in MongoDB

Example:
Transfer(
  "0x0000...",           // minting
  "0x123abc...",         // to this address
  "0"                    // token ID
)

─────────────────────────────────────────

EVENT 3: Approval (from ERC721)
────────────────────────────────
Emitted when: Creator approves marketplace to transfer NFT
Data:
  - owner: address
  - approved: address
  - tokenId: uint256
Backend action:
  → Log approval for transaction tracking
  → Prepare for safe transfer

─────────────────────────────────────────

EVENT 4: MetadataUpdate (custom event)
───────────────────────────────────────
Emitted when: Metadata is updated
Data:
  - tokenId: uint256
  - uri: string
Backend action:
  → Fetch new metadata from IPFS
  → Update MongoDB record
  → Notify interested users
```

---

## User Journey: Factory Pattern

```
DAY 1: Creator Joins
┌────────────────────────────────────────────┐
│ 1. Creator visits Durchex.io               │
│ 2. Clicks "Create Collection"              │
│ 3. Fills: Name, Symbol, Royalty            │
│ 4. Confirms in wallet: "Create Collection" │
│ 5. Transaction cost: ~$300 on Ethereum,    │
│    ~$1 on Polygon                          │
└────────────────────────────────────────────┘
              ↓
         ~2 minutes
              ↓
┌────────────────────────────────────────────┐
│ COLLECTION CREATED! ✓                      │
│ Collection address: 0xAAA123...           │
│ Creator profile updated                    │
│ Email notification sent                    │
└────────────────────────────────────────────┘

DAY 2: Creator Mints NFTs
┌────────────────────────────────────────────┐
│ 1. Creator uploads 50 images               │
│ 2. Fills CSV: Name, Description, Rarity   │
│ 3. Clicks "Batch Upload"                   │
│ 4. Images → IPFS (stored permanently)     │
│ 5. Metadata → IPFS                        │
│ 6. Confirms: "Mint 50 NFTs"               │
└────────────────────────────────────────────┘
              ↓
         ~3 minutes
              ↓
┌────────────────────────────────────────────┐
│ 50 NFTs MINTED! ✓                          │
│ Tokens 0-49 created                        │
│ Creator owns all 50                        │
│ Appear in "My NFTs"                        │
└────────────────────────────────────────────┘

DAY 3: Creator Lists First NFT
┌────────────────────────────────────────────┐
│ 1. Creator selects NFT #5 from collection  │
│ 2. Clicks "List for Sale"                  │
│ 3. Sets price: 0.5 ETH                     │
│ 4. Confirms: "List NFT"                    │
│ 5. Transaction cost: ~$50 on Ethereum      │
└────────────────────────────────────────────┘
              ↓
         ~1 minute
              ↓
┌────────────────────────────────────────────┐
│ NFT LISTED! ✓                              │
│ Appears in marketplace                     │
│ Other users can see it                     │
│ Other users can make offers                │
│ Other users can buy it                     │
└────────────────────────────────────────────┘

DAY 4: First Sale!
┌────────────────────────────────────────────┐
│ 1. Buyer sees NFT #5 at 0.5 ETH            │
│ 2. Clicks "Buy Now"                        │
│ 3. Confirms transaction in wallet          │
│ 4. Pays 0.5 ETH + marketplace fee (0.025)  │
└────────────────────────────────────────────┘
              ↓
         ~1 minute
              ↓
┌────────────────────────────────────────────┐
│ SALE COMPLETE! ✓                           │
│                                            │
│ Buyer: Receives NFT #5                     │
│ Creator: Receives 0.4875 ETH               │
│ Marketplace: Receives 0.0125 ETH           │
│                                            │
│ Creator can continue selling other NFTs    │
│ Creator earns 10% royalty on resales       │
└────────────────────────────────────────────┘
```

---

## Cost Comparison

```
Factory Pattern (Recommended):
────────────────────────────────
One-time setup:
├─ Factory contract: $150-300
├─ Implementation: $100-200
└─ Total: $250-500

Per creator (each creates collection):
├─ Gas cost: $300-500 on Ethereum
│           $0.50-2 on Polygon
├─ Times 1,000 creators: $300K-500K on Ethereum
│                        $500-2K on Polygon
└─ Worth it for professional positioning

Per mint:
├─ Gas cost: $10-50 on Ethereum
│           $0.01-0.10 on Polygon
├─ Times 100K NFTs: $1M-5M on Ethereum
│                   $1K-10K on Polygon
└─ Creator pays in Ethereum, marketplace subsidy on L2


Shared Contract Pattern:
────────────────────────────────
One-time setup:
├─ Shared contract: $100-150
└─ Total: $100-150

Per creator:
├─ Gas cost: ZERO (already minted to shared contract)
└─ No collection-specific contract

Per mint:
├─ Gas cost: $5-10 on Ethereum
│           $0.01-0.05 on Polygon
├─ Cheaper than factory (one contract vs many)
└─ Better for mass adoption


Lazy Minting Pattern:
────────────────────────────────
One-time setup:
├─ Lazy contract: $100-150
└─ Total: $100-150

Per creator:
├─ Gas cost: ZERO (signs message, not blockchain)
└─ Free collection creation

Per mint:
├─ Gas cost: ZERO (creator never pays)
│           Paid by buyer at purchase
├─ Much better for adoption
└─ Best for mass market
```

---

## Blockchain Network Comparison

```
ETHEREUM MAINNET:
├─ Gas for collection: $300-500
├─ Gas for mint: $30-50
├─ Gas for buy: $50-100
├─ Total cost for 1,000 creators × 100 NFTs: $15M+
├─ Pros: Most liquidity, most users
└─ Cons: Extremely expensive, slow, congested

POLYGON:
├─ Gas for collection: $0.50-1
├─ Gas for mint: $0.01-0.05
├─ Gas for buy: $0.05-0.10
├─ Total cost for 1,000 creators × 100 NFTs: $15K
├─ Pros: 100x cheaper, fast, EVM compatible
└─ Cons: Fewer users than Ethereum

BASE:
├─ Gas for collection: $0.10-0.50
├─ Gas for mint: $0.01-0.03
├─ Gas for buy: $0.03-0.05
├─ Total cost for 1,000 creators × 100 NFTs: $3K
├─ Pros: Very cheap, Coinbase backing, growing
└─ Cons: Smaller ecosystem

RECOMMENDATION FOR DURCHEX:
├─ Start with POLYGON (lowest friction)
├─ Add BASE later (Coinbase partnership)
├─ Bridge to Ethereum for enterprise users
└─ Cost: 100x lower than Ethereum mainnet
```

---

## Implementation Checklist

```
BEFORE YOU START:
─────────────────
□ Decide: Factory or Shared or Lazy?
□ Decide: Ethereum, Polygon, or multiple?
□ Decide: Who pays gas? Creator or marketplace?
□ Design: Collection creation flow
□ Design: NFT minting flow
□ Design: Listing flow


BLOCKCHAIN DEVELOPMENT:
──────────────────────
□ Write Factory contract
□ Write ERC721Collection contract  
□ Write Marketplace contract
□ Test on testnet (Sepolia, Mumbai)
□ Gas optimization
□ Security audit
□ Deploy to mainnet/polygon


BACKEND DEVELOPMENT:
───────────────────
□ Set up event listener service
□ Listen for CollectionCreated events
□ Listen for Transfer events  
□ Fetch metadata from IPFS
□ Store in MongoDB
□ Index for fast queries
□ Create APIs for frontend


FRONTEND DEVELOPMENT:
────────────────────
□ Create collection creation form
□ Create batch upload interface
□ Add IPFS upload service
□ Create minting progress indicator
□ Show created collections
□ List NFTs for sale
□ Update marketplace UI


TESTING:
────────
□ Test collection creation (10 collections)
□ Test batch minting (1,000 NFTs)
□ Test buying/selling
□ Load test (1,000 concurrent users)
□ Security test (try to exploit)


LAUNCH:
───────
□ Deploy to mainnet
□ Start backend services
□ Monitor for issues
□ Send notifications to beta testers
□ Gather feedback
```

---

## Key Differences Summary

```
FACTORY PATTERN:
┌────────────────────────────────────┐
│ ✓ Professional collections         │
│ ✓ Creator branding                 │
│ ✓ Like OpenSea/Rarible            │
│ ✗ Higher creator gas cost         │
│ ✗ More complex                     │
│ BEST FOR: Serious creators        │
└────────────────────────────────────┘

SHARED CONTRACT PATTERN:
┌────────────────────────────────────┐
│ ✓ Simpler to build                 │
│ ✓ Lower gas than factory           │
│ ✓ Good for niche markets           │
│ ✗ All NFTs in one contract        │
│ ✗ Less professional                │
│ BEST FOR: Community NFTs           │
└────────────────────────────────────┘

LAZY MINTING PATTERN:
┌────────────────────────────────────┐
│ ✓ Zero creator costs               │
│ ✓ Best for adoption                │
│ ✓ Scales easily                    │
│ ✗ More complex signatures          │
│ ✗ Need metadata storage            │
│ BEST FOR: Mass market              │
└────────────────────────────────────┘
```

---

## Next Action: Decision Tree

```
Do you want each creator to have their own collection?
├─ YES → Use FACTORY PATTERN ✓
│        (Professional, like OpenSea)
│
└─ NO → Use SHARED or LAZY PATTERN
       ├─ Want simplicity? → SHARED PATTERN ✓
       │  (Simple, one contract)
       │
       └─ Want mass adoption? → LAZY MINTING ✓
          (Zero creator costs)
```

