// Low-level drawing helpers for the 320x240 pixel canvas.
import { assets } from './assets.js';

export const W = 320, H = 240;
export let ctx = null;

export function setContext(c) { ctx = c; ctx.imageSmoothingEnabled = false; }

export function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }

export function clear(color = '#000') {
  ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
}

export function rect(x, y, w, h, color) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function strokeRect(x, y, w, h, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
}

/** Draw a sprite from misc.png by name. */
export function misc(name, x, y, scale = 1, flip = false) {
  const m = assets.meta.misc[name];
  if (!m) throw new Error('unknown misc sprite ' + name);
  drawSub(assets.misc, m.x, m.y, m.w, m.h, x, y, scale, flip);
  return m;
}

export function miscSize(name) { return assets.meta.misc[name]; }

export function drawSub(img, sx, sy, sw, sh, x, y, scale = 1, flip = false) {
  const dw = sw * scale, dh = sh * scale;
  x = Math.round(x); y = Math.round(y);
  if (flip) {
    ctx.save();
    ctx.translate(x + dw, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, x, y, dw, dh);
  }
}

/**
 * Draw a composite player frame with its feet-centre at (x, y).
 * `flip` mirrors (side frames face left by default).
 */
export function player(comp, frameName, x, y, scale = 1, flip = false) {
  const fr = comp.frames[frameName] || comp.frames.idle_front;
  const dw = fr.w * scale, dh = fr.h * scale;
  drawSub(fr.img, 0, 0, fr.w, fr.h, x - dw / 2, y - dh + scale, scale, flip);
}

/** Draw just the head (for HUD portraits). */
export function head(species, x, y, scale = 1) {
  const h = assets.meta.heads;
  const info = h.heads[species];
  const sx = (info.index % h.cols) * h.size, sy = Math.floor(info.index / h.cols) * h.size;
  drawSub(assets.heads, sx, sy, h.size, h.size, x, y, scale);
}

// ---------------------------------------------------------------- text
const fontCache = new Map();
function fontTinted(color) {
  if (fontCache.has(color)) return fontCache.get(color);
  const c = document.createElement('canvas');
  c.width = assets.font.width; c.height = assets.font.height;
  const fc = c.getContext('2d');
  fc.drawImage(assets.font, 0, 0);
  fc.globalCompositeOperation = 'source-in';
  fc.fillStyle = color;
  fc.fillRect(0, 0, c.width, c.height);
  fontCache.set(color, c);
  return c;
}

/** Draw bitmap text. align: 'left' | 'center' | 'right'. */
export function text(str, x, y, { color = '#fff', scale = 1, align = 'left', shadow = null } = {}) {
  const f = assets.meta.font;
  str = String(str).toUpperCase();
  const width = str.length * f.stride * scale;
  if (align === 'center') x -= Math.round(width / 2);
  else if (align === 'right') x -= width;
  if (shadow) {
    const sc = fontTinted(shadow);
    drawString(sc, str, x + scale, y + scale, scale);
  }
  drawString(fontTinted(color), str, x, y, scale);
  return width;
}

function drawString(img, str, x, y, scale) {
  const f = assets.meta.font;
  for (let i = 0; i < str.length; i++) {
    const idx = f.chars.indexOf(str[i]);
    if (idx < 0) continue;
    ctx.drawImage(img, idx * f.stride, 0, f.w, f.h, Math.round(x + i * f.stride * scale), Math.round(y), f.w * scale, f.h * scale);
  }
}

export function textWidth(str, scale = 1) { return String(str).length * assets.meta.font.stride * scale; }

/** Bordered panel. */
export function panel(x, y, w, h, fill = 'rgba(10,10,30,0.85)', border = '#fff') {
  rect(x, y, w, h, fill);
  strokeRect(x, y, w, h, border);
}
