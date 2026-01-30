import React from 'react';
import { Users, Copy, LogIn, Play } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Bar for Single player / Multiplayer mode: create or join by code, players list, activity feed.
 * Use with useGameRoom(gameType).
 */
export default function GameMultiplayerBar({
  mode,
  setMode,
  roomCode,
  joinCode,
  setJoinCode,
  joined,
  players,
  activityFeed,
  createRoom,
  joinRoom,
  leaveRoom,
  themeColor = 'cyan',
}) {
  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const colorClass = {
    amber: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    emerald: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    violet: 'border-violet-500/40 text-violet-400 bg-violet-500/10',
    red: 'border-red-500/40 text-red-400 bg-red-500/10',
    cyan: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
  }[themeColor] || 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'single' ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
        >
          Single player
        </button>
        <button
          type="button"
          onClick={() => setMode('multiplayer')}
          className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'multiplayer' ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
        >
          Multiplayer
        </button>
      </div>

      {mode === 'multiplayer' && (
        <div className={`rounded-xl border p-4 ${colorClass}`}>
          {!joined ? (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => createRoom()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold"
              >
                <Play size={18} /> Create room
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="w-28 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white font-mono uppercase text-center"
                />
                <button
                  type="button"
                  onClick={() => joinRoom()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold"
                >
                  <LogIn size={18} /> Join
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{roomCode}</span>
                <button type="button" onClick={handleCopyCode} className="p-1 rounded hover:bg-white/20" title="Copy">
                  <Copy size={16} />
                </button>
                <span className="text-sm opacity-80">Share code</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Users size={18} />
                  <span>{players.length} in room</span>
                </div>
                <button type="button" onClick={leaveRoom} className="px-3 py-1 rounded bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30">
                  Leave
                </button>
              </div>
            </div>
          )}

          {joined && (players.length > 0 || activityFeed.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              {players.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Players</h4>
                  <ul className="flex flex-wrap gap-2">
                    {players.map((p) => (
                      <li key={p.socketId} className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-black/30 overflow-hidden flex-shrink-0">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xs font-bold">
                              {(p.username || 'P')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm truncate max-w-[80px]">{p.username || 'Player'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activityFeed.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Activity</h4>
                  <ul className="space-y-1 text-sm max-h-24 overflow-y-auto">
                    {activityFeed.slice(0, 8).map((a) => (
                      <li key={a.id} className="flex justify-between gap-2">
                        <span className="truncate">{a.username}</span>
                        {a.win != null && (
                          <span className={a.win > 0 ? 'text-green-300' : 'text-red-300'}>
                            {a.win > 0 ? `+$${a.win.toFixed(2)}` : `-$${(a.bet || 0).toFixed(2)}`}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
