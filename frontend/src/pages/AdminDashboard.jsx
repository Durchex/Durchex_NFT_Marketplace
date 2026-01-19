import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, DollarSign, TrendingUp, AlertCircle, Settings,
  Eye, Ban, Check, Clock, Download, RefreshCw
} from 'lucide-react';

/**
 * AdminDashboard - Admin overview and controls
 * Shows key metrics, pending actions, and admin controls
 */
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 1250,
    totalListings: 3456,
    totalVolume: 2543.75,
    pendingReviews: 23,
    flaggedNFTs: 5,
    activeListings: 892
  });

  const [loading, setLoading] = useState(false);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const salesData = [
    { date: 'Mon', sales: 4000, volume: 2400 },
    { date: 'Tue', sales: 3000, volume: 1398 },
    { date: 'Wed', sales: 2000, volume: 9800 },
    { date: 'Thu', sales: 2780, volume: 3908 },
    { date: 'Fri', sales: 1890, volume: 4800 },
    { date: 'Sat', sales: 2390, volume: 3800 },
    { date: 'Sun', sales: 3490, volume: 4300 },
  ];

  const collectionStats = [
    { name: 'Art', value: 35 },
    { name: 'Gaming', value: 25 },
    { name: 'Virtual Land', value: 20 },
    { name: 'Music', value: 12 },
    { name: 'Other', value: 8 },
  ];

  const COLORS = ['#06b6d4', '#a855f7', '#ef4444', '#f59e0b', '#10b981'];

  const pendingActions = [
    { id: 1, type: 'Collection Verification', user: 'John.eth', date: '2 hours ago', priority: 'high' },
    { id: 2, type: 'NFT Review', user: 'Alice_NFT', date: '5 hours ago', priority: 'medium' },
    { id: 3, type: 'Dispute Resolution', user: 'Collector99', date: '1 day ago', priority: 'high' },
    { id: 4, type: 'Fee Subsidy Request', user: 'Artist42', date: '2 days ago', priority: 'low' },
    { id: 5, type: 'Withdrawal Approval', user: 'Creator01', date: '3 days ago', priority: 'medium' },
  ];

  const recentListings = [
    { id: 1, name: 'Cyber Punk #123', creator: 'ArtLab', price: 5.5, network: 'ethereum', status: 'pending' },
    { id: 2, name: 'Digital Canvas #456', creator: 'CreatorX', price: 0.75, network: 'polygon', status: 'approved' },
    { id: 3, name: 'Moon Nft #789', creator: 'SpaceArt', price: 2.3, network: 'arbitrum', status: 'flagged' },
    { id: 4, name: 'Genesis #001', creator: 'FounderDAO', price: 10.0, network: 'ethereum', status: 'approved' },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setRefreshTime(new Date());
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-4 border-green-500 bg-green-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Last updated: {refreshTime.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={handleRefresh}
            className={`flex items-center px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition ${loading ? 'opacity-50' : ''}`}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="ml-2">Refresh</span>
          </button>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Users</span>
                <Users size={20} className="text-cyan-400" />
              </div>
              <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-400 mt-1">+2.5% this week</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Active Listings</span>
                <TrendingUp size={20} className="text-purple-400" />
              </div>
              <p className="text-3xl font-bold">{stats.activeListings.toLocaleString()}</p>
              <p className="text-xs text-green-400 mt-1">+5.2% this week</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Volume</span>
                <DollarSign size={20} className="text-green-400" />
              </div>
              <p className="text-3xl font-bold">{stats.totalVolume.toFixed(2)} ETH</p>
              <p className="text-xs text-green-400 mt-1">+12.8% this week</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-yellow-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Pending Reviews</span>
                <Clock size={20} className="text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingReviews}</p>
              <p className="text-xs text-yellow-400 mt-1">Action needed</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-red-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Flagged NFTs</span>
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-400">{stats.flaggedNFTs}</p>
              <p className="text-xs text-red-400 mt-1">Requires review</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Listings</span>
                <Eye size={20} className="text-blue-400" />
              </div>
              <p className="text-3xl font-bold">{stats.totalListings.toLocaleString()}</p>
              <p className="text-xs text-green-400 mt-1">+8.3% this week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales & Volume Chart */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">Sales & Volume (7 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={2} />
                <Line type="monotone" dataKey="volume" stroke="#a855f7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Collection Distribution */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4">Collection Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={collectionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {collectionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
                  formatter={(value) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Pending Actions */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Pending Actions</h2>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className={`rounded-lg p-4 flex justify-between items-center ${getPriorityColor(action.priority)}`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{action.type}</p>
                    <p className="text-sm text-gray-600">{action.user} • {action.date}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Review
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Listings */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Listings</h2>
            <div className="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700 bg-gray-700/30">
                  <tr>
                    <th className="px-6 py-3 font-semibold">NFT Name</th>
                    <th className="px-6 py-3 font-semibold">Creator</th>
                    <th className="px-6 py-3 font-semibold">Price</th>
                    <th className="px-6 py-3 font-semibold">Network</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((listing) => (
                    <tr key={listing.id} className="border-b border-gray-700 hover:bg-gray-700/20 transition">
                      <td className="px-6 py-4">{listing.name}</td>
                      <td className="px-6 py-4">{listing.creator}</td>
                      <td className="px-6 py-4">{listing.price} ETH</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {listing.network}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(listing.status)}`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-purple-400 hover:text-purple-300 transition">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Settings */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Admin Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition border border-gray-600">
              <Settings size={24} className="mr-4" />
              <div className="text-left">
                <p className="font-semibold">Manage Collections</p>
                <p className="text-sm text-gray-400">Verify and manage NFT collections</p>
              </div>
            </button>
            <button className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition border border-gray-600">
              <Users size={24} className="mr-4" />
              <div className="text-left">
                <p className="font-semibold">Manage Users</p>
                <p className="text-sm text-gray-400">View and manage user accounts</p>
              </div>
            </button>
            <button className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition border border-gray-600">
              <Ban size={24} className="mr-4" />
              <div className="text-left">
                <p className="font-semibold">Moderation</p>
                <p className="text-sm text-gray-400">Review flagged content and disputes</p>
              </div>
            </button>
            <button className="flex items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition border border-gray-600">
              <Download size={24} className="mr-4" />
              <div className="text-left">
                <p className="font-semibold">Export Reports</p>
                <p className="text-sm text-gray-400">Download analytics and reports</p>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
