/**
 * RoyaltyStats.jsx
 * Component for displaying royalty earnings and statistics
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoyaltyStats.css';

const RoyaltyStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/royalty/user/stats`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching royalty stats:', err);
            setError('Failed to load royalty statistics');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/royalty/user/export`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    responseType: 'blob',
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'royalties.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error exporting royalties:', err);
            setError('Failed to export royalties');
        }
    };

    if (loading) {
        return (
            <div className="royalty-stats loading">
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="royalty-stats error">
                <p>{error}</p>
                <button onClick={fetchStats}>Retry</button>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="royalty-stats empty">
                <p>No royalty data available</p>
            </div>
        );
    }

    return (
        <div className="royalty-stats">
            {/* Header */}
            <div className="stats-header">
                <h2>Royalty Earnings</h2>
                <button className="btn-export" onClick={handleExport}>
                    📥 Export CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                        <div className="card-label">Total Earned</div>
                        <div className="card-value">
                            ${stats.totalEarned.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="stat-card claimed">
                    <div className="card-icon">✅</div>
                    <div className="card-content">
                        <div className="card-label">Claimed</div>
                        <div className="card-value">
                            ${stats.claimed.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="stat-card pending">
                    <div className="card-icon">⏳</div>
                    <div className="card-content">
                        <div className="card-label">Pending</div>
                        <div className="card-value">
                            ${stats.pending.toFixed(2)}
                        </div>
                    </div>
                </div>

                <div className="stat-card active">
                    <div className="card-icon">🎯</div>
                    <div className="card-content">
                        <div className="card-label">Active NFTs</div>
                        <div className="card-value">
                            {stats.activeRoyalties} / {stats.totalNFTs}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="stats-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'top' ? 'active' : ''}`}
                    onClick={() => setActiveTab('top')}
                >
                    Top Performers
                </button>
                <button
                    className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="overview-item">
                            <span>Total NFTs with Royalties:</span>
                            <strong>{stats.totalNFTs}</strong>
                        </div>
                        <div className="overview-item">
                            <span>Active Royalties:</span>
                            <strong>{stats.activeRoyalties}</strong>
                        </div>
                        <div className="overview-item">
                            <span>Earnings Rate:</span>
                            <strong>
                                {stats.activeRoyalties > 0
                                    ? (
                                        stats.totalEarned /
                                        stats.activeRoyalties
                                    ).toFixed(2)
                                    : 0}
                                {' '}per NFT
                            </strong>
                        </div>
                        <div className="overview-item highlight">
                            <span>Available to Claim:</span>
                            <strong>${stats.pending.toFixed(2)}</strong>
                        </div>

                        {stats.pending > 0 && (
                            <button className="btn btn-claim">
                                Claim Now
                            </button>
                        )}
                    </div>
                )}

                {/* Top Performers Tab */}
                {activeTab === 'top' && (
                    <div className="top-performers-tab">
                        {stats.topPerformingNFTs &&
                        stats.topPerformingNFTs.length > 0 ? (
                            <div className="nft-list">
                                {stats.topPerformingNFTs.map(
                                    (nft, index) => (
                                        <div key={nft.nftId} className="nft-item">
                                            <div className="rank">
                                                #{index + 1}
                                            </div>
                                            <div className="nft-details">
                                                <div className="nft-id">
                                                    NFT {nft.nftId}
                                                </div>
                                                <div className="nft-royalty">
                                                    {nft.percentage}% royalty
                                                </div>
                                            </div>
                                            <div className="nft-earned">
                                                ${nft.earned.toFixed(2)}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <p className="empty-state">
                                No top performers yet
                            </p>
                        )}
                    </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="details-tab">
                        <div className="detail-item">
                            <span>Royalty Range:</span>
                            <strong>0% - 50%</strong>
                        </div>
                        <div className="detail-item">
                            <span>Payment Method:</span>
                            <strong>Direct to Wallet</strong>
                        </div>
                        <div className="detail-item">
                            <span>Minimum Claim:</span>
                            <strong>$0.01</strong>
                        </div>
                        <div className="detail-item">
                            <span>Claim Frequency:</span>
                            <strong>Anytime</strong>
                        </div>
                        <div className="detail-item">
                            <span>Last Update:</span>
                            <strong>
                                {new Date().toLocaleDateString()}
                            </strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoyaltyStats;
