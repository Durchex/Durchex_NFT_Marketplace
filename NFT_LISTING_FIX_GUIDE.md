# NFT Listing & Details Page Fix Guide

## Issue Summary
Admin-created and listed NFTs are not appearing on the Explore page, and the NFT details page has issues loading NFT information.

## Root Causes Identified

### 1. **Explore Page Issue**
- ✅ **Backend is correct**: `fetchAllNftsByNetwork` filters by `currentlyListed: true`
- ✅ **API endpoint exists**: `/nft/nfts/:network` returns listed NFTs
- **Problem**: The Explore page was only checking one network (Polygon)
- **Solution**: Now fetches from ALL networks (polygon, ethereum, bsc, arbitrum) and aggregates results

### 2. **Details Page Issue**
- ❌ **API function missing**: `nftAPI.getNftById()` didn't exist
- ❌ **Fallback broken**: Referenced non-existent `nftAPI.fetchAllNfts()`
- **Solution**: Created `getNftById()` function that searches across all networks

### 3. **Admin Listing Process**
When admin creates an NFT, they MUST include:
```javascript
{
  // ... other fields
  currentlyListed: true,    // ← CRITICAL for showing on Explore
  network: "polygon",       // ← Required
  itemId: "unique-id",      // ← Required
  owner: "wallet-address",  // ← Required
  seller: "wallet-address", // ← Required
  // ... other fields
}
```

## Fixed Components

### ✅ Frontend: API Service (`frontend/src/services/api.js`)
- Added `getNftById(id)` function
- Searches across all networks (polygon, ethereum, bsc, arbitrum)
- Falls back gracefully if NFT not found

### ✅ Frontend: Explore Page (`frontend/src/pages/Explore.jsx`)
- Now fetches from all 4 networks
- Better logging with `[Explore]` prefix
- Aggregates NFTs from all networks
- Improved error handling

### ✅ Frontend: NFT Details Page (`frontend/src/pages/NftDetailsPage.jsx`)
- Enhanced error handling with detailed logging
- Uses new `getNftById()` API function
- Fallback: searches all networks if ID not found
- Better error messages for users

## Database Requirements

For NFTs to appear on Explore page, the MongoDB document MUST have:
```javascript
{
  currentlyListed: true,  // ← REQUIRED
  network: "polygon",     // ← One of: polygon, ethereum, bsc, arbitrum
  itemId: String,         // ← Unique identifier
  owner: String,          // ← Wallet address
  seller: String,         // ← Wallet address
  name: String,
  description: String,
  image: String,
  price: String,
  category: String,
  properties: Object,
  // ... other fields
}
```

## Testing Checklist

### Step 1: Admin Creates NFT
1. Go to Admin panel
2. Click "Create NFT" or "List NFT"
3. Fill in all fields:
   - Name
   - Description
   - Image URL
   - Price
   - Network (polygon, ethereum, etc.)
   - Category
   - Properties
4. **IMPORTANT**: Make sure `currentlyListed` is set to `true`
5. Click Save

### Step 2: Verify in Database
Check MongoDB to ensure the document has `currentlyListed: true`:
```javascript
db.nfts.findOne({ itemId: "your-nft-id" })
// Should show: currentlyListed: true
```

### Step 3: Test Explore Page
1. Go to `/explore` page
2. You should see the newly created NFT in the "Popular NFTs" or "Newly Added" section
3. Check browser console for `[Explore]` logs to see which networks were fetched

### Step 4: Test Details Page
1. Click on the NFT card
2. Should navigate to `/nft/:id` and display full details
3. Check browser console for fetch logs

## Common Issues & Solutions

### Issue: NFT shows in Admin list but not on Explore
**Cause**: `currentlyListed` is `false`  
**Solution**: 
1. In Admin panel, click the NFT
2. Toggle "Listed" status to "Listed"
3. Verify toggle button changes from gray to green

### Issue: Details page shows "NFT not found"
**Cause**: NFT ID doesn't match across components  
**Solution**:
1. Check browser console for fetch logs
2. Verify the URL has correct ID: `/nft/:id`
3. Ensure MongoDB document exists with matching `_id` or `itemId`

### Issue: Explore page shows only mock data
**Cause**: API call failing or returning empty array  
**Solution**:
1. Check browser console for error logs
2. Verify backend is running: `curl http://localhost:3000/api/v1/nft/nfts/polygon`
3. Ensure database has NFTs with `currentlyListed: true`

## API Endpoints Reference

```
GET /nft/nfts/:network
- Fetches all NFTs for a network where currentlyListed = true
- Example: /nft/nfts/polygon
- Returns: Array of NFT documents

GET /nft/nft/:network/:itemId/:tokenId
- Fetches a single NFT by network and IDs
- Example: /nft/nft/polygon/item123/token456

PATCH /admin/nfts/:network/:itemId
- Updates NFT status (used by admin to toggle listing)
- Body: { currentlyListed: true/false }
- Example: PATCH /admin/nfts/polygon/item123
```

## Backend Code Reference

**NFT Model** (`backend/models/nftModel.js`):
- `currentlyListed`: Boolean (required) - Controls visibility on marketplace
- `network`: String (required) - Blockchain network
- `itemId`: String (required, unique) - NFT identifier

**NFT Controller** (`backend/controllers/nftController.js`):
- `fetchAllNftsByNetwork()` - Returns NFTs where `currentlyListed === true`

**Admin Controller** (`backend/controllers/adminController.js`):
- `updateNFTStatus()` - Toggles `currentlyListed` flag

## Next Steps

1. ✅ Verify all fixes are in place (already done)
2. Test the complete flow (step by step in Testing Checklist above)
3. Monitor browser console for any errors
4. Check backend logs for API responses
5. Verify MongoDB documents have correct fields

## Support

If issues persist:
1. Check backend is running: `node server.js`
2. Verify MongoDB connection
3. Check API responses: Open browser DevTools → Network tab
4. Review console logs: Open browser DevTools → Console tab
5. Check backend logs for errors
