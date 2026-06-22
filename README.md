# PollFlow — Real-time Polling Platform

A full-stack polling platform built with React (Vite) on the frontend and Express + MongoDB + Socket.IO on the backend. Create polls, share them, and watch results update live as votes come in.

---

## Project Structure

```
Poll_platform/
├── backend/                  # Express API server
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification middleware
│   ├── models/
│   │   ├── Poll.js           # Poll + Question schema
│   │   ├── Response.js       # Response + Answer schema
│   │   └── User.js           # User schema
│   ├── routes/
│   │   ├── auth.js           # /api/auth — register, login, me, reset-password
│   │   ├── polls.js          # /api/polls — CRUD + publish
│   │   └── responses.js      # /api/responses — submit & fetch responses
│   ├── server.js             # Entry point — Express, Socket.IO, MongoDB
│   ├── vercel.json           # Vercel deployment config
│   ├── .env                  # Backend environment variables (not committed)
│   └── package.json
│
└── frontend/                 # React + Vite SPA
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state (user, token, loading)
    │   ├── pages/
    │   │   ├── LandingPage.jsx   # Public marketing page
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   ├── Dashboard.jsx     # User's polls — active / expired
    │   │   ├── CreatePoll.jsx    # Multi-question poll builder
    │   │   ├── EditPoll.jsx      # Edit an existing poll
    │   │   ├── PollView.jsx      # Public voting page with countdown
    │   │   └── PollResults.jsx   # Analytics — bar charts + live updates
    │   ├── utils/
    │   │   └── api.js            # Axios instance with auth header
    │   ├── App.jsx               # Router + protected routes
    │   ├── main.jsx
    │   └── index.css
    ├── vercel.json               # SPA rewrite config
    ├── vite.config.js
    ├── .env.local                # Frontend environment variables (not committed)
    └── package.json
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite 6, React Router v7               |
| Animations | Motion (Framer Motion v12)                      |
| Charts     | Chart.js 4 + react-chartjs-2                    |
| Icons      | Lucide React                                    |
| Styling    | Inline styles (brutalist design system)         |
| HTTP       | Axios                                           |
| Backend    | Node.js, Express 4                              |
| Database   | MongoDB with Mongoose 8                         |
| Real-time  | Socket.IO 4 (WebSocket + polling fallback)      |
| Auth       | JWT (jsonwebtoken) + bcryptjs                   |
| Deployment | Vercel (frontend + backend)                     |

---

## Features

- **User authentication** — register, login, JWT-based sessions (7-day expiry), forgot/reset password
- **Poll creation** — title, expiry date/time, anonymous or authenticated mode, up to 10 questions, each with multiple options and a mandatory toggle
- **Poll editing** — update any field of a poll you own while it is still live
- **Poll deletion** — removes the poll and all associated responses
- **Voting** — anonymous or login-required, duplicate vote prevention, mandatory question enforcement
- **Expiry countdown** — live timer on the voting page with urgency states (warning at 30 min, urgent at 5 min)
- **Deadline popup** — modal shown when a poll expires while the user is on the voting page
- **Real-time results** — Socket.IO pushes new responses instantly to the results page
- **Poll expiration scheduler** — server checks every 30 seconds and emits `poll_expired` / `dashboard_poll_expired` events via Socket.IO
- **Publish results** — creator explicitly publishes results to make them visible to all voters
- **Dashboard** — lists all polls split into Active and Expired, with stats (total, active, expired, published)
- **Copy poll link** — one-click clipboard copy from the dashboard
- **404 page** — custom not-found screen

---

## Database Models

### User
| Field      | Type   | Notes                        |
|------------|--------|------------------------------|
| username   | String | required, unique, trimmed    |
| email      | String | required, unique, lowercase  |
| password   | String | bcrypt hashed                |
| timestamps | —      | createdAt, updatedAt         |

### Poll
| Field       | Type     | Notes                                 |
|-------------|----------|---------------------------------------|
| title       | String   | required                              |
| creator     | ObjectId | ref: User, required                   |
| questions   | Array    | array of Question sub-documents       |
| isAnonymous | Boolean  | default: true                         |
| isPublished | Boolean  | default: false                        |
| expiresAt   | Date     | required                              |
| timestamps  | —        | createdAt, updatedAt                  |

**Question sub-document**

| Field       | Type            | Notes           |
|-------------|-----------------|-----------------|
| text        | String          | required        |
| options     | Array\<String\> | required        |
| isMandatory | Boolean         | default: true   |

### Response
| Field        | Type     | Notes                              |
|--------------|----------|------------------------------------|
| pollId       | ObjectId | ref: Poll, required                |
| respondentId | ObjectId | ref: User, null if anonymous       |
| answers      | Array    | array of Answer sub-documents      |
| timestamps   | —        | createdAt, updatedAt               |

**Answer sub-document**

| Field          | Type   | Notes    |
|----------------|--------|----------|
| questionIndex  | Number | required |
| selectedOption | String | required |

---

## API Reference

Base URL: `/api`

### Auth — `/api/auth`

| Method | Endpoint          | Auth | Description                          |
|--------|-------------------|------|--------------------------------------|
| POST   | `/register`       | No   | Create account, returns JWT + user   |
| POST   | `/login`          | No   | Login, returns JWT + user            |
| GET    | `/me`             | Yes  | Get current authenticated user       |
| POST   | `/reset-password` | No   | Reset password by email              |

### Polls — `/api/polls`

| Method | Endpoint          | Auth | Description                                        |
|--------|-------------------|------|----------------------------------------------------|
| POST   | `/`               | Yes  | Create a new poll                                  |
| GET    | `/my-polls`       | Yes  | Get all polls belonging to the logged-in user      |
| GET    | `/:id`            | No   | Get a single poll by ID                            |
| PUT    | `/:id`            | Yes  | Edit a poll (creator only)                         |
| PUT    | `/:id/publish`    | Yes  | Publish results of a poll (creator only)           |
| DELETE | `/:id`            | Yes  | Delete a poll and its responses (creator only)     |

### Responses — `/api/responses`

| Method | Endpoint    | Auth     | Description                                              |
|--------|-------------|----------|----------------------------------------------------------|
| POST   | `/:pollId`  | Optional | Submit a response; auth optional (depends on poll mode)  |
| GET    | `/:pollId`  | Optional | Fetch responses; visible to creator or if poll published |

### Health

| Method | Endpoint      | Auth | Description                     |
|--------|---------------|------|---------------------------------|
| GET    | `/api/health` | No   | Server + DB connection status   |

---

## Socket.IO Events

The backend uses Socket.IO for real-time communication. The frontend connects to `VITE_SOCKET_URL`.

### Client → Server

| Event             | Payload  | Description                                 |
|-------------------|----------|---------------------------------------------|
| `join_poll`       | `pollId` | Join a poll room (for live result updates)  |
| `leave_poll`      | `pollId` | Leave a poll room                           |
| `join_user_room`  | `userId` | Join a user-specific room (dashboard)       |
| `leave_user_room` | `userId` | Leave the user room                         |

### Server → Client

| Event                    | Payload              | Description                                      |
|--------------------------|----------------------|--------------------------------------------------|
| `new_response`           | response object      | Emitted when a new vote is submitted             |
| `poll_expired`           | `{ pollId }`         | Emitted to poll room when poll deadline passes   |
| `dashboard_poll_expired` | `{ pollId }`         | Emitted to creator's user room on expiry         |

---

## Frontend Routes

| Path                | Access    | Component        | Description                      |
|---------------------|-----------|------------------|----------------------------------|
| `/`                 | Public    | LandingPage      | Marketing / home page            |
| `/register`         | Guest     | Register         | Redirects to dashboard if logged in |
| `/login`            | Guest     | Login            | Redirects to dashboard if logged in |
| `/forgot-password`  | Public    | ForgotPassword   | Reset password form              |
| `/dashboard`        | Protected | Dashboard        | User's polls list                |
| `/create`           | Protected | CreatePoll       | Poll creation form               |
| `/edit/:id`         | Protected | EditPoll         | Edit existing poll               |
| `/poll/:id`         | Public    | PollView         | Voting page                      |
| `/poll/:id/results` | Public*   | PollResults      | Results and analytics (* creator always, others only if published) |
| `*`                 | Public    | NotFound         | 404 page                         |

---

## Environment Variables

### Backend — `backend/.env`

| Variable    | Description                             |
|-------------|-----------------------------------------|
| `MONGO_URI` | MongoDB connection string               |
| `JWT_SECRET`| Secret key used to sign JWT tokens      |
| `PORT`      | Port to run the server on (default 5001)|

### Frontend — `frontend/.env.local`

| Variable          | Description                                 |
|-------------------|---------------------------------------------|
| `VITE_API_URL`    | Backend API base URL (e.g. `http://localhost:5001/api`) |
| `VITE_SOCKET_URL` | Socket.IO server URL (e.g. `http://localhost:5001`)     |

---

## Local Development

### Prerequisites

- Node.js >= 18
- MongoDB instance (local or Atlas)

### Backend

```bash
cd backend
npm install
# create .env with MONGO_URI and JWT_SECRET
npm run dev        # starts with nodemon on port 5001
```

### Frontend

```bash
cd frontend
npm install
# create .env.local with VITE_API_URL and VITE_SOCKET_URL
npm run dev        # starts Vite dev server
```

---

## Deployment (Vercel)

Both the frontend and backend are configured for Vercel.

**Backend** (`backend/vercel.json`) — routes all requests to `server.js` via `@vercel/node`.

**Frontend** (`frontend/vercel.json`) — rewrites all paths to `index.html` so React Router handles client-side navigation.

Set the environment variables in the Vercel dashboard for each project before deploying.

---

## Auth Flow

1. User registers or logs in — backend returns a JWT (7-day expiry).
2. The frontend stores the token and attaches it as `Authorization: Bearer <token>` on every API request via the Axios instance in `src/utils/api.js`.
3. `AuthContext` reads the token on app load, calls `/api/auth/me` to validate, and exposes `user` + `loading` globally.
4. Protected routes (`/dashboard`, `/create`, `/edit/:id`) redirect to `/login` when `user` is null.

---

## Poll Lifecycle

```
Create → Share link → Voters submit responses
       ↓
  Expiry reached
       ↓
Socket.IO fires poll_expired → countdown reaches zero on voting page
       ↓
Creator views analytics → clicks "Publish Results"
       ↓
Results visible to all at /poll/:id/results
```
