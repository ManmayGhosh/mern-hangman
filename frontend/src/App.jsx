import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import Gallows from './components/Gallows.jsx';
import WordRow from './components/WordRow.jsx';
import Keyboard from './components/Keyboard.jsx';
import Leaderboard from './components/Leaderboard.jsx';

const NAME_KEY = 'hangman_player_name';

export default function App() {
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(NAME_KEY) || ''
  );
  const [editingName, setEditingName] = useState(!playerName);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const data = await api.getLeaderboard(10);
      setLeaderboard(data);
    } catch (err) {
      // Leaderboard is a nice-to-have; a failed fetch shouldn't block play.
    } finally {
      setLbLoading(false);
    }
  }, []);

  const startNewGame = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.newGame(playerName || 'Anonymous');
      setGame(data);
    } catch (err) {
      setError(err.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [playerName]);

  useEffect(() => {
    startNewGame();
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (game && game.status !== 'active') {
      loadLeaderboard();
    }
  }, [game, loadLeaderboard]);

  const handleGuess = async (letter) => {
    if (!game || game.status !== 'active') return;
    try {
      const updated = await api.guess(game.sessionId, letter);
      setGame(updated);
    } catch (err) {
      setError(err.message || 'Could not send guess.');
    }
  };

  const handleHint = async () => {
    if (!game) return;
    try {
      const updated = await api.getHint(game.sessionId);
      setGame(updated);
    } catch (err) {
      setError(err.message || 'Could not fetch hint.');
    }
  };

  useEffect(() => {
    function onKeyDown(e) {
      const letter = e.key.toUpperCase();
      if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
        handleGuess(letter);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const saveName = (e) => {
    e.preventDefault();
    const trimmed = playerName.trim().slice(0, 40) || 'Anonymous';
    setPlayerName(trimmed);
    localStorage.setItem(NAME_KEY, trimmed);
    setEditingName(false);
  };

  const remaining = game ? game.maxWrong - game.wrongCount : 6;

  let message = 'Pick a letter to start.';
  let messageClass = 'message';
  if (game?.status === 'won') {
    message = `You got it — "${game.word}"!`;
    messageClass = 'message win';
  } else if (game?.status === 'lost') {
    message = `Out of guesses. It was "${game.word}".`;
    messageClass = 'message lose';
  } else if (game && game.guessedLetters.length > 0) {
    message = 'Keep going.';
  }

  return (
    <div className="page">
      <div className="frame">
        <header>
          <div>
            <h1>Hangman</h1>
            <div className="tagline">
              chalk it up, one letter at a time — now with a full dictionary
            </div>
          </div>
          <div className="player-box">
            {editingName ? (
              <form onSubmit={saveName}>
                <input
                  autoFocus
                  maxLength={40}
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <button type="submit" className="btn small">
                  Save
                </button>
              </form>
            ) : (
              <div className="player-display">
                Playing as <b>{playerName || 'Anonymous'}</b>
                <button
                  className="hint-toggle"
                  onClick={() => setEditingName(true)}
                >
                  change
                </button>
              </div>
            )}
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="stage">
          <div className="gallows-wrap">
            <Gallows wrongCount={game?.wrongCount ?? 0} />
            <div className="lives">
              {loading ? 'Loading…' : `${Math.max(remaining, 0)} guesses left`}
            </div>
          </div>

          <div className="play-area">
            {game && <WordRow masked={game.masked} />}
            <div className={messageClass}>{loading ? 'Loading a word…' : message}</div>

            {game?.hintRevealed ? (
              <div className="hint-text">Hint: {game.hint}</div>
            ) : (
              <button
                className="hint-toggle"
                onClick={handleHint}
                disabled={!game || game.status !== 'active'}
              >
                show hint
              </button>
            )}

            {game && (
              <Keyboard
                guessedLetters={game.guessedLetters}
                masked={game.masked}
                disabled={loading || game.status !== 'active'}
                onGuess={handleGuess}
              />
            )}

            <div className="actions">
              <button className="btn" onClick={startNewGame} disabled={loading}>
                New word
              </button>
            </div>
          </div>
        </div>

        <footer>keyboard works too — just type a letter</footer>
      </div>

      <Leaderboard entries={leaderboard} loading={lbLoading} />
    </div>
  );
}
