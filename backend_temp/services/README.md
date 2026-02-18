Transfer event indexer and pending-transaction processor

1) Transfer indexer

Runs a scan over an `NftPieces` contract and upserts `pieceHoldings` from on-chain balances.

Usage:

```bash
MONGODB_URI="<your mongo uri>" RPC_URL="https://mainnet.base.org" \
  node backend_temp/services/transferIndexer.js https://mainnet.base.org 0xYourPiecesAddress 5000 0
```

2) Pending transaction processor

Background service that checks pending transactions recorded by the API and applies DB updates when receipts/events are observed.

Usage:

```bash
MONGODB_URI="<your mongo uri>" node backend_temp/services/pendingProcessor.js
```

Notes

- Both scripts use environment variables `MONGODB_URI` (or `DATABASE`) and `RPC_URL` if not passed on the command line.
- These are simple reference implementations. For production, run behind a process manager, persist pending records in a durable store, and use WebSocket RPC providers for real-time events where possible.