# Complete Integration Example

This document shows how to integrate the new admin components into your existing Admin dashboard.

## 1. Update Admin Routes (Admin.jsx or similar)

```jsx
// frontend/src/pages/Admin.jsx or your admin routes file

import React, { useEffect } from "react";
import { useAdmin } from "../Context/AdminContext";
import { useNavigate, Routes, Route } from "react-router-dom";
import { AdminLayout } from "../components/DualAdminPortal";
import Dashboard from "./admin/Dashboard";
import Users from "./admin/Users";
import NFTs from "./admin/NFTs";
import Transactions from "./admin/Transactions";
import Orders from "./admin/Orders";
import Analytics from "./admin/Analytics";
import Activity from "./admin/Activity";
import Reports from "./admin/Reports";
import Settings from "./admin/Settings";

// NEW: Import the unminted NFT components
import UnmintedNFTManager from "./admin/UnmintedNFTManager";
import GiveawayCenter from "./admin/GiveawayCenter";
import FeeSubsidyDashboard from "./admin/FeeSubsidyDashboard";

const Admin = () => {
  const navigate = useNavigate();
  const { hasAdminAccess, isAdminLoggedIn } = useAdmin();

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate("/admin/login");
    }
  }, [isAdminLoggedIn, navigate]);

  if (!hasAdminAccess()) {
    return <div>Access Denied</div>;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/nfts" element={<NFTs />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* NEW: Add unminted NFT routes */}
        <Route path="/unminted-nfts" element={<UnmintedNFTManager />} />
        <Route path="/giveaways" element={<GiveawayCenter />} />
        <Route path="/fee-subsidies" element={<FeeSubsidyDashboard />} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
```

## 2. Update Sidebar Navigation

```jsx
// frontend/src/components/AdminSidebar.jsx or navigation component

import { 
  FiHome, FiUsers, FiBox, FiShoppingCart, FiTrendingUp, 
  FiActivity, FiFileText, FiSettings, FiGift, FiPercent 
} from 'react-icons/fi';

const ADMIN_MENU = [
  {
    name: 'Dashboard',
    path: '/admin',
    icon: <FiHome />,
  },
  {
    name: 'Users',
    path: '/admin/users',
    icon: <FiUsers />,
  },
  {
    name: 'NFTs',
    path: '/admin/nfts',
    icon: <FiBox />,
  },
  // NEW: Unminted NFT menu items
  {
    name: 'Unminted NFTs',
    path: '/admin/unminted-nfts',
    icon: <FiBox />,
    badge: 'New',
  },
  {
    name: 'Giveaways',
    path: '/admin/giveaways',
    icon: <FiGift />,
    badge: 'New',
  },
  {
    name: 'Fee Subsidies',
    path: '/admin/fee-subsidies',
    icon: <FiPercent />,
    badge: 'New',
  },
  {
    name: 'Orders',
    path: '/admin/orders',
    icon: <FiShoppingCart />,
  },
  {
    name: 'Transactions',
    path: '/admin/transactions',
    icon: <FiActivity />,
  },
  {
    name: 'Analytics',
    path: '/admin/analytics',
    icon: <FiTrendingUp />,
  },
  {
    name: 'Activity',
    path: '/admin/activity',
    icon: <FiActivity />,
  },
  {
    name: 'Reports',
    path: '/admin/reports',
    icon: <FiFileText />,
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: <FiSettings />,
  },
];

export default ADMIN_MENU;
```

## 3. Add to Dashboard Statistics

```jsx
// frontend/src/pages/admin/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    unmintedCount: 0,
    giveawayCount: 0,
    subsidiesCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const unmintedRes = await api.get('/admin/nfts/unminted/list');
        const giveawaysRes = await api.get('/admin/nfts/giveaways/list');
        
        setStats({
          unmintedCount: unmintedRes.data.count || 0,
          giveawayCount: giveawaysRes.data.count || 0,
          subsidiesCount: unmintedRes.data.nfts?.filter(
            n => n.feeSubsidyEnabled
          ).length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      {/* Existing dashboard content */}

      {/* NEW: Add unminted NFT stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard 
          title="Unminted NFTs" 
          value={stats.unmintedCount}
          color="bg-blue-500"
          link="/admin/unminted-nfts"
        />
        <StatCard 
          title="Active Giveaways" 
          value={stats.giveawayCount}
          color="bg-green-500"
          link="/admin/giveaways"
        />
        <StatCard 
          title="Subsidized NFTs" 
          value={stats.subsidiesCount}
          color="bg-purple-500"
          link="/admin/fee-subsidies"
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, link }) => (
  <a
    href={link}
    className={`${color} text-white p-4 rounded-lg hover:shadow-lg transition-all cursor-pointer`}
  >
    <p className="text-sm opacity-80">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </a>
);

export default Dashboard;
```

## 4. Update API Service (if needed)

```jsx
// frontend/src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://durchex.com/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add admin authentication
api.interceptors.request.use((config) => {
  const adminSession = localStorage.getItem('admin_session');
  if (adminSession) {
    try {
      const session = JSON.parse(adminSession);
      if (session.user?.id) {
        config.headers['x-admin-id'] = session.user.id;
      }
    } catch (error) {
      console.error('Invalid admin session', error);
    }
  }
  return config;
});

// Error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Admin session expired
      localStorage.removeItem('admin_session');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 5. Complete File Structure

After integration, your structure should look like:

```
frontend/src/
├── pages/
│   ├── Admin.jsx                          (Updated)
│   └── admin/
│       ├── Dashboard.jsx                  (Updated)
│       ├── Users.jsx
│       ├── NFTs.jsx
│       ├── Orders.jsx
│       ├── Transactions.jsx
│       ├── Analytics.jsx
│       ├── Activity.jsx
│       ├── Reports.jsx
│       ├── Settings.jsx
│       ├── UnmintedNFTManager.jsx         (NEW)
│       ├── GiveawayCenter.jsx             (NEW)
│       └── FeeSubsidyDashboard.jsx        (NEW)
├── components/
│   ├── AdminSidebar.jsx                   (Updated)
│   ├── DualAdminPortal.jsx
│   ├── AdminLogin.jsx
│   └── ...
├── services/
│   ├── api.js                             (Updated)
│   ├── adminAPI.js
│   └── adminAuthAPI.js
├── Context/
│   └── AdminContext.jsx
└── ...
```

## 6. Build and Deploy

```bash
# Build frontend
npm run build

# Copy to server
scp -r frontend/dist/* root@213.130.144.229:/home/durchex/htdocs/durchex.com/frontend/public/

# Restart nginx
ssh root@213.130.144.229 "sudo systemctl restart nginx"
```

## 7. Quick Feature Overview

### Feature Matrix

| Feature | Component | API Endpoint |
|---------|-----------|--------------|
| Create Unminted NFT | UnmintedNFTManager | POST /admin/nfts/unminted/create |
| List Unminted NFTs | UnmintedNFTManager | GET /admin/nfts/unminted/list |
| Offer NFT | UnmintedNFTManager | POST /admin/nfts/offer |
| Set Fee Subsidy | UnmintedNFTManager | POST /admin/nfts/subsidy/set |
| Mark as Minted | UnmintedNFTManager | POST /admin/nfts/minted/mark |
| View Giveaways | GiveawayCenter | GET /admin/nfts/giveaways/list |
| Manage Subsidies | FeeSubsidyDashboard | POST /admin/nfts/subsidy/set |

## 8. Testing Checklist

- [ ] Components load without errors
- [ ] Navigation links work correctly
- [ ] Dashboard stats update
- [ ] Create unminted NFT form works
- [ ] Filters work in all components
- [ ] Offer NFT functionality
- [ ] Set fee subsidy functionality
- [ ] Mark as minted workflow
- [ ] Giveaway tracking
- [ ] Mobile responsive design
- [ ] Error handling works
- [ ] Loading states display

## 9. Verification Commands

Test the backend endpoints directly:

```bash
# Check unminted NFTs
curl -X GET "https://durchex.com/api/v1/admin/nfts/unminted/list" \
  -H "x-admin-id: your-admin-id"

# Check giveaways
curl -X GET "https://durchex.com/api/v1/admin/nfts/giveaways/list" \
  -H "x-admin-id: your-admin-id"

# Check subsidy info
curl -X GET "https://durchex.com/api/v1/admin/nfts/subsidy/item-id-here" \
  -H "x-admin-id: your-admin-id"
```

## 10. Troubleshooting

**Components not appearing in navigation:**
- Check imports are correct
- Verify routes are added to `<Routes>`
- Clear browser cache

**API calls returning 404:**
- Verify backend is running (`ps aux | grep node`)
- Check admin authentication token
- Verify x-admin-id header is sent

**Styling looks off:**
- Verify Tailwind CSS is properly configured
- Check Tailwind color palette includes custom colors
- Clear Tailwind cache: `rm -rf node_modules/.cache`

**Form submission issues:**
- Check browser console for errors
- Verify all required fields are filled
- Check network tab for failed requests

---

## Next Steps

1. **Deploy to production**
   ```bash
   git add .
   git commit -m "Add unminted NFT and fee subsidy admin UI"
   git push
   ```

2. **Test thoroughly** on production
   - Test all CRUD operations
   - Verify mobile responsiveness
   - Check error handling

3. **Create user documentation** for your team
   - How to create giveaways
   - How to set subsidies
   - How to track giveaway progress

4. **Monitor in production**
   - Check error logs
   - Monitor API performance
   - Gather user feedback

---

**Version:** 1.0.0  
**Integration Status:** Ready for deployment  
**Last Updated:** December 17, 2025
