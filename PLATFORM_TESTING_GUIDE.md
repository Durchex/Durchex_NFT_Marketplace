# 🧪 Durchex NFT Marketplace - Comprehensive Testing Guide

**Version:** 1.0  
**Date:** December 17, 2025  
**Status:** Pre-Deployment Testing Plan

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Pre-Testing Checklist](#pre-testing-checklist)
3. [Test Environment Setup](#test-environment-setup)
4. [Core Features Testing](#core-features-testing)
5. [User Journey Testing](#user-journey-testing)
6. [Admin Features Testing](#admin-features-testing)
7. [Payment & Fee Testing](#payment--fee-testing)
8. [Giveaway System Testing](#giveaway-system-testing)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Performance Testing](#performance-testing)
11. [Security Testing](#security-testing)
12. [Issues Found & Resolutions](#issues-found--resolutions)
13. [Test Report Template](#test-report-template)

---

## 🎯 Testing Overview

### Scope
This testing guide covers **end-to-end functionality** across all platform features to ensure:
- ✅ Users can create and mint NFTs without errors
- ✅ Admin operations work smoothly
- ✅ Service charges and fee percentages apply correctly
- ✅ Giveaway system functions properly
- ✅ User profiles and wallet connections remain stable
- ✅ No platform breakage during any user operation

### Key Features to Test
| Feature | Priority | Status |
|---------|----------|--------|
| Wallet Connection | 🔴 CRITICAL | ⏳ Pending |
| User Registration/Profile | 🔴 CRITICAL | ⏳ Pending |
| NFT Creation | 🔴 CRITICAL | ⏳ Pending |
| NFT Minting | 🔴 CRITICAL | ⏳ Pending |
| Shopping Cart | 🔴 CRITICAL | ⏳ Pending |
| Checkout/Purchase | 🔴 CRITICAL | ⏳ Pending |
| Service Charges | 🟠 HIGH | ⏳ Pending |
| Fee Subsidy | 🟠 HIGH | ⏳ Pending |
| Admin Dashboard | 🟠 HIGH | ⏳ Pending |
| Unminted NFTs Management | 🟠 HIGH | ⏳ Pending |
| Giveaway System | 🟠 HIGH | ⏳ Pending |
| Countdown Timers | 🟠 HIGH | ⏳ Pending |
| Verification System | 🟡 MEDIUM | ⏳ Pending |
| Gas Fee Estimation | 🟡 MEDIUM | ⏳ Pending |

---

## ✅ Pre-Testing Checklist

### Backend Requirements
- [ ] Backend running on port 3000 (or configured port)
- [ ] MongoDB connection established
- [ ] All required environment variables set
- [ ] Database migrations complete
- [ ] All backend routes registered:
  - [ ] Admin routes: `/api/v1/admin/*`
  - [ ] User routes: `/api/v1/user/*`
  - [ ] NFT routes: `/api/v1/nft/*`
  - [ ] Cart routes: `/api/v1/cart/*`
  - [ ] Auth routes: `/api/v1/admin-auth/*`
  - [ ] Verification routes: `/api/v1/verification/*`
  - [ ] Gas Fee routes: `/api/v1/gas-fee/*`

### Frontend Requirements
- [ ] Frontend running on port 5173 (Vite) or configured port
- [ ] All npm dependencies installed
- [ ] Environment variables configured (.env)
- [ ] Build successful (npm run build)
- [ ] No console errors on page load

### Wallet & Blockchain Setup
- [ ] MetaMask or Web3 wallet installed
- [ ] Test network configured (Sepolia, Mumbai, etc.)
- [ ] Test ETH/tokens in wallet
- [ ] Smart contract addresses configured
- [ ] Network RPC endpoints working

### Test Data
- [ ] Admin account created and authenticated
- [ ] Test user wallet address ready
- [ ] Test NFT metadata prepared
- [ ] Images/assets for testing prepared

### API Connectivity
```bash
# Test backend health
curl http://localhost:3000/api/health
# Expected: {"status":"OK", ...}

# Test admin route (may return 401 if not authenticated)
curl http://localhost:3000/api/v1/admin/stats
# Expected: 200 or 401 (not 404)

# Test user route
curl http://localhost:3000/api/v1/user/users
# Expected: 200 or array response
```

---

## 🛠️ Test Environment Setup

### Local Development Setup

#### Step 1: Start Backend
```bash
cd backend_temp
npm install
npm start
# Expected output: "Server is running on port: 3000"
```

#### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
# Expected output: "VITE v5.x.x  ready in XXX ms"
# URL: http://localhost:5173
```

#### Step 3: Verify Connectivity
```bash
# From another terminal, test API:
curl -s http://localhost:3000/api/health | jq .
```

#### Step 4: Connect Wallet in Browser
1. Open http://localhost:5173
2. Click "Connect Wallet" button
3. Approve MetaMask connection
4. Verify wallet address displays in UI

---

## 🧪 Core Features Testing

### 1️⃣ Wallet Connection & Authentication

#### Test Case 1.1: Initial Wallet Connection
**Steps:**
1. Open application in fresh browser
2. Click "Connect Wallet" button
3. Select MetaMask from wallet options
4. Approve connection in MetaMask
5. Verify wallet address displays in header/profile

**Expected Results:**
- ✅ MetaMask popup appears
- ✅ Wallet address shows after approval
- ✅ User can proceed to other features
- ✅ No console errors

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 1.2: Wallet Disconnect & Reconnect
**Steps:**
1. Connect wallet (use Test Case 1.1)
2. Click wallet address or menu → "Disconnect"
3. Verify application resets to disconnected state
4. Click "Connect Wallet" again
5. Approve connection again

**Expected Results:**
- ✅ Wallet disconnects cleanly
- ✅ All user data cleared from UI
- ✅ Can reconnect successfully
- ✅ No duplicate address displays

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 1.3: Multiple Wallets (Switch Accounts)
**Steps:**
1. Connect Wallet A (MetaMask)
2. Create/purchase NFT as Wallet A
3. Switch to Wallet B in MetaMask
4. Return to application
5. Verify UI updates to Wallet B
6. Check Wallet B has different NFT inventory

**Expected Results:**
- ✅ UI updates to new wallet automatically
- ✅ User profile/NFTs reflect Wallet B
- ✅ Cart clears or updates appropriately
- ✅ No console errors about address mismatch

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 2️⃣ User Registration & Profile

#### Test Case 2.1: Create User Profile
**Steps:**
1. Connect wallet
2. Navigate to Profile page
3. Click "Edit Profile" or "Create Profile"
4. Fill in:
   - Username
   - Bio/Description
   - Profile Picture (upload)
   - Social Links (optional)
5. Click "Save Profile"

**Expected Results:**
- ✅ Profile saved to database
- ✅ Success notification appears
- ✅ Profile picture uploaded and displays
- ✅ Data persists on page refresh
- ✅ No console errors

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 2.2: Update User Profile
**Steps:**
1. Create profile (use Test Case 2.1)
2. Go to Profile page
3. Click "Edit"
4. Modify:
   - Bio text
   - Profile picture
   - Social links
5. Save changes

**Expected Results:**
- ✅ Changes save to database
- ✅ Profile refreshes with new data
- ✅ Old data is overwritten (not duplicated)
- ✅ Image URL updated
- ✅ Modification timestamp updates

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 2.3: View User Profile (Another User)
**Steps:**
1. Connect as User A
2. Create profile for User A
3. Connect as User B (switch wallet)
4. Find User A's profile (via NFT, search, etc.)
5. View User A's profile details
6. Verify you cannot edit User A's profile

**Expected Results:**
- ✅ User A's profile displays correctly
- ✅ Only User B's own data can be edited
- ✅ Cannot access edit button for other users' profiles
- ✅ Read-only view for other profiles

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 3️⃣ NFT Creation

#### Test Case 3.1: Create Standard NFT
**Steps:**
1. Connect wallet
2. Navigate to "Create" or "Studio"
3. Fill NFT details:
   - Name
   - Description
   - Image (upload)
   - Category
   - Network (select one)
   - Price (optional)
   - Royalties (optional)
4. Click "Create NFT"
5. Approve transaction in MetaMask

**Expected Results:**
- ✅ Form validates required fields
- ✅ Image uploads and previews
- ✅ Smart contract transaction created
- ✅ MetaMask shows transaction details
- ✅ Transaction confirmation appears
- ✅ NFT appears in "My NFTs" list
- ✅ Database record created
- ✅ No console errors

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 3.2: Create NFT with Royalties
**Steps:**
1. Follow Test Case 3.1
2. Set royalty percentage (e.g., 10%)
3. Set royalty wallet address
4. Create NFT and confirm transaction

**Expected Results:**
- ✅ Royalty percentage stored in database
- ✅ Royalty address validated and stored
- ✅ Royalties display in NFT details
- ✅ When NFT is sold, royalties go to specified wallet
- ✅ Royalty calculation correct (e.g., 10% of sale price)

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 3.3: Create Unminted NFT (Admin)
**Steps:**
1. Login as admin
2. Navigate to Admin → Unminted NFTs
3. Click "Create Unminted NFT"
4. Fill:
   - Name
   - Description
   - Image (base64 upload)
   - Collection
   - Network
   - Category
   - Price
   - Is Giveaway (toggle on/off)
   - Event Start Time
5. Click "Create NFT"

**Expected Results:**
- ✅ NFT created with status "pending"
- ✅ Stores in unminted_nfts collection
- ✅ Admin can see in NFT list
- ✅ Event start time saves correctly
- ✅ Giveaway flag saves if toggled

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 4️⃣ NFT Minting

#### Test Case 4.1: Mint Single NFT
**Steps:**
1. Create NFT (Test Case 3.1)
2. Go to "My NFTs"
3. Find unminted NFT
4. Click "Mint"
5. Approve gas fee in MetaMask
6. Confirm minting transaction

**Expected Results:**
- ✅ Minting transaction created
- ✅ Gas fee displayed and confirmed
- ✅ Transaction sent to blockchain
- ✅ Loading state shows during confirmation
- ✅ Success notification when minted
- ✅ NFT status changes from "unminted" to "minted"
- ✅ Token ID appears in NFT details
- ✅ Cannot mint same NFT twice

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 4.2: Mint Multiple NFTs Batch
**Steps:**
1. Create 3+ NFTs
2. Go to "My NFTs"
3. Select multiple unminted NFTs (checkboxes)
4. Click "Mint All" or "Batch Mint"
5. Approve batch transaction in MetaMask

**Expected Results:**
- ✅ All selected NFTs mint in sequence
- ✅ Progress indicator shows batch progress
- ✅ Each transaction tracked separately
- ✅ Failures handled gracefully (continue with others)
- ✅ All minted NFTs update in UI
- ✅ No duplicates or skipped NFTs

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 4.3: Mint with Insufficient Gas
**Steps:**
1. Create NFT
2. Reduce wallet balance to less than required gas
3. Attempt to mint
4. MetaMask shows insufficient funds error

**Expected Results:**
- ✅ MetaMask rejects transaction
- ✅ Error message displayed to user
- ✅ NFT remains unminted
- ✅ No partial transactions
- ✅ User can retry after adding funds

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 5️⃣ Shopping Cart & Checkout

#### Test Case 5.1: Add NFT to Cart
**Steps:**
1. Browse NFTs in Marketplace
2. Select any NFT
3. Click "Add to Cart"
4. Verify cart counter increments
5. View cart to confirm NFT added

**Expected Results:**
- ✅ NFT added to cart without page refresh
- ✅ Cart icon shows item count
- ✅ Cart persists if page refreshed
- ✅ Can add same NFT only once
- ✅ Toast notification confirms addition
- ✅ No console errors

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 5.2: Remove NFT from Cart
**Steps:**
1. Add NFT to cart (Test Case 5.1)
2. Open cart
3. Click "Remove" on NFT item
4. Confirm removal

**Expected Results:**
- ✅ NFT removed from cart
- ✅ Cart updates immediately
- ✅ Cart counter decrements
- ✅ Subtotal recalculates
- ✅ Success notification appears
- ✅ No console errors

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 5.3: Calculate Total with Service Charge
**Steps:**
1. Add NFT with price $100 to cart
2. Platform service charge is 2.5%
3. View cart total
4. Verify calculation:
   - Subtotal: $100.00
   - Service Charge (2.5%): $2.50
   - Total: $102.50

**Expected Results:**
- ✅ Service charge calculated correctly
- ✅ Total displays correctly
- ✅ Breakdown shown to user
- ✅ Correct amount sent to smart contract
- ✅ No rounding errors

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 5.4: Checkout & Payment
**Steps:**
1. Add NFT(s) to cart
2. Click "Proceed to Checkout"
3. Review order summary:
   - NFT details
   - Subtotal
   - Service charges
   - Total
4. Click "Complete Purchase"
5. MetaMask shows transaction with total amount
6. Approve and confirm payment

**Expected Results:**
- ✅ Order summary accurate
- ✅ MetaMask transaction amount correct
- ✅ Payment processed successfully
- ✅ Receipt generated
- ✅ NFT ownership transferred to buyer
- ✅ Seller receives payment minus fees
- ✅ NFT removed from seller's inventory
- ✅ NFT appears in buyer's "My NFTs"
- ✅ Transaction recorded in blockchain

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case 5.5: Clear Cart
**Steps:**
1. Add 2+ NFTs to cart
2. Click "Clear Cart" or "Empty Cart"
3. Confirm action in dialog

**Expected Results:**
- ✅ All items removed
- ✅ Cart shows empty state
- ✅ Cart counter shows 0
- ✅ Subtotal resets to $0
- ✅ Cannot proceed to checkout
- ✅ Success notification

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

---

## 👥 User Journey Testing

### Complete User Journey: First-Time Buyer

#### Journey Steps:
1. **New User Arrives** → Sees landing page
2. **Connect Wallet** → MetaMask approval
3. **Create Profile** → Set username, avatar, bio
4. **Browse NFTs** → Explore marketplace
5. **View NFT Details** → Check price, description, creator
6. **Add to Cart** → Select and add NFT
7. **Checkout** → Review order, confirm payment
8. **Confirm Transaction** → MetaMask approval
9. **Own NFT** → Appears in "My NFTs" collection
10. **View Collection** → See owned NFT in profile

**Full Test:**
```
START
├─ Open http://localhost:5173
├─ Click "Connect Wallet"
├─ Approve in MetaMask
├─ Navigate to Profile
├─ Create profile (name, bio, image)
├─ Go to Marketplace
├─ Browse categories or search
├─ Select NFT
├─ Click "Add to Cart"
├─ Go to Cart
├─ Review order summary
├─ Click "Checkout"
├─ Approve MetaMask payment
├─ Wait for confirmation
├─ Verify NFT in "My NFTs"
└─ END ✅ Success
```

**Expected Final State:**
- ✅ User profile complete
- ✅ NFT owned by user wallet
- ✅ Transaction visible on blockchain
- ✅ Purchase history recorded
- ✅ Seller received payment
- ✅ No errors or warnings

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### Complete User Journey: NFT Creator

#### Journey Steps:
1. **Create Account** → Profile setup
2. **Navigate to Studio** → NFT creation
3. **Create NFT** → Upload image, fill details
4. **Mint NFT** → Blockchain confirmation
5. **List for Sale** → Set price, approve listing
6. **See Sales** → Monitor purchases
7. **Receive Payment** → Funds in wallet

**Full Test:**
```
START
├─ Connect wallet
├─ Create profile
├─ Go to "Studio" or "Create"
├─ Create new NFT
│  ├─ Upload image
│  ├─ Fill name/description
│  ├─ Set category & price
│  └─ Submit
├─ Mint NFT (blockchain transaction)
├─ Confirm in MetaMask
├─ NFT appears in "My NFTs"
├─ Click "List for Sale"
├─ Set price
├─ Approve listing transaction
├─ NFT appears in marketplace
├─ Wait for buyer
├─ Buyer purchases NFT
├─ Verify payment received
└─ END ✅ Success
```

**Expected Final State:**
- ✅ NFT created and minted
- ✅ Listed in marketplace
- ✅ Searchable by other users
- ✅ Can be purchased by others
- ✅ Creator receives payment (minus fees)
- ✅ Ownership transfers to buyer

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

---

## 🛡️ Admin Features Testing

### 1️⃣ Admin Login

#### Test Case Admin 1.1: Admin Authentication
**Steps:**
1. Navigate to Admin Dashboard URL
2. Enter admin credentials
3. Click "Login"
4. Verify authentication token received
5. Can access admin pages

**Expected Results:**
- ✅ Admin login page loads
- ✅ Credentials validated
- ✅ Auth token stored (localStorage/cookie)
- ✅ Admin dashboard accessible
- ✅ Can access all admin routes
- ✅ Logout clears token

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 2️⃣ Unminted NFT Management

#### Test Case Admin 2.1: Create Collection
**Steps:**
1. Login as admin
2. Go to "Unminted NFTs" → "Create Collection"
3. Fill:
   - Collection Name: "Summer 2025"
   - Symbol: "SUM25"
   - Description: "Summer NFT collection"
   - Image: Upload image (base64)
   - Network: "Polygon"
4. Click "Create Collection"

**Expected Results:**
- ✅ Collection created in database
- ✅ Image stored/referenced
- ✅ Can see collection in list
- ✅ Success notification
- ✅ Collection ID generated

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case Admin 2.2: Create Unminted NFT
**Steps:**
1. Create collection first (Test Admin 2.1)
2. Go to "Create Unminted NFT"
3. Fill:
   - Name: "Sunset #1"
   - Collection: "Summer 2025"
   - Description: "Beautiful sunset"
   - Image: Upload image
   - Category: "Art"
   - Network: "Polygon"
   - Price: "0.5"
   - Event Start Time: Set to future date/time
   - Is Giveaway: Toggle OFF
4. Click "Create NFT"

**Expected Results:**
- ✅ NFT created with status "pending"
- ✅ Stored in unminted_nfts collection
- ✅ Image uploaded (base64 or URL)
- ✅ Event start time saved
- ✅ Price stored
- ✅ Can view in NFT list
- ✅ Success notification

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case Admin 2.3: Mark NFT as Minted
**Steps:**
1. Create unminted NFT (Test Admin 2.2)
2. Click on NFT in list
3. Click "Mark as Minted"
4. Enter or verify:
   - Token ID (from blockchain)
   - Block number
   - Transaction hash
5. Save

**Expected Results:**
- ✅ NFT status changes to "minted"
- ✅ Token ID recorded
- ✅ Transaction hash stored
- ✅ NFT now available for purchase
- ✅ Users can see in marketplace

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 3️⃣ Giveaway System

#### Test Case Admin 3.1: Create Giveaway NFT
**Steps:**
1. Go to Admin → Giveaway Center
2. Click "Create Giveaway NFT"
3. Fill:
   - NFT details (same as unminted)
   - Toggle "Is Giveaway": ON
   - Set event start time: Future date
   - Set fee subsidy: Optional percentage
4. Save

**Expected Results:**
- ✅ NFT created with isGiveaway: true
- ✅ Event start time stored
- ✅ Fee subsidy percentage saved
- ✅ Appears in Giveaway list

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case Admin 3.2: Offer Giveaway to User
**Steps:**
1. Create giveaway NFT (Test Admin 3.1)
2. Click "Offer to User"
3. Enter user wallet address
4. Click "Offer"

**Expected Results:**
- ✅ Giveaway offered to user wallet
- ✅ Status changes to "offered"
- ✅ User receives notification (if enabled)
- ✅ User can see in "My Giveaways" on profile
- ✅ Database field `offeredTo` set to wallet address

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case Admin 3.3: Revoke Giveaway Offer
**Steps:**
1. Offer giveaway to user (Test Admin 3.2)
2. Click "Revoke Offer"
3. Confirm action

**Expected Results:**
- ✅ Giveaway removed from user's view
- ✅ Status reverted to "pending"
- ✅ `offeredTo` field cleared
- ✅ Can be offered to different user

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

### 4️⃣ Fee Subsidy Management

#### Test Case Admin 4.1: Set Fee Subsidy for User
**Steps:**
1. Go to Admin → Fee Subsidy Dashboard
2. Select or search user
3. Set subsidy percentage: e.g., 50%
4. Apply to:
   - All future purchases
   - Or specific NFT collection
5. Save

**Expected Results:**
- ✅ Fee subsidy stored in database
- ✅ User record updated with subsidy %
- ✅ Can view active subsidies
- ✅ Subsidy applies automatically on purchase

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case Admin 4.2: Apply Fee Subsidy on Purchase
**Steps:**
1. Set up user with 50% fee subsidy (Test Admin 4.1)
2. User adds $100 NFT to cart
3. User proceeds to checkout
4. In cart, verify:
   - Subtotal: $100
   - Service Charge (2.5%): $2.50
   - Subsidy (50% off charge): -$1.25
   - Adjusted Charge: $1.25
   - Total: $101.25
5. Complete purchase

**Expected Results:**
- ✅ Fee subsidy calculation correct
- ✅ User pays discounted amount
- ✅ Discount applied automatically
- ✅ Transaction shows correct final amount
- ✅ Difference absorbed by platform

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

#### Test Case Admin 4.3: Verify Fee Subsidy on Giveaway
**Steps:**
1. Create giveaway NFT with fee subsidy (Test Admin 3.1)
2. Offer to user
3. Wait for event start time
4. User claims giveaway NFT
5. When user lists/sells giveaway NFT:
   - Verify fee subsidy applies
   - Calculate: Normal fee - subsidy = final fee

**Expected Results:**
- ✅ Fee subsidy applied to giveaway NFT
- ✅ User pays reduced fee when listing
- ✅ Percentage correctly subtracted
- ✅ No errors in calculation

**Test Status:** ⏳ Pending  
**Issues Found:** None yet

---

---

## 💰 Payment & Fee Testing

### 1️⃣ Service Charge Calculation

#### Test Case Pay 1.1: Service Charge on $100 NFT
**Scenario:** Platform charge is 2.5%

**Test:**
```
NFT Price: $100.00
Service Charge (2.5%): $2.50
Total User Pays: $102.50

Backend Calculation:
totalAmount = price + (price * 0.025)
totalAmount = 100 + (100 * 0.025)
totalAmount = 100 + 2.5
totalAmount = 102.5 ✅
```

**Verification Points:**
- [ ] Database stores: price=$100, serviceCharge=2.5
- [ ] Frontend displays breakdown
- [ ] MetaMask shows total=$102.50
- [ ] Smart contract receives $102.50
- [ ] Seller gets $100
- [ ] Platform gets $2.50

**Test Status:** ⏳ Pending

---

#### Test Case Pay 1.2: Service Charge on Various Prices
**Test multiple price points:**

| Price | Service Charge (2.5%) | Total | Seller Gets | Platform Gets |
|-------|----------------------|-------|------------|---------------|
| $10 | $0.25 | $10.25 | $10.00 | $0.25 |
| $100 | $2.50 | $102.50 | $100.00 | $2.50 |
| $1,000 | $25.00 | $1,025.00 | $1,000.00 | $25.00 |
| $0.01 | $0.0003 | $0.0103 | $0.01 | $0.0003 |

**Verification:**
- [ ] Each calculation correct
- [ ] No rounding errors
- [ ] Database reflects exact amounts
- [ ] No precision loss (use fixed decimals)

**Test Status:** ⏳ Pending

---

### 2️⃣ Royalty Calculation

#### Test Case Pay 2.1: Royalty on Secondary Sale
**Scenario:**
- Creator lists NFT for $100
- Buyer 1 purchases (pays $102.50 with 2.5% charge)
- Seller gets $100
- Platform gets $2.50
- Buyer 1 resells for $500
- Creator royalty: 10%

**Calculation:**
```
Resale Price: $500
Service Charge (2.5%): $12.50
Royalty (10% of resale): $50.00

Total Split:
- Reseller: $500 - $12.50 - $50 = $437.50
- Creator (Royalty): $50.00
- Platform: $12.50
```

**Verification:**
- [ ] Royalty percentage stored correctly
- [ ] Royalty address is creator's wallet
- [ ] Correct amount transferred
- [ ] All three parties receive funds
- [ ] No amount discrepancies

**Test Status:** ⏳ Pending

---

### 3️⃣ Multiple Fees Combined

#### Test Case Pay 3.1: Service Charge + Royalty + Fee Subsidy
**Scenario:**
- NFT selling price: $100
- Creator royalty: 10%
- Platform charge: 2.5%
- Buyer has 50% fee subsidy

**Calculation:**
```
Sale Price: $100.00

Royalty (10%): $10.00
- Goes to creator

Service Charge (2.5%): $2.50
- After subsidy (50% off): $1.25
- Subsidy covers: $1.25

Seller Receives: $100 - $10 (royalty) = $90.00
Platform Receives: $1.25 (subsidy reduced)
Creator Receives: $10.00 (royalty)
Total: $101.25 ✅
```

**Verification:**
- [ ] Fees calculated in correct order
- [ ] Subsidy applied to platform charge only
- [ ] Royalty deducted from seller amount
- [ ] All parties paid correctly
- [ ] No rounding conflicts

**Test Status:** ⏳ Pending

---

### 4️⃣ Gas Fee Estimation

#### Test Case Pay 4.1: Gas Fee Display
**Steps:**
1. Add NFT to cart
2. Go to checkout
3. Verify gas fee section shows:
   - Network selected
   - Estimated gas units
   - Current gas price (gwei)
   - Gas fee total

**Expected:**
```
Network: Polygon
Gas Price: 50 Gwei
Gas Units: 150,000
Gas Fee: 0.0075 MATIC

Or similar for other networks
```

**Verification:**
- [ ] Gas fee visible before payment
- [ ] Matches network RPC data
- [ ] Updates with network congestion
- [ ] Displayed in correct currency
- [ ] Not included in service charge

**Test Status:** ⏳ Pending

---

#### Test Case Pay 4.2: Gas Fee Variations by Network
**Test on different networks:**

| Network | Token | Estimated Fee | Status |
|---------|-------|---|---|
| Polygon | MATIC | 0.01-0.05 | ⏳ |
| Ethereum | ETH | 0.01-0.1 | ⏳ |
| BSC | BNB | 0.001-0.01 | ⏳ |
| Arbitrum | ETH | 0.001-0.01 | ⏳ |

**Verification:**
- [ ] Fees appropriate to network
- [ ] Update when network changes
- [ ] Calculate based on current gwei
- [ ] No hardcoded values

**Test Status:** ⏳ Pending

---

---

## 🎁 Giveaway System Testing

### 1️⃣ Countdown Timer

#### Test Case Giveaway 1.1: Countdown Timer Display
**Steps:**
1. Admin creates giveaway NFT with event start: 5 minutes from now
2. User views giveaway in "My Giveaways" tab
3. Verify countdown timer shows

**Expected Display:**
```
Days: 00
Hours: 00
Minutes: 04
Seconds: 45
(Updates every second)
```

**Verification:**
- [ ] Timer displays
- [ ] Updates every second
- [ ] Accurate time remaining
- [ ] Format correct (DD:HH:MM:SS)
- [ ] No lag or stuttering

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 1.2: Timer Transitions to "Live Now!"
**Steps:**
1. Set event start time: 2 minutes from now
2. Watch countdown
3. Wait until event time passes
4. Verify "Live Now!" badge appears

**Expected:**
```
Before Event:
[00:00:01:45] ⏱️

At Event Time:
[🟢 LIVE NOW!]
```

**Verification:**
- [ ] Timer counts down correctly
- [ ] Transitions exactly at event time
- [ ] No off-by-one errors
- [ ] Badge displays prominently
- [ ] Claim button becomes active

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 1.3: Multiple Timers Don't Conflict
**Steps:**
1. Create 3 giveaway NFTs with different event times
2. User views all 3 in "My Giveaways"
3. Each has own countdown timer
4. Verify each updates independently

**Expected:**
```
NFT 1: [00:00:05:30] ← Updates every second
NFT 2: [00:00:10:15] ← Updates independently
NFT 3: [LIVE NOW!]    ← Can be claimed
```

**Verification:**
- [ ] Each timer independent
- [ ] No sync issues
- [ ] All accurate
- [ ] Claim buttons only active for "Live"
- [ ] No console warnings

**Test Status:** ⏳ Pending

---

### 2️⃣ Giveaway Claiming

#### Test Case Giveaway 2.1: Claim Before Event Start
**Steps:**
1. User offered giveaway with event start: 1 hour from now
2. View in "My Giveaways"
3. Click "Claim NFT" button

**Expected:**
- ✅ Button disabled before event
- ✅ Or shows "Not available yet" tooltip
- ✅ Cannot submit claim request
- ✅ Error message if forced: "Event has not started"

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 2.2: Claim Exactly at Event Start Time
**Steps:**
1. Giveaway with event start: NOW
2. View in "My Giveaways"
3. Click "Claim NFT"
4. Verify claim succeeds

**Expected:**
- ✅ Claim button active
- ✅ Claim request accepted
- ✅ NFT transferred to user
- ✅ Status changes to "Claimed"
- ✅ Success notification
- ✅ NFT appears in "My NFTs"

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 2.3: Claim After Event Start
**Steps:**
1. Giveaway with event start: 1 hour ago
2. View in "My Giveaways"
3. Click "Claim NFT"
4. Confirm claim succeeds

**Expected:**
- ✅ Button active
- ✅ Claim accepted
- ✅ Status changes to "Claimed"
- ✅ Timestamp recorded: giveawayClaimedAt
- ✅ NFT now owned by user
- ✅ Cannot claim again

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 2.4: Double-Claim Prevention
**Steps:**
1. User claims giveaway successfully
2. Try to claim same giveaway again
3. Verify prevented

**Expected:**
- ✅ Button disabled after claim
- ✅ Status shows "Claimed"
- ✅ Error if forced: "Already claimed"
- ✅ Claim timestamp prevents re-claiming
- ✅ No duplicate NFTs

**Test Status:** ⏳ Pending

---

### 3️⃣ Giveaway Profile Display

#### Test Case Giveaway 3.1: "Giveaway NFTs" Tab
**Steps:**
1. User has been offered giveaways
2. Go to Profile
3. Click "Giveaway NFTs" tab

**Expected:**
- ✅ Tab exists and is clickable
- ✅ Shows grid of offered NFTs
- ✅ Displays image, name, creator
- ✅ Shows countdown timer
- ✅ Status badge visible
- ✅ Claims button visible

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 3.2: Giveaway NFT Card Display
**Steps:**
1. View giveaway NFT card
2. Verify all information displayed

**Expected Card Contains:**
- [ ] NFT Image
- [ ] NFT Name
- [ ] Creator/Collection Name
- [ ] Network badge
- [ ] Countdown timer
- [ ] Status: "Pending" / "Active" / "Claimed"
- [ ] Fee subsidy (if any)
- [ ] Claim button

**Test Status:** ⏳ Pending

---

### 4️⃣ Giveaway Admin View

#### Test Case Giveaway 4.1: Giveaway Center Dashboard
**Steps:**
1. Login as admin
2. Go to Admin → Giveaway Center
3. View all giveaways

**Expected:**
- ✅ List of all giveaway NFTs
- ✅ Filter by status (pending, offered, claimed, minted)
- ✅ Show offered-to wallet
- ✅ Show event start time
- ✅ Show fee subsidy %
- ✅ Search by name/user

**Test Status:** ⏳ Pending

---

#### Test Case Giveaway 4.2: Giveaway Status Transitions
**Verify status flow:**
```
Pending
   ↓ (Admin offers)
Offered
   ↓ (Event starts & User claims)
Claimed
   ↓ (Minted on blockchain)
Minted
```

**Verification:**
- [ ] Status updates automatically
- [ ] Each status shows correct button/actions
- [ ] Cannot skip steps
- [ ] Transitions logged in database

**Test Status:** ⏳ Pending

---

---

## ⚠️ Edge Cases & Error Handling

### 1️⃣ Network & Connectivity

#### Test Case Edge 1.1: Disconnect Wallet Mid-Transaction
**Steps:**
1. Start NFT purchase
2. MetaMask shows transaction
3. Disconnect wallet from website
4. Attempt to complete transaction

**Expected:**
- ✅ MetaMask still shows transaction
- ✅ Can complete if not yet signed
- ✅ Or graceful error if already signed
- ✅ Clear error message
- ✅ Can reconnect and retry

**Test Status:** ⏳ Pending

---

#### Test Case Edge 1.2: Switch Network Mid-Purchase
**Steps:**
1. Start purchase on Polygon
2. In MetaMask, switch to Ethereum
3. Verify application handles it

**Expected:**
- ✅ Application detects network change
- ✅ Error displayed: "Network mismatch"
- ✅ Transaction not sent
- ✅ Option to switch back to correct network
- ✅ MetaMask shows correct network after switch

**Test Status:** ⏳ Pending

---

#### Test Case Edge 1.3: Internet Connection Loss
**Steps:**
1. Doing any transaction
2. Disable internet (or unplug)
3. Resume connection
4. Verify recovery

**Expected:**
- ✅ Error message displayed
- ✅ Partial data not saved
- ✅ Can retry after reconnection
- ✅ No duplicate transactions
- [ ] Offline status indicated

**Test Status:** ⏳ Pending

---

### 2️⃣ Validation & Input Errors

#### Test Case Edge 2.1: Invalid NFT Price
**Steps:**
1. Create NFT
2. Enter price: "-100" or "invalid" or "99999999999"
3. Try to submit

**Expected:**
- ✅ Validation error shown
- ✅ Cannot submit form
- ✅ Error message explains requirement
- ✅ Focus returns to price field
- ✅ Accepts only valid positive numbers

**Test Status:** ⏳ Pending

---

#### Test Case Edge 2.2: Empty Required Fields
**Steps:**
1. Try to create NFT
2. Leave required fields empty:
   - Name
   - Description
   - Image
3. Click "Create"

**Expected:**
- ✅ Validation prevents submission
- ✅ Error message per field
- ✅ Visual indicator (red border)
- ✅ Cannot proceed without fixing
- ✅ Clear guidance on requirements

**Test Status:** ⏳ Pending

---

#### Test Case Edge 2.3: Extremely Large Image Upload
**Steps:**
1. Try to upload 50MB image
2. Or image with wrong format (.txt, .pdf)
3. Attempt to create NFT

**Expected:**
- ✅ Size validation rejects large files
- ✅ Format validation rejects wrong types
- ✅ Error message explains limits
- ✅ File size limit: e.g., "Max 10MB"
- ✅ Allowed formats: "JPG, PNG, GIF, WebP"

**Test Status:** ⏳ Pending

---

### 3️⃣ Race Conditions

#### Test Case Edge 3.1: Double-Click Submit
**Steps:**
1. In checkout form
2. Click "Complete Purchase" twice quickly
3. Verify only one transaction sent

**Expected:**
- ✅ Button disabled after first click
- ✅ Only one MetaMask prompt
- ✅ Only one transaction on blockchain
- ✅ No duplicate charges
- ✅ Loading state prevents re-submission

**Test Status:** ⏳ Pending

---

#### Test Case Edge 3.2: Rapid NFT List Updates
**Steps:**
1. Seller creates NFT
2. Immediately listed for sale
3. Buyer adds to cart before full sync
4. Buyer checks out

**Expected:**
- ✅ Real-time database updates
- ✅ Correct NFT version purchased
- ✅ Metadata consistent
- ✅ No orphaned records

**Test Status:** ⏳ Pending

---

### 4️⃣ Permission & Authorization

#### Test Case Edge 4.1: Non-Owner Can't Edit NFT
**Steps:**
1. User A creates NFT
2. User B (different wallet) tries to edit NFT
3. URL manipulation: manually go to `/nft/edit/{nftId}`

**Expected:**
- ✅ Edit button not visible for User B
- ✅ Manual URL access denied
- ✅ Error: "Unauthorized"
- ✅ Redirects to view-only
- ✅ No data modification possible

**Test Status:** ⏳ Pending

---

#### Test Case Edge 4.2: Non-Admin Can't Access Admin Dashboard
**Steps:**
1. Login as regular user
2. Try to access admin URL: `/admin/dashboard`
3. Or manually set admin-id header

**Expected:**
- ✅ Access denied
- ✅ Redirect to login or home
- ✅ Error message: "Admin access required"
- ✅ Cannot see admin data
- ✅ Cannot perform admin actions

**Test Status:** ⏳ Pending

---

### 5️⃣ Data Consistency

#### Test Case Edge 5.1: NFT Ownership Consistency
**Steps:**
1. User purchases NFT
2. Check blockchain: ownership correct
3. Check database: ownership recorded
4. Check frontend: shows in "My NFTs"
5. Refresh page multiple times

**Expected:**
- ✅ Blockchain shows correct owner
- ✅ Database record accurate
- ✅ Frontend displays consistently
- ✅ No data loss on refresh
- ✅ Sync maintained

**Test Status:** ⏳ Pending

---

#### Test Case Edge 5.2: Cart Quantity Limits
**Steps:**
1. Check if same NFT can be added multiple times
2. Check maximum quantity per NFT
3. Check total cart limit (if any)

**Expected:**
- ✅ Cannot add same NFT twice
- ✅ Or limit to available quantity
- ✅ Cart shows correct count
- ✅ Preventing overbooking

**Test Status:** ⏳ Pending

---

---

## 📊 Performance Testing

### 1️⃣ Page Load Times

#### Test Case Perf 1.1: Homepage Load Time
**Measurement:**
```
Browser DevTools → Network tab

Expected: < 3 seconds (full page)
- HTML: < 500ms
- CSS: < 500ms
- JS: < 1500ms
- Images: < 500ms
```

**Test:** ⏳ Pending

---

#### Test Case Perf 1.2: Marketplace Load Time
**With 100+ NFTs:**
```
Expected: < 2 seconds (pagination)

First batch (20 NFTs): < 1 second
Load more: < 500ms
Search results: < 1 second
```

**Test:** ⏳ Pending

---

### 2️⃣ API Response Times

#### Test Case Perf 2.1: Get User Profile
```bash
curl http://localhost:3000/api/v1/user/users/0x123...

Expected: < 200ms
Database query: < 100ms
Network: < 100ms
```

**Test:** ⏳ Pending

---

#### Test Case Perf 2.2: List NFTs
```bash
curl http://localhost:3000/api/v1/nft/nfts/Polygon

Expected: < 500ms for 100 NFTs
Database query: < 300ms
Serialization: < 100ms
Network: < 100ms
```

**Test:** ⏳ Pending

---

### 3️⃣ Database Performance

#### Test Case Perf 3.1: Database Connection
```
Expected: < 50ms per query
Connection pool size: 10-20
Timeout: 30 seconds
```

**Queries to test:**
- [ ] Create user: < 100ms
- [ ] Get NFT: < 100ms
- [ ] Add to cart: < 50ms
- [ ] Search: < 500ms

**Test:** ⏳ Pending

---

#### Test Case Perf 3.2: Concurrent Requests
**Steps:**
1. Simulate 10 simultaneous users
2. Each user: create account, add to cart, checkout
3. Monitor database

**Expected:**
- ✅ All requests complete
- ✅ No timeouts
- ✅ No connection pool exhaustion
- ✅ No data corruption

**Test:** ⏳ Pending

---

---

## 🔒 Security Testing

### 1️⃣ Authentication

#### Test Case Sec 1.1: Brute Force Login Protection
**Steps:**
1. Try 10 admin logins with wrong password
2. Verify account locks or rate limits

**Expected:**
- ✅ After 5 failed attempts: locked for 15 minutes
- ✅ Or: increasingly longer delays between attempts
- ✅ IP tracking implemented
- ✅ Account recovery option

**Test:** ⏳ Pending

---

#### Test Case Sec 1.2: Token Expiration
**Steps:**
1. Login as user
2. Leave logged in for 24+ hours
3. Try to make API call

**Expected:**
- ✅ Token expires after configured time (e.g., 7 days)
- ✅ API returns 401 Unauthorized
- ✅ User prompted to re-login
- ✅ Refresh token used to extend if available

**Test:** ⏳ Pending

---

### 2️⃣ Smart Contract Security

#### Test Case Sec 2.1: Reentrancy Prevention
**Steps:**
1. Attempt to call withdrawal function recursively
2. Check contract protects against this

**Expected:**
- ✅ Reentrancy guard prevents exploit
- ✅ No double-spending
- ✅ Transaction fails safely
- ✅ Clear error message

**Test:** ⏳ Pending

---

#### Test Case Sec 2.2: Only Owner Can Modify Settings
**Steps:**
1. Non-owner attempts to:
   - Change admin address
   - Modify fee percentage
   - Withdraw funds
2. Verify denied

**Expected:**
- ✅ Only owner can modify
- ✅ Attempts revert
- ✅ Event logs show failed attempts
- ✅ Clear error: "Only owner"

**Test:** ⏳ Pending

---

### 3️⃣ Data Protection

#### Test Case Sec 3.1: Private Keys Never Stored
**Steps:**
1. Examine backend database
2. Check for any stored private keys
3. Check environment variables

**Expected:**
- ✅ NO private keys anywhere
- ✅ Only public addresses stored
- ✅ Private keys in MetaMask only
- ✅ Seed phrases never transmitted

**Test:** ⏳ Pending

---

#### Test Case Sec 3.2: API Key Protection
**Steps:**
1. Check if any API keys exposed in frontend
2. Check localStorage/sessionStorage
3. Check network requests

**Expected:**
- ✅ No sensitive keys in frontend
- ✅ Backend API calls authenticated
- ✅ Keys rotated regularly
- ✅ Hashed when stored

**Test:** ⏳ Pending

---

### 4️⃣ Input Validation

#### Test Case Sec 4.1: SQL Injection Prevention
**Steps:**
1. Search NFT with: `" OR "1"="1`
2. Or in form: `'; DROP TABLE users; --`
3. Verify handled safely

**Expected:**
- ✅ Queries use parameterized statements
- ✅ No SQL errors thrown to client
- ✅ Input sanitized
- ✅ Database intact

**Test:** ⏳ Pending

---

#### Test Case Sec 4.2: XSS Prevention
**Steps:**
1. Create NFT with name: `<script>alert('xss')</script>`
2. Create profile with bio: `<img src=x onerror=alert('xss')>`
3. View rendered content

**Expected:**
- ✅ Script tags escaped
- ✅ No popup/alert executes
- ✅ Rendered as text or HTML entity
- ✅ `<` and `>` escaped to `&lt;` `&gt;`

**Test:** ⏳ Pending

---

---

## 🐛 Issues Found & Resolutions

This section will be filled during testing. Format:

### Issue Template
```
### Issue #[NUMBER]: [Title]
**Status:** 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW

**Found During:** [Test Case Name]
**Date Found:** [Date]
**Severity:** [Critical/High/Medium/Low]

**Description:**
[Detailed description of issue]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Error Message/Screenshot:**
[If applicable]

**Root Cause:**
[If identified]

**Resolution:**
- [ ] Fix identified
- [ ] Fix implemented
- [ ] Fix tested
- [ ] Deployed to production

**Related Files:**
- [List files affected]

---
```

### Issues List (To be populated)
- [ ] No issues found yet (✅ All tests passing)

---

---

## ✅ Test Report Template

Use this template to document test runs:

```markdown
# Test Report - [Date]

## Test Environment
- **Frontend URL:** http://localhost:5173
- **Backend URL:** http://localhost:3000
- **Network:** Polygon Mumbai (testnet)
- **Tester:** [Your Name]
- **Duration:** [Start Time] - [End Time]

## Test Summary
- **Total Tests:** XX
- **Passed:** ✅ XX
- **Failed:** ❌ XX
- **Skipped:** ⏭️ XX
- **Success Rate:** XX%

## Features Tested
- [x] Wallet Connection
- [x] User Registration
- [x] NFT Creation
- [ ] NFT Minting
- [ ] Shopping Cart
- [ ] Checkout
- [ ] Admin Dashboard

## Critical Issues
- [ ] None found
- [ ] Issue #1: [Description]

## High Priority Issues
- [ ] None found
- [ ] Issue #2: [Description]

## Medium Priority Issues
- [ ] None found

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Conclusion
[Overall assessment of platform readiness]

**Status:** 🟢 READY FOR DEPLOYMENT / 🟡 NEEDS FIXES / 🔴 NOT READY

---
```

---

## 📋 Checklist for Complete Platform Testing

### Pre-Launch Verification
- [ ] Backend API all endpoints responding (200 or 401, not 404)
- [ ] Frontend builds without errors
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Smart contracts deployed and verified
- [ ] Gas prices reasonable on test network

### Core Functionality
- [ ] Wallet connection works
- [ ] User registration completes
- [ ] NFT creation successful
- [ ] NFT minting works
- [ ] Shopping cart functions
- [ ] Checkout process complete
- [ ] Payment processing works

### Admin Features
- [ ] Admin login functional
- [ ] Dashboard displays correct stats
- [ ] Unminted NFT creation works
- [ ] Giveaway system operational
- [ ] Fee subsidy settings apply
- [ ] User management accessible

### Advanced Features
- [ ] Countdown timers accurate
- [ ] Giveaway claiming works
- [ ] Fee calculations correct
- [ ] Royalties distribute properly
- [ ] Verification system works
- [ ] Gas fees display correctly

### Quality Assurance
- [ ] No console errors
- [ ] No unhandled promise rejections
- [ ] No memory leaks (monitored)
- [ ] No duplicate transactions
- [ ] All images load properly
- [ ] Responsive on mobile

### Security
- [ ] No private keys exposed
- [ ] Input validation working
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Admin protected endpoints
- [ ] User data protected

### Performance
- [ ] Pages load < 3 seconds
- [ ] API responses < 500ms
- [ ] No lag on interactions
- [ ] Smooth animations
- [ ] Efficient database queries
- [ ] Proper caching implemented

### Deployment Ready
- [ ] All tests passing
- [ ] No critical issues
- [ ] Documentation complete
- [ ] Deployment scripts prepared
- [ ] Rollback plan documented
- [ ] Monitoring configured

---

## 🚀 Next Steps After Testing

1. **Bug Fixes:** Fix any issues found during testing
2. **Regression Testing:** Re-test fixed features
3. **Load Testing:** Test with simulated user load
4. **User Acceptance Testing:** Real user validation
5. **Staging Deployment:** Deploy to staging environment
6. **Final Verification:** Test on staging
7. **Production Deployment:** Deploy to live
8. **Post-Launch Monitoring:** Monitor for issues

---

## 📞 Support & Escalation

### If Critical Issue Found
1. **Stop testing** - Don't continue with dependent tests
2. **Document thoroughly** - Screenshots, error messages, steps
3. **Create Issue** - Add to Issues Found section
4. **Notify team** - Alert via communication channel
5. **Fix & re-test** - Implement fix and re-run tests

### Test Failure Scenarios
- **Wallet won't connect:** Check MetaMask, try different browser
- **NFT won't create:** Check smart contract, gas fees, image format
- **Checkout fails:** Check network selection, wallet balance
- **Admin won't login:** Check credentials, database connection

---

**Document Version:** 1.0  
**Last Updated:** December 17, 2025  
**Next Review:** After first full test run

