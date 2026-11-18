// The engraved plan of Port-Aurum, generated in code: districts, blocks, houses, avenues, landmarks and
// the lots on which small businesses stand. Deterministic (own seed), so every game and every save sees the
// same city, and the plan never touches the game's random stream. Coordinates: 300 × 360 units, sea to the east;
// the bay cuts into the city and the town hall stands on its shore, as on the panorama.
// Composite of Kyiv (hill, Podil), Odesa (grid, harbour), Lviv (market square, town hall), Kraków (green ring
// round the old town) and Prague (river bend with a stone bridge).

export type District = 'hill' | 'old' | 'market' | 'podil' | 'port' | 'zar' | 'station' | 'univ' | 'sloboda';
export type Pt = [number, number];

export interface Bldg { x: number; y: number; w: number; h: number; r: number; k: 0 | 1 | 2 }
export interface Lot { id: number; x: number; y: number; r: number; w: number; h: number; district: District }

export const PLAN_W = 300, PLAN_H = 360;

/** the sea and the bay (Аурумська затока): the coast from the north edge round the bay to the south edge */
export const COAST: Pt[] = [[258, -4], [252, 30], [246, 58], [232, 76], [205, 88], [186, 100], [178, 118], [176, 140], [180, 165], [188, 190], [205, 200], [228, 206], [248, 214], [262, 240], [264, 280], [266, 320], [270, 364]];
/** the lighthouse island in the mouth of the bay */
export const ISLAND: Pt = [266, 150];
/** the river Aurumka, from the west into the bay's south-western corner; the stone bridge carries the avenue over it */
export const RIVER = 'M-4 262 C30 258 70 266 100 262 S130 252 146 243 S170 220 186 190';
export const BRIDGE: Pt = [147, 243];

export const DISTRICTS: Record<District, { t: string; poly: Pt[]; label: Pt; /** rough centre, for rivals' influence */ c: Pt }> = {
  // the castle hill with the monastery, north-west (the left of the panorama)
  hill: { t: 'Замковий пагорб', poly: [[14, 14], [105, 12], [112, 60], [98, 104], [52, 110], [14, 92]], label: [56, 22], c: [56, 60] },
  // the old town on the bay's north-western shore; the town hall stands on the water
  old: { t: 'Старе місто', poly: [[114, 14], [250, 14], [246, 54], [228, 74], [200, 86], [182, 98], [172, 122], [122, 126], [110, 82], [114, 40]], label: [182, 22], c: [170, 66] },
  market: { t: 'Ринок', poly: [[120, 132], [170, 128], [174, 150], [178, 172], [170, 196], [150, 214], [118, 210]], label: [144, 138], c: [146, 172] },
  podil: { t: 'Поділ', poly: [[14, 100], [52, 118], [100, 112], [114, 130], [114, 206], [100, 236], [14, 244]], label: [52, 126], c: [60, 178] },
  // the harbour on the bay's southern shore
  port: { t: 'Порт', poly: [[184, 204], [206, 206], [228, 212], [250, 218], [260, 240], [258, 260], [196, 260], [184, 234]], label: [226, 236], c: [222, 234] },
  // south of the river: the newer, working half
  zar: { t: 'Заріччя', poly: [[14, 270], [100, 266], [134, 262], [132, 300], [130, 350], [14, 352]], label: [62, 278], c: [64, 310] },
  station: { t: 'Вокзал', poly: [[140, 264], [164, 244], [182, 246], [190, 270], [192, 302], [138, 304]], label: [166, 262], c: [166, 282] },
  univ: { t: 'Університет', poly: [[136, 310], [192, 308], [196, 352], [134, 354]], label: [166, 316], c: [166, 332] },
  sloboda: { t: 'Заводи', poly: [[198, 268], [258, 266], [262, 300], [266, 352], [202, 354]], label: [232, 274], c: [232, 310] }
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
// Each painted place on the map (src/ui/scene/mapLayout.ts DECOR, HOMES, OUR_HOME; INSTS in city.ts) stands in the
// middle of its own clearing: keep these centres equal to those base points when a place moves.
export const CLEARINGS: [number, number, number, number][] = [
  [170, 111, 12, 6], // the town hall on its square by the water
  [150, 183, 16, 8], // the market hall on the market square
  [122, 157, 12, 6], // the opera
  [165, 291, 17, 7], // the station and its square
  [165, 345, 15, 6], // the university in its garden
  [200, 49, 10, 6], // the cathedral yard
  [216, 221, 11, 5], // the customs house on the quay
  [230, 317, 14, 6], // the works yard
  [48, 151, 11, 6], // the orphanage
  [88, 95, 12, 7], // the gendarmerie rock
  [132, 61, 9, 5], // the newspaper
  [164, 59, 9, 5], // our house
  [228, 39, 10, 5], // the Solonars
  [124, 33, 7, 4], // the Bergs
  [50, 51, 10, 6], // the castle
  [80, 30, 7, 5], // the monastery
  [40, 205, 6, 5], // Podil green
  [60, 312, 5, 4] // Zarichchia church
];

/** main avenues, drawn over the blocks */
export const ROADS: string[] = [
  'M50 54 C70 72 95 80 120 76 L165 70 L200 60 L238 46', // castle road → old town → the north headland
  'M150 14 L150 70 L162 106 L150 150 L148 190 L146 228 L147 250', // Ratushna avenue, north to the bridge
  'M147 250 L162 272 L165 300 L165 354', // the avenue goes on south over the bridge
  'M56 176 L118 178 L148 178 L176 172', // market street to the bay
  'M238 62 C214 84 192 94 182 112 C174 132 174 160 182 184', // the bay quay
  'M18 132 C45 142 75 134 114 140', // Podil lane
  'M70 104 L106 128 L125 150', // down from the hill to the opera
  'M190 214 L212 222 L254 232', // harbour road
  'M14 292 C50 298 90 290 136 292 L196 290 L260 286', // south cross street
  'M60 272 L62 310 L60 350', // Zarichchia spine
  'M262 246 L262 300 L266 350', // south shore road
  'M136 330 L194 330' // university row
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
    for (let u = -100; u < 100; u += bw + cf.street) {
      for (let v = -100; v < 100; v += bh + cf.street) {
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
