import React, { useContext, useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ICOContent } from "../Context/index.jsx";
import { ErrorToast } from "../app/Toast/Error.jsx";
import { SuccessToast } from "../app/Toast/Success";
import { nftAPI, listingRequestAPI } from "../services/api";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { BsStars } from "react-icons/bs";

const ListingRequestForm = () => {
  const contexts = useContext(ICOContent);
  const { address } = contexts || {};
  
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requestMessage: "",
  });
  const [listingRequests, setListingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  // Fetch user's NFTs on component mount
  useEffect(() => {
    if (address) {
      fetchUserNFTs();
      fetchUserListingRequests();
    }
  }, [address]);

  const fetchUserNFTs = async () => {
    try {
      setLoading(true);
      const response = await nftAPI.getUserNFTs(address);
      // Handle both array and object responses
      const nfts = Array.isArray(response) ? response : (response?.nfts || response?.data || []);
      
      // Filter NFTs that are not currently listed
      const unlistedNFTs = nfts.filter(nft => !nft.currentlyListed);
      setUserNFTs(unlistedNFTs);
      
      console.log('[ListingRequestForm] User NFTs:', unlistedNFTs);
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      // Don't show toast on first load, just log
      if (userNFTs.length === 0) {
        console.log('First load - no NFTs yet');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListingRequests = async () => {
    try {
      const response = await listingRequestAPI.getUserSentRequests(address);
      // Handle various response formats
      const requests = response?.requests || response?.data || [];
      setListingRequests(requests);
      console.log('[ListingRequestForm] Listing requests:', requests);
    } catch (error) {
      console.error('Failed to fetch listing requests:', error);
      // Fail silently on first load
    }
  };

  const handleNFTSelection = (nft) => {
    setSelectedNFT(nft);
    setShowForm(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!selectedNFT || !address) {
      ErrorToast('Please select an NFT first');
      return;
    }

    try {
      setLoading(true);

      // Get creator/seller info - they are requesting to their original seller
      const creatorWallet = selectedNFT.seller || selectedNFT.owner;
      const creatorName = selectedNFT.creatorName || creatorWallet?.slice(0, 6) + '...';

      const requestData = {
        requesterWallet: address,
        requesterName: address?.slice(0, 6) + '...',
        requesterProfilePicture: null,
        targetCreatorWallet: creatorWallet,
        targetCreatorName: creatorName,
        nftDetails: {
          name: selectedNFT.name,
          description: selectedNFT.description || '',
          image: selectedNFT.image,
          collectionName: selectedNFT.collection || 'Uncategorized',
          royalty: selectedNFT.royalties?.percentage || 0,
          attributes: selectedNFT.properties || []
        },
        requestMessage: formData.requestMessage
      };

      const response = await listingRequestAPI.createRequest(requestData);

      if (response.success) {
        SuccessToast('Listing request submitted successfully! Awaiting admin approval.');
        setFormData({ requestMessage: '' });
        setShowForm(false);
        setSelectedNFT(null);
        
        // Refresh requests list
        await fetchUserListingRequests();
        await fetchUserNFTs();
      } else {
        ErrorToast(response.message || 'Failed to submit listing request');
      }
    } catch (error) {
      console.error('Error submitting listing request:', error);
      ErrorToast(error.response?.data?.message || 'Failed to submit listing request');
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/30 border-yellow-600 text-yellow-400';
      case 'approved':
        return 'bg-green-900/30 border-green-600 text-green-400';
      case 'rejected':
        return 'bg-red-900/30 border-red-600 text-red-400';
      default:
        return 'bg-gray-800 border-gray-600 text-gray-400';
    }
  };

  const getRequestStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✓';
      case 'rejected':
        return '✗';
      default:
        return '•';
    }
  };

  return (
    <div className="w-full">
      <Toaster position="left" />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            Request NFT Listing
          </h1>
          <div className="flex items-center gap-2 mt-4 text-gray-400">
            <BsStars className="text-pink-400" />
            <p className="text-sm md:text-base">Submit your NFT for admin approval to list on marketplace</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex gap-4 border-b border-gray-700">
            <button
              onClick={() => setShowRequests(false)}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                !showRequests
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              New Request ({userNFTs.length})
            </button>
            <button
              onClick={() => setShowRequests(true)}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                showRequests
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              My Requests ({listingRequests.length})
            </button>
          </div>
        </div>

        {/* New Request Tab */}
        {!showRequests && (
          <div className="max-w-4xl mx-auto">
            {!showForm ? (
              <>
                {/* NFT Selection Grid */}
                {userNFTs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userNFTs.map((nft) => (
                      <div
                        key={nft._id || nft.itemId}
                        className="group bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-pink-500 transition-all duration-300 cursor-pointer"
                        onClick={() => handleNFTSelection(nft)}
                      >
                        <div className="relative h-48 bg-gray-900 overflow-hidden">
                          {nft.image ? (
                            <img
                              src={nft.image}
                              alt={nft.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                              <span className="text-gray-600 text-lg">No Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button className="px-6 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-medium">
                              Select
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1 line-clamp-1">{nft.name}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{nft.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {nft.pieces || 1} piece{((nft.pieces || 1) > 1) ? 's' : ''}
                            </span>
                            <span className="text-sm font-medium text-pink-400">
                              {nft.price} ETH
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-lg mb-4">No NFTs available to list</p>
                    <p className="text-gray-500 text-sm">Create or purchase an NFT first</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Selected NFT Details */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setSelectedNFT(null);
                    }}
                    className="flex items-center gap-2 text-pink-400 hover:text-pink-300 mb-4"
                  >
                    <FiArrowLeft /> Back to NFTs
                  </button>
                  
                  <div className="flex gap-6">
                    {selectedNFT.image && (
                      <img
                        src={selectedNFT.image}
                        alt={selectedNFT.name}
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{selectedNFT.name}</h2>
                      <p className="text-gray-400 mb-4">{selectedNFT.description}</p>
                      <div className="flex gap-6">
                        <div>
                          <span className="text-gray-500 text-sm">Price</span>
                          <p className="text-xl font-bold text-pink-400">{selectedNFT.price} ETH</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">Pieces</span>
                          <p className="text-xl font-bold">{selectedNFT.pieces || 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Listing Request Form */}
                <form onSubmit={handleSubmitRequest} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-6">Submit Listing Request</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Message to Admin (Optional)
                      </label>
                      <textarea
                        value={formData.requestMessage}
                        onChange={(e) => setFormData({ ...formData, requestMessage: e.target.value })}
                        placeholder="Tell us why this NFT should be listed (special features, benefits, etc.)"
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:outline-none focus:border-pink-500 text-white placeholder-gray-500 resize-none h-24 transition-all"
                      />
                      <p className="text-xs text-gray-500">
                        {formData.requestMessage.length}/500 characters
                      </p>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                      <p className="text-sm text-blue-300">
                        <strong>Note:</strong> Your NFT will be reviewed by our admin team. Approval typically takes 24-48 hours. Once approved, your NFT will be listed on the marketplace.
                      </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg font-medium text-white hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
                      >
                        {loading ? 'Submitting...' : 'Submit Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setSelectedNFT(null);
                        }}
                        className="flex-1 px-6 py-3 bg-gray-700/50 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {showRequests && (
          <div className="max-w-4xl mx-auto">
            {listingRequests.length > 0 ? (
              <div className="space-y-4">
                {listingRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className={`border rounded-xl p-6 backdrop-blur-sm ${getRequestStatusColor(request.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getRequestStatusIcon(request.status)}</span>
                          <h3 className="text-lg font-bold">{request.nftDetails.name}</h3>
                          <span className="px-2 py-1 rounded text-xs font-medium uppercase">
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm opacity-75 mb-3">{request.nftDetails.description}</p>
                        <div className="flex gap-4 text-sm opacity-75">
                          <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                          {request.status === 'approved' && request.approvedAt && (
                            <span>Approved: {new Date(request.approvedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        {request.approvalNotes && (
                          <p className="text-sm mt-2 italic">Admin notes: {request.approvalNotes}</p>
                        )}
                      </div>
                      {request.nftDetails.image && (
                        <img
                          src={request.nftDetails.image}
                          alt={request.nftDetails.name}
                          className="w-20 h-20 rounded-lg object-cover ml-4"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-lg mb-4">No listing requests yet</p>
                <p className="text-gray-500 text-sm">Submit an NFT request to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingRequestForm;
