import React, { useState, useEffect, useContext } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { ICOContent } from '../Context';
import { useNetwork } from '../Context/NetworkContext';
import { FiTrendingUp, FiTrendingDown, FiRefreshCw, FiArrowUp, FiArrowDown, FiDollarSign, FiPercent } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TokenTradingChart = () => {
  const { address } = useContext(ICOContent);
  const { selectedNetwork } = useNetwork();
  
  // State for chart data and trading
  const [chartData, setChartData] = useState(null);
  const [priceData, setPriceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [swapData, setSwapData] = useState({
    fromToken: 'ETH',
    toToken: 'USDT',
    fromAmount: '',
    toAmount: '',
    fromBalance: 0,
    toBalance: 0,
  });
  const [timeframe, setTimeframe] = useState('1D');
  const [isSwapping, setIsSwapping] = useState(false);

  // Mock token data - in production, this would come from APIs
  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IjYyNzVFQSIvPgo8cGF0aCBkPSJNMTYuNDk4IDRWMjAuOTk0TDI0LjQ5IDE2LjQ5OEwxNi40OTggNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggNEw4LjUgMTYuNDk4TDE2LjQ5OCAyMC45OTRWNCIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE2LjQ5OCAyNC45OTlMMjQuNDk5IDE4LjQ5OUwxNi40OTggMjcuOTk5VjI0Ljk5OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNi40OTggMjcuOTk5TDguNSAxOC40OTlMMTYuNDk4IDI0Ljk5OVYyNy45OTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K', balance: 0 },
    { symbol: 'MATIC', name: 'Polygon', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4MjQ3RTUiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==', balance: 0 },
    { symbol: 'BNB', name: 'Binance Coin', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGM0I5MDAiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==', balance: 0 },
    { symbol: 'USDT', name: 'Tether', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==', balance: 0 },
    { symbol: 'USDC', name: 'USD Coin', icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkE0RjQiLz4KPHBhdGggZD0iTTE2IDRMMjggMTZMMTYgMjhMOCAxNkwxNiA0WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==', balance: 0 },
  ];

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          font: {
            family: 'Space Grotesk',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Space Grotesk',
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Space Grotesk',
          },
          callback: function(value) {
            return '$' + value.toFixed(2);
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Space Grotesk',
          },
          callback: function(value) {
            return (value / 1000000).toFixed(1) + 'M';
          },
        },
      },
    },
  };

  // Default empty chart data to prevent null errors
  const defaultChartData = {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Price',
        data: [0],
        borderColor: 'rgba(75, 85, 99, 0.3)',
        backgroundColor: 'rgba(75, 85, 99, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  // Load chart data
  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call to CoinGecko, CoinMarketCap, or Binance API
        // For now, we'll show empty state until real API is implemented
        setChartData(defaultChartData);
        setPriceData({});
        setLoading(false);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setChartData(defaultChartData);
        setPriceData({});
        setLoading(false);
      }
    };

    loadChartData();
  }, [swapData.fromToken, timeframe]);

  // Calculate swap amount
  const calculateSwapAmount = (fromAmount, fromToken, toToken) => {
    const fromPrice = priceData[fromToken]?.price || 1;
    const toPrice = priceData[toToken]?.price || 1;
    return (parseFloat(fromAmount) * fromPrice / toPrice).toFixed(6);
  };

  // Handle swap
  const handleSwap = async () => {
    if (!address) {
      toast.error('Please connect your wallet using the header first');
      return;
    }

    if (!swapData.fromAmount || parseFloat(swapData.fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(swapData.fromAmount) > swapData.fromBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSwapping(true);
    toast.loading('Processing swap...', { id: 'swap' });

    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success(`Successfully swapped ${swapData.fromAmount} ${swapData.fromToken} to ${swapData.toAmount} ${swapData.toToken}`, { id: 'swap' });
      
      // Update balances (in production, this would come from blockchain)
      setSwapData(prev => ({
        ...prev,
        fromAmount: '',
        toAmount: '',
        fromBalance: prev.fromBalance - parseFloat(prev.fromAmount),
        toBalance: prev.toBalance + parseFloat(prev.toAmount),
      }));
    } catch (error) {
      toast.error('Swap failed. Please try again.', { id: 'swap' });
    } finally {
      setIsSwapping(false);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token, type) => {
    const tokenData = tokens.find(t => t.symbol === token);
    if (tokenData) {
      setSwapData(prev => ({
        ...prev,
        [type === 'from' ? 'fromToken' : 'toToken']: token,
        [type === 'from' ? 'fromBalance' : 'toBalance']: tokenData.balance,
        toAmount: type === 'from' ? calculateSwapAmount(prev.fromAmount, token, prev.toToken) : prev.toAmount,
        fromAmount: type === 'to' ? calculateSwapAmount(prev.toAmount, prev.fromToken, token) : prev.fromAmount,
      }));
    }
  };

  // Handle amount change
  const handleAmountChange = (amount, type) => {
    setSwapData(prev => ({
      ...prev,
      [type === 'from' ? 'fromAmount' : 'toAmount']: amount,
      [type === 'from' ? 'toAmount' : 'fromAmount']: type === 'from' 
        ? calculateSwapAmount(amount, prev.fromToken, prev.toToken)
        : calculateSwapAmount(amount, prev.toToken, prev.fromToken),
    }));
  };

  // Swap tokens
  const swapTokens = () => {
    setSwapData(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };

  const selectedToken = tokens.find(t => t.symbol === swapData.fromToken);
  const priceChange = priceData[swapData.fromToken]?.change24h || null;
  const currentPrice = priceData[swapData.fromToken]?.price || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 text-white">Token Trading</h1>
          <p className="font-body text-gray-400 text-lg">Trade tokens and analyze market trends</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Overview */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {selectedToken && (
                    <img src={selectedToken.icon} alt={selectedToken.name} className="w-8 h-8 rounded-full" />
                  )}
                  <div>
                    <h2 className="font-display text-xl font-bold">{swapData.fromToken}</h2>
                    <p className="font-body text-gray-400 text-sm">{selectedToken?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold">
                    {currentPrice ? `$${currentPrice.toFixed(2)}` : 'N/A'}
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {priceChange !== null ? (
                      <>
                        {priceChange >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                        <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                      </>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeframe Selector */}
              <div className="flex space-x-2 mb-4">
                {['1D', '7D', '1M', '1Y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-2 rounded-lg text-sm font-display transition-colors ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : chartData ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Line data={defaultChartData} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <FiDollarSign className="text-blue-400" />
                  <span className="font-display text-sm text-gray-400">24h Volume</span>
                </div>
                <div className="font-display text-lg font-bold">
                  {priceData[swapData.fromToken]?.volume24h ? 
                    `$${(priceData[swapData.fromToken].volume24h / 1000000000).toFixed(2)}B` 
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <FiPercent className="text-green-400" />
                  <span className="font-display text-sm text-gray-400">24h Change</span>
                </div>
                <div className={`font-display text-lg font-bold ${
                  priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {priceChange !== null ? 
                    `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%` 
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <FiTrendingUp className="text-purple-400" />
                  <span className="font-display text-sm text-gray-400">Market Cap</span>
                </div>
                <div className="font-display text-lg font-bold">
                  {priceData[swapData.fromToken]?.marketCap ? 
                    `$${(priceData[swapData.fromToken].marketCap / 1000000000).toFixed(2)}B` 
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Swap Section */}
          <div className="space-y-6">
            {/* Swap Interface */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="font-display text-xl font-bold mb-4">Swap Tokens</h3>
              
              {/* From Token */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2 font-display">From</label>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <select
                      value={swapData.fromToken}
                      onChange={(e) => handleTokenSelect(e.target.value, 'from')}
                      className="bg-transparent text-white font-display font-medium"
                    >
                      {tokens.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-400 font-display">
                      Balance: {swapData.fromBalance ? swapData.fromBalance.toFixed(4) : '0.0000'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={swapData.fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value, 'from')}
                    placeholder="0.0"
                    className="w-full bg-transparent text-white text-xl font-display placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={swapTokens}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                >
                  <div className="flex flex-col">
                    <FiArrowUp className="w-3 h-3 text-white" />
                    <FiArrowDown className="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>

              {/* To Token */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2 font-display">To</label>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <select
                      value={swapData.toToken}
                      onChange={(e) => handleTokenSelect(e.target.value, 'to')}
                      className="bg-transparent text-white font-display font-medium"
                    >
                      {tokens.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-400 font-display">
                      Balance: {swapData.toBalance ? swapData.toBalance.toFixed(4) : '0.0000'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={swapData.toAmount}
                    onChange={(e) => handleAmountChange(e.target.value, 'to')}
                    placeholder="0.0"
                    className="w-full bg-transparent text-white text-xl font-display placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <button
                onClick={handleSwap}
                disabled={isSwapping || !swapData.fromAmount || !address}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isSwapping ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    <span>Swapping...</span>
                  </div>
                ) : address ? (
                  'Swap Tokens'
                ) : (
                  'Connect Wallet in Header'
                )}
              </button>
            </div>

            {/* Token List */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="font-display text-xl font-bold mb-4">Available Tokens</h3>
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleTokenSelect(token.symbol, 'from')}>
                    <div className="flex items-center space-x-3">
                      <img src={token.icon} alt={token.name} className="w-6 h-6 rounded-full" />
                      <div>
                        <div className="font-display font-medium">{token.symbol}</div>
                        <div className="text-sm text-gray-400 font-display">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-medium">
                        {priceData[token.symbol]?.price ? `$${priceData[token.symbol].price.toFixed(2)}` : 'N/A'}
                      </div>
                      <div className={`text-sm ${
                        priceData[token.symbol]?.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {priceData[token.symbol]?.change24h ? 
                          `${priceData[token.symbol].change24h >= 0 ? '+' : ''}${priceData[token.symbol].change24h.toFixed(2)}%` 
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTradingChart;