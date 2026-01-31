import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import '../../styles/casino.css';

export default function CoinFlip() {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleFlip = async () => {
    if (!address) { toast.error('Connect your wallet'); return; }
    if (loading || gameBalance < bet) { if (gameBalance < bet) toast.error('Not enough balance'); return; }
    setLoading(true);
    setLastResult(null);
    try {
      const data = await casinoAPI.placeBet({ walletAddress: address, gameId: 'coin_flip', betAmount: bet, options: { choice } });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      setLastResult({ side: data.outcome?.side, win: data.outcome?.win, payout: data.payout ?? 0, bet: data.bet ?? bet, newBalance: data.newBalance });
      if (data.outcome?.win) toast.success('You won!'); else toast.error('Landed on ' + (data.outcome?.side || ''));
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Flip failed');
      setLastResult(null);
    } finally { setLoading(false); }
  }

  return (
    <CasinoLayout title="Coin Flip" subtitle="Heads or tails. Provably fair." icon={Coins} themeColor="amber" gameBalance={gameBalance}>
      <CasinoGameSurface themeColor="amber" pulse={loading} idle>
        <div className="flex flex-col items-center gap-8">
          <div className="casino-panel-frame rounded-2xl p-6 text-center casino-idle-float">
            {lastResult ? <div className="text-3xl font-bold text-amber-400 capitalize">{lastResult.side}</div> : <div className="text-gray-500">—</div>}
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => setChoice('heads')} className={'casino-btn px-6 py-3 rounded-xl font-bold ' + (choice === 'heads' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400')}>Heads</button>
            <button type="button" onClick={() => setChoice('tails')} className={'casino-btn px-6 py-3 rounded-xl font-bold ' + (choice === 'tails' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400')}>Tails</button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
            <div className="w-full">
              <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
              <input type="number" min={0.01} max={gameBalance} step={0.01} value={bet} onChange={(e) => setBet(Math.max(0.01, Math.min(gameBalance, parseFloat(e.target.value) || 0.01)))} className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-4 py-3 text-white text-center" />
            </div>
            <button onClick={handleFlip} disabled={loading || gameBalance < 0.01 || !address} className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Flipping…' : 'Flip'}</button>
          </div>
          {lastResult && (
            <div className="bg-black/40 rounded-xl p-4 border border-amber-500/30 text-center w-full max-w-sm">
              <div className={lastResult.win ? 'text-amber-400 font-bold' : 'text-red-400'}>{lastResult.win ? '+$' + (lastResult.payout - lastResult.bet).toFixed(2) : '-$' + lastResult.bet.toFixed(2)}</div>
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
}
