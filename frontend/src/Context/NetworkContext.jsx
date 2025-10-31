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
  const [selectedNetwork, setSelectedNetwork] = useState({
    name: "Ethereum",
    symbol: "ETH",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
    chainId: 1,
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    blockExplorerUrl: "https://etherscan.io"
  });

  const networks = [
    { 
      name: "Ethereum", 
      symbol: "ETH", 
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
      chainId: 1,
      rpcUrl: "https://rpc.ankr.com/eth_sepolia",
      blockExplorerUrl: "https://etherscan.io"
    },
    { 
      name: "Polygon", 
      symbol: "MATIC", 
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==",
      chainId: 137,
      rpcUrl: "https://rpc.ankr.com/polygon",
      blockExplorerUrl: "https://polygonscan.com"
    },
    { 
      name: "BSC", 
      symbol: "BNB", 
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==",
      chainId: 56,
      rpcUrl: "https://rpc.ankr.com/bsc",
      blockExplorerUrl: "https://bscscan.com"
    },
    { 
      name: "Arbitrum", 
      symbol: "ARB", 
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyQzJEMzAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0iIzAwQzVGRiIvPgo8L3N2Zz4K",
      chainId: 42161,
      rpcUrl: "https://rpc.ankr.com/arbitrum",
      blockExplorerUrl: "https://arbiscan.io"
    },
    { 
      name: "Tezos", 
      symbol: "XTZ", 
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0MDQwNDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0iIzAwQzVGRiIvPgo8L3N2Zz4K",
      chainId: 1,
      rpcUrl: "https://mainnet.api.tezos.com",
      blockExplorerUrl: "https://tzstats.com"
    },
    { 
      name: "Hyperliquid", 
      symbol: "HL", 
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMEZGNzciLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==",
      chainId: 421614,
      rpcUrl: "https://api.hyperliquid.xyz/info",
      blockExplorerUrl: "https://explorer.hyperliquid.xyz"
    },
  ];

  const switchNetwork = async (network) => {
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask to switch networks");
        return false;
      }

      // Check if the network is already selected
      if (selectedNetwork.chainId === network.chainId) {
        toast.success(`Already connected to ${network.name}`);
        return true;
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
        if (switchError.code === 4902) {
          try {
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
                blockExplorerUrls: network.blockExplorerUrls || [],
              }],
            });
            
            setSelectedNetwork(network);
            toast.success(`Added and switched to ${network.name}`);
            return true;
          } catch (addError) {
            console.error('Error adding network:', addError);
            toast.error(`Failed to add ${network.name} network`);
            return false;
          }
        } else {
          console.error('Error switching network:', switchError);
          toast.error(`Failed to switch to ${network.name}`);
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
    return selectedNetwork;
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
    selectedNetwork,
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

