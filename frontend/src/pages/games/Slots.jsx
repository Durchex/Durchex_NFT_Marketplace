import React, { useState, useEffect } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { useGameRoom } from '../../hooks/useGameRoom';
import { useCasinoSound } from '../../hooks/useCasinoSound';
import GameMultiplayerBar from '../../components/games/GameMultiplayerBar';
import { LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import CasinoParticles from '../../components/games/CasinoParticles';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const SYMBOLS = ['CH', 'LM', 'OR', 'GR', 'DM', '7', 'ST', 'BL'];
const SYMBOL_IMAGES = {
  CH: casinoAssets.sprites.slotCherry,
  LM: casinoAssets.sprites.slotLemon,
  OR: casinoAssets.sprites.slotOrange,
  GR: casinoAssets.sprites.slotGrape,
  DM: casinoAssets.sprites.slotDiamond,
  '7': casinoAssets.sprites.slotSeven,
  ST: casinoAssets.sprites.slotStar,
  BL: casinoAssets.sprites.slotBell,
};
const PAYOUTS = { '7': 10, 'DM': 5, 'ST': 3, 'BL': 2, 'GR': 1.5, 'OR': 1.2, 'LM': 1, 'CH': 0.8 };

const Slots = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const sound = useCasinoSound({ volume: 0.5 });
  const [mode, setMode] = useState('single');
  const gameRoom = useGameRoom('slots');
  const { joined, leaveRoom, emitResult } = gameRoom;
  const [bet, setBet] = useState(5);
  const [reels, setReels] = useState(['CH', 'CH', 'CH']);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(null);
  const [reelKeys, setReelKeys] = useState([0, 0, 0]);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const handleSetMode = (m) => {
    if (m === 'single' && joined) leaveRoom();
    setMode(m);
  };

  useEffect(() => {
    if (lastWin && lastWin.win > 0) {
      setShowWinFlash(true);
      setShowParticles(true);
      sound.playSlotWin();
      const t = setTimeout(() => setShowWinFlash(false), 600);
      const t2 = setTimeout(() => setShowParticles(false), 1400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [lastWin]);

  const spin = () => {
    if (spinning || gameBalance < bet) {
      if (gameBalance < bet) toast.error('Not enough balance');
      return;
    }
    setSpinning(true);
    setLastWin(null);
    setGameBalance((prev) => prev - bet);
    sound.playSlotSpin();
    let count = 0;
    const maxCount = 18;
    const tick = () => {
      count++;
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      setReelKeys([count * 3, count * 3 + 1, count * 3 + 2]);
      if (count >= maxCount) {
        const a = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const b = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const c = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        setReels([a, b, c]);
        setReelKeys([count * 3, count * 3 + 1, count * 3 + 2]);
        let multiplier = 0;
        const matchingIndices = [];
        if (a === b && b === c) {
          multiplier = PAYOUTS[a] ?? 1;
          matchingIndices.push(0, 1, 2);
        } else if (a === b || b === c || a === c) {
          multiplier = 0.5;
          if (a === b) matchingIndices.push(0, 1);
          if (b === c) matchingIndices.push(1, 2);
          if (a === c) matchingIndices.push(0, 2);
        }
        const win = bet * multiplier;
        setGameBalance((prev) => {
          const newBalance = prev + win;
          setLastWin({ win, newBalance, matchingIndices });
          return newBalance;
        });
        setSpinning(false);
        if (mode === 'multiplayer' && joined) emitResult({ bet, win });
        if (win > 0) toast.success('Won!');
        else toast('No match.');
        return;
      }
      setTimeout(tick, 120);
    };
    setTimeout(tick, 120);
  };

  return (
    <CasinoLayout
      title="Slots"
      subtitle="Match 3 symbols to win. Classic 3-reel slots."
      icon={LayoutGrid}
      themeColor="emerald"
      gameBalance={gameBalance}
    >
      <GameMultiplayerBar
        mode={mode}
        setMode={handleSetMode}
        themeColor="emerald"
        {...gameRoom}
      />
      <CasinoGameSurface themeColor="emerald" pulse={spinning} idle backgroundImage={casinoAssets.images.backgroundCasino}>
        <div className="flex flex-col items-center gap-8 relative">
          <CasinoParticles active={showParticles} count={28} duration={1200} />
          <div
            className={`relative flex gap-4 md:gap-6 p-6 rounded-2xl casino-panel-frame border-emerald-500/40 bg-black/60 ${
              showWinFlash ? 'win-burst shadow-[0_0_40px_rgba(16,185,129,0.4)]' : ''
            }`}
            style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.15)' }}
          >
            {reels.map((s, i) => (
              <div
                key={reelKeys[i] ?? i}
                className={`w-24 h-28 md:w-28 md:h-32 flex items-center justify-center rounded-xl border-2 border-emerald-500/30 bg-gradient-to-b from-gray-800 to-gray-900 overflow-hidden reel-drop-in ${(lastWin?.matchingIndices ?? []).includes(i) ? 'casino-symbol-win ring-2 ring-emerald-400' : ''}`}
                style={{
                  boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.4)',
                  animationDuration: '0.35s',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <img src={SYMBOL_IMAGES[s] || casinoAssets.sprites.slotCherry} alt={s} className="w-16 h-16 object-contain" />
              </div>
            ))}
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
                className="w-full bg-black/50 border border-emerald-500/40 rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <button
              onClick={spin}
              disabled={spinning || gameBalance < 1}
              className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition"
            >
              {spinning ? 'Spinning...' : 'Spin'}
            </button>
          </div>
          {lastWin && (
            <div className="bg-black/40 rounded-xl p-4 border border-emerald-500/30 text-center w-full max-w-sm">
              {lastWin.win > 0 ? (
                <span className="text-emerald-400 font-bold text-lg">+${lastWin.win.toFixed(2)}</span>
              ) : (
                <span className="text-gray-400">No win</span>
              )}
              <span className="text-gray-400 ml-2">Balance: ${lastWin.newBalance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CasinoGameSurface>
    </CasinoLayout>
  );
};

export default Slots;
