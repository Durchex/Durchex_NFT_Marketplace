/**
 * FilterPanel.jsx
 * Advanced filtering UI component
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FilterPanel.css';

const FilterPanel = ({ onFilterChange, onClose }) => {
    const [filters, setFilters] = useState({
        search: '',
        priceMin: '',
        priceMax: '',
        rarity: [],
        collection: [],
        creator: [],
        status: [],
        attributes: {},
        verifiedOnly: false,
        hasBids: false,
        recentlyListed: false,
        recentlyListedDays: 7,
    });

    const [filterOptions, setFilterOptions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({
        price: true,
        rarity: true,
        collection: true,
        status: true,
        advanced: false,
    });

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/advanced-filters/options`
            );

            if (response.data.success) {
                setFilterOptions(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching filter options:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const newFilters = { ...filters, search: e.target.value };
        setFilters(newFilters);
    };

    const handlePriceChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
    };

    const handleCheckboxChange = (category, value) => {
        const newFilters = { ...filters };

        if (category === 'verifiedOnly' || category === 'hasBids' || category === 'recentlyListed') {
            newFilters[category] = !newFilters[category];
        } else {
            const currentList = newFilters[category];
            if (currentList.includes(value)) {
                newFilters[category] = currentList.filter((item) => item !== value);
            } else {
                newFilters[category] = [...currentList, value];
            }
        }

        setFilters(newFilters);
    };

    const handleAttributeChange = (attribute, value) => {
        const newFilters = { ...filters };
        newFilters.attributes = { ...newFilters.attributes };

        if (!newFilters.attributes[attribute]) {
            newFilters.attributes[attribute] = [];
        }

        if (newFilters.attributes[attribute].includes(value)) {
            newFilters.attributes[attribute] = newFilters.attributes[attribute].filter(
                (v) => v !== value
            );
        } else {
            newFilters.attributes[attribute] = [
                ...newFilters.attributes[attribute],
                value,
            ];
        }

        setFilters(newFilters);
    };

    const handleRecentlyListedDaysChange = (e) => {
        const newFilters = {
            ...filters,
            recentlyListedDays: parseInt(e.target.value),
        };
        setFilters(newFilters);
    };

    const applyFilters = () => {
        onFilterChange(filters);
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            priceMin: '',
            priceMax: '',
            rarity: [],
            collection: [],
            creator: [],
            status: [],
            attributes: {},
            verifiedOnly: false,
            hasBids: false,
            recentlyListed: false,
            recentlyListedDays: 7,
        });
    };

    const toggleSection = (section) => {
        setExpandedSections({
            ...expandedSections,
            [section]: !expandedSections[section],
        });
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.search) count++;
        if (filters.priceMin || filters.priceMax) count++;
        if (filters.rarity.length > 0) count++;
        if (filters.collection.length > 0) count++;
        if (filters.creator.length > 0) count++;
        if (filters.status.length > 0) count++;
        if (Object.keys(filters.attributes).length > 0) count++;
        if (filters.verifiedOnly) count++;
        if (filters.hasBids) count++;
        if (filters.recentlyListed) count++;
        return count;
    };

    if (loading) {
        return <div className="filter-panel loading">Loading filters...</div>;
    }

    return (
        <div className="filter-panel">
            {/* Header */}
            <div className="filter-header">
                <h3>
                    Filters {getActiveFilterCount() > 0 && <span className="badge">{getActiveFilterCount()}</span>}
                </h3>
                <button className="btn-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            {/* Search */}
            <div className="filter-section">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search NFTs..."
                    value={filters.search}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Price Range */}
            <div className="filter-section">
                <div className="section-header" onClick={() => toggleSection('price')}>
                    <span>Price Range</span>
                    <span className="toggle-arrow">
                        {expandedSections.price ? '▼' : '▶'}
                    </span>
                </div>

                {expandedSections.price && (
                    <div className="section-content">
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.priceMin}
                                onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                                className="input-field"
                            />
                            <span className="separator">—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.priceMax}
                                onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                                className="input-field"
                            />
                        </div>
                        {filterOptions?.priceRange && (
                            <div className="price-info">
                                Range: {filterOptions.priceRange.min?.price || '0'} -{' '}
                                {filterOptions.priceRange.max?.price || 'infinity'} ETH
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Rarity */}
            {filterOptions?.rarities && filterOptions.rarities.length > 0 && (
                <div className="filter-section">
                    <div className="section-header" onClick={() => toggleSection('rarity')}>
                        <span>Rarity</span>
                        <span className="toggle-arrow">
                            {expandedSections.rarity ? '▼' : '▶'}
                        </span>
                    </div>

                    {expandedSections.rarity && (
                        <div className="section-content">
                            {filterOptions.rarities.map((rarity) => (
                                <label key={rarity} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.rarity.includes(rarity)}
                                        onChange={() => handleCheckboxChange('rarity', rarity)}
                                    />
                                    <span>{rarity}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Collection */}
            {filterOptions?.collections && filterOptions.collections.length > 0 && (
                <div className="filter-section">
                    <div className="section-header" onClick={() => toggleSection('collection')}>
                        <span>Collection</span>
                        <span className="toggle-arrow">
                            {expandedSections.collection ? '▼' : '▶'}
                        </span>
                    </div>

                    {expandedSections.collection && (
                        <div className="section-content scrollable">
                            {filterOptions.collections.slice(0, 10).map((collection) => (
                                <label key={collection} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.collection.includes(collection)}
                                        onChange={() => handleCheckboxChange('collection', collection)}
                                    />
                                    <span>{collection}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Status */}
            {filterOptions?.statuses && filterOptions.statuses.length > 0 && (
                <div className="filter-section">
                    <div className="section-header" onClick={() => toggleSection('status')}>
                        <span>Status</span>
                        <span className="toggle-arrow">
                            {expandedSections.status ? '▼' : '▶'}
                        </span>
                    </div>

                    {expandedSections.status && (
                        <div className="section-content">
                            {filterOptions.statuses.map((status) => (
                                <label key={status} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filters.status.includes(status)}
                                        onChange={() => handleCheckboxChange('status', status)}
                                    />
                                    <span className="status-badge" data-status={status}>
                                        {status}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Advanced Filters */}
            <div className="filter-section">
                <div className="section-header" onClick={() => toggleSection('advanced')}>
                    <span>Advanced</span>
                    <span className="toggle-arrow">
                        {expandedSections.advanced ? '▼' : '▶'}
                    </span>
                </div>

                {expandedSections.advanced && (
                    <div className="section-content">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.verifiedOnly}
                                onChange={() => handleCheckboxChange('verifiedOnly', true)}
                            />
                            <span>Verified Creators Only</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.hasBids}
                                onChange={() => handleCheckboxChange('hasBids', true)}
                            />
                            <span>Has Bids</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.recentlyListed}
                                onChange={() => handleCheckboxChange('recentlyListed', true)}
                            />
                            <span>Recently Listed</span>
                        </label>

                        {filters.recentlyListed && (
                            <select
                                value={filters.recentlyListedDays}
                                onChange={handleRecentlyListedDaysChange}
                                className="select-field"
                            >
                                <option value={1}>Last 24 hours</option>
                                <option value={7}>Last 7 days</option>
                                <option value={30}>Last 30 days</option>
                                <option value={90}>Last 90 days</option>
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="filter-actions">
                <button className="btn-reset" onClick={resetFilters}>
                    Reset
                </button>
                <button className="btn-apply" onClick={applyFilters}>
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default FilterPanel;
