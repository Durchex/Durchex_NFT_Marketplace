# Durchex Marketplace: Live Blockchain & Features Completion Analysis

**Goal:** Make the marketplace perform real blockchain actions (mint, list, buy, offers, auctions) and turn all Feature-section pages into live, integrated flows—on par with Rarible/OpenSea.

---

## 1. Executive Summary

| Area | Status | Gap |
|------|--------|-----|
| **Core minting** | Partial | Lazy mint + Buy&Mint work; direct mint per collection / factory not fully wired |
| **Listing** | Partial | `listNFT` exists (Context + marketplace contract); ListNft page is minimal and not aligned with “list my owned NFT” flow |
| **Buying (after listing)** | Partial | `buyNFT` in Context + NftDetailsPage; needs clear flow from Explore → Details → Buy and post-purchase sync |
| **Offers** | Backend exists | `/api/v1/offers`; Feature “Trading” page uses static data only |
| **Auctions** | Backend exists, not mounted | `backend_temp/routes/auction.js` exists but **not registered in server.js**; Feature “Auctions” page is static |
| **Feature-section pages** | Mostly static | Same layout as rest of site + wire to backend/contracts |
| **Notifications** | Placeholder | Page is ~empty; backend has `notification.js` |

---

## 2. Current State: What Works vs What’s Static

### 2.1 Core Marketplace Flows

- **Explore**
  - **Live:** `ExploreNFTsGrid` fetches NFTs via `nftAPI.getAllNftsByNetwork(network)` (backend DB).
  - **Static/mock:** `LiveAuctions` uses mock auctions derived from collections (no real auction API).
- **NFT details**
  - **Live:** `NftDetailsPage` loads NFT by id from backend, shows price, “Buy” opens flow; `OfferModal` / `SellModal` exist.
  - **Gap:** Buy flow uses `buyNFT` (marketplace contract); post-buy DB sync (owner update, delist) must be reliable.
- **Buy & Mint (lazy)**
  - **Live:** `BuyMintPage` + lazy-mint redeem (signature from backend, LazyMint contract); pay + mint in one tx.
- **Create**
  - **Live:** Create page has lazy mint, batch mint, collection creation; uses backend + LazyMint contract where applicable.
- **List NFT**
  - **Partial:** `ListNft` calls `listNFT(vendorNFTAddress, tokenId, price)` (Context → marketplace contract). Form is minimal (tokenId, price, image); no “select from my wallet/collection” flow.
- **My NFTs / Profile**
  - **Live:** Fetched from backend (user-nfts, collections, etc.).

### 2.2 Feature Section (Sidebar)

All under **Features** need:
1. **Same structure** as the rest of the site (e.g. shared layout: Header + main content; optionally same sidebar already used).
2. **Live data and actions** (no hardcoded arrays; use backend APIs and, where applicable, contracts).

| Page | Route | Current state | Backend | Contract | What’s needed |
|------|--------|----------------|---------|----------|----------------|
| **Trading** | `/features/trading` | Static “offers” array; Accept/Decline do nothing | `offerRouter` (`/api/v1/offers`) | Offer.sol / marketplace offers | Wire list/accept/decline offers to API + contract |
| **Auctions** | `/features/auction` | Static “auctions” array; Place Bid / Create do nothing | `auction.js` **not mounted** in server | Auction.sol | Mount auction routes; wire create/bid/settle to API + contract |
| **Rental** | `/features/rental` | Static rentalListings / myRentals | `rentalRouter` | ERC4907NFTRental / NFTRental | Wire browse/create/rent/return to API + contract |
| **Financing** | `/features/financing` | Static activeLoans; Repay does nothing | `financingRouter` | NFTFinancing.sol | Wire request/repay/loans list to API + contract |
| **Staking** | `/features/staking` | Static forms; “Stake” does nothing | (check if staking routes exist) | NFTStaking.sol | Add backend if missing; wire stake/unstake/rewards to API + contract |
| **Governance** | `/features/governance` | Static proposals; Vote does nothing | `governanceRouter` | (DAO/treasury) | Wire proposals/vote to API + contract |
| **Monetization** | `/features/monetization` | Static dashboard/table | `monetizationRouter` | CreatorMonetization.sol | Wire earnings/royalties/payouts to API + contract |
| **Analytics** | `/features/analytics` | Mock charts/data | `analyticsRouter` | — | Wire to real marketplace/chain analytics |
| **Bridge** | `/features/bridge` | Form only; “Bridge” does nothing | `bridgeRouter` | StargateNFTBridge.sol | Wire bridge flow to API + contract |
| **Notifications** | `/features/notifications` | Page almost empty | `notification.js` | — | Build UI and wire to notification API |

---

## 3. What It Takes for “Live Blockchain” Parity (OpenSea/Rarible Style)

### 3.1 Must Have (Core Marketplace)

1. **Minting**
   - Keep: Lazy mint (create → buy & mint) and batch mint as-is.
   - Complete: Any “direct mint” path (e.g. per collection / factory) so that minted tokens exist on-chain and are reflected in DB (contract address + tokenId stored).

2. **Listing**
   - **Flow:** User selects an NFT they own (from “My NFTs” or wallet) → sets price → calls `listNFT(contract, tokenId, price)` (and pays listing fee if any).
   - **ListNft page:** Replace minimal form with: “Select NFT from my collection” (or connect wallet and pick tokenId) → price input → list on marketplace contract; then backend/event indexer (if any) knows about listing for Explore/Details.

3. **Buying (after pieces are listed)**
   - **Flow:** Explore/Details → “Buy now” → `buyNFT(contract, itemId, price)` (or equivalent: itemId = listing id on marketplace contract) → on success, backend updates owner/delists (or sync via events).
   - **Ensure:** NftDetailsPage “Buy” uses the same contract + backend flow for **listed** (non–lazy-mint) NFTs; lazy-mint items continue to use BuyMintPage redeem flow.

4. **Offers**
   - **Backend:** Already have `/api/v1/offers` (offerRouter).
   - **Frontend:** Trading page (`AdvancedTrading`) should: list offers for user (received/sent), create offer (backend + contract if applicable), accept/decline (contract + backend).
   - **Contract:** Use existing Offer.sol / marketplace offer methods; link offerId and backend state.

5. **Auctions**
   - **Backend:** Mount `auction.js` in `server.js` (e.g. `app.use('/api/v1/auctions', auctionRouter)`).
   - **Contract:** Auction.sol — create auction, place bid, settle.
   - **Frontend:** Auctions page: list live auctions from API, “Place bid” / “Create auction” call API + contract; settle when ended.

### 3.2 Feature Pages: Same Structure + Live Data

- **Layout:** Use the same shell as Explore/Create/Profile (e.g. same Header, same sidebar, same content width).
- **Data:** No static arrays; every list (offers, auctions, rentals, loans, stakes, proposals, etc.) from backend (and, where applicable, contract reads).
- **Actions:** Every button (Accept, Bid, Rent, Repay, Stake, Vote, etc.) triggers API call + optional contract tx, then refresh or redirect.

### 3.3 Optional but Important for “Rival” Tier

- **Royalties:** Already have royalty routes + Royalties.sol / RoyaltyRegistry; ensure they’re used on primary sales and (if supported) secondary.
- **Analytics:** Real volume, floor, sales from DB/chain; replace mock data in Analytics dashboard.
- **Notifications:** Real-time or polling for sales, bids, offers, listings; wire notification API to Notifications page.
- **Search/filters:** Backend search exists; ensure Explore and Feature pages use it where relevant.

---

## 4. Breakdown of Tasks (Phased)

### Phase 1: Core Blockchain Flows (Mint, List, Buy)

| # | Task | Where | Effort |
|---|------|--------|--------|
| 1.1 | List flow: “Select my NFT” (from backend user-nfts or wallet) → set price → listNFT + backend record | ListNft.jsx, Context (listNFT), backend listing/order | M |
| 1.2 | Buy flow: Ensure NftDetailsPage “Buy” for already-listed NFTs calls buyNFT + backend update owner/delist | NftDetailsPage, Context (buyNFT), backend (update owner, delist) | S |
| 1.3 | After buy: Sync ownership in DB (owner update, listing removed); optional: indexer from contract events | backend nftController / orderRouter, NFT model | S |
| 1.4 | Direct mint (if used): Ensure mint tx stores contract + tokenId in DB and appears in Explore/My NFTs | Create/Studio, nftContractService, NFT model | M |

### Phase 2: Auctions (Live)

| # | Task | Where | Effort |
|---|------|--------|--------|
| 2.1 | Mount auction API in server.js | backend_temp/server.js, import auction.js | S |
| 2.2 | Fix auction.js to ESM if needed; ensure AuctionService + LazyNFTModel paths exist | backend_temp/routes/auction.js, services, models | S |
| 2.3 | Frontend: Auctions page — fetch auctions from `/api/v1/auctions`, create auction, place bid, settle | AuctionNFT.jsx, api.js (auctionAPI), contract (Auction.sol) | M |
| 2.4 | Explore “Live Auctions”: Replace mock data with real auction list from API | LiveAuctions.jsx | S |

### Phase 3: Trading (Offers)

| # | Task | Where | Effort |
|---|------|--------|--------|
| 3.1 | Frontend: Trading page — fetch offers (received/sent) from `/api/v1/offers`, create/accept/decline | AdvancedTrading.jsx, api.js (offers), Context (offer methods if any) | M |
| 3.2 | Wire accept/decline to contract (offerId) + backend | offerRouter, Offer.sol / marketplace | S |

### Phase 4: Feature Pages — Same Structure + Live

| # | Task | Where | Effort |
|---|------|--------|--------|
| 4.1 | Shared layout: Ensure all Feature pages use same layout as Explore (Header + main content; sidebar already global) | AdvancedTrading, AuctionNFT, RentalNFT, Financing, Staking, GovernanceDAO, MonetizationHub, AnalyticsDashboard, BridgeNFT, Notifications | S (per page) |
| 4.2 | Rental: Wire to rentalRouter (create-listing, place-bid, accept-bid, return, my-listings, my-rentals) | RentalNFT.jsx, api.js (rentalAPI) | M |
| 4.3 | Financing: Wire to financingRouter (request loan, repay, my loans) | Financing.jsx, api.js, NFTFinancing.sol | M |
| 4.4 | Staking: Add/integrate staking API; wire stake/unstake/rewards to contract + backend | Staking.jsx, backend staking routes (if any), NFTStaking.sol | M |
| 4.5 | Governance: Wire to governanceRouter (proposals list, create, vote) | GovernanceDAO.jsx, api.js | M |
| 4.6 | Monetization: Wire to monetizationRouter (earnings, royalties, payouts) | MonetizationHub.jsx, api.js | M |
| 4.7 | Analytics: Replace mock data with analytics API (volume, sales, trends) | AnalyticsDashboard.jsx, api.js (analytics) | M |
| 4.8 | Bridge: Wire to bridgeRouter + StargateNFTBridge contract | BridgeNFT.jsx, api.js, contract | M |
| 4.9 | Notifications: Build list/detail UI and wire to notification API | Notifications.jsx, api.js (notifications) | M |

### Phase 5: Polish and Parity

| # | Task | Where | Effort |
|---|------|--------|--------|
| 5.1 | Royalties: Ensure primary/secondary sales pay royalties (contract + backend) | Marketplace/LazyMint contracts, royaltyRouter | S–M |
| 5.2 | Search/filters: Use backend search in Explore and Feature pages where relevant | Explore, SearchPage, searchRouter | S |
| 5.3 | Notifications: Real-time (e.g. socket) or polling for key events | socketService, Notifications.jsx, backend | M |

---

## 5. File / Route Checklist

### 5.1 Backend routes to mount or verify

- [ ] **Auction:** `backend_temp/routes/auction.js` — **not** in server.js; add `app.use('/api/v1/auctions', auctionRouter)` (and fix to ESM if needed).
- [ ] **Offers:** `offerRouter` already at `/api/v1/offers` — confirm endpoints match frontend (list by NFT, create, accept, decline).
- [ ] **Rental, Financing, Governance, Monetization, Analytics, Bridge, Notifications:** Already mounted; confirm paths and payloads match future frontend.

### 5.2 Frontend API layer

- [ ] Add or extend **auctionAPI** in api.js (list, create, bid, settle).
- [ ] Add or extend **offers** usage in api.js for Trading page (list, create, accept, decline).
- [ ] Add **rentalAPI**, **financingAPI**, **governanceAPI**, **monetizationAPI**, **notificationsAPI** (or equivalent) and use them in the corresponding Feature pages.

### 5.3 Contracts (reference)

- **NFTMarketplace.sol** — listNFT, buyNFT, delistNFT, offers.
- **LazyMintNFT.sol** — redeem (buy & mint).
- **Auction.sol** — create, bid, settle.
- **Offer.sol** — offers.
- **ERC4907NFTRental.sol / NFTRental.sol** — rental.
- **NFTFinancing.sol** — loans.
- **NFTStaking.sol** — stake/unstake/rewards.
- **CreatorMonetization.sol** — creator payouts.
- **StargateNFTBridge.sol** — bridge.

---

## 6. Suggested Order of Work

1. **Phase 1** — List/Buy and ownership sync (so “buy after pieces are listed” is solid).
2. **Phase 2** — Mount auctions and wire Auctions page + Live Auctions section.
3. **Phase 3** — Wire Trading (offers) page.
4. **Phase 4** — Feature pages: same structure first, then wire Rental, Financing, Staking, Governance, Monetization, Analytics, Bridge, Notifications one by one.
5. **Phase 5** — Royalties, search, notifications polish.

This order gets core marketplace behavior live first, then adds auctions and offers, then makes every Feature page consistent and functional so the site can rival Rarible/OpenSea in scope and clarity.
