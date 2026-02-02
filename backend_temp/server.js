import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParse from "body-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// auto import routes
// const { readdirSync } = require("fs");

import userRouter from "./routes/userRouter.js"; 
import cartRouter from "./routes/cartRouter.js";
import nftRouter from "./routes/nftRouter.js";
import adminRouter from "./routes/adminRouter.js";
import adminAuthRouter from "./routes/adminAuthRouter.js";
import verificationRouter from "./routes/verificationRouter.js";
import gasFeeRouter from "./routes/gasFeeRouter.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";
import withdrawalAdminRoutes from "./routes/withdrawalAdminRoutes.js";
import orderRouter from "./routes/orderRouter.js";
import offerRouter from "./routes/offerRouter.js";
import nftListingRequestRouter from "./routes/nftListingRequestRouter.js";
import engagementRouter from "./routes/engagementRouter.js";
import coverPhotoRouter from "./routes/coverPhotoRouter.js";
import chainAPIRouter from "./routes/chainAPI.js";
import royaltyRouter from "./routes/royalty.js";
import analyticsRouter from "./routes/analytics.js";
import bridgeRouter from "./routes/bridge.js";
import rentalRouter from "./routes/rental.js";
import searchRouter from "./routes/search.js";
import poolRouter from "./routes/pool.js";
import financingRouter from "./routes/financing.js";
import monetizationRouter from "./routes/monetization.js";
import governanceRouter from "./routes/governance.js";
import complianceRouter from "./routes/compliance.js";
import performanceRouter from "./routes/performance.js";
import mintingRoutes from "./routes/mintingRoutes.js";
import lazyMintRouter from "./routes/lazyMint.js";
import reviewRouter from "./routes/reviewRouter.js";
import marketplaceSettingsRouter from "./routes/marketplaceSettingsRouter.js";
import casinoRouter from "./routes/casinoRouter.js";
import auctionRouter from "./routes/auctionRouter.js";
import stakingRouter from "./routes/staking.js";
import FinancingServiceStub from "./services/FinancingServiceStub.js";
import GovernanceService from "./services/GovernanceService.js";
import MonetizationServiceStub from "./services/MonetizationServiceStub.js";
import AnalyticsServiceStub from "./services/AnalyticsServiceStub.js";

// connect db
connectDB();

// Services required by routes (so financing/governance/monetization/analytics don't 500)
app.locals.financingService = new FinancingServiceStub();
app.locals.governanceService = new GovernanceService();
app.locals.monetizationService = new MonetizationServiceStub();
app.locals.analyticsService = new AnalyticsServiceStub();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased from 100)
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const corsOptions = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
};

// app use
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParse.json({ limit: "10mb" }));

// Health check endpoint for socket service - BEFORE rate limiter
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount 
  });
});

// Root endpoint - BEFORE rate limiter
app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});

// Rate limiting temporarily disabled to prevent blocking legitimate requests
// app.use(limiter);

// In-memory game rooms: roomCode -> { roomName, gameType, players, roundId, bets, countdownTimer, resultTimer }
const gameRooms = new Map();
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  return code;
}

function getPlayersList(room) {
  if (!room?.players) return [];
  return Array.from(room.players.entries()).map(([sid, p]) => ({
    socketId: sid,
    username: p.username || 'Player',
    avatarUrl: p.avatarUrl || null,
    wallet: p.wallet || null,
  }));
}

function resolveDiceRound(roomCode) {
  const room = gameRooms.get(roomCode);
  if (!room || !room.roundId || room.countdownTimer == null) return;
  clearTimeout(room.countdownTimer);
  room.countdownTimer = null;
  const diceValue = 1 + Math.floor(Math.random() * 6);
  const results = [];
  const bets = room.bets || new Map();
  bets.forEach((bet, sid) => {
    const player = room.players?.get(sid);
    const won = (bet.choice === 'over' && diceValue > bet.target) || (bet.choice === 'under' && diceValue < bet.target);
    const push = (bet.choice === 'over' && diceValue === bet.target) || (bet.choice === 'under' && diceValue === bet.target);
    let amount = 0;
    if (push) amount = bet.bet;
    else if (won) amount = bet.bet * 2;
    results.push({
      socketId: sid,
      username: player?.username || 'Player',
      avatarUrl: player?.avatarUrl,
      won,
      push,
      amount,
      bet: bet.bet,
      choice: bet.choice,
      target: bet.target,
    });
  });
  room.bets = new Map();
  const roomName = `game_${room.gameType}_${roomCode}`;
  io.to(roomName).emit('round_result', {
    roundId: room.roundId,
    diceValue,
    results,
  });
  room.resultTimer = setTimeout(() => {
    room.resultTimer = null;
    room.roundId = null;
    io.to(roomName).emit('round_next', {});
  }, 5000);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle live minting updates
  socket.on('join_minting_updates', () => {
    socket.join('minting_updates');
    console.log('User joined minting updates:', socket.id);
  });

  // Handle trending updates
  socket.on('join_trending_updates', () => {
    socket.join('trending_updates');
    console.log('User joined trending updates:', socket.id);
  });

  // Handle user activity
  socket.on('user_activity', (data) => {
    console.log('User activity:', data);
    socket.broadcast.emit('user_activity_update', data);
  });

  // Game: create room (returns room code)
  socket.on('game_create_room', (data, ack) => {
    const gameType = data?.gameType || 'dice';
    let code = generateRoomCode();
    while (gameRooms.has(code)) code = generateRoomCode();
    const roomName = `game_${gameType}_${code}`;
    const room = {
      roomCode: code,
      gameType,
      players: new Map(),
      roundId: null,
      bets: new Map(),
      countdownTimer: null,
      resultTimer: null,
    };
    room.players.set(socket.id, {
      username: data?.username || 'Player',
      avatarUrl: data?.avatarUrl || null,
      wallet: data?.wallet || null,
    });
    gameRooms.set(code, room);
    socket.join(roomName);
    socket.gameRoom = roomName;
    socket.gameRoomId = code;
    socket.gameType = gameType;
    socket.isRoomHost = true;
    const players = getPlayersList(room);
    io.to(roomName).emit('game_players_updated', { roomCode: code, players });
    if (typeof ack === 'function') ack({ roomCode: code, success: true });
    console.log('Game room created:', code, 'by', socket.id);
  });

  // Game: join room by code
  socket.on('game_join_room', (data, ack) => {
    const roomCode = String(data?.roomCode || data?.roomId || '').toUpperCase().trim();
    const gameType = data?.gameType || 'dice';
    const room = gameRooms.get(roomCode);
    if (!room) {
      if (typeof ack === 'function') ack({ success: false, error: 'Room not found' });
      return;
    }
    const roomName = `game_${gameType}_${roomCode}`;
    room.players.set(socket.id, {
      username: data?.username || 'Player',
      avatarUrl: data?.avatarUrl || null,
      wallet: data?.wallet || null,
    });
    socket.join(roomName);
    socket.gameRoom = roomName;
    socket.gameRoomId = roomCode;
    socket.gameType = gameType;
    socket.isRoomHost = false;
    const players = getPlayersList(room);
    io.to(roomName).emit('game_players_updated', { roomCode, players });
    if (typeof ack === 'function') ack({ roomCode, success: true });
    console.log('Game join room:', socket.id, roomCode);
  });

  socket.on('game_leave_room', () => {
    if (socket.gameRoom && socket.gameRoomId) {
      const room = gameRooms.get(socket.gameRoomId);
      if (room) {
        room.players.delete(socket.id);
        if (room.players.size === 0) {
          if (room.countdownTimer) clearTimeout(room.countdownTimer);
          if (room.resultTimer) clearTimeout(room.resultTimer);
          gameRooms.delete(socket.gameRoomId);
        } else {
          io.to(socket.gameRoom).emit('game_players_updated', { roomCode: socket.gameRoomId, players: getPlayersList(room) });
          io.to(socket.gameRoom).emit('game_room_left', { socketId: socket.id, playerCount: room.players.size });
        }
      }
      socket.leave(socket.gameRoom);
      socket.gameRoom = null;
      socket.gameRoomId = null;
      socket.gameType = null;
      socket.isRoomHost = null;
    }
  });

  // Dice: submit bet for current round
  socket.on('game_submit_bet', (data) => {
    const room = gameRooms.get(socket.gameRoomId);
    if (!room || !room.roundId) return;
    const { choice, target, bet } = data || {};
    if (choice !== 'over' && choice !== 'under') return;
    const t = Math.max(1, Math.min(6, parseInt(target, 10) || 4));
    const b = Math.max(0, parseFloat(bet) || 0);
    if (!room.bets) room.bets = new Map();
    room.bets.set(socket.id, { choice, target: t, bet: b });
    io.to(socket.gameRoom).emit('game_bet_placed', {
      socketId: socket.id,
      username: room.players.get(socket.id)?.username || 'Player',
      choice,
      target: t,
      bet: b,
    });
  });

  // Dice: start round (host or any player)
  socket.on('game_start_round', () => {
    const room = gameRooms.get(socket.gameRoomId);
    if (!room) return;
    if (room.roundId || room.countdownTimer) return;
    const roundId = Date.now().toString();
    room.roundId = roundId;
    room.bets = new Map();
    const countdownEnd = Date.now() + 10000;
    io.to(socket.gameRoom).emit('round_start', { roundId, countdownEnd });
    room.countdownTimer = setTimeout(() => resolveDiceRound(socket.gameRoomId), 10000);
  });

  socket.on('game_action', (data) => {
    const room = socket.gameRoom;
    if (!room || !data) return;
    const payload = {
      ...data,
      socketId: socket.id,
      displayName: data.displayName || socket.id.slice(0, 8),
      timestamp: new Date().toISOString(),
    };
    io.to(room).emit('game_broadcast', payload);
  });

  socket.on('disconnect', () => {
    if (socket.gameRoom && socket.gameRoomId) {
      const room = gameRooms.get(socket.gameRoomId);
      if (room) {
        room.players.delete(socket.id);
        if (room.players.size === 0) {
          if (room.countdownTimer) clearTimeout(room.countdownTimer);
          if (room.resultTimer) clearTimeout(room.resultTimer);
          gameRooms.delete(socket.gameRoomId);
        } else {
          io.to(socket.gameRoom).emit('game_players_updated', { roomCode: socket.gameRoomId, players: getPlayersList(room) });
          io.to(socket.gameRoom).emit('game_room_left', { socketId: socket.id, playerCount: room.players.size });
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });
});



app.use('/api/v1/user', userRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/nft', nftRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin-auth', adminAuthRouter);
app.use('/api/v1/verification', verificationRouter);
app.use('/api/v1/gas-fee', gasFeeRouter);
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/admin', withdrawalAdminRoutes);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/offers', offerRouter);
app.use('/api/v1/nft-listing-requests', nftListingRequestRouter);
app.use('/api/v1/engagement', engagementRouter);
app.use('/api/v1/cover-photos', coverPhotoRouter);
app.use('/api/v1/chain', chainAPIRouter);
app.use('/api/v1/royalty', royaltyRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/bridge', bridgeRouter);
app.use('/api/v1/rental', rentalRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/pool', poolRouter);
app.use('/api/v1/financing', financingRouter);
app.use('/api/v1/monetization', monetizationRouter);
app.use('/api/v1/governance', governanceRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/performance', performanceRouter);
app.use('/api/v1/minting', mintingRoutes);
app.use('/api/v1/lazy-mint', lazyMintRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/settings/marketplace', marketplaceSettingsRouter);
app.use('/api/v1/casino', casinoRouter);
app.use('/api/v1/auctions', auctionRouter);
app.use('/api/v1/staking', stakingRouter);
app.use('/api/v1/notifications', notificationRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server is running on port: ${PORT} with Socket.io support 🎉🎉🎉`)
);
