import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../FooterComponents/Footer';
import { useGameWallet } from '../../hooks/useGameWallet';
import { Dices, ArrowLeft, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Dice = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState('over'); // 'over' | 'under'
  const [target, setTarget] = useState(4);
  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const roll = () => {
    if (rolling || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setRolling(true);
    setLastResult(null);
    setDiceValue(null);

    setGameBalance(gameBalance - bet);

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
        const newBalance = gameBalance - bet + win;
        setGameBalance(newBalance);
        setLastResult({ final, win, newBalance, choice, target });
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/games" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
            <ArrowLeft size={20} /> Back to Games
          </Link>
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-cyan-500/30">
            <Wallet className="text-cyan-400" size={20} />
            <span className="text-xl font-bold text-cyan-400">${gameBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Dices className="text-cyan-400" size={36} />
            Dice
          </h1>
          <p className="text-gray-400">Roll over or under the target. Win = 2x bet.</p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur rounded-3xl border border-cyan-500/20 p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setChoice('over')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${
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
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${
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
                className="w-24 bg-black/50 border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-center text-2xl"
              />
            </div>

            <div className="w-28 h-28 flex items-center justify-center bg-gray-800/80 rounded-2xl border-4 border-cyan-500/30 text-5xl font-bold text-cyan-400">
              {diceValue ?? '?'}
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
                  className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-center"
                />
              </div>
              <button
                onClick={roll}
                disabled={rolling || gameBalance < 1}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition"
              >
                {rolling ? 'Rolling...' : 'Roll'}
              </button>
            </div>

            {lastResult && (
              <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20 text-center">
                <div className="text-gray-400">Rolled {lastResult.final} ({lastResult.choice} {lastResult.target})</div>
                <div className={lastResult.win >= bet ? 'text-cyan-400 font-bold' : 'text-red-400'}>
                  {lastResult.win >= bet ? `+$${(lastResult.win - bet).toFixed(2)}` : `-$${(bet - lastResult.win).toFixed(2)}`}
                </div>
                <div className="text-gray-400 text-sm">Balance: ${lastResult.newBalance.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dice;
