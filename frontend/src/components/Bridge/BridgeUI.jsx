// BridgeUI - Cross-Chain NFT Bridge Component
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BridgeUI.css';

const BridgeUI = ({ userAddress, userNFTs }) => {
  const [sourceChain, setSourceChain] = useState('ethereum');
  const [destinationChain, setDestinationChain] = useState('polygon');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState(userAddress);
  const [loading, setLoading] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('bridge');
  const [chainStats, setChainStats] = useState(null);
  const [supportedChains, setSupportedChains] = useState([]);
  const [bridgeError, setBridgeError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    loadSupportedChains();
    if (activeTab === 'history') {
      loadTransferHistory();
    }
    if (activeTab === 'stats') {
      loadChainStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedNFT) {
      estimateCost();
    }
  }, [sourceChain, destinationChain, selectedNFT]);

  /**
   * Load supported chains
   */
  const loadSupportedChains = async () => {
    try {
      const response = await axios.get(`${API_BASE}/bridge/supported-chains`);
      setSupportedChains(response.data);
    } catch (error) {
      console.error('Failed to load supported chains:', error);
    }
  };

  /**
   * Estimate transfer cost
   */
  const estimateCost = async () => {
    if (!selectedNFT) return;

    try {
      const response = await axios.post(`${API_BASE}/bridge/estimate-cost`, {
        sourceChain,
        destinationChain,
        tokenType: selectedNFT.type,
        quantity: selectedNFT.amount || 1
      });
      setEstimatedCost(response.data);
    } catch (error) {
      console.error('Failed to estimate cost:', error);
    }
  };

  /**
   * Initiate bridge transfer
   */
  const handleBridgeTransfer = async () => {
    if (!selectedNFT || sourceChain === destinationChain) {
      setBridgeError('Please select valid chains and NFT');
      return;
    }

    setBridgeError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/bridge/initiate`, {
        userAddress,
        sourceChain,
        destinationChain,
        nftAddress: selectedNFT.address,
        tokenId: selectedNFT.tokenId,
        amount: selectedNFT.amount || 1,
        tokenType: selectedNFT.type,
        recipientAddress: recipientAddress || userAddress,
        bridgeAddress: process.env.REACT_APP_BRIDGE_ADDRESS
      });

      setSuccessMessage(`Transfer initiated! Transaction: ${response.data.transactionHash}`);
      setSelectedNFT(null);
      setRecipientAddress(userAddress);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      setBridgeError(error.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load transfer history
   */
  const loadTransferHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/bridge/history/${userAddress}`);
      setTransferHistory(response.data);
    } catch (error) {
      console.error('Failed to load transfer history:', error);
    }
  };

  /**
   * Load chain statistics
   */
  const loadChainStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/bridge/stats`);
      setChainStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  /**
   * Get chain color
   */
  const getChainColor = (chain) => {
    const colors = {
      ethereum: '#627EEA',
      polygon: '#8247E5',
      arbitrum: '#28A0F0'
    };
    return colors[chain] || '#999';
  };

  return (
    <div className="bridge-ui">
      <div className="bridge-header">
        <h1>🌉 Cross-Chain Bridge</h1>
        <p>Transfer your NFTs seamlessly across Ethereum, Polygon, and Arbitrum</p>
      </div>

      {/* Tabs */}
      <div className="bridge-tabs">
        <button
          className={`tab-btn ${activeTab === 'bridge' ? 'active' : ''}`}
          onClick={() => setActiveTab('bridge')}
        >
          Bridge NFT
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Transfer History
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {/* Messages */}
      {bridgeError && (
        <div className="alert alert-error">
          <span>❌ {bridgeError}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {/* Bridge Tab */}
      {activeTab === 'bridge' && (
        <div className="bridge-content">
          <div className="bridge-card">
            {/* Chain Selector */}
            <div className="chain-selector">
              <div className="chain-section">
                <label>From:</label>
                <select value={sourceChain} onChange={(e) => setSourceChain(e.target.value)}>
                  {supportedChains.map((chain) => (
                    <option key={chain.name} value={chain.name}>
                      {chain.icon} {chain.name.charAt(0).toUpperCase() + chain.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="chain-arrow">⇄</div>

              <div className="chain-section">
                <label>To:</label>
                <select value={destinationChain} onChange={(e) => setDestinationChain(e.target.value)}>
                  {supportedChains.map((chain) => (
                    <option key={chain.name} value={chain.name}>
                      {chain.icon} {chain.name.charAt(0).toUpperCase() + chain.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* NFT Selection */}
            <div className="form-section">
              <label className="form-label">Select NFT to Bridge:</label>
              <div className="nft-grid">
                {userNFTs?.map((nft, idx) => (
                  <div
                    key={idx}
                    className={`nft-card ${selectedNFT?.tokenId === nft.tokenId ? 'selected' : ''}`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    <img src={nft.image} alt={nft.name} />
                    <h4>{nft.name}</h4>
                    <p className="nft-collection">{nft.collection}</p>
                    <p className="nft-type">{nft.type}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient Address */}
            <div className="form-section">
              <label className="form-label">Recipient Address:</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="form-input"
              />
              <small>Leave empty to send to your address</small>
            </div>

            {/* Cost Estimation */}
            {estimatedCost && (
              <div className="cost-estimation">
                <h3>Estimated Cost</h3>
                <div className="cost-row">
                  <span>Route Fee:</span>
                  <strong>${estimatedCost.routeEstimate}</strong>
                </div>
                <div className="cost-row">
                  <span>Platform Fee:</span>
                  <strong>${estimatedCost.platformFee}</strong>
                </div>
                <div className="cost-row total">
                  <span>Total:</span>
                  <strong>${estimatedCost.totalEstimate}</strong>
                </div>
                <small>Estimated delivery: {estimatedCost.estimatedTime}</small>
              </div>
            )}

            {/* Bridge Button */}
            <button
              className="bridge-btn"
              onClick={handleBridgeTransfer}
              disabled={loading || !selectedNFT || sourceChain === destinationChain}
            >
              {loading ? 'Processing...' : `Bridge NFT → ${destinationChain}`}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-content">
          {transferHistory.length === 0 ? (
            <div className="empty-state">
              <p>No transfers yet</p>
            </div>
          ) : (
            <div className="history-list">
              {transferHistory.map((transfer, idx) => (
                <div key={idx} className="history-item">
                  <div className="transfer-header">
                    <div className="transfer-route">
                      <span style={{ color: getChainColor(transfer.sourceChain) }}>
                        {transfer.sourceChain}
                      </span>
                      <span>→</span>
                      <span style={{ color: getChainColor(transfer.destinationChain) }}>
                        {transfer.destinationChain}
                      </span>
                    </div>
                    <span className={`status status-${transfer.status}`}>
                      {transfer.status}
                    </span>
                  </div>

                  <div className="transfer-details">
                    <p>
                      <strong>NFT:</strong> {transfer.tokenAddress.slice(0, 6)}...
                      {transfer.tokenAddress.slice(-4)}
                    </p>
                    <p>
                      <strong>Type:</strong> {transfer.tokenType}
                    </p>
                    <p>
                      <strong>Date:</strong>{' '}
                      {new Date(transfer.timestamp).toLocaleDateString()}
                    </p>
                    {transfer.transactionHash && (
                      <p>
                        <strong>Hash:</strong> {transfer.transactionHash.slice(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-content">
          {chainStats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Transfers</span>
                <span className="stat-value">{chainStats.totalTransfers}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Volume</span>
                <span className="stat-value">{chainStats.totalVolume} NFTs</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Platform Fee</span>
                <span className="stat-value">{chainStats.platformFee}%</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Status</span>
                <span className={`stat-value ${!chainStats.isPaused ? 'active' : 'paused'}`}>
                  {chainStats.isPaused ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
          ) : (
            <div className="loading">Loading statistics...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default BridgeUI;
