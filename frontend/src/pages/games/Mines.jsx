import React, { useState, useContext } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { ICOContent } from '../../Context';
import { Bomb, Gem } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import CasinoGameSurface from '../../components/games/CasinoGameSurface';
import { casinoAPI } from '../../services/api';
import { casinoAssets } from '../../config/casinoAssets';
import '../../styles/casino.css';

const TOTAL_TILES = 25;
const GRID_COLS = 5;

const Mines = () => {
  const { address } = useContext(ICOContent) || {};
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [roundId, setRoundId] = useState(null);
  const [tiles, setTiles] = useState(() => Array(TOTAL_TILES).fill(null)); // null | 'safe' | 'mine'
  const [revealing, setRevealing] = useState(null);

  const handleStart = async () => {
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
    setRoundId(null);
    setTiles(Array(TOTAL_TILES).fill(null));
    try {
      const data = await casinoAPI.placeBet({
        walletAddress: address,
        gameId: 'mines',
        betAmount: bet,
        options: {},
      });
      setGameBalance(data.newBalance ?? gameBalance - bet);
      setRoundId(data.roundId);
      setLastResult({
        roundId: data.roundId,
        bet: data.bet,
        newBalance: data.newBalance,
      });
      toast.success('Reveal tiles. Cash out before you hit a mine!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Start failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (index) => {
    if (!roundId || !address || tiles[index] !== null || revealing !== null) return;
    setRevealing(index);
    try {
      const data = await casinoAPI.minesReveal({
        walletAddress: address,
        roundId,
        tileIndex: index,
      });
      const isMine = data.isMine === true;
      setTiles((prev) => {
        const next = [...prev];
        next[index] = isMine ? 'mine' : 'safe';
        return next;
      });
      if (isMine) {
        setRoundId(null);
        const revealed = tiles.map((t, i) => (t === 'safe' ? i : null)).filter((i) => i !== null);
        revealed.push(index);
        try {
          await casinoAPI.minesCashout({
            walletAddress: address,
            roundId,
            revealedIndices: revealed,
          });
        } catch (_) {}
        setLastResult((prev) => ({ ...prev, payout: 0, cashedOut: false, hitMine: true }));
        toast.error('Boom! You hit a mine.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Reveal failed');
    } finally {
      setRevealing(null);
    }
  };

  const handleCashout = async () => {
    if (!roundId || !address) return;
    const revealedIndices = tiles
      .map((t, i) => (t === 'safe' ? i : null))
      .filter((i) => i !== null);
    if (revealedIndices.length === 0) {
      toast.error('Reveal at least one tile first');
      return;
    }
    setLoading(true);
    try {
      const data = await casinoAPI.minesCashout({
        walletAddress: address,
        roundId,
        revealedIndices,
      });
      setGameBalance(data.newBalance ?? gameBalance);
      setLastResult((prev) => ({
        ...prev,
        payout: data.payout,
        cashedOut: data.cashedOut,
        newBalance: data.newBalance,
      }));
      setRoundId(null);
      setTiles(Array(TOTAL_TILES).fill(null));
      if (data.cashedOut) toast.success('Cashed out! +$' + (data.payout ?? 0).toFixed(2));
      else toast.error('Cashout failed.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Cashout failed');
    } finally {
      setLoading(false);
    }
  };

  const revealedCount = tiles.filter((t) => t !== null).length;
  const safeCount = tiles.filter((t) => t === 'safe').length;
  const multiplier = Math.min(10, 1 + (safeCount * 0.2) * 0.96);

  return (
    <CasinoLayout
      title="Mines"
      subtitle="Reveal tiles one by one. Cash out before you hit a mine."
      icon={Bomb}
      themeColor="red"
      gameBalance={gameBalance}
    >
      <CasinoGameSurface themeColor="red" pulse={loading} idle backgroundImage={casinoAssets?.images?.backgroundFelt}>
        <div className="flex flex-col items-center gap-6">
          <div className="casino-panel-frame rounded-2xl p-4 text-center casino-idle-float">
            {roundId && (
              <div className="text-gray-400 text-sm">
                Revealed: {safeCount} — Multiplier: {multiplier.toFixed(2)}x — Cash out to win ${(bet * multiplier).toFixed(2)}
              </div>
            )}
            {lastResult?.payout != null && !roundId && (
              <div className="text-xl font-bold text-emerald-400">+${(lastResult.payout ?? 0).toFixed(2)}</div>
            )}
          </div>

          {/* Grid */}
          <div
            className="grid gap-2 mx-auto"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, width: 'min(320px, 100%)' }}
          >
            {Array.from({ length: TOTAL_TILES }).map((_, index) => {
              const state = tiles[index];
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleReveal(index)}
                  disabled={!roundId || state !== null || revealing !== null}
                  className={`mines-tile min-h-[52px] rounded-xl border-2 transition-all duration-200 ${
                    state === null
                      ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30 hover:border-red-400/70 text-gray-400'
                      : state === 'safe'
                      ? 'revealed bg-emerald-500/30 border-emerald-400/60 text-emerald-200'
                      : 'revealed mine bg-red-600/80 border-red-400 text-white'
                  }`}
                >
                  {state === null && (
                    <span className="text-lg font-bold opacity-80">?</span>
                  )}
                  {state === 'safe' && <Gem className="w-6 h-6 mx-auto text-emerald-300" />}
                  {state === 'mine' && <Bomb className="w-6 h-6 mx-auto" />}
                </button>
              );
            })}
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
                className="w-full bg-black/50 border border-red-500/40 rounded-xl px-4 py-3 text-white text-center"
              />
            </div>
            {!roundId ? (
              <button
                onClick={handleStart}
                disabled={loading || gameBalance < 0.01 || !address}
                className="casino-btn w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {loading ? 'Starting…' : 'Start round'}
              </button>
            ) : (
              <button
                onClick={handleCashout}
                disabled={loading || safeCount === 0}
                className="casino-btn px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Cash out ${(bet * multiplier).toFixed(2)}
              </button>
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
