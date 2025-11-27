# EVM and Tezos Integration Guide

This document describes the integration of HyperLiquid (EVM) and Tezos support into the Durchex NFT Marketplace.

## Overview

### HyperLiquid (EVM-Compatible)
- **Type**: EVM-compatible blockchain
- **Location**: `frontend/src/Context/constants.jsx` and `src/Context/constants.jsx`
- **RPC Endpoint**: `https://api.hyperliquid-testnet.xyz/evm` (testnet)
- **Chain ID**: 421614 (testnet)
- **Native Token**: Hyperliquid (HL)

### Tezos (Non-EVM)
- **Type**: Proof-of-Stake blockchain
- **Location**: `frontend/src/services/TezosAdapter.js`
- **UI Component**: `frontend/src/components/TezosWithdrawUI.jsx`
- **RPC Endpoint**: `https://mainnet.api.tezos.com` (mainnet) / `https://rpc.ghostnet.teztnets.xyz` (testnet)
- **Native Token**: XTZ (Tezos)
- **Wallet**: Temple Wallet (recommended)

---

## Part 1: HyperLiquid Integration

### Files Modified

1. **`frontend/src/Context/constants.jsx`**
   - Added `hyperliquid` to `rpcUrls` object
   - Added `hyperliquid` to `contractAddresses` object

2. **`src/Context/constants.jsx`** (mirror)
   - Same changes as frontend version

3. **`frontend/src/__tests__/HyperLiquidAdmin.test.jsx`** (new)
   - Test suite for HyperLiquid admin functionality
   - Tests admin dropdown compatibility
   - Tests withdraw function integration

### Setup Instructions

#### 1. Environment Variables
Add these to your `.env` file:

```bash
# HyperLiquid Mainnet (production)
VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid.xyz/evm
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x...

# HyperLiquid Testnet (development)
VITE_RPC_URL_HYPERLIQUID=https://api.hyperliquid-testnet.xyz/evm
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID=0x...
VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID=0x...
```

#### 2. Admin Dashboard Usage

In `frontend/src/pages/admin/ContractManagement.jsx`, HyperLiquid is now available in the network dropdown:

```jsx
<select
  value={selectedNetwork}
  onChange={(e) => setSelectedNetwork(e.target.value)}
  className="w-full p-3 mb-2 rounded-lg bg-white border border-gray-300 text-gray-900"
>
  {Object.keys(contractAddresses).map((net) => (
    <option key={net} value={net}>{net}</option>
  ))}
</select>
```

Admin can now:
1. Select "hyperliquid" from the dropdown
2. View HyperLiquid marketplace contract address
3. Click "Withdraw Funds" to withdraw from HyperLiquid

#### 3. Testing HyperLiquid

Run the test suite:

```bash
npm test -- HyperLiquidAdmin.test.jsx
```

Tests verify:
- ✅ HyperLiquid in contractAddresses
- ✅ HyperLiquid in rpcUrls
- ✅ Admin dropdown compatibility
- ✅ Withdraw function integration
- ✅ RPC configuration

#### 4. Contract Addresses Reference

Once contracts are deployed to HyperLiquid, update:

```jsx
// frontend/src/Context/constants.jsx
hyperliquid: {
  marketplace: "0x1234567890123456789012345678901234567890",
  vendorNFT: "0x0987654321098765432109876543210987654321",
}
```

---

## Part 2: Tezos Integration

### Files Created

1. **`frontend/src/services/TezosAdapter.js`** (new)
   - `TaquitoClient` class - Tezos blockchain interaction
   - `TezosContext` class - State management
   - `createTezosContextHook()` - React hook pattern
   - Helper functions (balance conversion, address validation)

2. **`frontend/src/components/TezosWithdrawUI.jsx`** (new)
   - Complete withdraw UI component
   - Network selection (mainnet/testnet)
   - Wallet connection (Temple Wallet)
   - Amount validation with minimum checking
   - Transaction status tracking

3. **`frontend/src/__tests__/TezosAdapter.test.jsx`** (new)
   - Comprehensive test suite
   - Integration tests
   - Context branching pattern tests
   - Complete withdraw flow simulation

### Setup Instructions

#### 1. Dependencies

Install Taquito for Tezos interaction:

```bash
npm install @taquito/taquito @taquito/local-forging
```

#### 2. Environment Variables

Add to `.env`:

```bash
# Tezos Mainnet
VITE_TEZOS_RPC_MAINNET=https://mainnet.api.tezos.com
VITE_APP_TEZOS_MARKETPLACE_MAINNET=KT1...

# Tezos Testnet (Ghostnet)
VITE_TEZOS_RPC_TESTNET=https://rpc.ghostnet.teztnets.xyz
VITE_APP_TEZOS_MARKETPLACE_TESTNET=KT1...
```

#### 3. Contract Addresses

Configure in `TezosAdapter.js`:

```javascript
this.contractAddresses = {
  mainnet: {
    marketplace: 'KT1MainnetAddress123...',
    vendorNFT: 'KT1MainnetVendor456...',
  },
  testnet: {
    marketplace: 'KT1TestnetAddress789...',
    vendorNFT: 'KT1TestnetVendor000...',
  },
};
```

#### 4. Usage in Admin Dashboard

In your admin page, import and use the Tezos component:

```jsx
import TezosWithdrawUI from '../../components/TezosWithdrawUI';

// In render:
{selectedNetwork === 'tezos' && <TezosWithdrawUI />}
```

Or use the hook directly:

```jsx
import { createTezosContextHook } from '../../services/TezosAdapter';

const YourComponent = () => {
  const tezos = createTezosContextHook();

  const handleWithdraw = async (amount) => {
    const min = tezos.getMinWithdrawal();
    if (amount >= min.recommendedMinimum) {
      await tezos.withdraw(amount);
    }
  };

  // ... rest of component
};
```

### Key Components

#### TaquitoClient

Wrapper around Taquito for consistent API:

```javascript
const client = new TaquitoClient('https://rpc.ghostnet.teztnets.xyz');
await client.connectWallet('temple');
const contract = await client.getContract('KT1...');
await client.callContractEntrypoint('withdraw', { amount: 1000000 });
```

**Methods:**
- `connectWallet(walletType)` - Connect Temple/Kukai/KeepWallet
- `getContract(address)` - Get contract instance
- `callContractEntrypoint(name, param)` - Call contract method
- `readStorage()` - Read contract state
- `getBalance(address)` - Get XTZ balance
- `mutezToXTZ(amount)` - Convert units
- `xtzToMutez(amount)` - Convert units

#### TezosContext

State management and context branching:

```javascript
const context = new TezosContext();
await context.initialize('testnet');
await context.connectWallet('temple');
const branch = context.branchContext('marketplace');
```

**Properties:**
- `client` - TaquitoClient instance
- `account` - Connected account (tz1...)
- `balance` - User balance in XTZ
- `network` - Current network (mainnet/testnet)

**Methods:**
- `initialize(network)` - Set up with network
- `connectWallet(type)` - Connect wallet
- `getContractAddress(type)` - Get contract address
- `branchContext(type)` - Create isolated context

#### Minimum Withdrawal

Validates withdrawal amounts:

```javascript
const min = getTezosMinWithdrawal();
// Returns: { mutez: 1000000, xtz: 1.0, networkFee: 0.0002, recommendedMinimum: 1.0002 }

if (amount < min.recommendedMinimum) {
  throw new Error(`Minimum: ${min.recommendedMinimum} XTZ`);
}
```

#### Address Validation

Validates Tezos addresses:

```javascript
isValidTezosAddress('tz1VSUr8wwNhLAzempoch5d6hLRiTh8DCnG'); // true
isValidTezosAddress('KT1aPV9sxuv8SAKDQzGNvBL4b1EWzjr2BzaV'); // true
isValidTezosAddress('0x123...'); // false
```

### TezosWithdrawUI Component

Complete UI for Tezos withdrawal with:

✅ Network selection (mainnet/testnet)
✅ Temple Wallet connection
✅ Balance display (XTZ and mutez)
✅ Amount input with validation
✅ Minimum amount warning
✅ Quick amount buttons (25%, 50%, 75%, Max)
✅ Transaction tracking
✅ Error handling with toasts

**Usage:**

```jsx
import TezosWithdrawUI from '../components/TezosWithdrawUI';

<TezosWithdrawUI />
```

### Testing Tezos

Run test suite:

```bash
npm test -- TezosAdapter.test.jsx
```

Tests cover:
- ✅ TaquitoClient initialization
- ✅ Unit conversion (XTZ ↔ mutez)
- ✅ TezosContext state management
- ✅ Address validation
- ✅ Minimum withdrawal calculation
- ✅ Context hook API
- ✅ Context branching pattern
- ✅ Admin dashboard integration
- ✅ Complete withdraw flow

---

## Integration Patterns

### Context Branching (Tezos)

The adapter uses **context branching** to isolate state for different operations:

```javascript
const mainContext = new TezosContext();
await mainContext.initialize('testnet');
await mainContext.connectWallet('temple');

// Create isolated context for marketplace
const marketplaceBranch = mainContext.branchContext('marketplace');
// { network, account, contractAddress, client, balance }

// Create isolated context for vendorNFT
const vendorBranch = mainContext.branchContext('vendorNFT');
// Different contract address, same account & balance
```

This pattern allows:
- Shared wallet connection across contracts
- Contract-specific address management
- Clean separation of concerns
- No state mutation between operations

### Unit Conversion (Tezos)

Tezos uses **mutez** (smallest unit) for smart contracts:

```javascript
// Convert for display
1000000 mutez = 1 XTZ

// Convert for contract calls
const amountXTZ = 1.5;
const amountMutez = TaquitoClient.xtzToMutez(amountXTZ); // 1500000

// Convert from contract results
const balanceMutez = 5000000;
const balanceXTZ = TaquitoClient.mutezToXTZ(balanceMutez); // 5.0
```

### Admin Dropdown Integration

HyperLiquid:
```jsx
// Automatically in dropdown via Object.keys(contractAddresses)
// No special handling required - uses same ethers.js flow
```

Tezos:
```jsx
// In admin page, conditionally render component
{selectedNetwork === 'tezos' && <TezosWithdrawUI />}

// Or use hook directly
const tezos = createTezosContextHook();
await tezos.withdraw(amount);
```

---

## API Reference

### HyperLiquid (EVM)

**contractAddresses.hyperliquid:**
```javascript
{
  marketplace: "0x...",
  vendorNFT: "0x..."
}
```

**rpcUrls.hyperliquid:**
```javascript
"https://api.hyperliquid-testnet.xyz/evm"
```

**Usage (same as other EVM networks):**
```javascript
const contract = new ethers.Contract(
  contractAddresses.hyperliquid.marketplace,
  NFTMarketplace_ABI,
  provider
);
```

### Tezos (Non-EVM)

**TezosAdapter exports:**
- `TaquitoClient` - Main blockchain client
- `TezosContext` - Context manager
- `createTezosContextHook()` - React hook factory
- `getTezosMinWithdrawal()` - Minimum amount helper
- `isValidTezosAddress(address)` - Validation helper

**TezosWithdrawUI:**
- Complete UI component
- No props required (internal state management)
- Toast notifications for user feedback

---

## Wallet Configuration

### HyperLiquid
- Use existing MetaMask / Web3 wallet setup
- Same as Ethereum, Polygon, BSC, Arbitrum
- No special wallet handling needed

### Tezos
- **Recommended**: Temple Wallet
- **Also supported**: Kukai, KeepWallet (skeleton)
- Install from: https://templewallet.com

**Testing:**
- Use Ghostnet testnet
- Get test XTZ from faucet
- TezosWithdrawUI supports testnet mode

---

## Migration Checklist

- [ ] Add HyperLiquid env vars to `.env`
- [ ] Deploy HyperLiquid contracts
- [ ] Update contract addresses in constants
- [ ] Run HyperLiquid tests
- [ ] Test admin withdraw with HyperLiquid
- [ ] Install Taquito dependency
- [ ] Add Tezos env vars to `.env`
- [ ] Deploy Tezos contracts
- [ ] Update contract addresses in TezosAdapter
- [ ] Run Tezos tests
- [ ] Integrate TezosWithdrawUI in admin dashboard
- [ ] Test with Temple Wallet on testnet
- [ ] Test with Temple Wallet on mainnet

---

## Troubleshooting

### HyperLiquid

**Issue**: Contract not found in dropdown
- **Solution**: Ensure `contractAddresses` object includes `hyperliquid` key

**Issue**: Withdraw fails with "Invalid network"
- **Solution**: Check env var `VITE_RPC_URL_HYPERLIQUID` is set

**Issue**: Contract address not recognized
- **Solution**: Verify env vars `VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_HYPERLIQUID` and `VITE_APP_VENDORNFT_CONTRACT_ADDRESS_HYPERLIQUID`

### Tezos

**Issue**: "Temple Wallet not installed"
- **Solution**: Install Temple Wallet from templewallet.com

**Issue**: Cannot call withdraw
- **Solution**: Ensure contract address is set in TezosAdapter, starts with `KT1`

**Issue**: Balance not loading
- **Solution**: Check RPC URL is correct, account is valid (`tz1...`)

**Issue**: Insufficient balance for minimum withdrawal
- **Solution**: On testnet, get XTZ from faucet; on mainnet, check balance

**Issue**: Transaction fails after signing
- **Solution**: Check contract entrypoint name matches contract definition

---

## References

- **HyperLiquid**: https://hyperliquid.xyz
- **Tezos Docs**: https://tezos.com
- **Taquito**: https://tezostaquito.io
- **Temple Wallet**: https://templewallet.com

---

## Support

For integration issues:
1. Check test files for examples
2. Review component documentation
3. Verify environment variables
4. Check browser console for errors
5. See wallet logs for connection issues
