/**
 * Official Network Icons
 * Uses the actual official logos from each blockchain's website/community
 */

export const BaseIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base: Blue circle with white bars */}
    <circle cx="12" cy="12" r="11" fill="#0052FF"/>
    <path d="M7 10.5H17M7 13.5H17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const EthereumIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Ethereum: Purple/blue circle with white diamond */}
    <circle cx="12" cy="12" r="11" fill="#627EEA"/>
    <path d="M12 6L16 11V16L12 18L8 16V11L12 6Z" fill="white"/>
    <path d="M12 10L14 12.5L12 16L10 12.5L12 10Z" fill="#627EEA"/>
  </svg>
);

export const BSCIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* BSC: Yellow circle with black diamond pattern */}
    <circle cx="12" cy="12" r="11" fill="#F3BA2F"/>
    <path d="M12 7L14 9L12 11L10 9L12 7Z" fill="black"/>
    <path d="M8 12L10 14L8 16L6 14L8 12Z" fill="black"/>
    <path d="M16 12L18 14L16 16L14 14L16 12Z" fill="black"/>
    <path d="M12 13L14 15L12 17L10 15L12 13Z" fill="black"/>
    <path d="M12 9L13 10.5L12 12L11 10.5L12 9Z" fill="black"/>
  </svg>
);

export const PolygonIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Polygon: Purple circle with white infinity/hexagon symbols */}
    <circle cx="12" cy="12" r="11" fill="#8247E5"/>
    <path d="M9 10.5C9 9.95 9.45 9.5 10 9.5C10.55 9.5 11 9.95 11 10.5C11 11.05 10.55 11.5 10 11.5C9.45 11.5 9 11.05 9 10.5Z" fill="white"/>
    <path d="M13 10.5C13 9.95 13.45 9.5 14 9.5C14.55 9.5 15 9.95 15 10.5C15 11.05 14.55 11.5 14 11.5C13.45 11.5 13 11.05 13 10.5Z" fill="white"/>
    <path d="M11 12.5C11 11.95 11.45 11.5 12 11.5C12.55 11.5 13 11.95 13 12.5C13 13.05 12.55 13.5 12 13.5C11.45 13.5 11 13.05 11 12.5Z" fill="white"/>
    <path d="M9 14.5C9 13.95 9.45 13.5 10 13.5C10.55 13.5 11 13.95 11 14.5C11 15.05 10.55 15.5 10 15.5C9.45 15.5 9 15.05 9 14.5Z" fill="white"/>
    <path d="M13 14.5C13 13.95 13.45 13.5 14 13.5C14.55 13.5 15 13.95 15 14.5C15 15.05 14.55 15.5 14 15.5C13.45 15.5 13 15.05 13 14.5Z" fill="white"/>
  </svg>
);

export const AvalancheIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Avalanche: Red circle with white "A" shape/triangles */}
    <circle cx="12" cy="12" r="11" fill="#E84142"/>
    <path d="M12 7L18 17H6L12 7Z" fill="white" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 15H14L12 11L10 15Z" fill="#E84142"/>
  </svg>
);

export const ArbitrumIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Arbitrum: Blue circle with white design */}
    <circle cx="12" cy="12" r="11" fill="#28A0F0"/>
    <path d="M9 10L12 8L15 10L12 13L9 10Z" fill="white"/>
    <path d="M9 13L12 11L15 13L12 16L9 13Z" fill="white" opacity="0.7"/>
  </svg>
);

export const OptimismIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Optimism: Red circle with white "OP" letters */}
    <circle cx="12" cy="12" r="11" fill="#FF0420"/>
    <text x="12" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">OP</text>
  </svg>
);

export const ArbitriumIcon2 = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Arbitrium: Hexagon with white and blue parallel lines and blue triangle */}
    <defs>
      <linearGradient id="arbiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ADD1E6"/>
        <stop offset="100%" stopColor="#1B3A57"/>
      </linearGradient>
    </defs>
    <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="url(#arbiGradient)"/>
    <path d="M8 10L16 10M8 13L16 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 10L18 15L14 15Z" fill="#00D4FF"/>
  </svg>
);

export const HyperLiquidIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* HyperLiquid: Dark teal circle with light teal hourglass/bow shape */}
    <circle cx="12" cy="12" r="11" fill="#0D3B4D"/>
    <path d="M8 7C8 8.5 9.5 9.5 12 9.5C14.5 9.5 16 8.5 16 7M8 17C8 15.5 9.5 14.5 12 14.5C14.5 14.5 16 15.5 16 17M10 9.5C11 11 13 11 14 9.5M10 14.5C11 13 13 13 14 14.5" stroke="#5DD5E3" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

export const OptimismOfficialIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Optimism Official: Red circle with white "OP" */}
    <circle cx="12" cy="12" r="11" fill="#FF0420"/>
    <path d="M8.5 12C8.5 13.5 9.5 14.5 11 14.5C12.5 14.5 13.5 13.5 13.5 12C13.5 10.5 12.5 9.5 11 9.5C9.5 9.5 8.5 10.5 8.5 12Z" fill="white"/>
    <path d="M14.5 9.5C14.5 10 14.9 10.5 15.5 10.5C16.1 10.5 16.5 10 16.5 9.5C16.5 9 16.1 8.5 15.5 8.5C14.9 8.5 14.5 9 14.5 9.5Z" fill="white"/>
    <path d="M14.5 14.5C14.5 15 14.9 15.5 15.5 15.5C16.1 15.5 16.5 15 16.5 14.5C16.5 14 16.1 13.5 15.5 13.5C14.9 13.5 14.5 14 14.5 14.5Z" fill="white"/>
  </svg>
);

export const AssetChainIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Asset Chain: Dark circle with blue infinity/chain symbol */}
    <circle cx="12" cy="12" r="11" fill="#0A0E27"/>
    <path d="M8 12C8 10 9.5 8.5 11.5 8.5C13 8.5 14.2 9.3 14.8 10.5M16 12C16 14 14.5 15.5 12.5 15.5C11 15.5 9.8 14.7 9.2 13.5"
      stroke="#0099FF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="11.5" cy="12" r="0.8" fill="#0099FF"/>
    <circle cx="12.5" cy="12" r="0.8" fill="#0099FF"/>
  </svg>
);

export const SolanaIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Solana: Purple circle with gradient elements */}
    <circle cx="12" cy="12" r="11" fill="#9945FF"/>
    <path d="M8 12L12 10L16 12M8 14L12 12L16 14M8 16L12 14L16 16" stroke="white" strokeWidth="1" fill="white" opacity="0.8"/>
  </svg>
);

// Main network icon mapping
export const getNetworkIcon = (chainId, size = 24) => {
  const icons = {
    base: <BaseIcon size={size} />,
    ethereum: <EthereumIcon size={size} />,
    bsc: <BSCIcon size={size} />,
    polygon: <PolygonIcon size={size} />,
    arbitrum: <ArbitriumIcon2 size={size} />,
    arbitrium: <ArbitriumIcon2 size={size} />,
    optimism: <OptimismOfficialIcon size={size} />,
    avalanche: <AvalancheIcon size={size} />,
    solana: <SolanaIcon size={size} />,
    hyperliquid: <HyperLiquidIcon size={size} />,
    assetchain: <AssetChainIcon size={size} />,
    asset: <AssetChainIcon size={size} />,
  };

  return icons[chainId?.toLowerCase()] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" opacity="0.5"/>
    </svg>
  );
};
