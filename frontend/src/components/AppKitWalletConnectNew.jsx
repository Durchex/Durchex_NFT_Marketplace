import React, { useState, useEffect } from 'react';
import wallets from '../assets/wallets.json';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { FiShield, FiX, FiLogOut } from 'react-icons/fi';

function getWalletInstallUrl(id) {
  switch (id) {
    case 'metamask':
      return 'https://metamask.io/download/';
    case 'coinbase':
      return 'https://www.coinbase.com/wallet/downloads';
    case 'trust':
      return 'https://trustwallet.com/download';
    case 'okx':
      return 'https://www.okx.com/web3';
    case 'brave':
      return 'https://brave.com/wallet/';
    case 'bitkeep':
      return 'https://web3.bitget.com/en/wallet-download';
    case 'zerion':
      return 'https://zerion.io/wallet/';
    case 'rainbow':
      return 'https://rainbow.me/download';
    case 'walletconnect':
      return 'https://walletconnect.com/explorer';
    default:
      return 'https://ethereum.org/en/wallets/find-wallet/';
  }
}

const AppKitWalletConnect = () => {
  const { open, disconnect } = useAppKit();
  const { address, isConnected, balance } = useAppKitAccount();
  const [showModal, setShowModal] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Debug logs for connection state
  useEffect(() => {
    console.log('[AppKitWalletConnect] address:', address);
    console.log('[AppKitWalletConnect] isConnected:', isConnected);
    console.log('[AppKitWalletConnect] balance:', balance);
  }, [address, isConnected, balance]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    console.log('[AppKitWalletConnect] handleConnect called');
    setShowModal(true);
  };


  // Detect installed wallets
  const [installed, setInstalled] = useState({});
  useEffect(() => {
    const result = {};
    wallets.forEach(w => {
      if (w.check) {
        try {
          // eslint-disable-next-line no-eval
          result[w.id] = !!eval(w.check);
        } catch {
          result[w.id] = false;
        }
      } else {
        result[w.id] = true; // WalletConnect always available
      }
    });
    setInstalled(result);
  }, []);

  const handleSelectWallet = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!installed[walletId]) {
      console.log('[AppKitWalletConnect] Wallet not installed:', walletId);
      setInstallPrompt(wallet);
      return;
    }
    console.log('[AppKitWalletConnect] Selecting wallet:', walletId);
    setShowModal(false);
    setInstallPrompt(null);
    try {
      open(walletId); // Pass walletId to open so the correct wallet is selected
      console.log('[AppKitWalletConnect] open() called with', walletId);
    } catch (error) {
      console.error('Error opening AppKit:', error);
    }
  };

  const handleDisconnect = () => {
    console.log('[AppKitWalletConnect] handleDisconnect called');
    setShowModal(false);
    disconnect();
  };

  if (isConnected && address) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-3 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base w-full md:w-auto justify-center md:justify-start"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-display hidden sm:inline">{formatAddress(address)}</span>
          <span className="font-display sm:hidden">Connected</span>
          {balance && (
            <span className="ml-2 text-xs bg-gray-800 px-2 py-1 rounded text-green-300">{balance} ETH</span>
          )}
        </button>
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowModal(false)}>
            <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">Wallet Options</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-red-500 transition-all text-left flex-shrink-0 text-red-400 font-semibold"
                >
                  <FiLogOut className="w-5 h-5" /> Disconnect
                </button>
                {/* You can add network switch UI here if needed */}
              </div>
            </div>
          </div>
        )}
        {installPrompt && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80" onClick={() => setInstallPrompt(null)}>
            <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] items-center" onClick={e => e.stopPropagation()}>
              <img src={installPrompt.logo} alt={installPrompt.name} className="w-16 h-16 mb-4 rounded-full bg-white object-contain" />
              <h2 className="text-xl font-bold text-white mb-2">{installPrompt.name} Not Installed</h2>
              <p className="text-gray-300 mb-4">To use this wallet, please install it and refresh the page.</p>
              <a
                href={getWalletInstallUrl(installPrompt.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Install {installPrompt.name}
              </a>
              <button onClick={() => setInstallPrompt(null)} className="mt-4 text-gray-400 hover:text-white">Close</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base w-full md:w-auto justify-center md:justify-start"
      >
        <FiShield className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2">
              {wallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWallet(w.id)}
                  className={`w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-blue-500 transition-all text-left flex items-center gap-3 flex-shrink-0 ${!installed[w.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!installed[w.id]}
                >
                  <img src={w.logo} alt={w.name} className="w-7 h-7 rounded-full bg-white object-contain" />
                  <span className="text-white font-medium flex-1">{w.name}</span>
                  <span className={`text-xs font-semibold ${installed[w.id] ? 'text-green-400' : 'text-red-400'}`}>{installed[w.id] ? 'Installed' : 'Not Installed'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {installPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80" onClick={() => setInstallPrompt(null)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] items-center" onClick={e => e.stopPropagation()}>
            <img src={installPrompt.logo} alt={installPrompt.name} className="w-16 h-16 mb-4 rounded-full bg-white object-contain" />
            <h2 className="text-xl font-bold text-white mb-2">{installPrompt.name} Not Installed</h2>
            <p className="text-gray-300 mb-4">To use this wallet, please install it and refresh the page.</p>
            <a
              href={getWalletInstallUrl(installPrompt.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Install {installPrompt.name}
            </a>
            <button onClick={() => setInstallPrompt(null)} className="mt-4 text-gray-400 hover:text-white">Close</button>
          </div>
        </div>

      )}
    </>
  );
};

export default AppKitWalletConnect;