// The engraved plan of Port-Aurum, generated in code: districts, blocks, houses, avenues, landmarks and
// the lots on which small businesses stand. Deterministic (own seed), so every game and every save sees the
// same city, and the plan never touches the game's random stream. Coordinates: 200 × 140 units, sea to the east.
// Composite of Kyiv (hill, Podil), Odesa (grid, harbour), Lviv (market square, town hall), Kraków (green ring
// round the old town) and Prague (river bend with a stone bridge).

export type District = 'hill' | 'old' | 'market' | 'podil' | 'port' | 'zar' | 'station' | 'univ' | 'sloboda';
export type Pt = [number, number];

export interface Bldg { x: number; y: number; w: number; h: number; r: number; k: 0 | 1 | 2 }
export interface Lot { id: number; x: number; y: number; r: number; w: number; h: number; district: District }

export const PLAN_W = 200, PLAN_H = 220;

export const DISTRICTS: Record<District, { t: string; poly: Pt[]; label: Pt; /** rough centre, for rivals' influence */ c: Pt }> = {
  hill: { t: 'Замковий пагорб', poly: [[8, 12], [62, 7], [70, 34], [60, 54], [22, 58], [6, 36]], label: [34, 4.5], c: [36, 32] },
  old: { t: 'Старе місто', poly: [[76, 13], [134, 10], [138, 50], [128, 64], [80, 64], [72, 40]], label: [104, 7], c: [105, 37] },
  market: { t: 'Ринок', poly: [[74, 72], [132, 70], [136, 112], [78, 116]], label: [104, 77], c: [105, 92] },
  podil: { t: 'Поділ', poly: [[6, 68], [60, 64], [66, 98], [58, 120], [10, 122]], label: [33, 72], c: [34, 94] },
  port: { t: 'Порт', poly: [[142, 12], [176, 14], [179, 118], [150, 117], [146, 70]], label: [160, 8], c: [161, 66] },
  // south of the river: the capital's newer, working half
  zar: { t: 'Заріччя', poly: [[6, 140], [64, 138], [70, 170], [62, 204], [10, 206]], label: [34, 143], c: [36, 172] },
  station: { t: 'Вокзал', poly: [[76, 142], [134, 140], [138, 178], [80, 182]], label: [106, 145.5], c: [107, 162] },
  univ: { t: 'Університет', poly: [[76, 188], [134, 186], [138, 212], [80, 214]], label: [107, 191], c: [107, 202] },
  sloboda: { t: 'Заводи', poly: [[144, 136], [174, 134], [176, 206], [148, 208]], label: [160, 140], c: [160, 172] }
};

// ---------------------------------------------------------------- tiny seeded rng

function mk(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inside(p: Pt, poly: Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const centroid = (poly: Pt[]): Pt => [poly.reduce((a, p) => a + p[0], 0) / poly.length, poly.reduce((a, p) => a + p[1], 0) / poly.length];
const shrink = (poly: Pt[], k: number): Pt[] => { const c = centroid(poly); return poly.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k] as Pt); };

// ---------------------------------------------------------------- static decor (drawn by the map component)

/** open spaces where no houses stand: squares, the castle, parks. [x, y, rx, ry] */
export const CLEARINGS: [number, number, number, number][] = [
  [104, 37, 9, 7], // town-hall square
  [104, 92, 15, 8], // market square
  [30, 25, 9, 8], // castle
  [50, 18, 6, 5], // monastery
  [26, 92, 6, 5], // Podil green
  [116, 22, 4, 4], // cathedral yard
  [92, 52, 5, 3.5], // opera
  [106, 151, 10, 4.5], // station square
  [107, 201, 13, 6], // university garden
  [30, 171, 4.5, 4], // Zarichchia church
  [160, 150, 3, 3] // works yard
];

/** main avenues, drawn over the blocks */
export const ROADS: string[] = [
  'M30 33 C38 44 56 40 72 44 L104 37 L146 40', // castle road → old town → port
  'M104 10 L104 37 L104 66 L104 92 L104 118', // Ratushna avenue, north to south
  'M60 92 L78 92 L104 92 L136 92 L176 92', // market street to the quay
  'M12 70 C30 76 48 72 60 78 L78 82', // Podil lane
  'M176 14 L177 60 L178 118', // quay promenade
  'M40 56 L76 50', // from the hill to the opera
  'M104 118 L104 140 L106 160 L107 212', // the avenue goes on over the bridge
  'M8 160 C30 166 50 158 76 160 L106 160 L136 160 L176 158', // south cross street
  'M34 138 L36 172 L34 205', // Zarichchia spine
  'M178 130 L177 170 L178 208', // south quay
  'M80 196 L136 194' // university row
];

// ---------------------------------------------------------------- the city

interface DCfg { angle: number; cell: [number, number]; street: number; plot: [number, number]; keep: number; jit: number; poly: Pt[]; lots: number }

const CFG: Record<District, DCfg> = {
  hill: { angle: -18, cell: [9, 8], street: 2.2, plot: [2.2, 4], keep: 0.55, jit: 14, poly: DISTRICTS.hill.poly, lots: 7 },
  old: { angle: 7, cell: [8, 7.4], street: 1.5, plot: [1.5, 2.8], keep: 0.97, jit: 9, poly: shrink(DISTRICTS.old.poly, 0.95), lots: 11 },
  market: { angle: 0, cell: [10, 8], street: 1.8, plot: [2, 3.4], keep: 0.92, jit: 2, poly: DISTRICTS.market.poly, lots: 10 },
  podil: { angle: -13, cell: [7, 6], street: 1.3, plot: [1.4, 2.5], keep: 0.95, jit: 6, poly: DISTRICTS.podil.poly, lots: 10 },
  port: { angle: 90, cell: [9, 6], street: 2.6, plot: [4, 9], keep: 0.9, jit: 1, poly: DISTRICTS.port.poly, lots: 8 },
  zar: { angle: 12, cell: [7, 6], street: 1.4, plot: [1.4, 2.6], keep: 0.95, jit: 7, poly: DISTRICTS.zar.poly, lots: 9 },
  station: { angle: 0, cell: [10, 7], street: 2.4, plot: [2.6, 5], keep: 0.78, jit: 2, poly: DISTRICTS.station.poly, lots: 7 },
  univ: { angle: -5, cell: [11, 8], street: 2.6, plot: [3, 5.5], keep: 0.55, jit: 3, poly: DISTRICTS.univ.poly, lots: 6 },
  sloboda: { angle: 90, cell: [9, 6], street: 2.2, plot: [4, 8], keep: 0.88, jit: 2, poly: DISTRICTS.sloboda.poly, lots: 8 }
};

export interface Plan { bldgs: Bldg[]; lots: Lot[]; byDistrict: Record<District, Lot[]> }

function build(): Plan {
  const rnd = mk(18701870);
  const bldgs: Bldg[] = [], lots: Lot[] = [];
  const byDistrict = { hill: [], old: [], market: [], podil: [], port: [], zar: [], station: [], univ: [], sloboda: [] } as Record<District, Lot[]>;
  (Object.keys(CFG) as District[]).forEach((d) => {
    const cf = CFG[d], c = centroid(cf.poly), a = (cf.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const [bw, bh] = cf.cell, mine: Bldg[] = [];
    for (let u = -60; u < 60; u += bw + cf.street) {
      for (let v = -60; v < 60; v += bh + cf.street) {
        // each block turns a little, like a real street pattern grown over centuries
        const ja = ((rnd() - 0.5) * cf.jit * Math.PI) / 180;
        const bcx = u + bw / 2, bcy = v + bh / 2;
        const rows = [bh / 2 - 0.2, bh / 2 - 0.2];
        rows.forEach((rh, ri) => {
          let x = 0;
          const ly = ri === 0 ? -bh / 2 + rh / 2 : bh / 2 - rh / 2;
          while (x < bw - 1) {
            const w = Math.min(bw - x, cf.plot[0] + rnd() * (cf.plot[1] - cf.plot[0]));
            if (w < 1) break;
            const lx = x + w / 2 - bw / 2;
            x += w + 0.25;
            if (rnd() > cf.keep) continue;
            // local → world: rotate the block about its own centre, then place the block in the district frame
            const px = bcx + (lx * Math.cos(ja) - ly * Math.sin(ja)), py = bcy + (lx * Math.sin(ja) + ly * Math.cos(ja));
            const wx = c[0] + px * ca - py * sa, wy = c[1] + px * sa + py * ca;
            if (!inside([wx, wy], cf.poly)) continue;
            if (CLEARINGS.some(([cx, cy, rx, ry]) => ((wx - cx) / (rx + 1)) ** 2 + ((wy - cy) / (ry + 1)) ** 2 < 1)) continue;
            const k = rnd() < 0.12 ? 2 : rnd() < 0.55 ? 1 : 0;
            mine.push({ x: +wx.toFixed(2), y: +wy.toFixed(2), w: +(w - 0.3).toFixed(2), h: +(rh * (0.8 + rnd() * 0.2)).toFixed(2), r: +(cf.angle + (ja * 180) / Math.PI).toFixed(1), k: k as 0 | 1 | 2 });
          }
        });
      }
    }
    // lots: well-spaced houses facing a street; businesses stand on them
    const pool = mine.map((b, i) => ({ b, i, o: rnd() })).sort((p, q) => p.o - q.o);
    const taken: Bldg[] = [];
    for (const { b } of pool) {
      if (taken.length >= cf.lots) break;
      if (taken.every((t) => Math.hypot(t.x - b.x, t.y - b.y) > 9.5)) taken.push(b);
    }
    taken.forEach((b) => { const lot: Lot = { id: lots.length, x: b.x, y: b.y, r: b.r, w: b.w, h: b.h, district: d }; lots.push(lot); byDistrict[d].push(lot); });
    bldgs.push(...mine);
  });
  return { bldgs, lots, byDistrict };
}

let cache: Plan | null = null;
export const getPlan = (): Plan => cache || (cache = build());
