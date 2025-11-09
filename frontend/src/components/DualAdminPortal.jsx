import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiImage,
  FiShoppingCart,
  FiBarChart,
  FiSettings,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiDollarSign,
  FiActivity,
  FiFileText,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiCode
} from 'react-icons/fi';
import { useAdmin } from '../Context/AdminContext';

const AdminSidebar = ({ isPartner = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, adminLogout } = useAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fullAccessMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/admin/dashboard', description: 'Overview and analytics' },
    { id: 'users', label: 'Users', icon: FiUsers, path: '/admin/users', description: 'Manage user accounts' },
    { id: 'nfts', label: 'NFTs', icon: FiImage, path: '/admin/nfts', description: 'Manage NFT collections' },
    { id: 'transactions', label: 'Transactions', icon: FiDollarSign, path: '/admin/transactions', description: 'View transaction history' },
    { id: 'orders', label: 'Orders', icon: FiShoppingCart, path: '/admin/orders', description: 'Manage orders and sales' },
    { id: 'contracts', label: 'Contract Management', icon: FiCode, path: '/admin/contracts', description: 'Manage smart contracts and vendors' },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart, path: '/admin/analytics', description: 'Site statistics and reports' },
    { id: 'activity', label: 'Activity Log', icon: FiActivity, path: '/admin/activity', description: 'System activity monitoring' },
    { id: 'reports', label: 'Reports', icon: FiFileText, path: '/admin/reports', description: 'Generate reports' },
    { id: 'partners', label: 'Partner Management', icon: FiUserPlus, path: '/admin/partners', description: 'Manage partner accounts' },
    { id: 'settings', label: 'Settings', icon: FiSettings, path: '/admin/settings', description: 'System configuration' },
  ];

  const partnerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/admin/partner/dashboard', description: 'Overview and analytics', readOnly: true },
    { id: 'users', label: 'Users', icon: FiUsers, path: '/admin/partner/users', description: 'View user accounts', readOnly: true },
    { id: 'nfts', label: 'NFTs', icon: FiImage, path: '/admin/partner/nfts', description: 'View NFT collections', readOnly: true },
    { id: 'transactions', label: 'Transactions', icon: FiDollarSign, path: '/admin/partner/transactions', description: 'View transaction history', readOnly: true },
    { id: 'orders', label: 'Orders', icon: FiShoppingCart, path: '/admin/partner/orders', description: 'View orders and sales', readOnly: true },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart, path: '/admin/partner/analytics', description: 'View site statistics', readOnly: true },
    { id: 'reports', label: 'Reports', icon: FiFileText, path: '/admin/partner/reports', description: 'View reports', readOnly: true },
  ];

  const menuItems = isPartner ? partnerMenuItems : fullAccessMenuItems;

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin-login');
  };

  return (
    <div className={`bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-screen flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <FiShield className="w-6 h-6 text-blue-400" />
              <span className="text-white font-display text-xl font-bold">
                {isPartner ? 'Partner Portal' : 'Durchex Admin'}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        {!isCollapsed && adminUser && (
          <div className="mt-4 flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-display">
              {adminUser.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-display text-sm font-medium">{adminUser.username}</p>
              <p className="text-gray-400 font-display text-xs">
                {isPartner ? 'Partner' : adminUser.role.replace('_', ' ')}
              </p>
            </div>
            {isPartner && (
              <div className="ml-auto">
                <FiLock className="w-4 h-4 text-yellow-400" title="Read-only access" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`} />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <p className={`font-display font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {item.label}
                    </p>
                    {item.readOnly && (
                      <FiEye className="w-3 h-3 text-yellow-400" title="Read-only" />
                    )}
                  </div>
                  <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg transition-colors duration-200
            text-red-400 hover:bg-red-900/20 hover:text-red-300 font-display text-sm`}
          title="Logout"
        >
          <FiLogOut className="w-5 h-5" />
          {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
        </button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children, isPartner = false }) => {
  const { hasAdminAccess } = useAdmin();

  if (!hasAdminAccess()) {
    return null; // Will be redirected by Admin component
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <AdminSidebar isPartner={isPartner} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                {isPartner ? 'Partner Dashboard' : 'Admin Dashboard'}
              </h1>
              <p className="text-gray-600 font-display text-sm">
                {isPartner ? 'View-only access to marketplace data' : 'Manage your NFT marketplace'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-blue-600">1,234</div>
                <div className="text-xs text-gray-500 font-display">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-green-600">5,678</div>
                <div className="text-xs text-gray-500 font-display">NFTs Listed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-purple-600">89.2</div>
                <div className="text-xs text-gray-500 font-display">ETH Volume</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  );
};

// Partner-specific components with read-only access
const PartnerDashboard = () => (
  <div className="space-y-6 min-h-full">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <FiLock className="w-5 h-5 text-yellow-600" />
        <p className="text-yellow-800 font-display">
          <strong>Partner Access:</strong> You have read-only access to marketplace data. 
          Contact the main administrator for any modifications.
        </p>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { id: 1, name: 'Total Users', value: '1,234', icon: FiUsers, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { id: 2, name: 'NFTs Listed', value: '5,678', icon: FiImage, color: 'text-green-600', bgColor: 'bg-green-50' },
        { id: 3, name: 'Total Volume', value: '89.2 ETH', icon: FiDollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50' },
        { id: 4, name: 'Active Listings', value: '3,456', icon: FiActivity, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      ].map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className={`bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4 ${stat.bgColor}`}>
            <div className={`p-3 rounded-full ${stat.color} ${stat.bgColor.replace('bg-', 'bg-opacity-50 bg-')}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 font-display text-sm">{stat.name}</p>
              <p className="text-2xl font-display font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Recent Activity</h2>
      <ul className="space-y-4">
        <li className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">U</div>
          <p className="text-gray-700 font-display">
            <span className="font-medium">User JohnDoe</span> registered a new account.
          </p>
          <span className="text-gray-500 text-xs font-display ml-auto">2 hours ago</span>
        </li>
        <li className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">N</div>
          <p className="text-gray-700 font-display">
            <span className="font-medium">NFT #1234</span> was listed for sale.
          </p>
          <span className="text-gray-500 text-xs font-display ml-auto">5 hours ago</span>
        </li>
        <li className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm">T</div>
          <p className="text-gray-700 font-display">
            <span className="font-medium">Transaction 0xabc...123</span> completed.
          </p>
          <span className="text-gray-500 text-xs font-display ml-auto">1 day ago</span>
        </li>
      </ul>
    </div>
  </div>
);

const PartnerUsers = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-display font-bold text-gray-900">User Management</h2>
      <div className="flex items-center space-x-2 text-yellow-600">
        <FiEye className="w-5 h-5" />
        <span className="font-display text-sm">Read-only access</span>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <p className="text-yellow-800 font-display">
        You can view user information but cannot modify user accounts. Contact the main administrator for user management actions.
      </p>
    </div>

    {/* User Table */}
    <div className="overflow-x-auto scrollbar-hide">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Wallet Address</th>
            <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Created At</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[
            { id: 1, name: 'Alice Smith', email: 'alice@example.com', wallet: '0xabc...123', role: 'creator', status: 'active', createdAt: '2023-01-15' },
            { id: 2, name: 'Bob Johnson', email: 'bob@example.com', wallet: '0xdef...456', role: 'collector', status: 'active', createdAt: '2023-02-20' },
            { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', wallet: '0xghi...789', role: 'moderator', status: 'pending', createdAt: '2023-03-10' },
          ].map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-display font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-display font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500 font-display">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono font-display">
                {user.wallet}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-display">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user.role.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                } font-display`}>
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-display">
                {user.createdAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Export components
export { AdminSidebar, AdminLayout, PartnerDashboard, PartnerUsers };
