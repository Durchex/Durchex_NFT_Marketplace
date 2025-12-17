# Unminted NFT & Fee Subsidy System

## Overview

This system allows admins to:
1. **Create and list unminted NFTs** on the marketplace before they're minted on-chain
2. **Offer NFTs to specific users** for giveaways
3. **Subsidize network fees** for selected users (pay a percentage of their minting costs)
4. **Track minting progress** and update NFT status when minted

## Features

### 1. Create Unminted NFT
Admins can create NFTs that display on the site but haven't been minted yet. Perfect for:
- Pre-launch NFTs
- Giveaway campaigns
- Limited edition drops
- Testing NFT listings

### 2. Giveaway System
- Mark NFTs as giveaways
- Offer specific NFTs to specific wallet addresses
- Track status: pending → offered → claimed → minted
- Revoke offers if needed

### 3. Fee Subsidy Program
- Set a percentage of network fees that admin will cover
- Apply subsidy to specific NFTs or recipients
- Track subsidy claims
- Users mint for cheaper when subsidy is applied

## API Endpoints

### Create Unminted NFT
**POST** `/api/v1/admin/nfts/unminted/create`

```json
{
  "name": "Limited Edition Art #1",
  "description": "Exclusive digital art piece",
  "image": "https://cdn.example.com/art1.png",
  "category": "art",
  "collection": "Limited Edition Collection",
  "network": "Polygon",
  "price": "5.99",
  "isGiveaway": false,
  "adminNotes": "High demand expected",
  "properties": {
    "rarity": "rare",
    "artist": "John Doe",
    "edition": "1/100"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Unminted NFT created successfully",
  "nft": {
    "_id": "507f1f77bcf86cd799439011",
    "itemId": "Limited Edition Collection-1702894634002-abc123",
    "name": "Limited Edition Art #1",
    "isMinted": false,
    "isGiveaway": false,
    "giveawayStatus": "pending",
    "owner": "admin",
    "currentlyListed": true,
    "createdAt": "2025-12-17T12:00:00.000Z"
  }
}
```

---

### Get All Unminted NFTs
**GET** `/api/v1/admin/nfts/unminted/list`

**Query Parameters:**
- `isGiveaway` (optional): `true` or `false`
- `network` (optional): blockchain network name

**Example:**
```
GET /api/v1/admin/nfts/unminted/list?isGiveaway=true&network=Polygon
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "nfts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "itemId": "item-123",
      "name": "NFT Name",
      "isGiveaway": true,
      "giveawayStatus": "pending",
      "isMinted": false,
      "network": "Polygon",
      "price": "5.99"
    }
  ]
}
```

---

### Offer NFT to User
**POST** `/api/v1/admin/nfts/offer`

Offer an unminted NFT to a specific user and optionally subsidize their minting fees.

```json
{
  "itemId": "Limited Edition Collection-1702894634002-abc123",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
  "subsidyPercentage": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFT offered to 0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
  "nft": {
    "itemId": "Limited Edition Collection-1702894634002-abc123",
    "offeredTo": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
    "giveawayStatus": "offered",
    "feeSubsidyEnabled": true,
    "feeSubsidyPercentage": 50
  }
}
```

---

### Set Fee Subsidy for NFT
**POST** `/api/v1/admin/nfts/subsidy/set`

Configure fee subsidies for an NFT and specify eligible recipients.

```json
{
  "itemId": "Limited Edition Collection-1702894634002-abc123",
  "percentage": 75,
  "recipients": [
    {
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
      "subsidy": "0",
      "claimed": false
    },
    {
      "walletAddress": "0x123456789abcdef123456789abcdef123456789a",
      "subsidy": "0",
      "claimed": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fee subsidy set to 75%",
  "nft": {
    "itemId": "Limited Edition Collection-1702894634002-abc123",
    "feeSubsidyEnabled": true,
    "feeSubsidyPercentage": 75,
    "feeSubsidyRecipients": [
      {
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
        "subsidy": "0",
        "claimed": false
      }
    ]
  }
}
```

---

### Get Fee Subsidy Info
**GET** `/api/v1/admin/nfts/subsidy/:itemId`

Retrieve subsidy information for an NFT.

**Example:**
```
GET /api/v1/admin/nfts/subsidy/Limited%20Edition%20Collection-1702894634002-abc123
```

**Response:**
```json
{
  "success": true,
  "itemId": "Limited Edition Collection-1702894634002-abc123",
  "feeSubsidyEnabled": true,
  "feeSubsidyPercentage": 50,
  "offeredTo": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
  "recipients": [
    {
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
      "subsidy": "0",
      "claimed": false
    }
  ]
}
```

---

### Mark NFT as Minted
**POST** `/api/v1/admin/nfts/minted/mark`

Update NFT status after it has been minted on-chain.

```json
{
  "itemId": "Limited Edition Collection-1702894634002-abc123",
  "tokenId": "1",
  "txHash": "0xabcdef123456789abcdef123456789abcdef123456789abcdef123456789abc",
  "nftContract": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFT marked as minted",
  "nft": {
    "itemId": "Limited Edition Collection-1702894634002-abc123",
    "isMinted": true,
    "mintedAt": "2025-12-17T12:05:00.000Z",
    "mintTxHash": "0xabcdef...",
    "tokenId": "1",
    "nftContract": "0x12345...",
    "giveawayStatus": "minted"
  }
}
```

---

### Get Giveaway NFTs
**GET** `/api/v1/admin/nfts/giveaways/list`

**Query Parameters:**
- `status` (optional): `pending`, `offered`, `claimed`, or `minted`
- `offeredTo` (optional): wallet address

**Example:**
```
GET /api/v1/admin/nfts/giveaways/list?status=offered&offeredTo=0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "giveaways": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "itemId": "item-123",
      "name": "Giveaway NFT",
      "isGiveaway": true,
      "giveawayStatus": "offered",
      "offeredTo": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
      "feeSubsidyEnabled": true,
      "feeSubsidyPercentage": 50
    }
  ]
}
```

---

### Revoke NFT Offer
**POST** `/api/v1/admin/nfts/offer/revoke`

Cancel an offer and reset the NFT to pending status.

```json
{
  "itemId": "Limited Edition Collection-1702894634002-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFT offer revoked",
  "nft": {
    "itemId": "Limited Edition Collection-1702894634002-abc123",
    "offeredTo": null,
    "giveawayStatus": "pending",
    "feeSubsidyEnabled": false,
    "feeSubsidyPercentage": 0
  }
}
```

---

## Usage Workflows

### Workflow 1: Simple Giveaway
1. **Create unminted NFT**
   ```bash
   POST /api/v1/admin/nfts/unminted/create
   Body: { name, description, image, isGiveaway: true }
   ```

2. **Offer to user**
   ```bash
   POST /api/v1/admin/nfts/offer
   Body: { itemId, walletAddress }
   ```

3. **User mints NFT** (with discount if subsidized)

4. **Update status**
   ```bash
   POST /api/v1/admin/nfts/minted/mark
   Body: { itemId, tokenId, txHash, nftContract }
   ```

### Workflow 2: Subsidized NFT Sale
1. **Create unminted NFT**
   ```bash
   POST /api/v1/admin/nfts/unminted/create
   Body: { name, description, image, isGiveaway: false }
   ```

2. **Set fee subsidy**
   ```bash
   POST /api/v1/admin/nfts/subsidy/set
   Body: { itemId, percentage: 50, recipients: [...] }
   ```

3. **Offer to selected users**
   ```bash
   POST /api/v1/admin/nfts/offer
   Body: { itemId, walletAddress, subsidyPercentage: 50 }
   ```

4. **Users mint with 50% fee discount**

5. **Mark as minted when complete**
   ```bash
   POST /api/v1/admin/nfts/minted/mark
   ```

### Workflow 3: Pre-Launch Collection
1. **Create multiple unminted NFTs** for the collection
2. **Display on site** (they appear as "Coming Soon" with metadata)
3. **Setup fee subsidies** for early adopters
4. **Launch date arrives** → Users mint NFTs
5. **Update all NFTs to minted** as transactions confirm

## Frontend Integration

### Admin Dashboard Features
The admin dashboard should include:

1. **Unminted NFT Manager**
   - View all unminted NFTs
   - Create new unminted NFTs
   - Edit NFT details
   - Set fee subsidies
   - Mark as minted

2. **Giveaway Center**
   - View all giveaway NFTs
   - Offer NFTs to users
   - Track giveaway status
   - Revoke offers

3. **Fee Subsidy Dashboard**
   - See subsidy percentages
   - Track subsidy recipients
   - Monitor claimed subsidies
   - Adjust subsidy amounts

### User-Facing Features
1. **NFT Discovery**
   - See unminted NFTs marked as "Pre-Launch"
   - View fee subsidy info

2. **Minting Flow**
   - See eligible subsidy discount
   - Mint with reduced fees
   - Track transaction

3. **Giveaway Center** (user view)
   - See offered NFTs
   - Accept giveaway offer
   - Mint with full subsidy

## Database Fields Reference

### NFT Model Addition
```javascript
{
  isMinted: Boolean,              // Minting status
  mintedAt: Date,                 // When minted
  mintTxHash: String,             // Blockchain transaction hash
  feeSubsidyEnabled: Boolean,     // Is subsidy active
  feeSubsidyPercentage: Number,   // 0-100
  feeSubsidyRecipients: [         // Who can claim
    {
      walletAddress: String,
      subsidy: String,            // Amount
      claimed: Boolean,
      claimedAt: Date
    }
  ],
  isGiveaway: Boolean,            // Is this a giveaway
  giveawayStatus: String,         // pending/offered/claimed/minted
  offeredTo: String,              // Wallet address
  adminNotes: String              // Internal notes
}
```

## Examples

### cURL Examples

**Create Unminted NFT:**
```bash
curl -X POST https://durchex.com/api/v1/admin/nfts/unminted/create \
  -H "Content-Type: application/json" \
  -H "x-admin-id: admin_id_here" \
  -d '{
    "name": "Summer Collection #1",
    "description": "Exclusive summer NFT",
    "image": "https://cdn.example.com/summer1.png",
    "category": "art",
    "collection": "Summer Collection",
    "network": "Polygon",
    "price": "9.99",
    "isGiveaway": false
  }'
```

**Offer to User:**
```bash
curl -X POST https://durchex.com/api/v1/admin/nfts/offer \
  -H "Content-Type: application/json" \
  -H "x-admin-id: admin_id_here" \
  -d '{
    "itemId": "Summer Collection-1702894634002-abc123",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
    "subsidyPercentage": 75
  }'
```

**Get Fee Subsidy Info:**
```bash
curl -X GET "https://durchex.com/api/v1/admin/nfts/subsidy/Summer Collection-1702894634002-abc123" \
  -H "x-admin-id: admin_id_here"
```

---

## Notes
- All unminted NFTs are stored in the database with `isMinted: false`
- They appear on the marketplace but cannot be purchased until minted
- Fee subsidies are calculated on the frontend/backend when user initiates minting
- Always mark NFT as minted after blockchain confirmation to prevent duplicate minting
