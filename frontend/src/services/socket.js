import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
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
