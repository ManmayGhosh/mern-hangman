export default function Gallows({ wrongCount }) {
  return (
    <svg id="gallows" viewBox="0 0 200 220">
      <line className="frame-part" x1="20" y1="210" x2="120" y2="210" />
      <line className="frame-part" x1="50" y1="210" x2="50" y2="20" />
      <line className="frame-part" x1="50" y1="20" x2="140" y2="20" />
      <line className="frame-part" x1="140" y1="20" x2="140" y2="45" />

      <circle
        className={wrongCount >= 1 ? 'part-visible' : ''}
        cx="140"
        cy="65"
        r="20"
      />
      <line
        className={wrongCount >= 2 ? 'part-visible' : ''}
        x1="140"
        y1="85"
        x2="140"
        y2="140"
      />
      <line
        className={wrongCount >= 3 ? 'part-visible' : ''}
        x1="140"
        y1="100"
        x2="115"
        y2="125"
      />
      <line
        className={wrongCount >= 4 ? 'part-visible' : ''}
        x1="140"
        y1="100"
        x2="165"
        y2="125"
      />
      <line
        className={wrongCount >= 5 ? 'part-visible' : ''}
        x1="140"
        y1="140"
        x2="118"
        y2="175"
      />
      <line
        className={wrongCount >= 6 ? 'part-visible' : ''}
        x1="140"
        y1="140"
        x2="162"
        y2="175"
      />
    </svg>
  );
}
