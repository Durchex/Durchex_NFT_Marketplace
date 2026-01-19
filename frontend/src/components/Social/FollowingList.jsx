/**
 * FollowingList Component
 * Display list of users that user is following
 */

import React, { useState, useEffect } from 'react';
import './FollowingList.css';

export default function FollowingList({ userId, currentUserId }) {
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const ITEMS_PER_PAGE = 20;

    // Fetch following list
    useEffect(() => {
        const fetchFollowing = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/follow/following/${userId}?limit=${ITEMS_PER_PAGE}&skip=${page * ITEMS_PER_PAGE}`
                );

                if (!response.ok) throw new Error('Failed to fetch following');

                const data = await response.json();
                setFollowing(data.following);
                setTotalCount(data.count);
                setHasMore((page + 1) * ITEMS_PER_PAGE < data.count);
                setError('');
            } catch (err) {
                setError(err.message);
                console.error('Error fetching following:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchFollowing();
        }
    }, [userId, page]);

    // Handle pagination
    const handleNextPage = () => {
        if (hasMore) setPage(page + 1);
    };

    const handlePrevPage = () => {
        if (page > 0) setPage(page - 1);
    };

    // Handle unfollow
    const handleUnfollow = async (followeeId) => {
        try {
            const response = await fetch(`/api/follow/${followeeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to unfollow');

            // Remove from list
            setFollowing(following.filter(f => f.followeeId._id !== followeeId));
            setTotalCount(totalCount - 1);
        } catch (err) {
            console.error('Error unfollowing:', err);
        }
    };

    if (loading && following.length === 0) {
        return (
            <div className="following-list loading">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="following-skeleton"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="following-list error">
                <p>Failed to load following: {error}</p>
            </div>
        );
    }

    if (following.length === 0) {
        return (
            <div className="following-list empty">
                <p>Not following anyone yet</p>
            </div>
        );
    }

    return (
        <div className="following-list">
            <div className="following-header">
                <h3>Following ({totalCount})</h3>
                <span className="page-info">
                    {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                </span>
            </div>

            <div className="following-grid">
                {following.map((follow) => {
                    const followee = follow.followeeId;
                    return (
                        <div key={followee._id} className="following-item">
                            <div className="following-avatar">
                                {followee.avatar ? (
                                    <img src={followee.avatar} alt={followee.username} />
                                ) : (
                                    <div className="placeholder">👤</div>
                                )}
                            </div>

                            <div className="following-info">
                                <div className="following-header-row">
                                    <h4>{followee.username}</h4>
                                    {followee.isVerified && (
                                        <span className="verified-badge" title="Verified">✓</span>
                                    )}
                                </div>

                                <p className="following-count">
                                    {followee.followerCount} followers
                                </p>
                            </div>

                            <div className="following-action">
                                {userId === currentUserId && (
                                    <button
                                        className="unfollow-btn"
                                        onClick={() => handleUnfollow(followee._id)}
                                        title="Unfollow"
                                    >
                                        Following ✓
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            <div className="following-pagination">
                <button
                    className="prev-btn"
                    onClick={handlePrevPage}
                    disabled={page === 0}
                >
                    ← Previous
                </button>

                <span className="page-indicator">{page + 1}</span>

                <button
                    className="next-btn"
                    onClick={handleNextPage}
                    disabled={!hasMore}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
