import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import '../../styles/casino.css';

const Plinko = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

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
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'plinko',
        betAmount: bet,
        options: {},
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const outcome = data.outcome || {};
      setLastResult({
        bucketIndex: outcome.bucketIndex,
        payoutMultiplier: outcome.payoutMultiplier ?? data.payoutMultiplier,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
      });
      if ((data.payout ?? 0) > 0) toast.success(`Won $${(data.payout ?? 0).toFixed(2)}!`);
      else toast('No win this drop.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Drop failed');
      setLastResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CasinoLayout title="Plinko" subtitle="Drop the ball. Land in a bucket for a multiplier." icon={CircleDot} themeColor="cyan" gameBalance={gameBalance}>
      <CasinoGameSurface themeColor="cyan" pulse={loading} idle>
        <div className="flex flex-col items-center gap-8">
          <div className="casino-panel-frame rounded-2xl p-6 text-center casino-idle-float">
            {lastResult != null ? (
              <>
                <div className="text-2xl font-bold text-cyan-400">{(lastResult.payoutMultiplier ?? 0).toFixed(2)}x</div>
                <div className="text-gray-400 text-sm">Payout: ${(lastResult.payout ?? 0).toFixed(2)}</div>
              </>
            ) : (
              <div className="text-gray-500">Drop to play</div>
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
              disabled={loading || gameBalance < 0.01 || !address}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Dropping…' : 'Drop'}
            </button>
          </div>
          {lastResult != null && (
            <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/30 text-center w-full max-w-sm">
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Plinko;
