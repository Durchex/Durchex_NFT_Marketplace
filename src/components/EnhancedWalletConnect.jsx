import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import { FiChevronDown, FiLogOut, FiCopy, FiExternalLink, FiUser, FiSettings, FiShield, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EnhancedWalletConnect = () => {
  const { address, connectWallet, disconnectWallet, accountBalance, shortenAddress } = useContext(ICOContent);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [networkBalance, setNetworkBalance] = useState('0');

  const networks = [
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: '🔷',
      chainId: 1,
      rpcUrl: 'https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca',
      blockExplorer: 'https://etherscan.io',
      color: 'blue'
    },
    {
      id: 'polygon',
      name: 'Polygon',
      symbol: 'MATIC',
      icon: '🟣',
      chainId: 137,
      rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/demo',
      blockExplorer: 'https://polygonscan.com',
      color: 'purple'
    },
    {
      id: 'bsc',
      name: 'BSC',
      symbol: 'BNB',
      icon: '🟡',
      chainId: 56,
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      blockExplorer: 'https://bscscan.com',
      color: 'yellow'
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      symbol: 'ETH',
      icon: '🔵',
      chainId: 42161,
      rpcUrl: 'https://arbitrum-goerli.infura.io/v3/demo',
      blockExplorer: 'https://arbiscan.io',
      color: 'blue'
    },
    {
      id: 'tezos',
      name: 'Tezos',
      symbol: 'XTZ',
      icon: '🟠',
      chainId: 1729,
      rpcUrl: 'https://rpc.ghostnet.teztnets.xyz',
      blockExplorer: 'https://tzkt.io',
      color: 'orange'
    },
    {
      id: 'hyperliquid',
      name: 'Hyperliquid',
      symbol: 'HL',
      icon: '⚡',
      chainId: 421614,
      rpcUrl: 'https://api.hyperliquid-testnet.xyz/evm',
      blockExplorer: 'https://explorer.hyperliquid.xyz',
      color: 'green'
    }
  ];

  const wallets = [
    {
      name: 'MetaMask',
      icon: '🦊',
      isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
      connect: () => connectWallet('metamask'),
      downloadLink: 'https://metamask.io/download/',
      supportedNetworks: ['ethereum', 'polygon', 'bsc', 'arbitrum']
    },
    {
      name: 'Coinbase Wallet',
      icon: '🔵',
      isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
      connect: () => connectWallet('coinbase'),
      downloadLink: 'https://www.coinbase.com/wallet',
      supportedNetworks: ['ethereum', 'polygon', 'bsc', 'arbitrum']
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      isInstalled: () => false,
      connect: () => connectWallet('walletconnect'),
      downloadLink: 'https://walletconnect.com/',
      supportedNetworks: ['ethereum', 'polygon', 'bsc', 'arbitrum']
    },
    {
      name: 'Trust Wallet',
      icon: '🛡️',
      isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isTrust,
      connect: () => connectWallet('trustwallet'),
      downloadLink: 'https://trustwallet.com/',
      supportedNetworks: ['ethereum', 'polygon', 'bsc', 'arbitrum']
    },
    {
      name: 'Temple Wallet',
      icon: '🏛️',
      isInstalled: () => typeof window.templeWallet !== 'undefined',
      connect: () => connectWallet('temple'),
      downloadLink: 'https://templewallet.com/',
      supportedNetworks: ['tezos']
    },
    {
      name: 'Hyperliquid Wallet',
      icon: '⚡',
      isInstalled: () => typeof window.hyperliquid !== 'undefined',
      connect: () => connectWallet('hyperliquid'),
      downloadLink: 'https://hyperliquid.xyz/',
      supportedNetworks: ['hyperliquid']
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.wallet-dropdown')) {
        setIsDropdownOpen(false);
        setShowWalletOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (address) {
      updateNetworkBalance();
    }
  }, [address, selectedNetwork]);

  const updateNetworkBalance = async () => {
    try {
      const network = networks.find(n => n.id === selectedNetwork);
      if (!network) return;

      // Simulate balance fetching for different networks
      const mockBalances = {
        ethereum: '2.5',
        polygon: '150.0',
        bsc: '0.8',
        arbitrum: '1.2',
        tezos: '45.0',
        hyperliquid: '12.5'
      };

      setNetworkBalance(mockBalances[selectedNetwork] || '0');
    } catch (error) {
      console.error('Error updating network balance:', error);
    }
  };

  const handleConnectClick = () => {
    if (address) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setShowWalletOptions(!showWalletOptions);
    }
  };

  const handleWalletSelect = async (wallet) => {
    if (!wallet.isInstalled()) {
      toast.error(`Please install ${wallet.name} to connect.`);
      window.open(wallet.downloadLink, '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      await connectWallet(wallet.name.toLowerCase());
      setShowWalletOptions(false);
      setIsDropdownOpen(true);
      toast.success(`${wallet.name} connected successfully!`);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
    setNetworkBalance('0');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const openExplorer = () => {
    const network = networks.find(n => n.id === selectedNetwork);
    if (network) {
      window.open(`${network.blockExplorer}/address/${address}`, '_blank');
    }
  };

  const switchNetwork = async (networkId) => {
    try {
      const network = networks.find(n => n.id === networkId);
      if (!network) return;

      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        });
      }

      setSelectedNetwork(networkId);
      await updateNetworkBalance();
      toast.success(`Switched to ${network.name}`);
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    }
  };

  const formatBalance = (balance) => {
    return parseFloat(balance).toFixed(4);
  };

  const getFilteredWallets = () => {
    return wallets.filter(wallet => 
      wallet.supportedNetworks.includes(selectedNetwork)
    );
  };

  if (!address) {
    return (
      <div className="relative wallet-dropdown">
        <button
          onClick={handleConnectClick}
          disabled={isConnecting}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FiShield className="w-4 h-4" />
          <span className="font-display">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <FiChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              showWalletOptions ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showWalletOptions && (
          <div className="absolute right-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl animate-slide-up origin-top-right z-50">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FiShield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-display font-medium">Connect Wallet</div>
                  <div className="text-gray-400 font-display text-sm">Choose your preferred wallet</div>
                </div>
              </div>
            </div>

            {/* Network Selection */}
            <div className="p-4 border-b border-gray-700">
              <div className="text-white font-display font-medium mb-2">Select Network</div>
              <div className="grid grid-cols-2 gap-2">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => setSelectedNetwork(network.id)}
                    className={`p-2 rounded-lg text-left transition-colors ${
                      selectedNetwork === network.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{network.icon}</span>
                      <div>
                        <div className="font-display text-sm font-medium">{network.name}</div>
                        <div className="text-xs opacity-75">{network.symbol}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Options */}
            <div className="p-2">
              {getFilteredWallets().map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletSelect(wallet)}
                  className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200 group"
                >
                  <div className="text-2xl">{wallet.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-display font-medium">{wallet.name}</span>
                      {wallet.isInstalled() ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          Installed
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          Not Installed
                        </span>
                      )}
                    </div>
                    {!wallet.isInstalled() && (
                      <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors mt-1 font-display">
                        Click to download {wallet.name}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative wallet-dropdown">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <FiShield className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
        </div>
        <div className="text-left">
          <div className="text-sm font-display font-medium text-white">
            {shortenAddress(address)}
          </div>
          <div className="text-xs font-display text-gray-400">
            {formatBalance(networkBalance)} {networks.find(n => n.id === selectedNetwork)?.symbol}
          </div>
        </div>
        <FiChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="wallet-dropdown absolute right-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl animate-slide-up origin-top-right z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-display font-medium">Connected Wallet</div>
                <div className="text-gray-400 font-display text-sm">{shortenAddress(address)}</div>
              </div>
            </div>
          </div>

          {/* Network Selection */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-white font-display font-medium mb-2">Current Network</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{networks.find(n => n.id === selectedNetwork)?.icon}</span>
                <span className="font-display text-white">{networks.find(n => n.id === selectedNetwork)?.name}</span>
              </div>
              <button
                onClick={updateNetworkBalance}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <FiRefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-display text-sm">Balance</span>
              <span className="text-white font-display font-medium">
                {formatBalance(networkBalance)} {networks.find(n => n.id === selectedNetwork)?.symbol}
              </span>
            </div>
          </div>

          {/* Network Switcher */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-white font-display font-medium mb-2">Switch Network</div>
            <div className="grid grid-cols-2 gap-2">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => switchNetwork(network.id)}
                  className={`p-2 rounded-lg text-left transition-colors ${
                    selectedNetwork === network.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{network.icon}</span>
                    <span className="font-display text-xs">{network.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={copyAddress}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <FiCopy className="w-4 h-4" />
              <span className="font-display">Copy Address</span>
            </button>
            <button
              onClick={openExplorer}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <FiExternalLink className="w-4 h-4" />
              <span className="font-display">View on Explorer</span>
            </button>
            <button
              onClick={() => {
                window.location.href = '/user-profile';
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <FiSettings className="w-4 h-4" />
              <span className="font-display">Profile Settings</span>
            </button>
            <hr className="my-2 border-gray-700" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <FiLogOut className="w-4 h-4" />
              <span className="font-display">Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWalletConnect;
