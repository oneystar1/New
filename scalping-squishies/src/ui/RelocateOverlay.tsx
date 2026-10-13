import { useGame } from '../engine/store';
import { CITY_BY_ID } from '../engine/data/cities';
import { credForRun } from '../engine/sim';
import { formatNumber } from '../engine/math';

/** Pick between two cities when relocating (prestige). */
export function RelocateOverlay() {
  const relocating = useGame((g) => g.relocating);
  const s = useGame((g) => g.s);
  const doPrestige = useGame((g) => g.doPrestige);
  const closeRelocate = useGame((g) => g.closeRelocate);
  if (!relocating || !s.cityOffer) return null;
  const gained = credForRun(s.stats.totalCashEarned);
  return (
    <div className="overlay">
      <div className="modal">
        <h2>🚚 Time to relocate</h2>
        <p>The group found your listings in {CITY_BY_ID[s.city]?.name ?? 'this city'}. You keep your shelf, your Clout perks and <b>+⭐{formatNumber(gained)} Street Cred</b>. Stores, cash and gear reset. Pick where the van goes:</p>
        {s.cityOffer.map((id) => {
          const c = CITY_BY_ID[id];
          return (
            <button className="card city" key={id} onClick={() => void doPrestige(id)}>
              <div className="row">
                <div className="ico-lg">{c.icon}</div>
                <div className="grow" style={{ textAlign: 'left' }}>
                  <h3>{c.name}</h3>
                  <div className="sub">{c.blurb}</div>
                  <div className="small" style={{ color: 'var(--mint)', marginTop: 4 }}>Perk: {c.perk}</div>
                </div>
              </div>
            </button>
          );
        })}
        <button className="btn block mt" onClick={closeRelocate}>Not yet</button>
      </div>
    </div>
  );
}
