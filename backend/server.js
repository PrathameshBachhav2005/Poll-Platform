const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ── Socket.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.get("/about", (req, res) => {
    res.send("About Page for poll platform");
});

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.set('io', io);

// ── Routes (registered BEFORE DB so the server can boot) ────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/polls',     require('./routes/polls'));
app.use('/api/responses', require('./routes/responses'));



// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ msg: 'Internal server error' });
});

// ── Socket events ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join_poll',      (pollId) => { socket.join(pollId); });
  socket.on('leave_poll',     (pollId) => { socket.leave(pollId); });
  socket.on('join_user_room', (userId) => { socket.join(`user:${userId}`); });
  socket.on('leave_user_room',(userId) => { socket.leave(`user:${userId}`); });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ── Poll expiration scheduler ────────────────────────────────
function startExpirationScheduler() {
  const Poll = require('./models/Poll');
  const firedSet = new Set();

  const checkExpired = async () => {
    try {
      const now = new Date();
      const recentlyExpired = await Poll.find({
        expiresAt: { $lte: now, $gt: new Date(now - 35_000) },
      }).select('_id creator');

      for (const poll of recentlyExpired) {
        const key = poll._id.toString();
        if (firedSet.has(key)) continue;
        firedSet.add(key);
        io.to(key).emit('poll_expired', { pollId: key });
        io.to(`user:${poll.creator.toString()}`).emit('dashboard_poll_expired', { pollId: key });
        console.log(`⏰ Poll ${key} expired — notified`);
      }

      if (firedSet.size > 5000) firedSet.clear();
    } catch (err) {
      console.error('Expiration scheduler error:', err.message);
    }
  };

  checkExpired();
  setInterval(checkExpired, 30_000);
}

// ── Database connection ──────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set!');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    startExpirationScheduler();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});

// ── Start server ─────────────────────────────────────────────
// Bind to 0.0.0.0 so it works on all deployment platforms
const PORT = parseInt(process.env.PORT, 10) || 5001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
