/**
 * NotificationCenter.jsx
 * Component for displaying notification center
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [filterType, setFilterType] = useState('all');
    const [stats, setStats] = useState(null);

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchStats();
        }
    }, [page, filterType, isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * ITEMS_PER_PAGE;
            const type = filterType === 'all' ? null : filterType;

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/notification?limit=${ITEMS_PER_PAGE}&skip=${skip}${
                    type ? `&type=${type}` : ''
                }`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                if (page === 1) {
                    setNotifications(response.data.data.notifications);
                } else {
                    setNotifications((prev) => [
                        ...prev,
                        ...response.data.data.notifications,
                    ]);
                }

                setTotalCount(response.data.data.total);
                setHasMore(
                    page <
                        Math.ceil(
                            response.data.data.total / ITEMS_PER_PAGE
                        )
                );
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/notification/stats`,
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
            console.error('Error fetching stats:', err);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/notification/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setNotifications(
                notifications.map((n) =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );

            fetchStats(); // Refresh stats
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/notification/read-all`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setNotifications(
                notifications.map((n) => ({ ...n, read: true }))
            );

            fetchStats(); // Refresh stats
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/notification/${notificationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setNotifications(
                notifications.filter((n) => n._id !== notificationId)
            );

            fetchStats(); // Refresh stats
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Clear all notifications?')) {
            try {
                await axios.delete(
                    `${process.env.REACT_APP_API_URL}/notification/clear-all`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                setNotifications([]);
                fetchStats(); // Refresh stats
            } catch (err) {
                console.error('Error clearing notifications:', err);
            }
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            bid: '🏷️',
            sale: '💰',
            offer: '🤝',
            follow: '👥',
            comment: '💬',
            listing: '📦',
        };
        return icons[type] || '📢';
    };

    const getTypeColor = (type) => {
        const colors = {
            bid: '#3498db',
            sale: '#2ecc71',
            offer: '#f39c12',
            follow: '#e74c3c',
            comment: '#9b59b6',
            listing: '#1abc9c',
        };
        return colors[type] || '#667eea';
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="notification-backdrop" onClick={onClose}></div>

            {/* Panel */}
            <div className="notification-panel">
                {/* Header */}
                <div className="panel-header">
                    <h2>Notifications</h2>
                    <button className="btn-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="notification-stats">
                        <div className="stat">
                            <span className="label">Total</span>
                            <span className="value">{stats.total}</span>
                        </div>
                        <div className="stat unread">
                            <span className="label">Unread</span>
                            <span className="value">{stats.unread}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Read</span>
                            <span className="value">{stats.read}</span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="notification-filters">
                    <button
                        className={`filter ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType('all');
                            setPage(1);
                        }}
                    >
                        All
                    </button>
                    <button
                        className={`filter ${filterType === 'bid' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType('bid');
                            setPage(1);
                        }}
                    >
                        Bids
                    </button>
                    <button
                        className={`filter ${filterType === 'sale' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType('sale');
                            setPage(1);
                        }}
                    >
                        Sales
                    </button>
                    <button
                        className={`filter ${filterType === 'offer' ? 'active' : ''}`}
                        onClick={() => {
                            setFilterType('offer');
                            setPage(1);
                        }}
                    >
                        Offers
                    </button>
                </div>

                {/* Notifications List */}
                <div className="notifications-list">
                    {error && <div className="error-message">{error}</div>}

                    {notifications.length > 0 ? (
                        <>
                            {/* Actions */}
                            <div className="list-actions">
                                <button
                                    className="btn-action"
                                    onClick={handleMarkAllAsRead}
                                    disabled={!notifications.some((n) => !n.read)}
                                >
                                    Mark all read
                                </button>
                                <button
                                    className="btn-action danger"
                                    onClick={handleClearAll}
                                >
                                    Clear all
                                </button>
                            </div>

                            {/* Items */}
                            {notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    className={`notification-item ${
                                        notif.read ? 'read' : 'unread'
                                    }`}
                                    style={{
                                        borderLeftColor: getTypeColor(
                                            notif.type
                                        ),
                                    }}
                                >
                                    <div className="item-icon">
                                        {getTypeIcon(notif.type)}
                                    </div>

                                    <div className="item-content">
                                        <div className="item-title">
                                            {notif.title}
                                        </div>
                                        <div className="item-message">
                                            {notif.message}
                                        </div>
                                        <div className="item-time">
                                            {new Date(
                                                notif.createdAt
                                            ).toLocaleDateString()}{' '}
                                            {new Date(
                                                notif.createdAt
                                            ).toLocaleTimeString()}
                                        </div>
                                    </div>

                                    <div className="item-actions">
                                        {!notif.read && (
                                            <button
                                                className="btn-read"
                                                onClick={() =>
                                                    handleMarkAsRead(notif._id)
                                                }
                                                title="Mark as read"
                                            >
                                                ✓
                                            </button>
                                        )}

                                        {notif.actionUrl && (
                                            <a
                                                href={notif.actionUrl}
                                                className="btn-action-link"
                                            >
                                                →
                                            </a>
                                        )}

                                        <button
                                            className="btn-delete"
                                            onClick={() =>
                                                handleDelete(notif._id)
                                            }
                                            title="Delete"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Load More */}
                            {hasMore && (
                                <button
                                    className="btn-load-more"
                                    onClick={() => setPage(page + 1)}
                                    disabled={loading}
                                >
                                    {loading
                                        ? 'Loading...'
                                        : 'Load More Notifications'}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p>No notifications</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationCenter;
