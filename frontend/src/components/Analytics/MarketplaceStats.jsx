/**
 * MarketplaceStats Component
 * Displays key marketplace statistics and KPIs
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MarketplaceStats.css';

const MarketplaceStats = ({ timeframe = '24h' }) => {
    const [stats, setStats] = useState(null);
    const [sentiment, setSentiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [timeframe]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            
            const [statsRes, sentimentRes] = await Promise.all([
                axios.get('/api/analytics/marketplace-stats', { params: { timeframe } }),
                axios.get('/api/analytics/market-sentiment', { params: { timeframe } })
            ]);

            setStats(statsRes.data.data);
            setSentiment(sentimentRes.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to load marketplace statistics');
            console.error('Stats fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch(sentiment) {
            case 'bullish': return '#2ecc71';
            case 'bearish': return '#e74c3c';
            default: return '#f39c12';
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch(sentiment) {
            case 'bullish': return '📈';
            case 'bearish': return '📉';
            default: return '➡️';
        }
    };

    const formatValue = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
        return value.toFixed(2);
    };

    if (loading) {
        return (
            <div className="marketplace-stats">
                <div className="stats-grid loading">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="stat-card-skeleton"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="marketplace-stats">
                <div className="error-message">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchStats}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="marketplace-stats">
            <div className="stats-header">
                <h2>Marketplace Statistics</h2>
                <span className="timeframe-badge">{timeframe}</span>
            </div>

            <div className="stats-grid">
                {/* Total Volume */}
                <div className="stat-card volume">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <label>Total Volume</label>
                        <div className="stat-value">
                            {formatValue(stats?.totalVolume || 0)} ETH
                        </div>
                        <div className="stat-change positive">
                            +12.5% vs last period
                        </div>
                    </div>
                </div>

                {/* Total Sales */}
                <div className="stat-card sales">
                    <div className="stat-icon">🛍️</div>
                    <div className="stat-info">
                        <label>Total Sales</label>
                        <div className="stat-value">
                            {formatValue(stats?.totalSales || 0)}
                        </div>
                        <div className="stat-change positive">
                            +8.2% vs last period
                        </div>
                    </div>
                </div>

                {/* Average Price */}
                <div className="stat-card avg-price">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <label>Average Price</label>
                        <div className="stat-value">
                            {(stats?.averagePrice || 0).toFixed(4)} ETH
                        </div>
                        <div className="stat-change neutral">
                            ±0.3% vs last period
                        </div>
                    </div>
                </div>

                {/* Floor Price */}
                <div className="stat-card floor-price">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-info">
                        <label>Floor Price</label>
                        <div className="stat-value">
                            {(stats?.floorPrice || 0).toFixed(4)} ETH
                        </div>
                        <div className="stat-change positive">
                            +2.1% vs last period
                        </div>
                    </div>
                </div>

                {/* Unique Traders */}
                <div className="stat-card traders">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <label>Unique Traders</label>
                        <div className="stat-value">
                            {formatValue(stats?.uniqueTraders || 0)}
                        </div>
                        <div className="stat-change positive">
                            +15.7% vs last period
                        </div>
                    </div>
                </div>

                {/* New Collections */}
                <div className="stat-card collections">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <label>New Collections</label>
                        <div className="stat-value">
                            {stats?.newCollections || 0}
                        </div>
                        <div className="stat-change positive">
                            +5 collections
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Sentiment Section */}
            {sentiment && (
                <div className="sentiment-section">
                    <div className="sentiment-header">
                        <h3>Market Sentiment</h3>
                    </div>
                    
                    <div className="sentiment-card" style={{ borderLeftColor: getSentimentColor(sentiment.sentiment) }}>
                        <div className="sentiment-icon" style={{ color: getSentimentColor(sentiment.sentiment) }}>
                            {getSentimentIcon(sentiment.sentiment)}
                        </div>
                        
                        <div className="sentiment-info">
                            <div className="sentiment-label">
                                {sentiment.sentiment.charAt(0).toUpperCase() + sentiment.sentiment.slice(1)}
                            </div>
                            
                            <div className="sentiment-details">
                                <span className="sentiment-detail">
                                    Volume: <strong className={sentiment.volumeChange >= 0 ? 'positive' : 'negative'}>
                                        {sentiment.volumeChange >= 0 ? '+' : ''}{sentiment.volumeChange.toFixed(2)}%
                                    </strong>
                                </span>
                                <span className="sentiment-detail">
                                    Sales: <strong className={sentiment.salesChange >= 0 ? 'positive' : 'negative'}>
                                        {sentiment.salesChange >= 0 ? '+' : ''}{sentiment.salesChange.toFixed(2)}%
                                    </strong>
                                </span>
                                <span className="sentiment-detail">
                                    Score: <strong>{sentiment.score.toFixed(2)}</strong>
                                </span>
                            </div>
                        </div>
                        
                        <div className="sentiment-meter">
                            <div className="meter-fill" style={{
                                width: `${Math.max(0, Math.min(100, sentiment.score + 50))}%`,
                                backgroundColor: getSentimentColor(sentiment.sentiment)
                            }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gas Statistics */}
            {stats?.gasStats && (
                <div className="gas-section">
                    <div className="gas-header">
                        <h3>Gas Statistics</h3>
                    </div>
                    
                    <div className="gas-grid">
                        <div className="gas-card">
                            <label>Average Gas Price</label>
                            <div className="gas-value">
                                {stats.gasStats.averageGasPrice.toFixed(2)} gwei
                            </div>
                        </div>
                        <div className="gas-card">
                            <label>Highest Gas Price</label>
                            <div className="gas-value">
                                {stats.gasStats.highestGasPrice.toFixed(2)} gwei
                            </div>
                        </div>
                        <div className="gas-card">
                            <label>Lowest Gas Price</label>
                            <div className="gas-value">
                                {stats.gasStats.lowestGasPrice.toFixed(2)} gwei
                            </div>
                        </div>
                        <div className="gas-card">
                            <label>Total Gas Cost</label>
                            <div className="gas-value">
                                {stats.gasStats.estimatedTotalGasCost.toFixed(2)} ETH
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refresh Button */}
            <div className="refresh-section">
                <button className="refresh-btn" onClick={fetchStats}>
                    🔄 Refresh
                </button>
                <span className="last-updated">
                    Last updated: {new Date().toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
};

export default MarketplaceStats;
