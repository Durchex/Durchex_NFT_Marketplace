import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FiTrendingUp, FiTrendingDown, FiRefreshCw, FiSettings, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdvancedTradingInterface = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('line');
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [tradingPair, setTradingPair] = useState('ETH/USDT');

  // Generate mock order book data
  const generateOrderBook = () => {
    const bids = [];
    const asks = [];
    let bidPrice = 2500;
    let askPrice = 2501;

    for (let i = 0; i < 10; i++) {
      bids.push({
        price: bidPrice.toFixed(2),
        amount: (Math.random() * 10).toFixed(4),
        total: (bidPrice * Math.random() * 10).toFixed(2),
      });
      asks.push({
        price: askPrice.toFixed(2),
        amount: (Math.random() * 10).toFixed(4),
        total: (askPrice * Math.random() * 10).toFixed(2),
      });
      bidPrice -= Math.random() * 5;
      askPrice += Math.random() * 5;
    }

    return { bids: bids.reverse(), asks };
  };

  // Generate mock recent trades
  const generateRecentTrades = () => {
    const trades = [];
    const basePrice = 2500;
    
    for (let i = 0; i < 20; i++) {
      const price = basePrice + (Math.random() - 0.5) * 20;
      const amount = (Math.random() * 5).toFixed(4);
      const isBuy = Math.random() > 0.5;
      
      trades.push({
        price: price.toFixed(2),
        amount,
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        type: isBuy ? 'buy' : 'sell',
      });
    }
    
    return trades;
  };

  // Generate advanced chart data
  const generateAdvancedChartData = () => {
    const dataPoints = timeframe === '1H' ? 60 : timeframe === '4H' ? 24 : timeframe === '1D' ? 24 : 7;
    const labels = [];
    const prices = [];
    const volumes = [];
    
    for (let i = 0; i < dataPoints; i++) {
      if (timeframe === '1H') {
        labels.push(`${i}m`);
      } else if (timeframe === '4H') {
        labels.push(`${i * 4}h`);
      } else if (timeframe === '1D') {
        labels.push(`${i}h`);
      } else {
        labels.push(`Day ${i + 1}`);
      }
      
      const basePrice = 2500;
      const variation = (Math.random() - 0.5) * 0.05;
      const price = basePrice * (1 + variation);
      prices.push(price);
      
      const volume = Math.random() * 1000000;
      volumes.push(volume);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
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
    },
  };

  useEffect(() => {
    setOrderBook(generateOrderBook());
    setRecentTrades(generateRecentTrades());
  }, [tradingPair]);

  const chartData = generateAdvancedChartData();

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="font-display text-xl font-bold">Advanced Trading</h3>
          <div className="flex space-x-2">
            {['chart', 'orderbook', 'trades'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-display transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="flex space-x-1">
            {['1H', '4H', '1D', '1W'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-display transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          {/* Settings */}
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            <FiSettings className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'chart' && (
        <div className="h-96">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {activeTab === 'orderbook' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm font-display text-gray-400">
            <div>Price (USDT)</div>
            <div>Amount (ETH)</div>
            <div>Total</div>
          </div>
          
          {/* Asks (Sell Orders) */}
          <div className="space-y-1">
            {orderBook.asks.map((ask, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 text-sm font-display">
                <div className="text-red-400">{ask.price}</div>
                <div className="text-gray-300">{ask.amount}</div>
                <div className="text-gray-300">{ask.total}</div>
              </div>
            ))}
          </div>
          
          {/* Spread */}
          <div className="border-t border-gray-700 pt-2">
            <div className="text-center text-sm font-display text-gray-400">
              Spread: {(parseFloat(orderBook.asks[0]?.price) - parseFloat(orderBook.bids[0]?.price)).toFixed(2)} USDT
            </div>
          </div>
          
          {/* Bids (Buy Orders) */}
          <div className="space-y-1">
            {orderBook.bids.map((bid, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 text-sm font-display">
                <div className="text-green-400">{bid.price}</div>
                <div className="text-gray-300">{bid.amount}</div>
                <div className="text-gray-300">{bid.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-4 text-sm font-display text-gray-400">
            <div>Price</div>
            <div>Amount</div>
            <div>Time</div>
            <div>Type</div>
          </div>
          
          {recentTrades.map((trade, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 text-sm font-display">
              <div className="text-gray-300">${trade.price}</div>
              <div className="text-gray-300">{trade.amount}</div>
              <div className="text-gray-400">{trade.time}</div>
              <div className={`${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                {trade.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedTradingInterface;

