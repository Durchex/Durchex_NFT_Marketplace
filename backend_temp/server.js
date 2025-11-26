import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParse from "body-parser";
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

// connect db
connectDB();

const corsOptions = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
};

// app use
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParse.json({ limit: "10mb" }));

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
    // Broadcast to all users in the room
    socket.broadcast.emit('user_activity_update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint for socket service
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount 
  });
});

// auto-imported routes

app.get('/', (req, res) => {
  res.send('Welcome to the backend API!');
});


app.use('/api/v1/user', userRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/nft', nftRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin-auth', adminAuthRouter);
app.use('/api/v1/verification', verificationRouter);
app.use('/api/v1/gas-fee', gasFeeRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server is running on port: ${PORT} with Socket.io support 🎉🎉🎉`)
);
