import React, { useState, useEffect } from 'react';
import { FiDownload, FiCalendar, FiFileText, FiTrendingUp, FiUsers, FiDollarSign, FiImage, FiActivity, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableReports, setAvailableReports] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);

  const periodToDates = (range) => {
    const end = new Date();
    const start = new Date();
    if (range === '7d') start.setDate(end.getDate() - 7);
    else if (range === '30d') start.setDate(end.getDate() - 30);
    else if (range === '90d') start.setDate(end.getDate() - 90);
    else if (range === '1y') start.setFullYear(end.getFullYear() - 1);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const fetchAvailableReports = async () => {
    try {
      const res = await adminAPI.getReports();
      setAvailableReports(res.reports || []);
    } catch (e) {
      // Fallback templates if API fails
      setAvailableReports([
        { id: 1, type: 'sales', name: 'Sales Report', createdAt: new Date() },
        { id: 2, type: 'users', name: 'User Report', createdAt: new Date() },
        { id: 3, type: 'nfts', name: 'NFT Report', createdAt: new Date() }
      ]);
    }
  };

  useEffect(() => {
    fetchAvailableReports();
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGeneratedReport(null);
    try {
      const { startDate, endDate } = periodToDates(dateRange);
      const res = await adminAPI.generateReport(selectedReport, { startDate, endDate });
      setGeneratedReport(res);
      toast.success('Report generated');
    } catch (e) {
      console.error('Failed to generate report', e);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!generatedReport) {
      toast.error('Generate a report first');
      return;
    }
    // Create a simple JSON download for now
    const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedReport.type}-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportTemplates = [
    { id: 'sales', name: 'Sales Report', description: 'Sales analytics and revenue breakdown', icon: FiDollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'users', name: 'User Analytics', description: 'User registration and engagement', icon: FiUsers, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'nfts', name: 'NFT Collections', description: 'Listing and collection performance', icon: FiImage, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

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
          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-display"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm font-display text-gray-600 mb-4">
                {template.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Generated Report Preview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-gray-900">Report Preview</h2>
          <div className="flex items-center space-x-2">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-display text-gray-500">Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        {!generatedReport ? (
          <p className="text-gray-500 font-display">No report generated yet. Select a report and click Generate.</p>
        ) : (
          <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(generatedReport, null, 2)}</pre>
        )}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Available Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableReports.map((r) => (
            <div key={r.id} className="p-4 rounded-lg border border-gray-200">
              <div className="font-display font-medium text-gray-900">{r.name}</div>
              <div className="text-xs text-gray-500 font-display">Type: {r.type}</div>
              <div className="text-xs text-gray-500 font-display">Updated: {new Date(r.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
