# On-Chain NFT Pieces & Liquidity

Everything for **pieces** (editions) and **buy/sell liquidity** is on-chain so creators can list from any marketplace or bridge without depending on our backend.

## Contracts

### 1. **INftPieces** (`contracts/interfaces/INftPieces.sol`)

Interface for the ERC-1155 pieces contract:

- `getPieceId(nftContract, nftTokenId)` → piece id (0 if not registered)
- `registerAndMint(nftContract, nftTokenId, creator, totalPieces)` → piece id (only callable by liquidity contract)
- `balanceOf(account, pieceId)`, `totalSupply(pieceId)`, `safeTransferFrom`, `setApprovalForAll`, `isApprovedForAll`

### 2. **INftLiquidity** (`contracts/interfaces/INftLiquidity.sol`)

Interface for the liquidity (AMM-style) contract:

- **createPool**(nftContract, nftTokenId, totalPieces, buyPricePerPiece, sellPricePerPiece, initialReserve)  
  Registers the NFT as pieces (if not already), mints `totalPieces` to the liquidity contract, creates a pool with buy/sell prices. `initialReserve` (msg.value) is kept to pay sellers.
- **buyPieces**(pieceId, quantity) payable  
  Buyer pays `quantity * buyPricePerPiece`; receives pieces. Platform fee + EIP-2981 royalty sent out; rest to creator (minus reserve retention).
- **sellPieces**(pieceId, quantity)  
  Seller sends `quantity` pieces to the pool; receives `quantity * sellPricePerPiece` minus fee and royalty (from contract reserve).
- **getPoolInfo**(pieceId), **getBuyQuote**(pieceId, quantity), **getSellQuote**(pieceId, quantity)

**Events:**

- `Trade(pieceId, buyer, seller, quantity, pricePerPiece, totalAmount, platformFee, royaltyAmount, tradeType, timestamp)`  
  Emit on every buy/sell so indexers (and other marketplaces) can build transaction history, volume, and market cap.
- `LiquidityUpdated(pieceId, newReserveBalance, newPiecesInPool, newBuyPricePerPiece, newSellPricePerPiece, timestamp)`
- `PoolCreated(pieceId, nftContract, nftTokenId, creator, totalPieces, buyPricePerPiece, sellPricePerPiece)`

### 3. **NftPieces** (`contracts/NftPieces.sol`)

ERC-1155 implementation:

- One **piece id** per `(nftContract, nftTokenId)`.
- Only the **liquidity contract** (set by owner) can call `registerAndMint`; it mints `totalPieces` to itself (the liquidity contract) so the pool holds the primary supply.
- `getPieceId`, `totalSupply(pieceId)`, owner can `setLiquidityContract`, `setURI`.

### 4. **NftLiquidity** (`contracts/NftLiquidity.sol`)

Implementation of `INftLiquidity`:

- **createPool**: Calls `piecesContract.registerAndMint(...)` so pieces are minted to this contract; stores pool (creator, totalPieces, piecesInPool, reserveBalance, buyPricePerPiece, sellPricePerPiece).
- **buyPieces**: Transfers pieces from this contract to buyer; splits payment: platform fee → `platformFeeReceiver`, royalty → EIP-2981 `royaltyInfo(nftContract, nftTokenId, salePrice)`, creator amount (minus reserve retention) → creator. Retains a % as reserve (configurable `reserveRetentionBps`) so sellers can be paid. **After each buy, pool buy/sell prices increase** (see Price movement below).
- **sellPieces**: Transfers pieces from seller to this contract; pays seller from contract balance (reserve); pays platform fee and royalty from same payment. **After each sell, pool buy/sell prices decrease** (see Price movement below).
- **Royalty**: Uses `royaltyInfo(uint256 tokenId, uint256 salePrice)` on the underlying NFT contract (EIP-2981). No revert if not supported.
- **Pausable**, **ReentrancyGuard**, **Ownable** (fee/receiver/retention config).

**Price movement (marketplace-style):** Pool prices move on-chain with trading so the contract behaves like other NFT marketplaces:

- **On buy:** After a buy, `buyPricePerPiece` and `sellPricePerPiece` are increased by `priceIncreaseBpsPerPiece` per piece (default 0.5%, max 5% configurable). The next buyer pays more; the next seller receives more.
- **On sell:** After a sell, both prices are decreased by `priceDecreaseBpsPerPiece` per piece (default 0.5%). Prices never go below 1 wei.
- **Config:** Owner can call `setPriceMovementBps(increasePerPiece, decreasePerPiece)` (each max 500 = 5% per piece). Defaults: 50 (0.5%) per piece.

## Deployment

1. Set `.env`: `PRIVATE_KEY`, and for the target network (e.g. `SEPOLIA_RPC_URL`).
2. Run:
   ```bash
   npx hardhat run scripts/deployNftPiecesAndLiquidity.js --network sepolia
   ```
3. Script deploys **NftPieces** (with `liquidityContract = 0`), then **NftLiquidity**, then calls **NftPieces.setLiquidityContract(liquidityAddress)**.
4. In the frontend, set for each chain:
   - `VITE_APP_NFT_PIECES_CONTRACT_ADDRESS` (and `_POLYGON`, `_ETHEREUM`, etc. if multi-chain)
   - `VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS` (and chain variants)

## Flow (all on-chain)

1. **Creator** lists an NFT with pieces: call **NftLiquidity.createPool**(nftContract, nftTokenId, totalPieces, buyPrice, sellPrice, initialReserve). Under the hood this calls **NftPieces.registerAndMint**, which mints `totalPieces` to the liquidity contract. No backend or “listing request” needed.
2. **Buyer** calls **NftLiquidity.buyPieces**(pieceId, quantity) with `msg.value = quantity * buyPricePerPiece` (or more for refund). Receives pieces (ERC-1155); fee and royalty are sent on-chain.
3. **Collector** who holds pieces calls **NftLiquidity.sellPieces**(pieceId, quantity). Pieces go back to the pool; they receive ETH (minus fee and royalty) to their wallet.
4. **Other marketplaces / bridges**: They can read **NftPieces** (balances, totalSupply) and **NftLiquidity** (getPoolInfo, getBuyQuote, getSellQuote) and listen to **Trade** / **LiquidityUpdated** for history, volume, and market cap. No dependency on our backend.

## Compile

From project root (with valid Hardhat config and, if needed, `.env` for accounts):

```bash
npx hardhat compile
```

If you see “Invalid account / private key” errors, set `PRIVATE_KEY` in `.env` (e.g. 64-char hex for testnet).
