import { useState, useEffect } from 'react';
import { verificationAPI } from '../../services/verificationAPI';
import { useAdmin } from '../../Context/AdminContext';
import { FiCheck, FiX, FiEye, FiRefreshCw, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Verifications = () => {
  const { adminWallet } = useAdmin();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadVerifications();
  }, [page, statusFilter, searchTerm]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const data = await verificationAPI.getAllVerifications(page, 20, statusFilter, searchTerm);
      setVerifications(data.verifications || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      toast.error(error.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (walletAddress) => {
    if (!window.confirm('Are you sure you want to approve this verification?')) return;

    setIsProcessing(true);
    try {
      const res = await verificationAPI.approveVerification(walletAddress, adminWallet || 'admin');
      toast.success(res?.message || 'Verification approved successfully');

      // Optimistically update local state so admin sees the result immediately
      setVerifications((prev) => prev.map(v => v.walletAddress === walletAddress ? { ...v, verificationStatus: res?.tier || 'premium' } : v));
      if (selectedVerification && selectedVerification.walletAddress === walletAddress) {
        setSelectedVerification((prev) => ({ ...prev, verificationStatus: res?.tier || 'premium' }));
      }

      // Refresh list in background
      loadVerifications();
      setSelectedVerification(null);
    } catch (error) {
      toast.error(error.message || 'Failed to approve verification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (walletAddress) => {
    setIsProcessing(true);
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      setIsProcessing(false);
      return;
    }

    if (!window.confirm('Are you sure you want to reject this verification?')) {
      return;
    }

    try {
      await verificationAPI.rejectVerification(walletAddress, adminWallet || 'admin', rejectionReason);
      toast.success('Verification rejected');
      loadVerifications();
      setSelectedVerification(null);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.message || 'Failed to reject verification');
    }
    setIsProcessing(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      none: { label: 'Not Verified', color: 'gray' },
      pending: { label: 'Pending', color: 'yellow' },
      premium: { label: 'Premium', color: 'blue' },
      super_premium: { label: 'Super Premium', color: 'gold' },
      rejected: { label: 'Rejected', color: 'red' },
    };

    const statusInfo = statusMap[status] || statusMap.none;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
        {statusInfo.label}
      </span>
    );
  };

  const getTierFromVerification = (verification) => {
    if (verification.verificationData?.idVerification) {
      return 'Super Premium';
    }
    return 'Premium';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Management</h1>
          <p className="text-gray-600">Review and manage user verification requests</p>
        </div>
        <button
          onClick={loadVerifications}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by wallet, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="premium">Premium</option>
              <option value="super_premium">Super Premium</option>
              <option value="rejected">Rejected</option>
              <option value="none">Not Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Loading verifications...</p>
          </div>
        ) : verifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No verifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NFTs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verifications.map((verification) => (
                  <tr key={verification.walletAddress} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{verification.username || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{verification.walletAddress?.slice(0, 10)}...{verification.walletAddress?.slice(-8)}</div>
                        <div className="text-xs text-gray-400">{verification.verificationData?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {verification.verificationStatus === 'super_premium' || verification.verificationData?.idVerification
                          ? 'Super Premium'
                          : verification.verificationStatus === 'premium'
                          ? 'Premium'
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{verification.nftCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(verification.verificationStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {verification.verificationData?.submittedAt
                        ? new Date(verification.verificationData.submittedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedVerification(verification)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {verification.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(verification.walletAddress)}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVerification(verification);
                                setRejectionReason('');
                              }}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Verification Details</h2>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">User Information</h3>
                <p className="text-gray-900">Wallet: {selectedVerification.walletAddress}</p>
                <p className="text-gray-900">Username: {selectedVerification.username || 'N/A'}</p>
                <p className="text-gray-900">Email: {selectedVerification.verificationData?.email || 'N/A'}</p>
                <p className="text-gray-900">NFT Count: {selectedVerification.nftCount || 0}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Verification Data</h3>
                {selectedVerification.verificationData?.location && (
                  <p className="text-gray-900">Location: {selectedVerification.verificationData.location}</p>
                )}
                {selectedVerification.verificationData?.address && (
                  <p className="text-gray-900">Address: {selectedVerification.verificationData.address}</p>
                )}
                {selectedVerification.verificationData?.country && (
                  <p className="text-gray-900">Country: {selectedVerification.verificationData.country}</p>
                )}
                {selectedVerification.verificationData?.houseAddress && (
                  <p className="text-gray-900">House Address: {selectedVerification.verificationData.houseAddress}</p>
                )}
                {selectedVerification.verificationData?.idVerification && (
                  <div className="mt-2">
                    <p className="text-gray-900">ID Type: {selectedVerification.verificationData.idVerification.documentType}</p>
                    <p className="text-gray-900">ID Number: {selectedVerification.verificationData.idVerification.documentNumber}</p>
                    {selectedVerification.verificationData.idVerification.documentImage && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">ID Document:</p>
                        <img
                          src={selectedVerification.verificationData.idVerification.documentImage}
                          alt="ID Document"
                          className="max-w-full h-auto border border-gray-200 rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <p style={{ display: 'none' }} className="text-sm text-gray-500">
                          Document image URL: {selectedVerification.verificationData.idVerification.documentImage}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedVerification.verificationStatus === 'pending' && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter reason for rejection..."
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApprove(selectedVerification.walletAddress)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiCheck className="w-4 h-4 inline mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedVerification.walletAddress)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiX className="w-4 h-4 inline mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verifications;

