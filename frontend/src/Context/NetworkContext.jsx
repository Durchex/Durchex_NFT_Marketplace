import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  // Load selected network from localStorage or default to Ethereum
  const [_selectedNetwork, _setSelectedNetwork] = useState(() => {
    const saved = localStorage.getItem('selectedNetwork');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved network:', error);
      }
    }
    return {
      name: "Ethereum",
      symbol: "ETH",
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
      chainId: 1,
      rpcUrl: "https://rpc.ankr.com/eth",
      blockExplorerUrl: "https://etherscan.io"
    };
  });

  const setSelectedNetwork = (network) => {
    _setSelectedNetwork(network);
    localStorage.setItem('selectedNetwork', JSON.stringify(network));
  };

  const networks = [
    { 
      name: "Ethereum", 
      symbol: "ETH", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
      chainId: 1,
      rpcUrl: "https://rpc.ankr.com/eth",
      blockExplorerUrl: "https://etherscan.io",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Polygon", 
      symbol: "MATIC", 
      icon: "https://wallet-asset.matic.network/img/tokens/pol.svg",
      chainId: 137,
      rpcUrl: "https://rpc.ankr.com/polygon",
      blockExplorerUrl: "https://polygonscan.com",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "BSC", 
      symbol: "BNB", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
      chainId: 56,
      rpcUrl: "https://rpc.ankr.com/bsc",
      blockExplorerUrl: "https://bscscan.com",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Arbitrum", 
      symbol: "ARB", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
      chainId: 42161,
      rpcUrl: "https://rpc.ankr.com/arbitrum",
      blockExplorerUrl: "https://arbiscan.io",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Optimism", 
      symbol: "OP", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
      chainId: 10,
      rpcUrl: "https://rpc.ankr.com/optimism",
      blockExplorerUrl: "https://optimistic.etherscan.io",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Avalanche", 
      symbol: "AVAX", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
      chainId: 43114,
      rpcUrl: "https://rpc.ankr.com/avalanche",
      blockExplorerUrl: "https://snowtrace.io",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Tezos", 
      symbol: "XTZ", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tezos/info/logo.png",
      chainId: 1729, // Tezos Mainnet chain ID
      rpcUrl: "https://mainnet.api.tezos.com",
      blockExplorerUrl: "https://tzstats.com",
      isEVM: false, // Tezos is not EVM-compatible
      walletType: "tezos" // Requires Temple Wallet or similar
    },
    { 
      name: "Hyperliquid", 
      symbol: "HYPE", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
      chainId: 999,
      rpcUrl: "https://rpc.hyperliquid.xyz/evm",
      blockExplorerUrl: "https://hypurrscan.io",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Base",
      symbol: "ETH",
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
      chainId: 8453,
      rpcUrl: "https://mainnet.base.org",
      blockExplorerUrl: "https://basescan.org",
      isEVM: true,
      walletType: "evm"
    },
    { 
      name: "Solana", 
      symbol: "SOL", 
      icon: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
      chainId: 101,
      rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
      blockExplorerUrl: import.meta.env.VITE_SOLANA_BLOCK_EXPLORER || "https://solscan.io",
      isEVM: false,
      walletType: "solana"
    },
  ];

  const switchNetwork = async (network) => {
    try {
      // Check if the network is already selected
      if (_selectedNetwork.chainId === network.chainId) {
        toast.success(`Already connected to ${network.name}`);
        return true;
      }

      // Handle Tezos (non-EVM)
      if (network.name === "Tezos" && !network.isEVM) {
        // Check for Temple Wallet (thanosWallet is the newer API)
        const templeWallet = window.templeWallet || window.thanosWallet || window.temple;
        if (templeWallet) {
          try {
            // Try connecting with Temple Wallet
            const wallet = await templeWallet.connect();
            const account = await wallet.getPKH();
            setSelectedNetwork(network);
            toast.success(`Connected to Tezos`);
            return true;
          } catch (error) {
            console.error('Tezos connection error:', error);
            // Still update the network selection even if wallet connection fails
            setSelectedNetwork(network);
            toast.error("Tezos network selected, but wallet connection failed. Please ensure Temple Wallet is unlocked.");
            return false;
          }
        } else {
          // Allow network selection even without wallet - user can connect later
          setSelectedNetwork(network);
          toast.info("Tezos network selected. Install Temple Wallet to connect your wallet.");
          return true;
        }
      }

      // Handle Hyperliquid and other EVM networks
      if (!window.ethereum) {
        toast.error("Please install MetaMask or an EVM-compatible wallet to switch networks");
        return false;
      }

      // Try to switch to the network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
        
        setSelectedNetwork(network);
        toast.success(`Switched to ${network.name}`);
        return true;
      } catch (switchError) {
        // If the network doesn't exist, try to add it
        if (switchError.code === 4902 || switchError.code === -32603 || switchError.code === -32002) {
          try {
            // Validate RPC URL before adding
            if (!network.rpcUrl || network.rpcUrl.includes('/info')) {
              console.error('Invalid RPC URL for network:', network.name);
              toast.error(`${network.name} has an invalid RPC configuration. Please contact support.`);
              return false;
            }

            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: network.blockExplorerUrl ? [network.blockExplorerUrl] : [],
              }],
            });
            
            setSelectedNetwork(network);
            toast.success(`Added and switched to ${network.name}`);
            return true;
          } catch (addError) {
            console.error('Error adding network:', addError);
            console.error('Network details:', {
              name: network.name,
              chainId: network.chainId,
              chainIdHex: `0x${network.chainId.toString(16)}`,
              rpcUrl: network.rpcUrl,
              blockExplorerUrl: network.blockExplorerUrl
            });
            toast.error(`Failed to add ${network.name} network automatically. Please add it manually in your wallet settings.`);
            return false;
          }
        } else if (switchError.code === 4001) {
          // User rejected the request
          toast.error(`Network switch cancelled`);
          return false;
        } else {
          console.error('Error switching network:', switchError);
          toast.error(`Failed to switch to ${network.name}. Please try again or add the network manually.`);
          return false;
        }
      }
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error("Failed to switch network");
      return false;
    }
  };

  const getNetworkByChainId = (chainId) => {
    return networks.find(network => network.chainId === chainId) || networks[0];
  };

  const getCurrentNetwork = () => {
    if (window.ethereum) {
      const chainId = parseInt(window.ethereum.chainId, 16);
      return getNetworkByChainId(chainId);
    }
    return _selectedNetwork;
  };

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId) => {
        const newChainId = parseInt(chainId, 16);
        const network = getNetworkByChainId(newChainId);
        setSelectedNetwork(network);
        toast.success(`Network changed to ${network.name}`);
      };

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const value = {
    selectedNetwork: _selectedNetwork,
    setSelectedNetwork,
    networks,
    switchNetwork,
    getNetworkByChainId,
    getCurrentNetwork,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
