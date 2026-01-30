import { useState, useEffect, useRef, useContext } from 'react';
import { ICOContent } from '../Context';
import socketService from '../services/socketService';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Shared hook for multiplayer room (create/join by code, players list, activity feed).
 * Use for Spin the Wheel, Slots, Blackjack, Roulette, Dice (single-player page).
 * Backend: game_create_room, game_join_room (by code), game_players_updated, game_action (broadcast).
 */
export function useGameRoom(gameType = 'wheel') {
  const { address } = useContext(ICOContent) || {};
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [username, setUsername] = useState('Player');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const mounted = useRef(true);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    userAPI.getUserProfile(address).then((data) => {
      if (!cancelled && data) {
        setUsername(data.username || data.displayName || 'Player');
        setAvatarUrl(data.image || data.avatar || null);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [address]);

  useEffect(() => {
    const socket = socketService.connect();
    if (!socket) return;

    const onPlayers = (data) => {
      if (mounted.current) setPlayers(data?.players || []);
    };
    const onBroadcast = (data) => {
      if (!mounted.current || !data?.type) return;
      if (data.type === 'game_result') {
        setActivityFeed((prev) => [
          { id: Date.now() + Math.random(), ...data, timestamp: data.timestamp || new Date().toISOString() },
          ...prev.slice(0, 49),
        ]);
      }
    };
    const onLeft = (data) => {
      setPlayers((p) => p.filter((x) => x.socketId !== data?.socketId));
    };

    socketService.onGamePlayersUpdated(onPlayers);
    socketService.onGameBroadcast(onBroadcast);
    socketService.onGameRoomLeft(onLeft);

    return () => {
      socketService.off('game_players_updated', onPlayers);
      socketService.off('game_broadcast', onBroadcast);
      socketService.off('game_room_left', onLeft);
      if (joinedRef.current) socketService.leaveGameRoom();
    };
  }, []);

  useEffect(() => {
    if (!joined) {
      setRoomCode('');
      setPlayers([]);
      setActivityFeed([]);
    }
  }, [joined]);

  const createRoom = (onDone) => {
    socketService.createGameRoom(gameType, { username, avatarUrl, wallet: address }, (res) => {
      if (res?.success && res?.roomCode) {
        setRoomCode(res.roomCode);
        setJoined(true);
        if (onDone) onDone();
      } else {
        toast.error(res?.error || 'Could not create room');
      }
    });
  };

  const joinRoom = (code, onDone) => {
    const c = String(code || joinCode).toUpperCase().trim();
    if (!c) {
      toast.error('Enter a room code');
      return;
    }
    socketService.joinGameRoom(c, gameType, { username, avatarUrl, wallet: address }, (res) => {
      if (res?.success) {
        setRoomCode(res.roomCode);
        setJoined(true);
        if (onDone) onDone();
      } else {
        toast.error(res?.error || 'Could not join room');
      }
    });
  };

  const leaveRoom = () => {
    socketService.leaveGameRoom();
    setJoined(false);
    setRoomCode('');
    setPlayers([]);
    setActivityFeed([]);
  };

  const emitResult = (result) => {
    if (!joined) return;
    socketService.emitGameAction({
      type: 'game_result',
      game: gameType,
      username,
      avatarUrl,
      ...result,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    roomCode,
    setRoomCode,
    joinCode,
    setJoinCode,
    joined,
    players,
    activityFeed,
    username,
    avatarUrl,
    createRoom,
    joinRoom,
    leaveRoom,
    emitResult,
  };
}
