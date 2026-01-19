/**
 * SavedFilters.jsx
 * Component for managing saved filter presets
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FilterPanel.css';

const SavedFilters = ({ onFilterSelect, onClose }) => {
    const [savedFilters, setSavedFilters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateNew, setShowCreateNew] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterDescription, setFilterDescription] = useState('');
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [showShare, setShowShare] = useState(false);
    const [shareCode, setShareCode] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        fetchSavedFilters();
    }, []);

    const fetchSavedFilters = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/advanced-filters/saved`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setSavedFilters(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching saved filters:', err);
            setError('Failed to load saved filters');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFilter = (filter) => {
        setSelectedFilter(filter._id);
        onFilterSelect(filter.filters);
    };

    const handleDeleteFilter = async (filterId) => {
        if (window.confirm('Delete this filter?')) {
            try {
                await axios.delete(
                    `${process.env.REACT_APP_API_URL}/advanced-filters/saved/${filterId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                setSavedFilters(
                    savedFilters.filter((f) => f._id !== filterId)
                );
                if (selectedFilter === filterId) {
                    setSelectedFilter(null);
                }
            } catch (err) {
                console.error('Error deleting filter:', err);
                setError('Failed to delete filter');
            }
        }
    };

    const handleShareFilter = async (filterId) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/advanced-filters/share/${filterId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.success) {
                setShareCode(response.data.data.shareCode);
                setShowShare(true);
            }
        } catch (err) {
            console.error('Error sharing filter:', err);
            setError('Failed to share filter');
        }
    };

    const handleCopyShareCode = () => {
        navigator.clipboard.writeText(shareCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleDuplicateFilter = async (filter) => {
        setFilterName(`${filter.name} (copy)`);
        setFilterDescription(filter.description);
        setShowCreateNew(true);
    };

    const getFilterPreviewText = (filters) => {
        const parts = [];
        if (filters.search) parts.push(`"${filters.search}"`);
        if (filters.priceMin || filters.priceMax) {
            parts.push(`${filters.priceMin || '0'} - ${filters.priceMax || '∞'} ETH`);
        }
        if (filters.rarity?.length > 0) parts.push(`Rarity: ${filters.rarity.join(', ')}`);
        if (filters.status?.length > 0) parts.push(`Status: ${filters.status.join(', ')}`);

        return parts.slice(0, 2).join(' • ') || 'No active filters';
    };

    if (loading) {
        return <div className="saved-filters loading">Loading saved filters...</div>;
    }

    return (
        <div className="saved-filters">
            {/* Header */}
            <div className="filter-header">
                <h3>Saved Filters</h3>
                <button className="btn-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Create New Button */}
            <button
                className="btn-create-filter"
                onClick={() => {
                    setShowCreateNew(true);
                    setFilterName('');
                    setFilterDescription('');
                }}
            >
                + Create New Filter
            </button>

            {/* Saved Filters List */}
            {savedFilters.length > 0 ? (
                <div className="filters-grid">
                    {savedFilters.map((filter) => (
                        <div
                            key={filter._id}
                            className={`filter-card ${selectedFilter === filter._id ? 'selected' : ''}`}
                            style={{ borderTopColor: filter.color }}
                        >
                            {/* Header */}
                            <div className="card-header">
                                <div className="filter-title-area">
                                    <h4>{filter.name}</h4>
                                    {filter.description && (
                                        <p className="filter-description">
                                            {filter.description}
                                        </p>
                                    )}
                                </div>

                                <div className="color-indicator" style={{ backgroundColor: filter.color }}></div>
                            </div>

                            {/* Preview */}
                            <div className="filter-preview">
                                {getFilterPreviewText(filter.filters)}
                            </div>

                            {/* Metadata */}
                            <div className="filter-meta">
                                {filter.importedFrom && (
                                    <span className="badge-imported">Imported</span>
                                )}
                                <span className="filter-date">
                                    {new Date(filter.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="card-actions">
                                <button
                                    className="btn-action use"
                                    onClick={() => handleSelectFilter(filter)}
                                >
                                    Use
                                </button>

                                <button
                                    className="btn-action duplicate"
                                    onClick={() => handleDuplicateFilter(filter)}
                                    title="Duplicate"
                                >
                                    ⊕
                                </button>

                                <button
                                    className="btn-action share"
                                    onClick={() => handleShareFilter(filter._id)}
                                    title="Share"
                                >
                                    ⤴
                                </button>

                                <button
                                    className="btn-action delete"
                                    onClick={() => handleDeleteFilter(filter._id)}
                                    title="Delete"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>No saved filters yet</p>
                    <p className="empty-hint">Create and save filters to speed up your searches</p>
                </div>
            )}

            {/* Share Modal */}
            {showShare && (
                <div className="modal-overlay" onClick={() => setShowShare(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h4>Share Filter</h4>
                        <p>Share this code to let others use your filter:</p>

                        <div className="share-code-display">
                            <code>{shareCode}</code>
                            <button
                                className={`btn-copy ${copiedCode ? 'copied' : ''}`}
                                onClick={handleCopyShareCode}
                            >
                                {copiedCode ? '✓ Copied' : 'Copy'}
                            </button>
                        </div>

                        <button
                            className="btn-modal-close"
                            onClick={() => setShowShare(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedFilters;
