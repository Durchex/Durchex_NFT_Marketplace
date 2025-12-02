import React, { useState, useEffect, useContext } from 'react';
import TokenTradingChart from '../components/TokenTradingChart';
import Header from '../components/Header';
import { useNetwork } from '../Context/NetworkContext';
import { ICOContent } from '../Context';
import { nftAPI } from '../services/api';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiRefreshCw, 
  FiStar, 
  FiSearch,
  FiArrowUpRight,
  FiFilter,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const TradingPage = () => {
  const { networks, selectedNetwork, switchNetwork } = useNetwork();
  const { address } = useContext(ICOContent);
  const [selectedToken, setSelectedToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState('all');
  const [watchlist, setWatchlist] = useState(['ETH', 'MATIC', 'BNB', 'USDT', 'USDC']);

  // Fallback static tokens/projects (used if backend unavailable)
  const staticTokens = [
    // Ethereum tokens
    { 
      symbol: 'ETH', 
      name: 'Ethereum', 
      network: 'Ethereum',
      chainId: 1,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      price: 2450.50,
      change24h: 2.45,
      volume24h: 1250000000,
      liquidity: 4500000000,
      marketCap: 295000000000,
      isNew: false
    },
    { 
      symbol: 'USDT', 
      name: 'Tether USD', 
      network: 'Ethereum',
      chainId: 1,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 1.00,
      change24h: 0.01,
      volume24h: 2500000000,
      liquidity: 80000000000,
      marketCap: 95000000000,
      isNew: false
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin', 
      network: 'Ethereum',
      chainId: 1,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 1.00,
      change24h: 0.00,
      volume24h: 1800000000,
      liquidity: 25000000000,
      marketCap: 28000000000,
      isNew: false
    },
    // Polygon tokens
    { 
      symbol: 'MATIC', 
      name: 'Polygon', 
      network: 'Polygon',
      chainId: 137,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.85,
      change24h: -1.23,
      volume24h: 450000000,
      liquidity: 1200000000,
      marketCap: 8500000000,
      isNew: false
    },
    { 
      symbol: 'POL', 
      name: 'Polygon Ecosystem Token', 
      network: 'Polygon',
      chainId: 137,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.85,
      change24h: 1.50,
      volume24h: 120000000,
      liquidity: 350000000,
      marketCap: 8500000000,
      isNew: true
    },
    // BSC tokens
    { 
      symbol: 'BNB', 
      name: 'Binance Coin', 
      network: 'BSC',
      chainId: 56,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 315.20,
      change24h: 3.12,
      volume24h: 890000000,
      liquidity: 4500000000,
      marketCap: 48000000000,
      isNew: false
    },
    // Arbitrum tokens
    { 
      symbol: 'ARB', 
      name: 'Arbitrum', 
      network: 'Arbitrum',
      chainId: 42161,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyQzJEMzAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0iIzAwQzVGRiIvPgo8L3N2Zz4K',
      price: 1.25,
      change24h: 4.50,
      volume24h: 320000000,
      liquidity: 850000000,
      marketCap: 1500000000,
      isNew: false
    },
    // New projects (latest)
    { 
      symbol: 'DURCH', 
      name: 'Durchex Token', 
      network: 'Ethereum',
      chainId: 1,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MTQ5RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.025,
      change24h: 12.50,
      volume24h: 15000000,
      liquidity: 50000000,
      marketCap: 25000000,
      isNew: true
    },
    { 
      symbol: 'DEX', 
      name: 'DEX Protocol', 
      network: 'Polygon',
      chainId: 137,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.15,
      change24h: 8.30,
      volume24h: 8500000,
      liquidity: 25000000,
      marketCap: 12000000,
      isNew: true
    },
    { 
      symbol: 'SWAP', 
      name: 'Swap Token', 
      network: 'BSC',
      chainId: 56,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.08,
      change24h: 15.20,
      volume24h: 12000000,
      liquidity: 35000000,
      marketCap: 18000000,
      isNew: true
    },
    // Tezos tokens
    { 
      symbol: 'XTZ', 
      name: 'Tezos', 
      network: 'Tezos',
      chainId: 1729,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0MDQwNDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0iIzAwQzVGRiIvPgo8L3N2Zz4K',
      price: 0.95,
      change24h: 2.10,
      volume24h: 85000000,
      liquidity: 250000000,
      marketCap: 850000000,
      isNew: false
    },
    // Hyperliquid tokens
    { 
      symbol: 'HL', 
      name: 'Hyperliquid', 
      network: 'Hyperliquid',
      chainId: 421614,
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwMEZGNzciLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 12.50,
      change24h: 5.80,
      volume24h: 45000000,
      liquidity: 180000000,
      marketCap: 320000000,
      isNew: false
    },
  ];

  // Dynamic tokens state (will be populated from backend when available)
  const [tokens, setTokens] = useState(staticTokens);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Filter tokens by network
  const filteredTokens = tokens.filter(token => {
    const matchesNetwork = selectedNetworkFilter === 'all' || token.network === selectedNetworkFilter;
    const matchesSearch = searchQuery === '' || 
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNetwork && matchesSearch;
  });

  // Get latest projects (new tokens)
  const latestProjects = tokens.filter(token => token.isNew).slice(0, 6);

  // Get supported networks for filter
  const supportedNetworks = ['all', ...Array.from(new Set(tokens.map(t => t.network)))];

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
    toast.success(`${symbol} ${watchlist.includes(symbol) ? 'removed from' : 'added to'} watchlist`);
  };

  // Fetch dynamic token/project data from backend
  useEffect(() => {
    let cancelled = false;

    const fetchTokens = async () => {
      setLoadingTokens(true);
      try {
        // Attempt to fetch collections or NFTs for the selected network filter
        if (selectedNetworkFilter && selectedNetworkFilter !== 'all') {
          // backend likely expects lowercase network identifiers
          const netKey = selectedNetworkFilter.toLowerCase();
          const resp = await nftAPI.getCollectionsByNetwork(netKey).catch(() => null);
          if (resp && !cancelled) {
            // resp may be an array or object with collections
            const collections = Array.isArray(resp) ? resp : resp.collections || resp.data || [];
            if (collections && collections.length > 0) {
              const mapped = collections.map((c) => ({
                symbol: c.symbol || (c.name ? c.name.slice(0,4).toUpperCase() : 'PRJ'),
                name: c.name || c.collectionName || c.contractName || c.contractAddress,
                network: selectedNetworkFilter,
                chainId: c.chainId || c.chain || 0,
                icon: c.icon || c.image || c.logo || 'data:image/svg+xml;base64,PHN2ZyB4bWxu...==',
                price: c.floorPrice || c.price || 0,
                change24h: c.change24h || 0,
                volume24h: c.volume || c.volume24h || 0,
                liquidity: c.liquidity || 0,
                marketCap: c.marketCap || 0,
                isNew: !!c.isNew || !!c.recent
              }));
              setTokens(mapped);
              setLoadingTokens(false);
              return;
            }
          }
        }

        // If 'all' selected or collection fetch failed, try fetching single NFTs across networks
        const fallbackTokens = [];
        for (const net of networks) {
          const netKey = (net.name || net.id || '').toLowerCase();
          if (!netKey) continue;
          const resp = await nftAPI.getSingleNfts(netKey).catch(() => null);
          const items = resp && (Array.isArray(resp) ? resp : resp.items || resp.data) ? (Array.isArray(resp) ? resp : (resp.items || resp.data)) : [];
          for (const it of items.slice(0,6)) {
            fallbackTokens.push({
              symbol: it.symbol || (it.name ? it.name.slice(0,4).toUpperCase() : 'NFT'),
              name: it.name || it.title || it.tokenName || it.collection || it.contractAddress,
              network: net.name || netKey,
              chainId: net.chainId || net.chainId || 0,
              icon: it.image || it.metadata?.image || it.icon || 'data:image/svg+xml;base64,PHN2ZyB4bWxu...==',
              price: it.price || 0,
              change24h: 0,
              volume24h: it.volume || 0,
              liquidity: 0,
              marketCap: 0,
              isNew: !!it.isNew || false
            });
          }
        }

        if (fallbackTokens.length > 0 && !cancelled) {
          setTokens(fallbackTokens);
        } else {
          // fallback to static tokens
          setTokens(staticTokens);
        }
      } catch (error) {
        console.error('Failed to fetch tokens for trading page:', error);
        toast.error('Unable to load live projects — showing sample data');
        setTokens(staticTokens);
      } finally {
        if (!cancelled) setLoadingTokens(false);
      }
    };

    fetchTokens();

    return () => { cancelled = true; };
  }, [selectedNetworkFilter, networks]);

  // Create market object for selected token
  const selectedMarket = selectedToken ? {
    pair: `${selectedToken.symbol}/USDT`,
    base: selectedToken.symbol,
    quote: 'USDT',
    name: `${selectedToken.name} / Tether`,
    icon: selectedToken.icon,
    price: selectedToken.price,
    change24h: selectedToken.change24h,
    volume24h: selectedToken.volume24h,
    high24h: selectedToken.price * 1.02,
    low24h: selectedToken.price * 0.98
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Header />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Latest Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-300 bg-clip-text text-transparent">
                Latest Projects
              </h2>
              <p className="text-gray-400 text-sm">New tokens on supported networks</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium">
              View All
              <FiArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Latest Projects Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loadingTokens ? (
              <div className="col-span-full flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              latestProjects.map((token, index) => (
              <button
                key={index}
                onClick={() => setSelectedToken(token)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-purple-500 transition-all text-left group hover:scale-105"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <img 
                      src={token.icon} 
                      alt={token.symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {token.isNew && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <FiStar 
                    className={`w-4 h-4 transition-colors ${
                      watchlist.includes(token.symbol) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 group-hover:text-yellow-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(token.symbol);
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-sm">{token.symbol}</h3>
                  <p className="text-xs text-gray-400 truncate">{token.name}</p>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-400">Network</div>
                  <div className="text-xs text-purple-400 font-medium">{token.network}</div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span className={`text-xs font-semibold ${
                    token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Token List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search and Filter */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                />
              </div>
              
              {/* Network Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <FiFilter className="w-4 h-4 text-gray-400" />
                {supportedNetworks.map((network) => (
                  <button
                    key={network}
                    onClick={() => setSelectedNetworkFilter(network)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedNetworkFilter === network
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {network === 'all' ? 'All' : network}
                  </button>
                ))}
              </div>
            </div>

            {/* Token List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="p-4 border-b border-gray-700/50">
                <h3 className="font-display font-bold text-lg">All Tokens</h3>
                <p className="text-xs text-gray-400">Supported networks only</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredTokens.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p>No tokens found</p>
                  </div>
                ) : (
                  filteredTokens.map((token, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedToken(token)}
                      className={`w-full p-4 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors text-left ${
                        selectedToken?.symbol === token.symbol ? 'bg-purple-600/20 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={token.icon} 
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-semibold text-white">{token.symbol}</span>
                              {token.isNew && (
                                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{token.name}</div>
                            <div className="text-xs text-purple-400 mt-0.5">{token.network}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-semibold text-white">${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                          <div className={`text-xs flex items-center justify-end gap-1 ${
                            token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {token.change24h >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Center - Swap Interface */}
          <div className="lg:col-span-2">
            {selectedToken ? (
              <div className="space-y-6">
                {/* Token Header */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedToken.icon} 
                        alt={selectedToken.symbol}
                        className="w-12 h-12 rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div>
                        <h2 className="font-display font-bold text-2xl text-white">{selectedToken.symbol}</h2>
                        <p className="text-gray-400">{selectedToken.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                            {selectedToken.network}
                          </span>
                          {selectedToken.isNew && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">
                              NEW PROJECT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedToken(null)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Price Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700/50">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Price</div>
                      <div className="font-display font-semibold text-white">
                        ${selectedToken.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">24h Change</div>
                      <div className={`font-display font-semibold flex items-center gap-1 ${
                        selectedToken.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedToken.change24h >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                        {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                      <div className="font-display font-semibold text-white">
                        ${formatNumber(selectedToken.volume24h)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Liquidity</div>
                      <div className="font-display font-semibold text-white">
                        ${formatNumber(selectedToken.liquidity)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Interface */}
                <TokenTradingChart selectedMarket={selectedMarket} />
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700/50 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiArrowUpRight className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2">Select a Token to Swap</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Choose a token from the list to view its chart and start swapping
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>Supported Networks: {networks.map(n => n.name).join(', ')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Market Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Market Overview */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <h3 className="font-display font-bold text-lg mb-4">Market Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Market Cap</span>
                  <span className="font-display font-semibold">$2.1T</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">24h Volume</span>
                  <span className="font-display font-semibold">$45.2B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Active Pairs</span>
                  <span className="font-display font-semibold">{filteredTokens.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Supported Networks</span>
                  <span className="font-display font-semibold">{networks.length}</span>
                </div>
              </div>
            </div>

            {/* Watchlist */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <h3 className="font-display font-bold text-lg mb-4">Watchlist</h3>
              <div className="space-y-2">
                {watchlist.slice(0, 5).map((symbol) => {
                  const token = tokens.find(t => t.symbol === symbol);
                  if (!token) return null;
                  
                  return (
                    <button
                      key={symbol}
                      onClick={() => setSelectedToken(token)}
                      className="w-full flex items-center justify-between p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
                        <span className="font-display font-medium text-sm">{symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-semibold text-xs">${token.price.toLocaleString()}</div>
                        <div className={`text-xs ${
                          token.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
              <h3 className="font-display font-bold text-lg mb-4">Current Network</h3>
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={selectedNetwork?.icon} 
                  alt={selectedNetwork?.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-display font-semibold">{selectedNetwork?.name}</div>
                  <div className="text-xs text-gray-400">{selectedNetwork?.symbol}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  // Show network selector modal or dropdown
                  toast.info('Switch network from wallet dropdown');
                }}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                Switch Network
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
