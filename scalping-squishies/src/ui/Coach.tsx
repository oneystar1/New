import { useEffect, useState } from 'react';
import { useGame } from '../engine/store';
import { TUTORIAL } from '../engine/data/tutorial';

const TARGETS: Record<string, string> = {
  t_tap: 'shelf',
  t_unit: 'start-run',
  t_manager: 'hire',
  t_restock: 'camp',
  t_deal: 'offer',
  t_upgrade: 'upgrade',
  t_pull: 'free-pull',
  t_mission: 'mission',
  t_prestige: 'relocate',
};

/** First-launch choice, then a coach bubble that walks the tutorial steps. */
export function Coach() {
  const s = useGame((g) => g.s);
  const splashDone = useGame((g) => g.splashDone);
  const setChoice = useGame((g) => g.setTutorialChoice);
  const requestTab = useGame((g) => g.requestTab);
  const [collapsed, setCollapsed] = useState(false);
  const step = TUTORIAL.find((t) => !s.tutorialDone.includes(t.id));
  const idx = step ? TUTORIAL.indexOf(step) : TUTORIAL.length;
  // The tour ends before the long-term prestige step.
  const active = s.tutorialChoice === 'on' && !!step && idx < TUTORIAL.length - 1;

  // Highlight the element for the current step wherever it is rendered.
  useEffect(() => {
    if (!active || !step) return;
    const key = TARGETS[step.id];
    let el: Element | null = null;
    const apply = () => {
      document.querySelectorAll('.tut-target').forEach((e) => e.classList.remove('tut-target'));
      el = document.querySelector(`[data-tut="${key}"]`);
      el?.classList.add('tut-target');
    };
    apply();
    const t = setInterval(apply, 500);
    return () => { clearInterval(t); el?.classList.remove('tut-target'); };
  }, [active, step]);

  useEffect(() => {
    if (s.tutorialChoice === 'on' && step && idx >= TUTORIAL.length - 1) setChoice('done');
  }, [s.tutorialChoice, step, idx, setChoice]);

  if (!splashDone) return null;

  if (s.tutorialChoice === 'pending') {
    return (
      <div className="overlay">
        <div className="modal center">
          <h2>First time on the block?</h2>
          <p>A two-minute tour walks you through tapping, your first run, a restock line and the Marketplace. You can skip it and still earn the step rewards on your own.</p>
          <div className="actions">
            <button className="btn" onClick={() => setChoice('off')}>Skip, I've camped before</button>
            <button className="btn primary" onClick={() => { setChoice('on'); requestTab('hunt'); }}>Take the tour</button>
          </div>
        </div>
      </div>
    );
  }

  if (!active || !step) return null;
  return (
    <div className={`coach ${collapsed ? 'collapsed' : ''}`}>
      <div className="row between" onClick={() => setCollapsed(!collapsed)}>
        <b>🎓 Step {idx + 1} of {TUTORIAL.length - 1}: {step.text}</b>
        <span className="small">{collapsed ? '▲' : '▼'}</span>
      </div>
      {!collapsed && (
        <>
          <div className="small mt">{step.hint}</div>
          <div className="row mt">
            <button className="btn ghost sm" onClick={() => setChoice('off')}>Skip tour</button>
            <button className="btn primary sm grow" onClick={() => { requestTab(step.tab); setTimeout(() => document.querySelector(`[data-tut="${TARGETS[step.id]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150); }}>Show me</button>
          </div>
        </>
      )}
    </div>
  );
}
