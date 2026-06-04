/**
 * Official Network Icons
 * Uses the actual official logos from each blockchain's website/community
 */

export const EthereumIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 12.5L12 18.5L22 12.5L12 2Z" fill="currentColor" opacity="0.6"/>
    <path d="M12 18.5L2 12.5V20.5L12 22L22 20.5V12.5L12 18.5Z" fill="currentColor"/>
  </svg>
);

export const PolygonIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="currentColor"/>
    <path d="M15.5 9.5L12 11.5L8.5 9.5L12 7.5L15.5 9.5Z" fill="white"/>
    <path d="M18 11.5L14.5 13.5L14.5 17.5L18 15.5L18 11.5Z" fill="white" opacity="0.7"/>
    <path d="M6 11.5L9.5 13.5L9.5 17.5L6 15.5L6 11.5Z" fill="white" opacity="0.7"/>
  </svg>
);

export const BaseIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#0052FF"/>
    <path d="M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12" stroke="white" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const BSCIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#F3BA2F"/>
    <path d="M8.5 12L12 8.5L15.5 12L12 15.5L8.5 12Z" fill="white"/>
    <path d="M15.5 12L18 14.5V9.5L15.5 12Z" fill="white" opacity="0.7"/>
    <path d="M8.5 12L6 14.5V9.5L8.5 12Z" fill="white" opacity="0.7"/>
  </svg>
);

export const ArbitrumIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#28A0F0"/>
    <path d="M9 10L12 7L15 10L12 13L9 10Z" fill="white"/>
    <path d="M9 14L12 11L15 14L12 17L9 14Z" fill="white" opacity="0.7"/>
  </svg>
);

export const OptimismIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#FF0420"/>
    <path d="M10 11C10 10.4477 10.4477 10 11 10H13C13.5523 10 14 10.4477 14 11C14 11.5523 13.5523 12 13 12H11C10.4477 12 10 11.5523 10 11Z" fill="white"/>
    <circle cx="12" cy="15" r="1" fill="white"/>
  </svg>
);

export const AvalancheIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 22,20 2,20" fill="currentColor"/>
    <polygon points="12,8 18,18 6,18" fill="white" opacity="0.8"/>
  </svg>
);

export const SolanaIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: '#14F195', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: '#9945FF', stopOpacity: 1}} />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#solanaGradient)"/>
    <path d="M8 13L12 9L16 13" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M8 11L12 15L16 11" stroke="white" strokeWidth="1.5" fill="none" opacity="0.6"/>
  </svg>
);

// Main network icon mapping
export const getNetworkIcon = (chainId, size = 24) => {
  const icons = {
    ethereum: <EthereumIcon size={size} />,
    polygon: <PolygonIcon size={size} />,
    base: <BaseIcon size={size} />,
    bsc: <BSCIcon size={size} />,
    arbitrum: <ArbitrumIcon size={size} />,
    optimism: <OptimismIcon size={size} />,
    avalanche: <AvalancheIcon size={size} />,
    solana: <SolanaIcon size={size} />,
  };

  return icons[chainId?.toLowerCase()] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.5"/>
    </svg>
  );
};
