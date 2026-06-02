# ⚔️ CP Battle

A real-time **competitive programming battle platform** where developers race head-to-head to solve coding problems from LeetCode, Codeforces, and GeeksforGeeks — live, in the same room.

🌐 **Live Demo:** [cp-battle.vercel.app](https://cp-battle.vercel.app)

---

## 📸 Preview

| Home | Lobby | Battle |
|------|-------|--------|
| ![Home](https://github.com/user-attachments/assets/a6343346-6665-42a9-bb5e-1ddf5e5bf675) | ![Lobby](https://github.com/user-attachments/assets/573f406e-22b9-4baa-94b0-971c97e14c23) | ![Battle](https://github.com/user-attachments/assets/a312fc58-ef69-454b-9b6c-20919d8f9757) |

---

## ✨ Features

- 🏠 **Room System** — Create or join battle rooms with a 6-character room code
- ⚡ **Real-time Sync** — All players see live updates via WebSockets (Socket.io)
- 🎯 **Multi-platform Problems** — Fetch random problems from:
  - **LeetCode** (Easy / Medium / Hard)
  - **Codeforces** (by rating range: 800–3500)
  - **GeeksforGeeks** (Easy / Medium / Hard)
- 🔗 **Custom URL** — Paste any LeetCode/Codeforces/GFG problem link directly
- 🏆 **Points & Leaderboard** — First to solve earns 3pts, second 2pts, third 1pt
- 📸 **Screenshot Proof** — Players upload a screenshot of their accepted solution
- ⏱️ **Time Limit** — Optional countdown timer per round
- 👥 **Max Players** — Host can cap the number of participants
- 🔄 **Multi-round** — Play multiple rounds in the same room with cumulative scores
- 🔁 **Rejoin Support** — Accidentally closed the tab? Rejoin your active room

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Vite |
| Real-time | Socket.io (client + server) |
| Backend | Node.js, Express 5 |
| Deployment | Vercel (frontend), Render (backend) |
| External APIs | Codeforces API, alfa-leetcode-api, GFG (static data) |

---

## 🏗️ Architecture

```
CP-Battle/
├── client/               # React frontend (deployed on Vercel)
│   └── src/
│       ├── pages/
│       │   ├── HomeScreen.jsx      # Create/join room
│       │   ├── LobbyScreen.jsx     # Pre-battle lobby
│       │   ├── BattleScreen.jsx    # Active battle view
│       │   ├── ResultScreen.jsx    # Round results & leaderboard
│       │   └── RejoinScreen.jsx    # Reconnect to active room
│       ├── components/
│       │   ├── RouteGuard.jsx      # Protects routes from direct access
│       │   ├── ScreenshotModal.jsx # Proof-of-solve upload
│       │   └── Toast.jsx           # Notification toasts
│       └── socket.js               # Singleton Socket.io client
│
└── server/               # Node.js backend (deployed on Render)
    ├── index.js          # Express + Socket.io server, room logic
    ├── routes/
    │   └── problem.js    # REST API for fetching random problems
    └── data/
        ├── gfg_problems.js       # Static GFG problem bank
        └── leetcode_fallback.js  # Fallback if LeetCode API is down
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/Shrek38/CP-Battle.git
cd CP-Battle
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev       # runs on http://localhost:5000
```

### 3. Start the frontend

```bash
cd client
npm install
npm run dev       # runs on http://localhost:5173
```

> Make sure `client/src/pages/HomeScreen.jsx` and `LobbyScreen.jsx` have `API_BASE = 'http://localhost:5000'` for local development.

---

## 🌐 Deployment

| Service | Purpose | URL |
|---|---|---|
| Vercel | Frontend hosting | [cp-battle.vercel.app](https://cp-battle.vercel.app) |
| Render | Backend + WebSocket server | `https://cp-battle-1.onrender.com` |
| UptimeRobot | Keep Render alive (free tier) | Pings `/health` every 5 min |

---

## 🔌 API Reference

### `GET /api/problem/random`

Fetches a random problem based on platform and difficulty.

**LeetCode:**
```
GET /api/problem/random?platform=LeetCode&difficulty=Easy
```

**Codeforces:**
```
GET /api/problem/random?platform=Codeforces&minRating=1000&maxRating=1400
```

**GeeksforGeeks:**
```
GET /api/problem/random?platform=GeeksforGeeks&difficulty=Medium
```

### `GET /health`
Returns server status. Used by UptimeRobot to keep the server alive.

---

## 🔁 Socket Events

| Event | Direction | Description |
|---|---|---|
| `create_room` | Client → Server | Create a new battle room |
| `join_room` | Client → Server | Join an existing room |
| `room_update` | Server → Client | Broadcast updated room state |
| `toggle_ready` | Client → Server | Player marks themselves ready |
| `start_battle` | Client → Server | Host starts the round |
| `battle_started` | Server → Client | Signals all players to begin |
| `player_solved` | Client → Server | Player submits their solve proof |
| `players_update` | Server → Client | Updated player scores/statuses |
| `end_round` | Client → Server | Host ends the current round |
| `round_ended` | Server → Client | Final leaderboard for the round |
| `next_round` | Client → Server | Host starts next round |
| `room_closed` | Server → Client | Host disconnected, room closed |

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT
