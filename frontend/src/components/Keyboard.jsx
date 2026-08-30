const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Keyboard({ guessedLetters, masked, disabled, onGuess }) {
  // The real word stays server-side until the game ends, so we derive
  // correctness from the masked word: any letter currently showing in
  // `masked` was a correct guess; any other guessed letter was wrong.
  const revealedLetters = new Set((masked || []).filter((ch) => ch !== '_'));

  return (
    <div className="keyboard">
      {LETTERS.map((letter) => {
        const guessed = guessedLetters.includes(letter);
        const isCorrect = guessed && revealedLetters.has(letter);
        const isWrong = guessed && !revealedLetters.has(letter);

        let cls = 'key';
        if (isCorrect) cls += ' correct';
        else if (isWrong) cls += ' wrong';

        return (
          <button
            key={letter}
            className={cls}
            disabled={disabled || guessed}
            onClick={() => onGuess(letter)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
