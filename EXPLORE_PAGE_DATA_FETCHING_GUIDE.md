# Explore Page Data Fetching Guide

## Overview
This document outlines the proper data fetching strategy for each section of the Explore page, including API endpoints, data structures, and implementation patterns.

---

## 1. Featured NFT Showcase

### Current Implementation
**File**: `frontend/src/components/Hero/FeaturedNFTShowcase.jsx`

### Data Fetching Strategy

#### Primary Endpoint
```
GET /api/v1/nft/featured-nfts?limit=4
```

#### Expected Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "nft-001",
      "name": "Victory of Olympus",
      "collectionName": "Ai Story",
      "image": "https://...",
      "price": 0.6,
      "priceUSD": 1500,
      "creator": {
        "_id": "user-001",
        "username": "Alexander Bias",
        "avatar": "https://..."
      },
      "likes": 245,
      "views": 1200,
      "isLiked": false,
      "rarity": "Rare",
      "floorPrice": 0.55
    },
    // ... more NFTs
  ]
}
```

#### Fallback Strategy (Current - Cascading)
1. Try `/api/v1/nft/featured-nfts?limit=4`
2. If fails, try `/api/v1/nft/trending?limit=4&filter=trending`
3. If fails, use mock data

#### Code Implementation
```javascript
const fetchFeaturedNFT = async () => {
  try {
    setLoading(true);
    // Try featured endpoint first
    const response = await nftAPI.get('/featured-nfts?limit=4');
    if (response.data && response.data.length > 0) {
      const featured = response.data[0];
      setFeaturedNFT(featured);
      setThumbnails(response.data.slice(1, 4));
    } else {
      throw new Error('No featured data');
    }
  } catch (error) {
    console.error('Error fetching featured NFT:', error);
    // Fallback to trending
    try {
      const response = await nftAPI.get('/trending?limit=4');
      if (response.data && response.data.length > 0) {
        setFeaturedNFT(response.data[0]);
        setThumbnails(response.data.slice(1, 4));
      } else {
        throw new Error('No trending data');
      }
    } catch (err) {
      // Use mock data
      const mockData = generateMockFeaturedNFT();
      setFeaturedNFT(mockData.featured);
      setThumbnails(mockData.thumbnails);
    }
  } finally {
    setLoading(false);
  }
};
```

#### Required Fields per NFT
- `_id` - Unique identifier
- `name` - NFT name/title
- `collectionName` - Collection name
- `image` - Image URL (recommended: 400x450px)
- `price` - Price in ETH/native token
- `priceUSD` - Price in USD
- `creator` - Creator info (username, avatar)
- `likes` - Like count
- `views` - View count
- `isLiked` - User has liked it
- `rarity` - Rarity tier

#### Refresh Rate
- Initial load: On component mount
- Manual refresh: User clicks refresh button (optional)
- Auto-refresh: Every 60 seconds (optional)

---

## 2. Top Creators Section

### Current Implementation
**File**: `frontend/src/components/TopCreators/TopCreators.jsx`

### Data Fetching Strategy

#### Endpoint
```
GET /api/v1/user/top-creators?limit=10&sortBy=volume&period=30d
```

#### Expected Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "creator-001",
      "username": "Kexyread",
      "avatar": "https://...",
      "walletAddress": "0x...",
      "followers": 5200,
      "volume": 124.5,
      "volumeUSD": 310000,
      "nftsMinted": 45,
      "nftsListed": 32,
      "floorPrice": 0.8,
      "isFollowing": false,
      "verificationStatus": "verified"
    },
    // ... more creators
  ],
  "totalCreators": 1000
}
```

#### Code Implementation
```javascript
const fetchTopCreators = async () => {
  try {
    setLoading(true);
    const response = await userAPI.get('/top-creators?limit=10&sortBy=volume');
    if (response.data && response.data.length > 0) {
      setCreators(response.data);
    } else {
      throw new Error('No creator data');
    }
  } catch (error) {
    console.error('Error fetching top creators:', error);
    setCreators(generateMockCreators());
  } finally {
    setLoading(false);
  }
};
```

#### Required Fields per Creator
- `_id` - Creator ID
- `username` - Creator username
- `avatar` - Avatar URL (recommended: 100x100px)
- `walletAddress` - Wallet address
- `followers` - Follower count
- `volume` - Trading volume (in ETH)
- `volumeUSD` - Trading volume (in USD)
- `nftsMinted` - Total NFTs minted
- `nftsListed` - Currently listed NFTs
- `verificationStatus` - "verified" | "unverified" | "pending"
- `isFollowing` - Is current user following

#### Display Format
- Grid layout: 5 columns
- Shows: Avatar, Name, Followers (K format), Volume (ETH), Link
- Example: "5.2K" followers, "124.5 ETH" volume

#### Refresh Rate
- Initial load: On component mount
- Auto-refresh: Every 120 seconds (2 minutes)

---

## 3. Real-Time Data Table

### Current Implementation
**File**: `frontend/src/components/RealTimeData/RealTimeDataTable.jsx`

### Data Fetching Strategy

#### Endpoint
```
GET /api/v1/user/top-creators?limit=8&includeMarketData=true
OR
GET /api/v1/analytics/market-data?limit=8&type=creators
```

#### Expected Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "market-001",
      "creator": "Edgar Sain",
      "floorPrice": 0.95,
      "floorPriceUSD": 2375,
      "price24h": 0.92,
      "changePercent24h": 3.26,
      "volume24h": 45.2,
      "volume7d": 280.5,
      "trend": [45, 52, 48, 61, 58, 72, 85],  // Last 7 data points
      "trendPercent": 88.9,
      "marketCap": 12500,
      "liquidity": 850.5,
      "floorPriceChange": 0.03
    },
    // ... more market data
  ],
  "timestamp": 1234567890,
  "marketTrend": [...]
}
```

#### Code Implementation
```javascript
useEffect(() => {
  fetchMarketData();
  // Refresh every 5 seconds for real-time feel
  const interval = setInterval(fetchMarketData, 5000);
  return () => clearInterval(interval);
}, []);

const fetchMarketData = async () => {
  try {
    setLoading(true);
    // Get top creators with market data
    const response = await userAPI.get('/top-creators?limit=8&includeMarketData=true');
    const data = response.data || generateMockData();
    
    setTableData(data);
    
    // Generate trend data for the right-side chart
    generateTrendData(data);
  } catch (error) {
    console.error('Error fetching market data:', error);
    setTableData(generateMockData());
  } finally {
    setLoading(false);
  }
};
```

#### Table Columns & Data Mapping
| Column | Data Field | Format | Example |
|--------|-----------|--------|---------|
| Creator | `creator` | String | "Edgar Sain" |
| Floor Price | `floorPrice` | Number (ETH) | "0.95 ETH" |
| 24H Price | `price24h` | Number (ETH) | "0.92 ETH" |
| Change % | `changePercent24h` | Percentage | "+3.26%" |
| 24H Vol | `volume24h` | Number (ETH) | "45.2 ETH" |
| 7D Vol | `volume7d` | Number (ETH) | "280.5 ETH" |
| Trend | `trend` | Array of numbers | [45, 52, 48, 61, 58, 72, 85] |

#### Trend Data (Right Side Chart)
```javascript
const generateTrendData = (data) => {
  // Aggregate trend data for market overview
  const trendPoints = data
    .flatMap(item => item.trend || [])
    .reduce((acc, val, idx) => {
      acc[idx % 7] = (acc[idx % 7] || 0) + val;
      return acc;
    }, []);
  
  setMarketTrendData(trendPoints.map((val, i) => ({
    time: `${i}d ago`,
    volume: val
  })));
};
```

#### Required Fields per Market Data Entry
- `creator` - Creator/collection name
- `floorPrice` - Minimum listing price
- `price24h` - Price 24h ago
- `changePercent24h` - Percentage change
- `volume24h` - 24-hour volume
- `volume7d` - 7-day volume
- `trend` - Array of 7 data points for sparkline
- `marketCap` - Market capitalization
- `liquidity` - Available liquidity

#### Refresh Rate
- Auto-refresh: Every 5 seconds
- Request timeout: 3 seconds

---

## 4. Top NFTs Carousel

### Current Implementation
**File**: `frontend/src/components/TopNFTs/TopNFTsCarousel.jsx`

### Data Fetching Strategy

#### Endpoint
```
GET /api/v1/nft/trending?limit=12&period=24h
OR
GET /api/v1/nft/popular?limit=12&sortBy=views
```

#### Expected Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "nft-carousel-001",
      "name": "Alexander's Collections",
      "collectionName": "Ai Story",
      "image": "https://...",
      "price": 0.55,
      "priceUSD": 1375,
      "creator": {
        "_id": "user-xyz",
        "username": "Alexander Bias",
        "avatar": "https://..."
      },
      "likes": 120,
      "sales24h": 5,
      "views24h": 450,
      "isLiked": false,
      "rarity": "Common"
    },
    // ... 12 total
  ]
}
```

#### Code Implementation
```javascript
const fetchTopNFTs = async () => {
  try {
    setLoading(true);
    const response = await nftAPI.get('/trending?limit=12&period=24h');
    setNfts(response.data || generateMockNFTs());
  } catch (error) {
    console.error('Error fetching top NFTs:', error);
    setNfts(generateMockNFTs());
  } finally {
    setLoading(false);
  }
};
```

#### Display Card Content
- Image (280x320px recommended)
- Price badge (top-right)
- Creator info (bottom)
- "View Details" button

#### Required Fields per NFT
- `_id` - NFT ID
- `name` - NFT name
- `collectionName` - Collection name
- `image` - Image URL
- `price` - Price in ETH
- `priceUSD` - Price in USD
- `creator` - Creator info (username, avatar)
- `likes` - Like count
- `isLiked` - Is liked by user
- `rarity` - Rarity tier

#### Refresh Rate
- Initial load: On component mount
- Auto-refresh: Every 60 seconds (optional)

---

## 5. Explore NFTs Grid (Tabbed)

### Current Implementation
**File**: `frontend/src/components/ExploreNFTs/ExploreNFTsGrid.jsx`

### Data Fetching Strategy

#### Endpoints by Tab
```
Latest:   GET /api/v1/nft/latest?page=1&limit=6&sortBy=createdAt
Trending: GET /api/v1/nft/trending?page=1&limit=6&sortBy=views
Featured: GET /api/v1/nft/featured?page=1&limit=6
```

#### Expected Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "nft-grid-001",
      "name": "Digital Artwork #1",
      "image": "https://...",
      "price": 0.75,
      "priceUSD": 1875,
      "creator": {
        "username": "Creator Name",
        "avatar": "https://..."
      },
      "likes": 85,
      "isLiked": false,
      "createdAt": "2026-01-15T10:30:00Z"
    },
    // ... 6 total per page
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "totalItems": 150,
    "itemsPerPage": 6
  }
}
```

#### Code Implementation
```javascript
const fetchNFTs = async () => {
  try {
    setLoading(true);
    let endpoint = '/trending';

    if (activeTab === 'latest') {
      endpoint = '/latest';
    } else if (activeTab === 'featured') {
      endpoint = '/featured';
    }

    const response = await nftAPI.get(
      `${endpoint}?page=${page}&limit=6`
    );
    
    setNfts(response.data || generateMockNFTs());
    if (response.pagination) {
      setTotalPages(response.pagination.totalPages);
    }
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    setNfts(generateMockNFTs());
  } finally {
    setLoading(false);
  }
};
```

#### Tab Filter Logic
```javascript
const tabs = [
  { id: 'latest', label: 'Latest', endpoint: '/latest', sortBy: 'createdAt' },
  { id: 'trending', label: 'Trending', endpoint: '/trending', sortBy: 'views' },
  { id: 'featured', label: 'Featured', endpoint: '/featured', sortBy: 'featured' }
];
```

#### Pagination
- Items per page: 6 (2 rows × 3 columns)
- URL parameter: `page=1` (1-indexed)
- Response includes: `totalPages`, `currentPage`, `totalItems`

#### Required Fields per NFT
- `_id` - NFT ID
- `name` - NFT name
- `image` - Image URL (recommended: 300x350px)
- `price` - Price in ETH
- `priceUSD` - Price in USD
- `creator` - Creator info
- `likes` - Like count
- `isLiked` - Is liked by user
- `createdAt` - Creation timestamp

#### Refresh Rate
- On tab change: Fetch immediately
- On page change: Fetch immediately
- Auto-refresh: Every 120 seconds per tab

---

## 6. Live Auctions Section

### Current Implementation
**File**: `frontend/src/components/LiveAuctions/LiveAuctions.jsx`

### Data Fetching Strategy

#### Endpoint
```
GET /api/v1/auction/active?limit=6&sortBy=endTime
OR
GET /api/v1/auctions?status=active&limit=6
```

#### Expected Response Structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "auction-001",
      "name": "Futuristic Artist Portrait",
      "nftId": "nft-xyz",
      "image": "https://...",
      "currentBid": 2.5,
      "currentBidUSD": 6250,
      "bidCount": 23,
      "minBid": 2.6,
      "minBidUSD": 6500,
      "creator": {
        "username": "Alexander Bias",
        "avatar": "https://..."
      },
      "endTime": "2026-01-22T15:30:00Z",
      "duration": 86400,
      "status": "active",
      "highestBidder": {
        "username": "Bidder Name",
        "avatar": "https://..."
      }
    },
    // ... 6 total
  ]
}
```

#### Code Implementation
```javascript
const fetchAuctions = async () => {
  try {
    setLoading(true);
    // Fetch active auctions
    const response = await nftAPI.get('/auctions?status=active&limit=6');
    setAuctions(response.data || generateMockAuctions());
  } catch (error) {
    console.error('Error fetching auctions:', error);
    setAuctions(generateMockAuctions());
  } finally {
    setLoading(false);
  }
};
```

#### Countdown Timer Logic
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    setAuctions(prev => prev.map(auction => ({
      ...auction,
      timeLeft: calculateTimeLeft(auction.endTime)
    })));
  }, 1000);
  
  return () => clearInterval(interval);
}, []);

const calculateTimeLeft = (endTime) => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false
  };
};
```

#### Display Format
- Countdown: `HH:MM:SS`
- Current Bid: "2.5 ETH" or "6250 USD"
- Bid Count: "23 bids"
- Status badge: "Live" (green pulsing indicator)

#### Required Fields per Auction
- `_id` - Auction ID
- `name` - Auction/NFT name
- `nftId` - Reference to NFT
- `image` - Image URL
- `currentBid` - Highest bid amount (ETH)
- `bidCount` - Number of bids placed
- `minBid` - Minimum bid to surpass current
- `creator` - Creator info
- `endTime` - Auction end timestamp (ISO 8601)
- `status` - "active" | "ended" | "pending"
- `highestBidder` - User info of highest bidder

#### Refresh Rate
- Auction data: Every 30 seconds (check for new bids)
- Countdown timer: Every 1 second (local calculation)
- Initial load: On component mount

#### Edge Cases
- Auction ended: Stop countdown, show final bid
- No bids placed: Show "No bids" and reserve price
- Expired auctions: Filter them out or show in different section

---

## API Request Configuration

### Base URLs
```javascript
// frontend/src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Create API instances
export const nftAPI = axios.create({
  baseURL: `${API_BASE_URL}/nft`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const userAPI = axios.create({
  baseURL: `${API_BASE_URL}/user`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const auctionAPI = axios.create({
  baseURL: `${API_BASE_URL}/auction`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Request Interceptors
```javascript
// Add authentication token to all requests
nftAPI.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling
nftAPI.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

---

## Error Handling Strategy

### Graceful Degradation
```javascript
const fetchDataWithFallback = async (primaryEndpoint, fallbackEndpoint, generateMock) => {
  try {
    const response = await nftAPI.get(primaryEndpoint);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    throw new Error('No data received');
  } catch (primaryError) {
    console.warn(`Primary endpoint failed: ${primaryError.message}`);
    
    try {
      const fallbackResponse = await nftAPI.get(fallbackEndpoint);
      return fallbackResponse.data || generateMock();
    } catch (fallbackError) {
      console.error(`Fallback endpoint failed: ${fallbackError.message}`);
      return generateMock();
    }
  }
};
```

### Common Error Codes
| Status | Handling |
|--------|----------|
| 400 | Bad request - validate parameters |
| 401 | Unauthorized - redirect to login |
| 403 | Forbidden - show permission error |
| 404 | Not found - use mock data |
| 429 | Rate limited - retry after 60s |
| 500 | Server error - use mock data, log error |
| Timeout | Use mock data, set retry flag |

---

## Caching Strategy

### Local Storage Cache
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getFromCache = (key) => {
  const cached = localStorage.getItem(`cache_${key}`);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(`cache_${key}`);
    return null;
  }
  
  return data;
};

const setCache = (key, data) => {
  localStorage.setItem(`cache_${key}`, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

// Usage in component
const fetchTopCreators = async () => {
  const cached = getFromCache('topCreators');
  if (cached) {
    setCreators(cached);
    return;
  }
  
  try {
    const response = await userAPI.get('/top-creators?limit=10');
    setCache('topCreators', response.data);
    setCreators(response.data);
  } catch (error) {
    setCreators(generateMockCreators());
  }
};
```

---

## Performance Optimizations

### 1. Request Batching
Combine multiple requests into one:
```javascript
// Instead of 6 separate requests, batch into 1-2 requests
const fetchAllExploreData = async () => {
  try {
    const [featured, creators, trending, auctions] = await Promise.all([
      nftAPI.get('/featured-nfts?limit=4'),
      userAPI.get('/top-creators?limit=10'),
      nftAPI.get('/trending?limit=12'),
      auctionAPI.get('/active?limit=6')
    ]);
    
    return { featured, creators, trending, auctions };
  } catch (error) {
    console.error('Batch fetch failed:', error);
  }
};
```

### 2. Lazy Loading
Load components only when visible:
```javascript
const LazyTopCreators = React.lazy(() => import('./TopCreators'));

<Suspense fallback={<div>Loading creators...</div>}>
  <LazyTopCreators />
</Suspense>
```

### 3. Pagination
```javascript
// Fetch only 6 NFTs per page, not all 150+
const response = await nftAPI.get('/trending?page=1&limit=6');
```

### 4. Debouncing
Debounce pagination changes:
```javascript
const debouncedFetch = useCallback(
  debounce((page) => fetchNFTs(page), 300),
  []
);

const handlePageChange = (newPage) => {
  setPage(newPage);
  debouncedFetch(newPage);
};
```

---

## Mock Data Generation (Fallback)

All components have built-in mock data generators that run when APIs fail:

- `generateMockFeaturedNFT()` - Featured NFT showcase
- `generateMockCreators()` - Top creators
- `generateMockData()` - Market data table
- `generateMockNFTs()` - Top NFTs carousel
- `generateMockAuctions()` - Live auctions

This ensures the UI is always functional even if backend is down.

---

## Testing API Endpoints

### Direct API Testing (in browser console)
```javascript
// Test Featured NFTs
fetch('http://localhost:3000/api/v1/nft/featured-nfts?limit=4')
  .then(r => r.json())
  .then(data => console.log(data));

// Test Top Creators
fetch('http://localhost:3000/api/v1/user/top-creators?limit=10')
  .then(r => r.json())
  .then(data => console.log(data));

// Test Auctions
fetch('http://localhost:3000/api/v1/auction/active?limit=6')
  .then(r => r.json())
  .then(data => console.log(data));
```

### Postman Collection
```json
{
  "info": { "name": "Explore Page API", "version": "1.0" },
  "item": [
    {
      "name": "Featured NFTs",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/nft/featured-nfts?limit=4"
      }
    },
    {
      "name": "Top Creators",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/user/top-creators?limit=10"
      }
    },
    {
      "name": "Market Data",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/user/top-creators?limit=8&includeMarketData=true"
      }
    },
    {
      "name": "Trending NFTs",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/nft/trending?limit=12"
      }
    },
    {
      "name": "Active Auctions",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/auction/active?limit=6"
      }
    }
  ]
}
```

---

## Summary Table

| Section | Endpoint | Refresh | Items | Parameters |
|---------|----------|---------|-------|-----------|
| Featured | `/nft/featured-nfts` | 60s | 4 | `limit=4` |
| Top Creators | `/user/top-creators` | 120s | 10 | `limit=10, sortBy=volume` |
| Market Data | `/user/top-creators` | 5s | 8 | `limit=8, includeMarketData=true` |
| Top NFTs | `/nft/trending` | 60s | 12 | `limit=12, period=24h` |
| Explore Grid | `/nft/{latest/trending/featured}` | Tab change | 6/page | `page, limit=6` |
| Live Auctions | `/auction/active` | 30s | 6 | `limit=6, sortBy=endTime` |

