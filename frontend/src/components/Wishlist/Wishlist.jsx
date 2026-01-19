/**
 * Wishlist.jsx
 * Component for displaying and managing user's wishlist
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Wishlist.css';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [priceDrops, setPriceDrops] = useState([]);

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchWishlist();
        if (activeTab === 'price-drops') {
            fetchPriceDrops();
        }
    }, [page, activeTab]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * ITEMS_PER_PAGE;
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/wishlist?limit=${ITEMS_PER_PAGE}&skip=${skip}&priceChange=true`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setWishlist(response.data.data.items);
                setTotalCount(response.data.data.total);
                setHasMore(
                    page < Math.ceil(response.data.data.total / ITEMS_PER_PAGE)
                );
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            setError('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceDrops = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/wishlist/price-drops?drop=5`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setPriceDrops(response.data.data.items);
            }
        } catch (err) {
            console.error('Error fetching price drops:', err);
        }
    };

    const handleRemoveItem = async (nftId) => {
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/wishlist/remove/${nftId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setWishlist(wishlist.filter((item) => item.nftId._id !== nftId));
            setTotalCount(totalCount - 1);
        } catch (err) {
            console.error('Error removing item:', err);
            setError('Failed to remove item');
        }
    };

    const handleClearWishlist = async () => {
        if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
            try {
                await axios.delete(
                    `${process.env.REACT_APP_API_URL}/wishlist/clear`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                setWishlist([]);
                setTotalCount(0);
            } catch (err) {
                console.error('Error clearing wishlist:', err);
                setError('Failed to clear wishlist');
            }
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/wishlist/export`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'wishlist.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error exporting wishlist:', err);
            setError('Failed to export wishlist');
        }
    };

    if (error && !loading) {
        return (
            <div className="wishlist error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="wishlist">
            {/* Header */}
            <div className="wishlist-header">
                <h1>My Wishlist</h1>
                <div className="header-stats">
                    <div className="stat">
                        <span className="stat-label">Total Items</span>
                        <span className="stat-value">{totalCount}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Price Drops</span>
                        <span className="stat-value">{priceDrops.length}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="wishlist-tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('all');
                        setPage(1);
                    }}
                >
                    All Items ({totalCount})
                </button>
                <button
                    className={`tab ${activeTab === 'price-drops' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('price-drops');
                    }}
                >
                    Price Drops ({priceDrops.length})
                </button>
            </div>

            {/* Actions */}
            <div className="wishlist-actions">
                <button className="btn btn-export" onClick={handleExport}>
                    📥 Export CSV
                </button>
                <button
                    className="btn btn-clear"
                    onClick={handleClearWishlist}
                    disabled={totalCount === 0}
                >
                    🗑️ Clear All
                </button>
            </div>

            {/* Content */}
            {loading && activeTab === 'all' ? (
                <div className="loading">
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                </div>
            ) : activeTab === 'all' ? (
                <>
                    {wishlist.length > 0 ? (
                        <>
                            <div className="wishlist-grid">
                                {wishlist.map((item) => (
                                    <div
                                        key={item.nftId._id}
                                        className="wishlist-card"
                                    >
                                        {/* Image */}
                                        <div className="card-image">
                                            <img
                                                src={item.nftId.imageUrl}
                                                alt={item.nftId.name}
                                            />
                                            {item.priceChange &&
                                                item.priceChange.percentChange < 0 && (
                                                    <div className="price-badge down">
                                                        ↓{Math.abs(
                                                            item.priceChange.percentChange
                                                        ).toFixed(1)}
                                                        %
                                                    </div>
                                                )}
                                        </div>

                                        {/* Content */}
                                        <div className="card-content">
                                            <h3 className="card-title">
                                                {item.nftId.name}
                                            </h3>

                                            <div className="card-collection">
                                                {item.nftId.collection}
                                            </div>

                                            {/* Price Info */}
                                            <div className="card-price">
                                                <div className="price-item">
                                                    <span className="label">
                                                        Current
                                                    </span>
                                                    <span className="value">
                                                        ${item.nftId.currentPrice}
                                                    </span>
                                                </div>

                                                {item.priceChange && (
                                                    <div className="price-item">
                                                        <span className="label">
                                                            Change
                                                        </span>
                                                        <span
                                                            className={`value ${
                                                                item.priceChange
                                                                    .percentChange < 0
                                                                    ? 'down'
                                                                    : 'up'
                                                            }`}
                                                        >
                                                            {item.priceChange.percentChange > 0
                                                                ? '+'
                                                                : ''}
                                                            {item.priceChange.percentChange.toFixed(
                                                                2
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Added Date */}
                                            <div className="card-date">
                                                Added{' '}
                                                {new Date(
                                                    item.addedAt
                                                ).toLocaleDateString()}
                                            </div>

                                            {/* Actions */}
                                            <div className="card-actions">
                                                <button className="btn btn-view">
                                                    View NFT
                                                </button>
                                                <button
                                                    className="btn btn-remove"
                                                    onClick={() =>
                                                        handleRemoveItem(
                                                            item.nftId._id
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {(page > 1 || hasMore) && (
                                <div className="pagination">
                                    <button
                                        onClick={() =>
                                            setPage(Math.max(1, page - 1))
                                        }
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="page-indicator">
                                        Page {page} of{' '}
                                        {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                                    </span>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={!hasMore}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">💌</div>
                            <h2>Your wishlist is empty</h2>
                            <p>Add NFTs to your wishlist to track them here</p>
                            <button className="btn btn-browse">
                                Browse NFTs
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {priceDrops.length > 0 ? (
                        <div className="price-drops-grid">
                            {priceDrops.map((item) => (
                                <div
                                    key={item.nftId._id}
                                    className="price-drop-card"
                                >
                                    <div className="drop-badge">
                                        Price Drop!
                                    </div>
                                    <div className="card-image">
                                        <img
                                            src={item.nft.imageUrl}
                                            alt={item.nft.name}
                                        />
                                    </div>
                                    <div className="card-content">
                                        <h3>{item.nft.name}</h3>
                                        <div className="price-comparison">
                                            <div className="old-price">
                                                Was: $
                                                {item.priceChange.previousPrice}
                                            </div>
                                            <div className="new-price">
                                                Now: ${item.nft.currentPrice}
                                            </div>
                                            <div className="savings">
                                                Save{' '}
                                                {Math.abs(
                                                    item.priceChange.percentChange
                                                ).toFixed(1)}
                                                %
                                            </div>
                                        </div>
                                        <button className="btn btn-buy">
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📉</div>
                            <h2>No price drops</h2>
                            <p>Your wishlist items haven't dropped in price</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Wishlist;
