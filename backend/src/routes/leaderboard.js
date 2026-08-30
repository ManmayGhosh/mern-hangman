const express = require('express');
const Leaderboard = require('../models/Leaderboard');

const router = express.Router();

// GET /api/leaderboard?limit=10 — top players by wins, tie-broken by best streak
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const top = await Leaderboard.find({})
      .sort({ wins: -1, bestStreak: -1 })
      .limit(limit)
      .select('playerName wins losses currentStreak bestStreak -_id');

    res.json(top);
  } catch (err) {
    res.status(500).json({ error: 'Could not load leaderboard.' });
  }
});

module.exports = router;
