/**
 * SearchBar Component
 * Global NFT search with autocomplete
 */

import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder = 'Search NFTs, creators, collections...' }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const fetchSuggestions = async (searchTerm) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/discover/search?q=${encodeURIComponent(searchTerm)}&limit=5`
            );
            
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.data.slice(0, 5));
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (nft) => {
        setQuery(nft.name);
        onSearch(nft.name);
        setShowSuggestions(false);
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="search-bar-container" ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => query && setShowSuggestions(true)}
                        placeholder={placeholder}
                        className="search-input"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="clear-button"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button type="submit" className="search-button">
                    Search
                </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                    {loading && <div className="suggestion-item loading">Loading...</div>}
                    {suggestions.map((nft, index) => (
                        <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionClick(nft)}
                        >
                            <div className="suggestion-info">
                                <div className="suggestion-name">{nft.name}</div>
                                <div className="suggestion-meta">
                                    {nft.creator && `by ${nft.creator.slice(0, 6)}...`}
                                    {nft.floorPrice && ` • ${nft.floorPrice.toFixed(2)} ETH`}
                                </div>
                            </div>
                            <div className="suggestion-arrow">→</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {showSuggestions && query && suggestions.length === 0 && !loading && (
                <div className="suggestions-dropdown">
                    <div className="suggestion-empty">
                        No NFTs found for "{query}"
                    </div>
                </div>
            )}

            {/* Recent Searches */}
            {!query && showSuggestions && (
                <div className="suggestions-dropdown">
                    <div className="suggestion-header">Popular searches</div>
                    <div className="suggestion-item">
                        <span>🔥 Trending NFTs</span>
                    </div>
                    <div className="suggestion-item">
                        <span>💎 Rare Collections</span>
                    </div>
                    <div className="suggestion-item">
                        <span>🎨 Art & Design</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
