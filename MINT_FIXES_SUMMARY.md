# Mint Button Fix - Summary

## Problem
The initial **"Mint"** button was only adding pieces to the database, not minting them on-chain. This meant:
1. Initial mint had DB entry but no on-chain NFT
2. When user bought "more pieces", the contract would mint to-chain
3. Any pieces from initial mint became useless until a subsequent purchase

All mints (initial and "buy more pieces") should trigger **on-chain lazy mint redemption** simultaneously.

## Solution

### 1. MintingHub - Fix Initial Mint Button
**File**: `frontend/src/pages/MintingHub.jsx`

Updated `handleMintSingle()` to detect lazy mint NFTs and trigger on-chain redemption:
- Detects lazy mint NFTs by checking `_id`, `price`, and `ipfsURI/metadataURI`
- Calls `/api/lazy-mint/{id}/redeem` to get voucher from backend
- Calls `MultiPieceLazyMintNFT.redeemListing()` on-chain with voucher signature
- Waits for transaction confirmation
- Calls `/api/lazy-mint/{id}/record-purchase` to sync backend after on-chain mint
- Shows progress bar (0-100%) during minting process
- Supports retry on failure (shows red progress bar with "Retry" button)

Updated `handleBatchMint()` to handle both lazy and regular NFTs:
- Separates lazy mints from regular mints
- Changes network once for all lazy mints
- Mints lazy NFTs on-chain, regular NFTs via backend endpoint
- Shows individual progress for each NFT
- Tracks success count and displays results

**Changes**:
- Added imports: `lazyMintAPI`, `getMultiPieceLazyMintContractWithSigner`, `changeNetwork`, `ethers`
- Single mint now triggers on-chain redemption with progress tracking
- Batch mint handles mixed types (lazy + regular)
- Failed mints show red progress bar with retry option

### 2. BuyMintPage - Already Supports On-Chain Mining
**File**: `frontend/src/pages/BuyMintPage.jsx`

The "Buy more pieces" flow (redirects to `/mint/{nftId}`) already had on-chain lazy mint redemption logic:
- `handlePrimaryAction()` checks `hasPiecesToMint` flag
- Gets voucher from `/api/lazy-mint/{id}/redeem`
- Calls `MultiPieceLazyMintNFT.redeemListing()` on-chain
- Records purchase via `/api/lazy-mint/{id}/record-purchase` with transaction hash

**No changes needed** — this endpoint already works correctly.

### 3. Backend - Lazy Mint Purchase Recording
**File**: `backend_temp/routes/lazyMint.js` and `backend_temp/controllers/nftController.js`

The backend already supports recording lazy mint purchases:
- `/api/lazy-mint/{id}/record-purchase` endpoint accepts `transactionHash`
- `recordLazyMintPurchase()` controller:
  - Verifies transaction receipt on-chain (checks status = 1)
  - Looks for `TransferSingle` event in receipt logs
  - Only updates DB after on-chain verification succeeds
  - Returns HTTP 202 (Pending) if receipt not available yet
  - Pending transfers are handled by background `pendingProcessor` service

**No changes needed** — backend already handles verification and async reconciliation.

## Data Flow

### Initial Mint (New User First Time)
```
User clicks "Mint Now" on MintingHub
    ↓
MintingHub.handleMintSingle()
    ↓ 
Check: is lazy mint? (has _id, price, ipfsURI)
    ↓
lazyMintAPI.redeem() → GET voucher + signature from /api/lazy-mint/{id}/redeem
    ↓
MultiPieceLazyMintNFT.redeemListing() → ON-CHAIN MINT (wallet prompt)
    ↓
tx.wait() → receipt with TransferSingle event
    ↓
lazyMintAPI.recordPurchase() → POST /api/lazy-mint/{id}/record-purchase + transactionHash
    ↓
Backend: recordLazyMintPurchase()
  - Verifies receipt (status = 1)
  - Checks TransferSingle event
  - Updates pieceHoldings: {wallet, itemId, pieces: qty}
  - Creates nftTradeModel entry
  - Returns 200 OK
    ↓
✅ Pieces now in DB + on-chain NFT + piece holdings recorded
```

### Buy More Pieces (User Already Has Initial Mint)
```
User clicks "Buy more pieces" on MyMintedNFTs
    ↓
Navigate to /mint/{nftId}
    ↓
BuyMintPage loads
    ↓
User clicks "Buy Now" (quantity selection available)
    ↓
handlePrimaryAction() → same flow as Initial Mint
    ↓
✅ Additional pieces minted on-chain + DB synced
```

### Buy at Market (Pieces from Liquidity Pool)
```
User clicks "Buy pieces" on NFT details / market page
    ↓
liquidityContract.buyPieces() → ON-CHAIN (wallet prompt)
    ↓
tx.wait() → receipt with TransferSingle event
    ↓
nftAPI.recordPoolPurchase() → POST /api/nfts/pool-purchase + transactionHash
    ↓
Backend: recordPoolPurchase()
  - Verifies receipt + TransferSingle event
  - Updates pieceHoldings: {wallet, itemId, pieces: +=qty}
  - Creates nftTradeModel entry
    ↓
✅ Pieces added to wallet (already minted from original lazy mint)
```

## Key Improvements

1. **Simultaneous On-Chain & DB Minting**: Initial mint now triggers on-chain redemption, not just DB insert
2. **Progress Tracking**: Users see real-time mint progress (0-100%)
3. **Failure Handling**: Failed mints show red indicator + retry button
4. **Batch Support**: Multiple lazy mints handled efficiently (one network change for all)
5. **Transaction Verification**: Backend verifies receipt + TransferSingle event before DB update
6. **Async Reconciliation**: Background `pendingProcessor` service handles late receipts (if receipt not available immediately)

## Testing Checklist

- [ ] Initial mint on MintingHub triggers on-chain transaction
- [ ] Progress bar shows 0-100% during mint
- [ ] Pieces appear in wallet on-chain (verify via `balanceOf` on NftPieces contract)
- [ ] Pieces appear in DB (pieceHoldings collection)
- [ ] "Buy more pieces" triggers on-chain redemption (via BuyMintPage)
- [ ] Batch mint handles 2+ lazy mints (all use same network change)
- [ ] Failed mints show red progress bar with retry option
- [ ] Retry on failed mint re-attempts the transaction
- [ ] Buy at market pool purchases still work (recordPoolPurchase)
- [ ] Sell to liquidity works with on-chain minted pieces

## Files Modified

1. **frontend/src/pages/MintingHub.jsx**
   - Updated `handleMintSingle()` for on-chain lazy mint
   - Updated `handleBatchMint()` for mixed lazy/regular NFTs
   - Added progress visualization with failure states
   - Added retry logic

**No other files modified** — backend and buy flows already supported on-chain minting.

## Deployment Notes

1. Ensure `VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS` is set for target network
2. Ensure backend `/api/lazy-mint/{id}/redeem` endpoint is accessible
3. Ensure `pendingProcessor.js` service is running (async receipt verification)
4. Test with small transaction amounts first
5. Monitor backend logs for verification errors

