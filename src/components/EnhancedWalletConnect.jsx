import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import { ethers } from 'ethers';
import { FiChevronDown, FiLogOut, FiCopy, FiExternalLink, FiUser, FiSettings, FiShield, FiRefreshCw, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EnhancedWalletConnect = () => {
  const { address, connectWallet, accountBalance, shortenAddress, setAddress, setAccountBalance } = useContext(ICOContent);
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
      const target = event.target;
      // Check if click is outside the wallet dropdown container
      const walletDropdown = target.closest('.wallet-dropdown');
      if (!walletDropdown) {
        setIsDropdownOpen(false);
        setShowWalletOptions(false);
      }
    };

    // Only add listener if dropdown is open
    if (isDropdownOpen || showWalletOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen, showWalletOptions]);

  useEffect(() => {
    // Always reflect the wallet's base balance; do not switch to per-network token balances
    if (address && accountBalance) {
      setNetworkBalance(accountBalance);
    } else {
      setNetworkBalance('0');
    }
  }, [address, accountBalance]);

  const updateNetworkBalance = async () => {
    try {
      if (!address) {
        setNetworkBalance('0');
        return;
      }
      // Do not change to network-specific token balance; keep using base context balance
      setNetworkBalance(accountBalance || '0');
    } catch (error) {
      console.error('Error updating network balance:', error);
      // Fallback to accountBalance from context
      setNetworkBalance(accountBalance || '0');
    }
  };

  const handleConnectClick = () => {
    if (address) {
      setIsDropdownOpen(prev => !prev);
    } else {
      setShowWalletOptions(prev => !prev);
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
      await connectWallet();
      setShowWalletOptions(false);
      // Don't auto-open dropdown, let user see the connected state first
      toast.success(`${wallet.name} connected successfully!`);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    setAccountBalance(null);
    setIsDropdownOpen(false);
    setNetworkBalance('0');
    toast.success('Wallet disconnected');
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
      // Do not change the shown balance on network switch
      toast.success(`Switched to ${network.name}`);
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    }
  };

  const formatBalance = (balance) => {
    if (!balance || balance === '0' || isNaN(parseFloat(balance))) {
      return '0.0000';
    }
    return parseFloat(balance).toFixed(4);
  };

  const getFilteredWallets = () => {
    return wallets.filter(wallet => 
      wallet.supportedNetworks.includes(selectedNetwork)
    );
  };

  if (!address) {
    return (
      <div className="relative wallet-dropdown z-[10000]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleConnectClick();
          }}
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
          <>
            {/* Mobile full-screen drawer */}
            <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col pt-16 pb-4 px-4 md:hidden">
              <div className="bg-gray-900 rounded-lg border border-gray-600 flex flex-col max-h-full">
              <div className="flex-shrink-0 p-6 md:p-4 md:border-b md:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <FiShield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-display font-medium text-lg">Connect Wallet</div>
                      <div className="text-gray-400 font-display text-sm">Choose your preferred wallet</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWalletOptions(false)}
                    className="text-gray-400 hover:text-white transition-colors md:hidden"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="mb-6">
                    <div className="text-white font-display font-medium mb-4 text-lg">Select Network</div>
                    <div className="grid grid-cols-1 gap-3">
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => setSelectedNetwork(network.id)}
                          className={`p-4 rounded-lg text-left transition-colors border ${
                            selectedNetwork === network.id
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{network.icon}</span>
                            <div>
                              <div className="font-display text-lg font-medium">{network.name}</div>
                              <div className="text-sm opacity-75">{network.symbol}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getFilteredWallets().map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleWalletSelect(wallet)}
                        className="w-full flex items-center space-x-4 px-4 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700"
                      >
                        <div className="text-2xl">{wallet.icon}</div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-display font-medium text-lg">{wallet.name}</span>
                            {wallet.isInstalled() ? (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Installed</span>
                            ) : (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Not Installed</span>
                            )}
                          </div>
                          {!wallet.isInstalled() && (
                            <p className="text-sm text-gray-500">Click to download {wallet.name}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop anchored popover */}
            <div className="hidden md:block absolute right-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl z-[9999]">
              <div className="flex flex-col max-h-[70vh]">
                <div className="flex-shrink-0 p-4 border-b border-gray-700">
                  <div className="text-white font-display font-medium text-lg">Connect Wallet</div>
                  <div className="text-gray-400 font-display text-sm">Choose your preferred wallet</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4">
                    <div className="text-white font-display font-medium mb-3 text-base">Select Network</div>
                    <div className="grid grid-cols-2 gap-2">
                      {networks.map((network) => (
                        <button
                          key={network.id}
                          onClick={() => setSelectedNetwork(network.id)}
                          className={`p-3 rounded-lg text-left transition-colors border ${
                            selectedNetwork === network.id
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{network.icon}</span>
                            <div className="font-display text-sm font-medium">{network.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {getFilteredWallets().map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleWalletSelect(wallet)}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700"
                      >
                        <div className="text-xl">{wallet.icon}</div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-display font-medium">{wallet.name}</span>
                            {wallet.isInstalled() ? (
                              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Installed</span>
                            ) : (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">Not Installed</span>
                            )}
                          </div>
                          {!wallet.isInstalled() && (
                            <p className="text-xs text-gray-500">Click to download {wallet.name}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative wallet-dropdown z-[10000]">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDropdownOpen(prev => !prev);
        }}
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
            {formatBalance(accountBalance || networkBalance)} ETH
          </div>
        </div>
        <FiChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="wallet-dropdown-content" onClick={(e) => e.stopPropagation()}>
          {/* Mobile full-screen drawer */}
          <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col pt-16 pb-4 px-4 md:hidden">
            <div className="bg-gray-900 rounded-lg border border-gray-600 flex flex-col max-h-full">
            <div className="flex-shrink-0 p-6 md:p-4 md:border-b md:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-display font-medium text-lg">Connected Wallet</div>
                    <div className="text-gray-400 font-display text-sm">{shortenAddress(address)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors md:hidden"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
              {/* Network Selection */}
              <div className="mb-6 md:p-4 md:border-b md:border-gray-700">
                <div className="text-white font-display font-medium mb-4 text-lg">Current Network</div>
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{networks.find(n => n.id === selectedNetwork)?.icon}</span>
                    <span className="font-display text-white text-lg">{networks.find(n => n.id === selectedNetwork)?.name}</span>
                  </div>
                  <button
                    onClick={updateNetworkBalance}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                  >
                    <FiRefreshCw className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-6 md:p-4 md:border-b md:border-gray-700">
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <span className="text-gray-400 font-display text-lg">Balance</span>
                  <span className="text-white font-display font-medium text-lg">
                    {formatBalance(accountBalance || networkBalance)} ETH
                  </span>
                </div>
              </div>

              {/* Network Switcher */}
              <div className="mb-6 md:p-4 md:border-b md:border-gray-700">
                <div className="text-white font-display font-medium mb-4 text-lg">Switch Network</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-2">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => switchNetwork(network.id)}
                      className={`p-4 rounded-lg text-left transition-colors border ${
                        selectedNetwork === network.id
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{network.icon}</span>
                        <span className="font-display text-lg">{network.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 md:p-2">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center space-x-4 px-4 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  <FiCopy className="w-5 h-5" />
                  <span className="font-display text-lg">Copy Address</span>
                </button>
                <button
                  onClick={openExplorer}
                  className="w-full flex items-center space-x-4 px-4 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  <FiExternalLink className="w-5 h-5" />
                  <span className="font-display text-lg">View on Explorer</span>
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/user-profile';
                  }}
                  className="w-full flex items-center space-x-4 px-4 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  <FiSettings className="w-5 h-5" />
                  <span className="font-display text-lg">Profile Settings</span>
                </button>
                <hr className="my-4 border-gray-700" />
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center space-x-4 px-4 py-4 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200 border border-red-700/50"
                >
                  <FiLogOut className="w-5 h-5" />
                  <span className="font-display text-lg">Disconnect</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop anchored popover */}
          <div className="hidden md:block absolute right-0 top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl z-[9999]">
            <div className="flex flex-col max-h-[70vh]">
              <div className="flex-shrink-0 p-4 border-b border-gray-700">
                <div className="text-white font-display font-medium text-lg">Connected Wallet</div>
                <div className="text-gray-400 font-display text-sm">{shortenAddress(address)}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <div className="text-white font-display font-medium mb-3 text-base">Current Network</div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{networks.find(n => n.id === selectedNetwork)?.icon}</span>
                      <span className="font-display text-white">{networks.find(n => n.id === selectedNetwork)?.name}</span>
                    </div>
                    <button onClick={updateNetworkBalance} className="p-2 hover:bg-gray-700 rounded transition-colors">
                      <FiRefreshCw className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-display font-medium mb-3 text-base">Balance</div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <span className="text-gray-400 font-display">Balance</span>
                        <span className="text-white font-display font-medium">{formatBalance(accountBalance || networkBalance)} ETH</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-white font-display font-medium mb-3 text-base">Switch Network</div>
                  <div className="grid grid-cols-2 gap-2">
                    {networks.map((network) => (
                      <button
                        key={network.id}
                        onClick={() => switchNetwork(network.id)}
                        className={`p-3 rounded-lg text-left transition-colors border ${
                          selectedNetwork === network.id
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{network.icon}</span>
                          <span className="font-display">{network.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <button onClick={copyAddress} className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700">
                    <FiCopy className="w-4 h-4" />
                    <span className="font-display">Copy Address</span>
                  </button>
                  <button onClick={openExplorer} className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700">
                    <FiExternalLink className="w-4 h-4" />
                    <span className="font-display">View on Explorer</span>
                  </button>
                  <button onClick={() => { window.location.href = '/user-profile'; }} className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 border border-gray-700">
                    <FiSettings className="w-4 h-4" />
                    <span className="font-display">Profile Settings</span>
                  </button>
                  <hr className="my-3 border-gray-700" />
                  <button onClick={handleDisconnect} className="w-full flex items-center space-x-3 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200 border border-red-700/50">
                    <FiLogOut className="w-4 h-4" />
                    <span className="font-display">Disconnect</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWalletConnect;
