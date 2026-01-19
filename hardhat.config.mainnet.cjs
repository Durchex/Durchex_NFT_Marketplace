// Mainnet deployment configuration for Ethereum
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
      accounts: [process.env.MAINNET_PRIVATE_KEY],
      chainId: 1,
      gasPrice: 'auto',
      timeout: 40000,
      httpTimeout: 40000,
    },

    hardhat: {
      chainId: 1337,
      forking: {
        enabled: true,
        url: process.env.MAINNET_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY',
      },
    },
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
    },
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },

  mocha: {
    timeout: 40000,
  },
};
