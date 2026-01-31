import React, { useState, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { useCasinoSound } from '../../hooks/useCasinoSound';
import { Dices, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import CasinoDice from '../../components/games/CasinoDice';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const Dice = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const sound = useCasinoSound({ volume: 0.5 });
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('over');
  const [target, setTarget] = useState(4);
  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [rollKey, setRollKey] = useState(0);
  const [showWinBurst, setShowWinBurst] = useState(false);

  useEffect(() => {
    if (lastResult && lastResult.win >= lastResult.bet) {
      setShowWinBurst(true);
      const t = setTimeout(() => setShowWinBurst(false), 600);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  const roll = () => {
    if (rolling || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setRolling(true);
    setLastResult(null);
    setDiceValue(null);
    setRollKey((k) => k + 1);
    setGameBalance((prev) => prev - bet);
    sound.playDiceRoll();

    const rollDuration = 1500;
    const interval = 80;
    let count = 0;
    const maxCount = Math.ceil(rollDuration / interval);

    const tick = () => {
      count++;
      setDiceValue(1 + Math.floor(Math.random() * 6));
      if (count >= maxCount) {
        const final = 1 + Math.floor(Math.random() * 6);
        setDiceValue(final);
        const winOver = choice === 'over' && final > target;
        const winUnder = choice === 'under' && final < target;
        const push = (choice === 'over' && final === target) || (choice === 'under' && final === target);
        let win = 0;
        if (push) win = bet;
        else if (winOver || winUnder) win = bet * 2;
        setGameBalance((prev) => {
          const newBalance = prev + win;
          setLastResult({ final, win, newBalance, choice, target });
          return newBalance;
        });
        setRolling(false);
        if (win > bet) toast.success(`You won $${(win - bet).toFixed(2)}!`);
        else if (win === bet) toast('Push – bet returned.');
        else toast.error(`You lost $${bet.toFixed(2)}.`);
        return;
      }
      setTimeout(tick, interval);
    };
    setTimeout(tick, interval);
  };

  return (
    <CasinoLayout
      title="Dice"
      subtitle="Roll over or under the target. Win = 2x bet."
      icon={Dices}
      themeColor="cyan"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="cyan" pulse={rolling} idle backgroundImage={casinoAssets.images.backgroundFelt}>
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setChoice('over')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition casino-btn ${
                choice === 'over'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp size={20} /> Over
            </button>
            <button
              type="button"
              onClick={() => setChoice('under')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition casino-btn ${
                choice === 'under'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <TrendingDown size={20} /> Under
            </button>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">Target (1–6)</label>
            <input
              type="number"
              min={1}
              max={6}
              value={target}
              onChange={(e) => setTarget(Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 1)))}
              className="w-24 bg-black/50 border border-cyan-500/40 rounded-xl px-4 py-3 text-white text-center text-2xl focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="relative">
            <div key={rollKey} className={`relative inline-block ${showWinBurst ? 'win-burst' : ''}`}>
              <CasinoDice
                value={diceValue ?? 1}
                rolling={rolling}
                size={112}
                className="w-28 h-28 md:w-32 md:h-32"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
            <div className="w-full">
              <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
              <input
                type="number"
                min={1}
                max={gameBalance}
                value={bet}
                onChange={(e) => setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))}
                className="w-full bg-black/50 border border-cyan-500/40 rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <button
              onClick={roll}
              disabled={rolling || gameBalance < 1}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition"
            >
              {rolling ? 'Rolling...' : 'Roll'}
            </button>
          </div>

          {lastResult && (
            <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/30 text-center w-full max-w-sm">
              <div className="text-gray-400">
                Rolled {lastResult.final} ({lastResult.choice} {lastResult.target})
              </div>
              <div className={lastResult.win >= bet ? 'text-cyan-400 font-bold' : 'text-red-400'}>
                {lastResult.win >= bet ? `+$${(lastResult.win - bet).toFixed(2)}` : `-$${(bet - lastResult.win).toFixed(2)}`}
              </div>
              <div className="text-gray-400 text-sm">Balance: ${lastResult.newBalance.toFixed(2)}</div>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Dice;
