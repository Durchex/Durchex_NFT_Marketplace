/**
 * PortfolioStats Component
 * Displays portfolio statistics cards
 */

import React, { useState, useEffect } from 'react';
import './PortfolioStats.css';

const PortfolioStats = ({ stats, nftCount = 0, totalValue = 0 }) => {
    const [performance, setPerformance] = useState(null);
    const [loadingPerformance, setLoadingPerformance] = useState(false);

    useEffect(() => {
        fetchPerformance();
    }, []);

    const fetchPerformance = async () => {
        try {
            setLoadingPerformance(true);
            // In a real app, this would fetch from the API
            // For now, we'll use placeholder data
            setPerformance({
                changePercent: 12.5,
                changeAmount: 2.5,
                timeframe: '7d'
            });
        } catch (error) {
            console.error('Error fetching performance:', error);
        } finally {
            setLoadingPerformance(false);
        }
    };

    const formatValue = (value) => {
        if (!value) return '0 ETH';
        return `${parseFloat(value).toFixed(2)} ETH`;
    };

    const getPerformanceColor = (change) => {
        if (!change) return 'neutral';
        return change >= 0 ? 'positive' : 'negative';
    };

    const getPerformanceIcon = (change) => {
        if (!change) return '➖';
        return change >= 0 ? '📈' : '📉';
    };

    return (
        <div className="portfolio-stats">
            <div className="stats-grid">
                {/* Total Value Card */}
                <div className="stat-card total-value">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <label>Total Value</label>
                        <div className="stat-value">{formatValue(totalValue)}</div>
                        {performance && (
                            <div className={`stat-change ${getPerformanceColor(performance.changePercent)}`}>
                                {getPerformanceIcon(performance.changePercent)} 
                                {Math.abs(performance.changePercent).toFixed(2)}% 
                                <span className="timeframe">({performance.timeframe})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* NFT Count Card */}
                <div className="stat-card nft-count">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <label>Total NFTs</label>
                        <div className="stat-value">{nftCount}</div>
                        <div className="stat-subtext">Items in collection</div>
                    </div>
                </div>

                {/* Average Value Card */}
                <div className="stat-card avg-value">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <label>Average Value</label>
                        <div className="stat-value">{formatValue(stats?.avgValue)}</div>
                        <div className="stat-subtext">Per NFT</div>
                    </div>
                </div>

                {/* Floor Price Card */}
                <div className="stat-card floor-price">
                    <div className="stat-icon">🏷️</div>
                    <div className="stat-content">
                        <label>Floor Price</label>
                        <div className="stat-value">{formatValue(stats?.floorValue)}</div>
                        <div className="stat-subtext">Lowest value NFT</div>
                    </div>
                </div>

                {/* Ceiling Price Card */}
                <div className="stat-card ceiling-price">
                    <div className="stat-icon">👑</div>
                    <div className="stat-content">
                        <label>Ceiling Price</label>
                        <div className="stat-value">{formatValue(stats?.ceilingValue)}</div>
                        <div className="stat-subtext">Highest value NFT</div>
                    </div>
                </div>

                {/* Rarity Distribution Card */}
                <div className="stat-card rarity-distribution">
                    <div className="stat-icon">✨</div>
                    <div className="stat-content">
                        <label>Rarity Breakdown</label>
                        <div className="rarity-bars">
                            {stats?.rarityDistribution && (
                                <>
                                    <div className="rarity-bar">
                                        <span className="label">Common</span>
                                        <div className="bar common">
                                            <div className="fill" style={{width: `${stats.rarityDistribution.common > 0 ? (stats.rarityDistribution.common / nftCount) * 100 : 0}%`}}></div>
                                        </div>
                                        <span className="count">{stats.rarityDistribution.common}</span>
                                    </div>
                                    <div className="rarity-bar">
                                        <span className="label">Uncommon</span>
                                        <div className="bar uncommon">
                                            <div className="fill" style={{width: `${stats.rarityDistribution.uncommon > 0 ? (stats.rarityDistribution.uncommon / nftCount) * 100 : 0}%`}}></div>
                                        </div>
                                        <span className="count">{stats.rarityDistribution.uncommon}</span>
                                    </div>
                                    <div className="rarity-bar">
                                        <span className="label">Rare</span>
                                        <div className="bar rare">
                                            <div className="fill" style={{width: `${stats.rarityDistribution.rare > 0 ? (stats.rarityDistribution.rare / nftCount) * 100 : 0}%`}}></div>
                                        </div>
                                        <span className="count">{stats.rarityDistribution.rare}</span>
                                    </div>
                                    <div className="rarity-bar">
                                        <span className="label">Epic</span>
                                        <div className="bar epic">
                                            <div className="fill" style={{width: `${stats.rarityDistribution.epic > 0 ? (stats.rarityDistribution.epic / nftCount) * 100 : 0}%`}}></div>
                                        </div>
                                        <span className="count">{stats.rarityDistribution.epic}</span>
                                    </div>
                                    <div className="rarity-bar">
                                        <span className="label">Legendary</span>
                                        <div className="bar legendary">
                                            <div className="fill" style={{width: `${stats.rarityDistribution.legendary > 0 ? (stats.rarityDistribution.legendary / nftCount) * 100 : 0}%`}}></div>
                                        </div>
                                        <span className="count">{stats.rarityDistribution.legendary}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="stats-footer">
                <p>Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    );
};

export default PortfolioStats;
