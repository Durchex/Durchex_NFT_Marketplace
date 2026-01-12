# Remaining Frontend Integration Tasks

**Status**: High-level feature scaffolding needed  
**Priority**: Medium to High  
**Est. Time**: 2-4 hours for full implementation  

---

## Task 1: NFT Listing Request UI (Creator-Only Feature)

**Requirement**: Allow creators to submit NFT listing requests via the UI

**Location**: CreatorProfile.jsx - Add new section/tab

**Components Needed**:
```jsx
// New modal component
<NFTListingRequestModal>
  - List of creator's minted NFTs with checkboxes
  - Request type dropdown (Single/Batch)
  - Pricing input field
  - Terms/Conditions checkbox
  - Submit button
  - Cancel button
```

**API Integration**:
```javascript
listingRequestAPI.createRequest({
  nftIds: [selectedNFTIds],
  requestType: 'single' | 'batch',
  proposedPrice: number,
  currency: 'ETH',
  creatorAddress: address,
  status: 'pending'
})

// Show pending requests list
listingRequestAPI.getCreatorRequests(creatorAddress)
```

**UI Flow**:
1. Creator clicks "Request Listing" button
2. Modal opens showing their minted NFTs
3. Creator selects NFTs and enters details
4. Request submitted to backend (6-7 day TTL)
5. Pending requests shown in list with status badges
6. Admin approves/rejects in admin dashboard

**Estimated Effort**: 1-2 hours

---

## Task 2: Cover Photo Upload UI

**Requirement**: Allow users to upload cover photos for profiles and collections

**Location**: 
- CreatorProfile.jsx - Add "Edit Cover Photo" section
- Profile.jsx - Add "Edit Cover Photo" section
- CollectionDetails.jsx - Add "Edit Collection Cover" section

**Components Needed**:
```jsx
// Modal
<CoverPhotoUploadModal>
  - File input (accept: image/*)
  - Image preview (max 1MB)
  - Cropping tool (optional)
  - Upload button
  - Remove button
  - Cancel button
```

**API Integration**:
```javascript
// For user profile
coverPhotoAPI.updateUserCoverPhoto(file, userAddress)
coverPhotoAPI.removeUserCoverPhoto(userAddress)
coverPhotoAPI.getUserProfile(userAddress)

// For collections
coverPhotoAPI.updateCollectionCoverPhoto(collectionId, file)
coverPhotoAPI.removeCollectionCoverPhoto(collectionId)
coverPhotoAPI.getCollection(collectionId)
```

**UI Flow**:
1. User clicks "Edit Cover Photo" or pencil icon
2. Modal opens with file picker
3. User selects image, preview shown
4. Click Upload button
5. File sent to backend (stored in DB)
6. Cover photo displayed at top of page/collection

**Backend Features**:
- File validation (size, format)
- Image optimization/resizing
- TTL-based cleanup (optional)
- Replace existing photo on re-upload

**Estimated Effort**: 1-2 hours

---

## Task 3: Order/Offer System UI

**Requirement**: Allow users to buy NFTs and make offers

**Location**: NFTDetails.jsx or new BuyModal component

**Components Needed**:
```jsx
// Buy Now Modal
<BuyNFTModal nftId={nftId}>
  - Display NFT image
  - Show current price
  - Seller info
  - Payment method selection (wallet)
  - Confirm purchase button
  - Payment confirmation
</BuyNFTModal>

// Make Offer Modal
<MakeOfferModal nftId={nftId}>
  - NFT preview
  - Offer price input
  - Offer duration (3, 7, 14, 30 days)
  - Submit offer button
  - Clear button
</MakeOfferModal>

// User's Offers List
<MyOffersTab>
  - List of pending offers
  - Status: pending, accepted, rejected
  - Action: Cancel, Renegotiate
</MyOffersTab>
```

**API Integration**:
```javascript
// Orders (24-hour TTL)
orderAPI.createOrder({
  nftId, buyerAddress, sellerAddress, price, paymentMethod
})
orderAPI.confirmPayment(orderId)
orderAPI.cancelOrder(orderId)
orderAPI.getMyOrders(userAddress)

// Offers (7-day TTL)
offerAPI.createOffer({
  nftId, offerPrice, duration, offererAddress
})
offerAPI.acceptOffer(offerId)
offerAPI.rejectOffer(offerId)
offerAPI.cancelOffer(offerId)
offerAPI.getMyOffers(userAddress)
offerAPI.getOffersOnNFT(nftId)
```

**UI Flow**:
1. User clicks "Buy Now" on NFT detail page
2. BuyNFTModal opens
3. User confirms purchase
4. Transaction sent to blockchain
5. Order recorded in backend
6. NFT transferred to buyer

**Alternative Flow** (Make Offer):
1. User clicks "Make Offer"
2. MakeOfferModal opens
3. User enters offer price and duration
4. Seller notified of offer
5. Seller can accept/reject

**Estimated Effort**: 2-3 hours

---

## Task 4: Admin Delisting Management Panel

**Requirement**: Admin dashboard to view and manage delistings

**Location**: Admin.jsx or new AdminDelisting.jsx component

**Components Needed**:
```jsx
// Admin Delisting Panel
<AdminDelistingPanel>
  - Table of deisted NFTs
  - Columns: NFT Name, Creator, Reason, Date, Actions
  - Filter by status (active, expired)
  - Sort by date
  
  <DelistingActions>
    - View NFT details
    - Edit delist reason
    - Extend delist period
    - Re-list NFT (remove delist)
    - Delete delist record
</AdminDelistingPanel>
```

**API Integration**:
```javascript
adminAPI.getDelistedNFTs() // Already in backend
adminAPI.updateDelistReason(nftId, newReason)
adminAPI.extendDelistPeriod(nftId, days)
adminAPI.relistNFT(nftId) // Remove from delisted
adminAPI.deleteDelistRecord(nftId)
```

**Backend Features Already Implemented**:
- `NFT.adminStatus` field (delisted, active)
- `adminDelistReason` tracking
- Explore.jsx filters out delisted NFTs
- TTL on delist entries (optional)

**UI Flow**:
1. Admin navigates to Admin > Delisting
2. Sees all deisted NFTs in table
3. Can click to view full details
4. Can edit reason or extend period
5. Can re-list (remove delist)

**Estimated Effort**: 1 hour

---

## Task 5: Engagement Stats Display

**Requirement**: Show engagement counts (likes, views, followers) across pages

**Location**: 
- NFT cards (show like count)
- Creator profiles (show follower count) ✅ DONE
- Collection pages (show collection likes)
- NFT detail page (show full stats)

**Components Needed**:
```jsx
// Engagement Stats Badge
<EngagementBadge nftId={nftId}>
  - ❤️ 234 likes
  - 👁️ 1,234 views
  - 📤 45 shares
</EngagementBadge>

// Creator Stats
<CreatorStatsWidget creatorAddress={address}>
  - 👥 12.3K followers
  - ❤️ 45.6K total likes
  - 🔗 234 NFTs created
</CreatorStatsWidget>

// Collection Stats
<CollectionStatsWidget collectionId={id}>
  - 👥 234 followers
  - ❤️ 2.3K total likes
  - 📊 1,234 floor price
</CollectionStatsWidget>
```

**API Integration**:
```javascript
// Already in backend
engagementAPI.getNFTStats(nftId)
engagementAPI.getCreatorStats(creatorAddress)
engagementAPI.getCollectionStats(collectionId)
engagementAPI.getEngagementStats(nftId | creatorAddress | collectionId)
```

**UI Placement**:
- NFT cards: Bottom-right corner
- Creator header: Next to follower count
- Collection header: In stats section
- NFT detail: Full engagement panel

**Estimated Effort**: 1-2 hours

---

## Task 6: Collection Follow Feature

**Requirement**: Allow users to follow collections (like they follow creators)

**Location**: CollectionDetails.jsx header

**Components Needed**:
```jsx
// Follow Collection Button
<FollowCollectionButton collectionId={collectionId}>
  - Button state: "Follow" or "Following"
  - Show follower count
  - Similar to CreatorProfile follow button
</FollowCollectionButton>
```

**API Integration**:
```javascript
// Need to add to engagementAPI
engagementAPI.likeCollection(collectionId, userAddress)
engagementAPI.unlikeCollection(collectionId, userAddress)
engagementAPI.isLikingCollection(collectionId, userAddress)
engagementAPI.getCollectionFollowers(collectionId)
```

**Backend Implementation**: Collection like schema already exists in `engagementModel.js`

**UI Flow**:
1. User navigates to collection detail page
2. Follows/unfollows collection via button
3. Follower count updates
4. User sees collection in their followed collections list

**Note**: This is different from NFT likes - collections can be "followed" by multiple users

**Estimated Effort**: 30 minutes - 1 hour

---

## Implementation Priority

### High Priority (User-Facing, Revenue-Related)
1. **Task 3: Order/Offer System** - Buying/selling NFTs (revenue)
2. **Task 2: Cover Photos** - Profile customization (engagement)

### Medium Priority (Creator Features)
1. **Task 1: NFT Listing Requests** - Creator workflow
2. **Task 5: Engagement Stats** - User motivation

### Low Priority (Admin/Polish)
1. **Task 4: Admin Delisting Panel** - Admin workflow
2. **Task 6: Collection Follow** - Nice-to-have

---

## Suggested Implementation Order

**Day 1**:
- Task 2: Cover photo upload (foundational, not blocking)
- Task 1: NFT listing request UI (creator feature)

**Day 2**:
- Task 3: Order/Offer system (core marketplace feature)
- Task 5: Engagement stats display (polish)

**Day 3**:
- Task 4: Admin delisting panel (operational)
- Task 6: Collection follow (enhancement)

---

## Code Template: Modal Pattern

All these tasks follow the same modal pattern:

```jsx
import { useState } from 'react';
import { X } from 'lucide-react';

function FeatureModal({ isOpen, onClose, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success('Success!');
      onClose();
    } catch (error) {
      toast.error('Failed to complete action');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Modal Title</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form content here */}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureModal;
```

---

## Testing Checklist

For each feature, verify:
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] API calls made with correct parameters
- [ ] Success toast notification shown
- [ ] Error handling works (try invalid input)
- [ ] Data persists across page reload
- [ ] Works on mobile (responsive)
- [ ] Keyboard navigation works (Tab, Enter, Esc)

---

## Notes

- All backend APIs are already implemented and tested
- Frontend components just need to be created and integrated
- Reuse existing Toast, Modal patterns from codebase
- Follow existing styling (gray-900, purple-600 colors)
- All engagement tracking uses TTL indexes (auto-cleanup)

**Good luck!** 🚀
