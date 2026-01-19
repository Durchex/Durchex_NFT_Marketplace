/**
 * FilterPanel Component
 * Advanced filtering for NFT discovery
 */

import React, { useState, useEffect } from 'react';
import './FilterPanel.css';

const FilterPanel = ({ onFilterChange, isLoading = false }) => {
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        category: '',
        rarity: '',
        sortBy: 'newest',
        status: 'all'
    });

    const [priceStats, setPriceStats] = useState(null);
    const [categories, setCategories] = useState([]);

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [statsRes, categoriesRes] = await Promise.all([
                    fetch('/api/discover/price-stats'),
                    fetch('/api/discover/categories')
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setPriceStats(statsData.data);
                }

                if (categoriesRes.ok) {
                    const catData = await categoriesRes.json();
                    setCategories(catData.data);
                }
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
            }
        };

        fetchFilterOptions();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = {
            ...filters,
            [name]: value
        };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            minPrice: '',
            maxPrice: '',
            category: '',
            rarity: '',
            sortBy: 'newest',
            status: 'all'
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <div className="filter-panel">
            <div className="filter-header">
                <h3>Filters</h3>
                <button onClick={handleReset} className="reset-button" disabled={isLoading}>
                    Reset
                </button>
            </div>

            {/* Price Range */}
            <div className="filter-section">
                <h4>Price Range</h4>
                {priceStats && (
                    <div className="price-info">
                        <small>
                            Floor: {priceStats.min?.toFixed(2)} ETH | Ceil: {priceStats.max?.toFixed(2)} ETH
                        </small>
                    </div>
                )}
                <div className="price-inputs">
                    <input
                        type="number"
                        name="minPrice"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        disabled={isLoading}
                        min="0"
                        step="0.01"
                    />
                    <span className="separator">-</span>
                    <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        disabled={isLoading}
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>

            {/* Sort By */}
            <div className="filter-section">
                <h4>Sort By</h4>
                <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    disabled={isLoading}
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="recently_listed">Recently Listed</option>
                    <option value="trending">Trending</option>
                    <option value="rarity">Rarity</option>
                </select>
            </div>

            {/* Category */}
            <div className="filter-section">
                <h4>Category</h4>
                <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    disabled={isLoading}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                            {cat.name} ({cat.count})
                        </option>
                    ))}
                </select>
            </div>

            {/* Rarity */}
            <div className="filter-section">
                <h4>Rarity</h4>
                <div className="rarity-options">
                    {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => (
                        <label key={rarity} className="rarity-label">
                            <input
                                type="radio"
                                name="rarity"
                                value={rarity}
                                checked={filters.rarity === rarity}
                                onChange={handleFilterChange}
                                disabled={isLoading}
                            />
                            <span className={`rarity-badge ${rarity}`}>
                                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Status */}
            <div className="filter-section">
                <h4>Status</h4>
                <div className="status-options">
                    {['all', 'for_sale', 'auction', 'offer'].map((status) => (
                        <label key={status} className="status-label">
                            <input
                                type="radio"
                                name="status"
                                value={status}
                                checked={filters.status === status}
                                onChange={handleFilterChange}
                                disabled={isLoading}
                            />
                            <span>
                                {status === 'for_sale' && 'For Sale'}
                                {status === 'auction' && 'In Auction'}
                                {status === 'offer' && 'Offers Pending'}
                                {status === 'all' && 'All'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Active Filters Count */}
            {Object.values(filters).some(v => v !== '' && v !== 'newest' && v !== 'all') && (
                <div className="active-filters-count">
                    {Object.values(filters).filter(v => v !== '' && v !== 'newest' && v !== 'all').length} filter(s) active
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
