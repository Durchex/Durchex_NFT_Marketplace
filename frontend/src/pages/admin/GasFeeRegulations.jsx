import React, { useState, useEffect } from 'react';
import { gasFeeAPI } from '../../services/gasFeeAPI';
import { useAdmin } from '../../Context/AdminContext';
import { FiSave, FiRefreshCw, FiToggleLeft, FiToggleRight, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const GasFeeRegulations = () => {
  const { adminWallet } = useAdmin();
  const [gasFees, setGasFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState(null);
  const [formData, setFormData] = useState({});

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
    { id: 'tezos', name: 'Tezos', symbol: 'XTZ' },
    { id: 'hyperliquid', name: 'Hyperliquid', symbol: 'HL' },
  ];

  useEffect(() => {
    loadGasFees();
  }, []);

  const loadGasFees = async () => {
    setLoading(true);
    try {
      const data = await gasFeeAPI.getAllGasFeeRegulations();
      setGasFees(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load gas fee regulations');
    } finally {
      setLoading(false);
    }
  };

  const getGasFeeForNetwork = (networkId) => {
    return gasFees.find(gf => gf.network === networkId) || {
      network: networkId,
      isActive: false,
      minGasPrice: '0',
      maxGasPrice: '0',
      defaultGasPrice: '0',
      gasLimit: 500000,
      multiplier: 1.0,
      regulations: {
        enabled: false,
        enforceMin: false,
        enforceMax: false,
        autoAdjust: false,
      },
    };
  };

  const handleEdit = (networkId) => {
    const gasFee = getGasFeeForNetwork(networkId);
    setFormData({
      isActive: gasFee.isActive || false,
      minGasPrice: gasFee.minGasPrice ? ethers.utils.formatUnits(gasFee.minGasPrice, 'gwei') : '0',
      maxGasPrice: gasFee.maxGasPrice ? ethers.utils.formatUnits(gasFee.maxGasPrice, 'gwei') : '0',
      defaultGasPrice: gasFee.defaultGasPrice ? ethers.utils.formatUnits(gasFee.defaultGasPrice, 'gwei') : '0',
      gasLimit: gasFee.gasLimit || 500000,
      multiplier: gasFee.multiplier || 1.0,
      regulations: {
        enabled: gasFee.regulations?.enabled || false,
        enforceMin: gasFee.regulations?.enforceMin || false,
        enforceMax: gasFee.regulations?.enforceMax || false,
        autoAdjust: gasFee.regulations?.autoAdjust || false,
      },
    });
    setEditingNetwork(networkId);
  };

  const handleSave = async () => {
    if (!editingNetwork) return;

    setLoading(true);
    try {
      const updates = {
        ...formData,
        updatedBy: adminWallet || 'admin',
      };

      await gasFeeAPI.updateGasFeeRegulation(editingNetwork, updates);
      toast.success('Gas fee regulation updated successfully');
      await loadGasFees();
      setEditingNetwork(null);
      setFormData({});
    } catch (error) {
      toast.error(error.message || 'Failed to update gas fee regulation');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (networkId, isActive) => {
    try {
      await gasFeeAPI.toggleGasFeeRegulation(networkId, !isActive, adminWallet || 'admin');
      toast.success(`Gas fee regulation ${!isActive ? 'activated' : 'deactivated'}`);
      await loadGasFees();
    } catch (error) {
      toast.error(error.message || 'Failed to toggle gas fee regulation');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('regulations.')) {
      const regField = field.replace('regulations.', '');
      setFormData(prev => ({
        ...prev,
        regulations: {
          ...prev.regulations,
          [regField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gas Fee Regulations</h1>
          <p className="text-gray-600">Manage gas fee regulations for each network</p>
        </div>
        <button
          onClick={loadGasFees}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Gas Fee Regulations</h3>
          <p className="text-sm text-blue-800">
            Configure gas fee regulations for each network. When enabled, these regulations will be applied to all transactions.
            Gas prices should be entered in Gwei.
          </p>
        </div>
      </div>

      {/* Gas Fee Regulations List */}
      <div className="grid grid-cols-1 gap-6">
        {networks.map((network) => {
          const gasFee = getGasFeeForNetwork(network.id);
          const isEditing = editingNetwork === network.id;

          return (
            <div key={network.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{network.name}</h3>
                  <p className="text-sm text-gray-600">Network: {network.id}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleActive(network.id, gasFee.isActive)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      gasFee.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {gasFee.isActive ? (
                      <>
                        <FiToggleRight className="w-5 h-5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <FiToggleLeft className="w-5 h-5" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => handleEdit(network.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Gas Price (Gwei)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.minGasPrice || '0'}
                        onChange={(e) => handleInputChange('minGasPrice', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Gas Price (Gwei)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.maxGasPrice || '0'}
                        onChange={(e) => handleInputChange('maxGasPrice', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Gas Price (Gwei)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.defaultGasPrice || '0'}
                        onChange={(e) => handleInputChange('defaultGasPrice', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gas Limit
                      </label>
                      <input
                        type="number"
                        value={formData.gasLimit || 500000}
                        onChange={(e) => handleInputChange('gasLimit', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Multiplier
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.multiplier || 1.0}
                        onChange={(e) => handleInputChange('multiplier', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1.0 = no change, 1.2 = 20% increase"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Regulation Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.regulations?.enabled || false}
                          onChange={(e) => handleInputChange('regulations.enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enable Regulations</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.regulations?.enforceMin || false}
                          onChange={(e) => handleInputChange('regulations.enforceMin', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enforce Minimum Gas Price</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.regulations?.enforceMax || false}
                          onChange={(e) => handleInputChange('regulations.enforceMax', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enforce Maximum Gas Price</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.regulations?.autoAdjust || false}
                          onChange={(e) => handleInputChange('regulations.autoAdjust', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto Adjust Gas Price</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <FiSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingNetwork(null);
                        setFormData({});
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Min Gas Price</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.minGasPrice ? `${ethers.utils.formatUnits(gasFee.minGasPrice, 'gwei')} Gwei` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Gas Price</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.maxGasPrice ? `${ethers.utils.formatUnits(gasFee.maxGasPrice, 'gwei')} Gwei` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Default Gas Price</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.defaultGasPrice ? `${ethers.utils.formatUnits(gasFee.defaultGasPrice, 'gwei')} Gwei` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Multiplier</p>
                    <p className="font-medium text-gray-900">{gasFee.multiplier || 1.0}x</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Regulations</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.regulations?.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Enforce Min</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.regulations?.enforceMin ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Enforce Max</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.regulations?.enforceMax ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Auto Adjust</p>
                    <p className="font-medium text-gray-900">
                      {gasFee.regulations?.autoAdjust ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GasFeeRegulations;

