import React, { useState, useContext } from 'react';
import { ICOContent } from '../Context';
import gasService from '../services/gasService';
import socketService from '../services/socketService';
import { FiDollarSign, FiClock, FiTag, FiTrendingUp, FiCheck, FiX, FiLoader, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NFTListingInterface = ({ nftData, onClose }) => {
  const { address, connectWallet } = useContext(ICOContent);
  const [isListing, setIsListing] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    currency: 'ETH',
    duration: '7', // days
    listingType: 'fixed', // fixed, auction
    reservePrice: '',
    buyNowPrice: '',
    startTime: '',
    endTime: ''
  });
  const [gasInfo, setGasInfo] = useState(null);
  const [errors, setErrors] = useState({});

  const currencies = [
    { symbol: 'ETH', name: 'Ethereum', icon: '🔷' },
    { symbol: 'MATIC', name: 'Polygon', icon: '🟣' },
    { symbol: 'BNB', name: 'BSC', icon: '🟡' },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔵' }
  ];

  const durations = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '7', label: '1 Week' },
    { value: '14', label: '2 Weeks' },
    { value: '30', label: '1 Month' },
    { value: '90', label: '3 Months' },
    { value: '0', label: 'No Expiry' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const calculateGasFees = async () => {
    if (!formData.price || !nftData?.network) return;

    try {
      const result = await gasService.getMintGasInfo(
        nftData.network,
        nftData.contractAddress,
        address,
        nftData.tokenURI
      );

      if (result.success) {
        setGasInfo(result);
      }
    } catch (error) {
      console.error('Error calculating gas fees:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (formData.listingType === 'auction') {
      if (!formData.reservePrice || parseFloat(formData.reservePrice) <= 0) {
        newErrors.reservePrice = 'Reserve price is required for auctions';
      }
      if (!formData.buyNowPrice || parseFloat(formData.buyNowPrice) <= parseFloat(formData.reservePrice)) {
        newErrors.buyNowPrice = 'Buy now price must be higher than reserve price';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'Auction end time is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleListNFT = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      await connectWallet();
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before listing');
      return;
    }

    setIsListing(true);
    
    try {
      // Step 1: Calculate gas fees
      await calculateGasFees();
      
      // Step 2: Create listing data
      const listingData = {
        nftId: nftData.id,
        tokenId: nftData.tokenId,
        contractAddress: nftData.contractAddress,
        network: nftData.network,
        seller: address,
        price: formData.price,
        currency: formData.currency,
        listingType: formData.listingType,
        duration: formData.duration,
        reservePrice: formData.reservePrice,
        buyNowPrice: formData.buyNowPrice,
        startTime: formData.startTime,
        endTime: formData.endTime,
        tokenURI: nftData.tokenURI,
        metadata: nftData.metadata,
        gasInfo: gasInfo
      };

      // Step 3: Simulate blockchain listing (would integrate with smart contract)
      toast.loading('Creating listing on blockchain...');
      
      // Simulate listing process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 4: Send real-time notification
      socketService.sendUserActivity({
        type: 'nft_listed',
        user: address,
        nftName: nftData.name,
        price: formData.price,
        currency: formData.currency,
        listingType: formData.listingType,
        network: nftData.network
      });

      toast.success('NFT listed successfully!');
      
      // Close the interface
      if (onClose) onClose();

    } catch (error) {
      console.error('Listing error:', error);
      toast.error(`Listing failed: ${error.message}`);
    } finally {
      setIsListing(false);
    }
  };

  const renderFixedPriceForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Listing Price *
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.001"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.001"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="border-none bg-transparent text-gray-500 font-display text-sm focus:outline-none"
            >
              {currencies.map(currency => (
                <option key={currency.symbol} value={currency.symbol}>
                  {currency.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
        {errors.price && <p className="text-red-500 text-sm mt-1 font-display">{errors.price}</p>}
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Listing Duration
        </label>
        <select
          value={formData.duration}
          onChange={(e) => handleInputChange('duration', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
        >
          {durations.map(duration => (
            <option key={duration.value} value={duration.value}>
              {duration.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderAuctionForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Reserve Price *
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.001"
            value={formData.reservePrice}
            onChange={(e) => handleInputChange('reservePrice', e.target.value)}
            className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
              errors.reservePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.001"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-500 font-display text-sm">
              {formData.currency}
            </span>
          </div>
        </div>
        {errors.reservePrice && <p className="text-red-500 text-sm mt-1 font-display">{errors.reservePrice}</p>}
        <p className="text-gray-500 text-sm mt-1 font-display">
          Minimum price for the auction
        </p>
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Buy Now Price *
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.001"
            value={formData.buyNowPrice}
            onChange={(e) => handleInputChange('buyNowPrice', e.target.value)}
            className={`w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
              errors.buyNowPrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.001"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-500 font-display text-sm">
              {formData.currency}
            </span>
          </div>
        </div>
        {errors.buyNowPrice && <p className="text-red-500 text-sm mt-1 font-display">{errors.buyNowPrice}</p>}
        <p className="text-gray-500 text-sm mt-1 font-display">
          Instant purchase price
        </p>
      </div>

      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Auction End Time *
        </label>
        <input
          type="datetime-local"
          value={formData.endTime}
          onChange={(e) => handleInputChange('endTime', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display ${
            errors.endTime ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.endTime && <p className="text-red-500 text-sm mt-1 font-display">{errors.endTime}</p>}
      </div>
    </div>
  );

  const renderGasInfo = () => {
    if (!gasInfo) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-display font-semibold text-blue-900 mb-2">Gas Fee Estimate</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-display text-blue-700">Gas Price:</span>
            <span className="font-display text-blue-900">{gasInfo.gasPriceGwei} Gwei</span>
          </div>
          <div className="flex justify-between">
            <span className="font-display text-blue-700">Gas Limit:</span>
            <span className="font-display text-blue-900">{gasInfo.gasLimit}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-display text-blue-700">Total Cost:</span>
            <span className="font-display text-blue-900">{gasInfo.totalCostEth} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="font-display text-blue-700">Est. Time:</span>
            <span className="font-display text-blue-900">{gasInfo.estimatedTime}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">List NFT for Sale</h2>
              <p className="text-gray-600 font-display">Set your price and listing preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* NFT Preview */}
          {nftData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={nftData.image || nftData.imagePreview}
                  alt={nftData.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-display font-semibold text-gray-900">{nftData.name}</h3>
                  <p className="text-gray-600 font-display text-sm">{nftData.collection}</p>
                  <p className="text-gray-500 font-display text-xs">Network: {nftData.network}</p>
                </div>
              </div>
            </div>
          )}

          {/* Listing Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-display font-medium text-gray-700 mb-3">
              Listing Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleInputChange('listingType', 'fixed')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.listingType === 'fixed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <FiTag className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <h3 className="font-display font-semibold text-gray-900">Fixed Price</h3>
                  <p className="text-sm text-gray-600 font-display">Set a fixed price</p>
                </div>
              </button>
              <button
                onClick={() => handleInputChange('listingType', 'auction')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.listingType === 'auction'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <FiTrendingUp className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <h3 className="font-display font-semibold text-gray-900">Auction</h3>
                  <p className="text-sm text-gray-600 font-display">Let buyers bid</p>
                </div>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="mb-6">
            {formData.listingType === 'fixed' ? renderFixedPriceForm() : renderAuctionForm()}
          </div>

          {/* Gas Info */}
          {renderGasInfo()}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-display"
            >
              Cancel
            </button>
            <button
              onClick={handleListNFT}
              disabled={isListing || !address}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display flex items-center space-x-2"
            >
              {isListing ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Listing...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>List NFT</span>
                </>
              )}
            </button>
          </div>

          {!address && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-display">
                Please connect your wallet to list NFTs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTListingInterface;

