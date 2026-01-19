/**
 * ProfileView Component
 * Display user profile information
 */

import React, { useState, useEffect } from 'react';
import './ProfileView.css';

export default function ProfileView({ userId, onEdit, currentUser }) {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('nfts');
    const [isFollowing, setIsFollowing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch profile and stats
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/profile/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch profile');
                const data = await response.json();
                setProfile(data);

                const statsResponse = await fetch(`/api/profile/${userId}/stats`);
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    // Format wallet address
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    // Format large numbers
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Format currency
    const formatCurrency = (num) => {
        return `◊${num.toFixed(2)}`;
    };

    // Copy address to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="profile-view loading">
                <div className="skeleton-banner"></div>
                <div className="skeleton-avatar"></div>
                <div className="skeleton-text"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="profile-view error">
                <p>Profile not found</p>
            </div>
        );
    }

    const isOwnProfile = currentUser?.id === profile._id;

    return (
        <div className="profile-view">
            {/* Banner */}
            <div className="profile-banner">
                {profile.bannerImage && (
                    <img src={profile.bannerImage} alt="Banner" />
                )}
                <div className="banner-overlay"></div>
            </div>

            {/* Header */}
            <div className="profile-header">
                <div className="header-content">
                    {/* Avatar */}
                    <div className="avatar-section">
                        <div className="avatar">
                            {profile.avatar && (
                                <img src={profile.avatar} alt={profile.username} />
                            )}
                            {!profile.avatar && (
                                <div className="placeholder">👤</div>
                            )}
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="profile-info">
                        <div className="username-row">
                            <h1>
                                {profile.username}
                                {profile.isVerified && (
                                    <span className="verified-badge" title="Verified">✓</span>
                                )}
                            </h1>
                            {isOwnProfile && (
                                <button className="edit-btn" onClick={onEdit}>
                                    Edit Profile
                                </button>
                            )}
                            {!isOwnProfile && (
                                <button className="follow-btn" onClick={() => setIsFollowing(!isFollowing)}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>

                        {/* Address */}
                        <div className="address-section">
                            <code className="address">{formatAddress(profile.walletAddress)}</code>
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(profile.walletAddress)}
                                title="Copy address"
                            >
                                {copied ? '✓ Copied' : '📋'}
                            </button>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="bio">{profile.bio}</p>
                        )}

                        {/* Social Links */}
                        <div className="social-links">
                            {profile.website && (
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link">
                                    🌐 Website
                                </a>
                            )}
                            {profile.twitter && (
                                <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="social-link">
                                    𝕏 Twitter
                                </a>
                            )}
                            {profile.discord && (
                                <span className="social-link">💬 Discord: {profile.discord}</span>
                            )}
                            {profile.instagram && (
                                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="social-link">
                                    📷 Instagram
                                </a>
                            )}
                            {profile.telegram && (
                                <a href={`https://t.me/${profile.telegram}`} target="_blank" rel="noopener noreferrer" className="social-link">
                                    ✈️ Telegram
                                </a>
                            )}
                        </div>

                        {/* Member Since */}
                        <div className="member-since">
                            📅 Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-value">{formatNumber(stats.followers)}</div>
                        <div className="stat-label">Followers</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{formatNumber(stats.following)}</div>
                        <div className="stat-label">Following</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{formatNumber(stats.items)}</div>
                        <div className="stat-label">Items Created</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{formatNumber(stats.collections)}</div>
                        <div className="stat-label">Collections</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{formatNumber(stats.sales)}</div>
                        <div className="stat-label">Sales</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{formatCurrency(stats.totalVolume)}</div>
                        <div className="stat-label">Total Volume</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`tab ${activeTab === 'nfts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nfts')}
                >
                    NFTs Created
                </button>
                <button
                    className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    Activity
                </button>
                <button
                    className={`tab ${activeTab === 'collections' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collections')}
                >
                    Collections
                </button>
            </div>

            {/* Tab Content */}
            <div className="profile-content">
                {activeTab === 'nfts' && (
                    <div className="nfts-tab">
                        <p className="empty-state">NFTs created by this user will appear here</p>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="activity-tab">
                        <p className="empty-state">Activity feed will appear here</p>
                    </div>
                )}

                {activeTab === 'collections' && (
                    <div className="collections-tab">
                        <p className="empty-state">Collections created by this user will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
