# Complete Giveaway NFT System & Countdown Timer Implementation

## Overview
This document outlines the complete implementation of giveaway NFT management features including user profile display, countdown timers, and NFT claiming functionality.

## Features Implemented

### 1. User Giveaway NFT Display (`MyGiveawayNFTs.jsx`)

**Location:** `frontend/src/pages/user/MyGiveawayNFTs.jsx`

**Purpose:** Displays NFTs that users have been offered through giveaways

**Key Features:**
- Fetches user's giveaway NFTs from backend API
- Shows NFT image, name, collection, and network
- Real-time countdown timer to event start
- Status indicators (Pending, Active, Claimed)
- Claim & Mint button when event is live
- Fee subsidy information display
- Integration with ICOContent context for wallet address

**State Management:**
```javascript
const [giveawayNFTs, setGiveawayNFTs] = useState([]);
const [loading, setLoading] = useState(false);
const [countdowns, setCountdowns] = useState({});
```

**API Endpoints Used:**
- `GET /admin/nfts/giveaways/my-nfts` - Fetch user's giveaway NFTs
- `POST /admin/nfts/giveaways/claim` - Claim an NFT

**User Flow:**
1. User navigates to Profile → "Giveaway NFTs" tab
2. Component fetches all NFTs offered to their wallet address
3. Displays countdown timer for events not yet started
4. When event goes live, shows "Claim & Mint Now" button
5. User clicks button to claim NFT
6. Status updates to "Claimed"

### 2. Countdown Timer Component (`CountdownTimer.jsx`)

**Location:** `frontend/src/components/CountdownTimer.jsx`

**Purpose:** Reusable countdown timer component for marketplace

**Key Features:**
- Real-time countdown display (Days:Hours:Minutes:Seconds)
- Automatically detects when event is live
- Optional callback when timer completes
- Responsive design with color-coded status
- Monospace font for consistency

**Display States:**
1. **Before Start:** Shows countdown grid with Days, Hours, Minutes, Seconds
2. **Live:** Shows "Live Now!" badge with green gradient
3. **No Event:** Returns null if no eventStartTime provided

**Usage Example:**
```jsx
<CountdownTimer 
  eventStartTime={nft.eventStartTime}
  onTimerComplete={() => handleTimerComplete()}
/>
```

**Component Props:**
- `eventStartTime` (String): ISO date string of event start time
- `onTimerComplete` (Function): Optional callback when timer reaches zero

### 3. Backend API Endpoints

#### New Endpoints Added to `adminController.js`:

**1. getUserGiveawayNFTs()**
```
GET /admin/nfts/giveaways/my-nfts
Headers: x-user-wallet: <wallet_address>

Response:
{
  success: true,
  count: number,
  nfts: [
    {
      _id, name, image, collection, network, price,
      eventStartTime, eventStatus, 
      giveawayStatus, feeSubsidyPercentage, ...
    }
  ]
}
```

**Features:**
- Filters NFTs where `isGiveaway: true`
- Filters by `offeredTo` matching wallet address
- Only shows NFTs with status: offered, claimed, or minted
- Sorts by event start time (earliest first)

**2. claimGiveawayNFT()**
```
POST /admin/nfts/giveaways/claim
Headers: x-user-wallet: <wallet_address>
Body: { nftId: string }

Response:
{
  success: true,
  message: "NFT claimed successfully!",
  nft: { ... }
}

Errors:
- 404: NFT not found
- 403: NFT not offered to this user
- 400: Event not started yet (returns eventStartsAt)
```

**Features:**
- Verifies NFT exists
- Verifies caller is the offered recipient
- Checks if event has started
- Updates NFT status to 'claimed'
- Records claim timestamp

### 4. Frontend Profile Integration

**Location:** `frontend/src/pages/Profile.jsx`

**Changes Made:**
1. Added import for `MyGiveawayNFTs` component
2. Added "Giveaway NFTs" tab to tabs array
3. Added conditional render in main content area

**Tab Structure:**
```javascript
const tabs = [
  "MyProfile",
  "Owned",
  "Giveaway NFTs",  // NEW
  "My Points",
  "My Collections",
  "List NFT",
  "Verification",
];
```

**Rendering:**
```jsx
{activeTab === "Giveaway NFTs" && <MyGiveawayNFTs />}
```

### 5. Routes Updated

**File:** `backend_temp/routes/adminRouter.js`

**New Routes:**
```javascript
// Get user's giveaway NFTs
router.get('/nfts/giveaways/my-nfts', getUserGiveawayNFTs);

// Claim giveaway NFT
router.post('/nfts/giveaways/claim', claimGiveawayNFT);
```

**Updated Imports:**
- Added `getUserGiveawayNFTs`
- Added `claimGiveawayNFT`

## Database Fields Referenced

**NFT Model Fields Used:**
```javascript
{
  _id: ObjectId,                    // NFT ID for claiming
  name: String,                     // NFT name
  image: String,                    // Base64 or URL image
  collection: String,               // Collection name
  network: String,                  // Blockchain network
  price: String,                    // NFT price
  isGiveaway: Boolean,              // Marks as giveaway
  giveawayStatus: String,           // pending, offered, claimed, minted
  offeredTo: String,                // Wallet address NFT is offered to
  eventStartTime: Date,             // When minting opens
  eventStatus: String,              // pending, live
  feeSubsidyEnabled: Boolean,       // If fee is subsidized
  feeSubsidyPercentage: Number,    // % of fee covered
  claimedAt: Date                   // When user claimed (NEW FIELD)
}
```

## UI/UX Features

### Giveaway NFT Card Display
- **Image Section:** Displays NFT image with status badge
- **Status Badge:** Shows "Claimed", "Active", or "Coming"
- **Content Section:**
  - NFT name and collection
  - Network and price information
- **Countdown:** Displays time until event starts
- **Claim Button:**
  - Enabled when event is live
  - Disabled when locked (before start time)
  - Shows "Claimed" status after claiming
- **Fee Subsidy Info:** Green badge showing subsidy percentage

### Color Scheme
- **Background:** Dark slate (slate-800/900)
- **Borders:** Purple accent on hover
- **Status Green:** For claimed/success states
- **Status Purple:** For pending/coming states
- **Fee Subsidy:** Green text on dark background

### Responsive Design
- **Grid Cols:** 1 column on mobile, 2 on tablet, 3 on desktop
- **Spacing:** Consistent padding and gaps
- **Typography:** Clear hierarchy with font sizes

## Integration Points

### 1. Profile Tab Integration
- MyGiveawayNFTs component displays in Profile.jsx
- Accessible through "Giveaway NFTs" tab
- Uses ICOContent context for wallet address

### 2. Countdown Timer Integration
- Can be used anywhere event start times need display
- Reusable component for marketplace, admin dashboard, etc.
- Automatic "Live Now!" detection

### 3. Backend Integration
- NFT Model must support all required fields
- Routes must validate x-user-wallet header
- Database queries filter by offeredTo wallet

## Testing Checklist

### Unit Tests
- [ ] Countdown timer updates every second
- [ ] Countdown displays correct format (DD:HH:MM:SS)
- [ ] "Live Now!" displays when event starts
- [ ] NFT cards render without image gracefully
- [ ] Status badges show correct state

### Integration Tests
- [ ] MyGiveawayNFTs fetches data correctly
- [ ] Claim button works and updates status
- [ ] Countdown timer completes successfully
- [ ] Profile tab switches correctly
- [ ] Fee subsidy badge displays when applicable

### End-to-End Tests
- [ ] User logs in and navigates to Giveaway NFTs tab
- [ ] User sees countdown to event start
- [ ] Countdown goes to "Live Now!" at correct time
- [ ] User can claim NFT when event is live
- [ ] Claimed NFTs show as completed
- [ ] Error handling works for edge cases

### Edge Cases
- [ ] User with no giveaway NFTs sees empty state
- [ ] User not connected to wallet sees warning
- [ ] Multiple NFTs with different event times display correctly
- [ ] Claiming NFT twice prevents double claim
- [ ] Event that has already passed shows "Live Now!"
- [ ] NFT without event time doesn't show countdown

## Performance Considerations

### Optimizations
1. **Countdown Interval:** Single interval updates all timers efficiently
2. **Rendering:** Only updates when state changes
3. **API Calls:** Fetched once on component mount, then on successful claim
4. **Memory:** Interval cleared on component unmount

### Potential Improvements
1. Add pagination for users with many giveaway NFTs
2. Add filtering by network or status
3. Add sorting options (by countdown, by price, etc.)
4. Implement caching for giveaway NFT list
5. Add bulk claiming functionality

## API Response Examples

### Success Response - Get User Giveaways
```json
{
  "success": true,
  "count": 3,
  "nfts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Golden Dragon NFT #001",
      "image": "data:image/png;base64,...",
      "collection": "Dragons",
      "network": "Ethereum",
      "price": "0.5",
      "isGiveaway": true,
      "giveawayStatus": "offered",
      "offeredTo": "0x742d35Cc6634C0532925a3b844Bc2e7B2f8e91Ab",
      "eventStartTime": "2026-03-15T10:00:00Z",
      "eventStatus": "pending",
      "feeSubsidyPercentage": 50
    }
  ]
}
```

### Success Response - Claim NFT
```json
{
  "success": true,
  "message": "NFT claimed successfully! You can now mint it.",
  "nft": {
    "_id": "507f1f77bcf86cd799439011",
    "giveawayStatus": "claimed",
    "claimedAt": "2026-03-15T10:00:15Z"
  }
}
```

### Error Response - Event Not Started
```json
{
  "error": "Minting has not started yet",
  "eventStartsAt": "2026-03-15T10:00:00Z"
}
```

## File Summary

| File | Type | Status | Purpose |
|------|------|--------|---------|
| `frontend/src/pages/user/MyGiveawayNFTs.jsx` | Component | NEW | Display user's giveaway NFTs |
| `frontend/src/components/CountdownTimer.jsx` | Component | NEW | Reusable countdown timer |
| `frontend/src/pages/Profile.jsx` | Component | UPDATED | Added Giveaway NFTs tab |
| `backend_temp/controllers/adminController.js` | Controller | UPDATED | Added getUserGiveawayNFTs, claimGiveawayNFT |
| `backend_temp/routes/adminRouter.js` | Routes | UPDATED | Added new endpoints |

## Next Steps

1. **Testing:** Run comprehensive tests for countdown accuracy
2. **Marketplace Integration:** Add countdown timer to marketplace NFT display
3. **Admin Dashboard:** Show claimed vs unclaimed giveaways
4. **Notifications:** Send email when giveaway goes live
5. **Analytics:** Track claim rates and user engagement
6. **Enhancement:** Add giveaway NFT filtering and sorting

## Deployment Notes

1. Ensure backend changes are deployed to production
2. Run `npm run build` for frontend
3. Deploy frontend build to server
4. Test full workflow with real user wallet
5. Monitor logs for any API errors
6. Verify countdown timers sync across multiple clients

---

**Last Updated:** 2026-03-14
**Version:** 1.0
**Status:** Complete - Ready for Testing
