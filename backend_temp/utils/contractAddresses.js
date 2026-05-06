// Utility to resolve deployed contract addresses from environment variables

function normalizeNetwork(network = 'polygon') {
  if (!network) return 'polygon';
  const normalized = String(network).trim().toLowerCase();

  const networkMap = {
    eth: 'ethereum',
    ethereum: 'ethereum',
    polygon: 'polygon',
    matic: 'polygon',
    bsc: 'bsc',
    binance: 'bsc',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    avalanche: 'avalanche',
    avax: 'avalanche',
    base: 'base',
    monarch: 'monarch',
    siu: 'siu',
  };

  if (networkMap[normalized]) {
    return networkMap[normalized];
  }

  const chainIdMap = {
    '1': 'ethereum',
    '137': 'polygon',
    '56': 'bsc',
    '42161': 'arbitrum',
    '10': 'optimism',
    '43114': 'avalanche',
    '8453': 'base',
  };

  return chainIdMap[normalized] || normalized;
}

function resolveEnvVar(baseName, networkUpper) {
  return process.env[`${baseName}_${networkUpper}`] || process.env[baseName] || undefined;
}

export const getContractAddresses = (network = 'polygon') => {
  const normalizedNetwork = normalizeNetwork(network);
  const networkUpper = normalizedNetwork.toUpperCase();

  const marketplace = resolveEnvVar('VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS', networkUpper);
  const marketplaceV2 = resolveEnvVar('VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS_V2', networkUpper) || marketplace;
  const vendor = resolveEnvVar('VITE_APP_VENDORNFT_CONTRACT_ADDRESS', networkUpper);
  const lazyMint = resolveEnvVar('VITE_APP_LAZY_MINT_CONTRACT_ADDRESS', networkUpper);
  const multiPieceLazyMint = resolveEnvVar('VITE_APP_MULTI_LAZY_MINT_CONTRACT_ADDRESS', networkUpper);
  const nftLiquidity = resolveEnvVar('VITE_APP_NFT_LIQUIDITY_CONTRACT_ADDRESS', networkUpper);

  return {
    marketplace,
    marketplaceV2,
    vendor,
    lazyMint,
    multiPieceLazyMint,
    nftLiquidity,
  };
};
