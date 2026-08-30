const express = require('express');
const cors = require('cors');

const gamesRouter = require('./routes/games');
const leaderboardRouter = require('./routes/leaderboard');
const { poolSize } = require('./utils/wordBank');

function createApp() {
  const app = express();

  const allowedOrigin = process.env.CLIENT_URL || '*';
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', wordPoolSize: poolSize() });
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
