# Modular Casino Game System

## Overview

- **Configurable RTP** (90–96% default) per game; house edge = 1 - RTP.
- **Provably fair**: server seed + client seed + nonce → HMAC-SHA256 → float in [0,1). Outcomes are deterministic and verifiable.
- **Server-authoritative wallet**: bets deducted atomically before resolution; wins credited only after valid outcome.
- **Game math separate from UI**: all probability and payout logic lives in `services/casinoGameMath/`; RTP/config in `config/casinoConfig.js`.

## Backend Layout

- `config/casinoConfig.js` – RTP and limits per game (no code change needed to adjust house edge).
- `utils/provablyFair.js` – `generateServerSeed`, `hashSeed`, `getProvablyFairFloat`, `getVerificationHash`.
- `services/casinoGameMath/` – One module per game: crash, dice, coinFlip, plinko, mines, roulette, hiLo, limbo, slots. Each exports `generateXOutcome(float, config, options)` → `{ outcome, payoutMultiplier, verificationData }`.
- `models/casinoRoundModel.js` – Round schema (walletAddress, gameId, bet, payout, serverSeedHash, serverSeed, clientSeed, nonce, outcome, verificationHash, status).
- `controllers/casinoController.js` – `placeBet` (atomic deduct → run game math → credit → save round), `minesCashout`, `getRound`, `getConfig`, `getAnalytics`.
- `routes/casinoRouter.js` – POST `/place-bet`, POST `/mines-cashout`, GET `/round/:id`, GET `/config`, GET `/analytics`.

## API

- **POST /api/v1/casino/place-bet**  
  Body: `{ walletAddress, gameId, betAmount, clientSeed?, options? }`  
  Options are game-specific (e.g. Crash: `cashOutMultiplier`, Dice: `target`, `choice`, Mines: none; payout on cashout).

- **POST /api/v1/casino/mines-cashout**  
  Body: `{ walletAddress, roundId, revealedIndices }`  
  Credits payout based on number of safe reveals.

- **GET /api/v1/casino/round/:id**  
  Returns round for verification (serverSeed revealed).

- **GET /api/v1/casino/config**  
  Returns RTP and config per game.

- **GET /api/v1/casino/analytics**  
  Returns totalBets, totalPayouts, netHouseProfit (overall and per game).

## Game IDs

`crash`, `dice`, `coin_flip`, `plinko`, `mines`, `roulette`, `hi_lo`, `limbo`, `slots`.

## Frontend

- `casinoAPI` in `services/api.js`: `placeBet`, `minesCashout`, `getRound`, `getConfig`, `getAnalytics`.
- Crash page at `/games/crash` uses server place-bet with `options.cashOutMultiplier`.

Other games (Dice, Coin Flip, Plinko, etc.) can be wired the same way: call `casinoAPI.placeBet` with the right `gameId` and `options`, then set balance from `newBalance` and show outcome/verification.
