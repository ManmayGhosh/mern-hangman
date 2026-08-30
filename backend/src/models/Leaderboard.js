const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, unique: true, trim: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
