import { io } from 'socket.io-client';

/** Derive socket server URL: use VITE_SOCKET_URL, else same host as VITE_API_BASE_URL (strip /api/v1), else localhost. */
function getSocketServerUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit && typeof explicit === 'string' && (explicit.startsWith('http://') || explicit.startsWith('https://'))) {
    return explicit.replace(/\/+$/, '');
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && typeof apiBase === 'string') {
    const base = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') || apiBase;
    return base.startsWith('http') ? base : `https://${base}`;
  }
  if (typeof window !== 'undefined' && window.location) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:3000' : `${window.location.protocol}//${window.location.hostname}`;
  }
  return 'http://localhost:3000';
}

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this._connectErrorLogged = false;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 2;
  }

  // Connect to Socket.io server
  connect(serverUrl) {
    const resolvedUrl = serverUrl || getSocketServerUrl();

    // Don't attempt connection if already connected
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // After too many failures, don't keep trying (avoids console spam)
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      return this.socket || null;
    }

    // Convert to HTTPS/WSS for production if page is HTTPS
    let healthCheckUrl = resolvedUrl;
    let socketUrl = resolvedUrl;

    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (resolvedUrl.startsWith('http://')) {
        healthCheckUrl = resolvedUrl.replace('http://', 'https://');
        socketUrl = healthCheckUrl;
      }
      if (socketUrl.startsWith('https://')) {
        socketUrl = socketUrl.replace('https://', 'wss://');
      }
    }

    // Check if backend server is running before attempting connection
    this.isBackendAvailable(healthCheckUrl).then(isAvailable => {
      if (!isAvailable) {
        if (!this._connectErrorLogged) {
          this._connectErrorLogged = true;
          console.warn('[Socket] Backend not available at', healthCheckUrl, '– real-time features disabled.');
        }
        return null;
      }

      try {
        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 8000,
          forceNew: true,
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 2,
          reconnectionDelay: 3000,
          reconnectionDelayMax: 8000,
        });

        this.socket.on('connect', () => {
          this._connectErrorLogged = false;
          this._reconnectAttempts = 0;
          this.isConnected = true;
          this.emit('socket_connected', { socketId: this.socket.id });
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          this.emit('socket_disconnected', { reason });
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false;
          this._reconnectAttempts++;
          if (!this._connectErrorLogged) {
            this._connectErrorLogged = true;
            console.warn('[Socket] Connection failed – real-time features disabled. Set VITE_SOCKET_URL to your backend if needed.');
          }
          this.emit('socket_error', { error: error.message });
        });

        this.socket.connect();
        return this.socket;
      } catch (error) {
        if (!this._connectErrorLogged) {
          this._connectErrorLogged = true;
          console.warn('[Socket] Init failed:', error.message);
        }
        return null;
      }
    }).catch(() => {
      if (!this._connectErrorLogged) {
        this._connectErrorLogged = true;
        console.warn('[Socket] Backend check failed – real-time features disabled.');
      }
      return null;
    });

    return this.socket;
  }

  // Check if backend server is available
  async isBackendAvailable(serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        timeout: 3000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  // Listen to events from server
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Join a room/channel
  joinRoom(roomId) {
    this.emit('join_room', { roomId });
  }

  // Leave a room/channel
  leaveRoom(roomId) {
    this.emit('leave_room', { roomId });
  }

  // Send chat message
  sendMessage(roomId, message, userInfo) {
    this.emit('send_message', {
      roomId,
      message,
      userInfo,
      timestamp: new Date().toISOString()
    });
  }

  // Listen for chat messages
  onMessage(callback) {
    this.on('new_message', callback);
  }

  // Listen for NFT minting events
  onNFTMinted(callback) {
    this.on('nft_minted', callback);
  }

  // Listen for NFT listing events
  onNFTListed(callback) {
    this.on('nft_listed', callback);
  }

  // Listen for NFT sold events
  onNFTSold(callback) {
    this.on('nft_sold', callback);
  }

  // Listen for user activity
  onUserActivity(callback) {
    this.on('user_activity', callback);
  }

  // Listen for live minting updates
  onLiveMintingUpdate(callback) {
    this.on('live_minting_update', callback);
  }

  // Listen for trending collections updates
  onTrendingUpdate(callback) {
    this.on('trending_update', callback);
  }

  // Send user activity
  sendUserActivity(activity) {
    this.emit('user_activity', {
      ...activity,
      timestamp: new Date().toISOString()
    });
  }

  // Game rooms (multiplayer)
  createGameRoom(gameType = 'dice', playerInfo, callback) {
    if (!this.socket) return;
    this.socket.emit('game_create_room', { gameType, ...playerInfo }, callback);
  }

  joinGameRoom(roomCode, gameType = 'dice', playerInfo, callback) {
    if (!this.socket) return;
    this.socket.emit('game_join_room', { roomCode: String(roomCode).toUpperCase().trim(), gameType, ...playerInfo }, callback);
  }

  leaveGameRoom() {
    this.emit('game_leave_room');
  }

  submitDiceBet(choice, target, bet) {
    this.emit('game_submit_bet', { choice, target, bet });
  }

  startDiceRound() {
    this.emit('game_start_round');
  }

  emitGameAction(payload) {
    this.emit('game_action', payload);
  }

  onGameBroadcast(callback) {
    this.on('game_broadcast', callback);
  }

  onGamePlayersUpdated(callback) {
    this.on('game_players_updated', callback);
  }

  onRoundStart(callback) {
    this.on('round_start', callback);
  }

  onRoundResult(callback) {
    this.on('round_result', callback);
  }

  onRoundNext(callback) {
    this.on('round_next', callback);
  }

  onGameBetPlaced(callback) {
    this.on('game_bet_placed', callback);
  }

  onGameRoomJoined(callback) {
    this.on('game_room_joined', callback);
  }

  onGameRoomLeft(callback) {
    this.on('game_room_left', callback);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  // Cleanup all listeners
  cleanup() {
    if (this.socket) {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

