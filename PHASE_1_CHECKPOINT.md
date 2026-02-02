# Phase 1 Checkpoint — Smart Contract Foundation

**Status**: Complete (checkpoint verified)  
**Date**: February 2026

---

## Summary

Phase 1 delivers the smart contract layer and backend integration so the marketplace can mint and track NFTs on-chain.

---

## Delivered

### Smart contracts
- **NFTCollectionFactory.sol** — Factory for permissionless collection creation; clones DurchexNFT per collection.
- **DurchexNFT.sol** — ERC-721 with EIP-2981 royalties, minting, batch minting, enumerable.

### Backend
- **NFTContractService.js** — Factory deployment, on-chain minting, multi-network support.
- **NFT model** — `contractAddress`, `tokenId`, `chainSpecificData`, `pieces`, `remainingPieces`, listing request fields.
- **Collection model** — Deployment tracking per chain.
- **nftController** — `updateNftOwner` with post-buy sync: owner update, `remainingPieces` decrement, `currentlyListed` when stock reaches 0.
- **createNft** — Auto-mint when contract is provided; DB updated with on-chain data.

### Frontend (Task 7 & 8)
- **NFTCard** — On-chain badge (network), pieces display (X/Y), Sold Out badge, Buy disabled when sold out.
- **NftDetailsPage** — Stock (remaining/total pieces), Sold Out state, metadata URI (EIP-721/IPFS) link.

### Phases 3 & 4 (this session)
- **Purchase flow** — Backend `updateNftOwner` decrements `remainingPieces`, sets `currentlyListed` to false when last piece sold.
- **Re-list** — My NFTs: “Re-list” for owned unlisted NFTs; modal submits listing request via existing API.
- **Stock display** — NFTCard and NftDetailsPage show pieces and Sold Out as above.

---

## How to verify

1. **Contracts**
   - `npx hardhat compile` — compiles without errors.
   - `npx hardhat run scripts/deployToSepolia.js --network sepolia` — deploys and mints (with env set).

2. **Backend**
   - Start backend; `POST /nft/nfts/update-owner` with `{ network, itemId, newOwner, listed }` updates owner and decrements `remainingPieces` when present.

3. **Frontend**
   - Run `npm run dev` in `frontend`; open Explore/Details.
   - NFTCard shows network badge and pieces when data has `pieces`/`remainingPieces`.
   - NftDetailsPage shows Stock and Sold Out when applicable; metadata URI link when `metadataURI` is set.
   - Profile → My NFTs: Re-list opens modal and submits listing request.

---

## Next (Phase 2+)

- Phase 2 (UI integration) — Done (FeaturesHub, routes, navigation).
- Phase 3 — Purchase sync and Re-list — Done this session.
- Phase 4 — Stock display on cards/details — Done; optional: collection stats (floor excluding sold out), Explore filter for sold out.

---

**Checkpoint**: Phase 1 smart contract foundation and post-buy/stock/relist behavior are in place and verifiable as above.
