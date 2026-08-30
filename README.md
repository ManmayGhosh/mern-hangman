# Chalkboard Hangman — MERN Edition

Full MERN rewrite of the static hangman game: React/Vite frontend, Express API, MongoDB for game sessions + a persistent leaderboard, and a real dictionary of ~275,000 English words instead of a fixed list.

## What changed from the static version
- **Random words from a full dictionary** — the backend loads the [`word-list`](https://www.npmjs.com/package/word-list) npm package (a well-known offline English word list) at startup, filters it to playable lengths (4–11 letters), and picks randomly. No more repeating the same 20 words.
- **Server-authoritative game state** — the actual word never reaches the browser until the game ends. The frontend only ever sees a masked version, so it's not crackable via devtools.
- **MongoDB-backed sessions** — each game is a `GameSession` document; sessions auto-expire after 24h.
- **Persistent leaderboard** — wins, losses, current streak, and best streak per player name, stored in MongoDB and shown live in the UI.
- **Optional live hints** — on request, the backend fetches a real definition from the free [dictionaryapi.dev](https://dictionaryapi.dev) API and caches it on the session; falls back gracefully if the word isn't found or the API is unreachable.

## Architecture
```
hangman-mern/
├── backend/                 Express API + MongoDB models
│   ├── src/
│   │   ├── config/db.js       Mongo connection
│   │   ├── models/            GameSession, Leaderboard (Mongoose schemas)
│   │   ├── routes/            /api/games, /api/leaderboard
│   │   └── utils/              wordBank.js (dictionary loader), hintFetcher.js
│   ├── server.js
│   └── Dockerfile
├── frontend/                 React + Vite SPA
│   ├── src/
│   │   ├── components/        Gallows, WordRow, Keyboard, Leaderboard
│   │   ├── App.jsx
│   │   └── api.js              fetch wrapper
│   ├── nginx.conf              serves build + proxies /api to backend
│   └── Dockerfile              multi-stage: vite build -> nginx
├── docker-compose.yml         mongo + backend + frontend
└── README.md
```

## API reference

| Method | Path                       | Body            | Description                                    |
|--------|-----------------------------|-----------------|-------------------------------------------------|
| POST   | `/api/games`                | `{ playerName }` | Start a new game, returns masked state          |
| GET    | `/api/games/:id`            | —                | Fetch current state (e.g. on refresh)           |
| POST   | `/api/games/:id/guess`      | `{ letter }`     | Submit a guess, returns updated state           |
| GET    | `/api/games/:id/hint`       | —                | Lazily fetch + reveal a definition-based hint   |
| GET    | `/api/leaderboard?limit=10` | —                | Top players by wins, tie-broken by best streak  |
| GET    | `/api/health`               | —                | Health check + loaded word pool size            |

## Run it

### With Docker Compose (recommended)
```bash
docker compose up -d --build
```
- Frontend: **http://localhost:8080**
- Backend API directly: **http://localhost:5000/api/health**
- MongoDB: exposed on 27017 for local inspection (remove that port mapping in production)

### Locally without Docker
Requires Node 20+ and a local or Atlas MongoDB instance.

```bash
# Backend
cd backend
cp .env.example .env   # edit MONGO_URI if not using local Mongo
npm install
npm run dev             # nodemon on :5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # vite dev server on :5173, proxies to :5000 via VITE_API_URL
```

For local dev, set `VITE_API_URL=http://localhost:5000/api` in a `frontend/.env` file so the dev server talks directly to the backend (the production nginx proxy isn't running in this mode).

## Deploying

**Docker Compose on a VPS** — same pattern as ParkEase: `docker compose up -d --build`, put Caddy in front for HTTPS, point a subdomain at it.

**Render** — deploy as two services from the same repo:
1. **Backend** → Web Service, Docker, root directory `backend`. Add a MongoDB Atlas connection string as `MONGO_URI`.
2. **Frontend** → Static Site or Web Service (Docker), root directory `frontend`. Set `VITE_API_URL` to your backend's Render URL at build time if you're not using the nginx proxy path.

**Managed path (matches ParkEase's production notes)**: MongoDB Atlas (free tier) + Render/Railway for the backend + Netlify/Vercel for the frontend.

## Production hardening checklist
- Lock `CLIENT_URL` (CORS) down to your actual frontend origin instead of `*`
- Remove the `27017:27017` port mapping on `mongo` once you don't need direct external access
- Put the whole stack behind HTTPS (Caddy/Let's Encrypt, or your platform's managed TLS)
- Consider rate-limiting `/api/games` and `/api/games/:id/guess` if this is publicly exposed, to prevent trivial abuse of the leaderboard
