# Integration Guide: Withdrawal & Partner System

## Step 1: Register Routes in Backend Server

Add these routes to your backend `server.js`:

```javascript
// At the top of server.js with other imports
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import partnerWalletRoutes from './routes/partnerWalletRoutes.js';

// In your Express setup (with other app.use routes)
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/partners', partnerWalletRoutes);
```

## Step 2: Import Models in Your Controllers

If you need to reference transactions in other controllers:

```javascript
import {
  transactionModel,
  createTransaction,
  getSellerEarnings
} from '../models/transactionModel.js';
```

## Step 3: Update NFT Sale Handler

When NFTs are sold on your marketplace, record the transaction:

```javascript
// In your marketplace/sale handler
import { createTransaction } from '../models/transactionModel.js';

// After successful sale transaction
await createTransaction({
  transactionHash: receipt.transactionHash,
  blockNumber: receipt.blockNumber,
  nftItemId: nft.itemId,
  nftTokenId: nft.tokenId,
  nftName: nft.name,
  network: networkName,
  from: sellerAddress,
  to: buyerAddress,
  salePrice: salePrice,
  transactionType: 'sale',
  status: 'confirmed',
  platformFee: {
    amount: feeAmount,
    percentage: feePercentage
  },
  confirmedAt: new Date()
});
```

## Step 4: Add Routes to Navigation (Frontend)

Update your main App.jsx or Header.jsx:

```javascript
import WithdrawalSystem from './pages/WithdrawalSystem';
import PartnerManagement from './pages/PartnerManagement';

// In your Router
<Route path="/earnings" element={<WithdrawalSystem />} />
<Route path="/partners" element={<PartnerManagement />} />
```

Add navigation links in Header.jsx:

```javascript
navItems.push({
  name: 'Earnings',
  path: '/earnings'
});
navItems.push({
  name: 'Partners',
  path: '/partners'
});
```

## Step 5: Configure API Base URL

Make sure `VITE_API_BASE_URL` is set in your `.env.production`:

```env
VITE_API_BASE_URL=https://durchex.com/api/v1
```

## Step 6: Database Preparation

Run these commands to initialize the models:

```bash
# Test database connection
npm run test-mongodb

# Create indexes for performance
# This happens automatically when models are first used
# Or manually in your database:
# db.transactions.createIndex({ 'from': 1, 'createdAt': -1 })
# db.transactions.createIndex({ 'to': 1, 'createdAt': -1 })
# db.partnerwallet.createIndex({ 'ownerWallet': 1, 'partnerWallet': 1 }, { unique: true })
# db.withdrawals.createIndex({ 'userWallet': 1, 'createdAt': -1 })
```

## Step 7: Test the System

### 1. Test Backend Endpoints

```bash
# Request a withdrawal
curl -X POST http://localhost:5000/api/v1/withdrawals/request \
  -H "Content-Type: application/json" \
  -d '{
    "userWallet": "0xabcd...",
    "targetWallet": "0xabcd...",
    "amount": "1000000000000000000",
    "network": "polygon",
    "withdrawalType": "sales_earnings"
  }'

# Get earnings
curl http://localhost:5000/api/v1/withdrawals/earnings/0xabcd...

# Add partner
curl -X POST http://localhost:5000/api/v1/partners/add \
  -H "Content-Type: application/json" \
  -d '{
    "ownerWallet": "0xabcd...",
    "partnerWallet": "0xdef...",
    "partnerName": "John Designer",
    "sharePercentage": 25,
    "network": "all"
  }'
```

### 2. Test Frontend Pages

1. Go to `/earnings` - Should show empty dashboard initially
2. Go to `/partners` - Should show "No partners yet"
3. Try adding a test partner
4. Create a test transaction in MongoDB to see earnings appear

### 3. Sample MongoDB Documents

Create a test transaction:

```javascript
db.transactions.insertOne({
  transactionHash: "0x123...",
  blockNumber: 12345,
  nftItemId: "test-1",
  nftTokenId: "1",
  nftName: "Test NFT",
  network: "polygon",
  from: "0xabc...",
  to: "0xdef...",
  salePrice: "1000000000000000000",
  transactionType: "sale",
  status: "confirmed",
  platformFee: {
    amount: "25000000000000000",
    percentage: 2.5
  },
  confirmedAt: new Date(),
  createdAt: new Date()
});
```

## Step 8: Environment Variables

Add to your `.env` files:

```env
# Backend
MONGODB_URI=your_mongodb_uri
WITHDRAWAL_MIN_AMOUNT=100000000000000000  # 0.1 ETH in wei
WITHDRAWAL_FEE_PERCENTAGE=2.5

# Frontend
VITE_API_BASE_URL=https://durchex.com/api/v1
```

## Step 9: Connect to Marketplace Contract

If you want automatic transaction recording on sales:

```javascript
// In your marketplace sale function
import { createTransaction } from '../models/transactionModel.js';

const handleSale = async (nftId, buyerAddress, salePrice) => {
  // ... existing sale logic ...
  
  const receipt = await tx.wait();
  
  // Record transaction
  await createTransaction({
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    nftItemId: nftId,
    nftTokenId: tokenId,
    nftName: nftData.name,
    network: selectedChain,
    from: sellerAddress,
    to: buyerAddress,
    salePrice: salePrice,
    transactionType: 'sale',
    status: 'confirmed',
    platformFee: {
      amount: calculateFee(salePrice),
      percentage: 2.5
    },
    confirmedAt: new Date()
  });
};
```

## Step 10: Admin Panel Updates

Add withdrawal processing to your admin panel:

```javascript
// In admin controller
import withdrawalController from '../controllers/withdrawalController.js';

// Add route for admin
app.post('/admin/process-withdrawals', withdrawalController.processPendingWithdrawals);
```

## Step 11: Email Notifications (Optional)

Add email notifications for partner verification:

```javascript
// In partnerWalletController.js addPartnerWallet function
// Replace comment with:
const nodemailer = require('nodemailer');

// Send verification email
const transporter = nodemailer.createTransport({
  // your email config
});

await transporter.sendMail({
  to: partnerEmail,
  subject: 'Partnership Verification',
  html: `Click here to verify: <code>${verificationCode}</code>`
});
```

## Common Issues & Solutions

### Issue 1: Routes Not Found
**Solution:** Make sure routes are imported before starting server
```javascript
// This must be BEFORE app.listen()
app.use('/api/v1/withdrawals', withdrawalRoutes);
```

### Issue 2: Database Connection Error
**Solution:** Check MongoDB connection string
```bash
npm run test-mongodb
```

### Issue 3: CORS Errors
**Solution:** Add withdrawal/partner origins to CORS config
```javascript
app.use(cors({
  origin: ['https://durchex.com', 'http://localhost:5173'],
  credentials: true
}));
```

### Issue 4: API Calls Return 404
**Solution:** Verify API base URL in frontend .env
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1  # for development
```

## Verification Checklist

- [ ] Routes imported in server.js
- [ ] Models can be imported without errors
- [ ] Frontend pages added to routing
- [ ] Navigation links updated
- [ ] Database connection tested
- [ ] Sample transaction created in MongoDB
- [ ] API endpoints responding (test with curl)
- [ ] Frontend pages loading without errors
- [ ] Environment variables configured
- [ ] Error handling working properly

## Performance Optimization

### Recommended Indexes

```javascript
// Create these for better query performance
db.transactions.createIndex({ 'from': 1, 'createdAt': -1 });
db.transactions.createIndex({ 'to': 1, 'createdAt': -1 });
db.transactions.createIndex({ 'nftItemId': 1 });
db.transactions.createIndex({ 'network': 1, 'status': 1 });

db.partnerwallet.createIndex({ 'ownerWallet': 1 });
db.partnerwallet.createIndex({ 'status': 1 });

db.withdrawals.createIndex({ 'userWallet': 1, 'createdAt': -1 });
db.withdrawals.createIndex({ 'status': 1 });
```

## Next Steps

1. **Test with real NFT sales** - Verify transaction recording works
2. **Monitor withdrawals** - Set up admin dashboard to process pending withdrawals
3. **Add notifications** - Send email/push notifications for withdrawals and partnerships
4. **Analytics** - Build dashboards to track withdrawal patterns and partner performance
5. **Compliance** - Add tax reporting and KYC verification if needed

---

For detailed documentation, see: [WITHDRAWAL_AND_PARTNER_SYSTEM.md](./WITHDRAWAL_AND_PARTNER_SYSTEM.md)
