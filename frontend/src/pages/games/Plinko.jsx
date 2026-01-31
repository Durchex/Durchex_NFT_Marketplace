import React, { useState, useContext, useRef, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const ROWS = 12;
const BUCKETS = 13;
const PEG_SIZE = 10;
const BALL_SIZE = 14;
const DROP_MS_PER_ROW = 120;

/**
 * Build path (left/right per row) so ball lands in bucketIndex. Row 0 = top.
 * Position at row r is 0..r; we need to end at bucketIndex (0..BUCKETS-1).
 */
function buildPath(bucketIndex) {
  const rights = Math.min(ROWS, Math.max(0, bucketIndex));
  const path = [];
  for (let i = 0; i < ROWS; i++) path.push(i < rights ? 1 : 0);
  for (let i = path.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [path[i], path[j]] = [path[j], path[i]];
  }
  return path;
}

/**
 * Get ball position at row (0-based). Row 0 = top. Position 0 = left, r = right at row r.
 * Returns { x: 0..1 (fraction of width), y: 0..1 }.
 */
function positionAtRow(path, row) {
  if (row <= 0) return { x: 0.5, y: 0 };
  let position = 0; // 0..row (which peg index at this row)
  for (let r = 0; r < row && r < path.length; r++) position += path[r] ? 1 : 0;
  const x = row === 0 ? 0.5 : position / row;
  const y = (row + 1) / (ROWS + 1);
  return { x: Math.max(0, Math.min(1, x)), y };
}

const Plinko = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | dropping | done
  const [ballPos, setBallPos] = useState(null);
  const [path, setPath] = useState([]);
  const [bucketMultipliers, setBucketMultipliers] = useState([]);
  const arenaRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const mid = (BUCKETS - 1) / 2;
    const mults = [];
    for (let i = 0; i < BUCKETS; i++) {
      const dist = Math.abs(i - mid);
      const norm = mid <= 0 ? 0 : dist / mid;
      const mult = Math.max(0.1, Math.min(10, (0.5 + 2 * (1 - norm)) * 0.96));
      mults.push(mult.toFixed(2));
    }
    setBucketMultipliers(mults);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDrop = async () => {
    if (!address) {
      toast.error('Connect your wallet');
      return;
    }
    if (loading || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setLoading(true);
    setLastResult(null);
    setPhase('idle');
    setBallPos(null);
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'plinko',
        betAmount: bet,
        options: {},
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const outcome = data.outcome || {};
      const bucketIndex = Math.min(BUCKETS - 1, Math.max(0, outcome.bucketIndex ?? 0));
      const payoutMult = outcome.payoutMultiplier ?? data.payoutMultiplier ?? 0;
      setLastResult({
        bucketIndex,
        payoutMultiplier: payoutMult,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
      });
      const p = buildPath(bucketIndex);
      setPath(p);
      setPhase('dropping');
      setBallPos({ x: 0.5, y: 0 });

      let row = 0;
      intervalRef.current = setInterval(() => {
        row++;
        if (row > ROWS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPhase('done');
          setBallPos({ x: (bucketIndex + 0.5) / BUCKETS, y: 1 });
          if ((data.payout ?? 0) > 0) toast.success(`Won $${(data.payout ?? 0).toFixed(2)}!`);
          else toast('No win this drop.');
          return;
        }
        const pos = positionAtRow(p, row);
        setBallPos(pos);
      }, DROP_MS_PER_ROW);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Drop failed');
      setLastResult(null);
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CasinoLayout title="Plinko" subtitle="Drop the ball. Watch it fall into a multiplier bucket." icon={CircleDot} themeColor="cyan" gameBalance={gameBalance}>
      <CasinoGameSurface themeColor="cyan" pulse={loading} idle backgroundImage={casinoAssets?.images?.backgroundFelt}>
        <div className="flex flex-col items-center gap-6">
          <div className="plinko-arena w-full max-w-md rounded-2xl casino-panel-frame p-4 relative min-h-[340px]" ref={arenaRef}>
            {/* Pegs */}
            <div className="relative mx-auto" style={{ width: ROWS * (PEG_SIZE + 8) }}>
              {Array.from({ length: ROWS }).map((_, row) => (
                <div
                  key={row}
                  className="flex justify-center gap-1"
                  style={{
                    marginTop: row === 0 ? 4 : 6,
                    marginLeft: (row * (PEG_SIZE + 8)) / 2,
                    width: (ROWS - row) * (PEG_SIZE + 8),
                  }}
                >
                  {Array.from({ length: row + 1 }).map((_, col) => (
                    <div key={col} className="plinko-peg flex-shrink-0" style={{ width: PEG_SIZE, height: PEG_SIZE }} />
                  ))}
                </div>
              ))}
            </div>
            {/* Buckets */}
            <div className="flex gap-0.5 justify-center mt-2 mx-auto" style={{ width: '100%', maxWidth: ROWS * (PEG_SIZE + 8) }}>
              {Array.from({ length: BUCKETS }).map((_, i) => (
                <div
                  key={i}
                  className={`plinko-bucket flex-1 text-amber-200/90 ${
                    lastResult && phase === 'done' && lastResult.bucketIndex === i ? 'ring-2 ring-cyan-400 bg-cyan-500/30' : 'bg-black/40'
                  }`}
                >
                  {bucketMultipliers[i] ?? '—'}x
                </div>
              ))}
            </div>
            {/* Ball */}
            {ballPos && arenaRef.current && (
              <div
                className="plinko-ball plinko-ball-dropping absolute rounded-full"
                style={{
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                  left: `calc(${ballPos.x * 100}% - ${BALL_SIZE / 2}px)`,
                  top: `calc(${ballPos.y * 100}% - ${BALL_SIZE / 2}px)`,
                  background: 'radial-gradient(circle at 30% 30%, #fef3c7, #f59e0b)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                }}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
            <div className="w-full">
              <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
              <input
                type="number"
                min={0.01}
                max={gameBalance}
                step={0.01}
                value={bet}
                onChange={(e) => setBet(Math.max(0.01, Math.min(gameBalance, parseFloat(e.target.value) || 0.01)))}
                className="w-full bg-black/50 border border-cyan-500/40 rounded-xl px-4 py-3 text-white text-center"
              />
            </div>
            <button
              onClick={handleDrop}
              disabled={loading || gameBalance < 0.01 || !address || phase === 'dropping'}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Dropping…' : phase === 'dropping' ? 'Ball dropping…' : 'Drop ball'}
            </button>
          </div>
          {lastResult != null && phase === 'done' && (
            <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/30 text-center w-full max-w-sm">
              <div className="text-2xl font-bold text-cyan-400">{(lastResult.payoutMultiplier ?? 0).toFixed(2)}x</div>
              <div className="text-gray-400 text-sm">Payout: ${(lastResult.payout ?? 0).toFixed(2)}</div>
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Plinko;
