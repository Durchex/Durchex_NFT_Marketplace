/**
 * Casino asset paths (relative to public). Place real files in public/assets/casino/.
 * See ASSETS.md for where to download professional sounds, images, sprites.
 */

const BASE = '/assets/casino';

export const casinoAssets = {
  sounds: {
    diceRoll: `${BASE}/sounds/dice-roll.mp3`,
    diceLand: `${BASE}/sounds/dice-land.mp3`,
    cardFlip: `${BASE}/sounds/card-flip.mp3`,
    cardDeal: `${BASE}/sounds/card-deal.mp3`,
    slotSpin: `${BASE}/sounds/slot-spin.mp3`,
    slotWin: `${BASE}/sounds/slot-win.mp3`,
    rouletteSpin: `${BASE}/sounds/roulette-spin.mp3`,
    rouletteBall: `${BASE}/sounds/roulette-ball.mp3`,
    chipPlace: `${BASE}/sounds/chip-place.mp3`,
    win: `${BASE}/sounds/win.mp3`,
    lose: `${BASE}/sounds/lose.mp3`,
    buttonClick: `${BASE}/sounds/button-click.mp3`,
  },
  images: {
    backgroundFelt: `${BASE}/images/background-felt.png`,
    backgroundCasino: `${BASE}/images/background-casino.jpg`,
    framePanel: `${BASE}/images/frame-panel.png`,
  },
  sprites: {
    slotCherry: `${BASE}/sprites/cherry.png`,
    slotLemon: `${BASE}/sprites/lemon.png`,
    slotSeven: `${BASE}/sprites/seven.png`,
  },
};

export default casinoAssets;
