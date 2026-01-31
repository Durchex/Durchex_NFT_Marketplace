# Professional Casino Game Assets

Use these sources to add **sounds, images, sprites, and effects** so the games look and sound professional. Place files in `public/assets/casino/` as described in the README files in each subfolder.

## Sound (royalty-free, commercial use)

| Source | Notes |
|--------|--------|
| [Freesound.org](https://freesound.org) | Search "dice roll", "casino", "slot machine", "card flip". Check license (CC0/CC-BY). |
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/search/casino/) | Free for commercial use, no attribution. |
| [Kenney.nl – Game Sounds](https://kenney.nl/assets/game-sounds) | Free (CC0). Generic UI and game sounds. |
| [Mixkit](https://mixkit.co/free-sound-effects/game/) | Free game sound effects. |
| [ZapSplat](https://www.zapsplat.com/sound-effect-category/casino-sounds/) | Free with attribution; paid for no-attribution. |

**Suggested files to add:**  
`dice-roll.mp3`, `dice-land.mp3`, `card-flip.mp3`, `slot-spin.mp3`, `slot-win.mp3`, `roulette-spin.mp3`, `win.mp3`, `lose.mp3`, `button-click.mp3` in `public/assets/casino/sounds/`.

---

## Images & sprites

| Source | Notes |
|--------|--------|
| [Kenney.nl](https://kenney.nl/assets) | **Board Game Pack**, **Game Icons**, **UI Pack** – free (CC0). Dice, cards, chips, UI. |
| [OpenGameArt.org](https://opengameart.org) | Search "playing cards", "dice", "roulette", "slot". Check license per asset. |
| [itch.io – Game Assets](https://itch.io/game-assets/free) | Many free/paid packs: cards, casino UI, slot symbols. |
| [OpenClipart](https://openclipart.org) | SVG playing cards, dice, casino icons (Public Domain). |

**Suggested:**  
- Table felt / wood texture for backgrounds.  
- Slot symbols (cherry, lemon, seven, etc.) as PNG sprites.  
- Card backs and optional card faces if not using built-in SVG cards.

---

## Particle effects

The app includes a **CasinoParticles** component (confetti/burst). For more advanced effects:

- Use the built-in CSS/JS particle burst, or  
- Integrate a library (e.g. [canvas-confetti](https://www.npmjs.com/package/canvas-confetti), [tsparticles](https://particles.js.org/)) and trigger it on win.

---

## 3D / models (optional)

For realistic 3D dice or roulette:

- **Three.js** with free .glb/.gltf models from [Sketchfab](https://sketchfab.com) (filter by " downloadable " and check license).  
- **Kenney.nl** – "3D Game Kit" or "3D Models" for simple low-poly dice/chips.

---

## File layout

```
public/assets/casino/
├── sounds/     ← MP3/OGG (see sounds/README.md)
├── images/     ← PNG/JPG backgrounds, frames (see images/README.md)
└── sprites/    ← PNG symbols, icons (see sprites/README.md)
```

The app uses **inline SVG** for dice pips and playing cards by default, so games look good even without external images. Add the files above to enhance with real audio and art.
