import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Connect to Socket.io server
  connect(serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000') {
    // Don't attempt connection if already connected
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Convert to HTTPS/WSS for production if page is HTTPS
    let healthCheckUrl = serverUrl;
    let socketUrl = serverUrl;
    
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (serverUrl.startsWith('http://')) {
        healthCheckUrl = serverUrl.replace('http://', 'https://');
        socketUrl = serverUrl.replace('http://', 'https://');
      }
      // Ensure socket URL uses wss:// for HTTPS pages
      if (socketUrl.startsWith('https://')) {
        socketUrl = socketUrl.replace('https://', 'wss://');
      }
    }

    // Check if backend server is running before attempting connection
    this.isBackendAvailable(healthCheckUrl).then(isAvailable => {
      if (!isAvailable) {
        console.warn('Backend server not available, skipping socket connection');
        return null;
      }

      try {
        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
          forceNew: true,
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000
        });

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket.id);
          this.isConnected = true;
          this.emit('socket_connected', { socketId: this.socket.id });
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.isConnected = false;
          this.emit('socket_disconnected', { reason });
        });

        this.socket.on('connect_error', (error) => {
          console.warn('Socket connection error:', error.message);
          this.isConnected = false;
          this.emit('socket_error', { error: error.message });
        });

        // Attempt connection
        this.socket.connect();
        return this.socket;
      } catch (error) {
        console.warn('Failed to initialize socket:', error.message);
        return null;
      }
    }).catch(() => {
      console.warn('Backend availability check failed');
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

