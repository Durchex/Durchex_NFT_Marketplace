/**
 * FollowersList Component
 * Display list of followers with follow/unfollow actions
 */

import React, { useState, useEffect } from 'react';
import './FollowersList.css';
import FollowButton from './FollowButton';

export default function FollowersList({ userId, currentUserId }) {
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const ITEMS_PER_PAGE = 20;

    // Fetch followers
    useEffect(() => {
        const fetchFollowers = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/follow/followers/${userId}?limit=${ITEMS_PER_PAGE}&skip=${page * ITEMS_PER_PAGE}`
                );

                if (!response.ok) throw new Error('Failed to fetch followers');

                const data = await response.json();
                setFollowers(data.followers);
                setTotalCount(data.count);
                setHasMore((page + 1) * ITEMS_PER_PAGE < data.count);
                setError('');
            } catch (err) {
                setError(err.message);
                console.error('Error fetching followers:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchFollowers();
        }
    }, [userId, page]);

    // Handle pagination
    const handleNextPage = () => {
        if (hasMore) setPage(page + 1);
    };

    const handlePrevPage = () => {
        if (page > 0) setPage(page - 1);
    };

    if (loading && followers.length === 0) {
        return (
            <div className="followers-list loading">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="follower-skeleton"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="followers-list error">
                <p>Failed to load followers: {error}</p>
            </div>
        );
    }

    if (followers.length === 0) {
        return (
            <div className="followers-list empty">
                <p>No followers yet</p>
            </div>
        );
    }

    return (
        <div className="followers-list">
            <div className="followers-header">
                <h3>Followers ({totalCount})</h3>
                <span className="page-info">
                    {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                </span>
            </div>

            <div className="followers-grid">
                {followers.map((follow) => {
                    const follower = follow.followerId;
                    return (
                        <div key={follower._id} className="follower-item">
                            <div className="follower-avatar">
                                {follower.avatar ? (
                                    <img src={follower.avatar} alt={follower.username} />
                                ) : (
                                    <div className="placeholder">👤</div>
                                )}
                            </div>

                            <div className="follower-info">
                                <div className="follower-header-row">
                                    <h4>{follower.username}</h4>
                                    {follower.isVerified && (
                                        <span className="verified-badge" title="Verified">✓</span>
                                    )}
                                </div>

                                <p className="follower-count">
                                    {follower.followerCount} followers
                                </p>
                            </div>

                            <div className="follower-action">
                                {follower._id !== currentUserId && (
                                    <FollowButton
                                        targetUserId={follower._id}
                                        currentUserId={currentUserId}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            <div className="followers-pagination">
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
