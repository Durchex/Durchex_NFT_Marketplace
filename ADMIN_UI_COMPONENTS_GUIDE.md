# Admin UI Components - Integration Guide

## Overview

Three new admin dashboard components have been created for managing unminted NFTs and fee subsidies:

1. **UnmintedNFTManager** - Create and manage unminted NFTs
2. **GiveawayCenter** - Track and manage giveaway NFTs
3. **FeeSubsidyDashboard** - Configure and monitor fee subsidies

## Component Files

```
frontend/src/pages/admin/
├── UnmintedNFTManager.jsx      # Create/manage unminted NFTs
├── GiveawayCenter.jsx          # Giveaway tracking
└── FeeSubsidyDashboard.jsx     # Fee subsidy management
```

## Installation Steps

### 1. Add Components to Admin Routes

Update your admin routing file (e.g., `Admin.jsx` or `AdminLayout.jsx`):

```jsx
import UnmintedNFTManager from './admin/UnmintedNFTManager';
import GiveawayCenter from './admin/GiveawayCenter';
import FeeSubsidyDashboard from './admin/FeeSubsidyDashboard';

// Add to your route definitions:
<Route path="unminted-nfts" element={<UnmintedNFTManager />} />
<Route path="giveaways" element={<GiveawayCenter />} />
<Route path="fee-subsidies" element={<FeeSubsidyDashboard />} />
```

### 2. Add Navigation Links

Add sidebar/navigation links:

```jsx
{
  name: 'Unminted NFTs',
  path: '/admin/unminted-nfts',
  icon: <FiBox />
},
{
  name: 'Giveaways',
  path: '/admin/giveaways',
  icon: <FiGift />
},
{
  name: 'Fee Subsidies',
  path: '/admin/fee-subsidies',
  icon: <FiPercent />
}
```

### 3. Ensure API is Configured

Make sure your `api.js` is properly configured with authentication headers:

```js
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://durchex.com/api/v1', // or your API base URL
  timeout: 30000,
});

// Add admin ID header if admin is logged in
api.interceptors.request.use((config) => {
  const adminSession = localStorage.getItem('admin_session');
  if (adminSession) {
    const session = JSON.parse(adminSession);
    if (session.user?.id) {
      config.headers['x-admin-id'] = session.user.id;
    }
  }
  return config;
});

export default api;
```

## Component Features

### UnmintedNFTManager

**Features:**
- ✨ Create new unminted NFTs with metadata
- 📋 List all unminted NFTs with filters
- 🎯 Filter by giveaway status and network
- 🏷️ Set fee subsidies
- 👤 Offer NFTs to specific users
- ✅ Mark NFTs as minted after blockchain confirmation
- 🚫 Revoke offers

**Usage:**
```jsx
<UnmintedNFTManager />
```

**Form Fields:**
- NFT Name (required)
- Collection (required)
- Description (required)
- Image URL (required)
- Network (Ethereum, Polygon, BSC, etc.)
- Category (Art, Collectibles, Gaming, etc.)
- Price (optional)
- Admin Notes (optional)
- Mark as Giveaway (checkbox)

**Actions on NFTs:**
- Edit subsidy percentage
- Offer to wallet address with subsidy
- Mark as minted
- Revoke offer

### GiveawayCenter

**Features:**
- 🎁 View all giveaway NFTs
- 📊 Filter by status: pending, offered, claimed, minted
- 📈 Real-time statistics
- 🎯 Track giveaway lifecycle
- ✅ Mark giveaways as minted
- 🚫 Revoke offers

**Status Workflow:**
```
pending (created) → offered (sent to user) → claimed (user received) → minted (on blockchain)
```

**Statistics Shown:**
- Total giveaways
- Pending (not yet offered)
- Offered (sent to users)
- Claimed (users received)
- Minted (on blockchain)

### FeeSubsidyDashboard

**Features:**
- 💰 View all NFTs with fee subsidies
- 📊 Dashboard statistics
- 🔍 Search by name or item ID
- ⚙️ Adjust subsidy percentage
- 👥 Manage recipient wallets
- 📈 Track claim progress

**Statistics:**
- Total subsidized NFTs
- Average subsidy percentage
- Total eligible recipients
- Subsidies claimed

**Actions:**
- Edit subsidy percentage
- Add recipient wallets
- Remove recipients
- View claim status per recipient

## Component Architecture

### State Management

Each component manages its own state:

```jsx
// UnmintedNFTManager
const [unmintedNFTs, setUnmintedNFTs] = useState([]);
const [formData, setFormData] = useState({...});
const [filter, setFilter] = useState({...});

// GiveawayCenter
const [giveaways, setGiveaways] = useState([]);
const [filter, setFilter] = useState('all');

// FeeSubsidyDashboard
const [subsidizedNFTs, setSubsidizedNFTs] = useState([]);
const [selectedNFT, setSelectedNFT] = useState(null);
```

### API Integration

All components use the `api` service:

```jsx
// Fetch data
const response = await api.get('/admin/nfts/unminted/list');

// Create/update
const response = await api.post('/admin/nfts/unminted/create', formData);

// Modify
const response = await api.post('/admin/nfts/offer', {...});
```

### Toast Notifications

Components use `react-hot-toast` for user feedback:

```jsx
import toast from 'react-hot-toast';

toast.success('NFT created successfully');
toast.error('Failed to create NFT');
```

## Styling

All components use:
- Tailwind CSS for responsive design
- Dark theme (slate/gray colors)
- React Icons (FiPlus, FiGift, FiPercent, etc.)
- Gradient backgrounds
- Hover effects and transitions

## Example Workflows

### Workflow 1: Create and Offer Giveaway

1. Go to **Unminted NFTs** page
2. Click **Create Unminted NFT**
3. Fill in NFT details
4. Check **Mark as Giveaway**
5. Submit form
6. Click **Manage** on created NFT
7. Enter recipient wallet address
8. Set subsidy percentage (e.g., 100%)
9. Click **Offer NFT**
10. Go to **Giveaway Center** to track

### Workflow 2: Launch Subsidized Pre-Sale

1. Go to **Unminted NFTs**
2. Create multiple NFTs for collection
3. For each NFT, click **Manage**
4. Set subsidy percentage (e.g., 50%)
5. Go to **Fee Subsidy Dashboard**
6. Add recipient wallets
7. Users can now mint at discount
8. Track subsidies claimed in dashboard

### Workflow 3: Post-Minting Update

1. User mints NFT
2. Admin gets transaction hash
3. Go to **Giveaway Center** (or **Unminted NFTs**)
4. Click **Mark as Minted**
5. Enter Token ID and TX Hash
6. Status updates to "Minted"

## Customization

### Change Colors

Edit component className gradients:

```jsx
// Default purple-blue
className="bg-gradient-to-r from-purple-600 to-blue-600"

// Custom gradient
className="bg-gradient-to-r from-indigo-600 to-cyan-600"
```

### Modify Form Fields

Add custom properties to `formData`:

```jsx
const [formData, setFormData] = useState({
  // ... existing fields
  royaltyPercentage: 0,
  externalURL: '',
  // ... add more as needed
});
```

### Change Table Layout

Modify grid columns:

```jsx
// Default
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Wider cards
className="grid grid-cols-1 md:grid-cols-2 gap-4"

// Single column
className="space-y-4"
```

## Dependencies

Make sure these are installed:

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x",
    "react-hot-toast": "^2.x",
    "react-icons": "^4.x",
    "tailwindcss": "^3.x"
  }
}
```

## Troubleshooting

### Components not loading

**Issue:** "Cannot find module" error

**Solution:**
- Check file paths are correct
- Ensure all imports are spelled correctly
- Verify Tailwind CSS is installed and configured

### API calls failing

**Issue:** 404 or 401 errors

**Solution:**
- Verify backend is running on port 8080
- Check admin authentication token is valid
- Ensure x-admin-id header is being sent
- Verify admin has necessary permissions

### Form not submitting

**Issue:** Form stays in loading state

**Solution:**
- Check browser console for errors
- Verify all required fields are filled
- Check network tab for failed requests
- Look at backend logs for validation errors

## Best Practices

1. **Always confirm destructive actions** (revoke, delete)
   ```jsx
   if (!window.confirm('Are you sure?')) return;
   ```

2. **Validate input before API calls**
   ```jsx
   if (!formData.name) {
     toast.error('Name is required');
     return;
   }
   ```

3. **Use try-catch for error handling**
   ```jsx
   try {
     await api.post(...);
     toast.success('Success!');
   } catch (error) {
     toast.error(error.response?.data?.error || 'Failed');
   }
   ```

4. **Refresh data after modifications**
   ```jsx
   await api.post(...);
   await fetchData(); // Refresh list
   ```

5. **Disable buttons during loading**
   ```jsx
   <button disabled={loading}>Submit</button>
   ```

## Testing

### Manual Testing Checklist

- [ ] Create unminted NFT with all fields
- [ ] Create unminted NFT as giveaway
- [ ] Filter unminted NFTs by network
- [ ] Offer NFT to wallet address
- [ ] Set fee subsidy percentage
- [ ] Mark NFT as minted
- [ ] Revoke NFT offer
- [ ] View giveaway status progression
- [ ] Add recipient to subsidy
- [ ] Search in fee subsidy dashboard
- [ ] Mobile responsive testing

### Test Data

Create test NFTs with:
- Different networks (Polygon, Ethereum, BSC)
- Different categories (Art, Gaming, Music)
- Both giveaway and regular types
- Various subsidy percentages (25%, 50%, 75%, 100%)

## Performance Tips

1. **Lazy load components**
   ```jsx
   const UnmintedNFTManager = React.lazy(() => 
     import('./UnmintedNFTManager')
   );
   ```

2. **Memoize components** to prevent unnecessary renders
   ```jsx
   export default React.memo(UnmintedNFTManager);
   ```

3. **Use pagination** for large lists
   ```jsx
   const itemsPerPage = 20;
   const paginated = items.slice(0, itemsPerPage);
   ```

4. **Debounce search**
   ```jsx
   const [searchTimer, setSearchTimer] = useState(null);
   
   const handleSearch = (value) => {
     clearTimeout(searchTimer);
     setSearchTimer(setTimeout(() => {
       // Search logic
     }, 500));
   };
   ```

## Support

For issues or questions:
1. Check console for error messages
2. Review backend logs: `/tmp/backend.log`
3. Test API directly with cURL or Postman
4. Refer to API documentation: `UNMINTED_NFT_SUBSIDY_GUIDE.md`

---

**Version:** 1.0.0  
**Last Updated:** December 17, 2025  
**Status:** Production Ready
