import React, { useState, useRef, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { useGameRoom } from '../../hooks/useGameRoom';
import { useCasinoSound } from '../../hooks/useCasinoSound';
import GameMultiplayerBar from '../../components/games/GameMultiplayerBar';
import { RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import '../../styles/casino.css';

const SEGMENTS = [
  { label: '2x', multiplier: 2, color: '#ef4444' },
  { label: '0.5x', multiplier: 0.5, color: '#3b82f6' },
  { label: '1.5x', multiplier: 1.5, color: '#22c55e' },
  { label: '0', multiplier: 0, color: '#6b7280' },
  { label: '3x', multiplier: 3, color: '#a855f7' },
  { label: '1x', multiplier: 1, color: '#eab308' },
  { label: '0.5x', multiplier: 0.5, color: '#ec4899' },
  { label: '1.5x', multiplier: 1.5, color: '#14b8a6' },
];

const NUM_SEGMENTS = SEGMENTS.length;
const DEG_PER_SEGMENT = 360 / NUM_SEGMENTS;

const SpinTheWheel = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const [mode, setMode] = useState('single');
  const gameRoom = useGameRoom('wheel');
  const { joined, leaveRoom, emitResult } = gameRoom;
  const [spinBet, setSpinBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [showWinBurst, setShowWinBurst] = useState(false);
  const rotationRef = useRef(0);

  const handleSetMode = (m) => {
    if (m === 'single' && joined) leaveRoom();
    setMode(m);
  };

  useEffect(() => {
    if (lastResult && lastResult.win >= lastResult.bet) {
      setShowWinBurst(true);
      const t = setTimeout(() => setShowWinBurst(false), 800);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  const spinWheel = () => {
    if (spinning) return;
    const bet = Math.min(Math.max(1, spinBet), gameBalance);
    if (bet > gameBalance) {
      toast.error('Not enough balance in game wallet');
      return;
    }
    setSpinning(true);
    setLastResult(null);
    setGameBalance((prev) => prev - bet);
    sound.playRouletteSpin();

    const index = Math.floor(Math.random() * NUM_SEGMENTS);
    const segment = SEGMENTS[index];

    const currentNormalized = ((rotationRef.current % 360) + 360) % 360;
    const targetStop = (360 - (index + 0.5) * DEG_PER_SEGMENT + 360) % 360;
    let diff = (targetStop - currentNormalized + 360) % 360;
    if (diff < 0) diff += 360;
    const fullSpins = 6;
    const deg = 360 * fullSpins + diff;

    rotationRef.current += deg;
    setWheelRotation(rotationRef.current);

    const duration = 5500;
    setTimeout(() => {
      setSpinning(false);
      const win = bet * segment.multiplier;
      setGameBalance((prev) => {
        const newBalance = prev + win;
        setLastResult({
          multiplier: segment.multiplier,
          label: segment.label,
          bet,
          win,
          newBalance,
        });
        return newBalance;
      });
      if (win > bet) sound.playWin();
      else if (win < bet) sound.playLose();
      if (mode === 'multiplayer' && joined) {
        emitResult({ bet, win });
      }
      if (win > bet) toast.success(`Won ${segment.label}! +$${(win - bet).toFixed(2)}`);
      else if (win < bet) toast.error(`Landed on ${segment.label}. -$${(bet - win).toFixed(2)}`);
      else toast('Landed on 1x – push.');
    }, duration);
  };

  return (
    <CasinoLayout
      title="Spin the Wheel"
      subtitle="Pick your bet. The wheel lands exactly on the result you get."
      icon={RotateCw}
      themeColor="amber"
      gameBalance={gameBalance}
    >
      <GameMultiplayerBar
        mode={mode}
        setMode={handleSetMode}
        themeColor="amber"
        {...gameRoom}
      />
      <CasinoGameSurface themeColor="amber" pulse={spinning} idle>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          <div className="casino-perspective relative flex items-center justify-center casino-idle-float">
            {/* 3D wheel with depth and glow */}
            <div
              className="relative rounded-full border-8 border-amber-500/60 shadow-2xl casino-panel-frame"
              style={{
                width: 'clamp(280px, 80vw, 380px)',
                height: 'clamp(280px, 80vw, 380px)',
                background: `conic-gradient(${SEGMENTS.map(
                  (seg, i) =>
                    `${seg.color} ${i * DEG_PER_SEGMENT}deg ${(i + 1) * DEG_PER_SEGMENT}deg`
                ).join(', ')})`,
                transform: `rotate(${wheelRotation}deg)`,
                transition: spinning
                  ? `transform 5.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                  : 'none',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3), 0 0 60px rgba(245,158,11,0.15), 0 20px 50px rgba(0,0,0,0.4)',
              }}
            >
              {SEGMENTS.map((seg, i) => (
                <div
                  key={i}
                  className="absolute text-white font-bold text-lg md:text-xl drop-shadow-lg"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${(i + 0.5) * DEG_PER_SEGMENT}deg) translateY(-85px) rotate(-${(i + 0.5) * DEG_PER_SEGMENT}deg)`,
                  }}
                >
                  {seg.label}
                </div>
              ))}
            </div>
            {/* Pointer with 3D look */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0"
              style={{
                borderLeft: '20px solid transparent',
                borderRight: '20px solid transparent',
                borderTop: '36px solid #f59e0b',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
              }}
            />
            {showWinBurst && (
              <div
                className="absolute inset-0 rounded-full win-burst pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
                  animation: 'win-burst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-6 min-w-[220px]">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Bet amount ($)</label>
              <input
                type="number"
                min={1}
                max={gameBalance}
                value={spinBet}
                onChange={(e) =>
                  setSpinBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))
                }
                className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
            <button
              onClick={spinWheel}
              disabled={spinning || gameBalance < 1}
              className="casino-btn px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl transition flex items-center gap-2 justify-center text-lg shadow-lg shadow-amber-500/25"
            >
              <RotateCw size={22} className={spinning ? 'animate-spin' : ''} />
              {spinning ? 'Spinning...' : 'Spin'}
            </button>
            {lastResult && (
              <div className="bg-black/40 rounded-xl p-4 border border-amber-500/30">
                <div className="text-gray-400 text-sm">Landed on {lastResult.label}</div>
                <div
                  className={`text-lg font-bold ${lastResult.win >= lastResult.bet ? 'text-green-400' : 'text-red-400'}`}
                >
                  {lastResult.win >= lastResult.bet
                    ? `+$${(lastResult.win - lastResult.bet).toFixed(2)}`
                    : `-$${(lastResult.bet - lastResult.win).toFixed(2)}`}
                </div>
                <div className="text-gray-400 text-sm">Balance: ${lastResult.newBalance.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default SpinTheWheel;
