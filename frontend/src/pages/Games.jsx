import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { ICOContent } from '../Context';
import { useGameWallet } from '../hooks/useGameWallet';
import { userAPI } from '../services/api';
import {
  Wallet,
  Gamepad2,
  RotateCw,
  Dices,
  LayoutGrid,
  CircleDot,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

const GAMES = [
  {
    id: 'spin-the-wheel',
    name: 'Spin the Wheel',
    path: '/games/spin-the-wheel',
    icon: RotateCw,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    desc: 'Bet and spin. Land on 0.5x–3x multipliers.',
  },
  {
    id: 'slots',
    name: 'Slots',
    path: '/games/slots',
    icon: LayoutGrid,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    desc: 'Classic 3-reel slots. Match symbols to win.',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    path: '/games/blackjack',
    icon: CircleDot,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    desc: 'Get 21 or closer. Beat the dealer.',
  },
  {
    id: 'roulette',
    name: 'Roulette',
    path: '/games/roulette',
    icon: CircleDot,
    color: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/20',
    desc: 'Bet on numbers or colors. Spin the ball.',
  },
  {
    id: 'dice',
    name: 'Dice',
    path: '/games/dice',
    icon: Dices,
    color: 'from-cyan-500 to-blue-600',
    glow: 'shadow-cyan-500/20',
    desc: 'Roll over or under a target. Double or nothing.',
  },
  {
    id: 'multiplayer-dice',
    name: 'Multiplayer Dice',
    path: '/games/multiplayer-dice',
    icon: Users,
    color: 'from-indigo-500 to-cyan-600',
    glow: 'shadow-indigo-500/20',
    desc: 'Join a room and play with others. See everyone\'s rolls live.',
  },
];

const GAME_POINTS_PER_REDEEM = 1000;

/**
 * Games hub – game points balance + enter game code to get 1000 points. No deposit.
 */
const Games = () => {
  const { address } = useContext(ICOContent);
  const { gameBalance, setGameBalance } = useGameWallet();
  const [gameCode, setGameCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeemCode = async () => {
    const code = (gameCode || '').trim();
    if (!code) {
      toast.error('Enter your game code');
      return;
    }
    if (!address) {
      toast.error('Connect your wallet to redeem');
      return;
    }
    setRedeeming(true);
    try {
      const data = await userAPI.redeemGameCode(code, address);
      if (data?.success && data?.points) {
        const newBalance = typeof data.gameBalance === 'number' ? data.gameBalance : gameBalance + (data.points || GAME_POINTS_PER_REDEEM);
        setGameBalance(newBalance);
        setGameCode('');
        toast.success(`${data.points || GAME_POINTS_PER_REDEEM} game points added!`);
      } else {
        toast.error('Invalid or already used code');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to redeem code');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-amber-400" size={44} />
            Durchex Casino
          </h1>
          <p className="text-gray-400 text-lg">
            Use your game code from your profile to get 1000 points. Your balance is shared across all games.
          </p>
        </div>

        {/* Game wallet + enter code */}
        <div className="bg-gray-900/70 backdrop-blur rounded-2xl border border-purple-500/30 p-6 mb-10 shadow-xl shadow-purple-500/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="text-purple-400" /> Game Points
          </h2>
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Balance</span>
              <span className="text-3xl font-bold text-green-400">{gameBalance.toFixed(0)} pts</span>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-gray-400 text-sm block mb-1">
                <Ticket className="inline mr-1 size-4" /> Enter game code (from your profile)
              </label>
              <input
                type="text"
                placeholder="e.g. A1B2C3D4"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full bg-black/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 font-mono uppercase"
              />
            </div>
            <button
              type="button"
              onClick={handleRedeemCode}
              disabled={redeeming || !gameCode.trim() || !address}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/20"
            >
              {redeeming ? 'Redeeming...' : 'Redeem'}
            </button>
          </div>
          {!address && (
            <p className="text-amber-400 text-sm mt-2">
              Connect your wallet to redeem your game code.
            </p>
          )}
          <p className="text-gray-500 text-sm mt-2">
            New users get a game code when they register; find it on your profile and redeem it here for 1000 points (one-time).
          </p>
        </div>

        {/* Game cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <Link
                key={game.id}
                to={game.path}
                className="group block bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 p-6 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${game.color} ${game.glow} shadow-lg mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition">
                  {game.name}
                </h3>
                <p className="text-gray-400 text-sm">{game.desc}</p>
                <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                  Play now <Gamepad2 size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
