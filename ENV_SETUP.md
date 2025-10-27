# Environment Variables Setup

To run this NFT Marketplace application, you need to create a `.env` file in the root directory with the following variables:

```env
# NFT Marketplace Contract Addresses
VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_APP_VENDORNFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Web3 Provider
VITE_APP_WEB3_PROVIDER=https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca

# Pinata API Keys (for IPFS)
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_SECRECT_KEY=your_pinata_secret_key_here
```

## Notes:
- Replace the contract addresses with your actual deployed contract addresses
- Replace the Pinata API keys with your actual Pinata credentials
- The application will work with default values, but blockchain functionality will be limited without proper contract addresses
