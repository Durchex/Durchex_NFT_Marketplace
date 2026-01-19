/**
 * TrendingChart Component
 * Displays trending collections and NFTs
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TrendingChart.css';

const TrendingChart = ({ limit = 10, timeframe = '7d' }) => {
    const [trendingCollections, setTrendingCollections] = useState([]);
    const [trendingNFTs, setTrendingNFTs] = useState([]);
    const [topCreators, setTopCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('collections');

    useEffect(() => {
        fetchTrendingData();
    }, [limit, timeframe]);

    const fetchTrendingData = async () => {
        try {
            setLoading(true);

            const [collectionsRes, nftsRes, creatorsRes] = await Promise.all([
                axios.get('/api/analytics/trending-collections', { params: { limit, timeframe } }),
                axios.get('/api/analytics/trending-nfts', { params: { limit, timeframe } }),
                axios.get('/api/analytics/top-creators', { params: { limit, timeframe } })
            ]);

            setTrendingCollections(collectionsRes.data.data || []);
            setTrendingNFTs(nftsRes.data.data || []);
            setTopCreators(creatorsRes.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load trending data');
            console.error('Trending data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toFixed(2);
    };

    if (loading) {
        return (
            <div className="trending-chart">
                <div className="loading-skeleton">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-item"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="trending-chart">
                <div className="error-message">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchTrendingData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="trending-chart">
            <div className="trending-header">
                <h3>Trending Now</h3>
                <span className="timeframe-badge">{timeframe}</span>
            </div>

            {/* Tabs */}
            <div className="trending-tabs">
                <button 
                    className={`tab ${activeTab === 'collections' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collections')}
                >
                    Collections ({trendingCollections.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nfts')}
                >
                    NFTs ({trendingNFTs.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'creators' ? 'active' : ''}`}
                    onClick={() => setActiveTab('creators')}
                >
                    Creators ({topCreators.length})
                </button>
            </div>

            {/* Content */}
            <div className="trending-content">
                {/* Collections Tab */}
                {activeTab === 'collections' && (
                    <div className="collections-list">
                        {trendingCollections.length > 0 ? (
                            trendingCollections.map((collection) => (
                                <div key={collection.address} className="trending-item collection-item">
                                    <div className="rank-badge">{collection.rank}</div>
                                    
                                    <div className="item-image">
                                        {collection.image ? (
                                            <img src={collection.image} alt={collection.name} />
                                        ) : (
                                            <div className="placeholder">🖼️</div>
                                        )}
                                    </div>

                                    <div className="item-info">
                                        <h4>{collection.name}</h4>
                                        <p className="address">{collection.address.slice(0, 6)}...{collection.address.slice(-4)}</p>
                                    </div>

                                    <div className="item-stats">
                                        <div className="stat">
                                            <span className="label">Volume</span>
                                            <span className="value">{formatValue(collection.volume)} ETH</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Floor</span>
                                            <span className="value">{collection.floorPrice.toFixed(4)} ETH</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Sales</span>
                                            <span className="value">{collection.sales}</span>
                                        </div>
                                    </div>

                                    <div className="change-indicator" style={{
                                        color: collection.volumeChange >= 0 ? '#2ecc71' : '#e74c3c'
                                    }}>
                                        {collection.volumeChange >= 0 ? '📈' : '📉'} {Math.abs(collection.volumeChange).toFixed(2)}%
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No trending collections</div>
                        )}
                    </div>
                )}

                {/* NFTs Tab */}
                {activeTab === 'nfts' && (
                    <div className="nfts-list">
                        {trendingNFTs.length > 0 ? (
                            trendingNFTs.map((nft) => (
                                <div key={`${nft.collection}-${nft.tokenId}`} className="trending-item nft-item">
                                    <div className="rank-badge">{nft.rank}</div>
                                    
                                    <div className="item-image">
                                        {nft.image ? (
                                            <img src={nft.image} alt={nft.name} />
                                        ) : (
                                            <div className="placeholder">🖼️</div>
                                        )}
                                    </div>

                                    <div className="item-info">
                                        <h4>{nft.name}</h4>
                                        <p className="token-id">#{nft.tokenId}</p>
                                    </div>

                                    <div className="item-stats">
                                        <div className="stat">
                                            <span className="label">Views</span>
                                            <span className="value">{formatValue(nft.views)}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Floor</span>
                                            <span className="value">{nft.floorPrice.toFixed(4)} ETH</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Volume</span>
                                            <span className="value">{formatValue(nft.volume)} ETH</span>
                                        </div>
                                    </div>

                                    <div className="change-indicator">
                                        🔥 Hot
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No trending NFTs</div>
                        )}
                    </div>
                )}

                {/* Creators Tab */}
                {activeTab === 'creators' && (
                    <div className="creators-list">
                        {topCreators.length > 0 ? (
                            topCreators.map((creator) => (
                                <div key={creator.address} className="trending-item creator-item">
                                    <div className="rank-badge">{creator.rank}</div>
                                    
                                    <div className="item-avatar">
                                        {creator.avatar ? (
                                            <img src={creator.avatar} alt={creator.username} />
                                        ) : (
                                            <div className="placeholder">👤</div>
                                        )}
                                        {creator.verified && (
                                            <div className="verified-badge">✓</div>
                                        )}
                                    </div>

                                    <div className="item-info">
                                        <h4>{creator.username}</h4>
                                        <p className="address">{creator.address.slice(0, 6)}...{creator.address.slice(-4)}</p>
                                    </div>

                                    <div className="item-stats">
                                        <div className="stat">
                                            <span className="label">Volume</span>
                                            <span className="value">{formatValue(creator.volume)} ETH</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Collections</span>
                                            <span className="value">{creator.collections}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Followers</span>
                                            <span className="value">{formatValue(creator.followers)}</span>
                                        </div>
                                    </div>

                                    <button className="follow-btn">Follow</button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No top creators</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendingChart;
