/**
 * RecommendationCard.jsx
 * Recommendation card component with CTA
 */

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './RecommendationCard.css';

const RecommendationCard = ({ nft, recommendation, onAddToCollection }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAddToCollection = async () => {
        try {
            setIsAdding(true);

            // Record interaction
            await axios.post(
                `${process.env.REACT_APP_API_URL}/recommendations/interact`,
                {
                    nftId: nft._id,
                    type: 'wishlist',
                    metadata: { source: 'recommendation' },
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            // Call parent callback
            if (onAddToCollection) {
                onAddToCollection(nft._id);
            }

            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (err) {
            console.error('Error adding to collection:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const recordView = async () => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/recommendations/interact`,
                {
                    nftId: nft._id,
                    type: 'view',
                    metadata: { source: 'recommendation' },
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
        } catch (err) {
            console.error('Error recording view:', err);
        }
    };

    const handleCardClick = () => {
        recordView();
    };

    const formatPrice = (price) => {
        if (price >= 1000) return (price / 1000).toFixed(1) + 'K';
        if (price >= 1000000) return (price / 1000000).toFixed(1) + 'M';
        return price.toFixed(2);
    };

    return (
        <div
            className="recommendation-card"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Image Container */}
            <Link
                to={`/nft/${nft._id}`}
                className="card-image-wrapper"
                onClick={handleCardClick}
            >
                <img
                    src={nft.imageUrl || '/placeholder-nft.png'}
                    alt={nft.name}
                    className="card-image"
                />

                {/* Recommendation Badge */}
                {recommendation && (
                    <div className="recommendation-badge">
                        ⭐ Recommended
                    </div>
                )}

                {/* Rarity Badge */}
                {nft.rarity && (
                    <div className={`rarity-badge ${nft.rarity.toLowerCase()}`}>
                        {nft.rarity}
                    </div>
                )}

                {/* Overlay */}
                {isHovering && (
                    <div className="card-overlay">
                        <button
                            className={`btn-cta ${added ? 'success' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                handleAddToCollection();
                            }}
                            disabled={isAdding || added}
                        >
                            {added ? '✓ Added' : isAdding ? 'Adding...' : '+ Collection'}
                        </button>

                        <a
                            href={`/nft/${nft._id}`}
                            className="btn-view"
                            onClick={handleCardClick}
                        >
                            View →
                        </a>
                    </div>
                )}

                {/* Status Badge */}
                {nft.isAuction && (
                    <div className="status-badge auction">🔨 Auction</div>
                )}
                {nft.isOffer && (
                    <div className="status-badge offer">🤝 Offer</div>
                )}
            </Link>

            {/* Card Content */}
            <div className="card-content">
                {/* Creator Info */}
                <div className="creator-info">
                    {nft.creator?.avatar && (
                        <img src={nft.creator.avatar} alt={nft.creator.username} />
                    )}
                    <Link
                        to={`/creator/${nft.creator?._id}`}
                        className="creator-link"
                    >
                        {nft.creator?.username || 'Unknown'}
                    </Link>
                </div>

                {/* NFT Name */}
                <Link to={`/nft/${nft._id}`} className="nft-name">
                    {nft.name}
                </Link>

                {/* Collection */}
                {nft.collectionId && (
                    <Link to={`/collection/${nft.collectionId._id}`} className="collection-name">
                        {nft.collectionId.name}
                    </Link>
                )}

                {/* Stats Row */}
                <div className="card-stats">
                    <div className="stat">
                        <span className="label">Views</span>
                        <span className="value">{nft.views || 0}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Favorites</span>
                        <span className="value">{nft.favorites || 0}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Offers</span>
                        <span className="value">{nft.offerCount || 0}</span>
                    </div>
                </div>

                {/* Price Info */}
                <div className="price-section">
                    <div className="current-price">
                        <span className="label">Price</span>
                        <span className="amount">
                            {nft.price} ETH
                        </span>
                    </div>

                    {nft.floorPrice && (
                        <div className="floor-price">
                            <span className="label">Floor</span>
                            <span className="amount">
                                {nft.floorPrice} ETH
                            </span>
                        </div>
                    )}
                </div>

                {/* Why Recommended */}
                {recommendation && (
                    <div className="reason">
                        {recommendation.reason && (
                            <p>💡 {recommendation.reason}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationCard;
