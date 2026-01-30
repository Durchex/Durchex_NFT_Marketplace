import { useState, useEffect, useCallback, useContext } from 'react';
import { ICOContent } from '../Context';

export const GAME_WALLET_KEY = 'durchex_game_wallet_balance';

/**
 * Shared game wallet balance across all game pages. Keyed by connected wallet address.
 */
export function useGameWallet() {
  const { address } = useContext(ICOContent) || {};
  const walletKey = address ? `${GAME_WALLET_KEY}_${address.toLowerCase()}` : GAME_WALLET_KEY;
  const [gameBalance, setGameBalance] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(walletKey);
      if (saved != null) setGameBalance(parseFloat(saved) || 0);
      else setGameBalance(0);
    } catch (_) {
      setGameBalance(0);
    }
  }, [walletKey]);

  const persistBalance = useCallback(
    (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      setGameBalance(num);
      try {
        localStorage.setItem(walletKey, String(num));
      } catch (_) {}
    },
    [walletKey]
  );

  const addToBalance = useCallback(
    (amount) => {
      const a = parseFloat(amount) || 0;
      setGameBalance((prev) => {
        const next = prev + a;
        try {
          localStorage.setItem(walletKey, String(next));
        } catch (_) {}
        return next;
      });
    },
    [walletKey]
  );

  const deductFromBalance = useCallback(
    (amount) => {
      const a = parseFloat(amount) || 0;
      setGameBalance((prev) => {
        const next = Math.max(0, prev - a);
        try {
          localStorage.setItem(walletKey, String(next));
        } catch (_) {}
        return next;
      });
    },
    [walletKey]
  );

  return { gameBalance, setGameBalance: persistBalance, addToBalance, deductFromBalance, walletKey };
}
