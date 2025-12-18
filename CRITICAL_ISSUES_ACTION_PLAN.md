# 🚨 Critical Issues - Action Plan & Implementation Guide

**Date:** December 18, 2025  
**Priority:** 🔴 CRITICAL - Blocking User Experience  
**Status:** 📋 Planning & Implementation Phase

---

## 📋 Issues Checklist

- [ ] **ISSUE #1:** Locked to profile page - can't navigate after connecting
- [ ] **ISSUE #2:** Profile doesn't save
- [ ] **ISSUE #3:** NFT creation missing "number of pieces" field
- [ ] **ISSUE #4:** Minted NFTs not visible on profile or explore page
- [ ] **ISSUE #5:** Missing 50 NFT bulk minting limit
- [ ] **ISSUE #6:** Incorrect sales fees (should be 2.5% creator, 1.5% buyer)
- [ ] **ISSUE #7:** NFT buying functionality broken
- [ ] **ISSUE #8:** WalletConnect API integration broken

---

## 🎯 Issue #1: Locked to Profile Page

### Problem
After connecting wallet, users are locked on profile page and cannot navigate elsewhere.

### Root Causes
1. Navigation state not properly initialized after wallet connection
2. Possible `useNavigate()` dependency issue
3. Profile redirect logic may be forcing redirect

### Solution

**File:** `frontend/src/pages/Profile.jsx`

Check and add proper navigation unlock:

```jsx
// After successful wallet connection, ensure navigation works
useEffect(() => {
  if (address) {
    // Wallet is connected, ensure navigation is available
    setIsNavigationLocked(false);
  }
}, [address]);

// In return JSX, make sure all tabs are clickable
const handleTabChange = (tabName) => {
  setActiveTab(tabName);
  // No redirect should happen here
};
```

**File:** `frontend/src/Context/AppKitProvider.jsx`

After wallet connection, ensure app state is properly set:

```jsx
// When wallet connects successfully
const handleWalletConnection = () => {
  // 1. Set wallet connected state
  setWalletConnected(true);
  
  // 2. Fetch user profile
  loadUserProfile(address);
  
  // 3. DO NOT force profile page navigation
  // Let user stay where they are or go to home
  // navigate('/home'); // Remove this if it exists
};
```

**Implementation Steps:**

1. ✅ Open `frontend/src/Context/AppKitProvider.jsx`
2. ✅ Find wallet connection handler
3. ✅ Remove any forced navigation to profile
4. ✅ Test: Connect wallet → should stay on current page
5. ✅ Test: Should be able to click other tabs/navigate freely

---

## 🎯 Issue #2: Profile Doesn't Save

### Problem
When user edits profile, changes are not persisted to database.

### Root Cause
`MyProfile.jsx` is not calling the save function or API endpoint is not working.

### Solution

**File:** `frontend/src/components/MyProfile.jsx`

The `handleEditProfile` function needs to save to backend:

**Current Code (Lines 70-120):**
```jsx
const handleEditProfile = async () => {
  if (isEditing) {
    const error = validateName(tempName);
    if (error) {
      setNameError(error);
      return;
    }
    
    // ❌ PROBLEM: Not saving to backend!
    setProfileName(tempName);
    setNameError("");
    setIsEditing(false);
  } else {
    setIsEditing(true);
    setTempName(profileName);
  }
};
```

**Fix:**
```jsx
const handleEditProfile = async () => {
  if (isEditing) {
    const error = validateName(tempName);
    if (error) {
      setNameError(error);
      return;
    }
    
    // ✅ ADD: Save to backend
    setIsLoading(true);
    try {
      // Save profile data using userAPI
      const updatedProfile = await userAPI.createOrUpdateUser({
        walletAddress: address,
        username: tempName,
        email: profileData.email,
        bio: profileData.bio,
        image: profileData.image,
        socialLinks: profileData.socialLinks,
      });
      
      // Only update state after successful save
      setProfileName(tempName);
      setProfileData({
        ...profileData,
        username: tempName,
      });
      setNameError("");
      setIsEditing(false);
      
      SuccessToast("Profile saved successfully!");
    } catch (error) {
      ErrorToast("Failed to save profile: " + error.message);
      console.error("Save profile error:", error);
    } finally {
      setIsLoading(false);
    }
  } else {
    setIsEditing(true);
    setTempName(profileName);
  }
};
```

**Also add save handler for all profile fields:**

```jsx
const handleSaveProfile = async () => {
  setIsLoading(true);
  try {
    const updatedProfile = await userAPI.createOrUpdateUser({
      walletAddress: address,
      username: profileData.username,
      email: profileData.email,
      bio: profileData.bio,
      image: profileData.image,
      socialLinks: profileData.socialLinks.filter(link => link.trim()),
      favoriteCreators: profileData.favoriteCreators,
    });

    SuccessToast("Profile saved successfully!");
    setIsEditing(false);
  } catch (error) {
    ErrorToast("Failed to save profile");
    console.error(error);
  } finally {
    setIsLoading(false);
  }
};
```

**Implementation Steps:**

1. ✅ Open `frontend/src/components/MyProfile.jsx`
2. ✅ Find `handleEditProfile` function
3. ✅ Replace with version that calls `userAPI.createOrUpdateUser()`
4. ✅ Add `handleSaveProfile` for bulk save
5. ✅ Add save button to edit form
6. ✅ Test: Edit profile → Click Save → Data should persist
7. ✅ Test: Refresh page → Data should still be there

---

## 🎯 Issue #3: NFT Creation Missing "Number of Pieces"

### Problem
Users can't specify how many copies of an NFT they want to mint.

### Solution

**File:** `frontend/src/pages/Create.jsx`

Add field to form data:

```jsx
// Around line 36, add to formNftData:
const [formNftData, setFormNftData] = useState({
  price: "",
  name: "",
  creator: "",
  image: "",
  description: "",
  properties: "",
  category: "",
  collection: "",
  numberOfPieces: 1,  // ✅ ADD THIS
  quantity: 1,        // ✅ ADD THIS (alternative name)
});
```

**In the form HTML (find the price input, add after it):**

```jsx
{/* Number of Pieces Input */}
<div className="mb-4">
  <label className="block text-white mb-2">Number of Pieces to Mint</label>
  <input
    type="number"
    min="1"
    max="50"  // Based on bulk limit
    value={formNftData.numberOfPieces}
    onChange={(e) => {
      const value = parseInt(e.target.value) || 1;
      if (value > 50) {
        ErrorToast("Maximum 50 pieces per bulk mint");
        setFormNftData({ 
          ...formNftData, 
          numberOfPieces: 50 
        });
      } else if (value < 1) {
        setFormNftData({ 
          ...formNftData, 
          numberOfPieces: 1 
        });
      } else {
        setFormNftData({ 
          ...formNftData, 
          numberOfPieces: value 
        });
      }
    }}
    className="w-full px-4 py-2 bg-[#222] text-white rounded border border-purple-500"
    placeholder="1"
  />
  <small className="text-gray-400">Minimum: 1, Maximum: 50</small>
</div>
```

**When submitting mint, pass numberOfPieces:**

```jsx
// Find the mint submission code (around line 600+)
// Ensure numberOfPieces is included:

const handleMint = async () => {
  // ... validation code ...
  
  // ✅ Pass numberOfPieces to contract
  await publicMint(
    contractAddressMarketplace,
    {
      name: formNftData.name,
      description: formNftData.description,
      image: formNftData.image,
      price: formNftData.price,
      numberOfPieces: formNftData.numberOfPieces,  // ✅ ADD
      properties: formNftData.properties,
    }
  );
};
```

**Implementation Steps:**

1. ✅ Open `frontend/src/pages/Create.jsx`
2. ✅ Add `numberOfPieces: 1` to form state (line 36)
3. ✅ Add input field for number of pieces in form
4. ✅ Add validation: min 1, max 50
5. ✅ Pass `numberOfPieces` when calling mint function
6. ✅ Test: Create NFT → Should be able to set 1-50 pieces

---

## 🎯 Issue #4: Minted NFTs Not Visible on Profile/Explore

### Problem
After minting, NFTs don't appear on:
1. User's "Owned" tab on Profile page
2. Explore page listings

### Root Causes
1. Admin hasn't listed the NFT yet
2. Database not being updated with minted status
3. Frontend not refreshing NFT list after minting
4. Query filters might be excluding new NFTs

### Solution

**Step 1: After Minting, Update Database**

**File:** `frontend/src/pages/Create.jsx`

After successful mint, save NFT metadata to backend:

```jsx
const handleMintSuccess = async (mintData) => {
  try {
    // ✅ After successful mint, save to backend
    const nftPayload = {
      name: formNftData.name,
      description: formNftData.description,
      image: formNftData.image,
      price: formNftData.price,
      numberOfPieces: formNftData.numberOfPieces,
      collection: formNftData.collection,
      category: formNftData.category,
      creator: address,  // User's wallet
      contractAddress: contractAddressMarketplace,
      transactionHash: mintData.hash,  // From blockchain
      isMinted: true,
      isListed: false,
      timestamp: new Date().toISOString(),
    };

    // Save to backend API
    await fetch(`${API_BASE_URL}/api/v1/admin/nfts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-wallet': address,
      },
      body: JSON.stringify(nftPayload),
    });

    SuccessToast("NFT minted and saved successfully!");
    
    // ✅ Refresh user's NFT list
    await refreshUserNFTs();
    
  } catch (error) {
    ErrorToast("Failed to save NFT: " + error.message);
  }
};
```

**Step 2: Refresh NFT List After Minting**

**File:** `frontend/src/pages/Create.jsx`

```jsx
const refreshUserNFTs = async () => {
  try {
    // ✅ Reload user's NFT collection
    // This should be from your context or API
    if (getUserNFTs) {
      await getUserNFTs(address);
    }
  } catch (error) {
    console.error("Error refreshing NFTs:", error);
  }
};
```

**Step 3: Admin Must List NFT**

**File:** `frontend/src/pages/Admin.jsx` or Admin component

Add functionality for admin to list minted NFTs:

```jsx
const listNFTForExplore = async (nftId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/nfts/${nftId}/list`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminAddress,
        },
        body: JSON.stringify({
          isListed: true,
        }),
      }
    );

    if (response.ok) {
      SuccessToast("NFT listed on Explore page");
      // Refresh explore page data
    }
  } catch (error) {
    ErrorToast("Failed to list NFT");
  }
};
```

**Step 4: Make Sure Owned NFTs Show on Profile**

**File:** `frontend/src/pages/Profile.jsx`

In the "Owned" tab, fetch user's NFTs:

```jsx
// Add to useEffect
useEffect(() => {
  if (activeTab === "Owned" && address) {
    fetchUserOwnedNFTs();
  }
}, [activeTab, address]);

const fetchUserOwnedNFTs = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/user/nfts/owned/${address}`
    );
    const data = await response.json();
    
    // Update NFT list with owned NFTs
    setOwnedNFTs(data.nfts || []);
  } catch (error) {
    console.error("Error fetching owned NFTs:", error);
  }
};
```

**Implementation Steps:**

1. ✅ Open `frontend/src/pages/Create.jsx`
2. ✅ Add `handleMintSuccess` function that saves to backend
3. ✅ Call API to save NFT metadata after minting
4. ✅ Open `frontend/src/pages/Profile.jsx`
5. ✅ Add `fetchUserOwnedNFTs` to fetch and display owned NFTs
6. ✅ Update "Owned" tab to show real data, not mock data
7. ✅ Test: Mint NFT → Should appear on profile
8. ✅ Admin: List NFT → Should appear on Explore page

---

## 🎯 Issue #5: Add 50 NFT Bulk Minting Limit

### Problem
No validation preventing users from bulk minting more than 50 NFTs at once.

### Solution

**File:** `frontend/src/pages/Create.jsx`

Add validation before minting:

```jsx
const validateMintingLimit = (numberOfPieces) => {
  if (!numberOfPieces || numberOfPieces < 1) {
    ErrorToast("Minimum 1 NFT required");
    return false;
  }

  if (numberOfPieces > 50) {
    ErrorToast("Bulk minting limit is 50 NFTs. Please mint 50 or fewer.");
    return false;
  }

  return true;
};

const handleMintSubmission = async () => {
  // ✅ Validate limit
  if (!validateMintingLimit(formNftData.numberOfPieces)) {
    return;
  }

  // ... continue with minting ...
};
```

**In batch minting section (find around line 700+):**

```jsx
// For batch uploads
const handleBatchMint = async () => {
  // ✅ Check total number of files
  if (batchFiles.length > 50) {
    ErrorToast(`You can only batch mint maximum 50 NFTs. You selected ${batchFiles.length}`);
    return;
  }

  // Continue with batch minting
  // ...
};
```

**Also add UI feedback:**

```jsx
{batchFiles.length > 0 && (
  <div className="mt-4 p-4 bg-blue-900 text-white rounded">
    <p>Selected: {batchFiles.length}/50 NFTs</p>
    {batchFiles.length > 50 && (
      <p className="text-red-400 mt-2">⚠️ Exceeds 50 NFT limit!</p>
    )}
    {batchFiles.length === 50 && (
      <p className="text-green-400 mt-2">✅ Maximum limit reached</p>
    )}
  </div>
)}
```

**Also validate in backend**

**File:** `backend/routes/nft.routes.js` or `backend/controllers/nftController.js`

```javascript
// When receiving bulk mint request
app.post('/api/v1/nft/bulk-mint', async (req, res) => {
  const { nfts } = req.body;

  // ✅ Validate limit
  if (nfts.length > 50) {
    return res.status(400).json({
      error: 'Bulk minting limit exceeded. Maximum 50 NFTs per request.',
      max: 50,
      requested: nfts.length,
    });
  }

  // Continue with minting...
});
```

**Implementation Steps:**

1. ✅ Open `frontend/src/pages/Create.jsx`
2. ✅ Add `validateMintingLimit` function
3. ✅ Call it before submitting mint
4. ✅ Add UI warning when approaching 50 limit
5. ✅ Add validation in batch upload handler
6. ✅ Open backend mint route and add validation
7. ✅ Test: Try to mint 51 NFTs → Should show error
8. ✅ Test: Mint 50 NFTs → Should work

---

## 🎯 Issue #6: Fix Sales Fees (2.5% Creator, 1.5% Buyer)

### Problem
Current fee structure is incorrect or not implemented.

### Solution

**File:** Backend fees configuration or service file

Check `backend/services/feeService.js` or similar:

```javascript
// ✅ CORRECT FEE STRUCTURE
const FEE_STRUCTURE = {
  creatorFee: 0.025,      // 2.5% for seller/creator
  buyerFee: 0.015,        // 1.5% for buyer
  platformFee: 0.010,     // 1% for platform (optional)
};

/**
 * Calculate fees for a transaction
 * @param {number} price - Sale price
 * @param {string} sellerType - 'creator' or 'buyer'
 * @returns {object} Breakdown of fees
 */
function calculateFees(price, sellerType = 'creator') {
  let fee = 0;
  
  if (sellerType === 'creator') {
    // Creator selling: 2.5% fee
    fee = price * FEE_STRUCTURE.creatorFee;
  } else if (sellerType === 'buyer') {
    // Buyer purchasing: 1.5% fee
    fee = price * FEE_STRUCTURE.buyerFee;
  }

  return {
    subtotal: price,
    fee: parseFloat(fee.toFixed(4)),
    total: parseFloat((price + fee).toFixed(4)),
    feePercentage: sellerType === 'creator' ? 2.5 : 1.5,
    feeType: sellerType,
  };
}

/**
 * Calculate transaction amounts with fees
 */
function calculateTransactionAmount(basePrice, isBuyer = false) {
  if (isBuyer) {
    // Buyer pays: base price + 1.5% buyer fee
    const fee = basePrice * FEE_STRUCTURE.buyerFee;
    return {
      basePrice,
      buyerFee: fee,
      totalToPay: basePrice + fee,
      breakdown: `$${basePrice} + $${fee.toFixed(2)} (1.5% buyer fee) = $${(basePrice + fee).toFixed(2)}`,
    };
  } else {
    // Creator receives: base price - 2.5% creator fee
    const fee = basePrice * FEE_STRUCTURE.creatorFee;
    return {
      basePrice,
      creatorFee: fee,
      creatorReceives: basePrice - fee,
      breakdown: `$${basePrice} - $${fee.toFixed(2)} (2.5% creator fee) = $${(basePrice - fee).toFixed(2)}`,
    };
  }
}

module.exports = {
  FEE_STRUCTURE,
  calculateFees,
  calculateTransactionAmount,
};
```

**Usage in checkout/purchase flow:**

**File:** `backend/routes/checkout.routes.js` or purchase controller

```javascript
import { calculateTransactionAmount } from '../services/feeService.js';

app.post('/api/v1/checkout', async (req, res) => {
  const { nftPrice, isBuyer } = req.body;

  // ✅ Calculate correct fees
  const transaction = calculateTransactionAmount(nftPrice, isBuyer);

  // If buyer: they pay nftPrice + 1.5%
  // If creator: they receive nftPrice - 2.5%

  res.json({
    originalPrice: nftPrice,
    fees: transaction,
    totalAmount: transaction.totalToPay || transaction.creatorReceives,
    type: isBuyer ? 'purchase' : 'sale',
  });
});
```

**Display fees in frontend checkout:**

**File:** `frontend/src/pages/BuyNft.jsx` or checkout component

```jsx
const [feeBreakdown, setFeeBreakdown] = useState(null);

useEffect(() => {
  // Calculate fees when price loads
  if (nftPrice) {
    setFeeBreakdown({
      basePrice: nftPrice,
      buyerFee: nftPrice * 0.015,  // 1.5%
      total: nftPrice + (nftPrice * 0.015),
    });
  }
}, [nftPrice]);

// In JSX:
{feeBreakdown && (
  <div className="fee-breakdown p-4 bg-gray-800 rounded">
    <div className="flex justify-between mb-2">
      <span>NFT Price:</span>
      <span>${feeBreakdown.basePrice}</span>
    </div>
    <div className="flex justify-between mb-2 text-red-400">
      <span>Buyer Fee (1.5%):</span>
      <span>${feeBreakdown.buyerFee.toFixed(2)}</span>
    </div>
    <div className="flex justify-between font-bold border-t border-gray-600 pt-2">
      <span>Total to Pay:</span>
      <span>${feeBreakdown.total.toFixed(2)}</span>
    </div>
  </div>
)}
```

**Implementation Steps:**

1. ✅ Create/verify `backend/services/feeService.js` exists
2. ✅ Update with correct fee structure (2.5% creator, 1.5% buyer)
3. ✅ Update checkout route to use `calculateTransactionAmount`
4. ✅ Update purchase route to use `calculateFees`
5. ✅ Update frontend checkout to display fees correctly
6. ✅ Update NFT listing to show fee breakdown
7. ✅ Test: Buy NFT for $100 → Should pay $101.50 (+ 1.5%)
8. ✅ Test: Sell NFT for $100 → Creator should receive $97.50 (- 2.5%)

---

## 🎯 Issue #7: Fix NFT Buying Functionality

### Problem
Users can't successfully purchase NFTs.

### Solution

**Step 1: Verify Purchase Endpoint Exists**

**File:** `backend/routes/purchase.routes.js` (or create if missing)

```javascript
import express from 'express';
import { purchaseNFT, confirmPurchase } from '../controllers/purchaseController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// ✅ POST endpoint for purchasing
router.post('/purchase', authenticateUser, purchaseNFT);
router.post('/purchase/:purchaseId/confirm', authenticateUser, confirmPurchase);

export default router;
```

**Step 2: Implement Purchase Controller**

**File:** `backend/controllers/purchaseController.js` (create if missing)

```javascript
import NFT from '../models/NFT.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { calculateTransactionAmount } from '../services/feeService.js';

export const purchaseNFT = async (req, res) => {
  try {
    const { nftId, quantity = 1, paymentMethod } = req.body;
    const buyerWallet = req.headers['x-user-wallet'];

    // ✅ Validate
    if (!nftId || !buyerWallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Get NFT
    const nft = await NFT.findById(nftId);
    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    if (!nft.isListed) {
      return res.status(400).json({ error: 'NFT is not for sale' });
    }

    if (nft.availableQuantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }

    // ✅ Calculate fees
    const totalPrice = nft.price * quantity;
    const feeBreakdown = calculateTransactionAmount(totalPrice, true);

    // ✅ Create transaction record
    const transaction = new Transaction({
      nftId,
      buyerWallet,
      sellerWallet: nft.creatorWallet,
      quantity,
      basePrice: nft.price,
      totalPrice: totalPrice,
      fees: feeBreakdown.buyerFee,
      finalAmount: feeBreakdown.totalToPay,
      paymentMethod,
      status: 'pending', // Will change to 'completed' after blockchain confirmation
      timestamp: new Date(),
    });

    await transaction.save();

    // ✅ Return purchase details
    res.json({
      success: true,
      transactionId: transaction._id,
      details: {
        nftName: nft.name,
        price: nft.price,
        quantity,
        subtotal: totalPrice,
        buyerFee: feeBreakdown.buyerFee,
        totalAmount: feeBreakdown.totalToPay,
        breakdown: feeBreakdown.breakdown,
      },
      message: 'Purchase initiated. Please confirm in your wallet.',
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const confirmPurchase = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { transactionHash } = req.body;
    const buyerWallet = req.headers['x-user-wallet'];

    // ✅ Get transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // ✅ Verify buyer
    if (transaction.buyerWallet !== buyerWallet) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // ✅ Update transaction
    transaction.status = 'completed';
    transaction.transactionHash = transactionHash;
    transaction.completedAt = new Date();
    await transaction.save();

    // ✅ Update NFT ownership
    const nft = await NFT.findById(transaction.nftId);
    nft.owner = buyerWallet;
    nft.availableQuantity -= transaction.quantity;
    
    if (nft.availableQuantity <= 0) {
      nft.isListed = false;
    }
    
    await nft.save();

    // ✅ Add to buyer's owned NFTs
    await User.findOneAndUpdate(
      { walletAddress: buyerWallet },
      { $push: { ownedNFTs: transaction.nftId } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Purchase confirmed!',
      nftId: nft._id,
      owner: buyerWallet,
    });
  } catch (error) {
    console.error('Confirm purchase error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

**Step 3: Frontend Purchase Flow**

**File:** `frontend/src/pages/BuyNft.jsx`

```jsx
import { useState } from 'react';
import { SuccessToast, ErrorToast } from '../app/Toast/';

export default function BuyNft() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);

  const handleBuyClick = async (nftId, nftPrice) => {
    setIsProcessing(true);
    try {
      // ✅ Step 1: Initiate purchase
      const response = await fetch(`${API_BASE_URL}/api/v1/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-wallet': userWallet,
        },
        body: JSON.stringify({
          nftId,
          quantity: 1,
          paymentMethod: 'wallet',
        }),
      });

      const purchaseResponse = await response.json();

      if (!response.ok) {
        throw new Error(purchaseResponse.error);
      }

      setPurchaseData(purchaseResponse);

      // ✅ Step 2: Show fee breakdown
      showFeeBreakdown(purchaseResponse.details);

      // ✅ Step 3: Process blockchain transaction
      await processPurchaseTransaction(
        purchaseResponse.transactionId,
        nftPrice,
        purchaseResponse.details.totalAmount
      );

    } catch (error) {
      ErrorToast(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPurchaseTransaction = async (transactionId, basePrice, totalAmount) => {
    try {
      // ✅ Connect to blockchain and transfer funds
      const tx = await contractInstance.purchase(totalAmount);
      
      // ✅ Wait for confirmation
      const receipt = await tx.wait();

      // ✅ Confirm purchase on backend
      const confirmResponse = await fetch(
        `${API_BASE_URL}/api/v1/purchase/${transactionId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-wallet': userWallet,
          },
          body: JSON.stringify({
            transactionHash: receipt.transactionHash,
          }),
        }
      );

      if (confirmResponse.ok) {
        SuccessToast('NFT purchased successfully!');
        // Redirect to owned NFTs or refresh
        navigate('/profile?tab=Owned');
      }
    } catch (error) {
      ErrorToast('Purchase failed: ' + error.message);
    }
  };

  return (
    <div>
      {/* Display NFT details */}
      {/* Display fee breakdown */}
      <button 
        onClick={() => handleBuyClick(nftId, price)}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  );
}
```

**Implementation Steps:**

1. ✅ Create `backend/controllers/purchaseController.js` with above code
2. ✅ Create `backend/routes/purchase.routes.js` with endpoints
3. ✅ Register routes in main backend app
4. ✅ Update `frontend/src/pages/BuyNft.jsx` with purchase flow
5. ✅ Add fee calculation and display
6. ✅ Test: Buy NFT → Should prompt wallet → Should confirm purchase → Should appear in owned NFTs

---

## 🎯 Issue #8: Fix WalletConnect API Integration

### Problem
WalletConnect integration is broken or not properly configured.

### Solution

**Step 1: Check WalletConnect Configuration**

**File:** `frontend/src/Context/AppKitProvider.jsx`

```jsx
import { createAppKit, useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, polygon, bsc } from '@reown/appkit/networks';

// ✅ Verify these configurations
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.error('REACT_APP_WALLETCONNECT_PROJECT_ID is not set in .env');
}

const metadata = {
  name: 'Durchex NFT Marketplace',
  description: 'Mint, buy, and sell NFTs on Durchex',
  url: process.env.REACT_APP_SITE_URL || 'https://durchex.com',
  icons: ['https://durchex.com/logo.png'],
};

const networks = [mainnet, polygon, bsc];

const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
  },
});

export default modal;
```

**Step 2: Verify Environment Variables**

**File:** `.env` or `.env.local`

```env
# ✅ Add these required variables
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id_from_reown
REACT_APP_SITE_URL=https://durchex.com

# Optional but recommended
REACT_APP_WALLETCONNECT_RELAY_URL=wss://relay.walletconnect.com
```

**Step 3: Fix Wallet Connection Hook**

**File:** `frontend/src/hooks/useWalletSession.js` (create if missing)

```javascript
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useEffect, useState } from 'react';

export const useWalletSession = () => {
  const { isConnected, address, chainId } = useAppKitAccount();
  const { open } = useAppKit();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check connection status
    setIsReady(true);
  }, []);

  const connect = async () => {
    try {
      await open({ view: 'Connect' });
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      // Implement disconnect logic
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletChainId');
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  };

  return {
    isConnected,
    address,
    chainId,
    isReady,
    connect,
    disconnect,
  };
};
```

**Step 4: Fix WalletConnect in App Context**

**File:** `frontend/src/Context/index.jsx` or `ICOContent`

```javascript
// ✅ Ensure wallet connection is properly initialized
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

const ICOProvider = ({ children }) => {
  const { isConnected, address, chainId } = useAppKitAccount();
  const { open } = useAppKit();

  // ✅ Wallet connection handler
  const connectWallet = async () => {
    try {
      if (!isConnected) {
        await open({ view: 'Connect' });
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // ✅ Handle connection changes
  useEffect(() => {
    if (isConnected && address) {
      // Load user profile after connection
      loadUserProfile(address);
      
      // DO NOT force navigation to profile
      // Let user stay on current page
    }
  }, [isConnected, address]);

  return (
    <ICOContent.Provider value={{ connectWallet, address, isConnected, ... }}>
      {children}
    </ICOContent.Provider>
  );
};
```

**Step 5: Test WalletConnect**

```javascript
// In browser console:

// Test 1: Check if WalletConnect is initialized
console.log('WalletConnect ready:', window.walletConnect !== undefined);

// Test 2: Try connection
const button = document.querySelector('button[onclick*="connectWallet"]');
button.click();

// Test 3: Should open modal
// Test 4: Should be able to select wallet
// Test 5: Should redirect to wallet app
// Test 6: After approval, should return to app with address connected
```

**Implementation Steps:**

1. ✅ Verify `.env` has `REACT_APP_WALLETCONNECT_PROJECT_ID`
2. ✅ Get Project ID from https://cloud.reown.com
3. ✅ Update `frontend/src/Context/AppKitProvider.jsx` with correct config
4. ✅ Create/update `frontend/src/hooks/useWalletSession.js`
5. ✅ Update context to use correct hooks
6. ✅ Remove any forced profile page redirects after connection
7. ✅ Test: Open app → Click Connect → Should open WalletConnect modal
8. ✅ Test: Select wallet → Approve connection → Should show address
9. ✅ Test: Should NOT redirect to profile, user should stay on page

---

## 📝 Implementation Checklist

### Issue #1: Navigation Lock
- [ ] Remove forced profile navigation after wallet connection
- [ ] Test navigation works after wallet connection
- [ ] Verify all tabs are clickable

### Issue #2: Profile Save
- [ ] Add backend API call in `handleEditProfile`
- [ ] Add `handleSaveProfile` function
- [ ] Add save button to form
- [ ] Verify profile persists after refresh

### Issue #3: Number of Pieces
- [ ] Add `numberOfPieces` field to form state
- [ ] Add input field with min/max validation
- [ ] Pass to minting function
- [ ] Test with different quantities

### Issue #4: Minted NFTs Visibility
- [ ] Save NFT metadata after minting
- [ ] Fetch user's owned NFTs on profile
- [ ] Admin list NFT feature
- [ ] Test minted NFT appears on profile and explore

### Issue #5: 50 NFT Limit
- [ ] Add validation function
- [ ] Validate before minting
- [ ] Add UI feedback
- [ ] Backend validation

### Issue #6: Sales Fees (2.5% & 1.5%)
- [ ] Create fee service with correct rates
- [ ] Update checkout endpoint
- [ ] Display fees in UI
- [ ] Test calculations

### Issue #7: NFT Buying
- [ ] Create purchase endpoint
- [ ] Implement purchase controller
- [ ] Update frontend purchase flow
- [ ] Test complete purchase flow

### Issue #8: WalletConnect
- [ ] Verify Project ID in `.env`
- [ ] Update AppKitProvider config
- [ ] Fix connection handler
- [ ] Test wallet connection

---

## 🔄 Testing Priority

**TIER 1 - Do First (Blocks Everything Else)**
1. [ ] Issue #8: Fix WalletConnect - users can't even connect
2. [ ] Issue #1: Fix navigation lock - users get stuck
3. [ ] Issue #2: Profile save - essential for user data

**TIER 2 - Do Second (Core Features)**
4. [ ] Issue #3: Number of pieces - needed for minting
5. [ ] Issue #7: NFT buying - core marketplace feature
6. [ ] Issue #4: Minted NFT visibility - users want to see what they created

**TIER 3 - Do Third (Optimization)**
7. [ ] Issue #5: 50 NFT limit - prevents abuse
8. [ ] Issue #6: Fee structure - important for economics

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All 8 issues fixed and tested
- [ ] Unit tests for fee calculations
- [ ] Integration tests for purchase flow
- [ ] Wallet connection tested with MetaMask, Walletconnect
- [ ] Profile save tested
- [ ] NFT visibility after minting tested
- [ ] Fee breakdown displayed correctly
- [ ] Bulk minting limit enforced (50 max)
- [ ] No console errors
- [ ] No hard-coded values (use env vars)

---

**Document Status:** 📋 Complete Action Plan Ready for Implementation  
**Last Updated:** December 18, 2025  
**Assigned To:** Development Team

