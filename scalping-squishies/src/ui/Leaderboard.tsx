import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { fetchLeaderboard, cloudEnabled, type LeaderboardRow } from '../net/api';

/** Con Weekend leaderboard: restock units grabbed this week. Needs the backend. */
export function Leaderboard() {
  const s = useGame((g) => g.s);
  const setHandle = useGame((g) => g.setHandle);
  const cloudPush = useGame((g) => g.cloudPush);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [week, setWeek] = useState('');
  useEffect(() => {
    if (!cloudEnabled()) return;
    let alive = true;
    const refresh = async () => { const r = await fetchLeaderboard(); if (r && alive) { setRows(r.top); setRank(r.yourRank); setWeek(r.week); } };
    void refresh();
    const t = setInterval(() => void refresh(), 60_000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (!cloudEnabled()) return null;
  return (
    <div className="card">
      <div className="row between">
        <h3>🏁 Con Weekend leaderboard {week && <span className="small">· {week}</span>}</h3>
        <span className="small">{rank ? `you: #${rank}` : 'unranked'}</span>
      </div>
      <div className="sub">Units grabbed in restock runs on Saturday and Sunday. You: {s.conWeek.units}.</div>
      <div className="row mt">
        <input className="handle" value={s.handle} placeholder="Your scalper handle" maxLength={24} onChange={(e) => setHandle(e.target.value)} onBlur={() => void cloudPush()} />
      </div>
      <div className="mt">
        {(rows ?? []).slice(0, 10).map((r) => (
          <div className={`row rank ${r.you ? 'beaten' : ''}`} key={r.rank}>
            <span className="small" style={{ width: 28 }}>#{r.rank}</span>
            <div className="grow"><b>{r.name}</b></div>
            <span className="small">{r.score} units</span>
          </div>
        ))}
        {rows && rows.length === 0 && <div className="small center">No scores yet this week. Camp a restock on the weekend.</div>}
      </div>
    </div>
  );
}
