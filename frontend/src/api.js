// The actual value is written into /env-config.js by docker-entrypoint.sh
// EVERY TIME THE CONTAINER STARTS (not at build time). That means the same
// built image can point at a different backend in different environments —
// Docker Compose vs. Render vs. anywhere else — just by setting the
// BACKEND_URL environment variable on the container, no rebuild needed.
// Falls back to the relative "/api" path (proxied by nginx.conf) if the
// config file is missing, e.g. during local `vite dev`.
const BASE_URL = window.__APP_CONFIG__?.API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  newGame: (playerName) =>
    request('/games', {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    }),

  getGame: (sessionId) => request(`/games/${sessionId}`),

  guess: (sessionId, letter) =>
    request(`/games/${sessionId}/guess`, {
      method: 'POST',
      body: JSON.stringify({ letter }),
    }),

  getHint: (sessionId) => request(`/games/${sessionId}/hint`),

  getLeaderboard: (limit = 10) => request(`/leaderboard?limit=${limit}`),
};
