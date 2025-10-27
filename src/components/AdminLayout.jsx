import React from 'react';
import AdminSidebar from './AdminSidebar';
import { useAdmin } from '../Context/AdminContext';

const AdminLayout = ({ children }) => {
  const { hasAdminAccess } = useAdmin();

  if (!hasAdminAccess()) {
    return null; // Will be redirected by Admin component
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <AdminSidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 font-display text-sm">
                Manage your NFT marketplace
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

export default AdminLayout;
