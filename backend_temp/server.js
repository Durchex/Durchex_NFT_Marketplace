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

// connect db
connectDB();

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

  // Game rooms: multiplayer games (dice, etc.)
  socket.on('game_join_room', (data) => {
    const roomId = data?.roomId || 'default';
    const gameType = data?.gameType || 'dice';
    const room = `game_${gameType}_${roomId}`;
    socket.join(room);
    socket.gameRoom = room;
    socket.gameRoomId = roomId;
    socket.gameType = gameType;
    const playerCount = io.sockets.adapter.rooms.get(room)?.size || 1;
    io.to(room).emit('game_room_joined', {
      roomId,
      gameType,
      socketId: socket.id,
      displayName: data?.displayName || socket.id.slice(0, 8),
      playerCount,
    });
    console.log('Game join room:', socket.id, room, 'players:', playerCount);
  });

  socket.on('game_leave_room', () => {
    if (socket.gameRoom) {
      socket.leave(socket.gameRoom);
      io.to(socket.gameRoom).emit('game_room_left', {
        socketId: socket.id,
        roomId: socket.gameRoomId,
        playerCount: io.sockets.adapter.rooms.get(socket.gameRoom)?.size || 0,
      });
      socket.gameRoom = null;
      socket.gameRoomId = null;
      socket.gameType = null;
    }
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
    if (socket.gameRoom) {
      io.to(socket.gameRoom).emit('game_room_left', {
        socketId: socket.id,
        roomId: socket.gameRoomId,
        playerCount: io.sockets.adapter.rooms.get(socket.gameRoom)?.size ? io.sockets.adapter.rooms.get(socket.gameRoom).size - 1 : 0,
      });
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server is running on port: ${PORT} with Socket.io support 🎉🎉🎉`)
);
