import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiActivity, FiShield, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SmartContractHealthMonitor = () => {
  const [contractHealth, setContractHealth] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const networks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'tezos', 'hyperliquid'];

  useEffect(() => {
    checkAllContracts();
  }, []);

  const checkAllContracts = async () => {
    setIsLoading(true);
    const healthData = {};

    try {
      for (const network of networks) {
        try {
          // Mock contract health data
          const health = {
            status: 'healthy',
            message: 'All contracts operational',
            contracts: [
              {
                name: 'NFTMarketplace',
                address: '0x1234...5678',
                status: 'active',
                lastActivity: '2 minutes ago',
                gasUsed: '45,000',
                balance: '2.5 ETH'
              },
              {
                name: 'VendorNFT',
                address: '0x8765...4321',
                status: 'active',
                lastActivity: '5 minutes ago',
                gasUsed: '32,000',
                balance: '1.8 ETH'
              }
            ]
          };
          
          const functionality = {
            success: true,
            tests: [
              { name: 'Contract Deployment', status: 'passed' },
              { name: 'NFT Minting', status: 'passed' },
              { name: 'Marketplace Listing', status: 'passed' },
              { name: 'Token Transfers', status: 'passed' }
            ]
          };
          
          healthData[network] = {
            health,
            functionality,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          healthData[network] = {
            health: { status: 'unhealthy', reason: error.message },
            functionality: { success: false, error: error.message },
            timestamp: new Date().toISOString()
          };
        }
      }

      setContractHealth(healthData);
      setLastChecked(new Date());
      toast.success('Contract health check completed');
    } catch (error) {
      console.error('Error checking contract health:', error);
      toast.error('Failed to check contract health');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatNetworkName = (network) => {
    const names = {
      ethereum: 'Ethereum',
      polygon: 'Polygon',
      bsc: 'BSC',
      arbitrum: 'Arbitrum',
      tezos: 'Tezos',
      hyperliquid: 'Hyperliquid'
    };
    return names[network] || network;
  };

  const getNetworkIcon = (network) => {
    const icons = {
      ethereum: '🔷',
      polygon: '🟣',
      bsc: '🟡',
      arbitrum: '🔵',
      tezos: '🟠',
      hyperliquid: '⚡'
    };
    return icons[network] || '🔷';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <FiShield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900">Smart Contract Health</h2>
            <p className="text-gray-600 font-display text-sm">Monitor contract functionality across networks</p>
          </div>
        </div>
        
        <button
          onClick={checkAllContracts}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiCheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-display font-medium text-green-800">Healthy Contracts</span>
          </div>
          <div className="text-2xl font-display font-bold text-green-600 mt-1">
            {Object.values(contractHealth).filter(c => c.health?.status === 'healthy').length}
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiXCircle className="w-5 h-5 text-red-500" />
            <span className="font-display font-medium text-red-800">Unhealthy Contracts</span>
          </div>
          <div className="text-2xl font-display font-bold text-red-600 mt-1">
            {Object.values(contractHealth).filter(c => c.health?.status === 'unhealthy').length}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiActivity className="w-5 h-5 text-blue-500" />
            <span className="font-display font-medium text-blue-800">Total Networks</span>
          </div>
          <div className="text-2xl font-display font-bold text-blue-600 mt-1">
            {networks.length}
          </div>
        </div>
      </div>

      {/* Network Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {networks.map((network) => {
          const data = contractHealth[network];
          if (!data) return null;

          const { health, functionality } = data;
          const isHealthy = health?.status === 'healthy';
          const hasFunctionality = functionality?.success;

          return (
            <div
              key={network}
              className={`border rounded-lg p-4 transition-colors ${
                isHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getNetworkIcon(network)}</span>
                  <span className="font-display font-medium text-gray-900">
                    {formatNetworkName(network)}
                  </span>
                </div>
                {getStatusIcon(health?.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-display text-gray-600">Contract Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-display ${getStatusColor(health?.status)}`}>
                    {health?.status || 'Unknown'}
                  </span>
                </div>

                {isHealthy && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-display text-gray-600">Response Time</span>
                      <span className="font-display text-gray-900">
                        {health?.responseTime ? `${health.responseTime}ms` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-display text-gray-600">Block Number</span>
                      <span className="font-display text-gray-900">
                        {health?.blockNumber ? health.blockNumber.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="font-display text-gray-600">Functionality Tests</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-display ${
                    hasFunctionality ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {hasFunctionality ? 'Passed' : 'Failed'}
                  </span>
                </div>

                {hasFunctionality && functionality?.tests && (
                  <div className="text-xs text-gray-600 font-display">
                    {functionality.passedTests}/{functionality.totalTests} tests passed
                  </div>
                )}

                {!isHealthy && health?.reason && (
                  <div className="text-xs text-red-600 font-display bg-red-100 p-2 rounded">
                    {health.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contract Addresses */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-display font-semibold text-gray-900 mb-3">Contract Addresses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-display font-medium text-gray-700">NFT Marketplace:</span>
            <span className="font-mono text-gray-600 ml-2">
              {import.meta.env.VITE_APP_NFTMARKETPLACE_CONTRACT_ADDRESS || 'Not configured'}
            </span>
          </div>
          <div>
            <span className="font-display font-medium text-gray-700">Vendor NFT:</span>
            <span className="font-mono text-gray-600 ml-2">
              {import.meta.env.VITE_APP_VENDORNFT_CONTRACT_ADDRESS || 'Not configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Last Checked */}
      {lastChecked && (
        <div className="mt-4 text-center text-sm text-gray-500 font-display">
          Last checked: {lastChecked.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default SmartContractHealthMonitor;
