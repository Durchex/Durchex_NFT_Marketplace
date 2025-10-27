import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FiFileText
} from 'react-icons/fi';
import { useAdmin } from '../Context/AdminContext';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, adminLogout } = useAdmin();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      path: '/admin/dashboard',
      description: 'Overview and analytics'
    },
    {
      id: 'users',
      label: 'Users',
      icon: FiUsers,
      path: '/admin/users',
      description: 'Manage user accounts'
    },
    {
      id: 'nfts',
      label: 'NFTs',
      icon: FiImage,
      path: '/admin/nfts',
      description: 'Manage NFT collections'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: FiDollarSign,
      path: '/admin/transactions',
      description: 'View transaction history'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: FiShoppingCart,
      path: '/admin/orders',
      description: 'Manage orders and sales'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FiBarChart,
      path: '/admin/analytics',
      description: 'Site statistics and reports'
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: FiActivity,
      path: '/admin/activity',
      description: 'System activity monitoring'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FiFileText,
      path: '/admin/reports',
      description: 'Generate reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FiSettings,
      path: '/admin/settings',
      description: 'System configuration'
    }
  ];

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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-lg">Admin Panel</h2>
                <p className="text-xs text-gray-400 font-display">Durchex NFT</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-medium text-white truncate">
              {adminUser?.username}
            </p>
              <p className="text-xs text-gray-400 font-display capitalize">
                {adminUser?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

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
                  <p className={`font-display font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200 group ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-display font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
