// Vector shape library for the sprite system. Every shape lives in a 64x64
// box and is described as SVG path data plus optional decorations drawn
// after the body. Keeping these as strings keeps the renderer tiny.

export type ShapeId =
  | 'cube' | 'berg' | 'blob' | 'drop' | 'gumdrop' | 'shroom' | 'heart' | 'cat' | 'bear' | 'ghost' | 'pumpkin' | 'deer'
  | 'bunny' | 'banana' | 'cheese' | 'butter' | 'dumpling' | 'ball' | 'toast' | 'avocado' | 'corn' | 'peach' | 'pack'
  | 'globe' | 'jewel' | 'lava' | 'popsicle' | 'pup' | 'grape' | 'calendar' | 'knit' | 'fuzz' | 'wave' | 'bean' | 'press'
  | 'cloud' | 'swirl' | 'ice' | 'proto' | 'bigball' | 'mochi' | 'strawberry' | 'kitty';

export interface Deco {
  /** Path drawn over the body. */
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  opacity?: number;
}

export interface ShapeDef {
  body: string;
  /** Extra body parts drawn before the main body (ears, stems). */
  behind?: Deco[];
  /** Details drawn after the body (holes, pleats, husks). */
  decos?: Deco[];
  /** Where the face goes: center x, y, scale. */
  face: [number, number, number];
  /** Shadow ellipse width multiplier. */
  shadow?: number;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r} a${r} ${r} 0 0 1 ${-r} ${r} h${-(w - 2 * r)} a${r} ${r} 0 0 1 ${-r} ${-r} v${-(h - 2 * r)} a${r} ${r} 0 0 1 ${r} ${-r}Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;

const BLOB = 'M32 8C46 6 58 18 56 32C58 46 46 58 32 56C18 58 6 46 8 32C6 18 18 6 32 8Z';
const HEART = 'M32 56C30 54 8 40 8 24C8 15 15 10 21 10C26 10 30 13 32 17C34 13 38 10 43 10C49 10 56 15 56 24C56 40 34 54 32 56Z';
const CLOUD = 'M18 50C10 50 6 44 8 38C9 32 15 30 18 31C18 22 26 16 34 18C40 12 52 16 52 26C58 27 60 36 56 42C54 48 48 50 44 50Z';

export const SHAPES: Record<ShapeId, ShapeDef> = {
  cube: { body: rrect(12, 12, 40, 40, 10), face: [32, 34, 1] },
  berg: { body: rrect(6, 8, 52, 50, 12), face: [32, 36, 1.2], shadow: 1.3 },
  blob: { body: BLOB, face: [32, 34, 1] },
  drop: { body: 'M32 6C32 6 10 30 10 40A22 22 0 0 0 54 40C54 30 32 6 32 6Z', face: [32, 40, 0.9] },
  gumdrop: { body: 'M10 52C10 24 20 10 32 10C44 10 54 24 54 52Z', face: [32, 38, 0.9], decos: [{ d: 'M14 46h36', stroke: '#ffffff', width: 1.5, opacity: 0.35 }] },
  shroom: { body: 'M8 30C8 14 20 6 32 6C44 6 56 14 56 30C56 34 50 36 32 36C14 36 8 34 8 30Z', behind: [{ d: rrect(22, 30, 20, 28, 8), fill: '#f4e7d3' }], face: [32, 44, 0.75], decos: [{ d: circle(20, 20, 4), fill: '#ffffff', opacity: 0.6 }, { d: circle(40, 16, 3), fill: '#ffffff', opacity: 0.6 }, { d: circle(44, 26, 2.5), fill: '#ffffff', opacity: 0.6 }] },
  heart: { body: HEART, face: [32, 30, 0.9] },
  cat: { body: circle(32, 34, 22), behind: [{ d: 'M14 24L10 4L28 14Z' }, { d: 'M50 24L54 4L36 14Z' }], face: [32, 34, 1], decos: [{ d: 'M10 36l-6 -2M10 40l-6 1M54 36l6 -2M54 40l6 1', stroke: '#00000055', width: 1.2 }] },
  bear: { body: circle(32, 36, 22), behind: [{ d: circle(14, 18, 8) }, { d: circle(50, 18, 8) }], face: [32, 36, 1], decos: [{ d: circle(14, 18, 4), fill: '#ffffff', opacity: 0.35 }, { d: circle(50, 18, 4), fill: '#ffffff', opacity: 0.35 }] },
  ghost: { body: 'M10 34C10 16 20 6 32 6C44 6 54 16 54 34V56L46 50L39 56L32 50L25 56L18 50L10 56Z', face: [32, 30, 1] },
  pumpkin: { body: ellipse(32, 36, 26, 20), behind: [{ d: rrect(28, 8, 8, 14, 3), fill: '#5a8a3a' }], face: [32, 38, 1], decos: [{ d: 'M22 17C14 24 14 48 22 55M42 17C50 24 50 48 42 55', stroke: '#00000033', width: 2 }] },
  deer: { body: circle(32, 38, 20), behind: [{ d: 'M18 20L14 4M18 20L8 10M18 20L22 6M46 20L50 4M46 20L56 10M46 20L42 6', stroke: '#7a4b2a', width: 3 }], face: [32, 36, 1], decos: [{ d: circle(32, 46, 5), fill: '#ff4d4d' }] },
  bunny: { body: circle(32, 40, 19), behind: [{ d: ellipse(22, 14, 6, 14) }, { d: ellipse(42, 14, 6, 14) }], face: [32, 40, 0.9], decos: [{ d: ellipse(22, 14, 2.5, 9), fill: '#ffb6c1', opacity: 0.7 }, { d: ellipse(42, 14, 2.5, 9), fill: '#ffb6c1', opacity: 0.7 }] },
  banana: { body: 'M12 40C14 54 36 60 52 44C58 38 58 30 52 30C44 44 28 50 18 40C14 36 10 36 12 40Z', behind: [{ d: 'M50 30L56 22L60 26L54 32Z', fill: '#7a5a2a' }], face: [32, 47, 0.62], decos: [{ d: 'M20 44C30 52 42 50 50 40', stroke: '#00000022', width: 2 }] },
  cheese: { body: 'M6 52L58 52L58 24L6 40Z', face: [34, 44, 0.7], decos: [{ d: circle(18, 46, 4), fill: '#00000022' }, { d: circle(44, 36, 5), fill: '#00000022' }, { d: circle(50, 46, 2.5), fill: '#00000022' }, { d: 'M6 40L58 24L58 20L6 36Z', fill: '#ffffff', opacity: 0.25 }] },
  butter: { body: rrect(8, 22, 48, 30, 6), face: [32, 40, 0.8], decos: [{ d: 'M14 22L22 12H62L56 22Z', fill: '#ffffff', opacity: 0.35 }] },
  dumpling: { body: 'M8 46C8 28 20 16 32 16C44 16 56 28 56 46Z', face: [32, 38, 0.8], decos: [{ d: 'M18 22C22 18 24 20 26 16M32 18C32 14 34 14 34 18M38 16C40 20 42 18 46 22', stroke: '#00000033', width: 1.6 }, { d: rrect(6, 46, 52, 8, 4), fill: '#00000022' }] },
  ball: { body: circle(32, 34, 24), face: [32, 36, 1] },
  bigball: { body: circle(32, 33, 27), face: [32, 36, 1.1], shadow: 1.3 },
  toast: { body: 'M10 24C10 12 20 10 24 14C28 10 36 10 40 14C44 10 54 12 54 24V56H10Z', face: [32, 40, 0.9], decos: [{ d: 'M14 28C14 20 20 18 24 20C28 18 36 18 40 20C44 18 50 20 50 28V52H14Z', fill: '#ffffff', opacity: 0.3 }] },
  avocado: { body: 'M32 6C44 6 54 24 54 38C54 50 44 58 32 58C20 58 10 50 10 38C10 24 20 6 32 6Z', face: [32, 24, 0.7], decos: [{ d: 'M32 14C40 14 48 26 48 38C48 48 40 54 32 54C24 54 16 48 16 38C16 26 24 14 32 14Z', fill: '#d6e8a0' }, { d: circle(32, 40, 8), fill: '#8a5a2a' }] },
  corn: { body: ellipse(32, 32, 14, 26), behind: [{ d: 'M18 30C8 34 6 50 12 60C22 54 24 40 18 30Z', fill: '#5a9a3a' }, { d: 'M46 30C56 34 58 50 52 60C42 54 40 40 46 30Z', fill: '#5a9a3a' }], face: [32, 20, 0.6], decos: [{ d: 'M26 30h12M26 38h12M26 46h12M32 26v24', stroke: '#00000022', width: 1.5 }] },
  peach: { body: 'M32 14C40 8 56 14 56 32C56 46 44 58 32 58C20 58 8 46 8 32C8 14 24 8 32 14Z', behind: [{ d: 'M34 12C40 2 50 4 52 8C46 12 38 14 34 12Z', fill: '#5a9a3a' }], face: [32, 36, 0.9], decos: [{ d: 'M32 14C32 30 32 44 32 56', stroke: '#00000022', width: 2 }] },
  pack: { body: rrect(6, 12, 52, 44, 6), face: [32, 30, 0], decos: [{ d: circle(16, 36, 6), fill: '#ff7ac8' }, { d: circle(28, 36, 6), fill: '#6ef0c2' }, { d: circle(40, 36, 6), fill: '#ffe066' }, { d: circle(52, 36, 6), fill: '#6ec6ff' }, { d: circle(22, 48, 6), fill: '#9b7bff' }, { d: rrect(10, 16, 44, 10, 3), fill: '#ffffff', opacity: 0.4 }] },
  globe: { body: circle(32, 30, 22), behind: [{ d: rrect(14, 48, 36, 10, 4), fill: '#7a4b2a' }], face: [32, 34, 0.8], decos: [{ d: circle(20, 20, 1.5), fill: '#fff' }, { d: circle(42, 16, 1.5), fill: '#fff' }, { d: circle(46, 30, 1.5), fill: '#fff' }, { d: circle(24, 40, 1.5), fill: '#fff' }, { d: circle(38, 42, 1.2), fill: '#fff' }] },
  jewel: { body: 'M32 6L54 20L48 50L16 50L10 20Z', face: [32, 34, 0.8], decos: [{ d: 'M32 6L22 20L10 20M32 6L42 20L54 20M22 20L16 50M42 20L48 50M22 20H42', stroke: '#ffffff', width: 1.2, opacity: 0.5 }] },
  lava: { body: BLOB, face: [32, 30, 0.8], decos: [{ d: circle(22, 42, 6), fill: '#ffffff', opacity: 0.35 }, { d: circle(40, 46, 4), fill: '#ffffff', opacity: 0.35 }, { d: circle(44, 22, 3), fill: '#ffffff', opacity: 0.35 }] },
  popsicle: { body: rrect(16, 4, 32, 44, 14), behind: [{ d: rrect(28, 44, 8, 18, 3), fill: '#d9b98a' }], face: [32, 24, 0.8], decos: [{ d: 'M24 34h16', stroke: '#ffffff', width: 1.5, opacity: 0.4 }] },
  pup: { body: circle(32, 36, 21), behind: [{ d: ellipse(12, 30, 7, 14) }, { d: ellipse(52, 30, 7, 14) }], face: [32, 36, 1], decos: [{ d: ellipse(32, 44, 6, 4), fill: '#ffffff', opacity: 0.5 }] },
  grape: { body: circle(32, 40, 10), behind: [{ d: circle(20, 30, 9) }, { d: circle(44, 30, 9) }, { d: circle(32, 22, 9) }, { d: circle(14, 44, 8) }, { d: circle(50, 44, 8) }, { d: rrect(30, 6, 4, 12, 2), fill: '#5a9a3a' }], face: [32, 40, 0.6] },
  calendar: { body: rrect(8, 12, 48, 46, 6), face: [32, 36, 0], decos: [{ d: rrect(8, 12, 48, 12, 6), fill: '#ff6b6b' }, { d: 'M18 32h8v8h-8zM28 32h8v8h-8zM38 32h8v8h-8zM18 44h8v8h-8zM28 44h8v8h-8zM38 44h8v8h-8z', fill: '#ffffff', opacity: 0.6 }, { d: 'M20 8v8M44 8v8', stroke: '#ffffff', width: 3 }] },
  knit: { body: circle(32, 30, 20), behind: [{ d: 'M16 20L12 4L28 12Z' }, { d: 'M48 20L52 4L36 12Z' }], face: [32, 30, 0.9], decos: [{ d: rrect(10, 44, 44, 16, 6), fill: '#d94f4f' }, { d: 'M14 52l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4', stroke: '#ffffff', width: 2, opacity: 0.7 }] },
  fuzz: { body: circle(32, 34, 20), face: [32, 36, 0.9], decos: [{ d: Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; const x1 = 32 + Math.cos(a) * 18, y1 = 34 + Math.sin(a) * 18, x2 = 32 + Math.cos(a) * 27, y2 = 34 + Math.sin(a) * 27; return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`; }).join(''), stroke: 'currentColor', width: 2.2, opacity: 0.9 }] },
  wave: { body: BLOB, face: [32, 30, 0.8], decos: [{ d: 'M14 42c4-4 8-4 12 0s8 4 12 0 8-4 12 0M14 50c4-4 8-4 12 0s8 4 12 0 8-4 12 0', stroke: '#ffffff', width: 2, opacity: 0.45 }] },
  bean: { body: 'M20 10C34 6 56 16 54 34C52 48 36 58 22 54C8 50 6 36 14 28C20 22 12 14 20 10Z', face: [34, 32, 0.8] },
  press: { body: ellipse(32, 38, 26, 16), face: [32, 38, 0.8], decos: [{ d: 'M22 30c6-8 14-8 20 0M26 28c4-5 8-5 12 0', stroke: '#ffffff', width: 1.5, opacity: 0.4 }] },
  cloud: { body: CLOUD, face: [32, 38, 0.8] },
  swirl: { body: rrect(12, 12, 40, 40, 10), face: [32, 34, 0.9], decos: [{ d: 'M32 32m-14 0a14 14 0 1 1 28 0a10 10 0 1 1-20 0a6 6 0 1 1 12 0a2 2 0 1 1-4 0', stroke: '#ffffff', width: 3, opacity: 0.55 }] },
  ice: { body: rrect(12, 12, 40, 40, 10), face: [32, 36, 0.9], decos: [{ d: 'M18 18l10 8M44 16l-6 10M20 46l8-6', stroke: '#ffffff', width: 1.5, opacity: 0.7 }] },
  proto: { body: rrect(12, 12, 40, 40, 10), face: [32, 34, 0.9], decos: [{ d: rrect(30, 40, 26, 14, 3), fill: '#ffffff' }, { d: 'M34 47h18', stroke: '#333', width: 2 }, { d: 'M34 51h12', stroke: '#333', width: 1.5 }] },
  mochi: { body: ellipse(32, 38, 22, 16), face: [32, 38, 0.8], decos: [{ d: ellipse(32, 26, 10, 6), fill: '#ffffff', opacity: 0.5 }] },
  strawberry: { body: 'M32 14C46 14 56 26 54 40C52 52 42 58 32 58C22 58 12 52 10 40C8 26 18 14 32 14Z', behind: [{ d: 'M32 14C24 6 20 10 18 12C24 14 28 16 32 14ZM32 14C40 6 44 10 46 12C40 14 36 16 32 14Z', fill: '#5a9a3a' }], face: [32, 36, 0.9], decos: [{ d: circle(22, 30, 1.5) + circle(42, 30, 1.5) + circle(32, 44, 1.5) + circle(20, 44, 1.5) + circle(44, 44, 1.5), fill: '#ffe066' }] },
  kitty: { body: circle(32, 36, 20), behind: [{ d: 'M16 26L12 8L28 16Z' }, { d: 'M48 26L52 8L36 16Z' }], face: [32, 36, 1], decos: [{ d: 'M32 42l-4 3h8z', fill: '#ff9ab6' }] },
};
