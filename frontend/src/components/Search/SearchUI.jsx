import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SearchUI.css';

const SearchUI = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [activeTab, setActiveTab] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    collection: '',
    priceMin: '',
    priceMax: '',
    verificationStatus: '',
    isListed: null,
  });
  const [sort, setSort] = useState('relevance');
  const [facets, setFacets] = useState({
    categories: [],
    collections: [],
    priceRanges: [],
    verifications: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Search NFTs
  const searchNFTs = useCallback(async () => {
    if (!query.trim() && !Object.values(filters).some((v) => v)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/search', {
        query,
        filters,
        sort,
        page,
        limit,
        facets: ['category', 'collection', 'priceRange', 'verificationStatus'],
      });

      setResults(response.data.data);
      setFacets(response.data.data.facets);

      // Log search for analytics
      axios.post('/api/search/log', {
        query,
        resultsCount: response.data.data.total,
        responseTime: Date.now(),
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, sort, page, limit]);

  // Debounced autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get('/api/search/autocomplete', {
          params: { q: query },
        });
        setSuggestions(response.data.suggestions);
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when filters change
  useEffect(() => {
    setPage(1);
    searchNFTs();
  }, [filters, sort]);

  // Perform search on page change
  useEffect(() => {
    searchNFTs();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    searchNFTs();
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const handlePriceRange = (min, max) => {
    setFilters((prev) => ({
      ...prev,
      priceMin: min,
      priceMax: max,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      collection: '',
      priceMin: '',
      priceMax: '',
      verificationStatus: '',
      isListed: null,
    });
    setQuery('');
    setSort('relevance');
    setPage(1);
  };

  return (
    <div className="search-ui">
      {/* Search Header */}
      <div className="search-header">
        <h1>Advanced NFT Search</h1>
        <p>Find exactly the NFTs you're looking for</p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search by name, collection, creator..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <span>🔍</span> Search
            </button>
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span>🔍</span>
                  {suggestion.text}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="search-container">
        {/* Sidebar Filters */}
        <div className={`search-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="filter-header">
            <h3>Filters</h3>
            <button
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear All
            </button>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <h4>Category</h4>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {facets.categories?.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.key} ({cat.doc_count})
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <h4>Price Range (ETH)</h4>
            <div className="price-filter">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) =>
                  handleFilterChange('priceMin', e.target.value)
                }
                className="price-input"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) =>
                  handleFilterChange('priceMax', e.target.value)
                }
                className="price-input"
              />
            </div>
            <div className="price-ranges">
              {['1', '5', '10', '50', '100'].map((price) => (
                <button
                  key={price}
                  className="range-btn"
                  onClick={() =>
                    handlePriceRange(0, parseFloat(price))
                  }
                >
                  Under {price} ETH
                </button>
              ))}
            </div>
          </div>

          {/* Verification Status Filter */}
          <div className="filter-group">
            <h4>Verification</h4>
            <select
              value={filters.verificationStatus}
              onChange={(e) =>
                handleFilterChange('verificationStatus', e.target.value)
              }
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Listing Status */}
          <div className="filter-group">
            <h4>Listing Status</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.isListed === true}
                onChange={(e) =>
                  handleFilterChange('isListed', e.target.checked ? true : null)
                }
              />
              Listed for Sale
            </label>
          </div>

          {/* Sorting */}
          <div className="filter-group">
            <h4>Sort By</h4>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="filter-select"
            >
              <option value="relevance">Most Relevant</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="most_liked">Most Liked</option>
              <option value="trending">Trending</option>
              <option value="rarity">Rarity Score</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="search-content">
          {/* Toggle Filters Button (Mobile) */}
          <div className="mobile-filter-toggle">
            <button
              className="toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '✕ Close Filters' : '⚙ Show Filters'}
            </button>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <h3>
              {results.total ? `${results.total.toLocaleString()} Results` : 'No Results'}
            </h3>
            <div className="view-options">
              <button className="view-btn active">Grid View</button>
              <button className="view-btn">List View</button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {/* Results Grid */}
          {!loading && results.items && results.items.length > 0 ? (
            <>
              <div className="results-grid">
                {results.items.map((nft) => (
                  <div key={nft.id} className="nft-card">
                    <div className="nft-image">
                      <img src={nft.image} alt={nft.title} />
                      {nft.verificationStatus === 'verified' && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                      {nft._score && (
                        <span className="relevance-score">
                          Match: {Math.round(nft._score * 10)}%
                        </span>
                      )}
                    </div>
                    <div className="nft-info">
                      <h4>{nft.title}</h4>
                      <p className="collection">{nft.collection}</p>
                      <p className="category">
                        <span className="badge">{nft.category}</span>
                      </p>
                      <div className="nft-stats">
                        <span>👁 {nft.views}</span>
                        <span>❤ {nft.favorites}</span>
                        <span>📊 {nft.sales}</span>
                      </div>
                      <div className="nft-price">
                        {nft.isListed ? (
                          <div>
                            <span className="label">Current Price</span>
                            <span className="price">
                              {nft.price} {nft.currency}
                            </span>
                          </div>
                        ) : (
                          <span className="not-listed">Not for Sale</span>
                        )}
                      </div>
                      <button className="view-details-btn">View Details</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="pag-btn"
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {results.currentPage} of {results.pages}
                </span>
                <button
                  disabled={page >= results.pages}
                  onClick={() => setPage(page + 1)}
                  className="pag-btn"
                >
                  Next →
                </button>
              </div>
            </>
          ) : !loading ? (
            <div className="no-results">
              <p>No NFTs found. Try adjusting your search or filters.</p>
              <button className="reset-btn" onClick={clearFilters}>
                Reset Search
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchUI;
