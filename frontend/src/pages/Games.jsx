import React, { useState, useEffect, useContext, useCallback } from 'react';
import Header from '../components/Header';
import Footer from '../FooterComponents/Footer';
import { ICOContent } from '../Context';
import { Wallet, Coins, CreditCard, Gamepad2, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

const GAME_WALLET_KEY = 'durchex_game_wallet_balance';

/**
 * Games page – casino-style: game wallet (deposit crypto/fiat), spin the wheel.
 */
const Games = () => {
  const { address } = useContext(ICOContent);
  const [gameBalance, setGameBalance] = useState(0);
  const [depositTab, setDepositTab] = useState('crypto'); // 'crypto' | 'fiat'
  const [depositAmount, setDepositAmount] = useState('');
  const [spinBet, setSpinBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  // Load game wallet from localStorage (keyed by wallet address or anonymous)
  const walletKey = address ? `${GAME_WALLET_KEY}_${address.toLowerCase()}` : GAME_WALLET_KEY;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(walletKey);
      if (saved != null) setGameBalance(parseFloat(saved) || 0);
    } catch (_) {
      setGameBalance(0);
    }
  }, [walletKey]);

  const persistBalance = useCallback(
    (value) => {
      setGameBalance(value);
      try {
        localStorage.setItem(walletKey, String(value));
      } catch (_) {}
    },
    [walletKey]
  );

  const handleDepositCrypto = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!address) {
      toast.error('Connect your wallet to deposit');
      return;
    }
    // Demo: credit game wallet without actual on-chain transfer
    persistBalance(gameBalance + amount);
    setDepositAmount('');
    toast.success(`$${amount.toFixed(2)} added to game wallet (demo)`);
  };

  const handleDepositFiat = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    // Demo: simulate fiat deposit
    persistBalance(gameBalance + amount);
    setDepositAmount('');
    toast.success(`$${amount.toFixed(2)} added to game wallet (demo – fiat coming soon)`);
  };

  const segments = [
    { label: '2x', multiplier: 2, color: '#ef4444' },
    { label: '0.5x', multiplier: 0.5, color: '#3b82f6' },
    { label: '1.5x', multiplier: 1.5, color: '#22c55e' },
    { label: '0', multiplier: 0, color: '#6b7280' },
    { label: '3x', multiplier: 3, color: '#a855f7' },
    { label: '1x', multiplier: 1, color: '#eab308' },
    { label: '0.5x', multiplier: 0.5, color: '#ec4899' },
    { label: '1.5x', multiplier: 1.5, color: '#14b8a6' },
  ];

  const spinWheel = () => {
    if (spinning) return;
    const bet = Math.min(Math.max(1, spinBet), gameBalance);
    if (bet > gameBalance) {
      toast.error('Not enough balance in game wallet');
      return;
    }
    setSpinning(true);
    setLastResult(null);

    const index = Math.floor(Math.random() * segments.length);
    const segment = segments[index];
    const extraRotations = 5 + Math.random() * 3;
    const deg = 360 * extraRotations + (360 / segments.length) * index + (360 / segments.length) * 0.5;
    setWheelRotation((prev) => prev + deg);

    setTimeout(() => {
      setSpinning(false);
      const win = bet * segment.multiplier;
      const newBalance = gameBalance - bet + win;
      persistBalance(newBalance);
      setLastResult({
        multiplier: segment.multiplier,
        label: segment.label,
        bet,
        win,
        newBalance,
      });
      if (win > bet) toast.success(`Won ${segment.label}! +$${(win - bet).toFixed(2)}`);
      else if (win < bet) toast.error(`Landed on ${segment.label}. -$${(bet - win).toFixed(2)}`);
      else toast('Landed on 1x – push.');
    }, 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {/* Casino header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Gamepad2 className="text-purple-400" size={40} />
            Durchex Casino
          </h1>
          <p className="text-gray-400">
            Use your game wallet to play. Deposit with crypto or fiat to get started.
          </p>
        </div>

        {/* Game wallet card */}
        <div className="bg-gray-800/60 rounded-2xl border border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="text-purple-400" /> Game Wallet
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Balance</span>
              <span className="text-2xl font-bold text-green-400">
                ${gameBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2 border border-gray-600 rounded-lg p-2 bg-gray-900/50">
              <button
                type="button"
                onClick={() => setDepositTab('crypto')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  depositTab === 'crypto'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Coins size={18} /> Crypto
              </button>
              <button
                type="button"
                onClick={() => setDepositTab('fiat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  depositTab === 'fiat'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard size={18} /> Fiat
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-32 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
              <button
                type="button"
                onClick={depositTab === 'crypto' ? handleDepositCrypto : handleDepositFiat}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
              >
                Deposit
              </button>
            </div>
          </div>
          {!address && (
            <p className="text-amber-400 text-sm mt-2">
              Connect your wallet to deposit crypto. Fiat deposit is demo only.
            </p>
          )}
        </div>

        {/* Spin the wheel */}
        <div className="bg-gray-800/60 rounded-2xl border border-gray-700 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <RotateCw className="text-amber-400" /> Spin the Wheel
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            <div className="relative flex items-center justify-center">
              <div
                className="relative w-64 h-64 rounded-full border-8 border-amber-500/50 shadow-xl"
                style={{
                  background: `conic-gradient(${segments.map((seg, i) => `${seg.color} ${(i * 360) / segments.length}deg ${((i + 1) * 360) / segments.length}deg`).join(', ')})`,
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                }}
              >
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className="absolute text-white font-bold text-sm drop-shadow-md"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${(i + 0.5) * (360 / segments.length)}deg) translateY(-70px) rotate(-${(i + 0.5) * (360 / segments.length)}deg)`,
                    }}
                  >
                    {seg.label}
                  </div>
                ))}
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-red-500 z-10 pointer-events-none drop-shadow-lg" />
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Bet amount ($)</label>
                <input
                  type="number"
                  min={1}
                  max={gameBalance}
                  value={spinBet}
                  onChange={(e) => setSpinBet(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-32 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <button
                onClick={spinWheel}
                disabled={spinning || gameBalance < 1}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl transition flex items-center gap-2 justify-center"
              >
                <RotateCw size={20} /> {spinning ? 'Spinning...' : 'Spin'}
              </button>
              {lastResult && (
                <div className="bg-gray-900/80 rounded-lg p-4 text-sm">
                  <div className="text-gray-400">Landed on {lastResult.label}</div>
                  <div className="text-white font-semibold">
                    {lastResult.win >= lastResult.bet
                      ? `+$${(lastResult.win - lastResult.bet).toFixed(2)}`
                      : `-$${(lastResult.bet - lastResult.win).toFixed(2)}`}
                  </div>
                  <div className="text-gray-400">Balance: ${lastResult.newBalance.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* More games placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Slots', 'Blackjack', 'Roulette'].map((game) => (
            <div
              key={game}
              className="bg-gray-800/40 rounded-xl border border-gray-700 p-6 text-center opacity-75"
            >
              <Gamepad2 className="mx-auto text-gray-500 mb-2" size={32} />
              <h3 className="text-white font-semibold">{game}</h3>
              <p className="text-gray-500 text-sm">Coming soon</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
