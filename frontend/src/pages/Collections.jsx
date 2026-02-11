import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiTrendingUp, FiUsers, FiBarChart2, FiEye, FiDollarSign } from 'react-icons/fi';
import Header from '../components/Header';
import { nftAPI, userAPI } from '../services/api';
import { getCurrencySymbol } from '../Context/constants';
import axios from 'axios';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [filterNetwork, setFilterNetwork] = useState('all');

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, sortBy, filterNetwork, collections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      // Fetch all collections from API
      const allCollectionsData = await nftAPI.getCollections();
      
      if (Array.isArray(allCollectionsData) && allCollectionsData.length > 0) {
        // Fetch ALL NFTs across all networks once to calculate stats.
        const allNFTs = await nftAPI.getAllNftsAllNetworksForExplore(1000);
        
        // ✅ De-duplicate NFTs that may be returned for multiple networks
        const uniqueMap = new Map();
        allNFTs.forEach((nft) => {
          const key =
            nft._id ||
            `${nft.network || nft.chain || 'unknown'}-${nft.itemId || nft.tokenId || nft.name || Math.random()}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, nft);
          }
        });
        const uniqueNFTs = Array.from(uniqueMap.values());

        console.log(`[Collections] Total NFTs across all networks (raw): ${allNFTs.length}`);
        console.log(`[Collections] Total NFTs after de-duplication: ${uniqueNFTs.length}`);
        if (allNFTs.length > 0) {
          console.log(`[Collections] Sample NFT:`, {
            name: allNFTs[0].name,
            price: allNFTs[0].price,
            floorPrice: allNFTs[0].floorPrice,
            collection: allNFTs[0].collection
          });
        }
        
        // Transform API response to match expected structure
        const transformedCollections = await Promise.all(
          allCollectionsData.map(async (col, index) => {
            try {
              // Fetch creator profile
              let creatorInfo = {
                name: col.creatorName || col.creatorWallet?.slice(0, 6) + '...' || 'Unknown',
                avatar: null,
                wallet: col.creatorWallet
              };
              
              if (col.creatorWallet) {
                try {
                  const profile = await userAPI.getUserProfile(col.creatorWallet);
                  if (profile) {
                    creatorInfo.name = profile.userName || profile.creatorName || creatorInfo.name;
                    creatorInfo.avatar = profile.profilePicture || profile.creatorAvatar;
                  }
                } catch (err) {
                  console.warn(`Error fetching creator profile:`, err.message);
                }
              }
              
              // Find all NFTs in this collection
              const collectionNFTs = uniqueNFTs.filter(nft => 
                String(nft.collection || '').toLowerCase() === String(col.collectionId || col._id).toLowerCase()
              );
              
              console.log(`[Collections] Collection "${col.name}":`, {
                collectionId: col.collectionId || col._id,
                nftCount: collectionNFTs.length,
                nftSample: collectionNFTs.length > 0 ? {
                  name: collectionNFTs[0].name,
                  price: collectionNFTs[0].price,
                  floorPrice: collectionNFTs[0].floorPrice,
                  collection: collectionNFTs[0].collection
                } : 'No NFTs'
              });
              
              // Price per NFT (normalize wei); pieces per NFT for volume = sum(price × pieces)
              const pricePerNft = (n) => {
                const source = n.floorPrice != null && n.floorPrice !== '' ? n.floorPrice : n.price;
                let v = parseFloat(source || '0');
                if (v > 1000) v = v / 1e18;
                return isNaN(v) || v < 0 ? 0 : v;
              };
              const piecesPerNft = (n) => Math.max(1, Number(n.pieces ?? n.remainingPieces ?? 1) || 1);
              const prices = collectionNFTs.map(pricePerNft).filter(p => p > 0);
              const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
              const totalVolume = collectionNFTs.reduce((sum, n) => sum + pricePerNft(n) * piecesPerNft(n), 0);
              
              // Calculate unique owners
              const owners = new Set(collectionNFTs.map(n => String(n.owner || '').toLowerCase())).size;
              console.log(`[Collections] "${col.name}" stats (totalVolume = sum(price×pieces)):`, {
                nftCount: collectionNFTs.length,
                floorPrice: floorPrice.toFixed(4),
                totalVolume: totalVolume.toFixed(4),
                uniqueOwners: owners
              });
              
              return {
                _id: col._id,
                id: col._id || col.collectionId || index,
                name: col.name || 'Unnamed Collection',
                creator: creatorInfo.name,
                creatorAvatar: creatorInfo.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${col.creatorWallet || col._id}`,
                description: col.description || '',
                image: col.image || `https://picsum.photos/seed/${col._id}/400/300`,
                floorPrice: floorPrice > 0 ? floorPrice.toFixed(4) : '0.0000',
                volume24h: totalVolume > 0 ? totalVolume.toFixed(2) : '0.00',
                totalVolume: totalVolume > 0 ? totalVolume.toFixed(2) : '0.00',
                volume7d: col.volume7d || 0,
                percentChange24h: col.percentChange24h || 0,
                items: collectionNFTs.length,
                owners: owners,
                views: col.views || 0,
                likes: col.likes || 0,
                verified: col.verified || false,
                network: col.network || 'polygon',
                collectionId: col.collectionId,
                creatorWallet: col.creatorWallet,
              };
            } catch (error) {
              console.error(`Error processing collection:`, error);
              return null;
            }
          })
        );
        
        // Filter out any null values
        const validCollections = transformedCollections.filter(c => c !== null);
        setCollections(validCollections);
        console.log(`[Collections] Fetched ${transformedCollections.length} real collections from API`);
      } else {
        console.warn('[Collections] No collections found in API response, showing empty state');
        setCollections([]);
      }
    } catch (error) {
      console.error('[Collections] Error fetching collections from API:', error);
      setCollections([]);
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
                  <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png" alt="eth" className="w-4 h-4" />
                )}
                {filterNetwork === 'polygon' && (
                  <img src="https://wallet-asset.matic.network/img/tokens/pol.svg" alt="polygon" className="w-4 h-4" />
                )}
                {filterNetwork === 'bsc' && (
                  <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png" alt="bsc" className="w-4 h-4" />
                )}
                {filterNetwork === 'arbitrum' && (
                  <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png" alt="arbitrum" className="w-4 h-4" />
                )}
                {filterNetwork === 'base' && (
                  <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png" alt="base" className="w-4 h-4" />
                )}
                {filterNetwork === 'solana' && (
                  <img src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" alt="solana" className="w-4 h-4" />
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
              to={`/collection/${collection._id || collection.id}`}
              className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              {/* Collection Image */}
              <div className="relative overflow-hidden h-48 bg-gray-800">
                <img
                  src={collection.image || `https://picsum.photos/seed/${collection.id}/400/300`}
                  alt={collection.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/seed/${collection.id}/400/300`;
                  }}
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
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${collection.creator}`;
                    }}
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
                      <span className="text-xs text-gray-400">
                        {getCurrencySymbol(collection.network || 'ethereum')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Volume</div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">{collection.totalVolume ?? collection.volume24h}</span>
                      <span className="text-xs text-gray-400">
                        {getCurrencySymbol(collection.network || 'ethereum')}
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
