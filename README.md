# PollFlow — Real-time Polling Platform

Full-stack polling SaaS built with React, Node.js, Express, MongoDB, and Socket.IO.

---

## Project Structure

```
Poll_platform/
├── backend/          ← Express + MongoDB API (deploy separately)
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   ├── vercel.json   ← Vercel serverless config for backend
│   └── .env.example
└── frontend/         ← React + Vite app (deploy separately)
    ├── src/
    ├── vercel.json   ← Vercel SPA routing fix
    └── .env.example
```

---

## Local Development

### 1. Backend

```bash
cd backend
npm install
# Create .env from .env.example and fill in values
cp .env.example .env
npm run dev        # runs on http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
npm install
# Create .env.local and set the backend URL
echo "VITE_API_URL=http://localhost:5001/api" > .env.local
echo "VITE_SOCKET_URL=http://localhost:5001" >> .env.local
npm run dev        # runs on http://localhost:5173
```

---

## Deploy to Vercel

### Step 1 — Deploy the Backend

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import **only the `backend` folder** (or connect your Git repo and set **Root Directory** to `backend`)
3. Vercel auto-detects `vercel.json` — no build settings needed
4. **Add Environment Variables** in Vercel dashboard → Settings → Environment Variables:

   | Name | Value |
   |---|---|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/pollplatform` |
   | `JWT_SECRET` | `any-long-random-string-minimum-32-chars` |

5. Deploy → copy your backend URL e.g. `https://poll-platform-backend.vercel.app`
6. Test: visit `https://your-backend.vercel.app/api/health` → should show `{"status":"ok","db":"connected"}`

### Step 2 — Deploy the Frontend

1. Go to Vercel → **Add New Project**
2. Import the **`frontend` folder** (set Root Directory to `frontend`)
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **Add Environment Variables**:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend.vercel.app/api` |
   | `VITE_SOCKET_URL` | `https://your-backend.vercel.app` |

7. Deploy

> ⚠️ **Important:** `VITE_*` variables are baked into the frontend bundle at build time.
> If you change them you must **redeploy** the frontend.

---

## Environment Variables Reference

### Backend (`backend/.env`)

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/pollplatform
JWT_SECRET=your-super-secret-key-at-least-32-chars
PORT=5001
```

### Frontend (`frontend/.env.local` for dev, Vercel env vars for prod)

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

---

## Common Deployment Issues

| Error | Cause | Fix |
|---|---|---|
| `{"msg":"Database unavailable"}` | `MONGO_URI` not set in Vercel | Add it in Vercel → Settings → Environment Variables |
| `db: "disconnected"` on `/api/health` | Same as above | Same fix |
| Frontend shows blank page after refresh | Missing `vercel.json` in frontend | Already included — redeploy |
| `VITE_API_URL` still hits localhost | Env var not set before build | Set in Vercel env vars, then redeploy frontend |
| Socket.IO / real-time not working on Vercel | Vercel is serverless — no persistent connections | Expected. Use Render/Railway for full real-time support |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (jsonwebtoken) |
| Real-time | Socket.IO |
| Deployment | Vercel (frontend + backend) |
