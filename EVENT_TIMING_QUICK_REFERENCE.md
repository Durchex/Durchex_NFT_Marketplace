# 🎯 Event Start Time & Fee Subsidy System - Quick Reference

## What's New?

### 1️⃣ Event Start Time (Launch Scheduling)
Admin can set when users can start minting NFTs

```
Admin creates NFT today
     ↓
Sets "Event Start Time": Dec 25 @ 10 AM
     ↓
NFT status = "scheduled" (unavailable)
     ↓
Dec 25 @ 10 AM arrives
     ↓
NFT status = "live" (available to mint)
     ↓
Users can now purchase and mint!
```

**Why it matters:**
- Control launch timing precisely
- Build hype with countdowns
- Stagger releases over time
- Prevent too many simultaneous purchases

---

### 2️⃣ Fee Subsidy (Network Fee Discounts)
Admin pays percentage of blockchain fees for users

```
User mints NFT on Ethereum
Network Fee: $50
Admin Subsidy: 100%
     ↓
User Pays: $0 ← No fee!
Admin Pays: $50 ← Full coverage!
```

**Why it matters:**
- Make minting affordable for users
- Encourage adoption
- Reward loyal community members
- Control marketing costs

---

## Admin Dashboard Layout

```
┌─ Admin Portal ─────────────────────────────┐
│                                             │
│  Dashboard    Users    NFTs    ...         │
│                                             │
│  ├─ Unminted NFTs      (FiPlus)    [New]   │  ← Create/manage unminted NFTs
│  ├─ Giveaways         (FiGift)    [New]   │  ← Track giveaway campaigns
│  ├─ Fee Subsidies     (FiPercent) [New]   │  ← Configure fee discounts
│  │                                         │
│  └─ More options...                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Creating an NFT with Event Time (5 Steps)

### Step 1: Go to Unminted NFTs
```
Admin Portal → Unminted NFTs → Create Unminted NFT
```

### Step 2: Fill Basic Info
```
Name: "Summer Collection #1"
Description: "Limited edition summer NFT"
Image: https://...
Collection: "Summer 2025"
Network: Polygon
Price: 10 MATIC
```

### Step 3: Set Event Start Time ⭐ NEW
```
Event Start Time: Dec 25, 2025 @ 10:00 AM
(Users can't mint before this time)
```

### Step 4: Optional - Set Fee Subsidy
```
Fee Subsidy: 50%
(You pay 50% of each user's network fee)
Recipient Wallets: [add specific addresses]
```

### Step 5: Create!
```
Click "Create" → NFT created with status "scheduled"
```

---

## Real-World Examples

### Example 1: Holiday Launch
```
Timeline: Christmas Day Launch
─────────────────────────────

Dec 1:  Create 100 NFTs, Event Time = Dec 25 @ 10 AM
        Status: "scheduled"
        
Dec 2-24: Marketing campaign "Coming Dec 25!"

Dec 25 @ 10 AM: Event goes live!
                Status: "live"
                Users can now mint
                High engagement expected!
```

### Example 2: VIP Program
```
Create NFT → Mark as Giveaway
Offer to specific wallet address
Fee Subsidy: 100% (free for them!)
Event Time: Dec 20 @ 5 PM

Dec 20 @ 5 PM: VIP can mint for FREE
               Network fee paid by you
               They feel special & loved!
```

### Example 3: Smart Network Strategy
```
Ethereum NFTs:
  - High fees (~$50)
  - Set 100% subsidy
  - Help users afford it
  
Polygon NFTs:
  - Low fees (~$0.25)
  - Set 0% subsidy
  - Users pay minimal anyway

Result: Consistent user experience across chains!
```

---

## Key Features at a Glance

| Feature | What It Does | Admin Controls |
|---------|-------------|-----------------|
| **Event Start Time** | Controls when minting opens | Date + Time picker |
| **Event Status** | Tracks if NFT is scheduled/live/ended | Auto-calculated |
| **Fee Subsidy %** | What % of fee admin covers | 0-100 scale |
| **Recipient Wallets** | Who gets the discount | Add/remove list |
| **Giveaway Tracking** | Monitor offer lifecycle | Status updates |

---

## Event Status Explained

```
┌─────────────────────────────────┐
│ Event Lifecycle                 │
├─────────────────────────────────┤
│                                 │
│ Created: 2025-12-15             │
│ Event Start: 2025-12-25 @ 10 AM │
│                                 │
│ Dec 15-24:                      │
│   Status = "scheduled" ❌       │
│   Mint button = DISABLED        │
│   Users see: "Coming Dec 25!"   │
│                                 │
│ Dec 25 @ 10 AM:                 │
│   Status = "live" ✅            │
│   Mint button = ENABLED         │
│   Users can purchase!           │
│                                 │
└─────────────────────────────────┘
```

---

## Fee Subsidy Examples

### Scenario A: Full Subsidy (100%)
```
Network Fee: $50 USD
Admin Subsidy: 100%

User pays: $0 ← FREE!
Admin pays: $50
```
**Use case:** Launch day, VIP rewards, high-value NFTs

### Scenario B: Partial Subsidy (50%)
```
Network Fee: $50 USD
Admin Subsidy: 50%

User pays: $25
Admin pays: $25
```
**Use case:** Share cost with community, budget control

### Scenario C: No Subsidy (0%)
```
Network Fee: $50 USD
Admin Subsidy: 0%

User pays: $50 ← Full cost
Admin pays: $0
```
**Use case:** Regular listings, user-pays model

### Scenario D: Cheap Network (0% needed)
```
Network Fee: $0.25 MATIC
Admin Subsidy: 0%

User pays: $0.25 ← Minimal!
Admin pays: $0
```
**Use case:** Polygon network, already affordable

---

## Quick API Reference

### Create Unminted NFT with Event Time
```bash
curl -X POST "https://durchex.com/api/v1/admin/nfts/unminted/create" \
  -H "Content-Type: application/json" \
  -H "x-admin-id: YOUR_ADMIN_ID" \
  -d '{
    "name": "Summer NFT",
    "collection": "Summer 2025",
    "eventStartTime": "2025-12-25T10:00:00Z",
    "feeSubsidyPercentage": 50
  }'
```

### Set Fee Subsidy for NFT
```bash
curl -X POST "https://durchex.com/api/v1/admin/nfts/subsidy/set" \
  -H "Content-Type: application/json" \
  -H "x-admin-id: YOUR_ADMIN_ID" \
  -d '{
    "itemId": "Summer-2025-12345",
    "feeSubsidyPercentage": 75,
    "recipientWallets": ["0x742d35...", "0x1234..."]
  }'
```

### List Unminted NFTs with Status
```bash
curl -X GET "https://durchex.com/api/v1/admin/nfts/unminted/list" \
  -H "x-admin-id: YOUR_ADMIN_ID"

# Response includes:
# - eventStartTime
# - eventStatus ("scheduled", "live", "ended")
# - feeSubsidyPercentage
```

---

## Dashboard Views

### Unminted NFTs Tab
Shows all unminted NFTs with:
- Name & collection
- Event status badge (Scheduled/Live/Ended)
- Fee subsidy percentage
- Action buttons (Manage, Offer, Delete)

### Giveaways Tab
Shows giveaway campaign progress:
- Count by status (pending/offered/claimed/minted)
- Timeline tracking
- Recipient wallet addresses
- Subsidy claim history

### Fee Subsidies Tab
Shows subsidy program overview:
- Total subsidized NFTs
- Average subsidy percentage
- Recipient wallets list
- Claimed amounts & dates
- Edit subsidy details

---

## Testing in Production

### Test 1: Create NFT with Future Event
```
Go to: https://durchex.com/admin
Click: Unminted NFTs → Create
Fill form with:
  - Event Start Time: Tomorrow @ 10 AM
  - Fee Subsidy: 50%
Click: Create
Verify: Status shows "scheduled"
```

### Test 2: Check API Response
```
curl -X GET "https://durchex.com/api/v1/admin/nfts/unminted/list" \
  -H "x-admin-id: YOUR_ADMIN_ID"

Verify response includes:
  - "eventStartTime": "2025-12-26T10:00:00Z"
  - "eventStatus": "scheduled"
  - "feeSubsidyPercentage": 50
```

### Test 3: Browser Display
```
Go to: https://durchex.com/admin
Sidebar shows three new items with [New] badges:
  - ✓ Unminted NFTs
  - ✓ Giveaways
  - ✓ Fee Subsidies
Click each to verify they load without errors
```

---

## Best Practices

### ✅ DO:
1. Set clear event times (not confusing timezones)
2. Use subsidies strategically (launches, VIP rewards)
3. Test on cheap networks first (Polygon)
4. Document admin notes (why this subsidy?)
5. Monitor adoption rates (adjust strategy)

### ❌ DON'T:
1. Leave NFTs "scheduled" forever (decide or cancel)
2. Set 100% subsidy on expensive chains indefinitely (too costly)
3. Forget to update event times (breaks user trust)
4. Subsidize specific users secretly (unfair, causes backlash)
5. Set confusing timezone info (use UTC or be explicit)

---

## Troubleshooting

**Q: Event time has passed but status still "scheduled"?**
A: Refresh page or restart backend. Status recalculates every request.

**Q: Fee subsidy field not showing in form?**
A: Clear browser cache (Ctrl+Shift+Del), hard refresh (Ctrl+Shift+R).

**Q: NFT won't appear with event time in list?**
A: Check network filter, verify NFT was created successfully, reload page.

**Q: API returns null for eventStartTime?**
A: Restart backend: `sudo systemctl restart durchex-backend`

---

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| **FEE_SUBSIDY_AND_EVENT_TIMING_GUIDE.md** | Comprehensive guide | 521 lines |
| **EVENT_TIMING_IMPLEMENTATION_COMPLETE.md** | Implementation details | 601 lines |
| **UnmintedNFTManager.jsx** | Frontend form component | 583 lines |
| **GiveawayCenter.jsx** | Giveaway tracking | 280+ lines |
| **FeeSubsidyDashboard.jsx** | Subsidy management | 300+ lines |

---

## Summary

**What You Can Do Now:**

✅ Schedule NFT launches with precise dates
✅ Show countdown timers to users
✅ Subsidy network fees (0-100%)
✅ Control adoption costs
✅ Create VIP programs
✅ Track campaign metrics
✅ Manage multiple collections
✅ Stagger releases over time

**Result:** Professional NFT marketplace with advanced marketing & economic tools!

---

**Need More Info?**
See: `FEE_SUBSIDY_AND_EVENT_TIMING_GUIDE.md` (521 lines of detailed explanations)

**Want Implementation Details?**
See: `EVENT_TIMING_IMPLEMENTATION_COMPLETE.md` (601 lines with examples)

**Ready to Use?**
Go to: `https://durchex.com/admin` → Click "Unminted NFTs" → Create!

🚀 **Happy Launching!**
