import React, { useState, useEffect } from 'react';
import './AdminPanel.css';
import UserManagement from './UserManagement';
import DisputePanel from './DisputePanel';
import PlatformStats from './PlatformStats';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading admin panel...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔐 Admin Dashboard</h1>
        <p>Platform management and moderation center</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`tab-button ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveTab('disputes')}
        >
          ⚖️ Disputes
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && stats && (
          <PlatformStats stats={stats} onRefresh={fetchStats} />
        )}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'disputes' && <DisputePanel />}
        {activeTab === 'settings' && <PlatformSettings />}
      </div>
    </div>
  );
};

// Platform Settings Component
const PlatformSettings = () => {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async (updatedSettings) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      const data = await response.json();
      setSettings(data.settings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div>Loading settings...</div>;

  return (
    <div className="settings-panel">
      <div className="settings-group">
        <h3>Platform Configuration</h3>

        <div className="settings-item">
          <label>Platform Fee (%)</label>
          <input
            type="number"
            min="0"
            max="50"
            defaultValue={settings.platformFee || 2.5}
            onChange={(e) =>
              setSettings({ ...settings, platformFee: parseFloat(e.target.value) })
            }
          />
        </div>

        <div className="settings-item">
          <label>Min Royalty (%)</label>
          <input
            type="number"
            min="0"
            max="30"
            defaultValue={settings.minRoyalty || 0}
            onChange={(e) =>
              setSettings({ ...settings, minRoyalty: parseFloat(e.target.value) })
            }
          />
        </div>

        <div className="settings-item">
          <label>Max Royalty (%)</label>
          <input
            type="number"
            min="0"
            max="50"
            defaultValue={settings.maxRoyalty || 50}
            onChange={(e) =>
              setSettings({ ...settings, maxRoyalty: parseFloat(e.target.value) })
            }
          />
        </div>

        <div className="settings-item">
          <label>
            <input
              type="checkbox"
              defaultChecked={settings.maintenanceMode || false}
              onChange={(e) =>
                setSettings({ ...settings, maintenanceMode: e.target.checked })
              }
            />
            Maintenance Mode
          </label>
        </div>

        <button
          className="save-button"
          onClick={() => handleSave(settings)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
