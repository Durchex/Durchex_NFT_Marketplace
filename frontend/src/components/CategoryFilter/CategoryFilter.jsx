/**
 * CategoryFilter Component
 * Visual category selection with counts
 */

import React, { useState, useEffect } from 'react';
import './CategoryFilter.css';

const CategoryFilter = ({ onCategorySelect, selectedCategory = '' }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/discover/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryName) => {
        onCategorySelect(categoryName === selectedCategory ? '' : categoryName);
    };

    if (loading) {
        return (
            <div className="category-filter loading">
                <div className="category-skeleton"></div>
                <div className="category-skeleton"></div>
                <div className="category-skeleton"></div>
            </div>
        );
    }

    return (
        <div className="category-filter">
            <h3>Categories</h3>
            <div className="categories-grid">
                {/* All Categories */}
                <div
                    className={`category-card ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryClick('')}
                >
                    <div className="category-icon">📊</div>
                    <div className="category-info">
                        <div className="category-name">All</div>
                        <div className="category-count">
                            {categories.reduce((sum, cat) => sum + cat.count, 0)}
                        </div>
                    </div>
                </div>

                {/* Individual Categories */}
                {categories.slice(0, 11).map((category) => (
                    <div
                        key={category.name}
                        className={`category-card ${selectedCategory === category.name ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(category.name)}
                    >
                        <div className="category-icon">
                            {getCategoryIcon(category.name)}
                        </div>
                        <div className="category-info">
                            <div className="category-name">{category.name}</div>
                            <div className="category-count">{category.count}</div>
                        </div>
                    </div>
                ))}

                {/* More button if categories exceed 11 */}
                {categories.length > 11 && (
                    <div className="category-card more">
                        <div className="category-icon">⋯</div>
                        <div className="category-info">
                            <div className="category-name">More</div>
                            <div className="category-count">{categories.length - 11}+</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to get category icons
const getCategoryIcon = (categoryName) => {
    const iconMap = {
        'art': '🎨',
        'collectibles': '🏆',
        'gaming': '🎮',
        'music': '🎵',
        'photography': '📷',
        'virtual': '🌐',
        'sports': '⚽',
        'fashion': '👗',
        'domain': '🌍',
        'metaverse': '🔮',
        'defi': '💰',
        'utility': '🛠️'
    };
    return iconMap[categoryName?.toLowerCase()] || '📦';
};

export default CategoryFilter;
