# System Architecture Diagram

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DURCHEX NFT MARKETPLACE                          │
│                                                                          │
│  ┌──────────────────────────────┐      ┌─────────────────────────────┐  │
│  │      FRONTEND (React)         │      │    BACKEND (Node.js)        │  │
│  │                              │      │                              │  │
│  │  ┌──────────────────────┐   │      │  ┌──────────────────────┐   │  │
│  │  │  WithdrawalSystem    │   │      │  │  withdrawalRoutes    │   │  │
│  │  │  - Earnings Tab      │   │      │  │  - POST /request    │   │  │
│  │  │  - Withdrawals Tab   │───┼──────┼──┤  - GET /history     │   │  │
│  │  │  - Partners Tab      │   │      │  │  - GET /earnings    │   │  │
│  │  └──────────────────────┘   │      │  └──────────────────────┘   │  │
│  │                              │      │           ↓                  │  │
│  │  ┌──────────────────────┐   │      │  ┌──────────────────────┐   │  │
│  │  │ PartnerManagement    │   │      │  │ withdrawalController │   │  │
│  │  │ - My Partners Tab    │   │      │  │ - calculateEarnings  │   │  │
│  │  │ - Agreements Tab     │───┼──────┼──┤ - getAvailBalance   │   │  │
│  │  │ - Add/Edit Partner   │   │      │  │ - requestWithdrawal │   │  │
│  │  └──────────────────────┘   │      │  └──────────────────────┘   │  │
│  │                              │      │           ↓                  │  │
│  │  ┌──────────────────────┐   │      │  ┌──────────────────────┐   │  │
│  │  │ WithdrawalAdmin      │   │      │  │ partnerWalletRoutes  │   │  │
│  │  │ - List Withdrawals   │   │      │  │ - POST /add          │   │  │
│  │  │ - Filter by Status   │───┼──────┼──┤ - POST /verify       │   │  │
│  │  │ - Approve/Reject     │   │      │  │ - GET /owner         │   │  │
│  │  │ - Bulk Process       │   │      │  │ - PATCH /update      │   │  │
│  │  └──────────────────────┘   │      │  └──────────────────────┘   │  │
│  │           ↓                   │      │           ↓                  │  │
│  │  ┌──────────────────────┐   │      │  ┌──────────────────────┐   │  │
│  │  │  withdrawalAPI       │   │      │  │ partnerWalletCtrlr   │   │  │
│  │  │  (Service Layer)     │───┼──────┼──┤ - addPartnerWallet   │   │  │
│  │  │                      │   │      │  │ - verifyPartnership  │   │  │
│  │  │  earningsService     │   │      │  │ - getOwnerPartners   │   │  │
│  │  │  (Math Utils)        │   │      │  │ - updateDetails      │   │  │
│  │  └──────────────────────┘   │      │  └──────────────────────┘   │  │
│  │           ↓                   │      │           ↓                  │  │
│  │  ┌──────────────────────┐   │      │  ┌──────────────────────┐   │  │
│  │  │  axios (HTTP Client) │   │      │  │ withdrawalAdminCtrlr │   │  │
│  │  └──────────────────────┘   │      │  │ - getAllWithdrawals  │   │  │
│  │                              │      │  │ - approveWithdrawal  │   │  │
│  └──────────────────────────────┘      │  │ - rejectWithdrawal   │   │  │
│                                        │  │ - getAnalytics       │   │  │
│                                        │  └──────────────────────┘   │  │
│                                        │           ↓                  │  │
│                                        │  ┌──────────────────────┐   │  │
│                                        │  │ withdrawalAdminRoutes│   │  │
│                                        │  │ - GET /withdrawals   │   │  │
│                                        │  │ - POST /approve      │   │  │
│                                        │  │ - POST /reject       │   │  │
│                                        │  └──────────────────────┘   │  │
│                                        └──────────────────────────────┘  │
│                                                ↓                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    MONGODB DATABASES                             │   │
│  │                                                                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │ transactionModel │  │ partnerWallets   │  │ withdrawals  │  │   │
│  │  │                  │  │                  │  │              │  │   │
│  │  │ - from           │  │ - ownerWallet    │  │ - withdrawId │  │   │
│  │  │ - to             │  │ - partnerWallet  │  │ - userWallet │  │   │
│  │  │ - salePrice      │  │ - percentage     │  │ - amount     │  │   │
│  │  │ - platformFee    │  │ - totalEarned    │  │ - status     │  │   │
│  │  │ - network        │  │ - status         │  │ - network    │  │   │
│  │  │ - status         │  │ - verifyCode     │  │ - txHash     │  │   │
│  │  │                  │  │                  │  │              │  │   │
│  │  │ Indexes:         │  │ Indexes:         │  │ Indexes:     │  │   │
│  │  │ - from           │  │ - ownerWallet    │  │ - status     │  │   │
│  │  │ - to             │  │ - partnerWallet  │  │ - userWallet │  │   │
│  │  │ - network        │  │                  │  │ - network    │  │   │
│  │  │ - createdAt      │  │                  │  │ - createdAt  │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘  │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Withdrawal Process

```
User Initiates Withdrawal
        ↓
┌─────────────────────────────────────────────────────┐
│  Frontend: WithdrawalSystem Component              │
│  - User enters amount and target wallet            │
│  - Click "Request Withdrawal"                      │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  withdrawalAPI.requestWithdrawal()                 │
│  - Validates input                                 │
│  - Calls backend /api/v1/withdrawals/request       │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Backend: withdrawalController.requestWithdrawal() │
│  - Validates wallet addresses                      │
│  - Checks user has sufficient balance              │
│  - Checks minimum withdrawal threshold             │
│  - Creates withdrawal record in DB (status:pending)│
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  MongoDB: withdrawalModel                          │
│  - Creates new document with status: "pending"     │
│  - Generates unique withdrawalId                   │
│  - Records timestamp                               │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Return Response to Frontend                       │
│  - withdrawalId                                    │
│  - status: "pending"                               │
│  - amount                                          │
│  - timestamp                                       │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Admin Reviews Withdrawal                          │
│  - Opens WithdrawalAdmin Dashboard                │
│  - Views pending withdrawals                       │
│  - Clicks Approve or Reject                        │
└──────────────────────┬──────────────────────────────┘
                       ↓
                  APPROVAL PATH
                       ↓
┌─────────────────────────────────────────────────────┐
│  Admin: withdrawalAdminController.approveWithdrawal│
│  - Validates withdrawal exists                     │
│  - Requires transaction hash from blockchain       │
│  - Updates status to "confirmed"                   │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  MongoDB Update                                    │
│  - withdrawal.status = "confirmed"                 │
│  - withdrawal.transactionHash = hash               │
│  - withdrawal.confirmedAt = timestamp              │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  If Partner Share: Update Partner Wallet           │
│  - partnerWallet.totalWithdrawn += amount          │
│  - partnerWallet.pendingBalance -= amount          │
└──────────────────────┬──────────────────────────────┘
                       ↓
             WITHDRAWAL COMPLETE ✅
```

## Data Flow: Partner Profit Sharing

```
Creator Adds Partner
        ↓
┌─────────────────────────────────────────────────────┐
│  Frontend: PartnerManagement Component             │
│  - Enter partner wallet address                    │
│  - Enter profit share percentage (0-100%)          │
│  - Click "Add Partner"                             │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  partnerWalletAPI.addPartnerWallet()               │
│  - Validates both wallet addresses                 │
│  - Validates percentage (0-100)                    │
│  - Calls backend /api/v1/partners/add              │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Backend: partnerWalletController.addPartnerWallet │
│  - Generates 6-digit verification code             │
│  - Checks no duplicate partnership exists          │
│  - Creates partnership record (status: "pending")  │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  MongoDB: partnerWalletModel                       │
│  - Creates new partnership document                │
│  - Stores verification code                        │
│  - Status: "pending" (awaiting partner verification)
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Return Verification Code to Creator               │
│  - Code: "ABC123" (6-digit)                        │
│  - Message: "Send this to your partner"            │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Creator Sends Code to Partner (Email/Manual)      │
│  "To receive 25% of my NFT sale profits,           │
│   verify partnership with code: ABC123"            │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Partner Verifies Code                             │
│  - Opens PartnerManagement Component               │
│  - Enters verification code                        │
│  - Clicks "Verify Partnership"                     │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  partnerWalletController.verifyPartnership()       │
│  - Validates code matches database                 │
│  - Updates status to "active"                      │
│  - Records partner acceptance timestamp            │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  MongoDB Update                                    │
│  - partnership.status = "active"                   │
│  - partnership.verifiedAt = timestamp              │
│  - partnership.verificationCode = deleted          │
└──────────────────────┬──────────────────────────────┘
                       ↓
             PARTNERSHIP ACTIVE ✅
                       ↓
        (On Creator's Next Withdrawal)
                       ↓
┌─────────────────────────────────────────────────────┐
│  Creator Requests Withdrawal                       │
│  - Specifies amount to withdraw                    │
│  - System finds all active partnerships            │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Automatic Profit Distribution                     │
│  - Partner A (20%): 20 ETH                         │
│  - Partner B (15%): 15 ETH                         │
│  - Creator (65%): 65 ETH                           │
│  - (remainder always goes to creator)              │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Create Withdrawal Records for Each                │
│  - withdrawalModel: 3 records created              │
│  - Each with appropriate amount and type           │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Update Partner Balances                           │
│  - partnerWallet.totalEarned += share              │
│  - partnerWallet.pendingBalance += share           │
└──────────────────────┬──────────────────────────────┘
                       ↓
             PROFIT DISTRIBUTED ✅
```

## Database Schema Relationships

```
┌────────────────────────────────────┐
│      transactionModel              │
│  (NFT Sales Tracking)              │
├────────────────────────────────────┤
│ • transactionHash (String)         │
│ • blockNumber (Number)             │
│ • nftItemId (ObjectId)             │
│ • from (String) ─────────────────┐ │
│ • to (String) ─────────┐          │ │
│ • salePrice (Number)   │          │ │
│ • platformFee (Number) │          │ │
│ • network (String)     │          │ │
│ • status (String)      │          │ │
│ • createdAt (Date)     │          │ │
│                        │          │ │
│ Index: from, to, network, createdAt
└────────────────────────────────────┘
         │                │
         ▼                ▼
┌────────────────────────────────────┐
│    partnerWalletModel              │
│  (Partnership Management)          │
├────────────────────────────────────┤
│ • ownerWallet (String) ◀───────────┤
│ • partnerWallet (String) ◀─────────┤
│ • profitShare:                     │
│   - percentage (Number: 0-100)     │
│ • scope (String)                   │
│ • totalEarned (Number)             │
│ • totalWithdrawn (Number)          │
│ • pendingBalance (Number)          │
│ • status (String)                  │
│ • verificationCode (String)        │
│ • createdAt (Date)                 │
│                                    │
│ Unique: (ownerWallet, partnerWallet)
└────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│      withdrawalModel               │
│   (Withdrawal Management)          │
├────────────────────────────────────┤
│ • withdrawalId (String)            │
│ • userWallet (String)              │
│ • targetWallet (String)            │
│ • amount (BigInt)                  │
│ • network (String)                 │
│ • transactionHash (String)         │
│ • status (String)                  │
│ • withdrawalType (String)          │
│ • createdAt (Date)                 │
│ • processedAt (Date)               │
│ • confirmedAt (Date)               │
│                                    │
│ Statuses: pending, processing,     │
│          confirmed, failed, cancelled
│                                    │
│ Types: sales_earnings, partner_share,
│        giveaway_rewards, referral_bonus,
│        subsidy_refund              │
│                                    │
│ Indexes: status, userWallet, network,
│          createdAt                 │
└────────────────────────────────────┘
```

## Component Hierarchy

```
App (Root)
│
├─ WithdrawalSystem (Page)
│  ├─ EarningsTab (Component)
│  │  ├─ EarningsSummaryCard
│  │  ├─ NetworkBreakdownCard
│  │  └─ FeeBreakdownCard
│  │
│  ├─ WithdrawalsTab (Component)
│  │  ├─ WithdrawalHistoryList
│  │  │  └─ WithdrawalHistoryItem (repeated)
│  │  └─ WithdrawalFilters
│  │
│  ├─ PartnersTab (Component)
│  │  ├─ PartnerEarningsCard (repeated)
│  │  └─ PartnerStatsCard
│  │
│  └─ WithdrawalModal (Modal Component)
│     ├─ WithdrawalForm
│     ├─ Preview
│     └─ ConfirmationUI
│
├─ PartnerManagement (Page)
│  ├─ OwnedPartnersTab (Component)
│  │  ├─ PartnerGrid
│  │  │  └─ PartnerCard (repeated)
│  │  │     ├─ EditButton
│  │  │     └─ DeactivateButton
│  │  └─ AddPartnerButton
│  │
│  ├─ PartnerAgreementsTab (Component)
│  │  └─ AgreementGrid
│  │     └─ AgreementCard (repeated)
│  │        └─ ViewDetailsButton
│  │
│  └─ PartnerModal (Modal Component)
│     ├─ AddPartnerForm
│     ├─ EditPartnerForm
│     ├─ VerificationForm
│     └─ ConfirmationUI
│
└─ AdminDashboard (Page)
   │
   └─ WithdrawalAdmin (Component)
      ├─ StatusTabs (Filters)
      │  ├─ PendingTab
      │  ├─ ProcessingTab
      │  ├─ ConfirmedTab
      │  └─ FailedTab
      │
      ├─ StatsCards
      │  ├─ TotalPendingCard
      │  ├─ CountCard
      │  └─ SelectedCard
      │
      ├─ WithdrawalTable
      │  ├─ TableHeader (with SelectAll)
      │  └─ TableRows (WithdrawalRow)
      │     ├─ Checkbox
      │     ├─ WithdrawalInfo
      │     ├─ StatusBadge
      │     └─ ActionButtons
      │
      └─ BulkActionBar
         ├─ ApproveButton
         └─ ClearButton
```

## State Management Flow

```
Frontend Application State
├─ User State
│  ├─ userWallet (current user's address)
│  ├─ userRole (admin, creator, user)
│  └─ isAuthenticated (boolean)
│
├─ Withdrawal State
│  ├─ earnings (Object)
│  │  ├─ total (BigInt)
│  │  ├─ byNetwork (Object)
│  │  └─ pending (BigInt)
│  │
│  ├─ withdrawals (Array)
│  │  └─ [
│  │      {
│  │        withdrawalId, userWallet, amount,
│  │        status, network, createdAt, ...
│  │      }
│  │    ]
│  │
│  └─ withdrawalForm (Object)
│     ├─ amount
│     ├─ targetWallet
│     ├─ network
│     └─ isSubmitting
│
├─ Partner State
│  ├─ ownedPartners (Array)
│  │  └─ [
│  │      {
│  │        partnerWallet, percentage,
│  │        totalEarned, status, ...
│  │      }
│  │    ]
│  │
│  ├─ partnerships (Array)
│  │  └─ [
│  │      {
│  │        ownerWallet, percentage,
│  │        totalEarned, status, ...
│  │      }
│  │    ]
│  │
│  └─ partnerForm (Object)
│     ├─ partnerWallet
│     ├─ percentage
│     ├─ scope
│     └─ isSubmitting
│
└─ Admin State
   ├─ withdrawals (Array)
   ├─ filter (String: pending/processing/confirmed/failed)
   ├─ selectedWithdrawals (Set)
   ├─ isProcessing (boolean)
   └─ analytics (Object)
```

## Security & Validation Flow

```
Request comes in
        ↓
┌─────────────────────────────────────┐
│  Route Handler                      │
│  - Check authentication             │
│  - Check authorization              │
│  - Extract user from JWT token      │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Input Validation                   │
│  - Wallet format validation         │
│  - Amount > 0 check                 │
│  - Network support check            │
│  - Percentage 0-100 check           │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Business Logic Validation          │
│  - Check user has funds             │
│  - Check minimum threshold          │
│  - Check no duplicates              │
│  - Check partnerships valid         │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Database Operations                │
│  - Create/Update records            │
│  - Maintain data integrity          │
│  - Use transactions                 │
└────────┬────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Response Validation                │
│  - Filter sensitive data            │
│  - Format response correctly        │
│  - Include error details if failed  │
└────────┬────────────────────────────┘
         ↓
         ✅ Response sent to client
```

---

This architecture diagram provides a complete visual overview of how the withdrawal and partner profit-sharing system integrates with the Durchex NFT Marketplace.
