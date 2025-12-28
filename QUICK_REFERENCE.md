# Quick Reference Guide - Withdrawal & Partner Profit System

## 🚀 Quick Start (5 Minutes)

### Backend Setup
```bash
# 1. In backend/server.js, add these imports:
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import partnerWalletRoutes from './routes/partnerWalletRoutes.js';
import withdrawalAdminRoutes from './routes/withdrawalAdminRoutes.js';

# 2. Register the routes:
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/partners', partnerWalletRoutes);
app.use('/api/v1/admin', withdrawalAdminRoutes);
```

### Frontend Setup
```bash
# 1. Add routes to your router (App.jsx or router.js):
<Route path="/withdrawals" element={<WithdrawalSystem />} />
<Route path="/partners" element={<PartnerManagement />} />
<Route path="/admin/dashboard" element={<AdminDashboard />} />

# 2. Add navigation links:
<NavLink to="/withdrawals">Earnings & Withdrawals</NavLink>
<NavLink to="/partners">Partner Management</NavLink>
{isAdmin && <NavLink to="/admin/dashboard">Admin</NavLink>}
```

## 📋 Key Files at a Glance

### Models
- `backend/models/transactionModel.js` - NFT transaction tracking
- `backend/models/partnerWalletModel.js` - Partnership management
- `backend/models/withdrawalModel.js` - Withdrawal requests

### Controllers
- `backend/controllers/withdrawalController.js` - User withdrawals
- `backend/controllers/partnerWalletController.js` - Partner management
- `backend/controllers/withdrawalAdminController.js` - Admin operations

### Frontend
- `frontend/src/pages/WithdrawalSystem.jsx` - User earnings dashboard
- `frontend/src/pages/PartnerManagement.jsx` - Partnership UI
- `frontend/src/pages/admin/WithdrawalAdmin.jsx` - Admin dashboard

### Services
- `frontend/src/services/withdrawalAPI.js` - API wrapper
- `frontend/src/services/earningsService.js` - Math utilities

### Routes
- `backend/routes/withdrawalRoutes.js` - User endpoints
- `backend/routes/partnerWalletRoutes.js` - Partner endpoints
- `backend/routes/withdrawalAdminRoutes.js` - Admin endpoints

## 🔌 API Endpoints Quick Reference

### Withdrawals
```
POST   /api/v1/withdrawals/request          - Create withdrawal
GET    /api/v1/withdrawals/history/:wallet  - Get history
GET    /api/v1/withdrawals/earnings/:wallet - Get dashboard
```

### Partners
```
POST   /api/v1/partners/add                 - Add partner
POST   /api/v1/partners/verify              - Verify partnership
GET    /api/v1/partners/owner/:wallet       - List owned
GET    /api/v1/partners/agreements/:wallet  - List agreements
PATCH  /api/v1/partners/update/:id          - Update
PATCH  /api/v1/partners/deactivate/:id      - Deactivate
```

### Admin
```
GET    /api/v1/admin/withdrawals            - List withdrawals
GET    /api/v1/admin/withdrawals/analytics  - Get analytics
POST   /api/v1/admin/withdrawals/approve    - Approve
POST   /api/v1/admin/withdrawals/reject     - Reject
```

## 💡 Common Code Snippets

### Get User Earnings
```javascript
const { data } = await withdrawalAPI.getEarningsDashboard(userWallet);
console.log(data.totalEarnings);      // Total ETH earned
console.log(data.byNetwork);          // Breakdown per network
console.log(data.pendingWithdrawals); // Pending requests
```

### Request Withdrawal
```javascript
const { data } = await withdrawalAPI.requestWithdrawal({
  userWallet: '0x123abc...',
  targetWallet: '0x456def...',
  amount: '1000000000000000000', // 1 ETH in wei
  network: 'ethereum'
});
console.log(data.withdrawalId); // Use for tracking
```

### Add Partner
```javascript
const { data } = await withdrawalAPI.addPartnerWallet({
  ownerWallet: '0x123abc...',
  partnerWallet: '0x789ghi...',
  profitShare: 25, // 25% split
  scope: 'all_nfts'
});
console.log(data.verificationCode); // Send to partner
```

### Verify Partnership
```javascript
const { data } = await withdrawalAPI.verifyPartnership(verificationCode);
console.log(data.status); // Should be 'active'
```

### Get Partner List
```javascript
const { data } = await withdrawalAPI.getOwnerPartners(ownerWallet);
data.forEach(partner => {
  console.log(partner.partnerWallet, partner.profitShare.percentage + '%');
});
```

### Admin: Get Withdrawals
```javascript
const { data } = await withdrawalAPI.getAllWithdrawals('pending', 50);
console.log(data.withdrawals);  // Array of withdrawals
console.log(data.stats);        // Status distribution
```

### Admin: Approve Withdrawal
```javascript
const { data } = await withdrawalAPI.approveWithdrawal(
  withdrawalId,
  '0x123abc...transactionHash'
);
```

### Admin: Reject Withdrawal
```javascript
const { data } = await withdrawalAPI.rejectWithdrawal(
  withdrawalId,
  'Insufficient funds in escrow'
);
```

## 🧮 Math Reference

### Calculate Earnings
```javascript
// Automatic in system:
const earnings = salePrice - platformFee - royalties;
```

### Calculate Partner Share
```javascript
// For 25% split on 100 ETH sale:
const partnerShare = BigInt('100000000000000000000') * BigInt(25) / BigInt(10000);
```

### Calculate Multi-Partner Distribution
```javascript
// System handles automatically:
// Partner A: 20% → 20 ETH
// Partner B: 15% → 15 ETH
// Creator: 65% → 65 ETH
// (remainder always goes to creator)
```

## 🔐 Security Checks

### Before Withdrawal Approval
```javascript
1. ✓ Wallet address is valid
2. ✓ Amount is positive
3. ✓ User has sufficient available balance
4. ✓ Amount meets minimum threshold
5. ✓ Network is supported
6. ✓ No pending withdrawal exists to same target
```

### Before Partner Addition
```javascript
1. ✓ Partner wallet address is valid
2. ✓ Percentage is 0-100
3. ✓ No duplicate owner-partner pair
4. ✓ Total shares don't exceed 100%
5. ✓ Owner wallet is valid
```

## 🚨 Common Issues & Fixes

### Earnings Not Showing
```
❌ Problem: Earnings dashboard returns 0
✓ Fix: Check that transactionModel records exist for user
✓ Fix: Verify user wallet address matches exactly
✓ Fix: Ensure NFT sale handler calls transaction creation
```

### Withdrawal Request Fails
```
❌ Problem: "Insufficient balance" error
✓ Fix: User must have earnings > platform fees
✓ Fix: Check minimum withdrawal threshold per network
✓ Fix: Deduct any pending withdrawals from available
```

### Partner Verification Fails
```
❌ Problem: "Invalid verification code"
✓ Fix: Code is generated at partner creation
✓ Fix: Code is 6-digit alphanumeric
✓ Fix: Code expires after 24 hours (configurable)
✓ Fix: Ensure case-sensitive matching
```

### Admin Routes Return 403
```
❌ Problem: "Admin access required"
✓ Fix: JWT token must have isAdmin: true
✓ Fix: Token must be sent in Authorization header
✓ Fix: Token must not be expired
```

## 📊 Database Queries

### Get All Pending Withdrawals
```javascript
db.withdrawals.find({ status: 'pending' }).sort({ createdAt: -1 });
```

### Get User's Total Earnings
```javascript
db.transactions.aggregate([
  { $match: { to: userWallet } },
  { $group: { _id: null, total: { $sum: '$salePrice' } } }
]);
```

### Get User's Available Balance
```javascript
// earnings - pending withdrawals
const earnings = await getSellerEarnings(userWallet);
const pending = await getPendingWithdrawals(userWallet);
const available = earnings - pending;
```

### Get Active Partners
```javascript
db.partners.find({
  $or: [
    { ownerWallet: userWallet, status: 'active' },
    { partnerWallet: userWallet, status: 'active' }
  ]
});
```

## 🔄 Data Flow Diagrams

### Withdrawal Flow
```
User Requests Withdrawal
    ↓
System Validates Balance
    ↓
Create Withdrawal Record (status: pending)
    ↓
Admin Reviews & Approves
    ↓
Update Status → processing
    ↓
Execute Transaction
    ↓
Add Transaction Hash
    ↓
Update Status → confirmed
    ↓
Update Partner Balances
```

### Partner Sharing Flow
```
Creator Creates Partnership
    ↓
Generate Verification Code
    ↓
Send Code to Partner
    ↓
Partner Verifies Code
    ↓
Partnership Status → active
    ↓
On Creator Withdrawal:
    ↓
Calculate Partner Share (amount * percentage / 10000)
    ↓
Create Partner Withdrawal Record
    ↓
Distribute Funds Automatically
```

## 📈 Performance Tips

### Query Optimization
```javascript
// ✓ GOOD: Use indexed fields
db.withdrawals.find({ status: 'pending', createdAt: { $gte: date } });

// ❌ BAD: Unindexed fields in filter
db.withdrawals.find({ rejectionReason: 'Fund issue' });
```

### Calculation Optimization
```javascript
// ✓ GOOD: Aggregate earnings in database
db.transactions.aggregate([{ $group: { total: { $sum: '$salePrice' } } }]);

// ❌ BAD: Pull all transactions and sum in JS
const txs = db.transactions.find({}); // Expensive!
```

### UI Performance
```javascript
// ✓ GOOD: Lazy load admin dashboard
if (userRole === 'admin') {
  return <WithdrawalAdmin />;
}

// ✓ GOOD: Paginate withdrawal history (default: 50)
const history = await getWithdrawalHistory(wallet, { limit: 50, skip: 0 });
```

## 🧪 Testing Checklist

### Unit Tests to Create
- [ ] earningsService.calculateNetEarnings()
- [ ] earningsService.calculatePartnerShare()
- [ ] earningsService.validateWithdrawal()
- [ ] withdrawalController.requestWithdrawal()
- [ ] partnerWalletController.addPartnerWallet()

### Integration Tests to Create
- [ ] Complete withdrawal flow (request → approve → confirm)
- [ ] Complete partner flow (add → verify → earnings)
- [ ] Multi-partner distribution (3+ partners)
- [ ] Admin bulk processing (10+ withdrawals)

### Manual Tests to Perform
- [ ] Create withdrawal with small amount
- [ ] Create withdrawal with large amount (check gas)
- [ ] Add partner and verify code
- [ ] Edit partner share percentage
- [ ] View earnings dashboard
- [ ] View partner earnings
- [ ] Admin approve withdrawal
- [ ] Admin reject withdrawal with reason

## 📚 Documentation Files

1. **COMPLETE_SYSTEM_SUMMARY.md** - Full architecture overview
2. **WITHDRAWAL_AND_PARTNER_SYSTEM.md** - Detailed feature guide
3. **INTEGRATION_WITHDRAWAL_PARTNER_SYSTEM.md** - Step-by-step integration
4. **ADMIN_WITHDRAWAL_INTEGRATION_GUIDE.md** - Admin setup guide
5. **QUICK_REFERENCE.md** - This file!

## 🎯 Next Steps

1. **Integrate Backend Routes** (5 min)
2. **Integrate Frontend Pages** (5 min)
3. **Create Test Transaction** (2 min)
4. **Test Earnings Display** (3 min)
5. **Test Withdrawal Flow** (5 min)
6. **Test Admin Dashboard** (5 min)
7. **Deploy to Staging** (10 min)
8. **Perform Load Testing** (15 min)

**Total Time: ~50 minutes to full integration**

---

**Status:** ✅ Ready to Integrate
**Version:** 1.0.0
**Last Updated:** 2024-01-15
