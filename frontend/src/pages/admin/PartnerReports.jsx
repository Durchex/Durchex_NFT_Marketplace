import React, { useState, useEffect } from 'react';
import { FiDownload, FiFileText, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../../services/adminAPI';

const PartnerReports = () => {
  const [availableReports, setAvailableReports] = useState([]);
  const [selected, setSelected] = useState('sales');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await adminAPI.getReports();
      setAvailableReports(res.reports || []);
    } catch {
      setAvailableReports([]);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setReport(null);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const res = await adminAPI.generateReport(selected, { startDate, endDate });
      setReport(res);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900">Reports (Read-only)</h2>
        <div className="flex items-center space-x-2 text-yellow-600">
          <FiRefreshCw />
          <button onClick={fetchReports} className="font-display text-sm">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {['sales','users','nfts'].map((t) => (
          <button
            key={t}
            onClick={() => setSelected(t)}
            className={`p-4 rounded-lg border text-left ${selected===t? 'border-blue-500 bg-blue-50': 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="font-display font-medium text-gray-900 capitalize">{t}</div>
            <div className="text-xs text-gray-500 font-display">Preview latest {t} data</div>
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-3 mb-4">
        <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-display disabled:opacity-50">
          {isLoading ? 'Generating...' : 'Generate Preview'}
        </button>
        {report && (
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `${report.type}-preview.json`; a.click(); URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-display flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download Preview</span>
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
        {report ? (
          <pre className="text-xs">{JSON.stringify(report, null, 2)}</pre>
        ) : (
          <div className="text-gray-500 font-display text-sm">No report generated yet.</div>
        )}
      </div>
    </div>
  );
};

export default PartnerReports;
