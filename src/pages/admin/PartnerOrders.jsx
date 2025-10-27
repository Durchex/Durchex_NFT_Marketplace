import React, { useState } from 'react';
import { FiEye, FiLock, FiShoppingCart, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

const PartnerOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const orders = [
    { id: 1, orderNumber: 'ORD-001', customer: 'Alice Smith', nft: 'CryptoPunk #7804', amount: '2.5 ETH', status: 'completed', timestamp: '2024-01-15 10:30:00' },
    { id: 2, orderNumber: 'ORD-002', customer: 'Bob Johnson', nft: 'Bored Ape #123', amount: '1.8 ETH', status: 'pending', timestamp: '2024-01-15 09:15:00' },
    { id: 3, orderNumber: 'ORD-003', customer: 'Charlie Brown', nft: 'Azuki #456', amount: '0.5 ETH', status: 'cancelled', timestamp: '2024-01-15 08:45:00' },
    { id: 4, orderNumber: 'ORD-004', customer: 'Diana Prince', nft: 'Doodle #789', amount: '3.2 ETH', status: 'completed', timestamp: '2024-01-15 07:20:00' },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.nft.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <FiXCircle className="w-4 h-4 text-red-500" />;
      default: return <FiShoppingCart className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Order Management</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiEye className="w-5 h-5" />
          <span className="font-display text-sm">Read-only access</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 font-display">
          You can view order information but cannot modify orders. Contact the main administrator for order management actions.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-display text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-2/3 justify-end">
          <select
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-display text-gray-900"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Order Table */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">NFT</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-display font-medium text-gray-900">{order.orderNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-display text-gray-900">{order.customer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-display text-gray-900">{order.nft}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-medium text-gray-900">
                  {order.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)} font-display`}>
                      {order.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-display">
                  {order.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    <FiEye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerOrders;
