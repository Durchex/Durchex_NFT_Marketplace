# Frontend Component Integration Guide

**Priority**: HIGH  
**Scope**: Integrate 30+ orphaned components into visible UI  
**Timeline**: 5-7 days  
**Complexity**: MEDIUM

---

## OVERVIEW

This guide shows exactly how to integrate all created but unused components into the Durchex marketplace UI.

---

## SECTION 1: ADMIN & MANAGEMENT DASHBOARD

### 1.1 Create Unified Admin Dashboard

**File to Create**: `frontend/src/pages/AdminDashboard.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DualAdminPortal from '../components/DualAdminPortal';
import SmartContractHealthMonitor from '../components/SmartContractHealthMonitor';
import AdminSidebar from '../components/AdminSidebar';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="flex h-screen bg-black">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' && (
            <DualAdminPortal />
          )}
          
          {activeTab === 'contracts' && (
            <SmartContractHealthMonitor />
          )}
          
          {activeTab === 'analytics' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Analytics</h2>
              {/* Add analytics content */}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
```

**Add Route**: `frontend/src/App.jsx`

```javascript
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Add route:
<Route
  path="/admin/dashboard"
  element={<AdminDashboard />}
/>
```

**Update Header Navigation** to include admin dashboard link

---

## SECTION 2: ANALYTICS & INSIGHTS DASHBOARD

### 2.1 Create Analytics Hub

**File to Create**: `frontend/src/pages/AnalyticsDashboard.jsx`

```javascript
import React, { useState } from 'react';
import HeroAnalyticsChart from '../components/HeroAnalyticsChart';
import NFTAnalytics from '../components/NFTAnalytics';
import NFTAnalyticsSection from '../components/NFTAnalyticsSection';
import RealTimeData from '../components/RealTimeData';
import TokenTradingChart from '../components/TokenTradingChart';

export default function AnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Marketplace Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HeroAnalyticsChart />
        <TokenTradingChart />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <NFTAnalytics />
        <NFTAnalyticsSection />
        <RealTimeData />
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">NFT Performance</h2>
        {/* Additional analytics */}
      </div>
    </div>
  );
}
```

**Add Route**: `frontend/src/App.jsx`

```javascript
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));

<Route path="/analytics/dashboard" element={<AnalyticsDashboard />} />
```

---

## SECTION 3: FEATURE HUB - NEW MAIN PAGE

### 3.1 Create Features Hub

**File to Create**: `frontend/src/pages/FeaturesHub.jsx`

```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGift, FiTrendingUp, FiUsers, FiDollarSign, FiLock, FiGitNetwork, FiZap } from 'react-icons/fi';

export default function FeaturesHub() {
  const navigate = useNavigate();
  
  const features = [
    {
      id: 'rental',
      title: 'NFT Rental',
      description: 'Rent your NFTs and earn passive income',
      icon: FiGift,
      path: '/features/rental',
      color: 'from-purple-600 to-purple-900'
    },
    {
      id: 'staking',
      title: 'Staking',
      description: 'Stake NFTs to earn rewards',
      icon: FiTrendingUp,
      path: '/features/staking',
      color: 'from-blue-600 to-blue-900'
    },
    {
      id: 'pool',
      title: 'Liquidity Pools',
      description: 'Trade in decentralized pools',
      icon: FiZap,
      path: '/features/pool',
      color: 'from-green-600 to-green-900'
    },
    {
      id: 'financing',
      title: 'NFT Financing',
      description: 'Get loans using your NFTs as collateral',
      icon: FiDollarSign,
      path: '/features/financing',
      color: 'from-yellow-600 to-yellow-900'
    },
    {
      id: 'governance',
      title: 'Governance',
      description: 'Vote on marketplace decisions',
      icon: FiUsers,
      path: '/features/governance',
      color: 'from-red-600 to-red-900'
    },
    {
      id: 'monetization',
      title: 'Creator Monetization',
      description: 'Tips, subscriptions, merchandise',
      icon: FiDollarSign,
      path: '/features/monetization',
      color: 'from-indigo-600 to-indigo-900'
    },
    {
      id: 'bridge',
      title: 'Cross-Chain Bridge',
      description: 'Transfer NFTs across chains',
      icon: FiGitNetwork,
      path: '/bridge',
      color: 'from-pink-600 to-pink-900'
    },
    {
      id: 'social',
      title: 'Social Features',
      description: 'Connect with other creators',
      icon: FiUsers,
      path: '/features/social',
      color: 'from-cyan-600 to-cyan-900'
    }
  ];
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-8 md:p-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Marketplace Features</h1>
          <p className="text-xl text-gray-400">
            Discover all the advanced features available on Durchex
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(feature => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => navigate(feature.path)}
                className={`p-6 rounded-lg bg-gradient-to-br ${feature.color} hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-left`}
              >
                <Icon className="w-8 h-8 mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-200">{feature.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Add Route**: `frontend/src/App.jsx`

```javascript
const FeaturesHub = lazy(() => import('./pages/FeaturesHub'));

<Route path="/features" element={<FeaturesHub />} />
```

**Add Link in Header Navigation** pointing to `/features`

---

## SECTION 4: NFT-SPECIFIC FEATURES

### 4.1 Rental Dashboard

**File to Create**: `frontend/src/pages/RentalDashboard.jsx`

```javascript
import React, { useState } from 'react';
import RentalListing from '../components/Rental/RentalListing';
import RentalBrowser from '../components/Rental/RentalBrowser';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

export default function RentalDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">NFT Rental</h1>
      
      <Tabs>
        <TabList className="flex border-b border-gray-700 mb-8">
          <Tab>Browse Rentals</Tab>
          <Tab>My Rentals</Tab>
          <Tab>List for Rental</Tab>
        </TabList>
        
        <TabPanel>
          <RentalBrowser />
        </TabPanel>
        
        <TabPanel>
          <RentalListing />
        </TabPanel>
        
        <TabPanel>
          {/* Rental listing form */}
          <h2 className="text-2xl font-bold">List Your NFT for Rental</h2>
          {/* Add form component */}
        </TabPanel>
      </Tabs>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/rental" element={<RentalDashboard />} />
```

### 4.2 Auction Interface

**File to Create**: `frontend/src/pages/AuctionPage.jsx`

```javascript
import React, { useState } from 'react';
import AuctionForm from '../components/AuctionForm';
import AuctionResults from '../components/AuctionResults';
import AuctionTimer from '../components/AuctionTimer';

export default function AuctionPage() {
  const [activeAuctions, setActiveAuctions] = useState([]);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">NFT Auctions</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Create Auction</h2>
          <AuctionForm onSubmit={setActiveAuctions} />
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Active Auctions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAuctions.map(auction => (
              <div key={auction.id} className="bg-gray-900 p-4 rounded-lg">
                <AuctionTimer endTime={auction.endTime} />
                <AuctionResults auction={auction} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/nft/auction" element={<AuctionPage />} />
```

### 4.3 Lazy Minting Interface

**File to Create**: `frontend/src/pages/LazyMintPage.jsx`

```javascript
import React from 'react';
import LazyMintNFT from '../components/LazyMintNFT';

export default function LazyMintPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Lazy Mint NFT</h1>
        <p className="text-gray-400 mb-8">
          Create NFTs without paying gas fees. Pay only when someone buys your NFT!
        </p>
        <LazyMintNFT />
      </div>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/nft/lazy-mint" element={<LazyMintPage />} />
```

### 4.4 Batch Minting Interface

**File to Create**: `frontend/src/pages/BatchMintPage.jsx`

```javascript
import React from 'react';
import BatchMint from '../components/BatchMint';

export default function BatchMintPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Batch Mint NFTs</h1>
        <p className="text-gray-400 mb-8">
          Create multiple NFTs at once. Perfect for collections!
        </p>
        <BatchMint />
      </div>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/nft/batch-mint" element={<BatchMintPage />} />
```

---

## SECTION 5: LIQUIDITY & TRADING

### 5.1 Pool Management

**File to Create**: `frontend/src/pages/PoolDashboard.jsx`

```javascript
import React, { useState } from 'react';
import Pool from '../components/Pool'; // Pool components

export default function PoolDashboard() {
  const [tab, setTab] = useState('browse');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Liquidity Pools</h1>
      
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 ${tab === 'browse' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Browse Pools
        </button>
        <button
          onClick={() => setTab('create')}
          className={`px-4 py-2 ${tab === 'create' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Create Pool
        </button>
        <button
          onClick={() => setTab('swap')}
          className={`px-4 py-2 ${tab === 'swap' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Swap
        </button>
      </div>
      
      {tab === 'browse' && <Pool.Browser />}
      {tab === 'create' && <Pool.Creator />}
      {tab === 'swap' && <Pool.Swap />}
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/pool" element={<PoolDashboard />} />
```

### 5.2 Trading Interface

**File to Create**: `frontend/src/pages/AdvancedTradingPage.jsx`

```javascript
import React from 'react';
import AdvancedTradingInterface from '../components/AdvancedTradingInterface';

export default function AdvancedTradingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <AdvancedTradingInterface />
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/trading/advanced" element={<AdvancedTradingPage />} />
```

---

## SECTION 6: FINANCIAL FEATURES

### 6.1 Financing Dashboard

**File to Create**: `frontend/src/pages/FinancingDashboard.jsx`

```javascript
import React, { useState } from 'react';
import Financing from '../components/Financing'; // Financing components

export default function FinancingDashboard() {
  const [tab, setTab] = useState('browse');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">NFT Financing</h1>
      
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 ${tab === 'browse' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Browse Loans
        </button>
        <button
          onClick={() => setTab('myLoans')}
          className={`px-4 py-2 ${tab === 'myLoans' ? 'border-b-2 border-blue-500' : ''}`}
        >
          My Loans
        </button>
        <button
          onClick={() => setTab('apply')}
          className={`px-4 py-2 ${tab === 'apply' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Apply for Loan
        </button>
      </div>
      
      {tab === 'browse' && <Financing.Browser />}
      {tab === 'myLoans' && <Financing.MyLoans />}
      {tab === 'apply' && <Financing.LoanRequestForm />}
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/financing" element={<FinancingDashboard />} />
```

### 6.2 Staking Dashboard

**File to Create**: `frontend/src/pages/StakingDashboard.jsx`

```javascript
import React from 'react';
import Staking from '../components/Staking'; // Staking components

export default function StakingDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">NFT Staking</h1>
      <p className="text-gray-400 mb-8">
        Stake your NFTs to earn rewards
      </p>
      <Staking.Dashboard />
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/staking" element={<StakingDashboard />} />
```

---

## SECTION 7: GOVERNANCE & COMMUNITY

### 7.1 Governance Dashboard

**File to Create**: `frontend/src/pages/GovernanceDashboard.jsx`

```javascript
import React, { useState } from 'react';
import Governance from '../components/Governance'; // Governance components

export default function GovernanceDashboard() {
  const [tab, setTab] = useState('proposals');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Marketplace Governance</h1>
      
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('proposals')}
          className={`px-4 py-2 ${tab === 'proposals' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Active Proposals
        </button>
        <button
          onClick={() => setTab('create')}
          className={`px-4 py-2 ${tab === 'create' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Create Proposal
        </button>
        <button
          onClick={() => setTab('treasury')}
          className={`px-4 py-2 ${tab === 'treasury' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Treasury
        </button>
      </div>
      
      {tab === 'proposals' && <Governance.ProposalList />}
      {tab === 'create' && <Governance.ProposalForm />}
      {tab === 'treasury' && <Governance.Treasury />}
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/governance" element={<GovernanceDashboard />} />
```

### 7.2 Social Dashboard

**File to Create**: `frontend/src/pages/SocialDashboard.jsx`

```javascript
import React from 'react';
import SocialFeatures from '../components/SocialFeatures';
import Recommendations from '../components/Recommendations';

export default function SocialDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Community</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SocialFeatures />
        <Recommendations.Feed />
      </div>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/social" element={<SocialDashboard />} />
```

---

## SECTION 8: CREATOR FEATURES

### 8.1 Monetization Dashboard

**File to Create**: `frontend/src/pages/MonetizationDashboard.jsx`

```javascript
import React, { useState } from 'react';
import Monetization from '../components/Monetization'; // Monetization components

export default function MonetizationDashboard() {
  const [tab, setTab] = useState('earnings');
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Creator Monetization</h1>
      
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setTab('earnings')}
          className={`px-4 py-2 ${tab === 'earnings' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Earnings
        </button>
        <button
          onClick={() => setTab('tips')}
          className={`px-4 py-2 ${tab === 'tips' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Tips
        </button>
        <button
          onClick={() => setTab('subscriptions')}
          className={`px-4 py-2 ${tab === 'subscriptions' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setTab('merchandise')}
          className={`px-4 py-2 ${tab === 'merchandise' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Merchandise
        </button>
      </div>
      
      {tab === 'earnings' && <Monetization.EarningsBoard />}
      {tab === 'tips' && <Monetization.TipInterface />}
      {tab === 'subscriptions' && <Monetization.SubscriptionManager />}
      {tab === 'merchandise' && <Monetization.MerchandiseManager />}
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/features/monetization" element={<MonetizationDashboard />} />
```

---

## SECTION 9: OTHER FEATURES

### 9.1 Bridge Interface

**File to Create**: `frontend/src/pages/BridgePage.jsx`

```javascript
import React from 'react';
import Bridge from '../components/Bridge'; // Bridge components

export default function BridgePage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Cross-Chain Bridge</h1>
        <p className="text-gray-400 mb-8">
          Transfer your NFTs between different blockchain networks
        </p>
        <Bridge.Main />
      </div>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/bridge" element={<BridgePage />} />
```

### 9.2 Notifications Center

**File to Create**: `frontend/src/pages/NotificationCenter.jsx`

```javascript
import React from 'react';
import NotificationSystem from '../components/NotificationSystem';
import Notifications from '../components/Notifications'; // Notifications components

export default function NotificationCenter() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Notifications</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Notifications.Feed />
        <div className="lg:col-span-2">
          <NotificationSystem />
        </div>
      </div>
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/notifications" element={<NotificationCenter />} />
```

### 9.3 Wishlist View

**File to Create**: `frontend/src/pages/WishlistPage.jsx`

```javascript
import React from 'react';
import Wishlist from '../components/Wishlist'; // Wishlist components

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
      <Wishlist.Display />
    </div>
  );
}
```

**Add Route**:
```javascript
<Route path="/user/wishlist" element={<WishlistPage />} />
```

---

## SECTION 10: HEADER NAVIGATION UPDATES

**File**: `frontend/src/components/Header.jsx`

Add these navigation links:

```javascript
const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/explore', label: 'Explore' },
  { path: '/features', label: 'Features' },
  { path: '/create', label: 'Create' },
  { 
    label: 'Admin', 
    submenu: [
      { path: '/admin', label: 'Admin Panel' },
      { path: '/admin/dashboard', label: 'Dashboard' },
    ]
  },
  {
    label: 'Tools',
    submenu: [
      { path: '/nft/auction', label: 'Auctions' },
      { path: '/nft/lazy-mint', label: 'Lazy Mint' },
      { path: '/nft/batch-mint', label: 'Batch Mint' },
      { path: '/analytics/dashboard', label: 'Analytics' },
      { path: '/trading/advanced', label: 'Advanced Trading' },
    ]
  }
];
```

---

## SECTION 11: IMPLEMENTATION CHECKLIST

### Phase 1: Create All Dashboard Pages (2 days)
- [ ] AdminDashboard.jsx
- [ ] AnalyticsDashboard.jsx
- [ ] FeaturesHub.jsx
- [ ] RentalDashboard.jsx
- [ ] AuctionPage.jsx
- [ ] LazyMintPage.jsx
- [ ] BatchMintPage.jsx

### Phase 2: Create Financial Dashboard Pages (2 days)
- [ ] PoolDashboard.jsx
- [ ] FinancingDashboard.jsx
- [ ] StakingDashboard.jsx
- [ ] AdvancedTradingPage.jsx

### Phase 3: Create Community & Creator Pages (1 day)
- [ ] GovernanceDashboard.jsx
- [ ] SocialDashboard.jsx
- [ ] MonetizationDashboard.jsx
- [ ] BridgePage.jsx
- [ ] NotificationCenter.jsx
- [ ] WishlistPage.jsx

### Phase 4: Update Navigation & Routes (1 day)
- [ ] Add all routes to App.jsx
- [ ] Update Header navigation
- [ ] Test all links
- [ ] Verify no broken links

### Phase 5: Connect to Real Data (2-3 days)
- [ ] Replace mock data with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add WebSocket for real-time updates

### Phase 6: Testing & Polish (1-2 days)
- [ ] Test all pages
- [ ] Check mobile responsiveness
- [ ] Optimize performance
- [ ] Fix UI issues

---

## QUICK REFERENCE: Routes to Add

```javascript
// In App.jsx Routes section, add all these:

<Route path="/admin/dashboard" element={<AdminDashboard />} />
<Route path="/analytics/dashboard" element={<AnalyticsDashboard />} />
<Route path="/features" element={<FeaturesHub />} />
<Route path="/features/rental" element={<RentalDashboard />} />
<Route path="/features/staking" element={<StakingDashboard />} />
<Route path="/features/pool" element={<PoolDashboard />} />
<Route path="/features/financing" element={<FinancingDashboard />} />
<Route path="/features/governance" element={<GovernanceDashboard />} />
<Route path="/features/monetization" element={<MonetizationDashboard />} />
<Route path="/features/social" element={<SocialDashboard />} />
<Route path="/nft/auction" element={<AuctionPage />} />
<Route path="/nft/lazy-mint" element={<LazyMintPage />} />
<Route path="/nft/batch-mint" element={<BatchMintPage />} />
<Route path="/trading/advanced" element={<AdvancedTradingPage />} />
<Route path="/bridge" element={<BridgePage />} />
<Route path="/notifications" element={<NotificationCenter />} />
<Route path="/user/wishlist" element={<WishlistPage />} />
```

---

**Total Estimated Time**: 7-10 days  
**Team Size**: 2-3 frontend developers  
**Risk Level**: LOW (mostly UI integration)  
**Testing Required**: MEDIUM (routing and navigation)

