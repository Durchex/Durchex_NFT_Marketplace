import React, { useState, useContext, useRef, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const CLIMB_DURATION_MS = 2500;
const TICK_MS = 40;

const Limbo = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | climbing | done
  const [displayMultiplier, setDisplayMultiplier] = useState(0);
  const outcomeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handlePlay = async () => {
    if (!address) {
      toast.error('Connect your wallet');
      return;
    }
    if (loading || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    const target = Math.max(1, Math.min(1000000, Number(targetMultiplier) || 1));
    setLoading(true);
    setLastResult(null);
    setPhase('idle');
    setDisplayMultiplier(0);
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'limbo',
        betAmount: bet,
        options: { targetMultiplier: target },
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const outcome = data.outcome || {};
      const outcomeMult = outcome.outcomeMultiplier ?? 0;
      outcomeRef.current = {
        outcomeMultiplier: outcomeMult,
        targetMultiplier: outcome.targetMultiplier ?? target,
        win: outcome.win,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
      };
      setLastResult(outcomeRef.current);
      setPhase('climbing');

      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(1, elapsed / CLIMB_DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 1.5);
        const current = outcomeMult * eased;
        setDisplayMultiplier(current);
        if (t >= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setDisplayMultiplier(outcomeMult);
          setPhase('done');
          if (outcomeRef.current?.win) toast.success(`Hit ${outcomeMult.toFixed(2)}x!`);
          else toast.error(`Landed at ${outcomeMult.toFixed(2)}x (target ${target}x).`);
        }
      }, TICK_MS);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Play failed');
      setLastResult(null);
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const target = lastResult?.targetMultiplier ?? targetMultiplier;
  const maxGauge = Math.max(target * 1.5, displayMultiplier * 1.2, 2);

  return (
    <CasinoLayout
      title="Limbo"
      subtitle="Pick a target. Watch the multiplier climb to the result."
      icon={Gauge}
      themeColor="rose"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="rose" pulse={loading} idle backgroundImage={casinoAssets?.images?.backgroundFelt}>
        <div className="flex flex-col items-center gap-6">
          <div className="casino-panel-frame rounded-2xl p-6 text-center casino-idle-float w-full max-w-sm">
            <div className="text-gray-400 text-sm mb-1">Multiplier</div>
            <div
              className={`text-4xl font-mono font-bold tabular-nums transition-colors ${
                phase === 'done' ? (lastResult?.win ? 'text-rose-400 limbo-number-roll' : 'text-red-400 limbo-number-roll') : 'text-rose-300'
              }`}
            >
              {displayMultiplier.toFixed(2)}x
            </div>
            {phase === 'climbing' && (
              <div className="limbo-gauge w-full mt-4">
                <div
                  className="limbo-gauge-fill bg-gradient-to-r from-rose-500 to-pink-500"
                  style={{ width: `${Math.min(100, (displayMultiplier / maxGauge) * 100)}%` }}
                />
              </div>
            )}
            {phase === 'done' && lastResult != null && (
              <div className="text-gray-400 text-sm mt-2">Target was {target.toFixed(2)}x</div>
            )}
          </div>

          <div className="w-full max-w-sm">
            <label className="text-gray-400 text-sm block mb-1">Target multiplier (1 – 1,000,000)</label>
            <input
              type="number"
              min={1}
              max={1000000}
              step={0.1}
              value={targetMultiplier}
              onChange={(e) => setTargetMultiplier(Math.max(1, Math.min(1000000, parseFloat(e.target.value) || 1)))}
              className="w-full bg-black/50 border border-rose-500/40 rounded-xl px-4 py-3 text-white text-center"
            />
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
                className="w-full bg-black/50 border border-rose-500/40 rounded-xl px-4 py-3 text-white text-center"
              />
            </div>
            <button
              onClick={handlePlay}
              disabled={loading || gameBalance < 0.01 || !address || phase === 'climbing'}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Playing…' : phase === 'climbing' ? 'Climbing…' : 'Play'}
            </button>
          </div>
          {lastResult != null && phase === 'done' && (
            <div className="bg-black/40 rounded-xl p-4 border border-rose-500/30 text-center w-full max-w-sm">
              <div className={lastResult.win ? 'text-rose-400 font-bold' : 'text-red-400'}>
                {lastResult.win ? `+$${(lastResult.payout - lastResult.bet).toFixed(2)}` : `-$${lastResult.bet.toFixed(2)}`}
              </div>
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Limbo;
