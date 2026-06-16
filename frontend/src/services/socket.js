import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

let socket = null;

export function getSocket() {
  if (!socket) {
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });
      // Log connection errors silently (don't block operations)
      socket.on('connect_error', (error) => {
        console.warn('[Socket] Connection error:', error.message, '— operations will continue without real-time updates');
      });
    } catch (err) {
      console.warn('[Socket] Failed to initialize:', err.message);
      return null;
    }
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    try { socket.disconnect(); } catch (e) {}
    socket = null;
  }
}

export default getSocket;
