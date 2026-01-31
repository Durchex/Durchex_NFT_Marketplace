import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import '../../styles/casino.css';

const Limbo = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

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
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'limbo',
        betAmount: bet,
        options: { targetMultiplier: target },
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const outcome = data.outcome || {};
      setLastResult({
        outcomeMultiplier: outcome.outcomeMultiplier,
        targetMultiplier: outcome.targetMultiplier ?? target,
        win: outcome.win,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
      });
      if (outcome.win) toast.success(`Hit ${(outcome.outcomeMultiplier ?? 0).toFixed(2)}x!`);
      else toast.error(`Landed at ${(outcome.outcomeMultiplier ?? 0).toFixed(2)}x (target ${target}x).`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Play failed');
      setLastResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CasinoLayout title="Limbo" subtitle="Pick a target multiplier. Win if the result reaches it." icon={Gauge} themeColor="rose" gameBalance={gameBalance}>
      <CasinoGameSurface themeColor="rose" pulse={loading} idle>
        <div className="flex flex-col items-center gap-8">
          <div className="casino-panel-frame rounded-2xl p-6 text-center casino-idle-float">
            {lastResult != null ? (
              <>
                <div className="text-2xl font-bold text-rose-400">{(lastResult.outcomeMultiplier ?? 0).toFixed(2)}x</div>
                <div className="text-gray-400 text-sm">Target was {(lastResult.targetMultiplier ?? 0).toFixed(2)}x</div>
              </>
            ) : (
              <div className="text-gray-500">—</div>
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
              disabled={loading || gameBalance < 0.01 || !address}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Playing…' : 'Play'}
            </button>
          </div>
          {lastResult != null && (
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
