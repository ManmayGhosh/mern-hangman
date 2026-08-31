# Chalkboard Hangman — MERN Edition

Full MERN rewrite of the static hangman game: React/Vite frontend, Express API, MongoDB for game sessions + a persistent leaderboard, and words pulled from a real system dictionary instead of a fixed 20-word list.

Frontend and backend are **separate services** — separate containers, separate deploys, separate scaling — so you can update or redeploy one without touching the other.

## Where the words come from (and why this changed)

An earlier version used the `word-list` npm package. Its export format turned out to vary across installed versions and crashed the backend at startup in some environments (`Cannot convert object to primitive value` in `fs.readFileSync`) — an npm dependency for something this simple wasn't worth the fragility.

Now the backend reads directly from the OS's own English dictionary:
- **In Docker** — `backend/Dockerfile` installs `wamerican-large` via `apt-get`, a standard Debian package providing a large, real word list at a fixed system path. No npm package, no version drift, no network call at runtime.
- **Outside Docker** (e.g. running `npm run dev` locally on a machine without that system package) — falls back automatically to `backend/data/fallbackWords.js`, a ~1,100-word list bundled directly in the repo. Smaller, but zero dependencies and it never crashes.

Check `GET /api/health` after deploying — it reports `wordSource` (the dictionary path in use, or `"embedded fallback list"`) and `wordPoolSize`, so you can confirm which one is active at a glance.

## How the frontend finds the backend (the part that used to break — twice)

The frontend doesn't have a backend URL baked into it at build time. Instead, every time its container **starts**, `docker-entrypoint.sh` reads the `BACKEND_URL` environment variable and does two things based on it — because it turned out one wasn't enough.

**1. Writes `env-config.js`**, which the frontend JS reads on page load to know where to send API calls:
- **`BACKEND_URL` unset** → `API_URL` becomes the relative path `/api`.
- **`BACKEND_URL` set** (e.g. `https://hangman-backend-xxxx.onrender.com/api`) → the frontend calls that URL directly from the browser.

**2. Picks which nginx config to use** — this is the part that broke on Render even with (1) working correctly. nginx resolves every `proxy_pass` hostname **at startup**, not per-request. A single config that unconditionally proxies `/api/` to a service named `backend` will crash nginx entirely wherever that hostname doesn't exist — which is everywhere except Docker Compose — regardless of whether `BACKEND_URL` was set correctly, because nginx never even gets far enough to serve a request. So there are two full nginx configs in `nginx-templates/`, and the entrypoint copies the right one into place before nginx starts:
- **`BACKEND_URL` unset** → `with-proxy.conf`, which proxies `/api/` to `backend:5000` (works because Compose's internal network resolves that hostname).
- **`BACKEND_URL` set** → `no-proxy.conf`, which has no `/api` block at all, since the browser is calling the backend's public URL directly and nginx never needs to touch that traffic.

The same built Docker image works in both cases — you're setting an environment variable on the *container*, not rebuilding the image, and nginx only ever sees a hostname it can actually resolve.

Local frontend development (`npm run dev`) is unaffected by any of this — Vite's dev server proxies `/api` straight to a locally running backend (see `vite.config.js`).

## Project structure
```
hangman-mern/
├── docker-compose.yml         mongo + backend + frontend, three services
├── backend/
│   ├── src/
│   │   ├── config/db.js         Mongo connection
│   │   ├── models/               GameSession, Leaderboard (Mongoose schemas)
│   │   ├── routes/               /api/games, /api/leaderboard
│   │   └── utils/                 wordBank.js (dictionary loader), hintFetcher.js
│   ├── data/fallbackWords.js     embedded backup word list (no system dictionary)
│   ├── src/app.js                Express app, CORS defaults to allow any origin
│   ├── server.js
│   ├── Dockerfile                installs wamerican-large via apt
│   └── .env.example
└── frontend/                  React + Vite SPA
    ├── src/
    │   ├── components/          Gallows, WordRow, Keyboard, Leaderboard
    │   ├── App.jsx
    │   └── api.js                 reads window.__APP_CONFIG__.API_URL
    ├── public/env-config.js       local-dev default (overwritten in Docker)
    ├── nginx-templates/
    │   ├── with-proxy.conf         used when BACKEND_URL is unset (Compose)
    │   └── no-proxy.conf           used when BACKEND_URL is set (Render, etc.)
    ├── docker-entrypoint.sh       picks the nginx config + writes env-config.js
    ├── Dockerfile
    └── vite.config.js             dev-only proxy to a local backend
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
- MongoDB: exposed on 27017 for local inspection; remove that port mapping in production.

No environment variables to set for this path — `BACKEND_URL` is intentionally left unset so the frontend uses the Compose-internal proxy.

### Locally without Docker (for active development)
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
npm run dev              # vite dev server on :5173, proxies /api to :5000 automatically
```

## Deploying to Render (two separate services)

1. **Backend** → New Web Service → Docker → root directory `backend`.
   - Set `MONGO_URI` to a MongoDB Atlas connection string (Render doesn't host Mongo).
   - Once deployed, copy its public URL (e.g. `https://hangman-backend-xxxx.onrender.com`).

2. **Frontend** → New Web Service → Docker → root directory `frontend`.
   - Set `BACKEND_URL` = `https://hangman-backend-xxxx.onrender.com/api` (the backend's URL from step 1, plus `/api`).
   - Deploy.

That's it — no build-time env var, no "clear cache and rebuild" step. If you ever need to point the frontend at a different backend later (new environment, staging vs. prod, etc.), just change `BACKEND_URL` in the Render dashboard and restart the service — no rebuild needed.

3. **(Optional) Lock down CORS** — once you know the frontend's final URL, set `CLIENT_URL` on the backend service to that exact origin instead of relying on the default (which allows any origin).

## MongoDB Atlas setup
Free tier at mongodb.com/cloud/atlas. Create a cluster, a database user, and allow network access from `0.0.0.0/0` (Render's outbound IPs aren't static). Copy the `mongodb+srv://...` connection string into `MONGO_URI`.

## Production hardening checklist
- Set `CLIENT_URL` on the backend once your frontend's real URL is fixed, instead of leaving CORS open to any origin.
- Remove the `27017:27017` port mapping on `mongo` once you don't need direct external DB access.
- Put both services behind HTTPS — automatic on Render, or Caddy/Let's Encrypt if self-hosting.
- Consider rate-limiting `/api/games` and `/api/games/:id/guess` if this is publicly exposed.
