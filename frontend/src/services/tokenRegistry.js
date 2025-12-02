// Token registry for common networks.
// Populate with commonly used tokens; extend per-network as needed.
// Addresses are mainnet addresses (use testnet equivalents for staging/testing).
const registry = {
  ethereum: {
    ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, symbol: 'ETH', name: 'Ethereum', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png' },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png' },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC', name: 'USD Coin', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT', name: 'Tether', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
    UNI: { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, symbol: 'UNI', name: 'Uniswap', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png' },
    LINK: { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, symbol: 'LINK', name: 'Chainlink', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png' },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, symbol: 'WBTC', name: 'Wrapped BTC', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png' },
    AAVE: { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, symbol: 'AAVE', name: 'Aave', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png' },
    SUSHI: { address: '0x6B3595068778DD592e39A122f4f5a5Cf09C90fE2', decimals: 18, symbol: 'SUSHI', name: 'Sushi', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B3595068778DD592e39A122f4f5a5Cf09C90fE2/logo.png' },
    MKR: { address: '0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2', decimals: 18, symbol: 'MKR', name: 'Maker', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12ef6589cC3A579A2/logo.png' },
  },
  polygon: {
    MATIC: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, symbol: 'MATIC', name: 'Matic', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' },
    WMATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18, symbol: 'WMATIC', name: 'Wrapped Matic', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/logo.png' },
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, symbol: 'USDC', name: 'USD Coin', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png' },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AaCBf6A9fBE', decimals: 6, symbol: 'USDT', name: 'Tether', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AaCBf6A9fBE/logo.png' },
    WETH: { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, symbol: 'WETH', name: 'Wrapped Ether', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619/logo.png' },
    LINK: { address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39', decimals: 18, symbol: 'LINK', name: 'Chainlink', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39/logo.png' },
  },
  bsc: {
    BNB: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18, symbol: 'BNB', name: 'BNB', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png' },
    WBNB: { address: '0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, symbol: 'WBNB', name: 'Wrapped BNB', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/logo.png' },
    USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, symbol: 'USDT', name: 'Tether', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x55d398326f99059fF775485246999027B3197955/logo.png' },
    USDC: { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, symbol: 'USDC', name: 'USD Coin', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d/logo.png' },
  }
};

function getNetworkKey(network) {
  if (!network) return 'ethereum';
  const key = String(network).toLowerCase();
  if (key.includes('polygon') || key === 'matic') return 'polygon';
  if (key.includes('bsc') || key.includes('binance')) return 'bsc';
  if (key.includes('eth') || key.includes('ethereum')) return 'ethereum';
  return key;
}

function resolve(tokenOrSymbol, network) {
  // If tokenOrSymbol already looks like an address, return it with 18 decimals by default
  if (!tokenOrSymbol) return null;
  const possible = String(tokenOrSymbol).trim();
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(possible);
  const net = getNetworkKey(network);
  if (isAddress) return { address: possible, decimals: 18, symbol: possible };

  // Try registry
  const upper = possible.toUpperCase();
  if (registry[net] && registry[net][upper]) return registry[net][upper];

  // fallback: try ethereum registry
  if (registry.ethereum && registry.ethereum[upper]) return registry.ethereum[upper];

  // fallback to symbol with 18 decimals
  return { address: possible, decimals: 18, symbol: possible };
}

export default {
  resolve,
  registry,
};
