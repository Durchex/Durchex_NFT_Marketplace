import React, { useState } from 'react';
import { FiSearch, FiFilter, FiMoreVertical, FiUser, FiMail, FiCalendar, FiShield, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Mock data - in real app, this would come from API
  const users = [
    {
      id: 1,
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'crypto_artist',
      email: 'artist@example.com',
      role: 'creator',
      status: 'active',
      joinDate: '2024-01-15',
      nftsCreated: 45,
      totalSales: '12.5 ETH',
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      walletAddress: '0x9876543210987654321098765432109876543210',
      username: 'nft_collector',
      email: 'collector@example.com',
      role: 'collector',
      status: 'active',
      joinDate: '2024-02-20',
      nftsCreated: 0,
      totalSales: '0 ETH',
      lastActive: '1 day ago'
    },
    {
      id: 3,
      walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      username: 'digital_creator',
      email: 'creator@example.com',
      role: 'creator',
      status: 'suspended',
      joinDate: '2024-01-10',
      nftsCreated: 23,
      totalSales: '8.2 ETH',
      lastActive: '1 week ago'
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || styles.active;
  };

  const getRoleBadge = (role) => {
    const styles = {
      creator: 'bg-blue-100 text-blue-800',
      collector: 'bg-purple-100 text-purple-800',
      admin: 'bg-gray-100 text-gray-800'
    };
    return styles[role] || styles.collector;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 font-display">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
            Export Users
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
            Add User
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
              <option value="all">All Roles</option>
              <option value="creator">Creators</option>
              <option value="collector">Collectors</option>
              <option value="admin">Admins</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-display">
              <FiFilter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
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
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-display">
                  Bulk Actions
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-display">
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  NFTs Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                      />
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-display font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 font-display">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">
                    {user.nftsCreated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-900">
                    {user.totalSales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-display font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm font-display text-gray-700">
              Showing 1 to {filteredUsers.length} of {users.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors font-display">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded font-display">
                1
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors font-display">
                2
              </button>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors font-display">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
