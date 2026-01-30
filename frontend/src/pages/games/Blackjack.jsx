import React, { useState } from 'react';
import { useGameWallet } from '../../hooks/useGameWallet';
import { useGameRoom } from '../../hooks/useGameRoom';
import GameMultiplayerBar from '../../components/games/GameMultiplayerBar';
import { CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import CasinoLayout from '../../components/games/CasinoLayout';
import NeonBorder from '../../components/games/NeonBorder';
import '../../styles/casino.css';

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': 'text-gray-900', '♥': 'text-red-600', '♦': 'text-red-600', '♣': 'text-gray-900' };
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

const Card = ({ card, index = 0, faceDown = false }) => (
  <div
    className={`card-deal-in w-14 h-20 md:w-16 md:h-22 rounded-lg border-2 flex flex-col items-center justify-center font-bold shadow-lg casino-3d-child ${
      faceDown
        ? 'bg-gradient-to-br from-violet-700 to-violet-900 border-violet-600'
        : 'bg-white border-gray-300'
    }`}
    style={{
      boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
      animationDelay: `${index * 0.1}s`,
    }}
  >
    {faceDown ? (
      <span className="text-violet-300 text-2xl">?</span>
    ) : (
      <>
        <span className={`text-lg ${SUIT_COLORS[card.suit] || 'text-gray-900'}`}>{card.rank}</span>
        <span className={`text-xl ${SUIT_COLORS[card.suit] || 'text-gray-900'}`}>{card.suit}</span>
      </>
    )}
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
    let winAmount = 0;
    if (pv > 21) {
      setMessage('Bust!');
      if (mode === 'multiplayer' && joined) emitResult({ bet, win: 0 });
      return;
    }
    if (dv > 21) {
      setMessage('Dealer bust! You win!');
      winAmount = bet * 2;
      setGameBalance(gameBalance - bet + winAmount);
      if (mode === 'multiplayer' && joined) emitResult({ bet, win: winAmount });
      toast.success('Dealer bust! You win!');
      return;
    }
    if (pv > dv) {
      setMessage('You win!');
      winAmount = bet * 2;
      setGameBalance(gameBalance - bet + winAmount);
      if (mode === 'multiplayer' && joined) emitResult({ bet, win: winAmount });
      toast.success('You win!');
      return;
    }
    if (pv < dv) {
      setMessage('Dealer wins.');
      if (mode === 'multiplayer' && joined) emitResult({ bet, win: 0 });
      toast.error('Dealer wins.');
      return;
    }
    setMessage('Push.');
    winAmount = bet;
    setGameBalance(gameBalance - bet + bet);
    if (mode === 'multiplayer' && joined) emitResult({ bet, win: winAmount });
    toast('Push.');
  };

  return (
    <CasinoLayout
      title="Blackjack"
      subtitle="Get 21 or closer. Beat the dealer."
      icon={CircleDot}
      themeColor="violet"
      gameBalance={gameBalance}
    >
      <GameMultiplayerBar
        mode={mode}
        setMode={handleSetMode}
        themeColor="violet"
        {...gameRoom}
      />
      <NeonBorder color="violet">
        <div className="casino-felt rounded-3xl p-6 md:p-8 space-y-8">
          <div>
            <p className="text-emerald-200/90 text-sm mb-2">
              Dealer {phase !== 'bet' && dealer.length ? `(${handValue(dealer)})` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {dealer.map((c, i) => (
                <Card key={i} card={c} index={i} />
              ))}
              {dealerHole && <Card faceDown index={dealer.length} />}
            </div>
          </div>
          <div>
            <p className="text-emerald-200/90 text-sm mb-2">
              You {player.length ? `(${handValue(player)})` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {player.map((c, i) => (
                <Card key={i} card={c} index={i} />
              ))}
            </div>
          </div>
          {message && (
            <p className="text-center text-xl font-bold text-white drop-shadow-lg">{message}</p>
          )}
          {phase === 'bet' && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div>
                <label className="text-emerald-200/80 text-sm block mb-1">Bet ($)</label>
                <input
                  type="number"
                  min={1}
                  max={gameBalance}
                  value={bet}
                  onChange={(e) => setBet(Math.max(1, Math.min(gameBalance, parseFloat(e.target.value) || 1)))}
                  className="w-32 bg-black/40 border border-violet-500/40 rounded-xl px-4 py-3 text-white text-center focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <button
                onClick={startHand}
                disabled={gameBalance < 1}
                className="casino-btn px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25"
              >
                Deal
              </button>
            </div>
          )}
          {phase === 'play' && (
            <div className="flex justify-center gap-4">
              <button
                onClick={hit}
                className="casino-btn px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg"
              >
                Hit
              </button>
              <button
                onClick={stand}
                className="casino-btn px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg"
              >
                Stand
              </button>
            </div>
          )}
          {phase === 'result' && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setPhase('bet');
                  setPlayer([]);
                  setDealer([]);
                  setDealerHole(null);
                  setMessage('');
                }}
                className="casino-btn px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25"
              >
                New Hand
              </button>
            </div>
          )}
        </div>
      </NeonBorder>
    </CasinoLayout>
  );
};

export default Blackjack;
