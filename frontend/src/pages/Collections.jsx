import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiTrendingUp, FiUsers, FiBarChart2, FiEye, FiDollarSign } from 'react-icons/fi';
import Header from '../components/Header';
import { nftAPI } from '../services/api';
import axios from 'axios';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [filterNetwork, setFilterNetwork] = useState('all');

  // Mock collection data structure - in production, this would come from API
  const [mockCollections] = useState([
    {
      id: 1,
      name: 'Cosmic Dreams',
      creator: 'Alex Creator',
      creatorAvatar: 'https://picsum.photos/50/50?random=1',
      description: 'A collection of dreamy, cosmic-inspired artwork',
      image: 'https://picsum.photos/400/300?random=1',
      floorPrice: 2.5,
      volume24h: 45.3,
      volume7d: 312.5,
      items: 342,
      owners: 156,
      views: 12543,
      likes: 892,
      verified: true,
      network: 'ethereum',
      percentChange24h: 15.3,
    },
    {
      id: 2,
      name: 'Digital Phoenix',
      creator: 'Phoenix Labs',
      creatorAvatar: 'https://picsum.photos/50/50?random=2',
      description: 'Rising from the digital ashes - unique mythical NFTs',
      image: 'https://picsum.photos/400/300?random=2',
      floorPrice: 1.8,
      volume24h: 28.7,
      volume7d: 189.2,
      items: 567,
      owners: 234,
      views: 9876,
      likes: 654,
      verified: true,
      network: 'polygon',
      percentChange24h: 8.7,
    },
    {
      id: 3,
      name: 'Neon Collection',
      creator: 'Neon Vibes Studio',
      creatorAvatar: 'https://picsum.photos/50/50?random=3',
      description: 'Cyberpunk aesthetic meets digital art',
      image: 'https://picsum.photos/400/300?random=3',
      floorPrice: 3.2,
      volume24h: 67.4,
      volume7d: 456.8,
      items: 1200,
      owners: 489,
      views: 45678,
      likes: 3456,
      verified: true,
      network: 'ethereum',
      percentChange24h: -2.1,
    },
    {
      id: 4,
      name: 'Abstract Harmony',
      creator: 'Art Collective',
      creatorAvatar: 'https://picsum.photos/50/50?random=4',
      description: 'Harmonious abstract compositions',
      image: 'https://picsum.photos/400/300?random=4',
      floorPrice: 1.2,
      volume24h: 15.8,
      volume7d: 98.5,
      items: 245,
      owners: 89,
      views: 3456,
      likes: 234,
      verified: false,
      network: 'bsc',
      percentChange24h: 22.5,
    },
    {
      id: 5,
      name: 'Cyber Punk',
      creator: 'Punk Protocol',
      creatorAvatar: 'https://picsum.photos/50/50?random=5',
      description: 'Classic cyberpunk aesthetic reimagined',
      image: 'https://picsum.photos/400/300?random=5',
      floorPrice: 4.1,
      volume24h: 89.2,
      volume7d: 612.4,
      items: 893,
      owners: 567,
      views: 67890,
      likes: 5678,
      verified: true,
      network: 'ethereum',
      percentChange24h: 5.8,
    },
    {
      id: 6,
      name: 'Pixel Paradise',
      creator: 'Retro Games Inc',
      creatorAvatar: 'https://picsum.photos/50/50?random=6',
      description: 'Nostalgic pixel art from classic gaming era',
      image: 'https://picsum.photos/400/300?random=6',
      floorPrice: 0.9,
      volume24h: 12.3,
      volume7d: 67.8,
      items: 512,
      owners: 234,
      views: 8765,
      likes: 543,
      verified: true,
      network: 'polygon',
      percentChange24h: 18.2,
    },
  ]);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, sortBy, filterNetwork, collections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // const response = await nftAPI.getCollections();
      // setCollections(response);
      
      // For now, use mock data
      setCollections(mockCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections(mockCollections);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = collections;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(col =>
        col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Network filter
    if (filterNetwork !== 'all') {
      filtered = filtered.filter(col => col.network === filterNetwork);
    }

    // Sort
    switch (sortBy) {
      case 'volume':
        filtered.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'floor':
        filtered.sort((a, b) => b.floorPrice - a.floorPrice);
        break;
      case 'items':
        filtered.sort((a, b) => b.items - a.items);
        break;
      case 'trending':
        filtered.sort((a, b) => b.percentChange24h - a.percentChange24h);
        break;
      default:
        break;
    }

    setFilteredCollections(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
          <span className="ml-4 text-gray-400">Loading collections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FiBarChart2 className="text-purple-400" />
            NFT Collections
          </h1>
          <p className="text-gray-400">Browse and discover trending NFT collections</p>
        </div>

        {/* Filters & Search */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search collections or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="volume">Sort by Volume</option>
            <option value="floor">Sort by Floor Price</option>
            <option value="items">Sort by Items</option>
            <option value="trending">Sort by Trending</option>
          </select>

          {/* Network Filter */}
          <div className="relative">
            <select
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:border-purple-500 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="all">All Networks</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BSC</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="base">Base</option>
              <option value="solana">Solana</option>
            </select>
            {filterNetwork !== 'all' && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {filterNetwork === 'ethereum' && (
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K" alt="eth" className="w-4 h-4" />
                )}
                {filterNetwork === 'polygon' && (
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==" alt="polygon" className="w-4 h-4" />
                )}
                {filterNetwork === 'bsc' && (
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==" alt="bsc" className="w-4 h-4" />
                )}
                {filterNetwork === 'arbitrum' && (
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyQzJEMzAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0iIzAwQzVGRiIvPgo8L3N2Zz4K" alt="arbitrum" className="w-4 h-4" />
                )}
                {filterNetwork === 'base' && (
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMDUyRkYiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==" alt="base" className="w-4 h-4" />
                )}
                {filterNetwork === 'solana' && (
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM5Qjg4RTkiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==" alt="solana" className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collection/${collection.name}`}
              className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              {/* Collection Image */}
              <div className="relative overflow-hidden h-48 bg-gray-800">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
                
                {/* Network Badge */}
                <div className="absolute top-3 right-3 bg-purple-600 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                  {collection.network}
                </div>

                {/* Verification Badge */}
                {collection.verified && (
                  <div className="absolute top-3 left-3 bg-green-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    ✓ Verified
                  </div>
                )}
              </div>

              {/* Collection Info */}
              <div className="p-4">
                <h3 className="text-xl font-bold mb-1">{collection.name}</h3>

                {/* Creator */}
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={collection.creatorAvatar}
                    alt={collection.creator}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-400">{collection.creator}</span>
                </div>

                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{collection.description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Floor Price</div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{collection.floorPrice}</span>
                      <span className="text-xs text-gray-400">ETH</span>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">24h Volume</div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{collection.volume24h}</span>
                      <span className={`text-xs ${collection.percentChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {collection.percentChange24h >= 0 ? '+' : ''}{collection.percentChange24h}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded p-3 flex items-center gap-2">
                    <FiBarChart2 className="text-purple-400" />
                    <div>
                      <div className="text-xs text-gray-500">Items</div>
                      <div className="font-bold">{collection.items.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded p-3 flex items-center gap-2">
                    <FiUsers className="text-purple-400" />
                    <div>
                      <div className="text-xs text-gray-500">Owners</div>
                      <div className="font-bold">{collection.owners.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-400 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-1">
                    <FiEye className="text-gray-500" />
                    <span>{(collection.views / 1000).toFixed(1)}k views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiTrendingUp className="text-gray-500" />
                    <span>{collection.likes.toLocaleString()} likes</span>
                  </div>
                </div>

                {/* View Collection Button */}
                <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors">
                  View Collection
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <FiFilter className="mx-auto w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No collections found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Collections;
