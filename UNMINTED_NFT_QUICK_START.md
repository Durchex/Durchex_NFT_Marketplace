# Unminted NFT & Fee Subsidy - Quick Start

## What Was Added

✅ **Backend API Endpoints** (8 new endpoints)
- Create unminted NFTs
- Manage giveaways  
- Set fee subsidies
- Track minting status

✅ **Database Fields** (11 new fields in NFT model)
- Minting status tracking
- Fee subsidy management
- Giveaway workflow tracking
- Admin notes

## Quick Test Commands

### 1. Create Unminted NFT
```bash
$headers = @{"Content-Type"="application/json"; "x-admin-id"="admin_id"}
$body = @{
  name = "Test NFT"
  description = "Test"
  image = "https://via.placeholder.com/300"
  category = "art"
  collection = "Test Collection"
  network = "Polygon"
  price = "10"
  isGiveaway = $false
  properties = @{}
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://durchex.com/api/v1/admin/nfts/unminted/create" -Method POST -Headers $headers -Body $body
```

### 2. Get Unminted NFTs
```bash
$headers = @{"x-admin-id"="admin_id"}
Invoke-WebRequest -Uri "https://durchex.com/api/v1/admin/nfts/unminted/list" -Headers $headers
```

### 3. Offer NFT to User
```bash
$headers = @{"Content-Type"="application/json"; "x-admin-id"="admin_id"}
$body = @{
  itemId = "Test Collection-1702894634002-abc123"
  walletAddress = "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e"
  subsidyPercentage = 50
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://durchex.com/api/v1/admin/nfts/offer" -Method POST -Headers $headers -Body $body
```

### 4. Set Fee Subsidy
```bash
$headers = @{"Content-Type"="application/json"; "x-admin-id"="admin_id"}
$body = @{
  itemId = "Test Collection-1702894634002-abc123"
  percentage = 75
  recipients = @(
    @{
      walletAddress = "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e"
      subsidy = "0"
      claimed = $false
    }
  )
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://durchex.com/api/v1/admin/nfts/subsidy/set" -Method POST -Headers $headers -Body $body
```

### 5. Mark NFT as Minted
```bash
$headers = @{"Content-Type"="application/json"; "x-admin-id"="admin_id"}
$body = @{
  itemId = "Test Collection-1702894634002-abc123"
  tokenId = "1"
  txHash = "0xabcdef123456789..."
  nftContract = "0x1234567890123456..."
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://durchex.com/api/v1/admin/nfts/minted/mark" -Method POST -Headers $headers -Body $body
```

## New API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/admin/nfts/unminted/create` | Create new unminted NFT |
| GET | `/api/v1/admin/nfts/unminted/list` | List all unminted NFTs |
| GET | `/api/v1/admin/nfts/giveaways/list` | List giveaway NFTs |
| POST | `/api/v1/admin/nfts/offer` | Offer NFT to user with subsidy |
| POST | `/api/v1/admin/nfts/offer/revoke` | Cancel NFT offer |
| POST | `/api/v1/admin/nfts/subsidy/set` | Set fee subsidy details |
| GET | `/api/v1/admin/nfts/subsidy/:itemId` | Get subsidy info for NFT |
| POST | `/api/v1/admin/nfts/minted/mark` | Update NFT after minting |

## New NFT Model Fields

```javascript
// Minting Status
isMinted: Boolean              // Is NFT minted on-chain?
mintedAt: Date                 // When was it minted?
mintTxHash: String             // Blockchain transaction

// Fee Subsidy
feeSubsidyEnabled: Boolean     // Is subsidy active?
feeSubsidyPercentage: Number   // % of fees admin covers (0-100)
feeSubsidyRecipients: [        // Who gets subsidy
  {
    walletAddress: String,
    subsidy: String,
    claimed: Boolean,
    claimedAt: Date
  }
]

// Giveaway Tracking
isGiveaway: Boolean            // Is this a giveaway?
giveawayStatus: String         // pending/offered/claimed/minted
offeredTo: String              // Wallet it's offered to
adminNotes: String             // Internal notes
```

## Common Workflows

### Pre-Launch Campaign
1. Create 10 unminted NFTs for launch collection
2. Set 50% fee subsidy for first 100 minters
3. List them on site as "Pre-Launch"
4. Users see and can prepare
5. Launch day: Users mint at 50% discount
6. Mark NFTs as minted when confirmed

### VIP Giveaway Program
1. Create special NFT as giveaway
2. Set isGiveaway = true
3. Offer to VIP wallet (100% fee subsidy)
4. User mints for free (you pay all fees)
5. Update status to minted

### Limited Edition Drop
1. Create unminted NFT with metadata
2. Set 25% fee subsidy
3. Offer to selected users only
4. Users mint within subsidy window
5. After period ends, revoke subsidy

## Files Modified

- `backend_temp/models/nftModel.js` - Added 11 fields
- `backend_temp/controllers/adminController.js` - Added 8 new functions
- `backend_temp/routes/adminRouter.js` - Added 8 new endpoints

## Next Steps

1. **Deploy to server**
   ```bash
   git add .
   git commit -m "Add unminted NFT and fee subsidy system"
   git push
   ```

2. **SSH and pull changes**
   ```bash
   ssh root@213.130.144.229
   cd /home/durchex/htdocs/durchex.com
   git pull
   cd backend_temp
   npm install  # if new packages added
   sudo systemctl restart durchex-backend
   ```

3. **Build Admin Dashboard UI** (frontend component)
   - List unminted NFTs
   - Create new unminted NFT form
   - Offer/revoke NFT interface
   - Fee subsidy management panel
   - Mark as minted button

4. **Build User-Facing Features**
   - Show unminted NFTs with "Pre-Launch" badge
   - Display fee subsidy info on NFT detail page
   - Show discount at checkout
   - Track minting progress

## Testing

### Test Create Unminted NFT
1. Login as admin
2. Go to Admin Dashboard
3. Click "Create Unminted NFT"
4. Fill form and submit
5. See NFT appear in unminted list

### Test Fee Subsidy
1. Create unminted NFT
2. Set 50% fee subsidy
3. Offer to test wallet
4. Check subsidy info endpoint
5. Verify percentage is correct

### Test Giveaway
1. Create unminted NFT as giveaway
2. Offer to user wallet
3. Check giveaway status changes to "offered"
4. Revoke offer (status returns to "pending")
5. Re-offer to different wallet

## Important Notes

⚠️ **Fee Calculation**
- Subsidy percentage is stored (0-100)
- Frontend/backend calculates actual fee when user mints
- Example: If network fee = $10 and subsidy = 50%, user pays $5

⚠️ **Minting Status**
- Once marked as `isMinted: true`, NFT cannot be offered again
- Always update status after blockchain confirmation
- Use mintTxHash to track on-chain

⚠️ **Admin Authentication**
- All endpoints require `x-admin-id` header
- Make sure admin is logged in before calling
- Session expires after 24 hours

## Questions?

See full documentation: `UNMINTED_NFT_SUBSIDY_GUIDE.md`
