import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Bomb } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import '../../styles/casino.css';

const Mines = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [revealed, setRevealed] = useState([]);

  const handleStart = async () => {
    if (!address) { toast.error('Connect your wallet'); return; }
    if (loading || gameBalance < bet) { if (gameBalance < bet) toast.error('Not enough balance'); return; }
    setLoading(true);
    setLastResult(null);
    setRoundId(null);
    setRevealed([]);
    try {
      const data = await casinoAPI.placeBet({ walletAddress: address, gameId: 'mines', betAmount: bet, options: {} });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      setRoundId(data.roundId);
      setLastResult({ roundId: data.roundId, bet: data.bet, newBalance: data.newBalance });
      toast.success('Round started. Cash out when ready.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Start failed');
    } finally { setLoading(false); }
  };

  const handleCashout = async () => {
    if (!roundId || !address) return;
    setLoading(true);
    try {
      const data = await casinoAPI.minesCashout({ walletAddress: address, roundId, revealedIndices: revealed.length ? revealed : [0, 1, 2] });
      setGameBalance(data.newBalance ?? gameBalance);
      setLastResult((prev) => ({ ...prev, payout: data.payout, cashedOut: data.cashedOut, newBalance: data.newBalance }));
      setRoundId(null);
      setRevealed([]);
      if (data.cashedOut) toast.success('Cashed out! +$' + (data.payout ?? 0).toFixed(2)); else toast.error('Hit a mine or no cashout.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Cashout failed');
    } finally { setLoading(false); }
  };

  return (
    <CasinoLayout title="Mines" subtitle="Reveal tiles. Cash out before you hit a mine." icon={Bomb} themeColor="red" gameBalance={gameBalance}>
      <CasinoGameSurface themeColor="red" pulse={loading} idle>
        <div className="flex flex-col items-center gap-8">
          <div className="casino-panel-frame rounded-2xl p-6 text-center casino-idle-float">
            {lastResult?.payout != null && <div className="text-xl font-bold text-emerald-400">+${(lastResult.payout ?? 0).toFixed(2)}</div>}
            {roundId && lastResult?.cashedOut !== true && <p className="text-gray-400 text-sm">Round active. Cash out when ready.</p>}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
            <div className="w-full">
              <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
              <input type="number" min={0.01} max={gameBalance} step={0.01} value={bet} onChange={(e) => setBet(Math.max(0.01, Math.min(gameBalance, parseFloat(e.target.value) || 0.01)))} className="w-full bg-black/50 border border-red-500/40 rounded-xl px-4 py-3 text-white text-center" />
            </div>
            {!roundId ? (
              <button onClick={handleStart} disabled={loading || gameBalance < 0.01 || !address} className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Starting…' : 'Start'}</button>
            ) : (
              <button onClick={handleCashout} disabled={loading} className="casino-btn px-10 py-4 bg-emerald-600 text-white font-bold rounded-xl">Cash out</button>
            )}
          </div>
          {lastResult?.newBalance != null && (
            <div className="bg-black/40 rounded-xl p-4 border border-red-500/30 text-center w-full max-w-sm">
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Mines;
