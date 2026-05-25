const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// ── Database ────────────────────────────────────────────────
const { MongoMemoryServer } = require('mongodb-memory-server');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pollplatform';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected → ${MONGO_URI}`);
  } catch (err) {
    console.error(`❌ Local MongoDB connection failed: ${err.message}`);
    console.log('⏳ Starting in-memory MongoDB fallback...');
    
    try {
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ In-memory MongoDB connected → ${memoryUri}`);
    } catch (memErr) {
      console.error('❌ Failed to start in-memory database:', memErr.message);
      process.exit(1);
    }
  }
};

connectDB();

// ── Socket.io ───────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join_poll', (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined poll ${pollId}`);
  });

  socket.on('leave_poll', (pollId) => {
    socket.leave(pollId);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/polls', require('./routes/polls'));
app.use('/api/responses', require('./routes/responses'));

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
