# Durchex Marketplace — What’s Next (Remaining Work)

This doc lists **what’s still not done** so the marketplace can run fully on blockchain and match the planned feature set.

---

## 1. Already Done (Summary)

- **Phase 1:** List flow — ListNft page: select your NFT, set price, `listNFT` + `changeNetwork`.
- **Phase 2:** Auction API mounted at `/api/v1/auctions`; AuctionNFT + LiveAuctions use live API.
- **Phase 3:** Trading (offers) — AdvancedTrading wired to `/api/v1/offers` (list, create, accept, reject).
- **Phase 4 (partial):** Rental + Financing — RentalNFT and Financing use Header, `rentalAPI` and `financingAPI`; create listing / request loan / repay wired.

---

## 2. Core Blockchain Gaps (Must-Have for “Running on Blockchain”)

### 2.1 Post‑buy DB sync

- **Issue:** After `buyNFT` succeeds on-chain, the backend must update owner and delist so Explore/Details stay correct.
- **Current:** `NftInfo2` has `updateNftOwner` in a *separate* flow (seller confirm transfer). **NFTCard, CartDrawer, ShoppingCart, BuyMintPage** call `buyNFT` but do **not** consistently call `nftAPI.updateNftOwner` (and backend delist) after a successful purchase.
- **Todo:**
  - In **Context** (after `buyNFT` tx confirms): call `nftAPI.updateNftOwner({ network, itemId, tokenId, newOwner: buyer, listed: false })` and any backend “delist”/order-complete endpoint.
  - Or ensure every Buy button path (NftDetailsPage/NftInfo2, NFTCard, Cart, BuyMintPage) calls `updateNftOwner` + delist after success so DB and UI stay in sync.

### 2.2 Auctions — on-chain bid and settle ✅

- **Done:** `placeAuctionBid`, `settleAuction` in Context; AuctionNFT page has Place Bid (modal) and Settle when ended. Uses `getAuctionContract(network)` when `VITE_APP_AUCTION_CONTRACT_ADDRESS` (or `_POLYGON` etc.) is set.

### 2.3 Offers — on-chain accept ✅

- **Done:** `acceptOfferOnChain(network, contractOfferId)` in Context. AdvancedTrading calls it when offer has `contractOfferId`/`onChainOfferId` and `hasOfferContract(network)`, then syncs via `offerAPI.accept`. Set `VITE_APP_OFFER_CONTRACT_ADDRESS` for the chain.

### 2.4 Rental / Financing — contract calls

- **Rental:** Context has `placeRentalBidOnChain`, `acceptRentalBidOnChain`, `returnRentalNftOnChain`; RentalNFT page does not call them yet (backend listing IDs may not match contract). Wire when listing IDs align; set `VITE_APP_RENTAL_CONTRACT_ADDRESS`.
- **Financing ✅:** Context has `createLoanOnChain`, `repayLoanOnChain`. Financing page calls them when `hasFinancingContract(network)`; set `VITE_APP_FINANCING_CONTRACT_ADDRESS`.

---

## 3. Feature Pages Still Static (No Live API / No Header)

| Page | Route | Status | Backend | What’s needed |
|------|--------|--------|---------|----------------|
| **Bridge** | `/features/bridge` | Form only; “Bridge” does nothing | `bridgeRouter` at `/api/v1/bridge` | Add Header; add `bridgeAPI` in api.js; wire form to `POST /bridge/initiate` (auth = wallet); optionally show status/history from backend; later: StargateNFTBridge contract. |
| **Staking** | `/features/staking` | Static forms; “Stake” does nothing | **No staking router** (only `StakingService.js` exists) | Add Header; create `backend_temp/routes/staking.js` (ESM) that uses StakingService (or ESM equivalent); add `stakingAPI`; wire Stake/Unstake/Rewards to API + NFTStaking contract. |
| **Governance** | `/features/governance` | Static proposals; Vote does nothing | `governanceRouter` at `/api/v1/governance` | Add Header; add `governanceAPI` (proposals list, create, vote, treasury); wire GovernanceDAO to API; optionally DAO/treasury contract for execution. |
| **Monetization** | `/features/monetization` | Static dashboard | `monetizationRouter` at `/api/v1/monetization` | Add Header; add `monetizationAPI` (earnings, royalties, payouts, stats); wire MonetizationHub to API; optionally CreatorMonetization contract. |
| **Analytics** | `/features/analytics` | Mock charts/data | `analyticsRouter` at `/api/v1/analytics` | Add Header (if missing); add `analyticsAPI` (marketplace-stats, volume-trends, trending-collections, etc.); replace mock data in AnalyticsDashboard with API. |
| **Notifications** | `/features/notifications` | Page almost empty | `notification.js` exists but **not mounted** in server.js; uses CommonJS + userId auth | Convert notification to ESM and mount; or add new ESM notification router; add `notificationsAPI`; build Notifications list/detail UI and wire to API. |

---

## 4. Backend Gaps

- **Staking:** No route file. Add `routes/staking.js` (ESM), expose e.g. stake, unstake, rewards, my-stakes; mount in server as `/api/v1/staking`. StakingService is CommonJS — either convert or wrap in ESM route.
- **Notifications:** `notification.js` is CommonJS and not imported in `server.js`. Either convert to ESM and mount at e.g. `/api/v1/notifications`, or create a new ESM notification router that matches the frontend (e.g. by wallet or user id).
- **Financing:** Backend expects `req.app.locals.financingService`. Ensure server.js sets `app.locals.financingService` when the app boots so financing routes don’t 500.

---

## 5. Contract Wiring (Reference)

These contracts exist in the plan; wiring means frontend (and optionally backend) call them and sync state:

- **NFTMarketplace.sol** — listNFT, buyNFT, delistNFT ✅ used; ensure post-buy owner/delist sync.
- **LazyMintNFT.sol** — redeem (buy & mint) ✅ used.
- **Auction.sol** — create, bid, settle ❌ not wired from frontend.
- **Offer.sol / marketplace offers** — accept/decline ❌ only backend; need on-chain accept.
- **ERC4907NFTRental / NFTRental** — rent/return ❌ not wired.
- **NFTFinancing.sol** — request loan, repay ❌ not wired.
- **NFTStaking.sol** — stake/unstake/rewards ❌ not wired.
- **CreatorMonetization.sol** — payouts ❌ not wired.
- **StargateNFTBridge.sol** — bridge ❌ not wired.

---

## 6. Suggested Order of Work (What’s Next)

**Critical (do first)**  
1. **Buy/Mint price bug** — ✅ Fixed: `buyNFT` now treats the price argument as ETH (not wei), rejects MongoDB _id as price, and uses `parseEther(priceEth)` for `value` so the wallet shows the correct amount.  
2. **Post-buy sync** — Context already calls `nftAPI.updateNftOwner` after `buyNFT` success. Ensure backend `updateNftOwner` and any delist logic accept the payload (network, itemId, tokenId, newOwner, listed) and that all buy paths (Cart, NFTCard, NftInfo2, BuyMintPage) go through this flow or equivalent.  
3. **Lazy mint contract per network** — Set `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS` (and `_BASE`, `_POLYGON`, etc. if used) so Buy & Mint works on every target network.  
4. **Sell flow** — Dedicated Sell modal/flow (separate from Buy/Make Offer): list for sale, optional auction/offer, and backend + contract sync.  
5. **Quantity and multi-piece** — Let users choose how many pieces to buy/mint; price × quantity; do not delist the whole listing when only some pieces are sold; keep creator ownership for royalties.  

**Feature pages (live API + Header)**  
6. **Bridge** — Header + `bridgeAPI` + wire form to `/bridge/initiate`; status/history; then Stargate/bridge contract if applicable.  
7. **Staking** — Staking router (ESM) + mount; `stakingAPI`; Staking page: stake/unstake/rewards from API + NFTStaking contract.  
8. **Governance** — Header + `governanceAPI`; proposals list, create, vote from API.  
9. **Monetization** — Header + `monetizationAPI`; MonetizationHub earnings/payouts from API.  
10. **Analytics** — Header (if missing) + `analyticsAPI`; replace mock data in AnalyticsDashboard.  
11. **Notifications** — ✅ ESM router + mount + `notificationsAPI` + Notifications UI (done).  

**On-chain (already wired where noted)**  
12. **Auctions** — ✅ Place Bid + Settle in Context; AuctionNFT page uses them.  
13. **Offers** — ✅ Accept on-chain in Context; AdvancedTrading uses it.  
14. **Financing** — ✅ Create/repay loan on-chain; Financing page uses them.  
15. **Rental** — Context has place/accept/return; wire Rental page when listing IDs align with contract.  

**Polish and ops**  
16. **Marketplace fee automation** — On sale: deduct fee, credit seller, credit marketplace wallet; admin view for fee % and payouts.  
17. **Network in creation form** — Selected network saved to DB and shown on NFT detail/listing.  
18. **Wallet UX** — Signing and network switch open wallet the same way as Connect Wallet; handle Edge and timeouts.  

This order gets the marketplace **fully operational**: fix buy/mint and sell, then feature pages and on-chain flows, then fees and UX.
