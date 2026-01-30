import React, { useState, useEffect, useRef, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Dices, Users, LogIn, Copy, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import NeonBorder from '../../components/games/NeonBorder';
import socketService from '../../services/socketService';
import { userAPI } from '../../services/api';
import '../../styles/casino.css';

const BET_COUNTDOWN_SEC = 10;
const RESULT_COUNTDOWN_SEC = 5;

const MultiplayerDice = () => {
  const { address } = useContext(ICOContent);
  const { gameBalance, setGameBalance } = useGameWallet();
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [roundId, setRoundId] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | betting | result
  const [choice, setChoice] = useState('over');
  const [target, setTarget] = useState(4);
  const [bet, setBet] = useState(10);
  const [myBetPlaced, setMyBetPlaced] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [roundResults, setRoundResults] = useState(null);
  const [popupResult, setPopupResult] = useState(null); // { won, amount } or { lost, amount }
  const [activityFeed, setActivityFeed] = useState([]);
  const [username, setUsername] = useState('Player');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const countdownRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch profile for username/avatar
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

  // Connect socket and listeners
  useEffect(() => {
    const socket = socketService.connect();
    socketRef.current = socket;
    if (!socket) return;

    const onPlayers = (data) => setPlayers(data?.players || []);
    const onRoundStart = (data) => {
      setRoundId(data?.roundId || null);
      setPhase('betting');
      setMyBetPlaced(false);
      setDiceResult(null);
      setRoundResults(null);
      setPopupResult(null);
      const end = data?.countdownEnd || Date.now() + BET_COUNTDOWN_SEC * 1000;
      const tick = () => {
        const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        setCountdown(left);
        if (left > 0) countdownRef.current = setTimeout(tick, 500);
      };
      tick();
    };
    const onRoundResult = (data) => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
      setCountdown(null);
      setPhase('result');
      setDiceResult(data?.diceValue ?? null);
      setRoundResults(data?.results || []);
      const myResult = (data?.results || []).find((r) => r.socketId === socketService.getConnectionStatus()?.socketId);
      if (myResult) {
        setPopupResult(myResult.won ? { won: true, amount: myResult.amount - (myResult.bet || 0) } : myResult.push ? { push: true } : { lost: true, amount: myResult.bet || 0 });
        const delta = myResult.won ? (myResult.amount - (myResult.bet || 0)) : myResult.push ? 0 : -(myResult.bet || 0);
        setGameBalance((prev) => prev + delta);
      }
      setActivityFeed((prev) => [
        ...(data?.results || []).map((r) => ({
          id: Date.now() + Math.random(),
          username: r.username,
          won: r.won,
          push: r.push,
          amount: r.amount,
          bet: r.bet,
        })),
        ...prev.slice(0, 30),
      ]);
      setCountdown(RESULT_COUNTDOWN_SEC);
      const t = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(t);
            return null;
          }
          return c - 1;
        });
      }, 1000);
    };
    const onRoundNext = () => {
      setPhase('idle');
      setPopupResult(null);
      setCountdown(null);
      setRoundId(null);
    };
    const onRoomLeft = (data) => setPlayers((p) => p.filter((x) => x.socketId !== data?.socketId));

    socketService.onGamePlayersUpdated(onPlayers);
    socketService.onRoundStart(onRoundStart);
    socketService.onRoundResult(onRoundResult);
    socketService.onRoundNext(onRoundNext);
    socketService.onGameRoomLeft(onRoomLeft);

    return () => {
      socketService.off('game_players_updated', onPlayers);
      socketService.off('round_start', onRoundStart);
      socketService.off('round_result', onRoundResult);
      socketService.off('round_next', onRoundNext);
      socketService.off('game_room_left', onRoomLeft);
      if (countdownRef.current) clearTimeout(countdownRef.current);
      if (joined) socketService.leaveGameRoom();
    };
  }, []);

  useEffect(() => {
    if (joined) return;
    setPlayers([]);
    setRoomCode('');
    setPhase('idle');
    setRoundId(null);
    setPopupResult(null);
    setActivityFeed([]);
  }, [joined]);

  const handleCreateRoom = () => {
    socketService.createGameRoom('dice', { username, avatarUrl, wallet: address }, (res) => {
      if (res?.success && res?.roomCode) {
        setRoomCode(res.roomCode);
        setJoined(true);
        setIsHost(true);
        toast.success('Room created! Share the code.');
      } else {
        toast.error(res?.error || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error('Enter room code');
      return;
    }
    socketService.joinGameRoom(code, 'dice', { username, avatarUrl, wallet: address }, (res) => {
      if (res?.success) {
        setRoomCode(res.roomCode);
        setJoined(true);
        setIsHost(false);
        toast.success('Joined room!');
      } else {
        toast.error(res?.error || 'Room not found');
      }
    });
  };

  const handleLeave = () => {
    socketService.leaveGameRoom();
    setJoined(false);
    setRoomCode('');
    setPlayers([]);
    setIsHost(false);
    setPhase('idle');
    setPopupResult(null);
    setActivityFeed([]);
    toast('Left room');
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const handleStartRound = () => {
    if (gameBalance < bet) {
      toast.error('Not enough balance');
      return;
    }
    socketService.startDiceRound();
  };

  const handleSubmitBet = () => {
    if (phase !== 'betting' || myBetPlaced || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    socketService.submitDiceBet(choice, target, bet);
    setMyBetPlaced(true);
    toast.success('Bet placed!');
  };

  return (
    <CasinoLayout
      title="Multiplayer Dice"
      subtitle="Create or join a room. Sessions run with countdown — choose Over or Under, then the dice rolls for everyone."
      icon={Dices}
      themeColor="cyan"
      gameBalance={gameBalance}
    >
      <NeonBorder color="cyan">
        <div className="flex flex-col gap-6">
          {!joined ? (
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
              <div className="bg-black/40 rounded-xl border border-cyan-500/30 p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Create room</h3>
                <p className="text-gray-400 text-sm mb-4">Create a room and share the code with friends.</p>
                <button
                  onClick={handleCreateRoom}
                  className="casino-btn w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl"
                >
                  <Play size={20} /> Create room
                </button>
              </div>
              <div className="bg-black/40 rounded-xl border border-cyan-500/30 p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Join room</h3>
                <p className="text-gray-400 text-sm mb-2">Enter the 6-character room code.</p>
                <input
                  type="text"
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="w-full mb-3 px-4 py-3 bg-black/50 border border-cyan-500/40 rounded-xl text-white font-mono text-center text-lg uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  className="casino-btn w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl"
                >
                  <LogIn size={20} /> Join
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                    <span className="text-cyan-400 font-mono font-bold text-lg">{roomCode}</span>
                    <button onClick={handleCopyCode} className="p-1 rounded hover:bg-cyan-500/30" title="Copy">
                      <Copy size={18} className="text-cyan-300" />
                    </button>
                  </div>
                  <span className="text-gray-400 text-sm">Share this code to invite others</span>
                </div>
                <button onClick={handleLeave} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                  Leave
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {phase === 'betting' && (
                    <div className="bg-black/40 rounded-xl border border-cyan-500/30 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-cyan-400 font-semibold">Place your bet</h3>
                        {countdown != null && (
                          <span className="text-2xl font-bold text-white tabular-nums">{countdown}s</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setChoice('over')}
                            disabled={myBetPlaced}
                            className={`px-4 py-2 rounded-lg font-semibold ${choice === 'over' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                          >
                            Over
                          </button>
                          <button
                            type="button"
                            onClick={() => setChoice('under')}
                            disabled={myBetPlaced}
                            className={`px-4 py-2 rounded-lg font-semibold ${choice === 'under' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                          >
                            Under
                          </button>
                        </div>
                        <select
                          value={target}
                          onChange={(e) => setTarget(Number(e.target.value))}
                          disabled={myBetPlaced}
                          className="bg-gray-800 border border-cyan-500/40 rounded-lg px-3 py-2 text-white"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>Target: {n}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={gameBalance}
                          value={bet}
                          onChange={(e) => setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))}
                          disabled={myBetPlaced}
                          className="w-24 bg-gray-800 border border-cyan-500/40 rounded-lg px-3 py-2 text-white text-center"
                        />
                        <button
                          onClick={handleSubmitBet}
                          disabled={myBetPlaced || gameBalance < bet}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg"
                        >
                          {myBetPlaced ? 'Bet placed' : 'Place bet'}
                        </button>
                      </div>
                    </div>
                  )}

                  {(phase === 'idle' || phase === 'betting') && (
                    <button
                      onClick={handleStartRound}
                      disabled={phase === 'betting' || gameBalance < bet}
                      className="casino-btn w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-xl"
                    >
                      <Play size={22} /> Start round
                    </button>
                  )}

                  {phase === 'result' && (
                    <div className="flex flex-col items-center gap-4">
                      <div
                        className="w-24 h-24 flex items-center justify-center rounded-2xl border-4 border-cyan-500/50 text-4xl font-bold text-cyan-400 bg-gray-900/80"
                      >
                        {diceResult ?? '?'}
                      </div>
                      {countdown != null && countdown > 0 && (
                        <p className="text-gray-400">Next round in {countdown}s</p>
                      )}
                    </div>
                  )}

                  {popupResult && (
                    <div
                      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
                        popupResult.won ? 'bg-emerald-500/20' : popupResult.lost ? 'bg-red-500/20' : 'bg-amber-500/20'
                      }`}
                    >
                      <div
                        className={`rounded-2xl border-2 p-8 text-center shadow-2xl ${
                          popupResult.won
                            ? 'bg-emerald-900/95 border-emerald-400 text-white'
                            : popupResult.lost
                            ? 'bg-red-900/95 border-red-400 text-white'
                            : 'bg-amber-900/95 border-amber-400 text-white'
                        }`}
                      >
                        {popupResult.won && (
                          <>
                            <p className="text-3xl font-bold mb-2">You won!</p>
                            <p className="text-2xl text-emerald-200">+${(popupResult.amount || 0).toFixed(2)}</p>
                          </>
                        )}
                        {popupResult.lost && (
                          <>
                            <p className="text-3xl font-bold mb-2">You lost</p>
                            <p className="text-2xl text-red-200">-${(popupResult.amount || 0).toFixed(2)}</p>
                          </>
                        )}
                        {popupResult.push && (
                          <>
                            <p className="text-3xl font-bold">Push</p>
                            <p className="text-amber-200">Bet returned</p>
                          </>
                        )}
                        {countdown != null && countdown > 0 && (
                          <p className="text-sm opacity-80 mt-4">Closing in {countdown}s</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 rounded-xl border border-cyan-500/30 p-4">
                    <h3 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                      <Users size={18} /> Players ({players.length})
                    </h3>
                    <ul className="space-y-2">
                      {players.length === 0 ? (
                        <li className="text-gray-500 text-sm">No one else yet</li>
                      ) : (
                        players.map((p) => (
                          <li key={p.socketId} className="flex items-center gap-2 py-1.5">
                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                              {p.avatarUrl ? (
                                <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-cyan-400 text-xs font-bold">
                                  {(p.username || 'P')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="text-white font-medium truncate">{p.username || 'Player'}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="bg-black/40 rounded-xl border border-cyan-500/30 p-4 max-h-64 overflow-y-auto">
                    <h3 className="text-cyan-400 font-semibold mb-3">Activity</h3>
                    <ul className="space-y-2 text-sm">
                      {activityFeed.length === 0 ? (
                        <li className="text-gray-500">No activity yet</li>
                      ) : (
                        activityFeed.slice(0, 20).map((a) => (
                          <li key={a.id} className="flex items-center justify-between py-1">
                            <span className="text-gray-300 truncate">{a.username}</span>
                            {a.won && <span className="text-emerald-400 font-semibold">+${(a.amount - (a.bet || 0)).toFixed(2)}</span>}
                            {a.push && <span className="text-amber-400">Push</span>}
                            {!a.won && !a.push && <span className="text-red-400">-${(a.bet || 0).toFixed(2)}</span>}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </NeonBorder>
    </CasinoLayout>
  );
};

export default MultiplayerDice;
