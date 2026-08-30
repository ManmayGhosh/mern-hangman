export default function Leaderboard({ entries, loading }) {
  return (
    <div className="leaderboard">
      <h2>Top Players</h2>
      {loading && <p className="lb-empty">Loading…</p>}
      {!loading && entries.length === 0 && (
        <p className="lb-empty">No games finished yet — be the first.</p>
      )}
      {!loading && entries.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Wins</th>
              <th>Best streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.playerName}>
                <td>{e.playerName}</td>
                <td>{e.wins}</td>
                <td>{e.bestStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
