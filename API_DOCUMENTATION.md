# Durchex NFT Marketplace - Comprehensive API Documentation

## Overview

Durchex is a decentralized NFT marketplace with advanced features including:
- NFT minting, trading, and management
- Cross-chain bridge for multi-blockchain support
- NFT rental system with time-based leasing
- Liquidity pools with AMM
- Advanced NFT financing with collateral
- Creator monetization (tips, subscriptions, merchandise)
- Community governance and DAO
- Security & compliance (KYC, AML)
- Performance optimization and monitoring

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.durchex.com/api/v1` |
| Staging | `https://staging-api.durchex.com/api/v1` |
| Development | `http://localhost:3000/api/v1` |

## Authentication

### JWT Token
All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Get Token
```http
POST /user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "address": "0x...",
    "email": "user@example.com"
  }
}
```

## API Endpoints

### 1. User Management (`/user`)

#### Register User
```http
POST /user/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "walletAddress": "0x..."
}
```

#### Get User Profile
```http
GET /user/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "bio": "NFT collector",
  "avatar": "https://..."
}
```

### 2. NFT Management (`/nft`)

#### Mint NFT
```http
POST /nft/mint
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Cool NFT",
  "description": "A cool collectible",
  "imageUrl": "https://...",
  "properties": {
    "rarity": "rare",
    "collection": "Genesis"
  },
  "royaltyPercentage": 10,
  "supply": 1
}
```

#### List NFT for Sale
```http
POST /nft/list
Authorization: Bearer <token>
Content-Type: application/json

{
  "nftId": "nft-123",
  "price": "1.5",
  "currency": "ETH",
  "duration": 30
}
```

#### Get NFT Details
```http
GET /nft/details/{nftId}
```

#### Get User's NFTs
```http
GET /nft/user/collection
Authorization: Bearer <token>
```

### 3. Marketplace (`/orders`, `/offers`)

#### Create Offer
```http
POST /offers/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "nftId": "nft-123",
  "price": "0.5",
  "expiryDate": "2024-12-31T23:59:59Z"
}
```

#### Accept Offer
```http
POST /offers/{offerId}/accept
Authorization: Bearer <token>
```

#### Get Active Orders
```http
GET /orders/active?limit=20&offset=0
```

### 4. Search & Discovery (`/search`)

#### Search NFTs
```http
GET /search/nfts?q=crypto&limit=50&offset=0
```

#### Advanced Filters
```http
GET /search/filter?
  collectionId=coll-123&
  minPrice=0.1&
  maxPrice=100&
  properties={"rarity":"rare"}
```

### 5. Analytics (`/analytics`)

#### Dashboard Stats
```http
GET /analytics/dashboard
```

Response:
```json
{
  "success": true,
  "data": {
    "totalVolume": "1000000",
    "floorPrices": {...},
    "trendingCollections": [...],
    "recentTransactions": [...]
  }
}
```

#### Portfolio Analysis
```http
GET /analytics/portfolio?address=0x...
```

### 6. Cross-Chain Bridge (`/bridge`)

#### Get Supported Chains
```http
GET /bridge/chains
```

#### Transfer Between Chains
```http
POST /bridge/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromChain": "ethereum",
  "toChain": "polygon",
  "tokenAddress": "0x...",
  "amount": "100",
  "recipientAddress": "0x..."
}
```

#### Get Bridge Status
```http
GET /bridge/transfer/{transactionHash}
```

### 7. NFT Rental (`/rental`)

#### List NFT for Rental
```http
POST /rental/list
Authorization: Bearer <token>
Content-Type: application/json

{
  "nftId": "nft-123",
  "dailyRentalPrice": "0.1",
  "maxDuration": 30
}
```

#### Rent NFT
```http
POST /rental/rent
Authorization: Bearer <token>
Content-Type: application/json

{
  "rentalId": "rental-123",
  "duration": 7
}
```

#### Return Rental
```http
POST /rental/{rentalId}/return
Authorization: Bearer <token>
```

### 8. Liquidity Pools (`/pool`)

#### Create Pool
```http
POST /pool/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "tokenA": "0x...",
  "tokenB": "0x...",
  "amountA": "100",
  "amountB": "100",
  "feeTier": 0.01
}
```

#### Add Liquidity
```http
POST /pool/liquidity/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "poolId": "pool-123",
  "amountA": "50",
  "amountB": "50"
}
```

#### Swap Tokens
```http
POST /pool/swap
Authorization: Bearer <token>
Content-Type: application/json

{
  "poolId": "pool-123",
  "tokenIn": "0x...",
  "amountIn": "10",
  "minAmountOut": "9.5"
}
```

### 9. NFT Financing (`/financing`)

#### Create Loan Request
```http
POST /financing/loans/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "nftId": "nft-123",
  "loanAmount": "100",
  "term": 30,
  "interestRate": 5
}
```

#### Repay Loan
```http
POST /financing/loans/{loanId}/repay
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": "105"
}
```

### 10. Creator Monetization (`/monetization`)

#### Send Tip
```http
POST /monetization/tips/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientAddress": "0x...",
  "amount": "0.5",
  "message": "Great work!"
}
```

#### Subscribe to Creator
```http
POST /monetization/subscriptions/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "tierId": "tier-123"
}
```

#### Create Merchandise
```http
POST /monetization/merchandise/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "T-Shirt",
  "price": "29.99",
  "imageUrl": "https://...",
  "stock": 100
}
```

### 11. Governance (`/governance`)

#### Create Proposal
```http
POST /governance/proposals/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Update Fee Structure",
  "description": "Proposal to reduce marketplace fees",
  "proposalType": "PARAMETER_CHANGE",
  "targetAmount": "1000"
}
```

#### Cast Vote
```http
POST /governance/votes/cast
Authorization: Bearer <token>
Content-Type: application/json

{
  "proposalId": "prop-123",
  "support": 1,
  "reason": "I support this proposal"
}
```

#### Delegate Votes
```http
POST /governance/delegation/delegate
Authorization: Bearer <token>
Content-Type: application/json

{
  "delegateAddress": "0x..."
}
```

### 12. Compliance (`/compliance`)

#### Initiate KYC
```http
POST /compliance/kyc/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "country": "US"
}
```

#### Get KYC Status
```http
GET /compliance/kyc/status
Authorization: Bearer <token>
```

#### Screen Transaction (AML)
```http
POST /compliance/aml/screen
Content-Type: application/json

{
  "fromAddress": "0x...",
  "toAddress": "0x...",
  "amount": "100",
  "transactionHash": "0x..."
}
```

### 13. Performance (`/performance`)

#### Cache Statistics
```http
GET /performance/cache/stats
Authorization: Bearer <token> (Admin)
```

#### Performance Metrics
```http
GET /performance/metrics
Authorization: Bearer <token> (Admin)
```

#### Get Performance Recommendations
```http
GET /performance/recommendations
Authorization: Bearer <token> (Admin)
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_INPUT | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

## Rate Limiting

API requests are limited per IP address:

- **Free Tier**: 100 requests/minute
- **Pro Tier**: 1000 requests/minute
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Pagination

List endpoints support pagination:

```http
GET /nft/collection?limit=20&offset=40
```

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 40,
    "total": 1000,
    "hasMore": true
  }
}
```

## WebSocket Events

Connect to real-time updates:

```javascript
const socket = io('https://api.durchex.com');

// Listen for NFT price updates
socket.on('nft_price_update', (data) => {
  console.log('Price updated:', data);
});

// Listen for order fills
socket.on('order_filled', (order) => {
  console.log('Order filled:', order);
});
```

## Code Examples

### JavaScript / Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.durchex.com/api/v1'
});

// Login
async function login(email, password) {
  const res = await client.post('/user/login', { email, password });
  return res.data.token;
}

// Mint NFT
async function mintNFT(token, nftData) {
  const res = await client.post('/nft/mint', nftData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
```

### Python

```python
import requests

BASE_URL = "https://api.durchex.com/api/v1"

def login(email, password):
    res = requests.post(f"{BASE_URL}/user/login", json={
        "email": email,
        "password": password
    })
    return res.json()['token']

def mint_nft(token, nft_data):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/nft/mint", json=nft_data, headers=headers)
    return res.json()
```

## Webhooks

Register webhooks for real-time event notifications:

```http
POST /user/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://yourserver.com/webhook",
  "events": ["nft.listed", "nft.sold", "order.created"]
}
```

## API SDK

Official SDKs available:

- **JavaScript**: `npm install @durchex/sdk`
- **Python**: `pip install durchex-sdk`
- **Go**: `go get github.com/durchex/sdk-go`

## Support

- **Documentation**: https://docs.durchex.com
- **Discord**: https://discord.gg/durchex
- **Email**: support@durchex.com
- **Status Page**: https://status.durchex.com

---

**API Version**: 1.0.0  
**Last Updated**: January 2024  
**OpenAPI Spec**: https://api.durchex.com/docs/openapi.json
