import React, { useState, useEffect } from 'react';
import { gasFeeAPI } from '../../services/gasFeeAPI';
import { useAdmin } from '../../Context/AdminContext';
import { FiSave, FiRefreshCw, FiToggleLeft, FiToggleRight, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

const GasFeeRegulations = () => {
  const { adminWallet } = useAdmin();
  const [serviceCharge, setServiceCharge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadServiceCharge();
  }, []);

  const loadServiceCharge = async () => {
    setLoading(true);
    try {
      const data = await gasFeeAPI.getAllGasFeeRegulations();
      // Get the global service charge (we'll use a single configuration)
      const globalCharge = data?.find(g => g.network === 'global') || {
        network: 'global',
        isActive: true,
        serviceChargeUSD: 0,
        updatedAt: new Date().toISOString(),
      };
      setServiceCharge(globalCharge);
    } catch (error) {
      toast.error(error.message || 'Failed to load service charge configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setFormData({
      isActive: serviceCharge?.isActive || true,
      serviceChargeUSD: serviceCharge?.serviceChargeUSD || 0,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!isEditing) return;

    setLoading(true);
    try {
      const updates = {
        isActive: formData.isActive,
        serviceChargeUSD: parseFloat(formData.serviceChargeUSD) || 0,
        updatedBy: adminWallet || 'admin',
      };

      await gasFeeAPI.updateGasFeeRegulation('global', updates);
      toast.success('Service charge configuration updated successfully');
      await loadServiceCharge();
      setIsEditing(false);
      setFormData({});
    } catch (error) {
      toast.error(error.message || 'Failed to update service charge configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await gasFeeAPI.toggleGasFeeRegulation('global', !serviceCharge?.isActive, adminWallet || 'admin');
      toast.success(`Service charge ${!serviceCharge?.isActive ? 'activated' : 'deactivated'}`);
      await loadServiceCharge();
    } catch (error) {
      toast.error(error.message || 'Failed to toggle service charge');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Charge</h1>
          <p className="text-gray-600">Configure platform-wide service charge in USD</p>
        </div>
        <button
          onClick={loadServiceCharge}
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
          <h3 className="text-sm font-medium text-blue-900 mb-1">Service Charge Configuration</h3>
          <p className="text-sm text-blue-800">
            Set a single service charge amount in USD that will be applied platform-wide. 
            This charge will be automatically converted to the equivalent value in each network's native token (ETH, MATIC, BNB, etc.) based on current exchange rates.
          </p>
        </div>
      </div>

      {/* Service Charge Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Service Charge</h3>
            <p className="text-sm text-gray-600">Platform-wide configuration</p>
          </div>
          <button
            onClick={handleToggleActive}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              serviceCharge?.isActive
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {serviceCharge?.isActive ? (
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
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Charge (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.serviceChargeUSD || '0'}
                    onChange={(e) => handleInputChange('serviceChargeUSD', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">USD</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This amount will be converted to each network's native token
                </p>
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
                  setIsEditing(false);
                  setFormData({});
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Service Charge (USD)</p>
              <p className="font-medium text-gray-900 text-lg">
                ${serviceCharge?.serviceChargeUSD?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-gray-900">
                {serviceCharge?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            {serviceCharge?.updatedAt && (
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(serviceCharge.updatedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {!isEditing && (
              <div className="col-span-2 flex justify-end pt-2">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">How Service Charge Works</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Set the service charge once in USD</li>
          <li>• System automatically converts it to each network's native token</li>
          <li>• Conversion uses real-time exchange rates</li>
          <li>• Same charge applies across all networks (Ethereum, Polygon, BSC, Arbitrum, Tezos, HyperLiquid)</li>
        </ul>
      </div>
    </div>
  );
};

export default GasFeeRegulations;

