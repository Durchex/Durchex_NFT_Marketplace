# NFT Marketplace Flow Diagram

## 1. Admin Creates & Lists NFT

```
Admin Dashboard
    ↓
Click "Create NFT" or "List NFT"
    ↓
Fill Form:
  - Name, Description
  - Image URL, Price
  - Network (polygon/ethereum/bsc/arbitrum)
  - Category, Properties
    ↓
Click "List" Button
    ↓
Frontend: POST /api/v1/nft/nfts
    ↓
Backend: createNft() controller
    ↓
MongoDB: Save NFT with {
  currentlyListed: true,  ← KEY!
  network: "polygon",
  itemId: "xyz",
  owner: "0xABC",
  seller: "0xABC",
  name: "NFT Name",
  image: "https://...",
  price: "1.5",
  ...
}
    ↓
✅ NFT Created in Database
```

---

## 2. User Visits Explore Page

```
User navigates to /explore
    ↓
Explore.jsx useEffect triggered
    ↓
┌─────────────────────────────────────────────┐
│ For each network: polygon, ethereum, bsc    │
│                                              │
│  GET /api/v1/nft/nfts/:network              │
│     ↓                                        │
│  Backend: fetchAllNftsByNetwork()            │
│     ↓                                        │
│  MongoDB: find({                            │
│    network: :network,                       │
│    currentlyListed: true  ← FILTERS!        │
│  })                                          │
│     ↓                                        │
│  Returns array of NFTs                      │
│                                              │
│  [NFT1, NFT2, NFT3, ...]                    │
└─────────────────────────────────────────────┘
    ↓
Frontend: Aggregate all networks
    ↓
State: setPopularNFTs([...all NFTs])
       setNewlyAddedNFTs([...recent NFTs])
    ↓
✅ Explore Page Renders NFT Cards
   (showing real NFTs, not mock data!)
```

---

## 3. User Clicks on NFT Card

```
User sees NFT card on Explore
    ↓
Clicks on NFT
    ↓
Navigate to /nft/:id
    ↓
NftDetailsPage.jsx useEffect triggered
    ↓
Call: nftAPI.getNftById(id)
    ↓
┌─────────────────────────────────────────────┐
│ For each network: ethereum, polygon, bsc    │
│                                              │
│  GET /api/v1/nft/nfts/:network              │
│     ↓                                        │
│  Backend returns all listed NFTs            │
│     ↓                                        │
│  Frontend: Find NFT where:                  │
│    nft._id === id OR                        │
│    nft.itemId === id                        │
│     ↓                                        │
│  If found: return nft                       │
│  If not: continue to next network           │
└─────────────────────────────────────────────┘
    ↓
Set state: setNft(nftData)
    ↓
✅ Details Page Renders with:
   - NFT Image
   - Name, Description
   - Price, Stats
   - Owner info
```

---

## Database Query Flow

### Explore Page Queries:
```
Query 1: db.nfts.find({ network: "polygon", currentlyListed: true })
Query 2: db.nfts.find({ network: "ethereum", currentlyListed: true })
Query 3: db.nfts.find({ network: "bsc", currentlyListed: true })
Query 4: db.nfts.find({ network: "arbitrum", currentlyListed: true })

Result: All NFTs across all networks that are listed
```

### Details Page Query:
```
Query: db.nfts.find({})
       → Filter by _id or itemId in frontend

Alternative: Could use direct query if backend supported it
             db.nfts.findOne({ _id: ObjectId("...") })
```

---

## Data Flow: Step by Step

### Step 1: Admin Lists NFT
```
Admin Form Input
    ↓ Form Submission
Axios POST Request
    ↓ Network
Backend Express Endpoint
    ↓ Route Handler
Database Query
    ↓ Insert/Update
MongoDB Document
    {
      _id: ObjectId(...),
      currentlyListed: true,
      network: "polygon",
      itemId: "nft_123",
      owner: "0x...",
      name: "My NFT",
      image: "https://...",
      price: "1.5"
    }
    ↓ Success Response
Frontend Toast: "NFT Listed!"
    ✅ NFT is now in database
```

### Step 2: Explore Page Loads
```
Component Mounts
    ↓ useEffect
Initialize Data Function
    ↓ Loop
For each network
    ↓ API Call
GET /api/v1/nft/nfts/polygon
    ↓ Response
[{NFT1}, {NFT2}, {NFT3}]
    ↓ Aggregate
All networks combined
    ↓ Set State
setPopularNFTs()
    ↓ Render
JSX renders NFT cards
    ✅ User sees NFTs on page
```

### Step 3: User Navigates to Details
```
Click NFT Card
    ↓ React Router
Navigate to /nft/:id
    ↓ URL Parameter
id = NFT's MongoDB ObjectId or itemId
    ↓ Component Mount
NftDetailsPage useEffect fires
    ↓ API Call
nftAPI.getNftById(id)
    ↓ Search All Networks
Loop through all blockchain networks
    ↓ Find Match
Found! NFT matches the ID
    ↓ Set State
setNft(nftData)
    ↓ Render
Display full NFT details
    ✅ Details page loaded!
```

---

## Error Handling Flow

### If NFT Not Listed (currentlyListed = false):
```
User: "Why doesn't my NFT show on explore?"
    ↓
Check: currentlyListed field
    ↓
Is it false?
    ↓ YES
Solution:
1. Go to Admin Dashboard
2. Find NFT
3. Click toggle to "Listed" (set to true)
4. NFT will now appear on explore
    ✅ Fixed!
```

### If Details Page Shows Error:
```
Error Message: "NFT Not Found"
    ↓
Browser Console Log:
"[NftDetailsPage] NFT not found in any network"
    ↓
Troubleshooting:
1. Check URL has correct ID
2. Verify MongoDB document exists
3. Check if NFT has correct network field
4. Ensure _id or itemId matches
    ↓
If still not found:
- May have been deleted
- May have wrong network
- Database corruption possible
```

---

## Performance Optimization

### Current Flow (4 Network Queries):
```
Time: ~100-400ms (depending on network)

Timeline:
0ms   ├─ Query Polygon
25ms  │  Response: 5 NFTs
50ms  ├─ Query Ethereum  
75ms  │  Response: 3 NFTs
100ms ├─ Query BSC
125ms │  Response: 2 NFTs
150ms ├─ Query Arbitrum
175ms │  Response: 1 NFT
200ms ├─ Aggregate Results
      ├─ Set State
      └─ Render UI
300ms ✅ Page Ready
```

### Future Optimization Options:
```
Option 1: Parallel Queries (Current)
- Faster: ~200ms

Option 2: Caching Layer
- Cache on frontend: ~50ms
- Cache on backend: ~100ms

Option 3: Database Index
- Index on (network, currentlyListed)
- Reduces query time: ~30-50%

Option 4: Single Aggregated Endpoint
- Backend: db.nfts.find({ currentlyListed: true })
- Single query, returns all networks
- Fastest: ~150ms
```

---

## Component Architecture

```
App.jsx
├── Router
│   ├── /explore → Explore.jsx
│   │   ├── Header
│   │   ├── PopularNFTs (displays NFT cards)
│   │   ├── NewlyAddedNFTs (displays NFT cards)
│   │   └── Footer
│   │
│   ├── /nft/:id → NftDetailsPage.jsx
│   │   ├── Header
│   │   ├── NFT Image
│   │   ├── NFT Details
│   │   │   ├── Name
│   │   │   ├── Description
│   │   │   ├── Price
│   │   │   └── Stats
│   │   └── Footer
│   │
│   └── /admin → Admin Panel
│       ├── AdminDashboard
│       ├── AdminNFTs
│       │   ├── Create NFT
│       │   └── List NFTs
│       └── Other Admin Pages

API Layer
├── services/api.js
│   ├── nftAPI.getAllNftsByNetwork()
│   ├── nftAPI.getNftById()
│   └── nftAPI.getSingleNft()

Backend
├── routes/nftRouter.js
│   ├── GET /nft/nfts/:network
│   ├── GET /nft/nft/:network/:itemId/:tokenId
│   └── POST /nft/nfts
│
├── controllers/nftController.js
│   ├── fetchAllNftsByNetwork()
│   ├── fetchSingleNft()
│   └── createNft()

Database
└── MongoDB
    └── nfts collection
        ├── Query: { network, currentlyListed: true }
        └── Indexes: network, itemId, currentlyListed
```

---

## Key Fields Explained

```
currentlyListed: boolean
  ↓ Purpose: Controls visibility on marketplace
  ↓ Explore fetches: WHERE currentlyListed = true
  ↓ Admin controls: Toggle button in NFT admin panel

network: string
  ↓ Purpose: Identifies blockchain network
  ↓ Values: "polygon" | "ethereum" | "bsc" | "arbitrum"
  ↓ Used for: Routing queries, filtering results

itemId: string (unique)
  ↓ Purpose: Unique identifier within network
  ↓ Used by: Backend routes, cross-network search
  ↓ Example: "nft_123_xyz"

_id: ObjectId (MongoDB)
  ↓ Purpose: Database primary key
  ↓ Auto-generated: When document created
  ↓ Used by: URL parameters (/nft/:id)

owner: string (wallet address)
  ↓ Purpose: Current owner of NFT
  ↓ Format: "0x..."
  ↓ Used by: Stats, transaction history

seller: string (wallet address)
  ↓ Purpose: Original creator/seller
  ↓ Format: "0x..."
  ↓ Used by: Royalties, listing info
```

---

## Summary

The marketplace now works like this:

1. **Admin creates NFT** → Stores in database with `currentlyListed: true`
2. **User visits `/explore`** → Fetches from ALL networks, shows listed NFTs
3. **User clicks NFT** → Searches all networks to find and display details
4. **Details page loads** → Shows full NFT information and stats

✅ **Before Fix**: Only checked Polygon, details page broke  
✅ **After Fix**: Checks all networks, cross-network search works  
✅ **Result**: Users can see and interact with admin-listed NFTs!
