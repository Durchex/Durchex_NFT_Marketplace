/**
 * PortfolioView Component
 * Main portfolio display component showing owned NFTs, stats, and activity
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PortfolioView.css';
import PortfolioStats from './PortfolioStats';
import ActivityHistory from './ActivityHistory';

const PortfolioView = ({ userAddress, isOwnProfile = false }) => {
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('nfts');
    const [nfts, setNfts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [sortBy, setSortBy] = useState('recent');
    const [filterRarity, setFilterRarity] = useState('all');

    useEffect(() => {
        fetchPortfolio();
    }, [userAddress]);

    useEffect(() => {
        if (portfolio?.ownedNFTs) {
            filterAndSortNFTs();
        }
    }, [portfolio, sortBy, filterRarity]);

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            const endpoint = isOwnProfile 
                ? '/api/portfolio/user/me'
                : `/api/portfolio/${userAddress}`;
            
            const response = await axios.get(endpoint);
            setPortfolio(response.data.data);
            setNfts(response.data.data.ownedNFTs || []);
            setError(null);
        } catch (err) {
            setError('Failed to load portfolio');
            console.error('Portfolio fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortNFTs = () => {
        let filtered = [...portfolio.ownedNFTs];

        // Apply rarity filter
        if (filterRarity !== 'all') {
            filtered = filtered.filter(nft => {
                const rarity = nft.rarity || 0;
                switch(filterRarity) {
                    case 'common': return rarity < 50;
                    case 'uncommon': return rarity >= 50 && rarity < 150;
                    case 'rare': return rarity >= 150 && rarity < 300;
                    case 'epic': return rarity >= 300 && rarity < 600;
                    case 'legendary': return rarity >= 600;
                    default: return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'value-high':
                    return (b.estimatedValue || 0) - (a.estimatedValue || 0);
                case 'value-low':
                    return (a.estimatedValue || 0) - (b.estimatedValue || 0);
                case 'rarity':
                    return (b.rarity || 0) - (a.rarity || 0);
                case 'recent':
                default:
                    return new Date(b.acquiredAt) - new Date(a.acquiredAt);
            }
        });

        setNfts(filtered);
        setCurrentPage(1);
    };

    const getPaginatedNFTs = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return nfts.slice(startIndex, startIndex + itemsPerPage);
    };

    const getTotalPages = () => Math.ceil(nfts.length / itemsPerPage);

    const getRarityColor = (rarity) => {
        if (rarity < 50) return 'common';
        if (rarity < 150) return 'uncommon';
        if (rarity < 300) return 'rare';
        if (rarity < 600) return 'epic';
        return 'legendary';
    };

    const getRarityLabel = (rarity) => {
        const color = getRarityColor(rarity);
        return color.charAt(0).toUpperCase() + color.slice(1);
    };

    if (loading) {
        return (
            <div className="portfolio-view">
                <div className="loading-skeleton">
                    <div className="skeleton-header"></div>
                    <div className="skeleton-content"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="portfolio-view">
                <div className="error-message">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchPortfolio}>Retry</button>
                </div>
            </div>
        );
    }

    const paginatedNFTs = getPaginatedNFTs();
    const totalPages = getTotalPages();

    return (
        <div className="portfolio-view">
            {/* Header */}
            <div className="portfolio-header">
                <div className="header-content">
                    <h1>Portfolio</h1>
                    <p className="wallet-address">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
                </div>
                <button className="refresh-btn" onClick={fetchPortfolio}>
                    🔄 Refresh
                </button>
            </div>

            {/* Stats Overview */}
            {portfolio && (
                <PortfolioStats 
                    stats={portfolio.stats}
                    nftCount={portfolio.nftCount}
                    totalValue={portfolio.totalValue}
                />
            )}

            {/* Tabs */}
            <div className="portfolio-tabs">
                <button 
                    className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nfts')}
                >
                    📦 NFTs ({portfolio?.nftCount || 0})
                </button>
                <button 
                    className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    📊 Activity
                </button>
            </div>

            {/* Content */}
            <div className="portfolio-content">
                {activeTab === 'nfts' && (
                    <div className="nfts-section">
                        {/* Filters and Sort */}
                        <div className="controls-bar">
                            <div className="sort-control">
                                <label>Sort by:</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="recent">Recently Acquired</option>
                                    <option value="value-high">Value: High to Low</option>
                                    <option value="value-low">Value: Low to High</option>
                                    <option value="rarity">Rarity Score</option>
                                </select>
                            </div>

                            <div className="filter-control">
                                <label>Rarity:</label>
                                <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}>
                                    <option value="all">All Rarities</option>
                                    <option value="common">Common</option>
                                    <option value="uncommon">Uncommon</option>
                                    <option value="rare">Rare</option>
                                    <option value="epic">Epic</option>
                                    <option value="legendary">Legendary</option>
                                </select>
                            </div>

                            <div className="results-count">
                                Showing {paginatedNFTs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, nfts.length)} of {nfts.length}
                            </div>
                        </div>

                        {/* NFT Grid */}
                        {nfts.length > 0 ? (
                            <>
                                <div className="nft-grid">
                                    {paginatedNFTs.map((nft) => (
                                        <div key={`${nft.contractAddress}-${nft.tokenId}`} className="nft-card">
                                            <div className="nft-image-container">
                                                <img 
                                                    src={nft.imageURI} 
                                                    alt={nft.name}
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/250?text=NFT'}
                                                />
                                                <div className={`rarity-badge ${getRarityColor(nft.rarity)}`}>
                                                    {getRarityLabel(nft.rarity)}
                                                </div>
                                            </div>

                                            <div className="nft-info">
                                                <h3 className="nft-name">{nft.name}</h3>
                                                <p className="nft-token-id">#{nft.tokenId}</p>
                                                
                                                {nft.estimatedValue > 0 && (
                                                    <div className="nft-value">
                                                        <span className="label">Value:</span>
                                                        <span className="amount">{nft.estimatedValue.toFixed(2)} ETH</span>
                                                    </div>
                                                )}

                                                {nft.attributes && nft.attributes.length > 0 && (
                                                    <div className="nft-attributes">
                                                        {nft.attributes.slice(0, 2).map((attr, idx) => (
                                                            <span key={idx} className="attribute-tag">
                                                                {attr.trait_type}: {attr.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="nft-actions">
                                                    <button className="btn btn-small btn-primary">View</button>
                                                    <button className="btn btn-small btn-secondary">Sell</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button 
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            ← Previous
                                        </button>

                                        <div className="pagination-info">
                                            Page {currentPage} of {totalPages}
                                        </div>

                                        <button 
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>No NFTs in portfolio</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <ActivityHistory userAddress={userAddress} isOwnProfile={isOwnProfile} />
                )}
            </div>
        </div>
    );
};

export default PortfolioView;
