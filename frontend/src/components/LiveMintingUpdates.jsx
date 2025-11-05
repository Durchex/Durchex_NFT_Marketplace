import React, { useState, useEffect, useContext } from 'react';
import { ICOContent } from '../Context';
import socketService from '../services/socketService';
import { FiTrendingUp, FiClock, FiUsers, FiZap, FiEye } from 'react-icons/fi';

const LiveMintingUpdates = () => {
  const { address } = useContext(ICOContent);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [trendingCollections, setTrendingCollections] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    totalMints: 0,
    activeUsers: 0,
    trendingCount: 0
  });

  useEffect(() => {
    // Initialize socket connection with error handling
    const initializeSocket = async () => {
      try {
        const socket = socketService.connect();
        
        if (socket) {
          setIsConnected(true);
          
          // Listen for live minting updates
          socketService.onLiveMintingUpdate((data) => {
            setLiveUpdates(prev => [data, ...prev].slice(0, 10)); // Keep last 10 updates
            
            // Update stats
            setStats(prev => ({
              ...prev,
              totalMints: prev.totalMints + 1
            }));
          });

          // Listen for trending updates
          socketService.onTrendingUpdate((data) => {
            setTrendingCollections(prev => {
              const existing = prev.find(c => c.name === data.collection);
              if (existing) {
                return prev.map(c => 
                  c.name === data.collection 
                    ? { ...c, volume: data.volume, change: data.change }
                    : c
                );
              } else {
                return [{ ...data, id: Date.now() }, ...prev].slice(0, 5);
              }
            });
          });

          // Listen for user activity
          socketService.onUserActivity((data) => {
            if (data.type === 'nft_minted') {
              setStats(prev => ({
                ...prev,
                activeUsers: prev.activeUsers + 1
              }));
            }
          });

          // Listen for connection status
          socketService.on('socket_connected', () => {
            setIsConnected(true);
          });

          socketService.on('socket_disconnected', () => {
            setIsConnected(false);
          });

          socketService.on('socket_error', (error) => {
            console.warn('Socket error:', error);
            setIsConnected(false);
          });
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.warn('Failed to initialize socket connection:', error);
        setIsConnected(false);
      }
    };

    initializeSocket();

    // Load initial data from localStorage
    loadInitialData();

    return () => {
      socketService.cleanup();
    };
  }, []);

  const loadInitialData = () => {
    // Load saved updates
    const savedUpdates = JSON.parse(localStorage.getItem('liveMintingUpdates') || '[]');
    setLiveUpdates(savedUpdates);

    // Load saved trending collections
    const savedTrending = JSON.parse(localStorage.getItem('trendingCollections') || '[]');
    setTrendingCollections(savedTrending);

    // Load saved stats
    const savedStats = JSON.parse(localStorage.getItem('mintingStats') || '{}');
    setStats(prev => ({ 
      ...prev, 
      ...savedStats,
      totalMints: savedStats.totalMints || 0,
      activeUsers: savedStats.activeUsers || 0,
      trendingCount: savedStats.trendingCount || 0
    }));
  };

  const saveData = () => {
    localStorage.setItem('liveMintingUpdates', JSON.stringify(liveUpdates));
    localStorage.setItem('trendingCollections', JSON.stringify(trendingCollections));
    localStorage.setItem('mintingStats', JSON.stringify(stats));
  };

  useEffect(() => {
    saveData();
  }, [liveUpdates, trendingCollections, stats]);

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff / 1000);

    if (minutes < 1) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getTrendingIcon = (change) => {
    if (change > 0) return <FiTrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <FiTrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <FiTrendingUp className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <FiZap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Live Minting</h2>
            <p className="text-gray-400 font-display text-sm">Real-time NFT activity</p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-display text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="text-2xl font-display font-bold text-blue-400">{stats.totalMints}</div>
          <div className="text-sm text-gray-400 font-display">Total Mints</div>
        </div>
        <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="text-2xl font-display font-bold text-green-400">{stats.activeUsers}</div>
          <div className="text-sm text-gray-400 font-display">Active Users</div>
        </div>
        <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <div className="text-2xl font-display font-bold text-purple-400">{trendingCollections.length}</div>
          <div className="text-sm text-gray-400 font-display">Trending</div>
        </div>
      </div>

      {/* Live Updates */}
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
          {liveUpdates.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-display">
              <FiEye className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p>No recent minting activity</p>
              <p className="text-xs mt-1">Activity will appear here when users mint NFTs</p>
            </div>
          ) : (
            liveUpdates.map((update, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-display font-medium text-white">
                    {update.collection} minted
                  </p>
                  <p className="text-xs text-gray-400 font-display">
                    {update.mintCount} new NFTs
                  </p>
                </div>
                <div className="text-xs text-gray-500 font-display">
                  {formatTime(update.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Collections */}
      <div>
        <h3 className="text-lg font-display font-semibold text-white mb-4">Trending Collections</h3>
        <div className="space-y-3">
          {trendingCollections.length === 0 ? (
            <div className="text-center py-8 text-gray-400 font-display">
              <FiUsers className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p>No trending collections yet</p>
              <p className="text-xs mt-1">Collections will appear here as they gain popularity</p>
            </div>
          ) : (
            trendingCollections.map((collection) => (
              <div key={collection.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-display font-medium text-white">{collection.name}</p>
                    <p className="text-sm text-gray-400 font-display">{collection.volume} volume</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendingIcon(collection.change)}
                  <span className={`text-sm font-display font-medium ${
                    collection.change > 0 ? 'text-green-400' : 
                    collection.change < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {collection.change > 0 ? '+' : ''}{collection.change}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-sm text-gray-400 font-display">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Live updates enabled</span>
        </div>
      </div>
    </div>
  );
};

export default LiveMintingUpdates;
