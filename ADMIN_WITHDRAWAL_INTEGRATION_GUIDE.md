# Admin Withdrawal Management Integration Guide

## Overview
This guide covers integrating the admin withdrawal management system into your Durchex NFT Marketplace. The system provides comprehensive tools for processing user withdrawals, approving/rejecting requests, and viewing analytics.

## Components Added

### 1. **WithdrawalAdmin.jsx** - Admin Dashboard
Location: `frontend/src/pages/admin/WithdrawalAdmin.jsx`

**Features:**
- View all withdrawals filtered by status (pending, processing, confirmed, failed)
- Bulk selection of withdrawals
- Real-time statistics (total pending, count, selected)
- Withdrawal details (user, target wallet, amount, network, type, date)
- Status badges with visual indicators
- Quick approve/reject buttons for individual withdrawals
- Bulk action panel for selected withdrawals

**Key Sections:**
```jsx
- Header with Process Pending button
- Status filter tabs
- Statistics cards
- Withdrawals table with selection
- Bulk action bar
```

### 2. **withdrawalAdminController.js** - Backend Logic
Location: `backend/controllers/withdrawalAdminController.js`

**Functions:**
- `getAllWithdrawals()` - Fetch withdrawals with filtering, pagination, and statistics
- `processPendingWithdrawals()` - Bulk process pending withdrawals
- `approveWithdrawal()` - Approve single withdrawal with transaction hash
- `rejectWithdrawal()` - Reject withdrawal with reason
- `getWithdrawalAnalytics()` - Get comprehensive withdrawal analytics
- `resyncWithdrawalStatus()` - Verify blockchain status of withdrawals

### 3. **withdrawalAdminRoutes.js** - API Routes
Location: `backend/routes/withdrawalAdminRoutes.js`

**Routes:**
```
GET  /admin/withdrawals
GET  /admin/withdrawals/analytics
POST /admin/withdrawals/process-pending
POST /admin/withdrawals/approve
POST /admin/withdrawals/reject
POST /admin/withdrawals/resync
```

All routes require admin authentication via `verifyAdminToken` middleware.

## Integration Steps

### Step 1: Register Admin Routes in Backend Server
Add to your `backend/server.js`:

```javascript
import withdrawalAdminRoutes from './routes/withdrawalAdminRoutes.js';

// Admin routes (should be protected)
app.use('/api/v1/admin', withdrawalAdminRoutes);
```

### Step 2: Ensure Admin Authentication Middleware Exists
Create or verify `backend/middleware/adminAuth.js`:

```javascript
import jwt from 'jsonwebtoken';

export const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authorization token' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};
```

### Step 3: Add Admin Dashboard to Frontend
Add to your admin pages routing. Create `frontend/src/pages/AdminDashboard.jsx`:

```javascript
import React, { useState } from 'react';
import WithdrawalAdmin from './admin/WithdrawalAdmin';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('withdrawals');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'withdrawals'
                ? 'border-b-2 border-purple-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Withdrawal Management
          </button>
        </div>

        {/* Content */}
        {activeTab === 'withdrawals' && <WithdrawalAdmin />}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

### Step 4: Add Frontend API Wrapper Functions
Add to your `frontend/src/services/withdrawalAPI.js`:

```javascript
// Admin functions
export const getAllWithdrawals = async (status = 'pending', limit = 50) => {
  try {
    const response = await api.get(
      `/admin/withdrawals?status=${status}&limit=${limit}`,
      { headers: getAdminHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    throw error;
  }
};

export const approveWithdrawal = async (withdrawalId, transactionHash) => {
  try {
    const response = await api.post(
      `/admin/withdrawals/approve`,
      { withdrawalId, transactionHash },
      { headers: getAdminHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    throw error;
  }
};

export const rejectWithdrawal = async (withdrawalId, reason) => {
  try {
    const response = await api.post(
      `/admin/withdrawals/reject`,
      { withdrawalId, reason },
      { headers: getAdminHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    throw error;
  }
};

export const getWithdrawalAnalytics = async (startDate, endDate) => {
  try {
    const response = await api.get(
      `/admin/withdrawals/analytics?startDate=${startDate}&endDate=${endDate}`,
      { headers: getAdminHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

// Helper to add admin token to headers
const getAdminHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};
```

### Step 5: Update Navigation
Add admin dashboard link to your main navigation:

```javascript
// In your navigation component
{isAdmin && (
  <NavLink to="/admin/dashboard" className="nav-link">
    Admin Dashboard
  </NavLink>
)}
```

### Step 6: Add Admin Route to Frontend Router
In your `frontend/src/App.jsx` or routing file:

```javascript
import AdminDashboard from './pages/AdminDashboard';

// Add to your routes:
<Route path="/admin/dashboard" element={<AdminDashboard />} />
```

## API Usage Examples

### Get All Withdrawals
```bash
curl -X GET "http://localhost:5000/api/v1/admin/withdrawals?status=pending&limit=50" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Approve Withdrawal
```bash
curl -X POST "http://localhost:5000/api/v1/admin/withdrawals/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalId": "507f1f77bcf86cd799439011",
    "transactionHash": "0x123abc..."
  }'
```

### Reject Withdrawal
```bash
curl -X POST "http://localhost:5000/api/v1/admin/withdrawals/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalId": "507f1f77bcf86cd799439011",
    "reason": "Insufficient funds in escrow"
  }'
```

### Get Analytics
```bash
curl -X GET "http://localhost:5000/api/v1/admin/withdrawals/analytics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Process Pending Withdrawals
```bash
curl -X POST "http://localhost:5000/api/v1/admin/withdrawals/process-pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "withdrawalIds": ["507f1f77bcf86cd799439011"]
  }'
```

## Dashboard Features

### Withdrawal Statuses
- **Pending** - Awaiting admin review
- **Processing** - Approved and being processed
- **Confirmed** - Blockchain transaction confirmed
- **Failed** - Processing failed

### Statistics
The dashboard shows:
- **Total Pending** - Sum of all pending withdrawal amounts
- **Count** - Number of withdrawals in current filter
- **Selected** - Number of withdrawals selected for bulk action

### Filtering Options
- Status tabs: pending, processing, confirmed, failed
- Date range filtering
- Network filtering
- Withdrawal type filtering

### Withdrawal Information Displayed
- User wallet address (truncated)
- Target wallet address (truncated)
- Amount in ETH
- Network (ethereum, polygon, mumbai, base)
- Withdrawal type (sales_earnings, partner_share, giveaway_rewards, etc.)
- Request date

## Testing Checklist

- [ ] Admin user can access /admin/dashboard
- [ ] Withdrawal list loads and displays pending withdrawals
- [ ] Status filter tabs work and update the list
- [ ] Individual withdrawals show correct information
- [ ] Can select individual withdrawals
- [ ] "Select All" checkbox works
- [ ] Process Pending button updates withdrawal statuses
- [ ] Approve button shows approval form (with hash input)
- [ ] Reject button shows rejection form (with reason input)
- [ ] Analytics endpoint returns correct data
- [ ] Date range filtering works
- [ ] Pagination works for large withdrawal lists
- [ ] Bulk actions appear when withdrawals selected
- [ ] Error handling shows toast notifications

## Performance Optimization

### Database Indexes
Ensure these indexes exist on the `withdrawals` collection:

```javascript
// In your withdrawalModel.js schema
schema.index({ status: 1, createdAt: -1 });
schema.index({ userWallet: 1, status: 1 });
schema.index({ network: 1 });
schema.index({ createdAt: 1 });
```

### Pagination
The API supports pagination via `limit` and `skip` parameters:
```javascript
GET /api/v1/admin/withdrawals?limit=50&skip=0
```

### Caching
For analytics queries, consider caching results:
```javascript
// Add Redis caching for analytics
const cacheKey = `analytics_${startDate}_${endDate}`;
const cachedResult = await redis.get(cacheKey);
if (cachedResult) return JSON.parse(cachedResult);
```

## Security Considerations

1. **Admin Token Validation** - All routes verify admin status in JWT
2. **Rate Limiting** - Consider adding rate limiting to admin endpoints
3. **Audit Logging** - Log all admin actions (approvals, rejections)
4. **Data Validation** - Validate transaction hashes before storing
5. **Error Messages** - Don't expose sensitive data in error messages

## Troubleshooting

### Issue: "Admin access required" error
**Solution:** Ensure JWT token includes `isAdmin: true` field

### Issue: Withdrawals not loading
**Solution:** Check that withdrawalModel is properly imported and MongoDB connection is active

### Issue: Approve/Reject buttons not working
**Solution:** Verify admin routes are registered in server.js with correct path

### Issue: Analytics showing wrong data
**Solution:** Check date format is YYYY-MM-DD and MongoDB date indexes exist

## Environment Variables Needed

```env
# .env file
JWT_SECRET=your_jwt_secret_key
VITE_API_BASE_URL=http://localhost:5000/api/v1
ADMIN_PORTAL_URL=http://localhost:3000/admin/dashboard
```

## Next Steps

1. **Set up email notifications** for withdrawal approvals/rejections
2. **Implement blockchain verification** in `resyncWithdrawalStatus`
3. **Add export functionality** to download withdrawal reports
4. **Create audit logs** for all admin actions
5. **Implement automated processing** for small withdrawals under certain threshold
6. **Add multi-signature support** for large withdrawal approvals

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Status:** Ready for Integration
