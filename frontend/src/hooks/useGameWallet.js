import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { ICOContent } from '../Context';
import { userAPI } from '../services/api';

export const GAME_WALLET_KEY = 'durchex_game_wallet_balance';

/**
 * Shared game wallet balance across all game pages. Keyed by connected wallet address.
 * Syncs with backend so balance is restored if localStorage is cleared.
 */
export function useGameWallet() {
  const { address } = useContext(ICOContent) || {};
  const walletKey = address ? `${GAME_WALLET_KEY}_${address.toLowerCase()}` : GAME_WALLET_KEY;
  const [gameBalance, setGameBalance] = useState(0);
  const syncTimeoutRef = useRef(null);

  // On load: use max(localStorage, server) so we restore from server if local was cleared
  useEffect(() => {
    if (!address) {
      try {
        const saved = localStorage.getItem(GAME_WALLET_KEY);
        if (saved != null) setGameBalance(parseFloat(saved) || 0);
        else setGameBalance(0);
      } catch (_) {
        setGameBalance(0);
      }
      return;
    }
    let cancelled = false;
    const local = (() => {
      try {
        const s = localStorage.getItem(walletKey);
        return s != null ? parseFloat(s) || 0 : 0;
      } catch (_) {
        return 0;
      }
    })();
    userAPI.getGameBalance(address).then((serverBalance) => {
      if (cancelled) return;
      const server = typeof serverBalance === 'number' ? serverBalance : 0;
      const use = Math.max(local, server);
      setGameBalance(use);
      try {
        localStorage.setItem(walletKey, String(use));
      } catch (_) {}
    }).catch(() => {
      if (!cancelled) setGameBalance(local);
    });
    return () => { cancelled = true; };
  }, [walletKey, address]);

  const syncToServer = useCallback((balance) => {
    if (!address) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      userAPI.syncGameBalance(address, balance);
      syncTimeoutRef.current = null;
    }, 1500);
  }, [address]);

  const persistBalance = useCallback(
    (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      setGameBalance(num);
      try {
        localStorage.setItem(walletKey, String(num));
      } catch (_) {}
      syncToServer(num);
    },
    [walletKey, syncToServer]
  );

  const addToBalance = useCallback(
    (amount) => {
      const a = parseFloat(amount) || 0;
      setGameBalance((prev) => {
        const next = prev + a;
        try {
          localStorage.setItem(walletKey, String(next));
        } catch (_) {}
        syncToServer(next);
        return next;
      });
    },
    [walletKey, syncToServer]
  );

  const deductFromBalance = useCallback(
    (amount) => {
      const a = parseFloat(amount) || 0;
      setGameBalance((prev) => {
        const next = Math.max(0, prev - a);
        try {
          localStorage.setItem(walletKey, String(next));
        } catch (_) {}
        syncToServer(next);
        return next;
      });
    },
    [walletKey, syncToServer]
  );

  return { gameBalance, setGameBalance: persistBalance, addToBalance, deductFromBalance, walletKey };
}
