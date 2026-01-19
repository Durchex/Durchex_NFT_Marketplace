/**
 * BatchMintPreview Component
 * Display preview and progress of batch mint operations
 */

import React, { useState, useEffect } from 'react';
import './BatchMintPreview.css';

export default function BatchMintPreview({ batchId, onPublish }) {
    const [batch, setbatch] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [publishMode, setPublishMode] = useState(false);
    const [prices, setPrices] = useState({});

    // Polling interval
    const POLL_INTERVAL = 2000; // 2 seconds

    // Fetch batch details and stats
    useEffect(() => {
        const fetchBatchData = async () => {
            try {
                setLoading(true);

                const [batchRes, statsRes] = await Promise.all([
                    fetch(`/api/batch-mint/${batchId}`),
                    fetch(`/api/batch-mint/${batchId}/stats`)
                ]);

                if (!batchRes.ok || !statsRes.ok) throw new Error('Failed to fetch batch');

                const batchData = await batchRes.json();
                const statsData = await statsRes.json();

                setbatch(batchData);
                setStats(statsData);
                setError('');
            } catch (err) {
                setError(err.message);
                console.error('Error fetching batch:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBatchData();

        // Poll for updates
        const interval = setInterval(fetchBatchData, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [batchId]);

    // Handle publish
    const handlePublish = async () => {
        try {
            const listings = batch.nfts
                .filter(nft => nft.status === 'minted')
                .map(nft => ({
                    nftId: nft._id,
                    price: prices[nft._id] || 0
                }));

            if (listings.length === 0) {
                setError('No NFTs available to publish');
                return;
            }

            const response = await fetch(`/api/batch-mint/${batchId}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ listings })
            });

            if (!response.ok) throw new Error('Failed to publish');

            const result = await response.json();
            if (onPublish) {
                onPublish(result);
            }

            setPublishMode(false);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="batch-mint-preview loading">
                <div className="skeleton"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="batch-mint-preview error">
                <p>{error}</p>
            </div>
        );
    }

    if (!batch || !stats) {
        return (
            <div className="batch-mint-preview error">
                <p>Batch not found</p>
            </div>
        );
    }

    const progressPercentage = parseFloat(stats.progress);
    const statusColor = {
        'completed': '#2ecc71',
        'processing': '#3498db',
        'failed': '#e74c3c',
        'cancelled': '#95a5a6',
        'creating': '#f39c12'
    }[batch.status] || '#999';

    return (
        <div className="batch-mint-preview">
            <div className="preview-header">
                <div className="header-title">
                    <h2>Batch Mint #{batchId}</h2>
                    <span className={`status-badge ${batch.status}`}>{batch.status.toUpperCase()}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="preview-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nfts')}
                >
                    NFTs ({stats.mintedCount})
                </button>
                <button
                    className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('errors')}
                    disabled={stats.errors.length === 0}
                >
                    Errors ({stats.errors.length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="tab-content overview-tab">
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total NFTs</div>
                            <div className="stat-value">{stats.totalCount}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Minted</div>
                            <div className="stat-value" style={{ color: '#2ecc71' }}>
                                {stats.mintedCount}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Failed</div>
                            <div className="stat-value" style={{ color: stats.failedCount > 0 ? '#e74c3c' : '#999' }}>
                                {stats.failedCount}
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Published</div>
                            <div className="stat-value" style={{ color: '#667eea' }}>
                                {stats.publishedCount || 0}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-section">
                        <div className="progress-header">
                            <span>Minting Progress</span>
                            <span className="progress-percentage">{progressPercentage}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progressPercentage}%`, backgroundColor: statusColor }}></div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="timeline-section">
                        <div className="timeline-item">
                            <span className="timeline-label">Created</span>
                            <span className="timeline-time">{new Date(stats.createdAt).toLocaleString()}</span>
                        </div>
                        {stats.completedAt && (
                            <div className="timeline-item">
                                <span className="timeline-label">Completed</span>
                                <span className="timeline-time">{new Date(stats.completedAt).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {batch.status === 'completed' && stats.mintedCount > 0 && (
                        <div className="actions-section">
                            {!publishMode ? (
                                <button className="publish-btn" onClick={() => setPublishMode(true)}>
                                    📤 Publish to Marketplace
                                </button>
                            ) : (
                                <button className="publish-btn active" onClick={() => setPublishMode(false)}>
                                    ✕ Cancel Publishing
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
                <div className="tab-content nfts-tab">
                    <div className="nfts-list">
                        {batch.nfts.map((nft, idx) => (
                            <div key={idx} className={`nft-entry ${nft.status}`}>
                                <div className="nft-index">#{idx + 1}</div>

                                <div className="nft-details">
                                    <h4>{nft.name}</h4>
                                    <p>{nft.description.substring(0, 60)}...</p>
                                </div>

                                <div className="nft-status">
                                    <span className={`status-badge ${nft.status}`}>
                                        {nft.status === 'minted' ? '✓ Minted' : nft.status}
                                    </span>
                                </div>

                                {publishMode && nft.status === 'minted' && (
                                    <div className="nft-price-input">
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            min="0"
                                            step="0.1"
                                            onChange={(e) => setPrices({
                                                ...prices,
                                                [nft._id]: parseFloat(e.target.value) || 0
                                            })}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {publishMode && (
                        <div className="publish-actions">
                            <button className="cancel-btn" onClick={() => setPublishMode(false)}>
                                Cancel
                            </button>
                            <button className="confirm-btn" onClick={handlePublish}>
                                Publish All
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Errors Tab */}
            {activeTab === 'errors' && (
                <div className="tab-content errors-tab">
                    {stats.errors.length === 0 ? (
                        <p className="empty">No errors</p>
                    ) : (
                        <div className="errors-list">
                            {stats.errors.map((err, idx) => (
                                <div key={idx} className="error-item">
                                    <span className="error-index">#{err.index + 1}</span>
                                    <span className="error-message">{err.error}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
