import { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ICOContent } from '../Context';
import {
  Wallet, Copy, ExternalLink, LogOut, X, ChevronDown,
  Loader, AlertCircle, Zap, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '../services/api';

// Wallet provider detection
const detectWallet = async () => {
  if (typeof window === 'undefined') return null;

  // Wait for providers to inject (up to 2 seconds)
  let retries = 0;
  while (!window.ethereum && retries < 10) {
    await new Promise(r => setTimeout(r, 200));
    retries++;
  }

  if (!window.ethereum) return null;

  // Normalize providers array
  const providers = Array.isArray(window.ethereum.providers)
    ? window.ethereum.providers
    : [window.ethereum];

  return { ethereum: window.ethereum, providers };
};

// Get the real MetaMask provider
const getMetaMaskProvider = (ethereum, providers) => {
  if (!ethereum) return null;

  // Check for MetaMask-specific properties first (most reliable)
  const isMetaMask = (p) => {
    if (!p) return false;
    // MetaMask-specific indicators
    return (p.isMetaMask === true && !p.isTrust && !p.isPhantom && !p.isCoinbaseWallet) ||
           p.constructor?.name === 'MetaMaskInpageProvider' ||
           p._metamask_isUnlocked !== undefined;
  };

  // Check direct provider
  if (isMetaMask(ethereum)) return ethereum;

  // Check providers array
  if (providers && Array.isArray(providers)) {
    const mm = providers.find(isMetaMask);
    if (mm) return mm;
  }

  return null;
};

// Get Trust Wallet provider
const getTrustWalletProvider = (ethereum, providers) => {
  if (!ethereum) return null;

  const isTrust = (p) => p && (p.isTrust === true || p.isTrustWallet === true);

  if (isTrust(ethereum)) return ethereum;
  if (providers && Array.isArray(providers)) {
    return providers.find(isTrust) || null;
  }
  return null;
};

// Get Coinbase Wallet provider
const getCoinbaseProvider = (ethereum, providers) => {
  if (!ethereum) return null;

  const isCoinbase = (p) => p && p.isCoinbaseWallet === true;

  if (isCoinbase(ethereum)) return ethereum;
  if (providers && Array.isArray(providers)) {
    return providers.find(isCoinbase) || null;
  }
  return null;
};

const WalletButton = ({ address, disconnectWallet }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const shortenAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatBal = parseFloat(address?.balance || 0).toFixed(4);

  useEffect(() => {
    if (!isOpen || !address) return;

    // Load profile
    setIsLoadingProfile(true);
    userAPI
      .getUserProfile(address)
      .then((res) => setProfile(res))
      .catch(() => setProfile(null))
      .finally(() => setIsLoadingProfile(false));
  }, [isOpen, address]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  if (!address) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border
          bg-surface hover:bg-raised transition-colors duration-150 text-sm font-medium"
      >
        <Wallet size={16} />
        {shortenAddress(address)}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <div
              ref={dropdownRef}
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold animate-pulse" />
                ) : profile?.image ? (
                  <img
                    src={profile.image}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-violet-400"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profile');
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/profile');
                    }}
                  >
                    {profile?.username?.slice(0, 1).toUpperCase() ||
                      shortenAddress(address).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-100 truncate">
                    {profile?.username || shortenAddress(address)}
                  </p>
                  <p className="text-xs text-ink-500 truncate">{shortenAddress(address)}</p>
                </div>
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
};

const ConnectModal = ({ isOpen, onClose }) => {
  const { connectWallet, address } = useContext(ICOContent) || {};
  const [step, setStep] = useState('select'); // select | connecting
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [error, setError] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Detect available wallets
  useEffect(() => {
    const loadWallets = async () => {
      const detected = await detectWallet();
      if (!detected) {
        setAvailableWallets([
          { id: 'walletconnect', name: 'WalletConnect', icon: '📱', description: 'Scan QR code' },
        ]);
        return;
      }

      const { ethereum, providers } = detected;
      const wallets = [];

      // Check for MetaMask
      if (getMetaMaskProvider(ethereum, providers)) {
        wallets.push({
          id: 'metamask',
          name: 'MetaMask',
          icon: '🦊',
          description: 'Browser extension',
        });
      }

      // Check for Trust Wallet
      if (getTrustWalletProvider(ethereum, providers)) {
        wallets.push({
          id: 'trust',
          name: 'Trust Wallet',
          icon: '🛡️',
          description: 'Mobile & Browser',
        });
      }

      // Check for Coinbase
      if (getCoinbaseProvider(ethereum, providers)) {
        wallets.push({
          id: 'coinbase',
          name: 'Coinbase Wallet',
          icon: '🔷',
          description: 'Official Coinbase',
        });
      }

      // Always offer WalletConnect
      wallets.push({
        id: 'walletconnect',
        name: 'WalletConnect',
        icon: '📱',
        description: 'Scan QR code',
      });

      setAvailableWallets(wallets);
    };

    if (isOpen) loadWallets();
  }, [isOpen]);

  const handleConnect = async (wallet) => {
    setSelectedWallet(wallet.id);
    setStep('connecting');
    setError(null);
    setIsLoading(true);

    try {
      if (!connectWallet) {
        throw new Error('Wallet context not available');
      }

      const result = await connectWallet(wallet.id);

      if (result) {
        toast.success(`Connected to ${wallet.name}`);
        setIsLoading(false);
        setStep('select');
        onClose();
        return;
      }

      throw new Error(`Failed to connect to ${wallet.name}`);
    } catch (err) {
      console.error('[WalletConnect] Error:', err);
      setError(err.message || 'Connection failed. Try again.');
      setIsLoading(false);
      setStep('select');
    }
  };

  if (address) return null;
  if (!isOpen) return null;

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
            <p className="text-xs text-ink-400 mt-1">Choose your wallet to get started</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-raised transition-colors"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {availableWallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-ink-400">No wallets detected</p>
              <p className="text-xs text-ink-500 mt-2">
                Install MetaMask or another Web3 wallet extension
              </p>
            </div>
          ) : (
            availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border
                  hover:bg-raised hover:border-violet-400/50 transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-ink-100">{wallet.name}</p>
                  <p className="text-xs text-ink-500">{wallet.description}</p>
                </div>
                {isLoading && selectedWallet === wallet.id && (
                  <Loader size={16} className="animate-spin text-violet-400" />
                )}
                {!isLoading && (
                  <Zap size={16} className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border text-xs text-ink-500 flex items-center gap-2">
          <Shield size={14} />
          <span>Your wallet never exposes your private key</span>
        </div>
      </div>
    </>,
    document.body
  );
};

export default function WalletConnect() {
  const { address, disconnectWallet } = useContext(ICOContent) || {};
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {address ? (
        <WalletButton address={address} disconnectWallet={disconnectWallet} />
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
            bg-gradient-to-r from-violet-500 to-cyan-500
            hover:from-violet-600 hover:to-cyan-600
            transition-all duration-150 text-white text-sm font-semibold"
        >
          <Wallet size={16} />
          Connect Wallet
        </button>
      )}

      <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
