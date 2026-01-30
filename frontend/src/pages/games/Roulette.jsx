import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../FooterComponents/Footer';
import { useGameWallet } from '../../hooks/useGameWallet';
import { CircleDot, ArrowLeft, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const Roulette = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState('red'); // red | black | number
  const [numberBet, setNumberBet] = useState(17);
  const [spinning, setSpinning] = useState(false);
  const [ball, setBall] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const spin = () => {
    if (spinning || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setSpinning(true);
    setLastResult(null);
    setBall(null);
    setGameBalance(gameBalance - bet);

    const spinDuration = 4000;
    const interval = 80;
    let count = 0;
    const maxCount = Math.ceil(spinDuration / interval);
    const tick = () => {
      count++;
      setBall(1 + Math.floor(Math.random() * 37)); // 0-36
      if (count >= maxCount) {
        const final = Math.floor(Math.random() * 37); // 0 = green, 1-36
        setBall(final);
        let win = 0;
        if (betType === 'number') {
          if (final === numberBet) win = bet * 36;
        } else if (betType === 'red') {
          if (RED.includes(final)) win = bet * 2;
        } else {
          if (BLACK.includes(final)) win = bet * 2;
        }
        const newBalance = gameBalance - bet + win;
        setGameBalance(newBalance);
        setLastResult({ final, win, newBalance, betType });
        setSpinning(false);
        if (win > 0) toast.success(`Won $${(win - bet).toFixed(2)}!`);
        else toast.error(`Lost $${bet.toFixed(2)}.`);
        return;
      }
      setTimeout(tick, interval);
    };
    setTimeout(tick, interval);
  };

  const isRed = (n) => RED.includes(n);
  const isBlack = (n) => BLACK.includes(n);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-950">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/games" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
            <ArrowLeft size={20} /> Back to Games
          </Link>
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-red-500/30">
            <Wallet className="text-red-400" size={20} />
            <span className="text-xl font-bold text-red-400">${gameBalance.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <CircleDot className="text-red-400" size={36} /> Roulette
          </h1>
          <p className="text-gray-400">Bet on red, black, or a number. Spin the ball.</p>
        </div>
        <div className="bg-gray-900/60 backdrop-blur rounded-3xl border border-red-500/20 p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              <button type="button" onClick={() => setBetType('red')} className={`px-6 py-3 rounded-xl font-bold ${betType === 'red' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Red</button>
              <button type="button" onClick={() => setBetType('black')} className={`px-6 py-3 rounded-xl font-bold ${betType === 'black' ? 'bg-gray-800 text-white border-2 border-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Black</button>
              <button type="button" onClick={() => setBetType('number')} className={`px-6 py-3 rounded-xl font-bold ${betType === 'number' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Number</button>
            </div>
            {betType === 'number' && (
              <div>
                <label className="text-gray-400 text-sm block mb-1">Number (0–36)</label>
                <input type="number" min={0} max={36} value={numberBet} onChange={(e) => setNumberBet(Math.max(0, Math.min(36, parseInt(e.target.value, 10) || 0)))} className="w-24 bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-white text-center text-xl" />
              </div>
            )}
            <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-red-500/50 flex items-center justify-center text-3xl font-bold text-white">
              {ball !== null ? ball : '?'}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
              <div className="w-full">
                <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
                <input type="number" min={1} max={gameBalance} value={bet} onChange={(e) => setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))} className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-white text-center" />
              </div>
              <button onClick={spin} disabled={spinning || gameBalance < 1} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition">
                {spinning ? 'Spinning...' : 'Spin'}
              </button>
            </div>
            {lastResult && (
              <div className="bg-black/40 rounded-xl p-4 border border-red-500/20 text-center">
                <div className="text-gray-400">Landed on {lastResult.final} {lastResult.final === 0 ? '(green)' : isRed(lastResult.final) ? '(red)' : '(black)'}</div>
                <div className={lastResult.win >= bet ? 'text-green-400 font-bold' : 'text-red-400'}>
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

export default Roulette;
