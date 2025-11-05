import React, { useState } from 'react';
import { FiSearch, FiFilter, FiPackage, FiTruck, FiCheck, FiX, FiClock, FiUser, FiDollarSign, FiCalendar, FiActivity } from 'react-icons/fi';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);

  // Mock data - in real app, this would come from API
  const orders = [
    {
      id: 1,
      orderNumber: 'ORD-2024-001',
      customer: '0x1234...5678',
      customerName: 'John Doe',
      email: 'john@example.com',
      nftName: 'Cool Cat #123',
      collection: 'Cool Cats',
      amount: '2.5 ETH',
      status: 'completed',
      paymentMethod: 'ETH',
      transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
      createdAt: '2024-01-15 14:30:25',
      completedAt: '2024-01-15 16:45:30',
      blockNumber: 18945678,
      notes: 'NFT successfully transferred to buyer wallet'
    },
    {
      id: 2,
      orderNumber: 'ORD-2024-002',
      customer: '0x9876...5432',
      customerName: 'Jane Smith',
      email: 'jane@example.com',
      nftName: 'Space Ape #456',
      collection: 'Space Apes',
      amount: '1.8 ETH',
      status: 'pending',
      paymentMethod: 'ETH',
      transactionHash: null,
      createdAt: '2024-01-15 13:45:12',
      completedAt: null,
      blockNumber: null,
      notes: 'Awaiting blockchain confirmation'
    },
    {
      id: 3,
      orderNumber: 'ORD-2024-003',
      customer: '0xabcd...efgh',
      customerName: 'Bob Wilson',
      email: 'bob@example.com',
      nftName: 'Digital Art #789',
      collection: 'Digital Art',
      amount: '3.2 ETH',
      status: 'processing',
      paymentMethod: 'ETH',
      transactionHash: null,
      createdAt: '2024-01-15 12:15:08',
      completedAt: null,
      blockNumber: null,
      notes: 'Payment received, processing NFT transfer'
    },
    {
      id: 4,
      orderNumber: 'ORD-2024-004',
      customer: '0x5678...1234',
      customerName: 'Alice Brown',
      email: 'alice@example.com',
      nftName: 'Pixel Punks #321',
      collection: 'Pixel Punks',
      amount: '0.8 ETH',
      status: 'cancelled',
      paymentMethod: 'ETH',
      transactionHash: null,
      createdAt: '2024-01-15 11:20:45',
      completedAt: null,
      blockNumber: null,
      notes: 'Transaction failed - insufficient gas'
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.nftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <FiClock className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <FiX className="w-4 h-4 text-red-600" />;
      case 'failed':
        return <FiX className="w-4 h-4 text-red-600" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-600" />;
    }
  };

  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + parseFloat(o.amount), 0);

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 font-display">Manage NFT purchase orders and blockchain transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
            Export Orders
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
            Create Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Revenue</p>
              <p className="text-2xl font-display font-bold text-gray-900">{totalRevenue.toFixed(2)} ETH</p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Total Orders</p>
              <p className="text-2xl font-display font-bold text-gray-900">{totalOrders}</p>
            </div>
            <FiPackage className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Completed</p>
              <p className="text-2xl font-display font-bold text-gray-900">{completedOrders}</p>
            </div>
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display text-gray-600">Processing</p>
              <p className="text-2xl font-display font-bold text-gray-900">{pendingOrders}</p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-600" />
          </div>
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
                placeholder="Search by order number, customer name, NFT, or transaction hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-display">
              <FiFilter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-display text-sm text-gray-700">
                {selectedOrders.length} of {filteredOrders.length} selected
              </span>
            </div>
            {selectedOrders.length > 0 && (
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-display">
                  Bulk Actions
                </button>
                <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-display">
                  Process Orders
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-display">
                  Cancel Orders
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
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  NFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                      />
                      <div>
                        <div className="text-sm font-display font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        {order.transactionHash && (
                          <div className="text-xs text-gray-500 font-mono">
                            TX: {order.transactionHash.slice(0, 10)}...{order.transactionHash.slice(-8)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-display font-medium text-gray-900">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-gray-500 font-display">
                        {order.email}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {order.customer}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-display font-medium text-gray-900">
                        {order.nftName}
                      </div>
                      <div className="text-sm text-gray-500 font-display">
                        {order.collection}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-semibold text-gray-900">
                    {order.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">
                    {order.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-display font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1" title="View Customer">
                        <FiUser className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1" title="View Transaction">
                        <FiActivity className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1" title="View Details">
                        <FiCalendar className="w-4 h-4" />
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
              Showing 1 to {filteredOrders.length} of {orders.length} results
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

export default Orders;
