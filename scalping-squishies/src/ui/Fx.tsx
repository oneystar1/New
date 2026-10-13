import { useEffect, useRef } from 'react';
import { onFx } from './fxbus';

interface P { x: number; y: number; vx: number; vy: number; c: string; r: number; life: number; spin: number }
const COLORS = ['#ff7ac8', '#9b7bff', '#6ef0c2', '#ffe066', '#6ec6ff', '#ff6b6b'];

/** Confetti canvas plus a screen-shake class toggler. */
export function Fx() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext('2d')!;
    let parts: P[] = [];
    let raf = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const loop = () => {
      g.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.life -= 1; p.spin += 0.2;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.spin);
        g.fillStyle = p.c;
        g.globalAlpha = Math.min(1, p.life / 30);
        g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        g.restore();
      }
      if (parts.length) raf = requestAnimationFrame(loop); else raf = 0;
    };
    const off = onFx((e) => {
      if (e.kind === 'confetti') {
        const n = 40 * e.intensity;
        for (let i = 0; i < n; i++) {
          parts.push({ x: canvas.width / 2 + (Math.random() - 0.5) * 120, y: canvas.height * 0.4, vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10, c: COLORS[i % COLORS.length], r: 4 + Math.random() * 5, life: 70 + Math.random() * 40, spin: Math.random() * 6 });
        }
        if (!raf) raf = requestAnimationFrame(loop);
      } else if (e.kind === 'shake') {
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
      } else if (e.kind === 'flash') {
        const el = document.createElement('div');
        el.className = 'flash';
        el.style.background = e.color;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 350);
      }
    });
    return () => { off(); window.removeEventListener('resize', resize); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={ref} className="fxcanvas" aria-hidden />;
}
