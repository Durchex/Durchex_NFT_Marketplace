# 🚀 Quick Implementation Guide - All 8 Issues

**Status:** Issue #1 ✅ FIXED | Issues #2-8 Ready for Implementation  
**Last Updated:** December 18, 2025

---

## 📋 Issues Overview & Quick Links

### ✅ Issue #1: Navigation Lock - COMPLETE
- **Status:** ✅ FIXED
- **Files Modified:** 2
- **Documentation:** `FIX_ISSUE_1_NAVIGATION_LOCK.md`
- **Result:** Users no longer locked on profile page after wallet connection

---

## 🔄 Issue #2: Profile Save - READY TO START

### Quick Summary
Profile edits not saving to database. Users edit but changes are lost on refresh.

### Files to Modify
1. **frontend/src/components/MyProfile.jsx**
   - Find: `handleEditProfile` function
   - Add: API call to save profile
   - Result: Profile data persists

2. **frontend/src/services/api.js**
   - Verify: `createOrUpdateUser()` method exists
   - If missing: Create endpoint

### Code Snippet
```jsx
// In MyProfile.jsx - Replace handleEditProfile
const handleEditProfile = async () => {
  if (isEditing) {
    setIsLoading(true);
    try {
      await userAPI.createOrUpdateUser({
        walletAddress: address,
        username: profileData.username,
        email: profileData.email,
        bio: profileData.bio,
        image: profileData.image,
        socialLinks: profileData.socialLinks.filter(s => s.trim()),
      });
      SuccessToast("Profile saved!");
      setIsEditing(false);
    } catch (error) {
      ErrorToast("Save failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  } else {
    setIsEditing(true);
  }
};
```

### Time Estimate: 30 minutes

---

## 🎯 Issue #3: Number of Pieces Field - READY TO START

### Quick Summary
NFT creation form needs quantity/number of pieces field (min 1, max 50).

### Files to Modify
1. **frontend/src/pages/Create.jsx**
   - Add: `numberOfPieces: 1` to formNftData state
   - Add: Input field in form with min/max validation
   - Add: Pass to mint function

### Code Snippet
```jsx
// Add to formNftData state
const [formNftData, setFormNftData] = useState({
  // ... existing fields
  numberOfPieces: 1,  // ✅ ADD THIS
});

// Add input field in JSX
<input
  type="number"
  min="1"
  max="50"
  value={formNftData.numberOfPieces}
  onChange={(e) => {
    const val = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
    setFormNftData({...formNftData, numberOfPieces: val});
  }}
  placeholder="1-50 pieces"
/>

// Pass when minting
await publicMint(contract, {
  ...formNftData,
  numberOfPieces: formNftData.numberOfPieces,  // ✅ ADD THIS
});
```

### Time Estimate: 20 minutes

---

## 📊 Issue #4: Minted NFT Visibility - READY TO START

### Quick Summary
After minting, NFTs don't appear on profile "Owned" tab or explore page.

### Files to Modify
1. **frontend/src/pages/Create.jsx**
   - After mint success: Save NFT to backend
   - Refresh user's NFT list

2. **frontend/src/pages/Profile.jsx**
   - Add: `fetchUserOwnedNFTs()` function
   - Load and display real owned NFTs, not mock data

### Code Snippet
```jsx
// In Create.jsx after successful mint
const handleMintSuccess = async (txHash) => {
  try {
    // Save NFT metadata to backend
    await fetch(`${API_URL}/api/v1/admin/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-wallet': address,
      },
      body: JSON.stringify({
        name: formNftData.name,
        description: formNftData.description,
        image: formNftData.image,
        price: formNftData.price,
        numberOfPieces: formNftData.numberOfPieces,
        collection: formNftData.collection,
        creator: address,
        transactionHash: txHash,
        isMinted: true,
      }),
    });
    
    // Refresh user's NFTs
    if (getUserNFTs) await getUserNFTs(address);
    SuccessToast("NFT minted successfully!");
  } catch (error) {
    ErrorToast("Failed to save NFT: " + error.message);
  }
};

// In Profile.jsx - Add to Owned tab
useEffect(() => {
  if (activeTab === "Owned") {
    fetchOwnedNFTs();
  }
}, [activeTab, address]);

const fetchOwnedNFTs = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/user/nfts/owned/${address}`
    );
    const data = await response.json();
    setNFTItems(data.nfts || []);
  } catch (error) {
    console.error("Error fetching NFTs:", error);
  }
};
```

### Time Estimate: 45 minutes

---

## 🔢 Issue #5: 50 NFT Bulk Minting Limit - READY TO START

### Quick Summary
Validate that users can't mint more than 50 NFTs in one transaction.

### Files to Modify
1. **frontend/src/pages/Create.jsx**
   - Add: Validation before minting
   - Add: UI warning when approaching limit

2. **backend/routes/nft.routes.js**
   - Add: Server-side validation

### Code Snippet
```jsx
// Frontend validation
const validateMintingLimit = (quantity) => {
  if (quantity < 1) {
    ErrorToast("Minimum 1 NFT required");
    return false;
  }
  if (quantity > 50) {
    ErrorToast("Bulk minting limit is 50 NFTs");
    return false;
  }
  return true;
};

// Before calling mint
if (!validateMintingLimit(formNftData.numberOfPieces)) return;

// UI Warning
{formNftData.numberOfPieces >= 50 && (
  <div className="text-yellow-400">⚠️ Maximum limit reached</div>
)}

// Backend validation
app.post('/api/v1/nft/mint', (req, res) => {
  if (req.body.quantity > 50) {
    return res.status(400).json({
      error: 'Maximum 50 NFTs per bulk mint',
      max: 50,
    });
  }
  // Continue with minting
});
```

### Time Estimate: 15 minutes

---

## 💰 Issue #6: Sales Fees (2.5% Creator, 1.5% Buyer) - READY TO START

### Quick Summary
Implement correct fee calculation: 2.5% for seller, 1.5% for buyer.

### Files to Modify
1. **backend/services/feeService.js** (create if missing)
   - Define fee constants
   - Create calculation functions

2. **backend/routes/checkout.routes.js** or purchase route
   - Use fee service for calculations

3. **frontend/src/pages/BuyNft.jsx**
   - Display fee breakdown to user

### Code Snippet
```javascript
// backend/services/feeService.js
export const FEE_STRUCTURE = {
  creatorFee: 0.025,  // 2.5%
  buyerFee: 0.015,    // 1.5%
};

export function calculateFees(price, isBuyer = false) {
  const feePercent = isBuyer ? FEE_STRUCTURE.buyerFee : FEE_STRUCTURE.creatorFee;
  const fee = price * feePercent;
  const total = price + fee;
  return {
    basePrice: price,
    fee: fee.toFixed(4),
    total: total.toFixed(4),
    feePercent: (feePercent * 100).toFixed(1),
  };
}

// In checkout route
const { basePrice, fee, total } = calculateFees(nftPrice, true); // buyer
res.json({ price: basePrice, fee, total });

// frontend/src/pages/BuyNft.jsx
{feeInfo && (
  <div>
    <p>NFT Price: ${feeInfo.basePrice}</p>
    <p>Buyer Fee (1.5%): ${feeInfo.fee}</p>
    <p className="font-bold">Total: ${feeInfo.total}</p>
  </div>
)}
```

### Time Estimate: 40 minutes

---

## 🛒 Issue #7: NFT Buying - READY TO START

### Quick Summary
Purchase flow broken. Users can't buy NFTs from marketplace.

### Files to Modify
1. **backend/controllers/purchaseController.js** (create)
   - Implement purchase logic
   - Update NFT ownership

2. **backend/routes/purchase.routes.js** (create)
   - POST /purchase - initiate purchase
   - POST /purchase/:id/confirm - confirm after blockchain

3. **frontend/src/pages/BuyNft.jsx**
   - Connect to purchase endpoint
   - Handle wallet transaction

### Code Snippet
```javascript
// backend/controllers/purchaseController.js
export async function purchaseNFT(req, res) {
  const { nftId, quantity = 1 } = req.body;
  const buyerWallet = req.headers['x-user-wallet'];

  // Get NFT
  const nft = await NFT.findById(nftId);
  if (!nft || !nft.isListed) {
    return res.status(404).json({ error: 'NFT not available' });
  }

  // Calculate fees (use FEE_STRUCTURE)
  const totalPrice = nft.price * quantity;
  const fees = calculateFees(totalPrice, true); // buyer

  // Create transaction
  const transaction = new Transaction({
    nftId,
    buyerWallet,
    quantity,
    totalAmount: fees.total,
    status: 'pending',
  });
  await transaction.save();

  res.json({
    transactionId: transaction._id,
    amount: fees.total,
    fees: fees.fee,
  });
}

// frontend/src/pages/BuyNft.jsx
const handleBuyClick = async () => {
  // Initiate purchase
  const response = await fetch(`${API_URL}/api/v1/purchase`, {
    method: 'POST',
    body: JSON.stringify({ nftId, quantity: 1 }),
  });
  const { transactionId, amount } = await response.json();

  // Blockchain transaction
  const tx = await contract.purchase({ value: amount });
  
  // Confirm on backend
  await fetch(`${API_URL}/api/v1/purchase/${transactionId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ txHash: tx.hash }),
  });
};
```

### Time Estimate: 60 minutes

---

## 🔗 Issue #8: WalletConnect API Fix - READY TO START

### Quick Summary
WalletConnect integration broken or misconfigured. Users can't connect wallet.

### Files to Modify
1. **.env** or **.env.local**
   - Add: `REACT_APP_WALLETCONNECT_PROJECT_ID`

2. **frontend/src/Context/AppKitProvider.jsx**
   - Verify configuration
   - Fix any missing imports

3. **frontend/src/Context/index.jsx**
   - Ensure wallet connection handler doesn't force profile redirect

### Code Snippet
```env
# .env
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id_here
REACT_APP_SITE_URL=https://durchex.com
```

```jsx
// frontend/src/Context/AppKitProvider.jsx
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.error('Missing REACT_APP_WALLETCONNECT_PROJECT_ID in .env');
}

const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, polygon, bsc],
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, polygon, bsc],
  metadata: {
    name: 'Durchex',
    description: 'NFT Marketplace',
    url: 'https://durchex.com',
    icons: ['https://durchex.com/logo.png'],
  },
});
```

### Time Estimate: 30 minutes

---

## 📅 Recommended Implementation Order

### Day 1
1. ✅ Issue #1: Navigation Lock (20 min) - COMPLETE
2. 🔄 Issue #2: Profile Save (30 min) - START NOW
3. ⏳ Issue #8: WalletConnect (30 min) - AFTER #2

### Day 2
4. ⏳ Issue #3: Number of Pieces (20 min)
5. ⏳ Issue #5: 50 NFT Limit (15 min)
6. ⏳ Issue #4: NFT Visibility (45 min)

### Day 3
7. ⏳ Issue #6: Fee Structure (40 min)
8. ⏳ Issue #7: NFT Buying (60 min)

**Total Time:** ~4.5 hours

---

## 🧪 Testing Commands

### Test Navigation (Issue #1)
```bash
# Should redirect to onboarding if not completed
curl http://localhost:3000/explore

# Should NOT redirect (no onboarding check)
curl http://localhost:3000/create
```

### Test Profile Save (Issue #2)
```javascript
// In browser console after editing profile
await userAPI.createOrUpdateUser({
  walletAddress: '0x...',
  username: 'TestUser',
  email: 'test@example.com',
});
```

### Test NFT Minting (Issues #3, #4)
```javascript
// Should accept numberOfPieces parameter
await publicMint(contractAddress, {
  name: 'Test NFT',
  numberOfPieces: 5,
});
```

### Test Bulk Limit (Issue #5)
```javascript
// Should fail with error
await publicMint(contractAddress, {
  numberOfPieces: 51,  // Over limit
});
```

---

## ✅ Deployment Checklist

Before deploying each issue:

- [ ] Code compiles without errors
- [ ] No console warnings/errors
- [ ] Tested with sample data
- [ ] Tested with edge cases
- [ ] Performance acceptable
- [ ] Database changes migrated
- [ ] No breaking changes to existing features
- [ ] Documentation updated

---

## 📞 Support & Questions

### If tests fail:
1. Check console for errors
2. Review implementation guide
3. Check `CRITICAL_ISSUES_ACTION_PLAN.md` for details
4. Verify API endpoints exist

### For each issue:
- Detailed guide: `CRITICAL_ISSUES_ACTION_PLAN.md`
- Quick reference: This file
- Progress tracking: `IMPLEMENTATION_PROGRESS_REPORT.md`

---

**Document Status:** 📋 Ready for Implementation  
**Last Updated:** December 18, 2025  
**Next Update:** After each issue completion

