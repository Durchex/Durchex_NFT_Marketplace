/**
 * WalletConnect — Orbital design. Single entry point for wallet connection.
 * Handles MetaMask, Coinbase, Trust, and WalletConnect protocols.
 */
import { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ICOContent } from '../Context';
import {
  Wallet, Copy, ExternalLink, LogOut, RefreshCw, X, ChevronDown,
  Loader, Check, AlertCircle, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';

const WALLET_TYPES = {
  METAMASK: 'metamask',
  COINBASE: 'coinbase',
  TRUST: 'trust',
  WALLETCONNECT: 'walletconnect',
};

const WALLETS = [
  {
    id: WALLET_TYPES.METAMASK,
    name: 'MetaMask',
    icon: '🦊',
    description: 'Browser extension wallet',
    detect: (() => {
      // Cache result so we don't repeatedly log
      let cached = null;
      let cacheTime = 0;
      const CACHE_DURATION = 2000; // Cache for 2 seconds

      return () => {
        const now = Date.now();
        if (cached !== null && now - cacheTime < CACHE_DURATION) {
          return cached;
        }

        if (typeof window === 'undefined' || !window.ethereum) {
          console.log('[MetaMask] window.ethereum not available');
          cached = false;
          cacheTime = now;
          return false;
        }

        const isReal = (p) => {
          // MetaMask is isMetaMask=true AND NOT any other wallet
          // Trust Wallet also sets isMetaMask=true, so we must exclude it explicitly
          return p?.isMetaMask === true &&
                 !p?.isCoinbaseWallet &&
                 !p?.isTrust &&
                 !p?.isTrustWallet &&
                 !p?.isBraveWallet &&
                 !p?.isPhantom;
        };

        // Check window.ethereum directly first
        if (isReal(window.ethereum)) {
          console.log('[MetaMask] Found as window.ethereum');
          cached = true;
          cacheTime = now;
          return true;
        }

        // Check providers array
        if (Array.isArray(window.ethereum.providers)) {
          const found = window.ethereum.providers.some(isReal);
          if (found) {
            console.log('[MetaMask] Found in providers array');
            cached = true;
            cacheTime = now;
            return true;
          }
        }

        console.log('[MetaMask] Detection failed. window.ethereum props:', {
          isMetaMask: window.ethereum?.isMetaMask,
          isTrust: window.ethereum?.isTrust,
          isTrustWallet: window.ethereum?.isTrustWallet,
          isCoinbaseWallet: window.ethereum?.isCoinbaseWallet,
          providersCount: Array.isArray(window.ethereum?.providers) ? window.ethereum.providers.length : 0
        });
        cached = false;
        cacheTime = now;
        return false;
      };
    })(),
    getProvider: () => {
      const isReal = (p) => {
        // MetaMask is isMetaMask=true AND NOT any other wallet
        return p?.isMetaMask === true &&
               !p?.isCoinbaseWallet &&
               !p?.isTrust &&
               !p?.isTrustWallet &&
               !p?.isBraveWallet &&
               !p?.isPhantom;
      };

      if (!window.ethereum) {
        console.log('[MetaMask] getProvider: window.ethereum not available');
        return null;
      }

      // Check window.ethereum directly
      if (isReal(window.ethereum)) {
        console.log('[MetaMask] getProvider: returning window.ethereum');
        return window.ethereum;
      }

      // Check providers array
      if (Array.isArray(window.ethereum.providers)) {
        const provider = window.ethereum.providers.find(isReal);
        if (provider) {
          console.log('[MetaMask] getProvider: found in providers array');
          return provider;
        }
      }

      console.log('[MetaMask] getProvider: not found');
      return null;
    },
    install: 'https://metamask.io/download/',
  },
  {
    id: WALLET_TYPES.COINBASE,
    name: 'Coinbase Wallet',
    icon: '🔷',
    description: 'Official Coinbase wallet',
    detect: () => {
      if (typeof window === 'undefined' || !window.ethereum) return false;
      if (window.ethereum.isCoinbaseWallet) return true;
      return Array.isArray(window.ethereum.providers)
        ? window.ethereum.providers.some((p) => p.isCoinbaseWallet)
        : false;
    },
    getProvider: () => {
      if (!window.ethereum) return null;
      if (window.ethereum.isCoinbaseWallet) return window.ethereum;
      if (Array.isArray(window.ethereum.providers)) {
        return window.ethereum.providers.find((p) => p.isCoinbaseWallet) || null;
      }
      return null;
    },
    install: 'https://www.coinbase.com/wallet',
  },
  {
    id: WALLET_TYPES.TRUST,
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Mobile-first wallet',
    detect: () => {
      if (typeof window === 'undefined' || !window.ethereum) return false;
      if (window.ethereum.isTrust || window.ethereum.isTrustWallet) return true;
      return Array.isArray(window.ethereum.providers)
        ? window.ethereum.providers.some((p) => p.isTrust || p.isTrustWallet)
        : false;
    },
    getProvider: () => {
      if (!window.ethereum) return null;
      if (window.ethereum.isTrust || window.ethereum.isTrustWallet)
        return window.ethereum;
      if (Array.isArray(window.ethereum.providers)) {
        return (
          window.ethereum.providers.find(
            (p) => p.isTrust || p.isTrustWallet
          ) || null
        );
      }
      return null;
    },
    install: 'https://trustwallet.com/',
  },
  {
    id: WALLET_TYPES.WALLETCONNECT,
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Any mobile wallet via QR',
    detect: () => true, // Always available
    getProvider: null, // Will use protocol in context
    install: 'https://walletconnect.com/',
  },
];

function WalletButton({ compact = false }) {
  const { address, accountBalance, shortenAddress, disconnectWallet } = useContext(ICOContent) || {};
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!address) return;
    const load = async () => {
      try {
        setIsLoadingProfile(true);
        const p = await userAPI.getUserProfile(address);
        setProfile(p || null);
      } catch (_) {
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    load();
  }, [address]);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8, // 8px gap below button
      right: window.innerWidth - rect.right, // Align with right edge of button
    });
  }, [isOpen]);

  if (!address) {
    return null; // ConnectModal handles display
  }

  const formatBal = accountBalance ? parseFloat(accountBalance).toFixed(4) : '0.0000';

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((p) => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-border
          text-ink-100 hover:text-ink-100 hover:bg-raised transition-all duration-200
          font-medium text-sm
          ${compact ? '' : 'hidden sm:flex'}`}
      >
        {/* Avatar */}
        {isLoadingProfile ? (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 animate-pulse" />
        ) : profile?.image ? (
          <img
            src={profile.image}
            alt="avatar"
            className="w-6 h-6 rounded-full object-cover border border-violet-400"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              navigate(`/profile`);
            }}
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500
              flex items-center justify-center text-white text-xs font-bold cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              navigate(`/profile`);
            }}
            title="View Profile"
          >
            {profile?.username?.slice(0, 1).toUpperCase() || shortenAddress(address).slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="hidden md:block">
          <div className="text-xs text-ink-100 font-semibold">{profile?.username || shortenAddress(address)}</div>
          <div className="text-xs text-ink-500">{formatBal} ETH</div>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="fixed z-[101] rounded-2xl card p-4 min-w-[320px] max-h-[80vh] overflow-y-auto"
              style={{
                top: `${dropdownPos.top}px`,
                right: `${dropdownPos.right}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile */}
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-surface">
                {isLoadingProfile ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500
                    flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  </div>
                ) : profile?.image ? (
                  <img
                    src={profile.image}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-violet-400 cursor-pointer hover:border-violet-300"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profile');
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500
                      flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profile');
                    }}
                  >
                    {profile?.username?.slice(0, 1).toUpperCase() || shortenAddress(address).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-100 truncate">
                    {profile?.username || shortenAddress(address)}
                  </p>
                  <p className="text-xs text-ink-500 truncate">{shortenAddress(address)}</p>
                </div>
              </div>

              {/* Balance */}
              <div className="text-xs text-ink-400 mb-3 px-3">
                Balance: <span className="text-ink-100 font-semibold">{formatBal} ETH</span>
              </div>

              <div className="border-t border-border my-2" />

              {/* Actions */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  toast.success('Address copied!');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-300
                  hover:bg-raised rounded-lg transition-colors duration-150"
              >
                <Copy size={14} />
                Copy Address
              </button>

              <button
                onClick={() => {
                  window.open(`https://basescan.org/address/${address}`, '_blank');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-300
                  hover:bg-raised rounded-lg transition-colors duration-150"
              >
                <ExternalLink size={14} />
                View on Explorer
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-300
                  hover:bg-raised rounded-lg transition-colors duration-150"
              >
                <Wallet size={14} />
                My Profile
              </button>

              <div className="border-t border-border my-2" />

              <button
                onClick={() => {
                  disconnectWallet?.();
                  setIsOpen(false);
                  toast.success('Disconnected');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400
                  hover:bg-red-500/10 rounded-lg transition-colors duration-150"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function ConnectModal({ isOpen, onClose }) {
  const { connectWallet, address } = useContext(ICOContent) || {};
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);

  // Prevent scrollbar from appearing/disappearing
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (address) return null;
  if (!isOpen) return null;

  const handleConnect = async (wallet) => {
    setError(null);
    setConnecting(wallet.id);

    try {
      // Check if wallet is installed (except WalletConnect)
      // On Chrome, wallets inject slowly — wait up to 2 seconds before giving up
      if (wallet.id !== WALLET_TYPES.WALLETCONNECT && typeof wallet.detect === 'function') {
        let isDetected = wallet.detect();
        let retries = 0;
        const maxRetries = 10; // 10 × 200ms = 2 seconds total

        while (!isDetected && retries < maxRetries) {
          console.log(`[WalletConnect] Waiting for ${wallet.name} (${(retries + 1) * 200}ms / 2000ms)...`);
          await new Promise(r => setTimeout(r, 200));
          isDetected = wallet.detect();
          retries++;
        }

        if (!isDetected) {
          console.warn(`[WalletConnect] ${wallet.name} not detected after 2 seconds. Attempting connection anyway...`);
        }
      }

      // Use context connectWallet function
      if (connectWallet) {
        const result = await connectWallet(wallet.id);
        if (result) {
          toast.success(`Connected to ${wallet.name}`);
          onClose();
          return;
        }
      }

      // Fallback: direct provider connection
      if (wallet.id !== WALLET_TYPES.WALLETCONNECT && wallet.getProvider) {
        const provider = wallet.getProvider();
        if (!provider) {
          setError(`Could not find ${wallet.name}`);
          setConnecting(null);
          return;
        }

        try {
          const accounts = await provider.request({
            method: 'eth_requestAccounts',
          });

          if (accounts?.length > 0) {
            // Store in localStorage for persistence
            localStorage.setItem('lastConnectedWallet', wallet.id);
            toast.success(`Connected to ${wallet.name}`);
            onClose();
            return;
          }
        } catch (err) {
          if (err.code === 4001) {
            setError('Connection rejected');
          } else if (err.message?.includes('No active wallet')) {
            setError(`${wallet.name} is not available. Try enabling it in chrome://extensions or refresh the page.`);
          } else {
            setError(err.message || `Failed to connect to ${wallet.name}`);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  // Always show MetaMask + WalletConnect, plus any other detected wallets
  const installed = WALLETS.filter((w) => {
    if (w.id === WALLET_TYPES.METAMASK || w.id === WALLET_TYPES.WALLETCONNECT) {
      return true; // Always show MetaMask and WalletConnect
    }
    return w.detect?.();
  });
  const notInstalled = WALLETS.filter(
    (w) => w.id !== WALLET_TYPES.METAMASK && w.id !== WALLET_TYPES.WALLETCONNECT && !w.detect?.()
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md
          card-no-hover rounded-2xl flex flex-col z-50 overflow-hidden"
        style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-ink-100">Connect Wallet</h2>
            <p className="text-xs text-ink-400 mt-1">
              Choose your wallet to get started
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-6 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Wallet List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {/* Installed */}
          {installed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-ink-500 uppercase">Installed</p>
              {installed.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet)}
                  disabled={connecting !== null}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border
                    hover:bg-raised transition-colors duration-150 disabled:opacity-50"
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-ink-100">{wallet.name}</p>
                    <p className="text-xs text-ink-500">{wallet.description}</p>
                  </div>
                  {connecting === wallet.id && (
                    <Loader size={16} className="animate-spin text-violet-400" />
                  )}
                  {connecting !== wallet.id && (
                    <Check size={16} className="text-emerald-400" />
                  )}
                </button>
              ))}
            </>
          )}

          {/* Not Installed */}
          {notInstalled.length > 0 && (
            <>
              <p className="text-xs font-semibold text-ink-500 uppercase mt-6">
                Not Installed
              </p>
              {notInstalled.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => window.open(wallet.install, '_blank')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border
                    text-ink-400 hover:text-ink-300 hover:bg-raised transition-colors duration-150"
                >
                  <span className="text-2xl opacity-50">{wallet.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{wallet.name}</p>
                    <p className="text-xs text-ink-600">{wallet.description}</p>
                  </div>
                  <Download size={16} />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-center text-xs text-ink-500">
          By connecting, you agree to our Terms of Service
        </div>
      </div>
    </>,
    document.body
  );
}

export default function WalletConnect({ compact = false }) {
  const { address } = useContext(ICOContent) || {};
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {!address && (
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary gap-2 text-sm"
        >
          <Wallet size={16} />
          <span>Connect Wallet</span>
        </button>
      )}

      {address && <WalletButton compact={compact} />}

      <ConnectModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
