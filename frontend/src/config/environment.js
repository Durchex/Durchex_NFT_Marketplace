// Environment configuration for frontend
const environments = {
  development: {
    API_URL: 'http://localhost:5000',
    ETHEREUM_RPC_URL: 'http://localhost:8545',
    CHAIN_ID: 31337, // Hardhat local network
    CONTRACT_ADDRESSES: {
      lazyMint: '0x5FbDB2315678afccb333f8a9c6122015ea74f6',
      auction: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      offer: '0x9fE46736679d2D9a88F96e936f8a5Bac96eb58E6',
      collection: '0xDc64a140Aa3E981100a9BeCa4E685f962f0cF6C9',
      royalties: '0x0165878A594ca255338adfa4d6DE953DF3E5Dec8',
    },
    IPFS_GATEWAY: 'http://localhost:8080',
    LOG_LEVEL: 'debug',
    ENABLE_MOCKING: true,
  },

  staging: {
    API_URL: 'https://staging-api.durchex.com',
    ETHEREUM_RPC_URL: 'https://sepolia.infura.io/v3/YOUR_KEY',
    CHAIN_ID: 11155111, // Sepolia
    CONTRACT_ADDRESSES: {
      lazyMint: process.env.REACT_APP_LAZY_MINT_ADDRESS,
      auction: process.env.REACT_APP_AUCTION_ADDRESS,
      offer: process.env.REACT_APP_OFFER_ADDRESS,
      collection: process.env.REACT_APP_COLLECTION_ADDRESS,
      royalties: process.env.REACT_APP_ROYALTIES_ADDRESS,
    },
    IPFS_GATEWAY: 'https://gateway.pinata.cloud',
    LOG_LEVEL: 'info',
    ENABLE_MOCKING: false,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    GA_ID: 'G-STAGING-ID',
  },

  production: {
    API_URL: 'https://api.durchex.com',
    ETHEREUM_RPC_URL: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
    CHAIN_ID: 1, // Mainnet
    CONTRACT_ADDRESSES: {
      lazyMint: process.env.REACT_APP_LAZY_MINT_ADDRESS,
      auction: process.env.REACT_APP_AUCTION_ADDRESS,
      offer: process.env.REACT_APP_OFFER_ADDRESS,
      collection: process.env.REACT_APP_COLLECTION_ADDRESS,
      royalties: process.env.REACT_APP_ROYALTIES_ADDRESS,
    },
    IPFS_GATEWAY: 'https://gateway.pinata.cloud',
    LOG_LEVEL: 'warn',
    ENABLE_MOCKING: false,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
    GA_ID: process.env.REACT_APP_GA_ID,
  },
};

const env = process.env.REACT_APP_ENVIRONMENT || 'development';
const config = environments[env];

// Validate required variables
const required = ['API_URL', 'ETHEREUM_RPC_URL', 'CHAIN_ID', 'IPFS_GATEWAY'];
for (const key of required) {
  if (!config[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Export configuration
module.exports = {
  ...config,
  environment: env,
  isDev: env === 'development',
  isStaging: env === 'staging',
  isProduction: env === 'production',
  version: process.env.REACT_APP_VERSION || '1.0.0',
};
