import React, { useState, useEffect, useRef, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Dices, Users, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import NeonBorder from '../../components/games/NeonBorder';
import socketService from '../../services/socketService';
import '../../styles/casino.css';

const MultiplayerDice = () => {
  const { address } = useContext(ICOContent);
  const { gameBalance, setGameBalance } = useGameWallet();
  const [roomId, setRoomId] = useState('lobby1');
  const [joined, setJoined] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [rolls, setRolls] = useState([]);
  const [bet, setBet] = useState(10);
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const displayName = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : `Player_${socketService.getConnectionStatus()?.socketId?.slice(0, 6) || '?'}`;
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = socketService.connect();
    socketRef.current = socket;
    if (!socket) return;

    const onBroadcast = (data) => {
      const myId = socketService.getConnectionStatus()?.socketId;
      if (data?.type === 'dice_roll' && data?.socketId !== myId) {
        setRolls((prev) => [{ ...data, id: Date.now() + Math.random() }, ...prev.slice(0, 49)]);
      }
    };
    const onJoined = (data) => {
      setPlayerCount(data?.playerCount ?? 0);
    };
    const onLeft = (data) => {
      setPlayerCount(data?.playerCount ?? 0);
    };

    socketService.onGameBroadcast(onBroadcast);
    socketService.onGameRoomJoined(onJoined);
    socketService.onGameRoomLeft(onLeft);

    return () => {
      socketService.off('game_broadcast', onBroadcast);
      socketService.off('game_room_joined', onJoined);
      socketService.off('game_room_left', onLeft);
      if (joined) socketService.leaveGameRoom();
    };
  }, []);

  useEffect(() => {
    if (joined) {
      socketService.joinGameRoom(roomId, 'dice', displayName);
    }
    return () => {
      if (joined) socketService.leaveGameRoom();
    };
  }, [joined, roomId]);

  const handleJoin = () => {
    if (!roomId.trim()) {
      toast.error('Enter a room name');
      return;
    }
    setJoined(true);
    toast.success(`Joined room: ${roomId}`);
  };

  const handleLeave = () => {
    socketService.leaveGameRoom();
    setJoined(false);
    setRolls([]);
    setPlayerCount(0);
    toast('Left room');
  };

  const roll = () => {
    if (!joined || rolling || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setRolling(true);
    setLastResult(null);
    setGameBalance(gameBalance - bet);

    const final = 1 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      setRolling(false);
      const win = bet * 2;
      const newBalance = gameBalance - bet + win;
      setGameBalance(newBalance);
      setLastResult({ final, win, newBalance });

      socketService.emitGameAction({
        type: 'dice_roll',
        value: final,
        bet,
        win,
        displayName,
      });

      setRolls((prev) => [
        {
          type: 'dice_roll',
          value: final,
          bet,
          win,
          displayName,
          socketId: socketRef.current?.id,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        },
        ...prev.slice(0, 49),
      ]);

      toast.success(`You rolled ${final}! Won $${(win - bet).toFixed(2)}`);
    }, 1200);
  };

  return (
    <CasinoLayout
      title="Multiplayer Dice"
      subtitle="Join a room and play with others. See everyone's rolls in real time."
      icon={Dices}
      themeColor="cyan"
      gameBalance={gameBalance}
    >
      <NeonBorder color="cyan" pulse={rolling}>
        <div className="flex flex-col gap-8">
          {!joined ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                placeholder="Room name"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 w-full max-w-xs bg-black/50 border border-cyan-500/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                onClick={handleJoin}
                className="casino-btn flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25"
              >
                <LogIn size={20} /> Join Room
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Users size={22} />
                  <span className="font-semibold">{roomId}</span>
                  <span className="text-gray-400">({playerCount} in room)</span>
                </div>
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
                >
                  Leave
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className={`w-28 h-28 flex items-center justify-center rounded-2xl border-4 border-cyan-500/50 text-5xl font-bold text-cyan-400 ${
                        rolling ? 'dice-roll-animation' : ''
                      }`}
                      style={{
                        background: 'linear-gradient(145deg, #0e3342 0%, #083042 100%)',
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), 0 0 40px rgba(6,182,212,0.2)',
                      }}
                    >
                      {rolling ? '?' : lastResult?.final ?? '–'}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-xs">
                      <div className="w-full">
                        <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
                        <input
                          type="number"
                          min={1}
                          max={gameBalance}
                          value={bet}
                          onChange={(e) =>
                            setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))
                          }
                          className="w-full bg-black/50 border border-cyan-500/40 rounded-xl px-4 py-3 text-white text-center"
                        />
                      </div>
                      <button
                        onClick={roll}
                        disabled={rolling || gameBalance < 1}
                        className="casino-btn w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg"
                      >
                        {rolling ? 'Rolling...' : 'Roll'}
                      </button>
                    </div>
                    {lastResult && (
                      <div className="text-center text-sm text-gray-400">
                        Rolled {lastResult.final} · {lastResult.win >= lastResult.bet ? '+' : ''}$
                        {(lastResult.win - lastResult.bet).toFixed(2)} · Balance: $
                        {lastResult.newBalance.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl border border-cyan-500/30 p-4 max-h-80 overflow-y-auto">
                  <h3 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
                    <Dices size={18} /> Live rolls
                  </h3>
                  <ul className="space-y-2">
                    {rolls.length === 0 ? (
                      <li className="text-gray-500 text-sm">No rolls yet. Be the first!</li>
                    ) : (
                      rolls.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-gray-800/50"
                        >
                          <span className="text-cyan-300 font-mono">{r.displayName || r.socketId?.slice(0, 8)}</span>
                          <span className="text-white font-bold">rolled {r.value}</span>
                          <span className={r.win > 0 ? 'text-green-400' : 'text-gray-400'}>
                            {r.win > 0 ? `+$${(r.win - (r.bet || 0)).toFixed(2)}` : '–'}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
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
