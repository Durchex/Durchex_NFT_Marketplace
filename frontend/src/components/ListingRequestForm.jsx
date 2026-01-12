import React, { useContext, useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { ICOContent } from '../Context';
import { listingRequestAPI, nftAPI } from '../services/api';
import toast from 'react-hot-toast';

const ListingRequestForm = ({ isOpen, onClose, creatorAddress, userNFTs = [], onSuccess }) => {
  const { address } = useContext(ICOContent);
  const [selectedNFT, setSelectedNFT] = useState('');
  const [requestType, setRequestType] = useState('listing'); // 'listing', 'collection', 'partnership'
  const [preferredPrice, setPreferredPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableNFTs, setAvailableNFTs] = useState([]);
  const [loadingNFTs, setLoadingNFTs] = useState(false);

  // Fetch user's NFTs (both minted and unminted) when component opens
  useEffect(() => {
    if (isOpen && address) {
      fetchUserNFTs();
    }
  }, [isOpen, address]);

  const fetchUserNFTs = async () => {
    setLoadingNFTs(true);
    try {
      // Fetch all NFTs from all networks
      const networks = ['polygon', 'ethereum', 'bsc', 'arbitrum', 'base', 'solana'];
      let allNFTs = [];
      
      for (const network of networks) {
        try {
          const nfts = await nftAPI.getAllNftsByNetwork(network);
          if (Array.isArray(nfts)) {
            const userNfts = nfts.filter(nft => 
              nft.creator?.toLowerCase() === address?.toLowerCase() ||
              nft.owner?.toLowerCase() === address?.toLowerCase()
            );
            allNFTs = [...allNFTs, ...userNfts];
          }
        } catch (err) {
          console.warn(`Error fetching NFTs from ${network}:`, err);
        }
      }

      setAvailableNFTs(allNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast.error('Failed to fetch your NFTs');
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleSubmit = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!creatorAddress) {
      toast.error('Creator address is required');
      return;
    }

    if (!selectedNFT && requestType === 'listing') {
      toast.error('Please select an NFT');
      return;
    }

    if (!preferredPrice || parseFloat(preferredPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        requesterAddress: address,
        creatorAddress: creatorAddress,
        requestType: requestType,
        nftName: selectedNFT ? userNFTs.find(nft => nft.itemId === selectedNFT)?.name : `${requestType} Request`,
        preferredPrice: (parseFloat(preferredPrice) * 1e18).toString(),
        description: description || `Requesting ${requestType} for NFT marketplace`,
      };

      await listingRequestAPI.createRequest(requestData);
      toast.success('Listing request submitted successfully!');
      
      // Reset form
      setSelectedNFT('');
      setPreferredPrice('');
      setDescription('');
      setRequestType('listing');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting listing request:', error);
      toast.error(error.message || 'Failed to submit listing request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
            <h2 className="text-2xl font-bold text-white">Listing Request</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Info */}
            <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30 text-sm">
              <p className="text-blue-300">
                <strong>Request a listing</strong> from this creator for your NFT to be featured on the marketplace.
              </p>
            </div>

            {/* Request Type */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Request Type</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'listing', label: 'NFT Listing', desc: 'List a single NFT' },
                  { value: 'collection', label: 'Collection', desc: 'List a full collection' },
                  { value: 'partnership', label: 'Partnership', desc: 'Discuss collaboration' }
                ].map(type => (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      requestType === type.value
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requestType"
                      value={type.value}
                      checked={requestType === type.value}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-sm">{type.label}</p>
                      <p className="text-xs text-gray-400">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* NFT Selection (only for listing type) */}
            {requestType === 'listing' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold">Select NFT</label>
                {loadingNFTs ? (
                  <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-400">
                    Loading your NFTs...
                  </div>
                ) : availableNFTs.length > 0 ? (
                  <select
                    value={selectedNFT}
                    onChange={(e) => setSelectedNFT(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Choose an NFT...</option>
                    {availableNFTs.map(nft => (
                      <option key={nft.itemId || nft._id} value={nft.itemId || nft._id}>
                        {nft.name} {!nft.isMinted && '(Unminted)'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-400">
                    You haven't created any NFTs yet
                  </div>
                )}
              </div>
            )}

            {/* Preferred Price */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Preferred Price (ETH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={preferredPrice}
                onChange={(e) => setPreferredPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-400">
                This helps the creator evaluate your request
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Message (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the creator why you're interested in a listing..."
                maxLength={500}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none h-24"
              />
              <p className="text-xs text-gray-400">
                {description.length}/500 characters
              </p>
            </div>

            {/* Summary */}
            <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
              <div className="text-sm space-y-1">
                <p className="text-gray-300">You're requesting:</p>
                <p className="font-semibold text-purple-300">
                  {requestType === 'listing' && selectedNFT
                    ? `Listing: ${availableNFTs.find(nft => nft.itemId === selectedNFT || nft._id === selectedNFT)?.name}`
                    : `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} listing`}
                </p>
                {preferredPrice && (
                  <p className="text-xs text-gray-400">
                    Proposed price: {preferredPrice} ETH
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 space-y-3 sticky bottom-0 bg-gray-900">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !preferredPrice || (requestType === 'listing' && !selectedNFT)}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ListingRequestForm;
