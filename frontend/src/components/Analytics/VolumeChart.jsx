/**
 * VolumeChart Component
 * Displays volume trends over time with chart visualization
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VolumeChart.css';

const VolumeChart = ({ timeframe = '7d', interval = 'daily' }) => {
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    useEffect(() => {
        fetchTrends();
    }, [timeframe, interval]);

    const fetchTrends = async () => {
        try {
            setLoading(true);
            
            const response = await axios.get('/api/analytics/volume-trends', {
                params: { timeframe, interval }
            });

            setTrends(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load volume trends');
            console.error('Trends fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMaxVolume = () => {
        if (trends.length === 0) return 0;
        return Math.max(...trends.map(t => t.volume));
    };

    const formatValue = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(2);
    };

    const getBarHeight = (volume) => {
        const maxVolume = getMaxVolume();
        if (maxVolume === 0) return 0;
        return (volume / maxVolume) * 100;
    };

    if (loading) {
        return (
            <div className="volume-chart">
                <div className="chart-skeleton"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="volume-chart">
                <div className="error-message">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchTrends}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="volume-chart">
            <div className="chart-header">
                <h3>Trading Volume Trends</h3>
                <span className="chart-timeframe">{timeframe} • {interval}</span>
            </div>

            {trends.length > 0 ? (
                <>
                    {/* Chart Legend */}
                    <div className="chart-legend">
                        <div className="legend-item">
                            <div className="legend-color volume"></div>
                            <span>Volume</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color sales"></div>
                            <span>Sales Count</span>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="chart-container">
                        <div className="y-axis-labels">
                            <span className="label">{formatValue(getMaxVolume())}</span>
                            <span className="label">{formatValue(getMaxVolume() * 0.5)}</span>
                            <span className="label">0</span>
                        </div>

                        <div className="bars-container">
                            {trends.map((trend, index) => (
                                <div 
                                    key={index} 
                                    className="bar-group"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <div className="bar-wrapper">
                                        <div 
                                            className="bar volume-bar"
                                            style={{ height: `${getBarHeight(trend.volume)}%` }}
                                        >
                                            {hoveredIndex === index && (
                                                <div className="bar-tooltip">
                                                    {trend.volume.toFixed(2)} ETH
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bar-label">
                                        {trend.timestamp}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart Statistics */}
                    <div className="chart-stats">
                        <div className="stat">
                            <label>Total Volume</label>
                            <value>
                                {formatValue(trends.reduce((sum, t) => sum + t.volume, 0))} ETH
                            </value>
                        </div>
                        <div className="stat">
                            <label>Average Volume</label>
                            <value>
                                {formatValue(trends.reduce((sum, t) => sum + t.volume, 0) / trends.length)} ETH
                            </value>
                        </div>
                        <div className="stat">
                            <label>Total Sales</label>
                            <value>
                                {trends.reduce((sum, t) => sum + t.sales, 0)}
                            </value>
                        </div>
                        <div className="stat">
                            <label>Average Price</label>
                            <value>
                                {(trends.reduce((sum, t) => sum + t.avgPrice, 0) / trends.length).toFixed(4)} ETH
                            </value>
                        </div>
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <p>No volume data available</p>
                </div>
            )}
        </div>
    );
};

export default VolumeChart;
