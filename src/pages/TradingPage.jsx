import React, { useState, useEffect } from 'react';
import TokenTradingChart from '../components/TokenTradingChart';
import AdvancedTradingInterface from '../components/AdvancedTradingInterface';
import Header from '../components/Header';
import { FiTrendingUp, FiTrendingDown, FiRefreshCw, FiStar, FiActivity, FiBarChart, FiArrowLeft, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TradingPage = () => {
  const [activeView, setActiveView] = useState('basic');
  const [marketData, setMarketData] = useState({});
  const [watchlist, setWatchlist] = useState(['ETH', 'MATIC', 'BNB']);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState(null); // null means show markets list
  const [searchQuery, setSearchQuery] = useState('');

  // Define all available markets
  const markets = [
    { 
      pair: 'ETH/USDT', 
      base: 'ETH', 
      quote: 'USDT',
      name: 'Ethereum / Tether',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      price: 2450.50,
      change24h: 2.45,
      volume24h: 1250000000,
      high24h: 2480.00,
      low24h: 2410.00
    },
    { 
      pair: 'MATIC/USDT', 
      base: 'MATIC', 
      quote: 'USDT',
      name: 'Polygon / Tether',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.85,
      change24h: -1.23,
      volume24h: 450000000,
      high24h: 0.88,
      low24h: 0.83
    },
    { 
      pair: 'BNB/USDT', 
      base: 'BNB', 
      quote: 'USDT',
      name: 'Binance Coin / Tether',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 315.20,
      change24h: 3.12,
      volume24h: 890000000,
      high24h: 318.50,
      low24h: 310.00
    },
    { 
      pair: 'ETH/USDC', 
      base: 'ETH', 
      quote: 'USDC',
      name: 'Ethereum / USD Coin',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      price: 2451.00,
      change24h: 2.50,
      volume24h: 980000000,
      high24h: 2481.00,
      low24h: 2411.00
    },
    { 
      pair: 'MATIC/USDC', 
      base: 'MATIC', 
      quote: 'USDC',
      name: 'Polygon / USD Coin',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 0.85,
      change24h: -1.15,
      volume24h: 320000000,
      high24h: 0.87,
      low24h: 0.84
    },
    { 
      pair: 'BNB/USDC', 
      base: 'BNB', 
      quote: 'USDC',
      name: 'Binance Coin / USD Coin',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 315.30,
      change24h: 3.20,
      volume24h: 650000000,
      high24h: 318.60,
      low24h: 310.10
    },
    { 
      pair: 'USDT/USDC', 
      base: 'USDT', 
      quote: 'USDC',
      name: 'Tether / USD Coin',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      price: 1.00,
      change24h: 0.01,
      volume24h: 2500000000,
      high24h: 1.001,
      low24h: 0.999
    },
  ];

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K' },
    { symbol: 'MATIC', name: 'Polygon', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==' },
    { symbol: 'BNB', name: 'Binance Coin', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==' },
    { symbol: 'USDT', name: 'Tether', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==' },
  ];

  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call to CoinGecko, CoinMarketCap, or Binance API
        // For now, we'll show empty state until real API is implemented
        setMarketData({});
        setLoading(false);
      } catch (error) {
        console.error('Error loading market data:', error);
        setMarketData({});
        setLoading(false);
      }
    };

    loadMarketData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
    toast.success(`${symbol} ${watchlist.includes(symbol) ? 'removed from' : 'added to'} watchlist`);
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Global Header */}
      <Header />

      <div className="max-w-7xl mx-auto p-6">
        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm text-gray-400">Total Market Cap</p>
                <p className="font-display text-xl font-bold">$2.1T</p>
              </div>
              <FiBarChart className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <FiTrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-display">+2.5%</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm text-gray-400">24h Volume</p>
                <p className="font-display text-xl font-bold">$45.2B</p>
              </div>
              <FiActivity className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <FiTrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-display">+8.3%</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm text-gray-400">Active Traders</p>
                <p className="font-display text-xl font-bold">1.2M</p>
              </div>
              <FiRefreshCw className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <FiTrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-display">+12.1%</span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm text-gray-400">BTC Dominance</p>
                <p className="font-display text-xl font-bold">42.3%</p>
              </div>
              <FiTrendingDown className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex items-center space-x-1 mt-2">
              <FiTrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-display">-1.2%</span>
            </div>
          </div>
        </div>

        {/* Markets List View - Show when no market is selected */}
        {!selectedMarket ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-300 bg-clip-text text-transparent">
                  Trading Markets
                </h1>
                <p className="text-gray-400">Select a market to view charts and start trading</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search markets (e.g., ETH, MATIC, BNB)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Markets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets
                .filter(market => 
                  market.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  market.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  market.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  market.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((market) => (
                  <button
                    key={market.pair}
                    onClick={() => setSelectedMarket(market)}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500 transition-all text-left group hover:scale-105"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={market.icon} 
                          alt={market.base}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <h3 className="font-display font-bold text-lg text-white">{market.pair}</h3>
                          <p className="text-sm text-gray-400">{market.name}</p>
                        </div>
                      </div>
                      <FiStar 
                        className={`w-5 h-5 transition-colors ${
                          watchlist.includes(market.base) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 group-hover:text-yellow-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(market.base);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Price</span>
                        <span className="font-display font-semibold text-white">${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">24h Change</span>
                        <span className={`font-display font-semibold flex items-center gap-1 ${
                          market.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {market.change24h >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                          {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">24h Volume</span>
                        <span className="font-display text-sm text-gray-300">${formatNumber(market.volume24h)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>24h High: ${market.high24h.toLocaleString()}</span>
                        <span>24h Low: ${market.low24h.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            {markets.filter(market => 
              market.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
              market.base.toLowerCase().includes(searchQuery.toLowerCase()) ||
              market.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
              market.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No markets found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Chart and Swap View - Show when market is selected */
          <>
            {/* Back Button and Market Info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedMarket(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                  <FiArrowLeft />
                  <span>Back to Markets</span>
                </button>
                
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedMarket.icon} 
                    alt={selectedMarket.base}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <h2 className="font-display font-bold text-xl">{selectedMarket.pair}</h2>
                    <p className="text-sm text-gray-400">{selectedMarket.name}</p>
                  </div>
                  <div className="ml-4 px-3 py-1 rounded-lg bg-gray-800/50 border border-gray-700">
                    <span className={`font-display font-semibold flex items-center gap-1 ${
                      selectedMarket.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedMarket.change24h >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                      {selectedMarket.change24h >= 0 ? '+' : ''}{selectedMarket.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveView('basic')}
                  className={`px-4 py-2 rounded-lg font-display transition-colors ${
                    activeView === 'basic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Basic Trading
                </button>
                <button
                  onClick={() => setActiveView('advanced')}
                  className={`px-4 py-2 rounded-lg font-display transition-colors ${
                    activeView === 'advanced'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Advanced Trading
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Trading Interface */}
              <div className="lg:col-span-3">
                {activeView === 'basic' ? (
                  <TokenTradingChart selectedMarket={selectedMarket} />
                ) : (
                  <AdvancedTradingInterface selectedMarket={selectedMarket} />
                )}
              </div>

              {/* Market Data Sidebar */}
              <div className="space-y-6">
                {/* Quick Market Switch */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <h3 className="font-display text-lg font-bold mb-4">Quick Switch</h3>
                  <div className="space-y-2">
                    {markets.slice(0, 5).map((market) => (
                      <button
                        key={market.pair}
                        onClick={() => setSelectedMarket(market)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedMarket.pair === market.pair
                            ? 'bg-purple-600/20 border border-purple-500'
                            : 'bg-gray-700 hover:bg-gray-600 border border-gray-700'
                        }`}
                      >
                        <span className="font-display font-medium">{market.pair}</span>
                        <span className={`text-sm ${
                          market.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Market Stats */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <h3 className="font-display text-lg font-bold mb-4">Market Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-gray-400">Current Price</span>
                      <span className="font-display font-medium">${selectedMarket.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-display text-gray-400">24h High</span>
                      <span className="font-display font-medium text-green-400">${selectedMarket.high24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-display text-gray-400">24h Low</span>
                      <span className="font-display font-medium text-red-400">${selectedMarket.low24h.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-display text-gray-400">24h Volume</span>
                      <span className="font-display font-medium">${formatNumber(selectedMarket.volume24h)}</span>
                    </div>
                  </div>
                </div>

                {/* Watchlist */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                  <h3 className="font-display text-lg font-bold mb-4">Watchlist</h3>
                  <div className="space-y-3">
                    {watchlist.map((symbol) => {
                      const token = tokens.find(t => t.symbol === symbol);
                      const market = markets.find(m => m.base === symbol);
                      if (!token || !market) return null;
                      
                      return (
                        <button
                          key={symbol}
                          onClick={() => setSelectedMarket(market)}
                          className="w-full flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
                            <div>
                              <div className="font-display font-medium">{symbol}</div>
                              <div className="text-sm text-gray-400 font-display">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display font-medium">${market.price.toLocaleString()}</div>
                            <div className={`text-sm ${
                              market.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TradingPage;
