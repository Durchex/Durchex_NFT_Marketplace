/**
 * NotificationBell.jsx
 * Header notification bell with badge and dropdown
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './NotificationBell.css';

const NotificationBell = ({ onOpenCenter }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const PREVIEW_COUNT = 5;

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/notification/unread`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setUnreadCount(response.data.data.unreadCount);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    // Fetch preview notifications
    const handleBellClick = async () => {
        if (!showDropdown) {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/notification?limit=${PREVIEW_COUNT}&skip=0`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                if (response.data.success) {
                    setNotifications(response.data.data.notifications);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            } finally {
                setLoading(false);
            }
        }

        setShowDropdown(!showDropdown);
    };

    // Mark notification as read
    const handleMarkAsRead = async (e, notificationId) => {
        e.stopPropagation();

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

            fetchUnreadCount(); // Refresh count
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead({ stopPropagation: () => {} }, notification._id);
        }

        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    // Get notification icon
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

    // Get notification color
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

    // Format time
    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="notification-bell" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                className={`bell-button ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={handleBellClick}
                title="Notifications"
            >
                🔔

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="notification-dropdown">
                    {/* Header */}
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        <button
                            className="btn-expand"
                            onClick={() => {
                                setShowDropdown(false);
                                onOpenCenter();
                            }}
                            title="View all notifications"
                        >
                            →
                        </button>
                    </div>

                    {/* Content */}
                    <div className="dropdown-content">
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : notifications.length > 0 ? (
                            <>
                                {/* Items */}
                                <div className="dropdown-items">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            className={`dropdown-item ${
                                                notif.read ? 'read' : 'unread'
                                            }`}
                                            style={{
                                                borderLeftColor: getTypeColor(
                                                    notif.type
                                                ),
                                            }}
                                            onClick={() =>
                                                handleNotificationClick(notif)
                                            }
                                        >
                                            <div className="item-icon">
                                                {getTypeIcon(notif.type)}
                                            </div>

                                            <div className="item-content">
                                                <div className="item-title">
                                                    {notif.title}
                                                </div>
                                                <div className="item-message">
                                                    {notif.message.length >
                                                    50
                                                        ? `${notif.message.substring(
                                                              0,
                                                              50
                                                          )}...`
                                                        : notif.message}
                                                </div>
                                                <div className="item-time">
                                                    {formatTime(notif.createdAt)}
                                                </div>
                                            </div>

                                            {!notif.read && (
                                                <div className="unread-indicator"></div>
                                            )}

                                            <button
                                                className="btn-close-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsRead(e, notif._id);
                                                }}
                                            >
                                                ✓
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <button
                                    className="dropdown-footer"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        onOpenCenter();
                                    }}
                                >
                                    View all notifications
                                </button>
                            </>
                        ) : (
                            <div className="empty">
                                <div>📭</div>
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
