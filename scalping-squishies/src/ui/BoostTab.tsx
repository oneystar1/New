import { useState } from 'react';
import { useGame } from '../engine/store';
import { UPGRADES } from '../engine/data/upgrades';
import { ACHIEVEMENTS } from '../engine/data/achievements';
import { STORE_BY_ID } from '../engine/data/stores';
import { credForRun, PRESTIGE_MIN_EARNED, CRED_PER_POINT } from '../engine/sim';
import { CITY_BY_ID } from '../engine/data/cities';
import { RANKED_RIVALS } from '../engine/data/rivals';
import { formatCash, formatNumber } from '../engine/math';
import type { Currency, UpgradeDef } from '../engine/types';

const CUR_ICON: Record<Currency, string> = { cash: '$', clout: '💠', cred: '⭐' };

export function BoostTab() {
  const s = useGame((g) => g.s);
  const buyUpgrade = useGame((g) => g.buyUpgrade);
  const openRelocate = useGame((g) => g.openRelocate);
  const [view, setView] = useState<'cash' | 'sketchy' | 'clout' | 'cred' | 'ach' | 'settings'>('cash');
  const gain = credForRun(s.stats.totalCashEarned);

  const visible = (u: UpgradeDef): boolean => {
    if (s.upgrades.includes(u.id)) return false;
    if (u.minPrestige && s.stats.prestiges < u.minPrestige) return false;
    if (u.tier !== undefined) {
      const prevId = u.tier > 0 ? u.id.replace(/_(\d)$/, `_${u.tier - 1}`) : null;
      if (prevId && !s.upgrades.includes(prevId)) return false;
      if (u.requires && (s.stores[u.requires.storeId]?.units ?? 0) <= 0) return false;
    }
    return true;
  };
  const affordable = (u: UpgradeDef): boolean => {
    if (u.requires && (s.stores[u.requires.storeId]?.units ?? 0) < u.requires.units) return false;
    return s[u.currency] >= u.cost;
  };
  const list = UPGRADES.filter((u) => {
    if (!visible(u)) return false;
    if (view === 'sketchy') return u.group === 'sketchy';
    if (view === 'cash') return u.currency === 'cash' && !u.group;
    return u.currency === view;
  }).sort((a, b) => a.cost - b.cost);

  return (
    <div>
      <div className="card" style={{ borderColor: 'var(--gold)' }}>
        <div className="row">
          <div className="ico-lg">🚚</div>
          <div className="grow">
            <h3>Relocate · 📍 {CITY_BY_ID[s.city]?.name ?? 'Dayton, OH'}</h3>
            <div className="small" style={{ color: 'var(--mint)' }}>City perk: {CITY_BY_ID[s.city]?.perk}</div>
            <div className="sub">
              The community found your listings. Move to a new city, keep your Street Cred. Each ⭐ = +{CRED_PER_POINT * 100}% profit forever.
              {' '}You have ⭐{formatNumber(s.cred)} (x{(1 + s.cred * CRED_PER_POINT).toFixed(2)}).
            </div>
          </div>
        </div>
        <button className="btn gold block mt" data-tut="relocate" disabled={gain <= 0} onClick={openRelocate}>
          {gain > 0 ? `Relocate for +⭐${formatNumber(gain)}` : `Earn ${formatCash(PRESTIGE_MIN_EARNED)} this run to relocate (${formatCash(s.stats.totalCashEarned)})`}
        </button>
      </div>

      <Rankings />

      <div className="seg">
        <button className={view === 'cash' ? 'active' : ''} onClick={() => setView('cash')}>$ Gear</button>
        <button className={view === 'sketchy' ? 'active' : ''} onClick={() => setView('sketchy')}>😈</button>
        <button className={view === 'clout' ? 'active' : ''} onClick={() => setView('clout')}>💠 Perks</button>
        <button className={view === 'cred' ? 'active' : ''} onClick={() => setView('cred')}>⭐ Rep</button>
        <button className={view === 'ach' ? 'active' : ''} onClick={() => setView('ach')}>🏅</button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>⚙️</button>
      </div>

      {view === 'ach' && <Achievements />}
      {view === 'settings' && <Settings />}
      {view === 'sketchy' && <div className="card sub" style={{ borderColor: 'var(--red)' }}>😈 Sketchy tactics pay big and add 🔥 Heat. At 100 Heat the community posts your listings and profit drops to x0.4 for three minutes. Heat cools over time, or buy an apology video in Deals.</div>}
      {(view === 'cash' || view === 'sketchy' || view === 'clout' || view === 'cred') && (
        <>
          {list.length === 0 && <div className="card center sub">{view === 'cred' ? 'Relocate at least once to unlock Reputation upgrades.' : 'Nothing left to buy here right now.'}</div>}
          {list.map((u, i) => (
            <div className="card row" key={u.id} data-tut={i === 0 ? 'upgrade' : undefined}>
              <div className="ico-lg">{u.icon}</div>
              <div className="grow">
                <h3>{u.name}</h3>
                <div className="sub">
                  {u.blurb}
                  {u.requires && ` · needs ${u.requires.units} ${STORE_BY_ID[u.requires.storeId].name} runs`}
                  {u.heat && <span style={{ color: 'var(--red)' }}> · 🔥 +{u.heat} heat</span>}
                </div>
              </div>
              <button className={`btn ${u.currency === 'cash' ? 'primary' : u.currency === 'clout' ? '' : 'gold'}`} disabled={!affordable(u)} onClick={() => buyUpgrade(u.id)}>
                {CUR_ICON[u.currency]}{u.currency === 'cash' ? formatNumber(u.cost) : u.cost}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Rankings() {
  const s = useGame((g) => g.s);
  const [open, setOpen] = useState(false);
  const worth = s.stats.lifetimeCashEarned;
  const passed = RANKED_RIVALS.filter((r) => worth >= r.netWorth).length;
  const rank = RANKED_RIVALS.length - passed + 1;
  const next = RANKED_RIVALS.find((r) => worth < r.netWorth);
  return (
    <div className="card" onClick={() => setOpen(!open)}>
      <div className="row">
        <div className="ico-lg">🏆</div>
        <div className="grow">
          <h3>Local scalper rankings · #{rank} of {RANKED_RIVALS.length + 1}</h3>
          <div className="sub">{next ? `Next: ${next.icon} ${next.name} at ${formatCash(next.netWorth)} lifetime (you: ${formatCash(worth)})` : 'You are #1. The manufacturer is taking your calls.'}</div>
        </div>
        <span className="small">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="mt">
          {[...RANKED_RIVALS].reverse().map((r) => {
            const beaten = worth >= r.netWorth;
            return (
              <div className={`row rank ${beaten ? 'beaten' : ''}`} key={r.id}>
                <span>{r.icon}</span>
                <div className="grow"><b>{r.name}</b><div className="small">{r.blurb}</div></div>
                <span className="small">{formatCash(r.netWorth)}{beaten ? ' ✓' : ''}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Achievements() {
  const s = useGame((g) => g.s);
  return (
    <div>
      <div className="small center" style={{ marginBottom: 8 }}>{s.achievements.length}/{ACHIEVEMENTS.length} unlocked</div>
      {ACHIEVEMENTS.map((a) => {
        const got = s.achievements.includes(a.id);
        return (
          <div className={`card row ${got ? '' : 'locked'}`} key={a.id}>
            <div className="ico-lg">{got ? a.icon : '🔒'}</div>
            <div className="grow">
              <h3>{a.name}</h3>
              <div className="sub">{a.blurb}</div>
            </div>
            <span className="pill clout">{got ? '✓' : `+${a.clout}`}</span>
          </div>
        );
      })}
    </div>
  );
}

function Settings() {
  const s = useGame((g) => g.s);
  const setSetting = useGame((g) => g.setSetting);
  const exportSave = useGame((g) => g.exportSave);
  const importSave = useGame((g) => g.importSave);
  const reset = useGame((g) => g.reset);
  const toast = useGame((g) => g.toast);
  const replayTutorial = useGame((g) => g.replayTutorial);
  const [txt, setTxt] = useState('');
  return (
    <div>
      <div className="card">
        <div className="row between"><span>Haptics</span><button className="btn sm" onClick={() => setSetting('haptics', !s.settings.haptics)}>{s.settings.haptics ? 'On' : 'Off'}</button></div>
        <div className="row between mt"><span>Tutorial tour</span><button className="btn sm" onClick={replayTutorial}>Replay</button></div>
        <div className="row between mt"><span>Sound effects</span><button className="btn sm" onClick={() => setSetting('sfx', !s.settings.sfx)}>{s.settings.sfx ? 'On' : 'Off'}</button></div>
        <div className="row between mt"><span>Number format</span><button className="btn sm" onClick={() => setSetting('notation', s.settings.notation === 'short' ? 'scientific' : 'short')}>{s.settings.notation}</button></div>
      </div>
      <div className="card">
        <h3>Cloud-less save transfer</h3>
        <div className="sub">Copy this code to move your save between devices. iOS build will use iCloud key-value storage.</div>
        <textarea className="save mt" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Paste a save code here to import" />
        <div className="row mt">
          <button className="btn sm" onClick={() => { setTxt(exportSave()); toast('Save code generated', '📋'); }}>Export</button>
          <button className="btn sm" onClick={() => (importSave(txt) ? toast('Save imported', '✅', 'good') : toast('Invalid save code', '❌', 'bad'))}>Import</button>
          <button className="btn sm ghost" style={{ marginLeft: 'auto', color: 'var(--red)' }} onClick={() => { if (confirm('Wipe everything and start over?')) reset(); }}>Hard reset</button>
        </div>
      </div>
      <div className="debug">
        Stats: taps {s.stats.taps} · pulls {s.stats.pulls} · units {s.stats.unitsBought} · cycles {s.stats.sales} · ads {s.stats.adsWatched} · relocations {s.stats.prestiges} · lifetime {formatCash(s.stats.lifetimeCashEarned)}
      </div>
    </div>
  );
}
