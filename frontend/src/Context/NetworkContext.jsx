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
      // Handle case where network is passed as string (name) instead of object
      let networkObj = network;
      if (typeof network === 'string') {
        networkObj = networks.find(n => n.name === network);
        if (!networkObj) {
          toast.error(`Network "${network}" not found`);
          return false;
        }
      }

      // Check if the network is already selected
      if (_selectedNetwork.chainId === networkObj.chainId) {
        toast.success(`Already connected to ${networkObj.name}`);
        return true;
      }

      // First, update the site's selected network
      setSelectedNetwork(networkObj);

      // Check if wallet is connected
      const isWalletConnected = window.ethereum && window.ethereum.selectedAddress;

      // Handle Tezos (non-EVM)
      if (networkObj.name === "Tezos" && !networkObj.isEVM) {
        // Check for Temple Wallet (thanosWallet is the newer API)
        const templeWallet = window.templeWallet || window.thanosWallet || window.temple;
        if (templeWallet && isWalletConnected) {
          try {
            // Try connecting with Temple Wallet
            const wallet = await templeWallet.connect();
            const account = await wallet.getPKH();
            toast.success(`Connected to Tezos`);
            return true;
          } catch (error) {
            console.error('Tezos connection error:', error);
            toast.error("Tezos network selected, but wallet connection failed. Please ensure Temple Wallet is unlocked.");
            return false;
          }
        } else {
          // Allow network selection even without wallet - user can connect later
          toast.info("Tezos network selected. Install Temple Wallet to connect your wallet.");
          return true;
        }
      }

      // Handle Solana (non-EVM)
      if (networkObj.name === "Solana" && !networkObj.isEVM) {
        // Allow network selection even without wallet - user can connect later
        toast.info("Solana network selected. Connect your Solana wallet to interact.");
        return true;
      }

      // Handle EVM networks - only try to switch wallet if connected
      if (!window.ethereum) {
        // No wallet installed - just update site network
        toast.info(`${networkObj.name} network selected. Install a wallet to connect.`);
        return true;
      }

      // If wallet is not connected, just update the site network
      if (!isWalletConnected) {
        toast.info(`${networkObj.name} network selected. Connect your wallet to interact.`);
        return true;
      }

      // Wallet is connected - try to switch network in wallet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkObj.chainId.toString(16)}` }],
        });
        
        toast.success(`Switched to ${networkObj.name}`);
        return true;
      } catch (switchError) {
        // If the network doesn't exist, try to add it
        if (switchError.code === 4902 || switchError.code === -32603 || switchError.code === -32002) {
          try {
            // Validate RPC URL before adding
            if (!networkObj.rpcUrl || networkObj.rpcUrl.includes('/info')) {
              console.error('Invalid RPC URL for network:', networkObj.name);
              toast.error(`${networkObj.name} has an invalid RPC configuration. Please contact support.`);
              return false;
            }

            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${networkObj.chainId.toString(16)}`,
                chainName: networkObj.name,
                nativeCurrency: {
                  name: networkObj.symbol,
                  symbol: networkObj.symbol,
                  decimals: 18,
                },
                rpcUrls: [networkObj.rpcUrl],
                blockExplorerUrls: networkObj.blockExplorerUrl ? [networkObj.blockExplorerUrl] : [],
              }],
            });
            
            toast.success(`Added and switched to ${networkObj.name}`);
            return true;
          } catch (addError) {
            console.error('Error adding network:', addError);
            console.error('Network details:', {
              name: networkObj.name,
              chainId: networkObj.chainId,
              chainIdHex: `0x${networkObj.chainId.toString(16)}`,
              rpcUrl: networkObj.rpcUrl,
              blockExplorerUrl: networkObj.blockExplorerUrl
            });
            toast.error(`Failed to add ${networkObj.name} network automatically. Please add it manually in your wallet settings.`);
            return false;
          }
        } else if (switchError.code === 4001) {
          // User rejected the request - revert network selection
          setSelectedNetwork(_selectedNetwork);
          toast.error(`Network switch cancelled`);
          return false;
        } else {
          console.error('Error switching network:', switchError);
          // Revert network selection on error
          setSelectedNetwork(_selectedNetwork);
          toast.error(`Failed to switch to ${networkObj.name}. Please try again or add the network manually.`);
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
