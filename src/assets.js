// Asset loading and sprite composition (body recolour + species head).
import { SPECIES } from './data/pokemon.js';

export const assets = {
  body: null, heads: null, misc: null, font: null, meta: null,
  composites: new Map(), // key: `${species}|${teamId}` -> { frames: {name: {canvas, flipped}} }
  headBack: new Map(),
};

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('failed to load ' + src));
    im.src = src;
  });
}

export async function loadAssets(base = 'assets/sprites/') {
  const [body, heads, misc, font, meta] = await Promise.all([
    loadImage(base + 'body.png'), loadImage(base + 'heads.png'), loadImage(base + 'misc.png'),
    loadImage(base + 'font.png'), fetch(base + 'sprites.json').then(r => r.json()),
  ]);
  Object.assign(assets, { body, heads, misc, font, meta });
  return assets;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function rgbKey(r, g, b) { return (r << 16) | (g << 8) | b; }

function shade([r, g, b], k) {
  return [Math.max(0, Math.round(r * k)), Math.max(0, Math.round(g * k)), Math.max(0, Math.round(b * k))];
}

/** Extract one 16x16 head as ImageData. */
function headImageData(species) {
  const h = assets.meta.heads;
  const info = h.heads[species];
  if (!info) throw new Error('no head sprite for ' + species);
  const sx = (info.index % h.cols) * h.size, sy = Math.floor(info.index / h.cols) * h.size;
  const c = makeCanvas(h.size, h.size);
  const ctx = c.getContext('2d');
  ctx.drawImage(assets.heads, sx, sy, h.size, h.size, 0, 0, h.size, h.size);
  return ctx.getImageData(0, 0, h.size, h.size);
}

/** Back-of-head: interior black pixels become the primary colour. */
function backHeadCanvas(species) {
  if (assets.headBack.has(species)) return assets.headBack.get(species);
  const h = assets.meta.heads;
  const info = h.heads[species];
  const id = headImageData(species);
  const d = id.data, n = h.size;
  const out = new ImageData(n, n);
  const o = out.data;
  const [pr, pg, pb] = info.primary;
  const alpha = (x, y) => (x < 0 || y < 0 || x >= n || y >= n) ? 0 : d[(y * n + x) * 4 + 3];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 4;
    if (d[i + 3] === 0) continue;
    const isBlack = d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40;
    const interior = alpha(x - 1, y) && alpha(x + 1, y) && alpha(x, y - 1) && alpha(x, y + 1);
    // Eyes / mouth / interior details: fill with primary colour. Outline stays.
    if (interior && (isBlack || (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200))) {
      o[i] = pr; o[i + 1] = pg; o[i + 2] = pb; o[i + 3] = 255;
    } else {
      o[i] = d[i]; o[i + 1] = d[i + 1]; o[i + 2] = d[i + 2]; o[i + 3] = d[i + 3];
    }
  }
  // Mirror horizontally so asymmetric details (horns, leaves) read correctly from behind.
  const c = makeCanvas(n, n);
  const tmp = makeCanvas(n, n);
  tmp.getContext('2d').putImageData(out, 0, 0);
  const ctx = c.getContext('2d');
  ctx.translate(n, 0); ctx.scale(-1, 1);
  ctx.drawImage(tmp, 0, 0);
  assets.headBack.set(species, c);
  return c;
}

/**
 * Build the full animation set for one species on one team.
 * Returns { frames: { name: { img, w, h, headX, headY } } } where img is a canvas
 * containing body (recoloured) + head.
 */
export function getComposite(species, team) {
  const key = species + '|' + team.id;
  if (assets.composites.has(key)) return assets.composites.get(key);
  const meta = assets.meta;
  const [cw, ch] = meta.body.cell;
  const sp = SPECIES[species] || { name: species };
  const headInfo = meta.heads.heads[species];
  const primary = headInfo.primary;
  const pal = meta.bodyPalette;
  const map = new Map();
  map.set(rgbKey(...pal.S), primary);
  map.set(rgbKey(...pal.s), shade(primary, 0.72));
  map.set(rgbKey(...pal.J), team.colors.primary);
  map.set(rgbKey(...pal.j), team.colors.secondary);
  map.set(rgbKey(...pal.P), team.colors.pants || [236, 236, 236]);
  map.set(rgbKey(...pal.p), shade(team.colors.pants || [236, 236, 236], 0.75));

  // Recolour the entire body sheet once per team+species.
  const sheet = makeCanvas(assets.body.width, assets.body.height);
  const sctx = sheet.getContext('2d');
  sctx.drawImage(assets.body, 0, 0);
  const id = sctx.getImageData(0, 0, sheet.width, sheet.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const rep = map.get(rgbKey(d[i], d[i + 1], d[i + 2]));
    if (rep) { d[i] = rep[0]; d[i + 1] = rep[1]; d[i + 2] = rep[2]; }
  }
  sctx.putImageData(id, 0, 0);

  const headSize = meta.heads.size;
  const headSx = (headInfo.index % meta.heads.cols) * headSize;
  const headSy = Math.floor(headInfo.index / meta.heads.cols) * headSize;
  const frames = {};
  for (const [name, fr] of Object.entries(meta.body.frames)) {
    const c = makeCanvas(cw, ch);
    const ctx = c.getContext('2d');
    ctx.drawImage(sheet, fr.index * cw, 0, cw, ch, 0, 0, cw, ch);
    const hx = Math.round(fr.headX - headSize / 2);
    const hy = fr.headY - headSize + 1;
    if (fr.backHead) {
      ctx.drawImage(backHeadCanvas(species), hx, hy);
    } else {
      ctx.drawImage(assets.heads, headSx, headSy, headSize, headSize, hx, hy, headSize, headSize);
    }
    frames[name] = { img: c, w: cw, h: ch, headX: fr.headX, headY: fr.headY };
  }
  const comp = { frames, species, team, name: sp.name };
  assets.composites.set(key, comp);
  return comp;
}

/** Pre-build composites for a whole team so the first pitch doesn't stutter. */
export function prebuildTeam(team) {
  for (const slot of team.roster) getComposite(slot.species, team);
}
