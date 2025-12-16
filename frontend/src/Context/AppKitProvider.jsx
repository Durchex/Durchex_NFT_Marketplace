// AppKitProvider.jsx
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, bsc, arbitrum, base, optimism, avalanche } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const queryClient = new QueryClient();

// Use a valid project ID - you should get this from https://cloud.reown.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2f05a7db73b6e7a4e0b7a8a7b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3';

const metadata = {
  name: 'DURCHEX NFT Marketplace',
  description: 'Buy and sell NFTs from vendors',
  url: 'https://durchex.com',
  icons: ['https://durchex.com/logo.png'],
};

const networks = [mainnet, polygon, bsc, arbitrum, base, optimism, avalanche];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false, // Disable analytics to avoid 403 errors
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': '10000',
  },
});

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
