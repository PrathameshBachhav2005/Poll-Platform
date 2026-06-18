const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.set('io', io);

// ── Database ────────────────────────────────────────────────
const { MongoMemoryServer } = require('mongodb-memory-server');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pollplatform';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB connected → ${MONGO_URI}`);
    startExpirationScheduler(); // start AFTER db is ready
  } catch (err) {
    console.error(`❌ Local MongoDB failed: ${err.message}`);
    console.log('⏳ Starting in-memory MongoDB fallback…');
    try {
      const mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('✅ In-memory MongoDB connected');
      startExpirationScheduler();
    } catch (memErr) {
      console.error('❌ In-memory DB failed:', memErr.message);
      process.exit(1);
    }
  }
};

// ── Poll expiration scheduler ───────────────────────────────
// Runs every 30 s. Finds polls whose expiresAt just passed,
// emits `poll_expired` to the poll room and `dashboard_poll_expired`
// to the owner's personal room so their dashboard updates live.
function startExpirationScheduler() {
  const Poll = require('./models/Poll');

  // Track which polls we've already fired so we don't spam
  const firedSet = new Set();

  const checkExpired = async () => {
    try {
      const now = new Date();
      // Find polls that expired in the last 35 s (covers the 30 s window)
      const recentlyExpired = await Poll.find({
        expiresAt: { $lte: now, $gt: new Date(now - 35_000) },
      }).select('_id creator');

      for (const poll of recentlyExpired) {
        const key = poll._id.toString();
        if (firedSet.has(key)) continue;
        firedSet.add(key);

        // Broadcast to anyone viewing this poll's page
        io.to(key).emit('poll_expired', { pollId: key });

        // Broadcast to the creator's personal room for live dashboard update
        const creatorRoom = `user:${poll.creator.toString()}`;
        io.to(creatorRoom).emit('dashboard_poll_expired', { pollId: key });

        console.log(`⏰ Poll ${key} expired — notified voters & dashboard`);
      }

      // Prune the firedSet every hour to avoid unbounded growth
      if (firedSet.size > 5000) firedSet.clear();
    } catch (err) {
      console.error('Expiration scheduler error:', err.message);
    }
  };

  // Run once immediately on startup, then every 30 s
  checkExpired();
  setInterval(checkExpired, 30_000);
}

// ── Socket.io ───────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join a specific poll room (voters + result viewers)
  socket.on('join_poll', (pollId) => {
    socket.join(pollId);
    console.log(`Socket ${socket.id} joined poll ${pollId}`);
  });

  socket.on('leave_poll', (pollId) => {
    socket.leave(pollId);
  });

  // Join a personal user room (dashboard real-time updates)
  socket.on('join_user_room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user room user:${userId}`);
  });

  socket.on('leave_user_room', (userId) => {
    socket.leave(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/polls',     require('./routes/polls'));
app.use('/api/responses', require('./routes/responses'));

// ── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ msg: 'Route not found' }));

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
