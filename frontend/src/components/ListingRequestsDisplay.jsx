import React, { useEffect, useState } from 'react';
import { FiClock, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { listingRequestAPI } from '../services/api';
import toast from 'react-hot-toast';

const ListingRequestsDisplay = ({ creatorAddress, showSentRequests = false, title = "Listing Requests" }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [creatorAddress]);

  const fetchRequests = async () => {
    if (!creatorAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let data;
      if (showSentRequests) {
        data = await listingRequestAPI.getUserSentRequests(creatorAddress);
      } else {
        data = await listingRequestAPI.getCreatorRequests(creatorAddress);
      }
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: FiClock, label: 'Pending' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400', icon: FiCheck, label: 'Approved' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: FiX, label: 'Rejected' },
      expired: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: FiAlertCircle, label: 'Expired' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        <Icon className="text-sm" />
        {config.label}
      </div>
    );
  };

  const getRequestTypeLabel = (type) => {
    const types = {
      listing: '📋 NFT Listing',
      collection: '📚 Collection',
      partnership: '🤝 Partnership'
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FiAlertCircle className="text-4xl mx-auto mb-4 opacity-50" />
        <p>No listing requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request._id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Side */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">
                    {getRequestTypeLabel(request.requestType)}
                  </h4>
                  {getStatusBadge(request.status || 'pending')}
                </div>
                
                <p className="text-sm text-gray-400 mb-3">
                  {request.description || request.nftName || 'Listing request for marketplace'}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Requested Price</p>
                    <p className="font-semibold text-purple-400">
                      {request.preferredPrice ? (parseFloat(request.preferredPrice) / 1e18).toFixed(4) : 'TBD'} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Submitted</p>
                    <p className="font-semibold">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {request.expiresAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Expires: {formatDate(request.expiresAt)}
                  </div>
                )}
              </div>

              {/* Right Side - Actions */}
              <div className="flex flex-col gap-2">
                {request.status === 'approved' && (
                  <div className="bg-green-500/20 rounded px-3 py-1 text-xs text-green-400 font-semibold">
                    ✓ Approved
                  </div>
                )}
                {request.status === 'rejected' && (
                  <div className="bg-red-500/20 rounded px-3 py-1 text-xs text-red-400 font-semibold">
                    ✗ Rejected
                  </div>
                )}
                {request.status === 'pending' && (
                  <div className="bg-yellow-500/20 rounded px-3 py-1 text-xs text-yellow-400 font-semibold">
                    ⏳ Awaiting
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingRequestsDisplay;
