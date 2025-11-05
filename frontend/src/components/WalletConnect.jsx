import React, { useState, useEffect } from 'react';
import { ICOContent } from '../Context';
import { useContext } from 'react';
import { 
  FiChevronDown, 
  FiLogOut, 
  FiCopy, 
  FiExternalLink,
  FiUser,
  FiSettings,
  FiShield,
  FiDownload
} from 'react-icons/fi';
import { 
  HiOutlineLogout,
  HiOutlineClipboardCopy,
  HiOutlineExternalLink
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const WalletConnect = () => {
  const { address, connectWallet, disconnectWallet, accountBalance, shortenAddress } = useContext(ICOContent);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Wallet options with their detection methods
  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask',
      isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
      downloadUrl: 'https://metamask.io/download/'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔷',
      description: 'Connect using Coinbase Wallet',
      isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
      downloadUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect using WalletConnect',
      isInstalled: () => false, // WalletConnect is always available
      downloadUrl: 'https://walletconnect.com/'
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Connect using Trust Wallet',
      isInstalled: () => typeof window.ethereum !== 'undefined' && window.ethereum.isTrust,
      downloadUrl: 'https://trustwallet.com/'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.wallet-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWalletSelect = async (wallet) => {
    setIsConnecting(true);
    setIsDropdownOpen(false);

    try {
      // Check if wallet is installed
      if (!wallet.isInstalled()) {
        toast.error(`${wallet.name} is not installed. Please install it first.`, {
          duration: 5000,
          action: {
            label: 'Download',
            onClick: () => window.open(wallet.downloadUrl, '_blank')
          }
        });
        return;
      }

      // Connect to the selected wallet
      await connectWallet();
      toast.success(`Connected to ${wallet.name}!`);
    } catch (error) {
      console.error('Connection error:', error);
      if (error.code === 4001) {
        toast.error('User rejected the connection request');
      } else {
        toast.error(`Failed to connect to ${wallet.name}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const openExplorer = () => {
    const explorerUrl = `https://sepolia.etherscan.io/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  const formatBalance = (balance) => {
    if (!balance) return '0.0000';
    return parseFloat(balance).toFixed(4);
  };

  // If wallet is not connected, show wallet selection dropdown
  if (!address) {
    return (
      <div className="relative wallet-dropdown">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isConnecting}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <FiShield className="w-4 h-4" />
          <span className="font-display">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          <FiChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Wallet Selection Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
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

            {/* Wallet Options */}
            <div className="p-2">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
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
                    <div className="text-xs text-gray-400">{wallet.description}</div>
                  </div>
                  {!wallet.isInstalled() && (
                    <FiDownload className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700 bg-gray-900/50">
              <div className="text-xs text-gray-400 text-center">
                By connecting a wallet, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If wallet is connected, show connected wallet dropdown
  return (
    <div className="relative wallet-dropdown">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {/* Wallet Icon with Status */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <FiShield className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
        </div>

        {/* Address and Balance */}
        <div className="text-left">
          <div className="text-sm font-display font-medium text-white">
            {shortenAddress(address)}
          </div>
          <div className="text-xs font-display text-gray-400">
            {formatBalance(accountBalance)} ETH
          </div>
        </div>

        {/* Dropdown Arrow */}
        <FiChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Connected Wallet Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
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

          {/* Balance Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-display text-sm">Balance</span>
              <span className="text-white font-display font-medium">
                {formatBalance(accountBalance)} ETH
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-2">
            <button
              onClick={copyAddress}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <HiOutlineClipboardCopy className="w-4 h-4" />
              <span className="font-display">Copy Address</span>
            </button>

            <button
              onClick={openExplorer}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <HiOutlineExternalLink className="w-4 h-4" />
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
              <HiOutlineLogout className="w-4 h-4" />
              <span className="font-display">Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
