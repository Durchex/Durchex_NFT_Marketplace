import React, { useState } from 'react';
import { FiEye, FiLock, FiFileText, FiDownload, FiCalendar, FiFilter } from 'react-icons/fi';

const PartnerReports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState('30');

  const reports = [
    { id: 'user-growth', name: 'User Growth Report', description: 'Track user registration and activity over time', type: 'analytics' },
    { id: 'nft-sales', name: 'NFT Sales Report', description: 'Comprehensive sales data and trends', type: 'sales' },
    { id: 'revenue', name: 'Revenue Report', description: 'Platform revenue and fee collection', type: 'financial' },
    { id: 'transactions', name: 'Transaction Report', description: 'All transaction history and analysis', type: 'transactions' },
    { id: 'collections', name: 'Collections Report', description: 'Top performing collections and trends', type: 'collections' },
  ];

  const generatedReports = [
    { id: 1, name: 'User Growth Report - January 2024', type: 'analytics', generatedAt: '2024-01-15 10:30:00', size: '2.3 MB', status: 'ready' },
    { id: 2, name: 'NFT Sales Report - December 2023', type: 'sales', generatedAt: '2024-01-01 09:15:00', size: '5.7 MB', status: 'ready' },
    { id: 3, name: 'Revenue Report - Q4 2023', type: 'financial', generatedAt: '2023-12-31 18:45:00', size: '1.8 MB', status: 'ready' },
    { id: 4, name: 'Transaction Report - November 2023', type: 'transactions', generatedAt: '2023-12-01 14:20:00', size: '8.2 MB', status: 'ready' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'analytics': return <FiFileText className="w-4 h-4 text-blue-500" />;
      case 'sales': return <FiFileText className="w-4 h-4 text-green-500" />;
      case 'financial': return <FiFileText className="w-4 h-4 text-purple-500" />;
      case 'transactions': return <FiFileText className="w-4 h-4 text-orange-500" />;
      case 'collections': return <FiFileText className="w-4 h-4 text-pink-500" />;
      default: return <FiFileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 min-h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gray-900">Reports</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiEye className="w-5 h-5" />
          <span className="font-display text-sm">Read-only access</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-display">
          You can view and download existing reports but cannot generate new ones. Contact the main administrator for report generation.
        </p>
      </div>

      {/* Report Generation (Disabled for Partners) */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Generate New Report</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 font-display"
            >
              <option value="">Select report type...</option>
              {reports.map(report => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-display font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 font-display"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg font-display cursor-not-allowed"
          >
            Generate Report (Partner Access Restricted)
          </button>
        </div>
      </div>

      {/* Available Reports */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Available Reports</h3>
        <div className="space-y-4">
          {generatedReports.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(report.type)}
                  <div>
                    <h4 className="font-display font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600 font-display">
                      Generated: {report.generatedAt} • Size: {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)} font-display`}>
                    {report.status}
                  </span>
                  <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-display text-sm">
                    <FiDownload className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Types Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Report Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                {getTypeIcon(report.type)}
                <h4 className="font-display font-medium text-gray-900">{report.name}</h4>
              </div>
              <p className="text-sm text-gray-600 font-display">{report.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerReports;
