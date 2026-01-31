import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import CasinoCard from '../../components/games/CasinoCard';
import { casinoAPI } from '../../services/api';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];

function parseCard(str) {
  if (!str || str === '?') return null;
  const s = String(str).trim();
  const suit = SUITS.find((c) => s.includes(c)) || '♠';
  const rank = RANKS.find((r) => s.startsWith(r) || s.includes(r)) || s[0] || '?';
  return { rank, suit };
}

export default function HiLo() {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [guess, setGuess] = useState('higher');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | revealing | done
  const [previousCard, setPreviousCard] = useState(null);

  const handlePlay = async () => {
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
    setPhase('revealing');
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'hi_lo',
        betAmount: bet,
        options: { guess, previousCard: previousCard ? `${previousCard.rank}${previousCard.suit}` : undefined },
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      const cardStr = data.outcome?.card ?? '?';
      const card = parseCard(cardStr) || { rank: cardStr, suit: '♠' };
      setPreviousCard(card);
      setLastResult({
        card,
        cardStr,
        win: data.outcome?.win,
        payout: data.payout ?? 0,
        bet: data.bet ?? bet,
        newBalance: data.newBalance,
      });
      setPhase('done');
      if (data.outcome?.win) toast.success('Correct!');
      else toast.error('Wrong.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Play failed');
      setLastResult(null);
      setPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  const showCard = lastResult?.card ?? previousCard;

  return (
    <CasinoLayout
      title="Hi-Lo"
      subtitle="Guess if the next card is higher or lower. Card reveals with a flip."
      icon={ArrowUpDown}
      themeColor="violet"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="violet" pulse={loading} idle backgroundImage={casinoAssets?.images?.backgroundFelt}>
        <div className="flex flex-col items-center gap-8">
          <div className="casino-panel-frame rounded-2xl p-8 text-center casino-idle-float min-h-[180px] flex flex-col items-center justify-center">
            <div className="text-gray-400 text-sm mb-2">Card</div>
            <div
              className={`transition-transform duration-500 ${phase === 'revealing' ? 'hilo-card-reveal' : ''}`}
              style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
            >
              {phase === 'idle' && !showCard && (
                <div className="w-24 h-32 rounded-lg flex items-center justify-center text-4xl text-gray-500 border-2 border-violet-500/40 bg-black/30">
                  ?
                </div>
              )}
              {(phase === 'revealing' || phase === 'done') && lastResult?.card && (
                <div className={phase === 'revealing' ? 'hilo-card-reveal' : ''}>
                  <CasinoCard card={lastResult.card} faceDown={phase === 'revealing'} />
                </div>
              )}
              {phase === 'done' && lastResult?.card && (
                <div className="mt-2 text-2xl font-bold text-white">
                  {lastResult.card.rank}
                  {lastResult.card.suit}
                </div>
              )}
            </div>
            {phase === 'done' && lastResult?.card && (
              <div className="mt-2 text-gray-400 text-sm">Next round will use this card as previous.</div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setGuess('higher')}
              className={
                'casino-btn px-6 py-3 rounded-xl font-bold ' +
                (guess === 'higher' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400')
              }
            >
              Higher
            </button>
            <button
              type="button"
              onClick={() => setGuess('lower')}
              className={
                'casino-btn px-6 py-3 rounded-xl font-bold ' +
                (guess === 'lower' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400')
              }
            >
              Lower
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
                className="w-full bg-black/50 border border-violet-500/40 rounded-xl px-4 py-3 text-white text-center"
              />
            </div>
            <button
              onClick={handlePlay}
              disabled={loading || gameBalance < 0.01 || !address}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Playing…' : 'Play'}
            </button>
          </div>
          {lastResult != null && phase === 'done' && (
            <div className="bg-black/40 rounded-xl p-4 border border-violet-500/30 text-center w-full max-w-sm">
              <div className={lastResult.win ? 'text-violet-400 font-bold' : 'text-red-400'}>
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
