import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiPackage, FiTruck, FiCheck, FiX, FiClock, FiUser, FiDollarSign, FiCalendar, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  const fetchOrders = async (page = 1, filters = {}) => {
    setIsLoading(true);
    try {
      const data = await adminAPI.getOrders(page, pagination.limit, {
        ...filters,
        search: searchTerm
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filters = {};
    if (filterStatus !== 'all') filters.status = filterStatus;
    if (filterNetwork !== 'all') filters.network = filterNetwork;
    fetchOrders(pagination.page, filters);
  }, [pagination.page, filterStatus, filterNetwork]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchOrders(1, { status: filterStatus, network: filterNetwork });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchOrders(pagination.page, { status: filterStatus, network: filterNetwork });
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-display">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 font-display">Manage active NFT listings and sales</p>
        </div>
        <button
          onClick={() => fetchOrders(pagination.page, { status: filterStatus, network: filterNetwork })}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders by NFT name, collection, or seller..."
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-display"
            >
              <option value="all">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">NFT</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Network</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-display font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-display font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {order.nft?.image && (
                          <img src={order.nft.image} alt={order.nft.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <div className="text-sm font-display font-medium text-gray-900">
                            {order.nft?.name || 'Unknown NFT'}
                          </div>
                          <div className="text-xs text-gray-500 font-display">
                            {order.nft?.collection || 'No collection'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 font-display">
                      {formatAddress(order.seller)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display font-semibold text-gray-900">
                      {order.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500 capitalize">
                      {order.network || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-display font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-display text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-display font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {order.status === 'active' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Mark as Completed"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Cancel Order"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-display">No orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-display text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchOrders(pagination.page - 1, { status: filterStatus, network: filterNetwork })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 font-display"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchOrders(pagination.page + 1, { status: filterStatus, network: filterNetwork })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 font-display"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
