import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../FooterComponents/Footer';
import { useGameWallet } from '../../hooks/useGameWallet';
import { RotateCw, ArrowLeft, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

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

/**
 * Spin the Wheel – result is chosen first, then wheel rotates to land exactly on that segment.
 */
const SpinTheWheel = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const [spinBet, setSpinBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const rotationRef = useRef(0);

  const spinWheel = () => {
    if (spinning) return;
    const bet = Math.min(Math.max(1, spinBet), gameBalance);
    if (bet > gameBalance) {
      toast.error('Not enough balance in game wallet');
      return;
    }
    setSpinning(true);
    setLastResult(null);

    // 1. Pick result first (fair random)
    const index = Math.floor(Math.random() * NUM_SEGMENTS);
    const segment = SEGMENTS[index];

    // 2. Compute rotation so this segment lands at the pointer (top).
    // Pointer is at top (0°). Segment i has center at (i + 0.5) * DEG_PER_SEGMENT in wheel space.
    // After rotation R, that center is at R + (i+0.5)*DEG. We need it at 0° (top): R + (i+0.5)*DEG ≡ 0 (mod 360).
    // So R ≡ -(i+0.5)*DEG ≡ 360 - (i+0.5)*DEG (mod 360).
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
      const newBalance = gameBalance - bet + win;
      setGameBalance(newBalance);
      setLastResult({
        multiplier: segment.multiplier,
        label: segment.label,
        bet,
        win,
        newBalance,
      });
      if (win > bet) toast.success(`Won ${segment.label}! +$${(win - bet).toFixed(2)}`);
      else if (win < bet) toast.error(`Landed on ${segment.label}. -$${(bet - win).toFixed(2)}`);
      else toast('Landed on 1x – push.');
    }, duration);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            to="/games"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back to Games
          </Link>
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-amber-500/30">
            <Wallet className="text-amber-400" size={20} />
            <span className="text-gray-300">Balance</span>
            <span className="text-xl font-bold text-amber-400">${gameBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <RotateCw className="text-amber-400" size={36} />
            Spin the Wheel
          </h1>
          <p className="text-gray-400">Pick your bet. The wheel lands exactly on the result you get.</p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur rounded-3xl border border-amber-500/20 p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
            <div className="relative flex items-center justify-center">
              <div
                className="relative w-72 h-72 md:w-80 md:h-80 rounded-full border-8 border-amber-500/50 shadow-2xl shadow-amber-500/10"
                style={{
                  background: `conic-gradient(${SEGMENTS.map(
                    (seg, i) =>
                      `${seg.color} ${i * DEG_PER_SEGMENT}deg ${(i + 1) * DEG_PER_SEGMENT}deg`
                  ).join(', ')})`,
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning
                    ? `transform ${5.5}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                    : 'none',
                }}
              >
                {SEGMENTS.map((seg, i) => (
                  <div
                    key={i}
                    className="absolute text-white font-bold text-lg drop-shadow-lg"
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-[16px] border-r-[16px] border-t-[32px] border-l-transparent border-r-transparent border-t-red-500 z-10 drop-shadow-lg filter brightness-110" />
            </div>

            <div className="flex flex-col gap-6 min-w-[200px]">
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
                  className="w-full bg-black/50 border border-amber-500/30 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <button
                onClick={spinWheel}
                disabled={spinning || gameBalance < 1}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl transition flex items-center gap-2 justify-center text-lg shadow-lg shadow-amber-500/25"
              >
                <RotateCw size={22} className={spinning ? 'animate-spin' : ''} />
                {spinning ? 'Spinning...' : 'Spin'}
              </button>
              {lastResult && (
                <div className="bg-black/40 rounded-xl p-4 border border-amber-500/20">
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SpinTheWheel;
