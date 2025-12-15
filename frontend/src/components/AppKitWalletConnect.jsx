import React from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { FiShield, FiChevronDown } from 'react-icons/fi';

const AppKitWalletConnect = () => {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    console.log('Connect button clicked');
    console.log('useAppKit hook:', { open });
    try {
      open();
      console.log('AppKit open() called successfully');
    } catch (error) {
      console.error('Error opening AppKit:', error);
    }
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-3 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-display hidden sm:inline">{formatAddress(address)}</span>
          <span className="font-display sm:hidden">{formatAddress(address).slice(0, 4)}...</span>
          <FiChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-2 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
    >
      <FiShield className="w-4 h-4" />
      <span className="font-display hidden sm:inline">Connect Wallet</span>
      <span className="font-display sm:hidden">Connect</span>
    </button>
  );
};

export default AppKitWalletConnect;