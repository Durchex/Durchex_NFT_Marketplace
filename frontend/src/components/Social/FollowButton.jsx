/**
 * FollowButton Component
 * Simple follow/unfollow button with state management
 */

import React, { useState, useEffect } from 'react';
import './FollowButton.css';

export default function FollowButton({ targetUserId, currentUserId, onFollowChange }) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if following on mount
    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                const response = await fetch(`/api/follow/is-following/${currentUserId}/${targetUserId}`);
                if (response.ok) {
                    const data = await response.json();
                    setIsFollowing(data.isFollowing);
                }
            } catch (err) {
                console.error('Error checking follow status:', err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId && targetUserId) {
            checkFollowStatus();
        }
    }, [currentUserId, targetUserId]);

    // Handle follow/unfollow
    const handleClick = async () => {
        try {
            setLoading(true);
            setError('');

            const method = isFollowing ? 'DELETE' : 'POST';
            const response = await fetch(`/api/follow/${targetUserId}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update follow status');
            }

            const newStatus = !isFollowing;
            setIsFollowing(newStatus);

            // Notify parent component
            if (onFollowChange) {
                onFollowChange(newStatus);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error updating follow status:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <button className="follow-btn loading" disabled>...</button>;
    }

    return (
        <button
            className={`follow-btn ${isFollowing ? 'following' : 'follow'}`}
            onClick={handleClick}
            disabled={loading}
            title={isFollowing ? 'Unfollow' : 'Follow'}
        >
            {isFollowing ? (
                <>✓ Following</>
            ) : (
                <>+ Follow</>
            )}
            {error && <span className="error-tooltip">{error}</span>}
        </button>
    );
}
