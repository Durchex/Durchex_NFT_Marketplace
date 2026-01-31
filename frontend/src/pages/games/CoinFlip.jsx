import React, { useState, useContext, useRef, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Coins } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const FLIP_DURATION_MS = 1400;
const EXTRA_ROTATIONS = 5;

export default function CoinFlip() {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('heads');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | flipping | done
  const [displaySide, setDisplaySide] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleFlip = async () => {
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
    setPhase('flipping');
    setDisplaySide(null);
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'coin_flip',
        betAmount: bet,
        options: { choice },
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const side = (data.outcome?.side ?? 'heads').toLowerCase();
      setLastResult({
        side,
        win: data.outcome?.win,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
      });
      timeoutRef.current = setTimeout(() => {
        setDisplaySide(side);
        setPhase('done');
        if (data.outcome?.win) toast.success('You won!');
        else toast.error('Landed on ' + side);
      }, FLIP_DURATION_MS);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Flip failed');
      setLastResult(null);
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const finalSide = displaySide ?? lastResult?.side;
  const finalRotationDeg = finalSide === 'tails' ? EXTRA_ROTATIONS * 360 + 180 : EXTRA_ROTATIONS * 360;

  return (
    <CasinoLayout
      title="Coin Flip"
      subtitle="Heads or tails. Watch the coin spin – provably fair."
      icon={Coins}
      themeColor="amber"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="amber" pulse={loading} idle backgroundImage={casinoAssets?.images?.backgroundFelt}>
        <div className="flex flex-col items-center gap-8">
          <div className="coin-flip-3d w-full flex justify-center items-center min-h-[200px]" style={{ perspective: '900px' }}>
            <div
              className="relative w-28 h-28"
              style={{
                transformStyle: 'preserve-3d',
                transform:
                  phase === 'flipping'
                    ? `rotateY(${finalRotationDeg}deg)` 
                    : phase === 'done' && finalSide
                    ? `rotateY(${finalSide === 'tails' ? 180 : 0}deg)`
                    : 'rotateY(0deg)',
                transition: phase === 'flipping' ? `transform ${FLIP_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : 'transform 0.3s ease',
              }}
            >
              <div className="coin-face absolute inset-0 rounded-full border-4 border-amber-400 bg-amber-500 shadow-lg flex items-center justify-center text-3xl font-bold text-amber-900" style={{ backfaceVisibility: 'hidden' }}>
                H
              </div>
              <div
                className="coin-face absolute inset-0 rounded-full border-4 border-amber-400 bg-amber-500 shadow-lg flex items-center justify-center text-3xl font-bold text-amber-900"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                T
              </div>
            </div>
          </div>

          {phase === 'flipping' && (
            <p className="text-amber-200/80 text-sm">Flipping…</p>
          )}
          {phase === 'done' && finalSide && (
            <div className="casino-panel-frame rounded-2xl px-8 py-4 text-center">
              <div className="text-gray-400 text-sm">Landed on</div>
              <div className="text-3xl font-bold text-amber-400 capitalize">{finalSide}</div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setChoice('heads')}
              className={
                'casino-btn px-6 py-3 rounded-xl font-bold ' +
                (choice === 'heads' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400')
              }
            >
              Heads
            </button>
            <button
              type="button"
              onClick={() => setChoice('tails')}
              className={
                'casino-btn px-6 py-3 rounded-xl font-bold ' +
                (choice === 'tails' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400')
              }
            >
              Tails
            </button>
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
                className="w-full bg-black/50 border border-amber-500/40 rounded-xl px-4 py-3 text-white text-center"
              />
            </div>
            <button
              onClick={handleFlip}
              disabled={loading || gameBalance < 0.01 || !address || phase === 'flipping'}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Flipping…' : phase === 'flipping' ? 'Spinning…' : 'Flip'}
            </button>
          </div>
          {lastResult != null && phase === 'done' && (
            <div className="bg-black/40 rounded-xl p-4 border border-amber-500/30 text-center w-full max-w-sm">
              <div className={lastResult.win ? 'text-amber-400 font-bold' : 'text-red-400'}>
                {lastResult.win ? '+$' + (lastResult.payout - lastResult.bet).toFixed(2) : '-$' + lastResult.bet.toFixed(2)}
              </div>
              <div className="text-gray-400 text-sm">Balance: ${(lastResult.newBalance ?? 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
}
