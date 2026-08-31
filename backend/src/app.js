const express = require('express');
const cors = require('cors');

const gamesRouter = require('./routes/games');
const leaderboardRouter = require('./routes/leaderboard');
const { poolSize, poolSource } = require('./utils/wordBank');

function createApp() {
  const app = express();

  // Defaults to reflecting whatever origin made the request, so a separately
  // hosted frontend (a different Render service, a different port locally,
  // etc.) works out of the box. Set CLIENT_URL to lock this down to one
  // specific origin once you know your production frontend's URL.
  app.use(cors({ origin: process.env.CLIENT_URL || true }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', wordPoolSize: poolSize(), wordSource: poolSource() });
  });

  app.use('/api/games', gamesRouter);
  app.use('/api/leaderboard', leaderboardRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[app] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
