const express = require('express');
const { v4: uuidv4 } = require('uuid');
const GameSession = require('../models/GameSession');
const Leaderboard = require('../models/Leaderboard');
const { randomWord } = require('../utils/wordBank');
const { fetchHint } = require('../utils/hintFetcher');

const router = express.Router();

// Shape a session doc into what the client is allowed to see: never the raw
// word, only a masked version plus enough state to render the board.
function toPublicState(session) {
  const masked = session.word
    .split('')
    .map((ch) => (session.guessedLetters.includes(ch) ? ch : '_'));

  return {
    sessionId: session.sessionId,
    wordLength: session.word.length,
    masked,
    guessedLetters: session.guessedLetters,
    wrongCount: session.wrongCount,
    maxWrong: session.maxWrong,
    status: session.status,
    hintRevealed: session.hintRevealed,
    hint: session.hintRevealed ? session.hint : null,
    // Only reveal the actual word once the game is over
    word: session.status === 'active' ? null : session.word,
  };
}

async function updateLeaderboard(playerName, won) {
  const name = (playerName || 'Anonymous').trim().slice(0, 40) || 'Anonymous';

  let entry = await Leaderboard.findOne({ playerName: name });
  if (!entry) entry = new Leaderboard({ playerName: name });

  if (won) {
    entry.wins += 1;
    entry.currentStreak += 1;
    entry.bestStreak = Math.max(entry.bestStreak, entry.currentStreak);
  } else {
    entry.losses += 1;
    entry.currentStreak = 0;
  }

  await entry.save();
  return entry;
}

// POST /api/games — start a new game
router.post('/', async (req, res) => {
  try {
    const { playerName } = req.body || {};

    const session = await GameSession.create({
      sessionId: uuidv4(),
      word: randomWord(),
      playerName: (playerName || 'Anonymous').trim().slice(0, 40) || 'Anonymous',
    });

    res.status(201).json(toPublicState(session));
  } catch (err) {
    console.error('[games] create error:', err);
    res.status(500).json({ error: 'Could not start a new game.' });
  }
});

// GET /api/games/:id — fetch current state (e.g. on page refresh)
router.get('/:id', async (req, res) => {
  try {
    const session = await GameSession.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Game not found.' });
    res.json(toPublicState(session));
  } catch (err) {
    res.status(500).json({ error: 'Could not load game.' });
  }
});

// POST /api/games/:id/guess — body: { letter }
router.post('/:id/guess', async (req, res) => {
  try {
    const { letter } = req.body || {};
    if (!letter || typeof letter !== 'string' || letter.length !== 1 || !/[a-zA-Z]/.test(letter)) {
      return res.status(400).json({ error: 'Send a single letter.' });
    }

    const session = await GameSession.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Game not found.' });

    if (session.status !== 'active') {
      return res.json(toPublicState(session)); // idempotent no-op once finished
    }

    const upper = letter.toUpperCase();

    if (!session.guessedLetters.includes(upper)) {
      session.guessedLetters.push(upper);

      if (!session.word.includes(upper)) {
        session.wrongCount += 1;
      }
    }

    const allRevealed = session.word
      .split('')
      .every((ch) => session.guessedLetters.includes(ch));

    if (allRevealed) {
      session.status = 'won';
    } else if (session.wrongCount >= session.maxWrong) {
      session.status = 'lost';
    }

    await session.save();

    if (session.status !== 'active') {
      await updateLeaderboard(session.playerName, session.status === 'won');
    }

    res.json(toPublicState(session));
  } catch (err) {
    console.error('[games] guess error:', err);
    res.status(500).json({ error: 'Could not process guess.' });
  }
});

// GET /api/games/:id/hint — lazily fetch + cache a definition-based hint
router.get('/:id/hint', async (req, res) => {
  try {
    const session = await GameSession.findOne({ sessionId: req.params.id });
    if (!session) return res.status(404).json({ error: 'Game not found.' });

    if (session.hint === null) {
      session.hint = (await fetchHint(session.word)) || 'No hint available for this word.';
      await session.save();
    }

    session.hintRevealed = true;
    await session.save();

    res.json(toPublicState(session));
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch hint.' });
  }
});

module.exports = router;
