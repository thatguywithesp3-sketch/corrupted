// Where everything stands on the painted map, and the rule that nothing covers anything else.
// Painted places are fixed; each shop is drawn at its lot but nudged until its house, sign and name plate
// clear every painted place and every other shop, so each one stays a clean target for a thumb.
import * as G from '../../engine';

export const ASPECT: Record<string, number> = { ratusha: 1.33, gendarm: 0.9, orphanage: 0.88, press: 0.94, weisman: 0.96, berg: 1.88, graf: 1.0, grabs: 1.04, market: 0.66, station: 0.83, univ: 0.86, cathedral: 1.18, shop1: 1.27, shop2: 1.29, shop3: 1.28, shop4: 1.33, opera: 0.87, customs: 0.92, foundry: 0.81, lighthouse: 1.06 };
export type Place = { art: string; x: number; y: number; w: number; t?: string; inst?: G.InstId; rival?: string; home?: boolean };
// the geography follows the panorama: the castle hill north-west, the old town on the bay with the town hall on the
// water, the market square and the opera below it, the harbour on the bay's south shore, the lighthouse on its island
export const DECOR: Place[] = [
  { art: 'cathedral', x: 200, y: 50, w: 14, t: 'Собор' }, { art: 'ratusha', x: 170, y: 112, w: 14, t: 'Ратуша' },
  { art: 'opera', x: 122, y: 158, w: 15, t: 'Опера' },
  { art: 'customs', x: 216, y: 222, w: 15, t: 'Митниця' }, { art: 'lighthouse', x: 266, y: 152, w: 11 }, { art: 'station', x: 165, y: 292, w: 24, t: 'Вокзал' }
];
export const HOMES: Record<string, { x: number; y: number; art: string }> = { r1: { x: 228, y: 40, art: 'weisman' }, r2: { x: 124, y: 34, art: 'berg' }, r3: { x: 50, y: 52, art: 'graf' } };
export const OUR_HOME = { x: 164, y: 60, art: 'grabs' };
export const shopArt = (id: string) => 'shop' + (1 + ([...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 4));
export const spriteH = (art: string, w: number) => w * (ASPECT[art] || 1);

export const INST_W: Record<G.InstId, number> = { charity: 15, press: 12, whisper: 20, okhrana: 17, works: 19, univ: 21 };
export const HOME_W: Record<string, number> = { weisman: 14, berg: 8, graf: 13, grabs: 12 };

type Box = { l: number; r: number; t: number; b: number };
/** a shop stands on land: west of the coast and of the bay */
const onLand = (x: number, y: number) => {
  const c = G.COAST; for (let i = 1; i < c.length; i++) { const [x0, y0] = c[i - 1], [x1, y1] = c[i]; if (y >= y0 && y <= y1) return x < x0 + ((y - y0) / (y1 - y0 || 1)) * (x1 - x0) - 6; }
  return true;
};
/** a painted place: the sprite above its base point, the name plate under it */
const placeBox = (x: number, y: number, w: number, art: string, plate = 0): Box => ({ l: x - Math.max(w / 2, plate / 2), r: x + Math.max(w / 2, plate / 2), t: y - spriteH(art, w) * 0.94, b: y + 4.6 });
const plateW = (t?: string) => (t ? t.length * 1.32 + 2.4 : 0);
/** a shop: the sign above the roof, the house, the name plate */
const SHOP = { l: -5.2, r: 5.2, t: -13.6, b: 8.9 };
const shopBox = (x: number, y: number): Box => ({ l: x + SHOP.l, r: x + SHOP.r, t: y + SHOP.t, b: y + SHOP.b });

export const FIXED: Box[] = [
  ...DECOR.map((p) => placeBox(p.x, p.y, p.w, p.art, plateW(p.t))),
  placeBox(OUR_HOME.x, OUR_HOME.y, HOME_W.grabs, OUR_HOME.art, plateW('Ваш дім')),
  ...Object.values(HOMES).map((h) => placeBox(h.x, h.y, HOME_W[h.art], h.art, 18)),
  ...G.INSTS.map((i) => placeBox(i.x, i.y, INST_W[i.id], i.art, Math.max(16, INST_W[i.id] + 9)))
];

const GAP = 0.8;
function push(a: Box, b: Box): [number, number] | null {
  const ox = Math.min(a.r - b.l, b.r - a.l) + GAP, oy = Math.min(a.b - b.t, b.b - a.t) + GAP;
  if (ox <= GAP || oy <= GAP) return null;
  const ax = (a.l + a.r) / 2 - (b.l + b.r) / 2, ay = (a.t + a.b) / 2 - (b.t + b.b) / 2;
  return ox < oy ? [ox * (ax >= 0 ? 1 : -1), 0] : [0, oy * (ay >= 0 ? 1 : -1)];
}

/** shop id -> where it is drawn. Each shop takes the nearest free spot to its own lot (a spiral search),
 * clear of every painted place and of the shops already placed. Deterministic: the same shops always land
 * in the same places, and an older shop never moves when a new one opens (older ids are placed first). */
export function layoutShops(biz0: { id: string; x: number; y: number; lot?: number }[]): Record<string, { x: number; y: number }> {
  // a shop stands on its lot of the current plan (saves keep the lot number; the plan may have been redrawn since)
  const lots = G.getPlan().lots, biz = biz0.map((b) => (b.lot !== undefined && lots[b.lot] ? { ...b, x: lots[b.lot].x, y: lots[b.lot].y } : b));
  const order = [...biz].sort((a, b) => (a.id.length - b.id.length) || (a.id < b.id ? -1 : 1));
  const placed: Box[] = [], out: Record<string, { x: number; y: number }> = {};
  const free = (x: number, y: number) => { const me = shopBox(x, y); return x > 6 && x < G.PLAN_W - 6 && y > 16 && y < G.PLAN_H - 6 && onLand(x, y) && !FIXED.some((f) => push(me, f)) && !placed.some((f) => push(me, f)); };
  for (const b of order) {
    let at = { x: b.x, y: b.y };
    search: for (let r = 0; r <= 48; r += 1.5) {
      const steps = r === 0 ? 1 : Math.ceil((2 * Math.PI * r) / 1.5);
      for (let k = 0; k < steps; k++) {
        const a = (k / steps) * 2 * Math.PI, x = b.x + r * Math.cos(a), y = b.y + r * Math.sin(a) * 0.8;
        if (free(x, y)) { at = { x, y }; break search; }
      }
    }
    placed.push(shopBox(at.x, at.y)); out[b.id] = at;
  }
  return out;
}

/** overlaps left after layout (for tests and checks) */
export function overlaps(biz: { id: string; x: number; y: number }[]) {
  const at = layoutShops(biz), ids = Object.keys(at), out: string[] = [];
  ids.forEach((a, i) => {
    FIXED.forEach((f, k) => { if (push(shopBox(at[a].x, at[a].y), f)) out.push(`${a}~fixed${k}`); });
    ids.slice(i + 1).forEach((b) => { if (push(shopBox(at[a].x, at[a].y), shopBox(at[b].x, at[b].y))) out.push(`${a}~${b}`); });
  });
  FIXED.forEach((f, i) => FIXED.slice(i + 1).forEach((g, j) => { if (push(f, g)) out.push(`fixed${i}~fixed${i + 1 + j}`); }));
  return out;
}
