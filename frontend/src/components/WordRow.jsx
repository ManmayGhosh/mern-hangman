export default function WordRow({ masked }) {
  return (
    <div className="word-row">
      {masked.map((ch, i) => (
        <div key={i} className={`letter-slot ${ch !== '_' ? 'filled' : ''}`}>
          <span>{ch !== '_' ? ch : ''}</span>
        </div>
      ))}
    </div>
  );
}
