/**
 * Official Network Icons
 * Uses actual PNG images from the network-icons folder
 */

import baseIcon from '../assets/network-icons/base.png';
import ethereumIcon from '../assets/network-icons/ethereum.png';
import bscIcon from '../assets/network-icons/bsc.png';
import polygonIcon from '../assets/network-icons/polygon.png';
import avalancheIcon from '../assets/network-icons/avalanche.png';
import arbitrumIcon from '../assets/network-icons/arbitrum.png';
import optimismIcon from '../assets/network-icons/optimism.png';
import hyperliquidIcon from '../assets/network-icons/hyperliquid.png';
import assetChainIcon from '../assets/network-icons/assetchain.png';

/**
 * Get network icon image element by chain ID
 * @param {string} chainId - The chain identifier (base, ethereum, bsc, etc.)
 * @param {number} size - Icon size in pixels (default 24)
 * @returns {JSX.Element} Image element or fallback circle
 */
export const getNetworkIcon = (chainId, size = 24) => {
  const iconMap = {
    base: baseIcon,
    ethereum: ethereumIcon,
    bsc: bscIcon,
    polygon: polygonIcon,
    arbitrum: arbitrumIcon,
    arbitrium: arbitrumIcon,
    optimism: optimismIcon,
    avalanche: avalancheIcon,
    solana: null, // Fallback for Solana
    hyperliquid: hyperliquidIcon,
    assetchain: assetChainIcon,
    asset: assetChainIcon,
  };

  const iconSrc = iconMap[chainId?.toLowerCase()];

  if (!iconSrc) {
    // Fallback generic circle
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" opacity="0.5" />
      </svg>
    );
  }

  return (
    <img
      src={iconSrc}
      alt={chainId || 'network'}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
};
