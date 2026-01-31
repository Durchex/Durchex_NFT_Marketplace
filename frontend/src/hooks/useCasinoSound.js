import { useCallback, useRef, useEffect } from 'react';
import { casinoAssets } from '../config/casinoAssets';

const SOUND_KEYS = Object.keys(casinoAssets.sounds);

const cache = new Map();

function loadSound(src) {
  if (cache.has(src)) return cache.get(src);
  const audio = new Audio(src);
  audio.preload = 'auto';
  cache.set(src, audio);
  return audio;
}

function playSound(src, volume = 0.6) {
  if (!src) return;
  try {
    const audio = loadSound(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (_) {}
}

/**
 * Hook for casino game sounds. Plays from public/assets/casino/sounds/.
 * Add real MP3 files (see ASSETS.md) for professional audio.
 */
export function useCasinoSound(options = {}) {
  const { enabled = true, volume = 0.6 } = options;
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const play = useCallback(
    (key) => {
      if (!enabledRef.current || !casinoAssets.sounds[key]) return;
      playSound(casinoAssets.sounds[key], volume);
    },
    [volume]
  );

  return {
    play,
    playDiceRoll: () => play('diceRoll'),
    playDiceLand: () => play('diceLand'),
    playCardFlip: () => play('cardFlip'),
    playCardDeal: () => play('cardDeal'),
    playSlotSpin: () => play('slotSpin'),
    playSlotWin: () => play('slotWin'),
    playRouletteSpin: () => play('rouletteSpin'),
    playRouletteBall: () => play('rouletteBall'),
    playChipPlace: () => play('chipPlace'),
    playWin: () => play('win'),
    playLose: () => play('lose'),
    playButtonClick: () => play('buttonClick'),
    SOUND_KEYS,
  };
}

export default useCasinoSound;
