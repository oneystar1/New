import { useGame } from '../engine/store';
import { computeModifiers, incomePerSecond } from '../engine/sim';
import { EVENTS } from '../engine/data/events';
import { formatCash, formatNumber, formatDuration } from '../engine/math';
import { CITY_BY_ID } from '../engine/data/cities';

export function Header() {
  const s = useGame((g) => g.s);
  const now = useGame((g) => g.now);
  const m = computeModifiers(s, now);
  const ips = incomePerSecond(s, m, false);
  const ev = s.event && s.event.endsAt > now ? EVENTS[s.event.kind] : null;
  const boosts = s.boosts.filter((b) => b.endsAt > now);
  const hypeS = s.hype.squish;
  const hypeD = s.hype.doh;

  return (
    <header className="header">
      <div className="wallet">
        <div className="grow">
          <div className="cash">{formatCash(s.cash, s.settings.notation)}</div>
          <div className="ips">📍 {CITY_BY_ID[s.city]?.name.split(',')[0] ?? 'Dayton'} · {formatCash(ips, s.settings.notation)}/sec · market 🍌{hypeS.toFixed(2)}x 🧊{hypeD.toFixed(2)}x</div>
        </div>
        <span className="pill clout">💠 {formatNumber(s.clout)}</span>
        {s.cred > 0 && <span className="pill cred">⭐ {formatNumber(s.cred)}</span>}
        {s.heat >= 40 && <span className="pill" style={{ color: s.heat >= 75 ? 'var(--red)' : 'var(--gold)' }}>🔥 {Math.floor(s.heat)}</span>}
      </div>
      {ev && (
        <div className={`banner ${ev.profitMult >= 1 && ev.speedMult >= 1 ? 'good' : 'bad'}`}>
          <span style={{ fontSize: 22 }}>{ev.icon}</span>
          <div className="t">
            <b>{ev.name} · {formatDuration((s.event!.endsAt - now) / 1000)} left</b>
            <span className="small">{ev.blurb}</span>
          </div>
        </div>
      )}
      {(boosts.length > 0 || m.vip) && (
        <div className="chips">
          {m.vip && <span className="chip">👑 VIP x{2}</span>}
          {boosts.map((b) => (
            <span key={b.id} className="chip">
              {b.label} · {formatDuration((b.endsAt - now) / 1000)}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
