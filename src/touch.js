// On-screen touch controls (d-pad, A, B, Start) for phones and tablets.
// They feed player 1 through the same Input object as the keyboard.
import { unlockAudio } from './audio.js';

const CSS = `
#touch { display: none; width: 100%; max-width: 960px; box-sizing: border-box; padding: 8px 6px 4px;
  justify-content: space-between; align-items: center; gap: 8px;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: none; }
#touch.on { display: flex; overflow: hidden; }
#touch .pad { position: relative; width: 150px; height: 150px; flex: none; touch-action: none; }
#touch .pad span { position: absolute; background: #2a3356; border: 2px solid #4a5684; border-radius: 8px; width: 46px; height: 46px; box-sizing: border-box; }
#touch .pad .u { left: 52px; top: 0; } #touch .pad .d { left: 52px; bottom: 0; }
#touch .pad .l { left: 0; top: 52px; } #touch .pad .r { right: 0; top: 52px; }
#touch .pad .c { left: 52px; top: 52px; border-radius: 0; background: #2a3356; }
#touch .pad span.lit { background: #ffd84a; border-color: #ffd84a; }
#touch .btns { display: grid; grid-template-columns: 72px 72px; grid-template-rows: 72px 72px; gap: 4px; flex: none; }
#touch .btn { width: 72px; height: 72px; border-radius: 50%; background: #2a3356; border: 2px solid #4a5684; box-sizing: border-box;
  display: flex; align-items: center; justify-content: center; font: 16px/1 "Press Start 2P", "Courier New", monospace; color: #e8ecff; touch-action: none; }
#touch .btn.a { grid-column: 2; grid-row: 2; background: #3a2a56; }
#touch .btn.b { grid-column: 1; grid-row: 1; background: #56322a; }
#touch .btn.lit { background: #ffd84a; color: #111; border-color: #ffd84a; }
#touch .mid { display: flex; flex-direction: column; gap: 10px; align-items: center; flex: 1; min-width: 0; }
#touch .pill { padding: 10px 14px; border-radius: 20px; background: #2a3356; border: 2px solid #4a5684; color: #e8ecff;
  font: 9px/1.4 "Press Start 2P", "Courier New", monospace; touch-action: none; text-align: center; max-width: 100%; box-sizing: border-box; }
#touch .pill.lit { background: #ffd84a; color: #111; }
#touch .hint { font: 7px/1.6 "Press Start 2P", "Courier New", monospace; color: #8f97b8; text-align: center; }
@media (max-width: 500px) { #touch .hint { display: none; } }
@media (max-width: 400px) {
  #touch .pad { width: 126px; height: 126px; } #touch .pad span { width: 40px; height: 40px; }
  #touch .pad .u, #touch .pad .d, #touch .pad .c { left: 43px; } #touch .pad .l, #touch .pad .r { top: 43px; } #touch .pad .c { top: 43px; }
  #touch .btns { grid-template-columns: 62px 62px; grid-template-rows: 62px 62px; } #touch .btn { width: 62px; height: 62px; font-size: 14px; }
}
/* Tall portrait phones: there is room for bigger thumbs. */
@media (max-width: 500px) and (min-height: 700px) {
  #touch .pad { width: 176px; height: 176px; } #touch .pad span { width: 56px; height: 56px; }
  #touch .pad .u, #touch .pad .d, #touch .pad .c { left: 60px; } #touch .pad .l, #touch .pad .r { top: 60px; } #touch .pad .c { top: 60px; }
  #touch .btns { grid-template-columns: 84px 84px; grid-template-rows: 84px 84px; } #touch .btn { width: 84px; height: 84px; font-size: 18px; }
}
/* Phone held sideways: float the controls over the picture. */
@media (max-height: 520px) and (pointer: coarse) {
  #touch.on { position: fixed; left: 0; right: 0; bottom: 0; top: 0; padding: 0 12px 12px; align-items: flex-end; pointer-events: none; z-index: 5; }
  #touch .pad, #touch .btns, #touch .pill { pointer-events: auto; opacity: 0.82; }
  #touch .mid { align-self: flex-end; } #touch .hint { display: none; }
}
`;

export function installTouch(input, container) {
  const coarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  if (!container) return false;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  container.innerHTML = `
    <div class="pad" id="tpad"><span class="u"></span><span class="l"></span><span class="c"></span><span class="r"></span><span class="d"></span></div>
    <div class="mid"><div class="pill" data-btn="start">START / PAUSE</div><div class="hint">A: SWING / PITCH / THROW<br>B: POWER / PITCH TYPE</div></div>
    <div class="btns"><div class="btn b" data-btn="b">B</div><div class="btn a" data-btn="a">A</div></div>`;
  if (coarse) container.classList.add('on');
  const p = input.players[0];
  const press = (btn, down) => {
    if (down && !p.down[btn]) { p.pressed[btn] = true; input.anyPressed = true; }
    if (!down && p.down[btn]) p.released[btn] = true;
    p.down[btn] = down;
  };
  // --- buttons
  for (const el of container.querySelectorAll('[data-btn]')) {
    const btn = el.dataset.btn;
    const down = e => { e.preventDefault(); unlockAudio(); el.classList.add('lit'); press(btn, true); try { el.setPointerCapture(e.pointerId); } catch (_) {} };
    const up = e => { e.preventDefault(); el.classList.remove('lit'); press(btn, false); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  // --- d-pad: one finger, 8 directions, slides between them
  const pad = container.querySelector('#tpad');
  const arrows = { up: pad.querySelector('.u'), down: pad.querySelector('.d'), left: pad.querySelector('.l'), right: pad.querySelector('.r') };
  let padPointer = null;
  const setDirs = (dx, dy) => {
    const d = Math.hypot(dx, dy);
    const dead = d < 10;
    const want = {
      up: !dead && dy < -0.42 * d, down: !dead && dy > 0.42 * d,
      left: !dead && dx < -0.42 * d, right: !dead && dx > 0.42 * d,
    };
    for (const k in want) { press(k, want[k]); arrows[k].classList.toggle('lit', want[k]); }
  };
  const padMove = e => {
    if (e.pointerId !== padPointer) return;
    const r = pad.getBoundingClientRect();
    setDirs(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
  };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); unlockAudio(); padPointer = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (_) {} padMove(e); });
  pad.addEventListener('pointermove', e => { e.preventDefault(); padMove(e); });
  const padEnd = e => { if (e.pointerId !== padPointer) return; padPointer = null; setDirs(0, 0); };
  pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd); pad.addEventListener('lostpointercapture', padEnd);
  pad.addEventListener('contextmenu', e => e.preventDefault());
  // keep the page from scrolling / zooming while playing
  container.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  container.addEventListener('touchstart', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  return coarse;
}
