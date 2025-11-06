import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiMoreVertical, FiUser, FiMail, FiCalendar, FiShield, FiEye, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { adminAPI, userAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchUsers = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getAllUsersAdmin(page, pagination.limit, search);
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page, searchTerm);
  }, [pagination.page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchUsers(1, searchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectUser = (walletAddress) => {
    setSelectedUsers(prev => 
      prev.includes(walletAddress) 
        ? prev.filter(addr => addr !== walletAddress)
        : [...prev, walletAddress]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.walletAddress));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updates) => {
    try {
      await adminAPI.updateUserStatus(editingUser.walletAddress, updates);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers(pagination.page, searchTerm);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (walletAddress) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userAPI.deleteUserProfile(walletAddress);
      toast.success('User deleted successfully');
      fetchUsers(pagination.page, searchTerm);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    
    try {
      await Promise.all(selectedUsers.map(addr => userAPI.deleteUserProfile(addr)));
      toast.success(`${selectedUsers.length} users deleted successfully`);
      setSelectedUsers([]);
      fetchUsers(pagination.page, searchTerm);
    } catch (error) {
      toast.error('Failed to delete some users');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || (user.isVerified && filterRole === 'verified') || (!user.isVerified && filterRole === 'unverified');
    return matchesRole;
  });

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 font-display">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchUsers(pagination.page, searchTerm)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-display text-sm text-gray-700">
                {selectedUsers.length} of {filteredUsers.length} selected
              </span>
            </div>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-display"
              >
                Delete Selected ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">NFTs Owned</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Listed</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id || user.walletAddress} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.walletAddress)}
                          onChange={() => handleSelectUser(user.walletAddress)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                        />
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          {user.image ? (
                            <img src={user.image} alt={user.username} className="w-10 h-10 rounded-full" />
                          ) : (
                            <FiUser className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-display font-medium text-gray-900">
                            {user.username || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500 font-display">
                            {user.email || 'No email'}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {formatAddress(user.walletAddress)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${
                          user.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">
                      {user.nftCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">
                      {user.listedCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-display font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit User"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.walletAddress)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-display">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-display text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1, searchTerm)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
                >
                  Previous
                </button>
                {[...Array(pagination.pages)].slice(0, 5).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchUsers(pageNum, searchTerm)}
                      className={`px-3 py-1 text-sm border rounded transition-colors font-display ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchUsers(pagination.page + 1, searchTerm)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSave={handleUpdateUser}
        />
      )}
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    isVerified: user.isVerified || false,
    bio: user.bio || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-display font-bold text-gray-900 mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            />
          </div>
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
              rows="3"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVerified}
              onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-display text-gray-700">Verified</label>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-display"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-display"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;
