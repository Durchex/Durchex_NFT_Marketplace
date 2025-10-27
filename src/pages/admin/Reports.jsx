import React, { useState } from 'react';
import { FiDownload, FiCalendar, FiFileText, FiTrendingUp, FiUsers, FiDollarSign, FiImage, FiActivity, FiRefreshCw, FiFilter } from 'react-icons/fi';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data - in real app, this would come from API
  const reportTemplates = [
    {
      id: 'sales',
      name: 'Sales Report',
      description: 'Comprehensive sales analytics and revenue breakdown',
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      lastGenerated: '2024-01-15 10:30:00',
      size: '2.3 MB'
    },
    {
      id: 'users',
      name: 'User Analytics',
      description: 'User registration, activity, and engagement metrics',
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      lastGenerated: '2024-01-15 09:15:00',
      size: '1.8 MB'
    },
    {
      id: 'nfts',
      name: 'NFT Collections',
      description: 'NFT listing, trading, and collection performance',
      icon: FiImage,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      lastGenerated: '2024-01-15 08:45:00',
      size: '3.1 MB'
    },
    {
      id: 'transactions',
      name: 'Transaction Log',
      description: 'Complete transaction history and blockchain data',
      icon: FiActivity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      lastGenerated: '2024-01-15 07:20:00',
      size: '5.2 MB'
    }
  ];

  const reportData = {
    sales: {
      title: 'Sales Report',
      period: 'Last 30 Days',
      summary: {
        totalRevenue: 89.2,
        totalSales: 156,
        averagePrice: 0.57,
        growth: 12.5
      },
      breakdown: [
        { category: 'NFT Sales', amount: 67.8, percentage: 76.0, color: 'bg-blue-500' },
        { category: 'Trading Fees', amount: 12.4, percentage: 13.9, color: 'bg-green-500' },
        { category: 'Premium Listings', amount: 6.2, percentage: 6.9, color: 'bg-purple-500' },
        { category: 'Other', amount: 2.8, percentage: 3.2, color: 'bg-gray-500' }
      ],
      topCollections: [
        { name: 'Bored Ape Yacht Club', sales: 23, revenue: 18.5, growth: 15.2 },
        { name: 'CryptoPunks', sales: 18, revenue: 14.2, growth: -2.1 },
        { name: 'Mutant Ape Yacht Club', sales: 15, revenue: 12.8, growth: 8.9 },
        { name: 'Azuki', sales: 12, revenue: 9.6, growth: 6.7 }
      ]
    },
    users: {
      title: 'User Analytics',
      period: 'Last 30 Days',
      summary: {
        totalUsers: 1234,
        newUsers: 156,
        activeUsers: 892,
        retention: 72.3
      },
      breakdown: [
        { category: 'New Registrations', amount: 156, percentage: 12.6, color: 'bg-blue-500' },
        { category: 'Active Users', amount: 892, percentage: 72.3, color: 'bg-green-500' },
        { category: 'Returning Users', amount: 736, percentage: 59.6, color: 'bg-purple-500' },
        { category: 'Inactive Users', amount: 186, percentage: 15.1, color: 'bg-gray-500' }
      ],
      topCountries: [
        { country: 'United States', users: 456, percentage: 37.0 },
        { country: 'United Kingdom', users: 234, percentage: 19.0 },
        { country: 'Canada', users: 123, percentage: 10.0 },
        { country: 'Germany', users: 98, percentage: 7.9 }
      ]
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    // In real app, this would trigger actual report generation
  };

  const handleDownloadReport = (reportId) => {
    // In real app, this would download the actual report file
    console.log(`Downloading ${reportId} report...`);
  };

  const currentReport = reportData[selectedReport] || reportData.sales;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 font-display">Generate and download comprehensive marketplace reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
          >
            {isGenerating ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FiFileText className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all cursor-pointer ${
                selectedReport === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedReport(template.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${template.bgColor}`}>
                  <Icon className={`w-6 h-6 ${template.color}`} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadReport(template.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm font-display text-gray-600 mb-4">
                {template.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-display text-gray-500">
                  <span>Last Generated:</span>
                  <span>{template.lastGenerated}</span>
                </div>
                <div className="flex justify-between text-xs font-display text-gray-500">
                  <span>File Size:</span>
                  <span>{template.size}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Summary */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">{currentReport.title}</h2>
              <p className="text-sm font-display text-gray-600">{currentReport.period}</p>
            </div>
            <div className="flex items-center space-x-2">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-display text-gray-500">Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(currentReport.summary).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-display font-bold text-gray-900">
                  {typeof value === 'number' && key !== 'retention' ? value.toLocaleString() : value}
                  {key === 'retention' && '%'}
                  {key === 'totalRevenue' && ' ETH'}
                  {key === 'averagePrice' && ' ETH'}
                </div>
                <div className="text-sm font-display text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Breakdown</h3>
            <div className="space-y-3">
              {currentReport.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-display text-gray-700">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-display font-medium text-gray-900">
                      {typeof item.amount === 'number' ? item.amount.toLocaleString() : item.amount}
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-display text-gray-500 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Actions & Details */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display">
                <FiDownload className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-display">
                <FiFileText className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button className="w-full flex items-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-display">
                <FiTrendingUp className="w-4 h-4" />
                <span>View Analytics</span>
              </button>
            </div>
          </div>

          {/* Report History */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              {reportTemplates.slice(0, 3).map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-display font-medium text-gray-900">{template.name}</div>
                    <div className="text-xs font-display text-gray-500">{template.lastGenerated}</div>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(template.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Report Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Report Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-display font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display">
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <button className="w-full flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display">
                <FiFilter className="w-4 h-4" />
                <span>Advanced Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
