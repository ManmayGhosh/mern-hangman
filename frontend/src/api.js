// Base URL is injected at build time via Vite env var; falls back to same-origin
// /api, which works when nginx proxies /api to the backend in production.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
