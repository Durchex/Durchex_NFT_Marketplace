/**
 * Casino assets: working image URLs (Unsplash, placehold.co) for backgrounds and sprites.
 * Sounds still use local /assets/casino/sounds/ – add MP3 files there for audio.
 */

export const casinoAssets = {
  sounds: {
    diceRoll: '/assets/casino/sounds/dice-roll.mp3',
    diceLand: '/assets/casino/sounds/dice-land.mp3',
    cardFlip: '/assets/casino/sounds/card-flip.mp3',
    cardDeal: '/assets/casino/sounds/card-deal.mp3',
    slotSpin: '/assets/casino/sounds/slot-spin.mp3',
    slotWin: '/assets/casino/sounds/slot-win.mp3',
    rouletteSpin: '/assets/casino/sounds/roulette-spin.mp3',
    rouletteBall: '/assets/casino/sounds/roulette-ball.mp3',
    chipPlace: '/assets/casino/sounds/chip-place.mp3',
    win: '/assets/casino/sounds/win.mp3',
    lose: '/assets/casino/sounds/lose.mp3',
    buttonClick: '/assets/casino/sounds/button-click.mp3',
  },
  images: {
    backgroundFelt: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800',
    backgroundCasino: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    chips: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    dice: 'https://images.unsplash.com/photo-1611672585731-fa11203e5c42?w=400',
    cards: 'https://images.unsplash.com/photo-1581276879432-15caa84b4512?w=400',
  },
  /** Game card images for the Games hub (Unsplash / placehold.co – working links) */
  gameCards: {
    'spin-the-wheel': 'https://images.unsplash.com/photo-1533309907656-7b1c2ee56ddf?w=400',
    slots: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400',
    blackjack: 'https://images.unsplash.com/photo-1581276879432-15caa84b4512?w=400',
    roulette: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400',
    dice: 'https://images.unsplash.com/photo-1611672585731-fa11203e5c42?w=400',
    crash: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    'coin-flip': 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',
    plinko: 'https://placehold.co/400x240/06b6d4/white?text=Plinko',
    mines: 'https://placehold.co/400x240/dc2626/white?text=Mines',
    'hi-lo': 'https://images.unsplash.com/photo-1581276879432-15caa84b4512?w=400',
    limbo: 'https://placehold.co/400x240/f43f5e/white?text=Limbo',
    'multiplayer-dice': 'https://images.unsplash.com/photo-1611672585731-fa11203e5c42?w=400',
  },
  sprites: {
    slotCherry: 'https://placehold.co/80x80/15803d/white?text=CH',
    slotLemon: 'https://placehold.co/80x80/facc15/1e293b?text=LM',
    slotOrange: 'https://placehold.co/80x80/ea580c/white?text=OR',
    slotGrape: 'https://placehold.co/80x80/7c3aed/white?text=GR',
    slotDiamond: 'https://placehold.co/80x80/06b6d4/white?text=DM',
    slotSeven: 'https://placehold.co/80x80/dc2626/white?text=7',
    slotStar: 'https://placehold.co/80x80/eab308/1e293b?text=ST',
    slotBell: 'https://placehold.co/80x80/0d9488/white?text=BL',
  },
};

export default casinoAssets;
