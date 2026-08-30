const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    word: { type: String, required: true }, // stored uppercase, never sent to client verbatim
    guessedLetters: { type: [String], default: [] },
    wrongCount: { type: Number, default: 0 },
    maxWrong: { type: Number, default: 6 },
    status: {
      type: String,
      enum: ['active', 'won', 'lost'],
      default: 'active',
    },
    playerName: { type: String, default: 'Anonymous' },
    hint: { type: String, default: null }, // lazily populated on first request
    hintRevealed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-expire finished/abandoned sessions after 24h so the collection doesn't
// grow unbounded from anonymous drive-by games.
GameSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

module.exports = mongoose.model('GameSession', GameSessionSchema);
