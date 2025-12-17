# Fee Subsidy & Event Timing System Guide

## Overview

The system has two core timing/pricing features:

1. **Event Start Time** - Controls WHEN users can mint/buy an NFT
2. **Fee Subsidy** - Controls HOW MUCH the admin pays for users' network fees

---

## 1. Event Start Time (Launch Schedule)

### What It Does
Sets when the "Mint" button becomes active for users to purchase and mint NFTs.

### Use Cases

**Pre-Launch Campaign:**
```
Admin creates 100 NFTs today
Sets Event Start Time = December 25, 2025 10:00 AM
↓
Until Dec 25: NFTs are hidden/disabled on marketplace
After Dec 25: Users see NFTs and can start minting
```

**Staggered Releases:**
```
Collection A: Event Start = Dec 20
Collection B: Event Start = Dec 27  
Collection C: Event Start = Jan 3
↓
Release different collections on different dates
Keep hype and engagement spreading over weeks
```

**Giveaway with Timed Activation:**
```
Admin creates giveaway NFT
Sets Event Start Time = Dec 31, 2025 (New Year drop)
Offers to specific users
↓
Users receive offer on Dec 24
Can't mint until Dec 31 midnight
```

### How It Works in Admin Panel

**Step 1: Create Unminted NFT**
```
Admin clicks "Create Unminted NFT"
Fills form (name, image, description, etc.)
```

**Step 2: Set Event Start Time**
```
Click "Event Start Time (When users can mint)"
Select date and time: December 25, 2025 @ 10:00 AM
```

**Step 3: Save**
```
NFT created with status: "scheduled"
Mint button appears AFTER the time
```

### Event Status Values

| Status | Meaning | User Can Mint |
|--------|---------|---------------|
| `scheduled` | Before start time | ❌ No (disabled) |
| `live` | After start time | ✅ Yes (enabled) |
| `ended` | (Future: after end time) | ❌ No (optional) |

### Frontend Display

```jsx
// Example for user browsing marketplace

// If eventStartTime is Dec 25 at 10 AM
// And current time is Dec 24 at 5 PM:

<div className="nft-card">
  <h3>Summer NFT #1</h3>
  <img src="..." />
  <button disabled>
    🔒 Minting Opens Dec 25 @ 10:00 AM
  </button>
  <p className="countdown">23 hours 55 minutes until live</p>
</div>

// After Dec 25 at 10 AM:

<div className="nft-card">
  <h3>Summer NFT #1</h3>
  <img src="..." />
  <button onClick={mint}>
    🚀 Mint Now
  </button>
  <p className="badge">Live Now!</p>
</div>
```

### Setting Up in Admin Dashboard

**Create NFT with Event Time:**
```
1. Admin Portal → Unminted NFTs → "Create Unminted NFT"
2. Fill basic info:
   - Name: "Mythic Dragon #1"
   - Collection: "Mythic Collection"
   - Network: Polygon
   - Price: 5 (MATIC)
   - Description: "Limited edition dragon NFT"
3. Set "Event Start Time": Dec 25, 2025 @ 10:00 AM
4. (Optional) Mark as Giveaway
5. Click "Create"
```

**Update Event Time Later:**
```
1. Find NFT in list
2. Click "Manage"
3. Edit "Event Start Time"
4. Save
```

---

## 2. Fee Subsidy System

### What It Does
Admin pays a **percentage** of the blockchain network fees for users minting the NFT.

### Why This Matters

**Network fees vary by blockchain:**
```
Ethereum: $5 - $100+ per transaction (expensive!)
Polygon:  $0.01 - $0.50 per transaction (cheap!)
BSC:      $0.50 - $2 per transaction (moderate)
```

**Without Subsidy:**
- User pays full fee themselves
- High fees discourage minting
- Users complain about costs

**With Subsidy (50%):**
- Admin pays 50% of network fee
- User pays 50% of network fee
- Lowers barrier to entry
- Encourages participation

### How Fee Subsidy Works

#### Example: Ethereum Network

```
User mints "Mythic Dragon" NFT on Ethereum:

Network Fee (gas cost): $50 USD
Admin sets subsidy: 100%

User pays: $0 (admin covers full $50)
Admin pays: $50

User is happy ✓
More users mint ✓
Admin promotes adoption ✓
```

#### Example 2: Partially Subsidized

```
User mints on Polygon:

Network Fee (gas cost): $0.25 MATIC
Admin sets subsidy: 70%

User pays: $0.075 MATIC (30%)
Admin pays: $0.175 MATIC (70%)

User saves money ✓
Admin reduces cost with smart subsidy ✓
```

### Setting Up Fee Subsidy

**Step 1: Create or Find NFT**
```
Go to Admin Portal → Unminted NFTs
(NFT must be created first)
```

**Step 2: Go to Fee Subsidies Dashboard**
```
Click "Fee Subsidies" in sidebar
Or click "Manage" on NFT, then "Set Subsidy"
```

**Step 3: Configure Subsidy**
```
NFT: Mythic Dragon #1
Subsidy Percentage: 50 (means 0-100 scale)
Recipient Wallets:
  - 0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e
  - 0x1234567890abcdef1234567890abcdef12345678
  - 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

**Step 4: Save**
```
✓ Subsidy enabled
✓ 50% of fees covered for listed wallets
```

### Subsidy Scenarios

#### Scenario 1: Launch Promotion
```
🎯 Goal: Get more users to try our NFTs

Action:
- Create 50 unminted NFTs
- Set 100% fee subsidy on all
- Set event start time for launch day
- Offer to top 100 users

Result:
- Users can mint for FREE (no fee)
- High adoption rate
- Full marketplace activity on launch day
```

#### Scenario 2: VIP Program
```
🎯 Goal: Reward loyal users

Action:
- Create exclusive "VIP Collection"
- Mark as giveaway
- Set 100% subsidy ONLY for VIP wallet addresses
- Regular users pay full fee
- VIP users pay nothing

Result:
- VIP users feel special
- Free minting incentivizes VIP status
- Regular users pay market rate
- Cost-effective promotion
```

#### Scenario 3: Graduated Subsidy
```
🎯 Goal: Balance promotion with profit

Action:
- Create collection with 3 batches
- Batch 1 (first 100): 80% subsidy
- Batch 2 (next 100): 50% subsidy  
- Batch 3 (remaining): 0% subsidy

Result:
- Early adopters get great deal
- Late adopters pay more
- Creates urgency
- Still promotes initial adoption
```

#### Scenario 4: Network-Specific Strategy
```
🎯 Goal: Optimize cost across chains

Ethereum NFTs:
- High fees ($50+)
- Set 100% subsidy
- Covers full cost for users

Polygon NFTs:
- Low fees ($0.25)
- Set 0% subsidy
- Users pay minimal fee anyway

Result:
- Users have consistent experience
- You pay more on expensive chains
- Smart cost allocation
```

---

## 3. Event Timing + Fee Subsidy Combined

### Real-World Example: Summer Drop Campaign

**Setup:**
```
Collection: "Summer Vibes NFTs"
Total NFTs: 1000
Network: Polygon (cheap fees)
```

**Timeline:**
```
Dec 1, 2025: Admin creates all 1000 NFTs
           - Event Start Time: Dec 25, 10:00 AM
           - Mark as giveaway
           - Set 75% fee subsidy
           
Dec 1-24:   Marketing campaign
           - "Coming Dec 25!"
           - Users get on waitlist
           - Admin offers NFTs to influencers
           
Dec 25, 10 AM: EVENT GOES LIVE
           - Mint button becomes active
           - All users can mint
           - Users pay 25% fee (75% subsidized)
           - Massive adoption day
           
Jan 15:     Subsidy ends
           - Remaining NFTs no longer subsidized
           - Users now pay full fee
           - Creates urgency for presale period
```

**Results:**
```
✓ Controlled launch timing
✓ High early adoption with subsidy
✓ User saves money (75% less fee)
✓ Admin saves money (cheap Polygon network)
✓ Clear marketing message (Dec 25 launch)
```

---

## 4. Admin Dashboard Views

### Unminted NFTs Tab
```
CREATE UNMINTED NFT button
├─ Name
├─ Description
├─ Image
├─ Collection
├─ Network
├─ Price
├─ Event Start Time ← NEW!
├─ Admin Notes
└─ Mark as Giveaway

List view shows:
- NFT name
- Collection
- Network
- Event Status (scheduled/live/ended)
- Actions: Manage, Offer, Delete
```

### Giveaways Tab
```
Status Overview:
- Pending: 45 NFTs (not yet offered)
- Offered: 23 NFTs (waiting for user claim)
- Claimed: 12 NFTs (user accepted)
- Minted: 8 NFTs (on blockchain)

Filtering:
- By status
- By event start time
- By recipient wallet

Actions:
- Offer NFT to wallet
- Revoke offer
- Mark as minted
```

### Fee Subsidies Tab
```
Subsidy Overview:
- Total Subsidized: 250 NFTs
- Avg Subsidy %: 65%
- Recipients: 1,200 wallets
- Claimed: 180 NFTs

Find NFT by:
- Collection
- Network
- Subsidy percentage

Edit Subsidy:
- Change percentage (0-100)
- Add/remove recipient wallets
- Track claim status
```

---

## 5. Technical Implementation

### Database Fields (Backend)

```javascript
nftSchema {
  // Timing fields
  eventStartTime: Date,      // When users can mint
  eventStatus: String,        // 'scheduled', 'live', 'ended'
  
  // Subsidy fields
  feeSubsidyEnabled: Boolean,
  feeSubsidyPercentage: Number (0-100),
  feeSubsidyRecipients: [
    {
      walletAddress: String,
      subsidy: String,
      claimed: Boolean,
      claimedAt: Date
    }
  ]
}
```

### API Endpoints

**Create Unminted NFT with Event Time:**
```
POST /api/v1/admin/nfts/unminted/create
{
  "name": "Mythic Dragon",
  "collection": "Mythic Collection",
  "eventStartTime": "2025-12-25T10:00:00Z",  ← NEW
  "feeSubsidyPercentage": 50                  ← Can set here
}
```

**Update Event Time:**
```
PATCH /api/v1/admin/nfts/unminted/:itemId
{
  "eventStartTime": "2025-12-26T10:00:00Z"
}
```

**Set Fee Subsidy:**
```
POST /api/v1/admin/nfts/subsidy/set
{
  "itemId": "Mythic-Collection-1234",
  "feeSubsidyPercentage": 75,
  "recipientWallets": [
    "0x742d35Cc6634C0532925a3b844Bc834e3f2b0c5e",
    "0x1234567890abcdef1234567890abcdef12345678"
  ]
}
```

---

## 6. Best Practices

### ✅ DO

1. **Set clear start times** - Helps with marketing and planning
2. **Use subsidies strategically** - For new launches or VIP programs
3. **Test on cheap networks first** - Polygon for testing, then Ethereum
4. **Document admin notes** - Remember why you set each subsidy
5. **Monitor claim rates** - Track which NFTs/subsidies work best

### ❌ DON'T

1. **Don't set 100% subsidy on expensive chains indefinitely** - Too costly
2. **Don't forget to update event times** - Broken promises damage trust
3. **Don't subsidize specific users unfairly** - Can cause community backlash
4. **Don't set confusing timezones** - Use UTC or clearly state timezone
5. **Don't leave NFTs "scheduled" forever** - Decide on launch or cancel

---

## 7. FAQ

**Q: What happens if I don't set an Event Start Time?**
A: NFT is immediately available. Status = "live". Users can mint right away.

**Q: Can I change the event start time after creation?**
A: Yes! Go to Giveaway Center, find the NFT, click "Manage", edit time.

**Q: How does fee subsidy get paid?**
A: When user mints, smart contract deducts subsidy from their fee. Admin covers the difference from treasury or gas reserve.

**Q: Can I have different subsidies for different wallet addresses?**
A: Yes! Each recipient wallet can have different subsidy percentage in recipient list.

**Q: What if network fee is $0.01 but admin subsidizes 100%?**
A: Admin pays $0.01 (or equivalent). Users pay $0. Transparent and fair.

**Q: Can I subsidize 150%?**
A: No. Maximum is 100% (system enforces 0-100 range).

**Q: What if user's wallet isn't on subsidy list?**
A: User pays 100% of network fee. Subsidy doesn't apply to them.

**Q: How do I track subsidy spending?**
A: Use Fee Subsidy Dashboard → View claimed amounts and dates.

---

## 8. Summary

| Feature | Purpose | Admin Controls |
|---------|---------|-----------------|
| Event Start Time | Control when NFT becomes available | Set date/time |
| Event Status | Track if NFT is pre-launch or live | Auto-calculated |
| Fee Subsidy % | How much admin pays of network fee | 0-100 scale |
| Subsidy Recipients | Which wallets get the discount | Add/remove list |
| Subsidy Claims | Track when users claimed discount | View history |

**Result:** Complete control over NFT launches, pricing, and user incentives!
