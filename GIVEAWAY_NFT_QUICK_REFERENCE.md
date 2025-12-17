# Giveaway NFTs & Countdown Timer - Quick Reference

## For Users

### How to View Your Giveaway NFTs

1. **Connect Wallet**
   - Click wallet connect button in header
   - Approve connection

2. **Open Profile**
   - Click your profile icon
   - Go to Profile page

3. **Navigate to Giveaway NFTs Tab**
   - You'll see tabs: MyProfile, Owned, **Giveaway NFTs**, My Points, etc.
   - Click "Giveaway NFTs"

4. **View Your Giveaways**
   - See all NFTs the admin offered to you
   - Each card shows:
     - NFT image
     - Name and collection
     - Network (Ethereum, Polygon, etc.)
     - Status (Coming, Active, Claimed)

### Countdown Timer

**What you'll see:**
- If event is scheduled: `XX days XX hours XX minutes XX seconds`
- When event starts: `Live Now!` in green
- Once claimed: `Claimed` status

**How to use it:**
1. Check the countdown to know when minting opens
2. Come back when it says "Live Now!"
3. Click "Claim & Mint Now" to claim your NFT

### Claiming Your NFT

**When you can claim:**
- Event must be live (countdown shows "Live Now!")
- Button shows "Claim & Mint Now" (blue)

**To claim:**
1. Click "Claim & Mint Now" button
2. Wait for confirmation
3. See "Successfully claimed!" message
4. Button changes to "Claimed" (green, disabled)

**What happens after claim:**
- NFT is reserved for you
- You can now mint it to your wallet
- Follow the minting instructions in the marketplace

### Fee Subsidy

**What it means:**
- Green badge showing: `50% Network Fee Covered`
- Admin pays part of your minting fee
- You only pay the remaining percentage

**Example:**
- Network fee normally: 1 ETH
- Admin covers: 50%
- You pay: 0.5 ETH

---

## For Admins

### Creating Giveaway NFTs

**In UnmintedNFT Manager:**

1. **Create Collection (Optional)**
   - Click "Create Collection" button
   - Fill in:
     - Collection Name
     - Symbol
     - Select Network
     - Add Collection Image
     - Add Description
   - Click "Create"

2. **Create NFT**
   - Click "Create Unminted NFT" button
   - Select Collection
   - Fill in NFT details:
     - Name
     - Description
     - Upload Image (file upload, not URL)
   - Set Price

3. **Configure Event (NEW)**
   - Set "Event Start Time" to when users can mint
   - Leave "Fee Subsidy" disabled for now

4. **Enable Fee Subsidy**
   - Check "Enable Fee Subsidy"
   - Set percentage (e.g., 50% to cover half)
   - Save

5. **Mark as Giveaway**
   - Check "Is Giveaway" checkbox
   - Save

### Offering NFT to User

**From Admin Dashboard:**

1. Go to GiveawayCenter
2. Find the NFT you created
3. Click "Offer to User"
4. Enter user's wallet address
5. Click "Confirm"

**Behind the scenes:**
- NFT status changes to "offered"
- User can now see it in their Giveaway NFTs tab
- Countdown timer appears (if event time is set)

### Monitoring Giveaways

**See who claimed:**
1. Go to GiveawayCenter
2. Filter by "Claimed" status
3. See wallet addresses who claimed
4. View claim timestamps

**Revoke if needed:**
1. Find the NFT
2. Click "Revoke Offer"
3. NFT goes back to "pending" status
4. User can no longer see it

---

## API Reference (Developers)

### Get User's Giveaway NFTs

```bash
curl -X GET "http://localhost:8080/admin/nfts/giveaways/my-nfts" \
  -H "x-user-wallet: 0x742d35Cc6634C0532925a3b844Bc2e7B2f8e91Ab"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "nfts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dragon NFT #001",
      "image": "data:image/png;base64,...",
      "collection": "Dragons",
      "network": "Ethereum",
      "price": "0.5",
      "eventStartTime": "2026-03-15T10:00:00Z",
      "eventStatus": "pending",
      "giveawayStatus": "offered",
      "feeSubsidyPercentage": 50
    }
  ]
}
```

### Claim Giveaway NFT

```bash
curl -X POST "http://localhost:8080/admin/nfts/giveaways/claim" \
  -H "x-user-wallet: 0x742d35Cc6634C0532925a3b844Bc2e7B2f8e91Ab" \
  -H "Content-Type: application/json" \
  -d '{"nftId": "507f1f77bcf86cd799439011"}'
```

**Success Response:**
```json
{
  "success": true,
  "message": "NFT claimed successfully!",
  "nft": {
    "_id": "507f1f77bcf86cd799439011",
    "giveawayStatus": "claimed",
    "giveawayClaimedAt": "2026-03-15T10:00:15Z"
  }
}
```

**Error Response (Event not started):**
```json
{
  "error": "Minting has not started yet",
  "eventStartsAt": "2026-03-15T10:00:00Z"
}
```

---

## Database Fields

### NFT Model - Giveaway Fields

```javascript
isGiveaway: Boolean                  // true = giveaway
giveawayStatus: String              // pending, offered, claimed, minted
offeredTo: String                   // wallet address
giveawayClaimedAt: Date            // when user claimed

// Event timing
eventStartTime: Date                // when minting opens
eventStatus: String                 // pending, live, ended

// Fee subsidy
feeSubsidyEnabled: Boolean         // true = admin covers fees
feeSubsidyPercentage: Number       // 0-100
feeSubsidyRecipients: [{           // tracking per user
  walletAddress: String,
  subsidy: String,
  claimed: Boolean,
  claimedAt: Date
}]
```

---

## Common Scenarios

### Scenario 1: Create & Offer Giveaway NFT

1. Admin creates unminted NFT
2. Sets event start time to tomorrow 3 PM
3. Sets 50% fee subsidy
4. Marks as giveaway
5. Offers to user wallet address
6. User sees countdown starting tomorrow
7. Tomorrow at 3 PM: "Live Now!" button appears
8. User clicks "Claim & Mint Now"
9. NFT status changes to "claimed"

### Scenario 2: Multiple Networks

Admin can create giveaways on different blockchains:
- Ethereum giveaway (1 ETH)
- Polygon giveaway (10 MATIC)
- Arbitrum giveaway (0.1 ARB)

Each shows appropriate network in the user's giveaway list.

### Scenario 3: Limited Time Event

Admin sets event start time for specific date/time.

**Timeline:**
- T-24 hours: "24 days 00 hours 00 minutes..." countdown
- T-1 hour: "00 days 01 hours 00 minutes..."
- T-0 minutes: Shows "Live Now!"
- T+∞: Still shows "Live Now!"

---

## Troubleshooting

### User Can't See Giveaway Tab

**Solution:**
1. Ensure wallet is connected
2. Refresh page
3. Check browser console for errors

### Countdown Shows Wrong Time

**Solution:**
1. Check server time is correct
2. Check eventStartTime format (must be ISO 8601)
3. Refresh page

### Can't Claim Before Event Start

**Expected behavior:**
- Can only claim AFTER event starts
- Try again when countdown reaches "Live Now!"

### Claim Button Doesn't Work

**Check:**
1. Event must have started
2. Wallet must be connected
3. Check browser console for error
4. Try clearing browser cache

---

## Integration Points

### Used by These Components

1. **Profile.jsx**
   - Displays "Giveaway NFTs" tab
   - Renders MyGiveawayNFTs component

2. **MyGiveawayNFTs.jsx**
   - Fetches user's giveaways
   - Displays countdown timers
   - Handles claiming

3. **CountdownTimer.jsx**
   - Shows time remaining
   - Auto-updates every second
   - Shows "Live Now!" when event starts

### API Calls Made

- `GET /admin/nfts/giveaways/my-nfts` - Fetch giveaways
- `POST /admin/nfts/giveaways/claim` - Claim NFT

---

## Performance Tips

### For Admins
- Set reasonable event start times (not too far in future)
- Use realistic fee subsidies (0-50% recommended)
- Don't offer too many NFTs to same user

### For Users
- Bookmark the Giveaway NFTs page
- Check back a few hours before event starts
- Clear browser cache if having issues

---

## Updates & Changes

### Version 1.0 (Current)
- ✅ User profile giveaway display
- ✅ Countdown timer component
- ✅ Claim functionality
- ✅ Fee subsidy display

### Version 1.1 (Planned)
- [ ] Email notifications when event starts
- [ ] Bulk claiming
- [ ] Marketplace countdown display
- [ ] Admin giveaway analytics

---

## Support

**For Issues:**
1. Check troubleshooting section above
2. Review GIVEAWAY_NFT_SYSTEM_COMPLETE.md
3. Check browser console for errors
4. Check backend logs

**Files Reference:**
- User Component: `frontend/src/pages/user/MyGiveawayNFTs.jsx`
- Timer Component: `frontend/src/components/CountdownTimer.jsx`
- Backend Controller: `backend_temp/controllers/adminController.js`
- Backend Routes: `backend_temp/routes/adminRouter.js`
- Database Model: `backend_temp/models/nftModel.js`

---

**Last Updated:** March 14, 2026
**Version:** 1.0
**Status:** Production Ready
