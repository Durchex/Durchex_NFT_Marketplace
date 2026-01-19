/**
 * ActivityHistory Component
 * Displays user transaction and activity history
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityHistory.css';

const ActivityHistory = ({ userAddress, isOwnProfile = false }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activityType, setActivityType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchActivities();
    }, [userAddress, activityType]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const endpoint = isOwnProfile 
                ? '/api/portfolio/user/me/activity'
                : `/api/portfolio/${userAddress}/activity`;
            
            const params = { offset: 0, limit: 100 };
            if (activityType !== 'all') {
                params.type = activityType;
            }

            const response = await axios.get(endpoint, { params });
            setActivities(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load activity history');
            console.error('Activity fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        switch(type) {
            case 'mint': return '✨';
            case 'transfer': return '↔️';
            case 'sale': return '💵';
            case 'offer': return '💬';
            case 'bid': return '🏆';
            case 'auction': return '⏰';
            default: return '📝';
        }
    };

    const getActivityLabel = (type) => {
        const labels = {
            mint: 'Minted',
            transfer: 'Transferred',
            sale: 'Sold',
            offer: 'Offer Made',
            bid: 'Bid Placed',
            auction: 'Auction'
        };
        return labels[type] || type;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const getPaginatedActivities = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return activities.slice(startIndex, startIndex + itemsPerPage);
    };

    const getTotalPages = () => Math.ceil(activities.length / itemsPerPage);

    if (loading) {
        return (
            <div className="activity-history">
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
            <div className="activity-history">
                <div className="error-message">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchActivities}>Retry</button>
                </div>
            </div>
        );
    }

    const paginatedActivities = getPaginatedActivities();
    const totalPages = getTotalPages();

    return (
        <div className="activity-history">
            {/* Filter Bar */}
            <div className="activity-filters">
                <div className="filter-control">
                    <label>Activity Type:</label>
                    <select value={activityType} onChange={(e) => {
                        setActivityType(e.target.value);
                        setCurrentPage(1);
                    }}>
                        <option value="all">All Activities</option>
                        <option value="mint">Mints</option>
                        <option value="transfer">Transfers</option>
                        <option value="sale">Sales</option>
                        <option value="offer">Offers</option>
                        <option value="bid">Bids</option>
                        <option value="auction">Auctions</option>
                    </select>
                </div>

                <div className="results-count">
                    {activities.length} total {activityType !== 'all' ? activityType + ' ' : ''}activities
                </div>
            </div>

            {/* Activity List */}
            {activities.length > 0 ? (
                <>
                    <div className="activity-list">
                        {paginatedActivities.map((activity) => (
                            <div key={activity.id} className={`activity-item activity-${activity.type}`}>
                                <div className="activity-icon">
                                    {getActivityIcon(activity.type)}
                                </div>

                                <div className="activity-details">
                                    <div className="activity-header">
                                        <h4 className="activity-title">
                                            {getActivityLabel(activity.type)}
                                            {activity.nftName && ` - ${activity.nftName}`}
                                        </h4>
                                        <span className="activity-time">
                                            {formatTime(activity.timestamp)}
                                        </span>
                                    </div>

                                    <div className="activity-meta">
                                        {activity.fromAddress && (
                                            <span className="meta-item">
                                                From: <code>{activity.fromAddress.slice(0, 6)}...{activity.fromAddress.slice(-4)}</code>
                                            </span>
                                        )}
                                        {activity.toAddress && (
                                            <span className="meta-item">
                                                To: <code>{activity.toAddress.slice(0, 6)}...{activity.toAddress.slice(-4)}</code>
                                            </span>
                                        )}
                                    </div>

                                    {activity.value && (
                                        <div className="activity-value">
                                            <span className="value-amount">
                                                {activity.value.toFixed(4)} {activity.currency}
                                            </span>
                                            <span className={`status-badge ${activity.status}`}>
                                                {activity.status}
                                            </span>
                                        </div>
                                    )}

                                    <div className="activity-footer">
                                        <span className="transaction-date">
                                            {formatDate(activity.timestamp)}
                                        </span>
                                        {activity.transactionHash && (
                                            <a 
                                                href={`https://etherscan.io/tx/${activity.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="tx-link"
                                            >
                                                View TX ↗
                                            </a>
                                        )}
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
                    <p>No activity found</p>
                </div>
            )}
        </div>
    );
};

export default ActivityHistory;
