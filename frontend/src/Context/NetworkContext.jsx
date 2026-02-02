import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { SUPPORTED_NETWORKS, getNetworkById } from './constants';
import { ICOContent } from './index';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

// Networks list for dropdown – single source of truth (id used for contractAddresses / selectedChain)
const networks = SUPPORTED_NETWORKS;

export const NetworkProvider = ({ children }) => {
  const defaultNetwork = getNetworkById('ethereum') || networks[0];
  const [_selectedNetwork, _setSelectedNetwork] = useState(() => {
    const saved = localStorage.getItem('selectedNetwork');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const byId = parsed.id && getNetworkById(parsed.id);
        if (byId) return byId;
        const byName = networks.find((n) => n.name === parsed.name);
        if (byName) return byName;
      } catch (error) {
        console.error('Error parsing saved network:', error);
      }
    }
    return defaultNetwork;
  });

  const setSelectedNetwork = (network) => {
    _setSelectedNetwork(network);
    localStorage.setItem('selectedNetwork', JSON.stringify(network));
  };

  const icoContext = useContext(ICOContent);
  const setSelectedChainFromICO = icoContext?.setSelectedChain;

  // Sync ICOContent selectedChain on load (from localStorage) so contracts/API use same network as dropdown
  useEffect(() => {
    if (_selectedNetwork?.id && setSelectedChainFromICO) setSelectedChainFromICO(_selectedNetwork.id);
  }, [_selectedNetwork?.id, setSelectedChainFromICO]);

  const switchNetwork = async (network) => {
    try {
      // Handle case where network is passed as string (name or id) instead of object
      let networkObj = network;
      if (typeof network === 'string') {
        networkObj = networks.find(n => n.name === network) || getNetworkById(network);
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

      // First, update the site's selected network and sync to ICOContent (contracts, API)
      setSelectedNetwork(networkObj);
      if (networkObj.id && setSelectedChainFromICO) setSelectedChainFromICO(networkObj.id);

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
          toast("Tezos network selected. Install Temple Wallet to connect your wallet.", { icon: 'ℹ️' });
          return true;
        }
      }

      // Handle Solana (non-EVM)
      if (networkObj.name === "Solana" && !networkObj.isEVM) {
        // Allow network selection even without wallet - user can connect later
        toast("Solana network selected. Connect your Solana wallet to interact.", { icon: 'ℹ️' });
        return true;
      }

      // Handle EVM networks - only try to switch wallet if connected
      if (!window.ethereum) {
        // No wallet installed - just update site network
        toast(`${networkObj.name} network selected. Install a wallet to connect.`, { icon: 'ℹ️' });
        return true;
      }

      // If wallet is not connected, just update the site network
      if (!isWalletConnected) {
        toast(`${networkObj.name} network selected. Connect your wallet to interact.`, { icon: 'ℹ️' });
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

  // Listen for network changes (wallet switch) – sync to selectedNetwork and ICOContent selectedChain
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId) => {
        const newChainId = parseInt(chainId, 16);
        const network = getNetworkByChainId(newChainId);
        setSelectedNetwork(network);
        if (network.id && setSelectedChainFromICO) setSelectedChainFromICO(network.id);
        toast.success(`Network changed to ${network.name}`);
      };

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [setSelectedChainFromICO]);

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
