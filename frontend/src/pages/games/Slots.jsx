import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../FooterComponents/Footer';
import { useGameWallet } from '../../hooks/useGameWallet';
import { LayoutGrid, ArrowLeft, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const SYMBOLS = ['CH', 'LM', 'OR', 'GR', 'DM', '7', 'ST', 'BL'];
const PAYOUTS = { '7': 10, 'DM': 5, 'ST': 3, 'BL': 2, 'GR': 1.5, 'OR': 1.2, 'LM': 1, 'CH': 0.8 };

const Slots = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(5);
  const [reels, setReels] = useState(['CH', 'CH', 'CH']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);

  const spin = () => {
    if (spinning || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setSpinning(true);
    setLastWin(null);
    setGameBalance(gameBalance - bet);
    let count = 0;
    const maxCount = 15;
    const tick = () => {
      count++;
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      if (count >= maxCount) {
        const a = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const b = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const c = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        setReels([a, b, c]);
        let multiplier = 0;
        if (a === b && b === c) multiplier = PAYOUTS[a] ?? 1;
        else if (a === b || b === c || a === c) multiplier = 0.5;
        const win = bet * multiplier;
        setGameBalance(gameBalance - bet + win);
        setLastWin({ win, newBalance: gameBalance - bet + win });
        setSpinning(false);
        if (win > 0) toast.success('Won!');
        else toast('No match.');
        return;
      }
      setTimeout(tick, 150);
    };
    setTimeout(tick, 150);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/games" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
            <ArrowLeft size={20} /> Back to Games
          </Link>
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-emerald-500/30">
            <Wallet className="text-emerald-400" size={20} />
            <span className="text-xl font-bold text-emerald-400">${gameBalance.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <LayoutGrid className="text-emerald-400" size={36} /> Slots
          </h1>
          <p className="text-gray-400">Match 3 symbols to win.</p>
        </div>
        <div className="bg-gray-900/60 backdrop-blur rounded-3xl border border-emerald-500/20 p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4 md:gap-6 p-6 bg-black/50 rounded-2xl border-4 border-emerald-500/30">
              {reels.map((s, i) => (
                <div key={i} className="w-20 h-24 md:w-24 md:h-28 flex items-center justify-center text-2xl font-bold bg-gray-800/80 rounded-xl border border-emerald-500/20 text-emerald-300">
                  {s}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
              <div className="w-full">
                <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
                <input type="number" min={1} max={gameBalance} value={bet} onChange={(e) => setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))} className="w-full bg-black/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-white text-center" />
              </div>
              <button onClick={spin} disabled={spinning || gameBalance < 1} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition">
                {spinning ? 'Spinning...' : 'Spin'}
              </button>
            </div>
            {lastWin && (
              <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/20 text-center">
                {lastWin.win > 0 ? <span className="text-emerald-400 font-bold">+${lastWin.win.toFixed(2)}</span> : <span className="text-gray-400">No win</span>}
                <span className="text-gray-400 ml-2">Balance: ${lastWin.newBalance.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Slots;
