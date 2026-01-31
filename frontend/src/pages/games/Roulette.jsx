import React, { useState } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { useGameRoom } from '../../hooks/useGameRoom';
import { useCasinoSound } from '../../hooks/useCasinoSound';
import GameMultiplayerBar from '../../components/games/GameMultiplayerBar';
import { CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import '../../styles/casino.css';

const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

const Roulette = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const sound = useCasinoSound({ volume: 0.5 });
  const [mode, setMode] = useState('single');
  const gameRoom = useGameRoom('roulette');
  const { joined, leaveRoom, emitResult } = gameRoom;
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState('red');
  const [numberBet, setNumberBet] = useState(17);
  const [spinning, setSpinning] = useState(false);
  const [ball, setBall] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const wheelRef = React.useRef(0);

  const handleSetMode = (m) => {
    if (m === 'single' && joined) leaveRoom();
    setMode(m);
  };

  const spin = () => {
    if (spinning || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setSpinning(true);
    setLastResult(null);
    setBall(null);
    setGameBalance(gameBalance - bet);

    const final = Math.floor(Math.random() * 37);
    const spinDuration = 4000;
    const interval = 80;
    let count = 0;
    const maxCount = Math.ceil(spinDuration / interval);

    const tick = () => {
      count++;
      setBall(1 + Math.floor(Math.random() * 37));
      setWheelRotation((prev) => prev + 40);
      if (count >= maxCount) {
        setBall(final);
        wheelRef.current += 360 * 5 + Math.random() * 360;
        setWheelRotation(wheelRef.current);
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
        sound.playRouletteBall();
        if (win > 0) sound.playWin();
        else sound.playLose();
        if (mode === 'multiplayer' && joined) emitResult({ bet, win });
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
  const ballColor = ball !== null ? (ball === 0 ? 'bg-emerald-500' : isRed(ball) ? 'bg-red-500' : 'bg-gray-900') : 'bg-gray-600';

  return (
    <CasinoLayout
      title="Roulette"
      subtitle="Bet on red, black, or a number. Spin the ball."
      icon={CircleDot}
      themeColor="red"
      gameBalance={gameBalance}
    >
      <GameMultiplayerBar
        mode={mode}
        setMode={handleSetMode}
        themeColor="red"
        {...gameRoom}
      />
      <CasinoGameSurface themeColor="red" pulse={spinning} idle>
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setBetType('red')}
              className={`px-6 py-3 rounded-xl font-bold transition casino-btn ${
                betType === 'red' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Red
            </button>
            <button
              type="button"
              onClick={() => setBetType('black')}
              className={`px-6 py-3 rounded-xl font-bold transition casino-btn ${
                betType === 'black' ? 'bg-gray-800 text-white border-2 border-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Black
            </button>
            <button
              type="button"
              onClick={() => setBetType('number')}
              className={`px-6 py-3 rounded-xl font-bold transition casino-btn ${
                betType === 'number' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Number
            </button>
          </div>
          {betType === 'number' && (
            <div>
              <label className="text-gray-400 text-sm block mb-1">Number (0–36)</label>
              <input
                type="number"
                min={0}
                max={36}
                value={numberBet}
                onChange={(e) => setNumberBet(Math.max(0, Math.min(36, parseInt(e.target.value, 10) || 0)))}
                className="w-24 bg-black/50 border border-red-500/40 rounded-xl px-4 py-3 text-white text-center text-xl focus:ring-2 focus:ring-red-500/50"
              />
            </div>
          )}

          <div className="casino-perspective flex items-center justify-center gap-6">
            <div
              className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-red-500/60 flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
              style={{
                background: `radial-gradient(circle at 30% 30%, #1f2937, #111827)`,
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 40px rgba(239,68,68,0.2), 0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <span className={`ball-bounce ${ballColor} w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold text-white shadow-lg`}>
                {ball !== null ? ball : '?'}
              </span>
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
                className="w-full bg-black/50 border border-red-500/40 rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-red-500/50"
              />
            </div>
            <button
              onClick={spin}
              disabled={spinning || gameBalance < 1}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition"
            >
              {spinning ? 'Spinning...' : 'Spin'}
            </button>
          </div>
          {lastResult && (
            <div className="bg-black/40 rounded-xl p-4 border border-red-500/30 text-center w-full max-w-sm">
              <div className="text-gray-400">
                Landed on {lastResult.final}{' '}
                {lastResult.final === 0 ? '(green)' : isRed(lastResult.final) ? '(red)' : '(black)'}
              </div>
              <div className={lastResult.win >= bet ? 'text-green-400 font-bold' : 'text-red-400'}>
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

export default Roulette;
