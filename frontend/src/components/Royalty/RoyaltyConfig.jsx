/**
 * RoyaltyConfig.jsx
 * Component for configuring royalties on NFTs
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoyaltyConfig.css';

const RoyaltyConfig = ({ nftId, creatorId, onSave }) => {
    const [percentage, setPercentage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [royalty, setRoyalty] = useState(null);

    // Fetch current royalty on mount
    useEffect(() => {
        fetchRoyalty();
    }, [nftId]);

    const fetchRoyalty = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/royalty/${nftId}`
            );

            if (response.data.success && response.data.data) {
                setRoyalty(response.data.data);
                setPercentage(response.data.data.percentage || 0);
            }
        } catch (err) {
            console.error('Error fetching royalty:', err);
            // Not an error if royalty doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    const handlePercentageChange = (e) => {
        const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 50);
        setPercentage(value);
    };

    const handleSliderChange = (e) => {
        setPercentage(parseInt(e.target.value));
    };

    const handleSave = async () => {
        try {
            setError('');
            setSuccess('');
            setLoading(true);

            if (percentage < 0 || percentage > 50) {
                setError('Royalty percentage must be between 0 and 50');
                return;
            }

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/royalty/set`,
                {
                    nftId,
                    percentage,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setRoyalty(response.data.data);
                setSuccess('Royalty percentage saved successfully!');

                if (onSave) {
                    onSave(response.data.data);
                }

                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Error saving royalty:', err);
            setError(
                err.response?.data?.message ||
                    'Failed to save royalty percentage'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="royalty-config">
            <div className="config-header">
                <h3>Royalty Configuration</h3>
                <p className="subtitle">
                    Earn a percentage from every resale of this NFT
                </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="config-form">
                {/* Percentage Input */}
                <div className="form-group">
                    <label htmlFor="percentage-input">Royalty Percentage</label>
                    <div className="input-group">
                        <input
                            id="percentage-input"
                            type="number"
                            min="0"
                            max="50"
                            value={percentage}
                            onChange={handlePercentageChange}
                            disabled={loading}
                            className="percentage-input"
                        />
                        <span className="percentage-symbol">%</span>
                    </div>
                </div>

                {/* Slider */}
                <div className="form-group">
                    <div className="slider-labels">
                        <span>0%</span>
                        <span>50%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={percentage}
                        onChange={handleSliderChange}
                        disabled={loading}
                        className="royalty-slider"
                    />
                </div>

                {/* Info Cards */}
                <div className="info-cards">
                    <div className="info-card">
                        <div className="card-label">Sale Price</div>
                        <div className="card-value">$100</div>
                    </div>

                    <div className="info-card">
                        <div className="card-label">Your Royalty</div>
                        <div className="card-value primary">
                            ${(100 * percentage) / 100}
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="card-label">Platform Fee</div>
                        <div className="card-value">$2.50</div>
                    </div>
                </div>

                {/* Guidelines */}
                <div className="guidelines">
                    <h4>Royalty Guidelines</h4>
                    <ul>
                        <li>
                            <strong>0-10%:</strong> Recommended for common NFTs
                        </li>
                        <li>
                            <strong>10-25%:</strong> Good for medium-rarity
                            collections
                        </li>
                        <li>
                            <strong>25-50%:</strong> For high-value or rare
                            pieces
                        </li>
                    </ul>
                </div>

                {/* Current Royalty Info */}
                {royalty && (
                    <div className="royalty-info">
                        <div className="info-item">
                            <span>Total Earned:</span>
                            <strong>${royalty.totalEarned.toFixed(2)}</strong>
                        </div>
                        <div className="info-item">
                            <span>Claimed:</span>
                            <strong>${royalty.claimed.toFixed(2)}</strong>
                        </div>
                        <div className="info-item">
                            <span>Pending:</span>
                            <strong>
                                ${(royalty.totalEarned - royalty.claimed).toFixed(2)}
                            </strong>
                        </div>
                        <div className="info-item status">
                            <span>Status:</span>
                            <strong className={royalty.active ? 'active' : 'inactive'}>
                                {royalty.active ? '🟢 Active' : '🔴 Inactive'}
                            </strong>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Royalty'}
                    </button>

                    <button className="btn btn-secondary" disabled={loading}>
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoyaltyConfig;
