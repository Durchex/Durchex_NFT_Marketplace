// AppKitProvider.jsx
import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrum } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const queryClient = new QueryClient();
const projectId = '42cf5cc884c342e26b2c5002e2f0e26e'; // <-- Replace with actual ID

const metadata = {
  name: 'Dapp_Event',
  description: 'Buy and sell NFTs from vendors',
  url: 'https://yourdomain.com',
  icons: ['https://yourdomain.com/logo.png'],
};

const networks = [polygon, arbitrum, mainnet];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
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
