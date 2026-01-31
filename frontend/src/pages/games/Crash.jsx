import React, { useState, useContext, useRef, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const ROCKET_DURATION_MS = 8000; // total flight time before crash at max

/**
 * Crash: server-authoritative, provably fair.
 * After bet we animate: rocket takes off, multiplier climbs until crash point, then crash.
 */
const Crash = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [cashOutAt, setCashOutAt] = useState(2);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | flying | crashed
  const [displayMultiplier, setDisplayMultiplier] = useState(1);
  const [crashed, setCrashed] = useState(false);
  const crashPointRef = useRef(null);
  const animRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const runRocketAnimation = (crashPoint) => {
    crashPointRef.current = crashPoint;
    setCrashed(false);
    setDisplayMultiplier(1);
    setPhase('flying');
    startTimeRef.current = Date.now();

    const duration = Math.min(ROCKET_DURATION_MS, Math.max(2500, (crashPoint / 15) * 5000));

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const currentMult = 1 + (crashPoint - 1) * t;
      setDisplayMultiplier(currentMult);

      if (t >= 1) {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = null;
        setCrashed(true);
        setPhase('crashed');
        setDisplayMultiplier(crashPoint);
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  };

  const handleBet = async () => {
    if (!address) {
      toast.error('Connect your wallet');
      return;
    }
    if (loading || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    const cashOut = Math.max(1, Math.min(100, Number(cashOutAt) || 1));
    setLoading(true);
    setLastResult(null);
    setPhase('idle');
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'crash',
        betAmount: bet,
        options: { cashOutMultiplier: cashOut },
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const crashPoint = data.outcome?.crashPoint ?? 1.01;
      setLastResult({
        crashPoint,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
        roundId: data.roundId,
        verification: data.verification,
        cashOutAt: cashOut,
      });
      runRocketAnimation(crashPoint);
      if ((data.payout ?? 0) > 0) toast.success(`Crashed at ${crashPoint.toFixed(2)}x – you cashed out!`);
      else toast.error(`Crashed at ${crashPoint.toFixed(2)}x`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Bet failed');
      setLastResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CasinoLayout
      title="Crash"
      subtitle="Rocket flies – multiplier climbs. Cash out before it crashes."
      icon={TrendingUp}
      themeColor="emerald"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="emerald" pulse={loading} idle backgroundImage={casinoAssets?.images?.backgroundFelt}>
        <div className="flex flex-col items-center gap-6">
          {/* Game area: rocket + multiplier */}
          <div className="crash-arena w-full max-w-md rounded-2xl overflow-hidden casino-panel-frame relative min-h-[320px] flex flex-col">
            <div className="flex-1 relative flex flex-col items-center justify-end pb-2">
              {/* Sky gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-900/40 via-transparent to-emerald-900/30 pointer-events-none" />
              {/* Multiplier display */}
              <div className="relative z-10 text-center mb-2">
                <div className="text-gray-400 text-sm">Multiplier</div>
                <div
                  className={`text-4xl md:text-5xl font-mono font-bold tabular-nums transition-colors duration-200 ${
                    phase === 'crashed' ? 'text-red-500 crash-result-shake' : 'text-emerald-400'
                  }`}
                >
                  {displayMultiplier.toFixed(2)}x
                </div>
              </div>
              {/* Rocket */}
              <div
                className={`crash-rocket relative z-10 transition-all duration-300 ${
                  phase === 'flying' ? 'crash-rocket-fly' : phase === 'crashed' ? 'crash-rocket-crash' : 'opacity-70'
                }`}
                style={
                  phase === 'flying'
                    ? {
                        transform: `translateY(-${Math.min(80, (displayMultiplier - 1) * 8)}%) scale(${0.9 + displayMultiplier * 0.02})`,
                      }
                    : phase === 'crashed'
                    ? { transform: 'translateY(20%) scale(0.6) rotate(20deg)' }
                    : {}
                }
              >
                <svg
                  width="64"
                  height="80"
                  viewBox="0 0 64 80"
                  fill="none"
                  className="drop-shadow-lg"
                  style={{ filter: phase === 'crashed' ? 'brightness(0.6) saturate(0.5)' : undefined }}
                >
                  <path
                    d="M32 4 L38 36 L32 76 L26 36 Z"
                    fill="url(#crash-rocket-body)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                  />
                  <path d="M22 44 L32 52 L42 44 L32 36 Z" fill="#fbbf24" opacity="0.9" />
                  <ellipse cx="32" cy="20" rx="8" ry="10" fill="#94a3b8" />
                  <defs>
                    <linearGradient id="crash-rocket-body" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>
                </svg>
                {phase === 'flying' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-6 bg-orange-500/80 rounded-full blur-md animate-pulse" />
                )}
              </div>
              {/* Crash explosion */}
              {phase === 'crashed' && (
                <div className="crash-explosion absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full bg-red-500/40 blur-2xl animate-ping" style={{ animationDuration: '0.6s' }} />
                  <div className="absolute w-24 h-24 rounded-full bg-orange-400/60 blur-xl" />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
                <input
                  type="number"
                  min={0.01}
                  max={gameBalance}
                  step={0.01}
                  value={bet}
                  onChange={(e) => setBet(Math.max(0.01, Math.min(gameBalance, parseFloat(e.target.value) || 0.01)))}
                  className="w-full bg-black/50 border border-emerald-500/40 rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Cash out at (x)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={0.1}
                  value={cashOutAt}
                  onChange={(e) => setCashOutAt(Math.max(1, Math.min(100, parseFloat(e.target.value) || 1)))}
                  className="w-full bg-black/50 border border-emerald-500/40 rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
            <button
              onClick={handleBet}
              disabled={loading || gameBalance < 0.01 || !address || phase === 'flying'}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition"
            >
              {loading ? 'Placing…' : phase === 'flying' ? 'Rocket flying…' : 'Place bet'}
            </button>
          </div>

          {lastResult && phase !== 'flying' && (
            <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/30 text-center w-full max-w-sm">
              <div className="text-gray-400 text-sm">Crashed at {(lastResult.crashPoint ?? 0).toFixed(2)}x</div>
              <div className={lastResult.payout >= lastResult.bet ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {lastResult.payout >= lastResult.bet
                  ? `+$${(lastResult.payout - lastResult.bet).toFixed(2)}`
                  : `-$${(lastResult.bet - lastResult.payout).toFixed(2)}`}
              </div>
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
              {lastResult.roundId && (
                <a href={`#/games/crash?round=${lastResult.roundId}`} className="text-emerald-400/80 text-xs mt-2 inline-block">
                  Verify round
                </a>
              )}
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Crash;
