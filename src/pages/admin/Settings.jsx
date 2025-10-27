import React, { useState } from 'react';
import { FiSave, FiRefreshCw, FiShield, FiGlobe, FiMail, FiBell, FiDatabase, FiKey, FiUsers, FiImage, FiDollarSign, FiActivity } from 'react-icons/fi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Durchex NFT Marketplace',
      siteDescription: 'The premier destination for NFT trading and discovery',
      siteUrl: 'https://durchex.com',
      adminEmail: 'admin@durchex.com',
      timezone: 'UTC',
      language: 'en',
      maintenanceMode: false
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      ipWhitelist: false,
      requireEmailVerification: true,
      passwordMinLength: 8,
      enableAuditLog: true
    },
    notifications: {
      emailNotifications: true,
      adminAlerts: true,
      userRegistration: true,
      newListings: true,
      salesNotifications: true,
      systemAlerts: true,
      weeklyReports: true
    },
    marketplace: {
      tradingFee: 2.5,
      listingFee: 0.1,
      premiumListingFee: 0.5,
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'],
      autoApproveListings: false,
      requireKYC: false,
      enableBidding: true
    },
    blockchain: {
      network: 'ethereum',
      rpcUrl: 'https://ethereum-sepolia.core.chainstack.com/390cec07d0dbe1818b3bb25db398c3ca',
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      gasLimit: 500000,
      gasPrice: 20,
      enableTestnet: true
    },
    api: {
      enableApi: true,
      apiKey: 'sk_live_1234567890abcdef',
      rateLimit: 1000,
      allowedOrigins: ['https://durchex.com', 'https://www.durchex.com'],
      enableWebhooks: true,
      webhookUrl: 'https://durchex.com/api/webhooks'
    }
  });

  const tabs = [
    { id: 'general', name: 'General', icon: FiGlobe },
    { id: 'security', name: 'Security', icon: FiShield },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'marketplace', name: 'Marketplace', icon: FiDollarSign },
    { id: 'blockchain', name: 'Blockchain', icon: FiKey },
    { id: 'api', name: 'API', icon: FiActivity }
  ];

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // In real app, this would save to backend
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Site Name
          </label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Site URL
          </label>
          <input
            type="url"
            value={settings.general.siteUrl}
            onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Site Description
        </label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Admin Email
          </label>
          <input
            type="email"
            value={settings.general.adminEmail}
            onChange={(e) => handleSettingChange('general', 'adminEmail', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
            <option value="GMT">GMT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="maintenanceMode"
          checked={settings.general.maintenanceMode}
          onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="maintenanceMode" className="text-sm font-display font-medium text-gray-700">
          Enable Maintenance Mode
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={settings.security.sessionTimeout}
            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={settings.security.maxLoginAttempts}
            onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Password Minimum Length
        </label>
        <input
          type="number"
          value={settings.security.passwordMinLength}
          onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
        />
      </div>
      <div className="space-y-4">
        {Object.entries(settings.security).filter(([key]) => typeof settings.security[key] === 'boolean').map(([key, value]) => (
          <div key={key} className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={key}
              checked={value}
              onChange={(e) => handleSettingChange('security', key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={key} className="text-sm font-display font-medium text-gray-700">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {Object.entries(settings.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-display font-medium text-gray-900">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
            <div className="text-xs font-display text-gray-500">
              {key === 'emailNotifications' && 'Send email notifications to users'}
              {key === 'adminAlerts' && 'Send alerts to admin users'}
              {key === 'userRegistration' && 'Notify when new users register'}
              {key === 'newListings' && 'Notify when new NFTs are listed'}
              {key === 'salesNotifications' && 'Notify when sales are completed'}
              {key === 'systemAlerts' && 'Send system-wide alerts'}
              {key === 'weeklyReports' && 'Send weekly summary reports'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );

  const renderMarketplaceSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Trading Fee (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={settings.marketplace.tradingFee}
            onChange={(e) => handleSettingChange('marketplace', 'tradingFee', parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Listing Fee (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.marketplace.listingFee}
            onChange={(e) => handleSettingChange('marketplace', 'listingFee', parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Premium Listing Fee (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.marketplace.premiumListingFee}
            onChange={(e) => handleSettingChange('marketplace', 'premiumListingFee', parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Max File Size (MB)
          </label>
          <input
            type="number"
            value={settings.marketplace.maxFileSize}
            onChange={(e) => handleSettingChange('marketplace', 'maxFileSize', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Allowed File Types
          </label>
          <input
            type="text"
            value={settings.marketplace.allowedFileTypes.join(', ')}
            onChange={(e) => handleSettingChange('marketplace', 'allowedFileTypes', e.target.value.split(', '))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(settings.marketplace).filter(([key]) => typeof settings.marketplace[key] === 'boolean').map(([key, value]) => (
          <div key={key} className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={key}
              checked={value}
              onChange={(e) => handleSettingChange('marketplace', key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={key} className="text-sm font-display font-medium text-gray-700">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBlockchainSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Network
          </label>
          <select
            value={settings.blockchain.network}
            onChange={(e) => handleSettingChange('blockchain', 'network', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="bsc">BSC</option>
            <option value="arbitrum">Arbitrum</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Gas Limit
          </label>
          <input
            type="number"
            value={settings.blockchain.gasLimit}
            onChange={(e) => handleSettingChange('blockchain', 'gasLimit', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          RPC URL
        </label>
        <input
          type="url"
          value={settings.blockchain.rpcUrl}
          onChange={(e) => handleSettingChange('blockchain', 'rpcUrl', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
        />
      </div>
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Contract Address
        </label>
        <input
          type="text"
          value={settings.blockchain.contractAddress}
          onChange={(e) => handleSettingChange('blockchain', 'contractAddress', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display font-mono"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Gas Price (Gwei)
          </label>
          <input
            type="number"
            value={settings.blockchain.gasPrice}
            onChange={(e) => handleSettingChange('blockchain', 'gasPrice', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div className="flex items-center space-x-3 pt-8">
          <input
            type="checkbox"
            id="enableTestnet"
            checked={settings.blockchain.enableTestnet}
            onChange={(e) => handleSettingChange('blockchain', 'enableTestnet', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="enableTestnet" className="text-sm font-display font-medium text-gray-700">
            Enable Testnet
          </label>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            Rate Limit (requests/hour)
          </label>
          <input
            type="number"
            value={settings.api.rateLimit}
            onChange={(e) => handleSettingChange('api', 'rateLimit', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
          />
        </div>
        <div>
          <label className="block text-sm font-display font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="text"
            value={settings.api.apiKey}
            onChange={(e) => handleSettingChange('api', 'apiKey', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display font-mono"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Allowed Origins
        </label>
        <textarea
          value={settings.api.allowedOrigins.join('\n')}
          onChange={(e) => handleSettingChange('api', 'allowedOrigins', e.target.value.split('\n'))}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
        />
      </div>
      <div>
        <label className="block text-sm font-display font-medium text-gray-700 mb-2">
          Webhook URL
        </label>
        <input
          type="url"
          value={settings.api.webhookUrl}
          onChange={(e) => handleSettingChange('api', 'webhookUrl', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-display"
        />
      </div>
      <div className="space-y-4">
        {Object.entries(settings.api).filter(([key]) => typeof settings.api[key] === 'boolean').map(([key, value]) => (
          <div key={key} className="flex items-center space-x-3">
            <input
              type="checkbox"
              id={key}
              checked={value}
              onChange={(e) => handleSettingChange('api', key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={key} className="text-sm font-display font-medium text-gray-700">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'marketplace':
        return renderMarketplaceSettings();
      case 'blockchain':
        return renderBlockchainSettings();
      case 'api':
        return renderApiSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 font-display">Configure your marketplace settings and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-display"
          >
            {isSaving ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-display font-semibold text-gray-900">Settings</h3>
            </div>
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors font-display text-sm ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-display font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.name} Settings
              </h2>
              <p className="text-sm font-display text-gray-600 mt-1">
                {activeTab === 'general' && 'Configure general site settings and preferences'}
                {activeTab === 'security' && 'Manage security settings and authentication'}
                {activeTab === 'notifications' && 'Configure notification preferences'}
                {activeTab === 'marketplace' && 'Set marketplace fees and policies'}
                {activeTab === 'blockchain' && 'Configure blockchain network settings'}
                {activeTab === 'api' && 'Manage API settings and integrations'}
              </p>
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
