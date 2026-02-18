import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { ICOContent } from '../Context';
import { useGameWallet } from '../hooks/useGameWallet';
import { userAPI } from '../services/api';
import { getSocket } from '../services/socket';
import {
  Wallet,
  Gamepad2,
  RotateCw,
  Dices,
  LayoutGrid,
  CircleDot,
  Sparkles,
  Users,
  Coins,
  Bomb,
  ArrowUpDown,
  Gauge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { casinoAssets } from '../config/casinoAssets';

const GAMES = [
  { id: 'spin-the-wheel', name: 'Spin the Wheel', path: '/games/spin-the-wheel', icon: RotateCw, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20', desc: 'Bet and spin. Land on 0.5x–3x multipliers.' },
  { id: 'slots', name: 'Slots', path: '/games/slots', icon: LayoutGrid, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20', desc: 'Classic 3-reel slots. Match symbols to win.' },
  { id: 'blackjack', name: 'Blackjack', path: '/games/blackjack', icon: CircleDot, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20', desc: 'Get 21 or closer. Beat the dealer.' },
  { id: 'roulette', name: 'Roulette', path: '/games/roulette', icon: CircleDot, color: 'from-red-500 to-rose-600', glow: 'shadow-red-500/20', desc: 'Bet on numbers or colors. Spin the ball.' },
  { id: 'dice', name: 'Dice', path: '/games/dice', icon: Dices, color: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/20', desc: 'Roll over or under a target. Double or nothing.' },
  { id: 'crash', name: 'Crash', path: '/games/crash', icon: Sparkles, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20', desc: 'Provably fair. Server generates crash point. Cash out before it crashes.' },
  { id: 'coin-flip', name: 'Coin Flip', path: '/games/coin-flip', icon: Coins, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20', desc: 'Heads or tails. Provably fair.' },
  { id: 'plinko', name: 'Plinko', path: '/games/plinko', icon: CircleDot, color: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/20', desc: 'Drop the ball. Land in a bucket for a multiplier.' },
  { id: 'mines', name: 'Mines', path: '/games/mines', icon: Bomb, color: 'from-red-500 to-rose-600', glow: 'shadow-red-500/20', desc: 'Reveal tiles. Cash out before you hit a mine.' },
  { id: 'hi-lo', name: 'Hi-Lo', path: '/games/hi-lo', icon: ArrowUpDown, color: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/20', desc: 'Guess if the next card is higher or lower.' },
  { id: 'limbo', name: 'Limbo', path: '/games/limbo', icon: Gauge, color: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/20', desc: 'Pick a target multiplier. Win if the result reaches it.' },
  { id: 'multiplayer-dice', name: 'Multiplayer Dice', path: '/games/multiplayer-dice', icon: Users, color: 'from-indigo-500 to-cyan-600', glow: 'shadow-indigo-500/20', desc: "Join a room and play with others. See everyone's rolls live." },
];

const Games = () => {
  const { address } = useContext(ICOContent);
  const { gameBalance, setGameBalance } = useGameWallet();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!address) return;
    const socket = getSocket();
    const handler = async (payload) => {
      if (!payload) return;
      const wallets = [payload.wallet, payload.buyer, payload.seller, payload.to, payload.from]
        .filter(Boolean)
        .map((w) => String(w).toLowerCase());
      if (wallets.includes(address.toLowerCase())) {
        try {
          const server = await userAPI.getGameBalance(address);
          setGameBalance(server || 0);
        } catch (_) {}
      }
    };
    socket.on('user_activity_update', handler);
    return () => socket.off('user_activity_update', handler);
  }, [address, setGameBalance]);

  const handleRefresh = async () => {
    if (!address) {
      toast.error('Connect your wallet to view deposits.');
      return;
    }
    setRefreshing(true);
    try {
      const server = await userAPI.getGameBalance(address);
      setGameBalance(server || 0);
      toast.success('Balance refreshed');
    } catch (err) {
      toast.error('Failed to refresh balance');
    } finally {
      setRefreshing(false);
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
          <p className="text-gray-400 text-lg">Fund your casino chips by depositing USDT to the platform deposit address and verifying the deposit. Your chips balance is shared across all games.</p>
        </div>

        <div className="bg-gray-900/70 backdrop-blur rounded-2xl border border-purple-500/30 p-6 mb-10 shadow-xl shadow-purple-500/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Wallet className="text-purple-400" /> Casino Chips</h2>
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Balance</span>
              <span className="text-3xl font-bold text-green-400">{gameBalance.toFixed(0)} chips</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/deposit" className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-500/20">Deposit Chips</Link>
            <button type="button" onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl">{refreshing ? 'Refreshing...' : 'Refresh Balance'}</button>
          </div>
          {!address && <p className="text-amber-400 text-sm mt-2">Connect your wallet to view and use chips.</p>}
          <p className="text-gray-500 text-sm mt-2">To add chips, deposit USDT to the platform deposit address and then verify the deposit via the Payments page.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = game.icon;
            const cardImage = casinoAssets.gameCards?.[game.id];
            return (
              <Link key={game.id} to={game.path} className="group block bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-700/50 overflow-hidden hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="relative h-40 w-full overflow-hidden bg-gray-800">
                  {cardImage ? (
                    <img src={cardImage} alt={game.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${game.color} ${game.glow}`}>
                      <Icon className="text-white opacity-90" size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition">{game.name}</h3>
                  <p className="text-gray-400 text-sm">{game.desc}</p>
                  <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium mt-3 group-hover:gap-2 transition-all">Play now <Gamepad2 size={14} /></span>
                </div>
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
