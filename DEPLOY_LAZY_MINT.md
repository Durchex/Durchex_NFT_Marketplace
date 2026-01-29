# How to Deploy LazyMintNFT and Get the Contract Address

LazyMintNFT is the contract used for **Buy & Mint** of lazy-minted NFTs. The frontend needs its address in the env so the Mint page can call `redeemNFT`.

**Note:** `Bridge.sol` has been moved to `contracts-disabled/` because it depends on `@layerzerolabs/lz-evm-sdk-v1-0.2`, which is not on npm. That allows `npx hardhat compile` and the LazyMint deploy to run without that dependency. To use Bridge again, see `contracts-disabled/README.md`.

---

## Option 1: Deploy only LazyMintNFT (recommended)

1. **Install dependencies** (if not already):
   ```bash
   npm install
   ```

2. **Set your deployer wallet** in `.env` at the project root:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ```
   Use the private key of the wallet that will pay gas. **Never commit this file.**

3. **Compile contracts**:
   ```bash
   npx hardhat compile
   ```

4. **Deploy to a network** (pick one):

   **Sepolia testnet:**
   ```bash
   npx hardhat run scripts/deploy-lazy-mint-only.js --network sepolia
   ```
   Optional in `.env`: `SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia`

   **Polygon:**
   ```bash
   npx hardhat run scripts/deploy-lazy-mint-only.js --network polygon
   ```

   **Local Hardhat node:**
   ```bash
   npx hardhat node
   ```
   In another terminal:
   ```bash
   npx hardhat run scripts/deploy-lazy-mint-only.js --network localhost
   ```

5. **Copy the printed address** and add it to your env:

   In `.env` (project root or `frontend/`):
   ```env
   VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=0xYourDeployedAddress
   ```

   Or per network (e.g. Sepolia only):
   ```env
   VITE_APP_LAZY_MINT_CONTRACT_ADDRESS_SEPOLIA=0xYourDeployedAddress
   ```

6. **Restart the frontend** (and rebuild if you use a production build):
   ```bash
   cd frontend && npm run dev
   ```
   Or for production: set the env, then `npm run build`.

---

## Option 2: Full Sepolia deployment (all contracts)

This deploys LazyMintNFT, Auction, Offer, Collection, Royalties and writes addresses to `frontend/src/contracts/addresses.json`:

```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

Then take the **LazyMintNFT** address from the output and set:

```env
VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=<LazyMintNFT address from output>
```

The frontend currently reads `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS` from env; it does not read `addresses.json` for LazyMint, so you still need to add the address to `.env` as above.

---

## Summary

| Step | Command / action |
|------|-------------------|
| 1 | Add `PRIVATE_KEY` to `.env` |
| 2 | `npx hardhat compile` |
| 3 | `npx hardhat run scripts/deploy-lazy-mint-only.js --network sepolia` (or `polygon` / `localhost`) |
| 4 | Add `VITE_APP_LAZY_MINT_CONTRACT_ADDRESS=0x...` to `.env` |
| 5 | Restart dev server or rebuild frontend |

After that, the **Buy & Mint** flow for lazy-minted NFTs will use the deployed LazyMintNFT contract.
