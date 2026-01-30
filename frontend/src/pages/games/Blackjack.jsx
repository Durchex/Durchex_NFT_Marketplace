import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../FooterComponents/Footer';
import { useGameWallet } from '../../hooks/useGameWallet';
import { CircleDot, ArrowLeft, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const VALUES = { A: 11, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 10, Q: 10, K: 10 };

function newDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += VALUES[c.rank];
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces) {
    total -= 10;
    aces--;
  }
  return total;
}

const Card = ({ card }) => (
  <div className="w-14 h-20 md:w-16 md:h-22 bg-white rounded-lg border border-gray-300 flex flex-col items-center justify-center text-black shadow-lg">
    <span className="text-lg font-bold">{card.rank}</span>
    <span className="text-red-600 text-sm">{card.suit}</span>
  </div>
);

const Blackjack = () => {
  const { gameBalance, setGameBalance } = useGameWallet();
  const [bet, setBet] = useState(10);
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [dealerHole, setDealerHole] = useState(null);
  const [phase, setPhase] = useState('bet');
  const [message, setMessage] = useState('');

  const startHand = () => {
    if (gameBalance < bet) {
      toast.error('Not enough balance');
      return;
    }
    const d = newDeck();
    const p = [d.pop(), d.pop()];
    const dealerCards = [d.pop(), d.pop()];
    setDeck(d);
    setPlayer(p);
    setDealer([dealerCards[0]]);
    setDealerHole(dealerCards[1]);
    setPhase('play');
    setGameBalance(gameBalance - bet);
    setMessage('');
    if (handValue(p) === 21) {
      setDealer([dealerCards[0], dealerCards[1]]);
      setDealerHole(null);
      endHand(d, p, [dealerCards[0], dealerCards[1]]);
    }
  };

  const hit = () => {
    const d = [...deck];
    const p = [...player, d.pop()];
    setDeck(d);
    setPlayer(p);
    if (handValue(p) > 21) {
      setPhase('result');
      setMessage('Bust!');
      toast.error('Bust!');
    }
  };

  const stand = () => {
    const d = [...deck];
    const finalDealer = [...dealer];
    if (dealerHole) finalDealer.push(dealerHole);
    setDealer(finalDealer);
    setDealerHole(null);
    while (handValue(finalDealer) < 17 && d.length) finalDealer.push(d.pop());
    endHand(d, player, finalDealer);
  };

  const endHand = (d, p, dealerCards) => {
    setDeck(d);
    setPlayer(p);
    setDealer(dealerCards);
    setPhase('result');
    const pv = handValue(p);
    const dv = handValue(dealerCards);
    if (pv > 21) {
      setMessage('Bust!');
      return;
    }
    if (dv > 21) {
      setMessage('Dealer bust! You win!');
      setGameBalance(gameBalance - bet + bet * 2);
      toast.success('Dealer bust! You win!');
      return;
    }
    if (pv > dv) {
      setMessage('You win!');
      setGameBalance(gameBalance - bet + bet * 2);
      toast.success('You win!');
      return;
    }
    if (pv < dv) {
      setMessage('Dealer wins.');
      toast.error('Dealer wins.');
      return;
    }
    setMessage('Push.');
    setGameBalance(gameBalance - bet + bet);
    toast('Push.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/games" className="flex items-center gap-2 text-gray-300 hover:text-white transition">
            <ArrowLeft size={20} /> Back to Games
          </Link>
          <div className="flex items-center gap-2 bg-black/40 rounded-xl px-4 py-2 border border-violet-500/30">
            <Wallet className="text-violet-400" size={20} />
            <span className="text-xl font-bold text-violet-400">${gameBalance.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <CircleDot className="text-violet-400" size={36} /> Blackjack
          </h1>
          <p className="text-gray-400">Get 21 or closer. Beat the dealer.</p>
        </div>
        <div className="bg-gray-900/60 backdrop-blur rounded-3xl border border-violet-500/20 p-8 md:p-10 shadow-2xl">
          <div className="space-y-8">
            <div>
              <p className="text-gray-400 text-sm mb-2">Dealer {phase !== 'bet' && dealer.length ? '(' + handValue(dealer) + ')' : ''}</p>
              <div className="flex flex-wrap gap-2">
                {dealer.map((c, i) => (
                  <Card key={i} card={c} />
                ))}
                {dealerHole && (
                  <div className="w-14 h-20 md:w-16 md:h-22 bg-violet-800 rounded-lg border border-violet-600 flex items-center justify-center text-violet-300">?</div>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">You {player.length ? '(' + handValue(player) + ')' : ''}</p>
              <div className="flex flex-wrap gap-2">
                {player.map((c, i) => (
                  <Card key={i} card={c} />
                ))}
              </div>
            </div>
            {message && <p className="text-center text-xl font-bold text-white">{message}</p>}
            {phase === 'bet' && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Bet ($)</label>
                  <input type="number" min={1} max={gameBalance} value={bet} onChange={(e) => setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))} className="w-32 bg-black/50 border border-violet-500/30 rounded-xl px-4 py-3 text-white text-center" />
                </div>
                <button onClick={startHand} disabled={gameBalance < 1} className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25">Deal</button>
              </div>
            )}
            {phase === 'play' && (
              <div className="flex justify-center gap-4">
                <button onClick={hit} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">Hit</button>
                <button onClick={stand} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">Stand</button>
              </div>
            )}
            {phase === 'result' && (
              <div className="flex justify-center">
                <button onClick={() => { setPhase('bet'); setPlayer([]); setDealer([]); setDealerHole(null); setMessage(''); }} className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">New Hand</button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blackjack;
