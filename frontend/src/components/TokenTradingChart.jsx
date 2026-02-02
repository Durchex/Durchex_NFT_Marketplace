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
import smartContractService from '../services/smartContractService';
import { nftAPI } from '../services/api';
import swapService from '../services/swapService';
import uniswapService from '../services/uniswapService';
import tokenRegistry from '../services/tokenRegistry';
import { ethers } from 'ethers';
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

const TokenTradingChart = ({ selectedMarket }) => {
  const { address } = useContext(ICOContent);
  const { selectedNetwork } = useNetwork();
  
  // State for chart data and trading
  const [chartData, setChartData] = useState(null);
  const [priceData, setPriceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [swapData, setSwapData] = useState({
    fromToken: selectedMarket?.base || 'ETH',
    toToken: selectedMarket?.quote || 'USDT',
    fromAmount: '',
    toAmount: '',
    fromBalance: 0,
    toBalance: 0,
  });

  // Update swap data when market changes
  useEffect(() => {
    if (selectedMarket) {
      setSwapData(prev => ({
        ...prev,
        fromToken: selectedMarket.base,
        toToken: selectedMarket.quote,
      }));
    }
  }, [selectedMarket]);
  const [timeframe, setTimeframe] = useState('1D');
  const [isSwapping, setIsSwapping] = useState(false);
  const [showDexModal, setShowDexModal] = useState(false);
  const [dexSellAmount, setDexSellAmount] = useState('');
  const [dexSlippage, setDexSlippage] = useState(1); // percent
  const [dexQuote, setDexQuote] = useState(null);
  const [dexQuoting, setDexQuoting] = useState(false);
  const [dexExecuting, setDexExecuting] = useState(false);
  const [dexTxPreview, setDexTxPreview] = useState(null);
  const [useUniswap, setUseUniswap] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [modalTokenId, setModalTokenId] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Build token list from registry for selected network
  const networkKey = getNetworkKey();
  const registryTokens = tokenRegistry.registry[getNetworkKey()] || {};
  const tokens = Object.keys(registryTokens).map((sym) => ({
    symbol: sym,
    name: registryTokens[sym].name || sym,
    icon: '',
    balance: 0,
  }));

  // Ensure selected tokens exist in registry; fall back to first two
  useEffect(() => {
    const symbols = tokens.map(t => t.symbol);
    if (symbols.length === 0) return;
    setSwapData(prev => ({
      ...prev,
      fromToken: symbols.includes(prev.fromToken) ? prev.fromToken : symbols[0],
      toToken: symbols.includes(prev.toToken) ? prev.toToken : symbols[1] || symbols[0],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNetwork]);

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
    if (!selectedMarket) return;
    
    const loadChartData = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call to CoinGecko, CoinMarketCap, or Binance API
        // For now, we'll show empty state until real API is implemented
        setChartData(defaultChartData);
        setPriceData({
          [selectedMarket.base]: { price: selectedMarket.price, change24h: selectedMarket.change24h },
          [selectedMarket.quote]: { price: 1, change24h: 0 },
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setChartData(defaultChartData);
        setPriceData({});
        setLoading(false);
      }
    };

    loadChartData();
  }, [selectedMarket, timeframe]);

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

  // DEX (0x) Quote & Execution
  const handleGetDexQuote = async () => {
    if (!address) return toast.error('Connect wallet to get a quote');
    if (!dexSellAmount || isNaN(dexSellAmount) || Number(dexSellAmount) <= 0) return toast.error('Enter a valid amount');

    setDexQuoting(true);
    setDexQuote(null);
    try {
      const sellToken = swapData.fromToken; // symbol like ETH, USDT
      const buyToken = swapData.toToken;
      const taker = address;
      const networkKey = getNetworkKey();
      let quote;
      if (useUniswap) {
        const resolvedIn = tokenRegistry.resolve(sellToken, networkKey);
        const resolvedOut = tokenRegistry.resolve(buyToken, networkKey);
        const tokenInAddr = resolvedIn?.address || sellToken;
        const tokenOutAddr = resolvedOut?.address || buyToken;
        const provider = window.ethereum ? new ethers.providers.Web3Provider(window.ethereum) : null;
        const quoteUniswap = await uniswapService.getUniswapQuoteAndTx(provider, address, tokenInAddr, tokenOutAddr, dexSellAmount, dexSlippage, 3000, networkKey);
        quote = quoteUniswap;
        setDexQuote(quoteUniswap);
        setDexTxPreview({
          to: quoteUniswap.txRequest.to,
          value: quoteUniswap.txRequest.value || '0',
          dataSize: quoteUniswap.txRequest.data ? quoteUniswap.txRequest.data.length : 0,
          estimatedGas: quoteUniswap.amountOutRaw ? null : null,
        });
      } else {
        const quote0x = await swapService.get0xQuote(sellToken, buyToken, dexSellAmount, taker, dexSlippage, networkKey);
        quote = quote0x;
        setDexQuote(quote0x);
        setDexTxPreview({
          to: quote0x.to,
          value: quote0x.value || '0',
          dataSize: quote0x.data ? quote0x.data.length : 0,
          estimatedGas: quote0x.estimatedGas || quote0x.gas || null,
        });
      }

      toast.success('Quote retrieved. Review preview and execute if happy.');
    } catch (err) {
      console.error('DEX quote error', err);
      toast.error('Failed to retrieve quote: ' + (err?.message || err));
    } finally {
      setDexQuoting(false);
    }
  };

  const handleExecuteDexSwap = async () => {
    if (!dexQuote) return toast.error('No quote available');
    setDexExecuting(true);
    const loadingId = 'dex-exec';
    toast.loading('Executing swap on-chain...', { id: loadingId });
    try {
      if (!window.ethereum) throw new Error('No injected web3 provider');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Ensure approvals and execute via chosen provider
      let tx;
      if (useUniswap) {
        // uniswap service expects quote object returned from getUniswapQuoteAndTx
        dexQuote.tokenIn = dexQuote.tokenIn || null;
        tx = await uniswapService.executeUniswapSwap({ ...dexQuote, tokenIn: dexQuote.tokenIn }, signer);
      } else {
        tx = await swapService.executeSwap(dexQuote, signer);
      }
      toast.success('Swap transaction submitted. Waiting for confirmation...', { id: loadingId });
      await tx.wait();
      toast.success('Swap confirmed');
      setShowDexModal(false);
      setDexQuote(null);
      setDexSellAmount('');
      setDexTxPreview(null);
    } catch (err) {
      console.error('DEX execute error', err);
      toast.error('Swap execution failed: ' + (err?.message || err), { id: 'dex-exec' });
    } finally {
      setDexExecuting(false);
      toast.remove('dex-exec');
    }
  };

  // Helper to get network key for smartContractService (lowercase)
  const getNetworkKey = () => (selectedNetwork?.name || 'ethereum').toLowerCase();

  // List NFT on marketplace
  const handleListSubmit = async () => {
    if (!address) return toast.error('Connect your wallet first');
    if (!modalTokenId) return toast.error('Enter token/item id');
    if (!modalPrice || isNaN(modalPrice) || Number(modalPrice) <= 0) return toast.error('Enter a valid price');

    const networkKey = getNetworkKey();
    setActionInProgress(true);
    const loadingId = 'list';
    toast.loading('Listing NFT on-chain...', { id: loadingId });

    try {
      const priceWei = ethers.utils.parseUnits(modalPrice.toString(), 'ether');
      const result = await smartContractService.listNFT(networkKey, modalTokenId, priceWei);
      if (!result || !result.success) throw new Error(result?.error || 'Listing transaction failed');

      // Update backend record to mark as listed
      try {
        await nftAPI.editSingleNft(networkKey, modalTokenId, { currentlyListed: true, price: modalPrice });
      } catch (err) {
        console.warn('Failed to update backend after listing:', err.message || err);
      }

      toast.success('NFT listed successfully', { id: loadingId });
      setShowListModal(false);
      setModalTokenId('');
      setModalPrice('');
    } catch (error) {
      console.error('List error:', error);
      toast.error(`Listing failed: ${error.message || error}` , { id: 'list' });
    } finally {
      setActionInProgress(false);
    }
  };

  // Buy NFT from marketplace
  const handleBuySubmit = async () => {
    if (!address) return toast.error('Connect your wallet first');
    if (!modalTokenId) return toast.error('Enter token/item id');
    if (!modalPrice || isNaN(modalPrice) || Number(modalPrice) <= 0) return toast.error('Enter a valid price');

    const networkKey = getNetworkKey();
    setActionInProgress(true);
    const loadingId = 'buy';
    toast.loading('Processing purchase on-chain...', { id: loadingId });

    try {
      const priceWei = ethers.utils.parseUnits(modalPrice.toString(), 'ether');
      const result = await smartContractService.buyNFT(networkKey, modalTokenId, { value: priceWei });
      if (!result || !result.success) throw new Error(result?.error || 'Buy transaction failed');

      // Update backend owner (skip for lazy-mint; those are updated only via confirm-redemption)
      try {
        const isLazyMintId = /^[a-fA-F0-9]{24}$/.test(String(modalTokenId ?? ''));
        if (!isLazyMintId) {
          await nftAPI.updateNftOwner({ network: networkKey, itemId: modalTokenId, tokenId: modalTokenId, newOwner: address, listed: false });
        }
      } catch (err) {
        console.warn('Failed to update backend after purchase:', err.message || err);
      }

      toast.success('Purchase successful', { id: loadingId });
      setShowBuyModal(false);
      setModalTokenId('');
      setModalPrice('');
    } catch (error) {
      console.error('Buy error:', error);
      toast.error(`Purchase failed: ${error.message || error}`, { id: loadingId });
    } finally {
      setActionInProgress(false);
    }
  };

  const selectedToken = tokens.find(t => t.symbol === swapData.fromToken);
  const priceChange = priceData[swapData.fromToken]?.change24h || null;
  const currentPrice = priceData[swapData.fromToken]?.price || null;

  // Derived DEX quote display values
  let dexSellDisplay = null;
  let dexBuyDisplay = null;
  let dexPriceDisplay = null;
  if (dexQuote) {
    try {
      if (dexQuote._sellResolved) {
        const sellDecimals = dexQuote._sellResolved.decimals || 18;
        const buyDecimals = dexQuote._buyResolved?.decimals || 18;
        const sellRaw = dexQuote.sellAmount || dexQuote.sellAmountBase || dexQuote.amountInRaw || '0';
        const buyRaw = dexQuote.buyAmount || dexQuote.toAmount || dexQuote.amountOutRaw || '0';
        dexSellDisplay = ethers.utils.formatUnits(String(sellRaw), sellDecimals);
        dexBuyDisplay = ethers.utils.formatUnits(String(buyRaw), buyDecimals);
        dexPriceDisplay = dexQuote.price || (Number(dexBuyDisplay) && Number(dexSellDisplay) ? (Number(dexBuyDisplay) / Number(dexSellDisplay)) : null);
      } else if (dexQuote.amountInRaw) {
        // Uniswap style
        const sellDecimals = dexQuote.resolvedIn?.decimals || 18;
        const buyDecimals = dexQuote.resolvedOut?.decimals || 18;
        dexSellDisplay = ethers.utils.formatUnits(String(dexQuote.amountInRaw), sellDecimals);
        dexBuyDisplay = ethers.utils.formatUnits(String(dexQuote.amountOutRaw), buyDecimals);
        dexPriceDisplay = dexQuote.price || (Number(dexBuyDisplay) && Number(dexSellDisplay) ? (Number(dexBuyDisplay) / Number(dexSellDisplay)) : null);
      }
    } catch (e) {
      // ignore formatting errors
    }
  }

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
              {/* List / Buy Buttons */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => setShowListModal(true)}
                  className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-semibold"
                >
                  List on Marketplace
                </button>
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                >
                  Buy from Marketplace
                </button>
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
              {/* Advanced DEX Swap */}
              <div className="mt-3">
                <button
                  onClick={() => setShowDexModal(true)}
                  disabled={!address}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-display font-semibold py-3 rounded-lg transition-all"
                >
                  {address ? 'Advanced DEX Swap (0x Quote)' : 'Connect Wallet to Use DEX'}
                </button>
              </div>
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
      {/* DEX Swap Modal */}
      {showDexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-lg">
            <h3 className="font-display text-lg font-bold mb-2">Advanced DEX Swap (0x)</h3>
            <p className="text-sm text-gray-400 mb-4">Get a 0x quote, preview the transaction, and execute the swap on-chain.</p>

            <label className="text-sm text-gray-300">Sell Amount ({swapData.fromToken})</label>
            <input value={dexSellAmount} onChange={(e) => setDexSellAmount(e.target.value)} className="w-full p-2 my-2 bg-gray-800 rounded" placeholder="0.0" />

            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-gray-300">Slippage %</label>
              <input type="number" value={dexSlippage} onChange={(e) => setDexSlippage(Number(e.target.value))} className="w-20 p-2 bg-gray-800 rounded" />
              <button onClick={handleGetDexQuote} disabled={dexQuoting || !dexSellAmount} className="ml-auto px-3 py-2 bg-blue-600 rounded">{dexQuoting ? 'Quoting...' : 'Get Quote'}</button>
            </div>

            {dexQuote && (
              <div className="bg-gray-800 p-3 rounded mb-3">
                <div className="text-sm text-gray-300 mb-2">Quote Summary</div>
                <div className="text-white text-sm">Sell: {dexSellDisplay ?? (swapData.fromAmount || 'N/A')} {swapData.fromToken}</div>
                <div className="text-white text-sm">Buy (estimated): {dexBuyDisplay ?? (dexQuote.toAmount || 'N/A')} {swapData.toToken}</div>
                <div className="text-white text-sm">Price: {dexPriceDisplay ?? (dexQuote.price || 'N/A')}</div>
                <div className="text-sm text-gray-400">Estimated Gas: {dexQuote.estimatedGas || dexQuote.gas || 'N/A'}</div>
                <div className="text-sm text-gray-400">Allowance Target: {dexQuote.allowanceTarget || dexQuote.router || 'N/A'}</div>
              </div>
            )}

            {dexTxPreview && (
              <div className="bg-gray-800 p-3 rounded mb-3">
                <div className="text-sm text-gray-300 mb-2">Transaction Preview</div>
                <div className="text-white text-sm">To: {dexTxPreview.to}</div>
                <div className="text-white text-sm">Value: {dexTxPreview.value ? ethers.utils.formatEther(dexTxPreview.value.toString()) : '0'} ETH</div>
                <div className="text-sm text-gray-400">Data size: {dexTxPreview.dataSize} bytes</div>
                <div className="text-sm text-gray-400">Estimated Gas: {dexTxPreview.estimatedGas || 'N/A'}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowDexModal(false); setDexQuote(null); setDexTxPreview(null); }} className="px-3 py-2 bg-gray-700 rounded">Close</button>
              <button onClick={handleExecuteDexSwap} disabled={dexExecuting || !dexQuote} className="px-3 py-2 bg-green-600 rounded font-semibold">{dexExecuting ? 'Executing...' : 'Execute Swap'}</button>
            </div>
          </div>
        </div>
      )}

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="font-display text-lg font-bold mb-2">List NFT on Marketplace</h3>
            <p className="text-sm text-gray-400 mb-4">Enter the item ID and price (in native token, e.g., ETH/MATIC).</p>
            <label className="text-sm text-gray-300">Item ID</label>
            <input value={modalTokenId} onChange={(e) => setModalTokenId(e.target.value)} className="w-full p-2 my-2 bg-gray-800 rounded" />
            <label className="text-sm text-gray-300">Price (native)</label>
            <input value={modalPrice} onChange={(e) => setModalPrice(e.target.value)} className="w-full p-2 my-2 bg-gray-800 rounded" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowListModal(false); }} className="px-3 py-2 bg-gray-700 rounded">Cancel</button>
              <button onClick={handleListSubmit} disabled={actionInProgress} className="px-3 py-2 bg-yellow-600 rounded font-semibold">{actionInProgress ? 'Listing...' : 'List'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="font-display text-lg font-bold mb-2">Buy NFT</h3>
            <p className="text-sm text-gray-400 mb-4">Enter the item ID and price (in native token) to purchase.</p>
            <label className="text-sm text-gray-300">Item ID</label>
            <input value={modalTokenId} onChange={(e) => setModalTokenId(e.target.value)} className="w-full p-2 my-2 bg-gray-800 rounded" />
            <label className="text-sm text-gray-300">Price (native)</label>
            <input value={modalPrice} onChange={(e) => setModalPrice(e.target.value)} className="w-full p-2 my-2 bg-gray-800 rounded" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowBuyModal(false); }} className="px-3 py-2 bg-gray-700 rounded">Cancel</button>
              <button onClick={handleBuySubmit} disabled={actionInProgress} className="px-3 py-2 bg-green-600 rounded font-semibold">{actionInProgress ? 'Buying...' : 'Buy'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenTradingChart;

