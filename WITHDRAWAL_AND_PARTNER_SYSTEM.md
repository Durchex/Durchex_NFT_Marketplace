# Withdrawal & Partner Management System

## Overview

The Durchex NFT Marketplace now includes a comprehensive **Earnings Management** and **Profit Sharing** system that allows users to:

1. **Track Sales Earnings**: View earnings from NFT sales across multiple networks
2. **Request Withdrawals**: Withdraw earned funds to designated wallet addresses
3. **Manage Partners**: Add collaborators and specify profit-sharing percentages
4. **Monitor Payments**: Track earnings distribution to partners
5. **View Analytics**: Detailed breakdowns of earnings by network and time period

---

## Features

### 1. Flexible Payment Collection

Instead of requiring users to have large wallet balances, the system now:
- **Collects only what's needed** for each transaction
- **Calculates precise gas costs** based on network conditions
- **Uses dynamic balance checking** to ensure sufficient funds
- **Provides 120% safety buffer** for gas price fluctuations
- **Supports multiple networks** (Ethereum, Polygon, Mumbai, Base)

**Benefits:**
- Lower barrier to entry for new creators
- More efficient gas usage
- Better user experience with transparent fee calculations

### 2. User Earnings Dashboard

**Features:**
- View total earnings across all networks
- Per-network earnings breakdown
- Transaction history with status tracking
- Real-time balance updates
- Earnings growth metrics

**Data Tracked:**
- Sale price (gross)
- Platform fees deducted
- Network gas costs
- Final creator earnings
- Timestamp and transaction hash

### 3. Withdrawal System

**Withdrawal Process:**
1. User requests withdrawal amount
2. System validates:
   - Sufficient balance available
   - Amount meets minimum threshold
   - Wallet address is valid
3. Withdrawal enters "pending" status
4. Admin processes withdrawal (off-chain or on-chain)
5. Funds transferred to user's wallet

**Withdrawal Types:**
- `sales_earnings` - Revenue from NFT sales
- `partner_share` - Earnings from being a partner
- `giveaway_rewards` - Rewards from giveaways
- `referral_bonus` - Referral program earnings
- `subsidy_refund` - Fee subsidy refunds

**Status Tracking:**
- `pending` - Awaiting processing
- `processing` - Admin is processing
- `confirmed` - Successfully transferred
- `failed` - Transaction failed
- `cancelled` - User or admin cancelled

### 4. Partner Management System

**Add Partners:**
- Specify wallet address
- Set profit-sharing percentage (0-100%)
- Define scope (all NFTs, specific collection, or specific NFTs)
- Select applicable networks
- Add partnership description

**Partnership Verification:**
- Partners receive verification codes
- Must verify before partnership becomes active
- Email/wallet notifications supported
- Prevents unauthorized partnerships

**Partner Earnings:**
- Automatic calculation from each sale
- Percentage-based distribution
- Supports multiple partners per creator
- Each sale automatically distributes to all active partners
- Real-time balance tracking

**Partner Features:**
- View all partnerships (as owner or partner)
- Monitor pending balance
- Track total earnings
- Request withdrawals
- Pause/deactivate partnerships

### 5. Profit Distribution

**Multi-Partner Support:**
When a creator has multiple partners:

```
Sale Price: 1.0 ETH
└─ Platform Fee (2.5%): 0.025 ETH
└─ Creator Base: 0.975 ETH
   ├─ Partner A (20%): 0.195 ETH
   ├─ Partner B (15%): 0.146 ETH
   └─ Creator (65%): 0.634 ETH
```

**Smart Distribution:**
- Prevents double-counting of percentages
- Calculates in order to minimize rounding errors
- Creator receives remainder
- All amounts tracked separately

---

## Backend Models

### TransactionModel
Tracks all NFT transactions (sales, transfers, mints, etc.)

```javascript
{
  transactionHash, blockNumber,
  nftItemId, nftTokenId, nftName,
  from, to, // wallet addresses
  salePrice, salePriceUSD,
  gasUsed, gasPrice, totalGasCost,
  transactionType, status,
  royaltyPaid, platformFee,
  confirmedAt
}
```

### PartnerWalletModel
Manages profit-sharing partnerships

```javascript
{
  ownerWallet, partnerWallet,
  ownerName, partnerName, partnerEmail,
  profitShare: { percentage, description },
  scope, appliedTo,
  totalEarned, totalWithdrawn, pendingBalance,
  status, verificationCode,
  agreementTerms, startDate, endDate
}
```

### WithdrawalModel
Tracks user withdrawal requests and processing

```javascript
{
  withdrawalId, userWallet, targetWallet,
  amount, amountUSD,
  network, transactionHash,
  withdrawalType, status,
  platformFee, networkFee,
  failureReason, metadata,
  requestedAt, processedAt, confirmedAt
}
```

---

## Frontend Pages

### WithdrawalSystem.jsx
Main earnings and withdrawal management interface

**Tabs:**
1. **My Earnings** - View total and per-network earnings with breakdown
2. **Withdrawals** - Track withdrawal history with status
3. **Partner Earnings** - View earnings from partnerships

**Components:**
- EarningsTab - Shows earnings summary and cards
- WithdrawalsTab - Lists recent withdrawals
- PartnersTab - Shows partner earnings
- WithdrawalModal - Request new withdrawal

### PartnerManagement.jsx
Manage collaborators and profit-sharing

**Tabs:**
1. **My Partners** - Add/manage partners as creator
2. **My Agreements** - View partnerships where you're a partner

**Features:**
- Add new partners with verification
- Edit partnership terms
- Deactivate partnerships
- View per-partner earnings
- Track pending balances

---

## API Endpoints

### Withdrawal Routes (`/api/v1/withdrawals`)

```
POST /request
  Request a new withdrawal
  Body: { userWallet, targetWallet, amount, network, withdrawalType }

GET /history/:userWallet
  Get user's withdrawal history
  Query: ?status=pending&limit=50&skip=0

GET /earnings/:userWallet
  Get complete earnings dashboard
  Response: { personalEarnings, withdrawals, partnerEarnings }

POST /admin/process-pending
  Process all pending withdrawals (admin only)
```

### Partner Routes (`/api/v1/partners`)

```
POST /add
  Add a new partner
  Body: { ownerWallet, partnerWallet, partnerName, ... }

POST /verify
  Verify partnership (by partner)
  Body: { ownerWallet, partnerWallet, verificationCode }

GET /owner/:ownerWallet
  Get all partners (as owner)
  Query: ?status=active

GET /agreements/:partnerWallet
  Get all partnerships (as partner)
  Query: ?status=active

PATCH /owner/:ownerWallet/:partnerWallet
  Update partnership details
  Body: { profitShare, network, ... }

PATCH /deactivate/:ownerWallet/:partnerWallet
  Deactivate partnership

GET /earnings/:ownerWallet/:partnerWallet
  Get partner's earnings
```

---

## Frontend Services

### withdrawalAPI
```javascript
withdrawalAPI.requestWithdrawal(data)
withdrawalAPI.getWithdrawalHistory(wallet, params)
withdrawalAPI.getEarningsDashboard(wallet)
withdrawalAPI.getUserAvailableBalance(wallet, network)
```

### partnerWalletAPI
```javascript
partnerWalletAPI.addPartner(data)
partnerWalletAPI.verifyPartnership(data)
partnerWalletAPI.getOwnerPartners(wallet)
partnerWalletAPI.getPartnerAgreements(wallet)
partnerWalletAPI.updatePartnership(owner, partner, data)
partnerWalletAPI.deactivatePartnership(owner, partner)
```

### earningsService
```javascript
earningsService.calculateNetEarnings(price, fees, royalty)
earningsService.calculatePartnerShare(amount, percentage)
earningsService.calculateMultiPartnerDistribution(amount, partners)
earningsService.validateWithdrawal(amount, balance, minimum)
earningsService.calculateWithdrawalFee(amount, percentage)
```

---

## Workflow Examples

### Example 1: Creator Sells NFT with Partner

```
1. Creator lists NFT for 1.0 ETH
2. Buyer purchases NFT

3. Transaction recorded:
   - Gross: 1.0 ETH
   - Platform fee (2.5%): 0.025 ETH
   - Creator base: 0.975 ETH

4. Partner shares calculated:
   - Designer partner (30%): 0.2925 ETH
   - Creator remaining (70%): 0.6825 ETH

5. Both can track pending balances
6. Both can request withdrawals independently
```

### Example 2: User Requests Withdrawal

```
1. User navigates to "My Earnings"
2. Checks available balance
3. Clicks "Withdraw Earnings"
4. Enters:
   - Target wallet (or use default)
   - Amount (0.5 ETH)
   - Network (Polygon)
5. Submits request
6. Withdrawal enters "pending" status
7. Admin processes withdrawal
8. User receives funds
9. Status updates to "confirmed"
```

### Example 3: Creator Adds Partner

```
1. Creator goes to "Partner Management"
2. Clicks "Add Partner"
3. Fills form:
   - Partner wallet: 0x...
   - Partner name: John Designer
   - Share %: 25%
   - Description: Artwork creation
   - Network: All
4. Submits request
5. Partner receives verification code
6. Partner verifies via email/wallet
7. Partnership becomes active
8. Future sales automatically distribute to partner
```

---

## Configuration

### Minimum Withdrawal
- Default: 0.1 ETH (configurable per network)
- Prevents frequent small withdrawals
- Reduces transaction costs

### Withdrawal Fees
- Platform fee: 2.5% (configurable)
- Network gas fees: Dynamic (calculated per transaction)
- Both displayed to user before confirmation

### Partner Share Limits
- Minimum: 0%
- Maximum: 100%
- Multiple partners: Sum should not exceed 100%
- System prevents over-allocation

---

## Security Considerations

1. **Wallet Verification**
   - Ethers.js validates all addresses
   - Prevents typos in wallet addresses
   - Confirmation required for changes

2. **Partner Verification**
   - Verification codes are random
   - One-time use only
   - Prevents unauthorized partnerships

3. **Balance Validation**
   - Real-time balance checks
   - Prevents negative balances
   - Accounts for pending withdrawals

4. **Transaction Immutability**
   - Transactions recorded on blockchain
   - Cannot be altered after confirmation
   - Full audit trail maintained

---

## Future Enhancements

1. **Automated Withdrawals**
   - Auto-withdraw when threshold reached
   - Scheduled withdrawals
   - Recurring payments

2. **Tax Reporting**
   - Generate tax documents
   - Export earnings reports
   - YTD summaries

3. **Advanced Analytics**
   - Earnings predictions
   - Partner performance metrics
   - Network comparison analytics

4. **Fiat Integration**
   - Withdraw to bank account
   - Credit card integration
   - Multi-currency support

5. **Smart Contract Integration**
   - Trustless withdrawals
   - Automated profit distribution
   - Multi-sig wallets

---

## Troubleshooting

**Issue:** Withdrawal request fails with "Insufficient balance"
- **Solution:** Check pending withdrawals, wait for confirmations

**Issue:** Partner verification not received
- **Solution:** Check email/wallet notifications, resend code

**Issue:** Earnings not updating
- **Solution:** Refresh page, check network status, ensure transactions confirmed

**Issue:** Partner percentage limits exceeded
- **Solution:** Reduce percentages so total ≤ 100%

---

## Support

For issues or questions:
1. Check backend logs: `pm2 logs`
2. Verify MongoDB connection: `npm run test-mongodb`
3. Test API endpoints: `npm run test-api`
4. Contact: support@durchex.com

