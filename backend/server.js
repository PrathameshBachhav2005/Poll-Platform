const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");

dotenv.config();

const app = express();

/* ── CORS ─────────────────────────────────────────────────── */
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://poll-platform-frontend-six.vercel.app',
    'https://poll-platform-frontend01.vercel.app',
  ],
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true,
}));
app.use(express.json());

/* ── DB (lazy, cached, safe for serverless) ──────────────── */
let dbConn = null;

async function connectDB() {
  if (dbConn && mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI environment variable is not set");

  dbConn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("MongoDB connected");
}

/* ── DB guard middleware ──────────────────────────────────── */
app.use(async (req, res, next) => {
  if (req.path === "/api/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(503).json({ msg: "Database unavailable. Set MONGO_URI on Vercel." });
  }
});

/* ── Health check ─────────────────────────────────────────── */
app.get("/", (req, res) => {
  res.json({ msg: "PollFlow API is running", version: "1.0.0" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db:   mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});

/* ── API Routes ───────────────────────────────────────────── */
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/polls",     require("./routes/polls"));
app.use("/api/responses", require("./routes/responses"));

/* ── 404 ──────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found: " + req.method + " " + req.originalUrl });
});

/* ── Error handler ────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ msg: "Internal server error" });
});

/* ── Local / non-serverless startup ──────────────────────── */
if (!process.env.VERCEL) {
  const http       = require("http");
  const { Server } = require("socket.io");
  const server     = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET","POST","PUT","DELETE"] },
  });

  app.set("io", io);

  io.on("connection", (socket) => {
    socket.on("join_poll",       (id) => socket.join(id));
    socket.on("leave_poll",      (id) => socket.leave(id));
    socket.on("join_user_room",  (id) => socket.join("user:" + id));
    socket.on("leave_user_room", (id) => socket.leave("user:" + id));
    socket.on("disconnect",      ()  => {});
  });

  const PORT = parseInt(process.env.PORT, 10) || 5001;
  server.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
  });

  /* Poll expiration scheduler */
  connectDB().then(() => {
    const Poll     = require("./models/Poll");
    const fired    = new Set();
    const tick = async () => {
      try {
        const now = new Date();
        const expired = await Poll.find({
          expiresAt: { $lte: now, $gt: new Date(now - 35000) },
        }).select("_id creator");
        for (const p of expired) {
          const k = p._id.toString();
          if (fired.has(k)) continue;
          fired.add(k);
          io.to(k).emit("poll_expired",           { pollId: k });
          io.to("user:" + p.creator).emit("dashboard_poll_expired", { pollId: k });
        }
        if (fired.size > 5000) fired.clear();
      } catch (e) { console.error("Scheduler:", e.message); }
    };
    tick();
    setInterval(tick, 30000);
  }).catch(() => {});
}

/* ── Export for Vercel ────────────────────────────────────── */
module.exports = app;
