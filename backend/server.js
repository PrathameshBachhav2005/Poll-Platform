/**
 * server.js — PollFlow Backend
 *
 * Works in TWO modes:
 *   1. Vercel serverless  — exports `app`, Vercel handles the HTTP layer
 *   2. Local / Render     — calls server.listen() when run directly
 *
 * NOTE: Socket.IO real-time features (poll_expired, new_response push)
 * do NOT work on Vercel serverless because WebSocket connections can't
 * persist. For full real-time support deploy on Render, Railway, or Fly.io.
 */

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');

dotenv.config();

// ─────────────────────────────────────────────────────────────
// Express app setup
// ─────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Mongoose — lazy connection (reconnects per cold start on Vercel)
// Uses a module-level promise so we don't reconnect on every request
// ─────────────────────────────────────────────────────────────
let dbPromise = null;

function connectDB() {
  if (dbPromise) return dbPromise;

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not set in environment variables');
    // Don't crash — return a rejected promise so routes can respond with 503
    dbPromise = Promise.reject(new Error('MONGO_URI not configured'));
    return dbPromise;
  }

  // Mongoose caches the connection — safe to call multiple times
  dbPromise = mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
    })
    .then(() => {
      console.log('✅ MongoDB connected');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      dbPromise = null; // allow retry on next request
      throw err;
    });

  return dbPromise;
}

// Middleware that ensures DB is connected before any API route runs
app.use(async (req, res, next) => {
  // Skip DB check for health endpoint
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({
      msg: 'Database not available. Check MONGO_URI environment variable.',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Socket.IO — only on non-serverless environments
// On Vercel it's disabled gracefully (real-time won't work there anyway)
// ─────────────────────────────────────────────────────────────
let io = null;
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
  const http       = require('http');
  const { Server } = require('socket.io');
  const server     = http.createServer(app);

  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    socket.on('join_poll',       (id) => socket.join(id));
    socket.on('leave_poll',      (id) => socket.leave(id));
    socket.on('join_user_room',  (id) => socket.join(`user:${id}`));
    socket.on('leave_user_room', (id) => socket.leave(`user:${id}`));
    socket.on('disconnect',      ()  => console.log('🔌 Client disconnected:', socket.id));
  });

  // Poll expiration scheduler — only in persistent server mode
  connectDB().then(() => {
    const Poll     = require('./models/Poll');
    const firedSet = new Set();

    const checkExpired = async () => {
      try {
        const now            = new Date();
        const recentlyExpired = await Poll.find({
          expiresAt: { $lte: now, $gt: new Date(now - 35_000) },
        }).select('_id creator');

        for (const poll of recentlyExpired) {
          const key = poll._id.toString();
          if (firedSet.has(key)) continue;
          firedSet.add(key);
          io.to(key).emit('poll_expired', { pollId: key });
          io.to(`user:${poll.creator.toString()}`).emit('dashboard_poll_expired', { pollId: key });
          console.log(`⏰ Poll ${key} expired`);
        }
        if (firedSet.size > 5000) firedSet.clear();
      } catch (err) {
        console.error('Expiration scheduler error:', err.message);
      }
    };

    checkExpired();
    setInterval(checkExpired, 30_000);
  }).catch(() => {/* DB not available — skip scheduler */});

  // Start listening (local / Render / Railway / Fly.io)
  const PORT = parseInt(process.env.PORT, 10) || 5001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Make io accessible in routes (null on Vercel — routes handle gracefully)
app.set('io', io);

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status : 'ok',
    db     : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    realtime: isServerless ? 'disabled (serverless)' : 'enabled',
    time   : new Date().toISOString(),
  });
});

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/polls',     require('./routes/polls'));
app.use('/api/responses', require('./routes/responses'));

// ─────────────────────────────────────────────────────────────
// 404 + global error handler
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ msg: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ msg: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────
// Export for Vercel serverless
// ─────────────────────────────────────────────────────────────
module.exports = app;
