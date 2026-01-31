import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import '../../styles/casino.css';

/**
 * Crash: server-authoritative, provably fair.
 * Server generates crash point before round; RTP configured in backend.
 */
const Crash = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [cashOutAt, setCashOutAt] = useState(2);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

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
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'crash',
        betAmount: bet,
        options: { cashOutMultiplier: cashOut },
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      setLastResult({
        crashPoint: data.outcome?.crashPoint ?? 0,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
        roundId: data.roundId,
        verification: data.verification,
      });
      if ((data.payout ?? 0) > 0) toast.success(`Crashed at ${(data.outcome?.crashPoint ?? 0).toFixed(2)}x – you cashed out!`);
      else toast.error(`Crashed at ${(data.outcome?.crashPoint ?? 0).toFixed(2)}x`);
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
      subtitle="Provably fair. Server generates crash point. Cash out before it crashes."
      icon={TrendingUp}
      themeColor="emerald"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="emerald" pulse={loading} idle>
        <div className="flex flex-col items-center gap-8">
          <div className="casino-panel-frame rounded-2xl p-6 text-center casino-idle-float">
            <div className="text-gray-400 text-sm mb-1">Crash point (this round)</div>
            {lastResult ? (
              <div className="text-4xl font-bold text-emerald-400">
                {(lastResult.crashPoint ?? 0).toFixed(2)}x
              </div>
            ) : (
              <div className="text-2xl text-gray-500">—</div>
            )}
          </div>

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
              disabled={loading || gameBalance < 0.01 || !address}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition"
            >
              {loading ? 'Placing…' : 'Place bet'}
            </button>
          </div>

          {lastResult && (
            <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/30 text-center w-full max-w-sm">
              <div className="text-gray-400 text-sm">Crashed at {(lastResult.crashPoint ?? 0).toFixed(2)}x</div>
              <div className={lastResult.payout >= lastResult.bet ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                {lastResult.payout >= lastResult.bet
                  ? `+$${(lastResult.payout - lastResult.bet).toFixed(2)}`
                  : `-$${(lastResult.bet - lastResult.payout).toFixed(2)}`}
              </div>
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
              {lastResult.roundId && (
                <a
                  href={`#/games/crash?round=${lastResult.roundId}`}
                  className="text-emerald-400/80 text-xs mt-2 inline-block"
                >
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
