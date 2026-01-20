import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { MdApproval, MdClear, MdEmail } from 'react-icons/md';

export default function AdminListingRequests() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [approvalData, setApprovalData] = useState({ reason: '', notes: '' });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [page, filter, search]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/listing-requests', {
        params: {
          page,
          limit: 20,
          status: filter === 'all' ? undefined : filter,
          search: search || undefined
        }
      });

      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      toast.error('Failed to fetch listing requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/listing-requests/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleApprove = async (request) => {
    try {
      setLoading(true);
      const response = await api.patch(`/admin/listing-requests/${request._id}/approve`, {
        adminNotes: approvalData.notes
      });

      if (response.data.success) {
        toast.success('Listing request approved');
        setShowDetailModal(false);
        setApprovalData({ reason: '', notes: '' });
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to approve request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (request) => {
    if (!approvalData.reason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      const response = await api.patch(`/admin/listing-requests/${request._id}/reject`, {
        reason: approvalData.reason,
        adminNotes: approvalData.notes
      });

      if (response.data.success) {
        toast.success('Listing request rejected');
        setShowDetailModal(false);
        setApprovalData({ reason: '', notes: '' });
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to reject request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Listing Requests</h1>
          <p className="text-gray-400">Manage NFT listing requests from creators</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg">
            <p className="text-blue-200 text-sm">Total</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-6 rounded-lg">
            <p className="text-yellow-200 text-sm">Pending</p>
            <p className="text-3xl font-bold text-white">{stats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-lg">
            <p className="text-green-200 text-sm">Approved</p>
            <p className="text-3xl font-bold text-white">{stats.approved}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-lg">
            <p className="text-red-200 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-white">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-md p-6 rounded-lg mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or NFT..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Requester</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">NFT Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Target Creator</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading && !requests.length ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      No listing requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{request.requesterName}</p>
                        <p className="text-xs text-gray-400">{request.requesterWallet.slice(0, 10)}...</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{request.nftDetails?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{request.targetCreatorName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewDetails(request)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white">Listing Request Details</h2>
                <p className="text-gray-400 text-sm mt-1">ID: {selectedRequest.requestId}</p>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Requester Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Requester Information</h3>
                  <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                    <p className="text-gray-300"><span className="font-medium">Name:</span> {selectedRequest.requesterName}</p>
                    <p className="text-gray-300"><span className="font-medium">Wallet:</span> {selectedRequest.requesterWallet}</p>
                  </div>
                </div>

                {/* Target Creator */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Target Creator</h3>
                  <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                    <p className="text-gray-300"><span className="font-medium">Name:</span> {selectedRequest.targetCreatorName}</p>
                    <p className="text-gray-300"><span className="font-medium">Wallet:</span> {selectedRequest.targetCreatorWallet}</p>
                  </div>
                </div>

                {/* NFT Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">NFT Details</h3>
                  <div className="bg-gray-700/30 rounded-lg p-4 space-y-2">
                    <p className="text-gray-300"><span className="font-medium">Name:</span> {selectedRequest.nftDetails?.name}</p>
                    <p className="text-gray-300"><span className="font-medium">Description:</span> {selectedRequest.nftDetails?.description}</p>
                  </div>
                </div>

                {/* Message */}
                {selectedRequest.requestMessage && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Request Message</h3>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-gray-300">{selectedRequest.requestMessage}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Current Status</h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>

                {/* Approval Form (only if pending) */}
                {selectedRequest.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Admin Action</h3>
                    
                    {/* Rejection Reason */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason (if rejecting)</label>
                      <input
                        type="text"
                        placeholder="Why are you rejecting this request?"
                        value={approvalData.reason}
                        onChange={(e) => setApprovalData({ ...approvalData, reason: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                      <textarea
                        placeholder="Add internal notes..."
                        value={approvalData.notes}
                        onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {selectedRequest.status === 'pending' && (
                <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setApprovalData({ reason: '', notes: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MdClear /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MdApproval /> Approve
                  </button>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setApprovalData({ reason: '', notes: '' });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
