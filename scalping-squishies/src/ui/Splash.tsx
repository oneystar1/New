import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { Sprite } from '../art/Sprite';
import { CONFIG } from '../config';

/** Launch screen: logo, tagline, a short load bar, tap or wait to continue. */
export function Splash() {
  const done = useGame((g) => g.splashDone);
  const dismiss = useGame((g) => g.dismissSplash);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setReady(true), 1100);
    const b = setTimeout(() => dismiss(), 2600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [dismiss]);
  if (done) return null;
  return (
    <div className="splash" onPointerDown={() => ready && dismiss()}>
      <div className="splash-art">
        <div className="splash-sprite a"><Sprite id="doh_kube" size={120} /></div>
        <div className="splash-sprite b"><Sprite id="sq_nana" size={110} /></div>
        <div className="splash-sprite c"><Sprite id="doh_glob" size={80} variant="glow" /></div>
      </div>
      <h1 className="splash-title">Scalping<br />Squishies</h1>
      <div className="splash-tag">Camp the drops. Flip the dohs. Get banned.</div>
      <div className="splash-bar"><i /></div>
      <div className="splash-hint">{ready ? 'Tap to start' : 'Loading the parking lot…'}</div>
      <div className="splash-ver">v{CONFIG.version} · all brands are parodies</div>
    </div>
  );
}
