import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import { useNetwork } from '../Context/NetworkContext';
import TokenTradingChart from '../components/TokenTradingChart';
import AdvancedTradingInterface from '../components/AdvancedTradingInterface';
import { FiTrendingUp, FiTrendingDown, FiRefreshCw, FiStar, FiActivity, FiBarChart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TradingPage = () => {
  const { address } = useContext(ICOContent);
  const { selectedNetwork } = useNetwork();
  
  const [activeView, setActiveView] = useState('basic');
  const [marketData, setMarketData] = useState({});
  const [watchlist, setWatchlist] = useState(['ETH', 'MATIC', 'BNB']);
  const [loading, setLoading] = useState(true);

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
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-md border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Trading Dashboard</h1>
            <p className="font-body text-gray-400">Advanced token trading and market analysis</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Network Indicator */}
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
              <img src={selectedNetwork?.icon} alt={selectedNetwork?.name} className="w-5 h-5 rounded-full" />
              <span className="font-display text-sm">{selectedNetwork?.name}</span>
            </div>
            
            {/* Wallet Status */}
            {address ? (
              <div className="flex items-center space-x-2 bg-green-800 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-display text-sm">Wallet Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-yellow-800 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="font-display text-sm">Connect Wallet in Header</span>
              </div>
            )}
          </div>
        </div>
      </div>

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

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
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
          
          <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors">
            <FiRefreshCw className="w-4 h-4" />
            <span className="font-display text-sm">Refresh</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Trading Interface */}
          <div className="lg:col-span-3">
            {activeView === 'basic' ? (
              <TokenTradingChart />
            ) : (
              <AdvancedTradingInterface />
            )}
          </div>

          {/* Market Data Sidebar */}
          <div className="space-y-6">
            {/* Watchlist */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="font-display text-lg font-bold mb-4">Watchlist</h3>
              <div className="space-y-3">
                {watchlist.map((symbol) => {
                  const token = tokens.find(t => t.symbol === symbol);
                  const data = marketData[symbol];
                  if (!token || !data) return null;
                  
                  return (
                    <div key={symbol} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
                        <div>
                          <div className="font-display font-medium">{symbol}</div>
                          <div className="text-sm text-gray-400 font-display">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-medium">${data.price.toFixed(2)}</div>
                        <div className={`text-sm ${
                          data.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Movers */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="font-display text-lg font-bold mb-4">Top Movers</h3>
              <div className="space-y-3">
                {tokens.slice(0, 5).map((token) => {
                  const data = marketData[token.symbol];
                  if (!data) return null;
                  
                  return (
                    <div key={token.symbol} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                      <div className="flex items-center space-x-3">
                        <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
                        <div>
                          <div className="font-display font-medium">{token.symbol}</div>
                          <div className="text-sm text-gray-400 font-display">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-medium">${data.price.toFixed(2)}</div>
                        <div className={`text-sm ${
                          data.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Market Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="font-display text-lg font-bold mb-4">Market Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-display text-gray-400">Fear & Greed Index</span>
                  <span className="font-display font-medium text-green-400">72 (Greed)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-display text-gray-400">BTC Dominance</span>
                  <span className="font-display font-medium">42.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-display text-gray-400">DeFi TVL</span>
                  <span className="font-display font-medium">$45.2B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-display text-gray-400">Stablecoin Supply</span>
                  <span className="font-display font-medium">$150.3B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
