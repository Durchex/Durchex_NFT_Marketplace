import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
import { userAPI } from '../services/api';

const WalletConnect = () => {
  const { address, connectWallet, disconnectWallet, accountBalance, shortenAddress, setAddress, setAccountBalance } = useContext(ICOContent);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isDropdownOpen]);

  // Fetch user profile when address changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (address) {
        try {
          const profile = await userAPI.getUserProfile(address);
          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.warn('[WalletConnect] Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [address]);

  // Get avatar URL with fallback
  const avatarUrl = useMemo(() => {
    if (userProfile?.image) return userProfile.image;
    if (userProfile?.avatar) return userProfile.avatar;
    if (address) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`;
    }
    return null;
  }, [userProfile, address]);

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
    console.log('[WalletConnect] handleWalletSelect CALLED with wallet:', wallet);
    console.log('[WalletConnect] Wallet details:', {
      id: wallet?.id,
      name: wallet?.name,
      isInstalled: wallet?.isInstalled?.()
    });
    
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

      console.log('[WalletConnect] Attempting to connect to:', wallet.name, 'with id:', wallet.id);
      
      // For WalletConnect, use the context function directly
      if (wallet.id === 'walletconnect') {
        console.log('[WalletConnect] Connecting via WalletConnect protocol');
        const result = await connectWallet(wallet.id);
        if (result) {
          toast.success(`Connected to ${wallet.name}!`);
        } else {
          toast.error(`Failed to connect to ${wallet.name}. Please try again.`);
        }
        setIsConnecting(false);
        return;
      }

      // For other wallets, get the provider and connect directly
      if (wallet.getProvider && typeof window !== 'undefined') {
        const specificProvider = wallet.getProvider();
        console.log('[WalletConnect] Got provider for', wallet.name, ':', specificProvider);
        
        if (!specificProvider) {
          toast.error(`Could not find ${wallet.name} provider. Please make sure it's installed.`);
          setIsConnecting(false);
          return;
        }

        // Ensure this provider is the primary one in window.ethereum
        if (Array.isArray(window.ethereum?.providers)) {
          const providerIndex = window.ethereum.providers.findIndex(p => p === specificProvider);
          console.log('[WalletConnect] Provider index in array:', providerIndex);
          
          if (providerIndex !== -1) {
            // Move selected wallet to first position if it's not already first
            if (providerIndex > 0) {
              console.log('[WalletConnect] Moving provider to first position');
              [window.ethereum.providers[0], window.ethereum.providers[providerIndex]] = 
                [window.ethereum.providers[providerIndex], window.ethereum.providers[0]];
            }
            // Use the first provider (which is now our selected wallet)
            window.ethereum = window.ethereum.providers[0];
            console.log('[WalletConnect] Set window.ethereum to first provider');
          } else {
            console.warn('[WalletConnect] Provider not found in providers array, using directly');
            window.ethereum = specificProvider;
          }
        } else if (window.ethereum !== specificProvider) {
          // If not in array, directly set it
          console.log('[WalletConnect] Setting window.ethereum directly to provider');
          window.ethereum = specificProvider;
        }

        // Verify the provider is set correctly
        const finalProvider = window.ethereum || specificProvider;
        console.log('[WalletConnect] Final provider:', finalProvider);
        console.log('[WalletConnect] Provider has request method:', typeof finalProvider?.request === 'function');
        console.log('[WalletConnect] Provider isMetaMask:', finalProvider?.isMetaMask);
        console.log('[WalletConnect] Provider isCoinbaseWallet:', finalProvider?.isCoinbaseWallet);

        // DIRECTLY call eth_requestAccounts on the provider - this will open the wallet popup
        if (!finalProvider || !finalProvider.request) {
          throw new Error('Provider does not support connection requests');
        }

        console.log('[WalletConnect] DIRECTLY calling eth_requestAccounts on provider');
        try {
          const accounts = await finalProvider.request({
            method: "eth_requestAccounts",
          });

          console.log('[WalletConnect] Accounts received:', accounts);

          if (accounts && accounts.length > 0) {
            // Directly update the context state with the connected account
            setAddress(accounts[0]);
            
            // Fetch and set the account balance
            try {
              const { ethers } = await import('ethers');
              const ethersProvider = new ethers.providers.Web3Provider(finalProvider);
              const balance = await ethersProvider.getBalance(accounts[0]);
              const balanceInEth = ethers.utils.formatEther(balance);
              setAccountBalance(balanceInEth);
              console.log('[WalletConnect] Balance set:', balanceInEth);
            } catch (balanceError) {
              console.error('[WalletConnect] Error fetching balance:', balanceError);
              setAccountBalance('0');
            }
            
            // Reset connecting state before showing success
            setIsConnecting(false);
            toast.success(`Connected to ${wallet.name}!`);
            
            // Force a small delay to ensure state updates propagate
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            toast.error('No accounts returned from wallet');
            setIsConnecting(false);
          }
        } catch (requestError) {
          console.error('[WalletConnect] Error requesting accounts:', requestError);
          if (requestError.code === 4001) {
            toast.error('Connection rejected by user');
          } else if (requestError.code === -32002) {
            toast.error('Connection request already pending. Please check your wallet.');
          } else {
            toast.error(`Failed to connect: ${requestError.message || 'Unknown error'}`);
          }
          throw requestError;
        }
      } else {
        // Fallback to context function if no getProvider method
        console.log('[WalletConnect] Falling back to context connectWallet');
        const result = await connectWallet(wallet.id);
        if (result) {
          toast.success(`Connected to ${wallet.name}!`);
        } else {
          toast.error(`Failed to connect to ${wallet.name}. Please try again.`);
        }
      }
    } catch (error) {
      console.error('[WalletConnect] Connection error:', error);
      console.error('[WalletConnect] Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      if (error.code === 4001) {
        toast.error('User rejected the connection request');
      } else {
        toast.error(`Failed to connect to ${wallet.name}. ${error.message || 'Please try again.'}`);
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

  const handleDisconnect = async () => {
    console.log('[WalletConnect] handleDisconnect called');
    setIsDropdownOpen(false);
    
    try {
      // Directly clear local state first
      console.log('[WalletConnect] Clearing local state');
      setAddress(null);
      setAccountBalance(null);
      setUserProfile(null);
      
      // Clear localStorage
      try {
        localStorage.removeItem('wallet_session');
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('lastConnectedWallet');
        console.log('[WalletConnect] Cleared localStorage');
      } catch (e) {
        console.warn('[WalletConnect] Error clearing storage:', e);
      }
      
      // Try to disconnect from wallet provider if possible
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // WalletConnect disconnect
          if (window.ethereum.isWalletConnect && typeof window.ethereum.disconnect === 'function') {
            await window.ethereum.disconnect();
            console.log('[WalletConnect] Disconnected from WalletConnect');
          }
          // Generic provider disconnect
          else if (typeof window.ethereum.disconnect === 'function') {
            await window.ethereum.disconnect();
            console.log('[WalletConnect] Disconnected from wallet provider');
          }
        } catch (disconnectError) {
          console.log('[WalletConnect] Provider disconnect error (may be normal):', disconnectError);
          // Some wallets don't support disconnect, which is fine
        }
      }
      
      // Call the context disconnect function to ensure everything is cleared
      await disconnectWallet();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('[WalletConnect] Error during disconnect:', error);
      // Still clear state even if disconnect fails
      setAddress(null);
      setAccountBalance(null);
      setUserProfile(null);
      await disconnectWallet();
      toast.success('Wallet disconnected');
    }
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
    console.log('[WalletConnect] Component rendered - address:', address, 'isDropdownOpen:', isDropdownOpen, 'isConnecting:', isConnecting);
    return (
      <>
      <div className="relative wallet-dropdown z-[100]" style={{ pointerEvents: 'auto' }}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            console.log('[WalletConnect] MAIN BUTTON CLICKED - isDropdownOpen:', isDropdownOpen, 'isConnecting:', isConnecting);
            e.preventDefault();
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          disabled={isConnecting}
          className="flex items-center space-x-1.5 xs:space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 relative z-[100]"
        >
          <FiShield className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
          {isConnecting ? (
            <span className="font-display text-xs xs:text-sm sm:text-base">Connecting...</span>
          ) : (
            <>
              <span className="font-display text-xs xs:text-sm sm:text-base hidden xs:inline">Connect</span>
              <span className="font-display text-xs xs:text-sm sm:text-base hidden sm:inline">Wallet</span>
            </>
          )}
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
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={(e) => {
                console.log('[WalletConnect] Overlay clicked - closing dropdown');
                setIsDropdownOpen(false);
              }}
            ></div>
            <div 
              className="fixed w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-[9999] overflow-hidden"
              style={{ 
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                console.log('[WalletConnect] Dropdown container clicked');
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                console.log('[WalletConnect] Dropdown container mousedown');
                e.stopPropagation();
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
                  console.log('[WalletConnect] Rendering wallet button:', wallet.name, 'isInstalled:', isInstalled, 'isConnecting:', isConnecting);
                  return (
                    <button
                      key={wallet.id}
                      type="button"
                      onMouseDown={(e) => {
                        console.log('[WalletConnect] WALLET BUTTON MOUSEDOWN:', wallet.name, wallet.id);
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        console.log('[WalletConnect] WALLET BUTTON CLICKED:', wallet.name, wallet.id);
                        console.log('[WalletConnect] Event details:', {
                          isConnecting,
                          isInstalled,
                          disabled: isConnecting || (!isInstalled && wallet.id !== 'walletconnect'),
                          target: e.target.tagName,
                          currentTarget: e.currentTarget.tagName
                        });
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isConnecting && (isInstalled || wallet.id === 'walletconnect')) {
                          console.log('[WalletConnect] Calling handleWalletSelect for:', wallet.name);
                          handleWalletSelect(wallet);
                        } else {
                          console.log('[WalletConnect] Button click IGNORED - isConnecting:', isConnecting, 'isInstalled:', isInstalled);
                        }
                      }}
                      disabled={isConnecting || (!isInstalled && wallet.id !== 'walletconnect')}
                      style={{ 
                        pointerEvents: (isConnecting || (!isInstalled && wallet.id !== 'walletconnect')) ? 'none' : 'auto',
                        position: 'relative',
                        zIndex: 10000
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 group ${
                        isInstalled || wallet.id === 'walletconnect'
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
        {/* Avatar/Profile Picture with Status - Clickable to go to profile */}
        <div 
          className="relative flex-shrink-0 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${address}`);
          }}
          title="View Profile"
        >
          {avatarUrl ? (
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-green-500 group-hover:border-green-400 transition-colors"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement.querySelector('.avatar-icon-fallback');
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center hidden avatar-icon-fallback">
                <FiShield className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:from-green-600 group-hover:to-emerald-600 transition-colors">
              <FiShield className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
          )}
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
              <div 
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 cursor-pointer hover:border-purple-400 transition-colors flex-shrink-0 relative"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate(`/profile/${address}`);
                }}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center avatar-fallback ${avatarUrl ? 'hidden' : 'flex'}`}>
                  <FiUser className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-white font-display font-medium">
                  {userProfile?.username || 'Connected Wallet'}
                </div>
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
                setIsDropdownOpen(false);
                navigate(`/profile/${address}`);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <FiUser className="w-4 h-4" />
              <span className="font-display">View Profile</span>
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
