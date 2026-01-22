import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  HiOutlineLogout,
  HiOutlineClipboardCopy,
  HiOutlineExternalLink
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const WalletConnect = () => {
  const { address, connectWallet, disconnectWallet, accountBalance, shortenAddress, setAddress, setAccountBalance } = useContext(ICOContent);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isDropdownOpen]);

  // Wallet options with their detection methods
  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        // Check if MetaMask is specifically installed
        if (window.ethereum) {
          // Check if it's MetaMask directly
          if (window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
            return true;
          }
          // Check if MetaMask is in the providers array
          if (Array.isArray(window.ethereum.providers)) {
            return window.ethereum.providers.some(p => p.isMetaMask && !p.isCoinbaseWallet);
          }
        }
        return false;
      },
      getProvider: () => {
        if (window.ethereum) {
          if (window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
            return window.ethereum;
          }
          if (Array.isArray(window.ethereum.providers)) {
            return window.ethereum.providers.find(p => p.isMetaMask && !p.isCoinbaseWallet);
          }
        }
        return null;
      },
      downloadUrl: 'https://metamask.io/download/'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔷',
      description: 'Connect using Coinbase Wallet',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        if (window.ethereum) {
          if (window.ethereum.isCoinbaseWallet) {
            return true;
          }
          if (Array.isArray(window.ethereum.providers)) {
            return window.ethereum.providers.some(p => p.isCoinbaseWallet);
          }
        }
        return false;
      },
      getProvider: () => {
        if (window.ethereum) {
          if (window.ethereum.isCoinbaseWallet) {
            return window.ethereum;
          }
          if (Array.isArray(window.ethereum.providers)) {
            return window.ethereum.providers.find(p => p.isCoinbaseWallet);
          }
        }
        return null;
      },
      downloadUrl: 'https://www.coinbase.com/wallet'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect using WalletConnect',
      isInstalled: () => true, // WalletConnect is available as a protocol (QR/mobile)
      getProvider: () => null, // Will be initialized in connectWallet
      downloadUrl: 'https://walletconnect.com/'
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Connect using Trust Wallet',
      isInstalled: () => {
        if (typeof window === 'undefined') return false;
        if (window.ethereum) {
          if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
            return true;
          }
          if (Array.isArray(window.ethereum.providers)) {
            return window.ethereum.providers.some(p => p.isTrust || p.isTrustWallet);
          }
        }
        return false;
      },
      getProvider: () => {
        if (window.ethereum) {
          if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
            return window.ethereum;
          }
          if (Array.isArray(window.ethereum.providers)) {
            return window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
          }
        }
        return null;
      },
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
      // Check if wallet is installed (except WalletConnect which is always available)
      if (wallet.id !== 'walletconnect' && !wallet.isInstalled()) {
        toast.error(`${wallet.name} is not installed. Please install it first.`, {
          duration: 5000,
          action: {
            label: 'Download',
            onClick: () => window.open(wallet.downloadUrl, '_blank')
          }
        });
        setIsConnecting(false);
        return;
      }

      // For specific wallets, get the provider and connect directly
      if (wallet.id === 'walletconnect') {
        // WalletConnect is handled by connectWallet function
        const result = await connectWallet(wallet.id);
        if (result) {
          toast.success(`Connected to ${wallet.name}!`);
        }
      } else if (wallet.getProvider) {
        // For other wallets, get the specific provider and connect directly
        const specificProvider = wallet.getProvider();
        if (!specificProvider) {
          toast.error(`${wallet.name} provider not found. Please ensure the wallet is installed and unlocked.`);
          setIsConnecting(false);
          return;
        }

        try {
          // Directly request accounts from the specific provider - this triggers the wallet popup
          let accounts;
          if (specificProvider.request) {
            console.log(`[WalletConnect] Requesting accounts from ${wallet.name} provider`);
            accounts = await specificProvider.request({
              method: "eth_requestAccounts",
            });
          } else if (specificProvider.enable) {
            // Legacy wallet support
            accounts = await specificProvider.enable();
          } else {
            throw new Error(`${wallet.name} does not support connection`);
          }

          if (accounts && accounts.length > 0) {
            // Update the context with the connected account
            setAddress(accounts[0]);
            
            // Get balance
            try {
              const ethersProvider = new ethers.providers.Web3Provider(specificProvider);
              const balance = await ethersProvider.getBalance(accounts[0]);
              const balanceFormatted = ethers.utils.formatEther(balance);
              setAccountBalance(balanceFormatted);
            } catch (balanceError) {
              console.error('Error fetching balance:', balanceError);
              setAccountBalance("0");
            }
            
            toast.success(`Connected to ${wallet.name}!`);
          } else {
            toast.error("No account found. Please unlock your wallet.");
          }
        } catch (error) {
          console.error(`[WalletConnect] Error connecting to ${wallet.name}:`, error);
          if (error.code === 4001) {
            toast.error('Connection rejected by user');
          } else if (error.code === -32002) {
            toast.error('Connection request already pending. Please check your wallet.');
          } else {
            toast.error(`Failed to connect to ${wallet.name}: ${error.message}`);
          }
        }
      } else {
        // Fallback to connectWallet function
        const result = await connectWallet(wallet.id);
        if (result) {
          toast.success(`Connected to ${wallet.name}!`);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      if (error.code === 4001) {
        toast.error('User rejected the connection request');
      } else {
        toast.error(`Failed to connect to ${wallet.name}. Please try again.`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchWallet = () => {
    disconnectWallet();
    setIsDropdownOpen(false);
    // After disconnecting, the component will automatically show the connect options
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
      <>
      <div className="relative wallet-dropdown z-[100]">
        <button
          ref={buttonRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isConnecting}
          className="flex items-center space-x-1.5 xs:space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 relative z-[100]"
        >
          <FiShield className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
          <span className="font-display text-xs xs:text-sm sm:text-base hidden xs:inline">{isConnecting ? 'Connecting...' : 'Connect'}</span>
          <span className="font-display text-xs xs:text-sm sm:text-base hidden sm:inline">{isConnecting ? 'Connecting...' : 'Wallet'}</span>
          <FiChevronDown 
            className={`w-3.5 h-3.5 xs:w-4 xs:h-4 transition-transform duration-200 flex-shrink-0 hidden xs:block ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>

        {/* Wallet Selection Dropdown - Rendered via Portal outside header to prevent expansion */}
        {isDropdownOpen && typeof document !== 'undefined' && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsDropdownOpen(false)}></div>
            <div 
              className="fixed w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-[9999] overflow-hidden"
              style={{ 
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
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

            {/* Wallet Options - Show installed wallets first */}
            <div className="p-2">
              {walletOptions
                .sort((a, b) => {
                  // Sort: installed wallets first, then by name
                  const aInstalled = a.isInstalled();
                  const bInstalled = b.isInstalled();
                  if (aInstalled && !bInstalled) return -1;
                  if (!aInstalled && bInstalled) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((wallet) => {
                  const isInstalled = wallet.isInstalled();
                  return (
                    <button
                      key={wallet.id}
                      onClick={() => handleWalletSelect(wallet)}
                      disabled={isConnecting}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 group ${
                        isInstalled
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer'
                          : 'text-gray-500 hover:text-gray-400 hover:bg-gray-800/50 cursor-not-allowed opacity-60'
                      } ${isConnecting ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <div className="text-2xl">{wallet.icon}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-display font-medium">{wallet.name}</span>
                          {isInstalled ? (
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
                      {!isInstalled && (
                        <FiDownload className="w-4 h-4 text-gray-400 group-hover:text-white" />
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700 bg-gray-900/50">
              <div className="text-xs text-gray-400 text-center">
                By connecting a wallet, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
          </>,
          document.body
        )}
      </>
    );
  }

  // If wallet is connected, show connected wallet dropdown
  return (
    <>
    <div className="relative wallet-dropdown z-[100]">
      <button
        ref={buttonRef}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl relative z-[100]"
      >
        {/* Wallet Icon with Status */}
        <div className="relative flex-shrink-0">
          <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <FiShield className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 xs:-bottom-1 xs:-right-1 w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
        </div>

        {/* Address and Balance - Hide on very small screens */}
        <div className="text-left hidden xs:block">
          <div className="text-xs xs:text-sm font-display font-medium text-white">
            {shortenAddress(address)}
          </div>
          <div className="text-[10px] xs:text-xs font-display text-gray-400 hidden sm:block">
            {formatBalance(accountBalance)} ETH
          </div>
        </div>

        {/* Dropdown Arrow */}
        <FiChevronDown 
          className={`w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 hidden xs:block ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
    </div>

      {/* Connected Wallet Dropdown - Rendered via Portal outside header to prevent expansion */}
      {isDropdownOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsDropdownOpen(false)}></div>
          <div 
            className="fixed w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-[9999] overflow-hidden"
            style={{ 
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
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
              onClick={handleSwitchWallet}
              className="w-full flex items-center space-x-3 px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="font-display">Switch Wallet</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <HiOutlineLogout className="w-4 h-4" />
              <span className="font-display">Disconnect</span>
            </button>
          </div>
        </div>
        </>,
        document.body
      )}
    </>
  );
};

export default WalletConnect;
