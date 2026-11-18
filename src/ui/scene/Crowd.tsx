// The townsfolk of the panorama. An SVG laid exactly over the painting (1600 x 900 user units = the picture's pixels)
// in which every person walks a route on the painted ground (crowdMap.ts), grows and shrinks with the depth of the
// picture, goes behind the monument, the carriages and the lamp posts (those are cut out of the painting and drawn
// over whoever is further away), and takes the light of the hour: night thinning into a warm dawn in the morning,
// dusk sinking into blue night in the evening, a long shadow away from the low sun, a soft pool at night. Street
// lamps (drawn above the crowd with a screen blend by the panorama) light up whoever passes under them.
//
// One frame loop moves everyone. A walker is one side-view drawing split at the hip: the legs swing like scissors
// (a skew around the hip line), the body rises twice a stride and rolls a little, and the figure turns to face the way
// it goes. Vehicles roll with a slight judder; people who stand only breathe and sway.
import { useEffect, useMemo, useRef } from 'react';
import { CROWD, type Occ, type Pt, type Route, type Zone } from './crowdMap';
import CYCLES from './walkCycles.json';

/** drawn walk cycles (public/art/life/walk/<id>.webp): six phases side by side; ax = where the head is, 0..1 of a frame */
const CYC = CYCLES as Record<string, { n: number; fw: number; fh: number; ax: number }>;

/** width / height of each sprite (public/art/life) */
export const SPR: Record<string, number> = { 'i-beggar': 0.875, 'i-chestnut': 0.719, 'i-couple': 0.594, 'i-gossip': 0.896, 'i-guard': 0.292, 'i-kiosk': 0.646, 'i-rest': 1.25, 'i-talk': 0.667, 'v-barrels': 2.679, 'v-fiacre': 2.238, 'v-landau': 2.571, 'v-milk': 2.464, 'v-tram': 2.5, 'w-barrow': 1.031, 'w-docker': 0.562, 'w-fishwife': 0.51, 'w-flowergirl': 0.542, 'w-gendarme': 0.552, 'w-lady': 0.521, 'w-lamplighter': 0.771, 'w-merchant': 0.521, 'w-nanny': 1.062, 'w-oldman': 0.552, 'w-paperboy': 0.573, 'w-porter': 0.646, 'w-priest': 0.573, 'w-reader': 0.573, 'w-sailor': 0.594, 'w-student': 0.531, 'w-sweep': 0.573, 'w-washer': 0.583, 'w-worker': 0.583, 'w-yoke': 0.667 , 'w2-soldier': 0.486, 'w2-sailor': 0.531, 'w2-worker': 0.547, 'w2-woman': 0.525, 'w2-commissar': 0.547, 'w2-trader': 0.525, 'w2-newsboy': 0.589, 'w2-student': 0.522, 'w2-militia': 0.533, 'w2-invalid': 0.525, 'w2-girl': 0.553, 'w2-granny': 0.561, 'v2-lorry': 1.9, 'v2-car': 2.032, 'v2-cart': 2.075, 'i2-queue': 1.222, 'i2-agitator': 1.006, 'i2-kitchen': 1.219, 'b-row': 2.639, 'b-sail': 1.453, 'b-launch': 2.342, 'b-barge': 2.927 };
/** how tall a sprite is relative to one standing person */
const SIZE = (id: string) => (id === 'a-dog' ? 0.42 : id === 'a-pigeon' ? 0.15 : id === 'w-hoop' ? 0.78 : id[0] === 'b' ? (id === 'b-sail' ? 2 : 1.1) : id[0] === 'v' ? 1.3 : id === 'i-rest' ? 0.75 : id.startsWith('i2-') ? 1.05 : 1);
const aspect = (id: string) => (CYC[id] ? CYC[id].fw / CYC[id].fh : SPR[id] || 0.6);

export type Pools = Record<Zone, string[]> & { idle: Partial<Record<Zone, string[]>> };
type Kind = 'walk' | 'ride' | 'stand' | 'boat';
interface Agent {
  id: string; kind: Kind; route?: Route; len?: number; cum?: number[]; s: number; dir: 1 | -1; k: number; f: number; ph: number;
  x: number; y: number; h: number; lantern?: 'hand' | 'pole' | 'cab'; start?: number; dur?: number; once?: boolean;
  /** distance walked (drives the drawn walk cycle) and a pause: [from, to] seconds when the walker stops for a while */
  walked: number; pause?: [number, number];
  /** the passer-by this one has stopped to talk to, and whether this one has already had a chat on this walk */
  talk?: Agent; met?: boolean; door?: boolean; pigeon?: boolean;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const rnd = (seed: number) => { let a = seed; return () => ((a = (a * 16807) % 2147483647) / 2147483647); };
const segs = (pts: Pt[]) => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return cum; };
function at(r: Route, cum: number[], s: number): { x: number; y: number; h: number; dx: number } {
  const L = cum[cum.length - 1]; s = Math.max(0, Math.min(L, s));
  let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const a = r.pts[i - 1], b = r.pts[i], t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, h: r.h[0] + (r.h[1] - r.h[0]) * (s / L), dx: b[0] - a[0] };
}

// colour of a figure in the hour's light (rows: r, g, b; columns: r, g, b) — warm dawn, warm dusk, blue night
const DAY = [1.03, 0.04, 0, 0.02, 0.96, 0.02, 0, 0.03, 0.84];
const DUSK = [0.92, 0.05, 0, 0.03, 0.74, 0.02, 0, 0.04, 0.62];
const NIGHT = [0.3, 0.06, 0.06, 0.05, 0.36, 0.1, 0.09, 0.12, 0.56];
const matrix = (a: number[], b: number[], t: number) => {
  const m = a.map((v, i) => v + (b[i] - v) * t);
  return `${m[0]} ${m[1]} ${m[2]} 0 0  ${m[3]} ${m[4]} ${m[5]} 0 0  ${m[6]} ${m[7]} ${m[8]} 0 0  0 0 0 1 0`;
};

/** one walk cycle (two steps) covers about this many body heights */
const CYCLE = 0.95;

export function Crowd({ era, evening, pools, under, over, overAnim, soft, lamplighterAt, reduced }: {
  era: 1 | 2; evening: boolean; pools: Pools; under: string; over: string; overAnim: string; soft: string; lamplighterAt?: [number, number]; reduced?: boolean;
}) {
  const map = CROWD[era];
  // everyone, decided once per panorama
  const agents = useMemo<Agent[]>(() => {
    const r = rnd(era * 97 + (evening ? 13 : 7)), out: Agent[] = [];
    map.routes.forEach((route, ri) => {
      const cum = segs(route.pts), len = cum[cum.length - 1];
      const pool = pools[route.zone]; if (!pool?.length) return;
      const n = route.zone === 'water' ? route.n : evening ? Math.max(1, Math.round(route.n * 0.75)) : Math.round(route.n * 1.4);
      for (let i = 0; i < n; i++) {
        const id = pool[Math.floor(r() * pool.length) % pool.length], ride = id[0] === 'v', boat = id[0] === 'b';
        // a quarter of the walkers stop once for a moment: to look around, to wait, to rest the load
        const ps = !ride && !boat && r() < 0.28 ? 0.6 + r() * 7 : -1;
        out.push({ id, kind: boat ? 'boat' : ride ? 'ride' : 'walk', route, len, cum, s: ((i + r() * 0.7) / n) * len, dir: boat ? (r() < 0.6 ? 1 : -1) : r() < 0.5 ? 1 : -1,
          k: boat ? 0.35 + r() * 0.25 : ride ? 1.5 + r() * 0.4 : 0.72 + r() * 0.2, f: boat ? 0.35 : ride ? 2.6 : 1.55 + r() * 0.35, ph: r() * 6.28, x: 0, y: 0, h: route.h[0], walked: r() * 50,
          pause: ps > 0 ? [ps, ps + 1.4 + r() * 2.2] : undefined,
          lantern: evening && (ride || boat) ? 'cab' : evening && route.zone === 'quay' && i === 0 ? 'hand' : undefined, door: route.door });
        void ri;
      }
    });
    map.spots.forEach((p) => {
      const pool = pools.idle[p.zone]; if (!pool?.length) return;
      const id = pool[Math.floor(r() * pool.length) % pool.length];
      if (evening && r() < 0.4) return;
      out.push({ id, kind: 'stand', s: 0, dir: r() < 0.3 ? -1 : 1, k: 0, f: 0.25 + r() * 0.15, ph: r() * 6.28, x: p.x, y: p.y, h: p.h, walked: 0 });
    });
    // a stray dog in the street and the square; by day a boy with a hoop, and pigeons pecking on the cobbles
    map.routes.filter((rt) => rt.zone === 'square' || rt.zone === 'street').forEach((route, i) => {
      const cum = segs(route.pts), len = cum[cum.length - 1];
      const add = (id: string, k: number) => out.push({ id, kind: 'walk', route, cum, len, s: r() * len, dir: r() < 0.5 ? 1 : -1, k, f: 1, ph: r() * 6.28, x: 0, y: 0, h: route.h[0], walked: r() * 9 });
      if (i === 1) add('a-dog', 1.5 + r() * 0.4);
      if (!evening && i === 3) add('w-hoop', 1.7);
    });
    if (!evening) map.pigeons.forEach(([px, py, ph]) => {
      for (let j = 0; j < 5; j++) {
        const yy = py + (r() - 0.5) * 6, x0 = px + (r() - 0.5) * 30, route: Route = { zone: 'square', pts: [[x0 - 9, yy], [x0 + 9, yy]], h: [ph, ph], n: 1 }, cum = segs(route.pts);
        out.push({ id: 'a-pigeon', kind: 'walk', route, cum, len: cum[1], s: r() * cum[1], dir: r() < 0.5 ? 1 : -1, k: 0.9, f: 1, ph: r() * 6.28, x: 0, y: 0, h: ph, walked: r() * 9, pigeon: true });
      }
    });
    if (lamplighterAt) {
      const l = map.lamplighter, route: Route = { zone: 'square', pts: [l.from, l.to], h: [l.h, l.h], n: 1 }, cum = segs(route.pts);
      out.push({ id: 'w-lamplighter', kind: 'walk', route, cum, len: cum[1], s: 0, dir: 1, k: 0, f: 1.4, ph: 0, x: l.from[0], y: l.from[1], h: l.h, lantern: 'pole', start: lamplighterAt[0], dur: lamplighterAt[1], once: true, walked: 0 });
    }
    return out;
  }, [era, evening, pools, map, lamplighterAt]);

  const frames = useRef<(SVGSVGElement | null)[]>([]), nexts = useRef<(SVGSVGElement | null)[]>([]), rframes = useRef<(SVGSVGElement | null)[]>([]), rnexts = useRef<(SVGSVGElement | null)[]>([]);
  const contacts = useRef<(SVGEllipseElement | null)[]>([]), refl = useRef<(SVGGElement | null)[]>([]), wakes = useRef<(SVGEllipseElement | null)[]>([]);
  const refs = useRef<(SVGGElement | null)[]>([]), legs = useRef<(SVGGElement | null)[]>([]), body = useRef<(SVGGElement | null)[]>([]);
  const shadows = useRef<(SVGEllipseElement | null)[]>([]), occRefs = useRef<(SVGGElement | null)[]>([]);
  const scene = useRef<SVGGElement>(null), cm = useRef<SVGFEColorMatrixElement>(null);

  useEffect(() => {
    let raf = 0, last = performance.now(), lastSort = 0;
    const t0 = last;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
      // the hour's light
      const d = evening ? 1 - smooth((t - 2.2) / 5.5) : smooth((t - 0.3) / 4.2);
      cm.current?.setAttribute('values', matrix(NIGHT, evening ? DUSK : DAY, d));
      agents.forEach((a, i) => {
        const g = refs.current[i]; if (!g) return;
        let x = a.x, y = a.y, h = a.h, face = a.dir, op = 1, moving = false;
        if (a.route && a.cum && a.len) {
          if (a.once) {
            const p = (t - a.start!) / a.dur!, s0 = a.s; a.s = Math.max(0, Math.min(1, p)) * a.len; a.walked += Math.abs(a.s - s0);
            op = p < 0 ? 0 : p > 1.02 ? 0 : 1; moving = p > 0 && p < 1;
          } else if (a.talk && a.pause && t < a.pause[1]) {
            // standing in a chat: face the other one
            face = (a.talk.x >= a.x ? 1 : -1) as 1 | -1;
          } else if (!reduced && !(a.pause && t > a.pause[0] && t < a.pause[1])) {
            if (a.pigeon && Math.random() < dt * 0.6) a.pause = [t, t + 0.4 + Math.random() * 1.2];
            const here = at(a.route, a.cum, a.s), step = a.k * here.h * dt;
            a.s += a.dir * step; a.walked += step; moving = true;
            // pigeons turn back at the ends of their patch; everyone else leaves and comes round again
            if (a.pigeon) { if (a.s > a.len) { a.s = a.len; a.dir = -1; } if (a.s < 0) { a.s = 0; a.dir = 1; } }
            else { if (a.s > a.len) a.s -= a.len; if (a.s < 0) a.s += a.len; }
          }
          const p = at(a.route, a.cum, a.s); x = p.x; y = p.y; h = p.h;
          if (!(a.talk && a.pause && t < a.pause[1])) face = (p.dx * (a.once ? 1 : a.dir) >= 0 ? 1 : -1) as 1 | -1;
          // fade in and out at the ends of the route (behind an obstacle, in a doorway, deep in the distance)
          if (!a.once && !a.pigeon) { const edge = Math.min(a.s, a.len - a.s); op = Math.min(1, edge / (a.door ? 6 : 14)); }
        }
        a.x = x; a.y = y;
        const hh = h * SIZE(a.id), sc = hh / 100, w = 100 * aspect(a.id), cyc = CYC[a.id];
        g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(sc * face).toFixed(4)} ${sc.toFixed(4)})`);
        g.style.opacity = String(op);
        const ph = a.ph + t * a.f * 6.2832;
        const b = body.current[i], l = legs.current[i];
        if (cyc && a.kind === 'walk') {
          // a drawn walk cycle: the frame follows the distance walked (one cycle = two steps ≈ 1.15 heights), so the
          // feet do not slide; standing still, the walker rests on the passing pose and only breathes
          // two neighbouring phases blend into each other, so six drawings read as a continuous step
          const pos = moving ? ((a.walked / (h * CYCLE)) * cyc.n) % cyc.n : a.pigeon ? 1 : 2, fr = Math.floor(pos), nx = (fr + 1) % cyc.n, mix = moving ? pos - fr : 0;
          const vb = `${fr * cyc.fw} 0 ${cyc.fw} ${cyc.fh}`, vn = `${nx * cyc.fw} 0 ${cyc.fw} ${cyc.fh}`;
          frames.current[i]?.setAttribute('viewBox', vb); rframes.current[i]?.setAttribute('viewBox', vb);
          const n1 = nexts.current[i], n2 = rnexts.current[i];
          if (n1) { n1.setAttribute('viewBox', vn); n1.style.opacity = mix.toFixed(3); }
          if (n2) { n2.setAttribute('viewBox', vn); n2.style.opacity = mix.toFixed(3); }
          // talking: a small nod and gesture; waiting: only breathing
          b?.setAttribute('transform', moving ? '' : a.talk ? `rotate(${(1.4 * Math.sin(ph * 0.9)).toFixed(2)} 0 0)` : `translate(0 ${(-0.4 * (1 + Math.sin(ph * 0.25))).toFixed(2)})`);
        } else if (a.kind === 'boat') {
          // a boat rocks on the swell; the wake trails behind the stern
          b?.setAttribute('transform', `rotate(${(1.6 * Math.sin(ph)).toFixed(2)} 0 -10) translate(0 ${(0.8 * Math.sin(ph * 1.3)).toFixed(2)})`);
          const wk = wakes.current[i]; if (wk) wk.style.opacity = moving ? String(0.35 + 0.15 * Math.sin(ph * 2)) : '0';
        } else if (a.kind === 'walk' && moving) {
          // the body rises at each step (twice a stride) and rolls a little; the legs swing around the hip
          const lift = -2.6 * Math.pow(Math.abs(Math.sin(ph)), 1.4), roll = 1.1 * Math.sin(ph * 2);
          b?.setAttribute('transform', `translate(0 ${lift.toFixed(2)}) rotate(${(roll + 2).toFixed(2)} 0 -44)`);
          l?.setAttribute('transform', `translate(0 -44) skewX(${(13 * Math.sin(ph)).toFixed(2)}) translate(0 44)`);
        } else if (a.kind === 'ride') {
          b?.setAttribute('transform', `translate(0 ${(-0.7 * Math.abs(Math.sin(ph * 2))).toFixed(2)})`);
        } else {
          b?.setAttribute('transform', `rotate(${(0.8 * Math.sin(ph)).toFixed(2)} 0 0) translate(0 ${(-0.5 * (1 + Math.sin(ph * 0.7))).toFixed(2)})`);
          l?.setAttribute('transform', '');
        }
        // the shadow: long and away from the low sun by day, a small pool by night
        const sh = shadows.current[i];
        if (sh) {
          const len = (evening ? 0.35 : 0.55) * d + 0.12, half = Math.min(w, 70) * sc * 0.5;
          sh.setAttribute('cx', (x - hh * len * 0.9 * (a.kind === 'ride' ? 0.4 : 1)).toFixed(2));
          sh.setAttribute('cy', (y + 0.4).toFixed(2));
          sh.setAttribute('rx', Math.max(half, hh * len).toFixed(2));
          sh.setAttribute('ry', Math.max(0.8, hh * 0.07).toFixed(2));
          sh.style.opacity = a.kind === 'boat' ? '0' : String(op * (0.22 + 0.2 * d));
        }
        // the dark where the feet touch the ground, and the figure mirrored in the wet cobbles (or the water)
        const ct = contacts.current[i];
        if (ct) {
          ct.setAttribute('cx', x.toFixed(2)); ct.setAttribute('cy', (y + 0.2).toFixed(2));
          ct.setAttribute('rx', (Math.min(w, 60) * sc * 0.32).toFixed(2)); ct.setAttribute('ry', Math.max(0.5, hh * 0.03).toFixed(2));
          ct.style.opacity = a.kind === 'boat' ? '0' : String(op * 0.55);
        }
        const rf = refl.current[i];
        if (rf) rf.style.opacity = String((a.kind === 'boat' ? 0.3 : 0.17 + 0.08 * (1 - d)) * op);
        void w;
      });
      // depth: whoever stands further (smaller y) is drawn first; obstacles take their place by their base line
      if (now - lastSort > 120 && scene.current) {
        lastSort = now;
        // passers-by who meet face to face on the same route stop for a short chat now and then
        for (let i = 0; i < agents.length; i++) {
          const a = agents[i]; if (a.kind !== 'walk' || a.met || a.pigeon || a.once || !CYC[a.id] || a.id[0] === 'a' || a.id === 'w-hoop' || (a.pause && t < a.pause[1])) continue;
          for (let j = i + 1; j < agents.length; j++) {
            const b = agents[j];
            if (b.route !== a.route || b.met || b.dir === a.dir || b.pigeon || !CYC[b.id] || b.id[0] === 'a' || b.id === 'w-hoop' || (b.pause && t < b.pause[1])) continue;
            const gap = Math.abs(a.x - b.x), h = (a.h + b.h) / 2;
            if (gap < h * 0.55 && gap > h * 0.3 && Math.random() < 0.6) {
              const until = t + 2.2 + Math.random() * 1.8; a.talk = b; b.talk = a; a.met = b.met = true; a.pause = b.pause = [t, until];
            } else if (gap < h * 0.3) { a.met = b.met = true; }
          }
        }
        const items: { el: Element; z: number }[] = [];
        agents.forEach((a, i) => { const el = refs.current[i]; if (el) items.push({ el, z: a.y }); });
        map.occ.forEach((o, i) => { const el = occRefs.current[i]; if (el) items.push({ el, z: o.base }); });
        items.sort((p, q) => p.z - q.z);
        const kids = scene.current.children;
        let same = kids.length === items.length;
        for (let i = 0; same && i < items.length; i++) if (kids[i] !== items[i].el) same = false;
        if (!same) items.forEach((it) => scene.current!.appendChild(it.el));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [agents, evening, map, reduced]);

  const poly = (o: Occ) => o.pts.map((p) => p.join(',')).join(' ');
  return (
    <svg aria-hidden="true" viewBox="0 0 1600 900" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
      <defs>
        <clipPath id="cr-top" clipPathUnits="userSpaceOnUse"><rect x="-300" y="-140" width="600" height="96" /></clipPath>
        <clipPath id="cr-leg" clipPathUnits="userSpaceOnUse"><rect x="-300" y="-46" width="600" height="56" /></clipPath>
        {map.occ.map((o, i) => <clipPath key={i} id={`cr-o${era}-${i}`} clipPathUnits="userSpaceOnUse"><polygon points={poly(o)} /></clipPath>)}
        {/* the hour's light, the painting's softness and its tone (Era I warm and soft, Era II dark and contrasty) */}
        <filter id="cr-light" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix ref={cm} type="matrix" values={matrix(NIGHT, evening ? DUSK : DAY, evening ? 1 : 0)} />
          <feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent={era === 2 ? 1.3 : 1.08} offset="0" /><feFuncG type="gamma" amplitude="1" exponent={era === 2 ? 1.3 : 1.1} offset="0" /><feFuncB type="gamma" amplitude="1" exponent={era === 2 ? 1.3 : 1.14} offset="0" /></feComponentTransfer>
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
        <filter id="cr-refl" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="2.6 1.4" /></filter>
        <linearGradient id="cr-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="cr-rmask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"><rect x="-400" y="0" width="800" height="62" fill="url(#cr-fade)" /></mask>
        <radialGradient id="cr-shadow"><stop offset="0" stopColor="#140c04" stopOpacity=".9" /><stop offset="1" stopColor="#140c04" stopOpacity="0" /></radialGradient>
        <radialGradient id="cr-glow"><stop offset="0" stopColor="#FFEAB0" /><stop offset=".3" stopColor="#FFC86E" stopOpacity=".55" /><stop offset="1" stopColor="#FFC86E" stopOpacity="0" /></radialGradient>
      </defs>
      <g>{agents.map((_, i) => <ellipse key={i} ref={(el) => { shadows.current[i] = el; }} fill="url(#cr-shadow)" />)}</g>
      <g>{agents.map((_, i) => <ellipse key={i} ref={(el) => { contacts.current[i] = el; }} fill="#120a03" style={{ filter: 'blur(0.6px)' }} />)}</g>
      <g ref={scene}>
        {agents.map((a, i) => {
          const w = 100 * aspect(a.id), src = `art/life/${a.id}.webp`, cyc = a.kind === 'walk' ? CYC[a.id] : undefined;
          const img = <image href={src} x={-w / 2} y={-100} width={w} height={100} preserveAspectRatio="none" />;
          const strip = cyc && <image href={`art/life/walk/${a.id}.webp`} x="0" y="0" width={cyc.fw * cyc.n} height={cyc.fh} preserveAspectRatio="none" />;
          const frame = (ref: (el: SVGSVGElement | null) => void, k: number) => cyc && <svg ref={ref} x={-w * cyc.ax} y={-100} width={w} height={100} viewBox={`${k * cyc.fw} 0 ${cyc.fw} ${cyc.fh}`} preserveAspectRatio="none" overflow="hidden" style={{ opacity: k === 3 ? 0 : 1 }}>{strip}</svg>;
          const look = cyc ? <>{frame((el) => { frames.current[i] = el; }, 2)}{frame((el) => { nexts.current[i] = el; }, 3)}</> : img;
          return (
            <g key={'a' + i} ref={(el) => { refs.current[i] = el; }} style={{ opacity: 0 }}>
              {/* the reflection in the wet ground: the figure upside down under its feet, fading away */}
              <g ref={(el) => { refl.current[i] = el; }} mask="url(#cr-rmask)" style={{ opacity: 0 }}>
                <g transform="scale(1 -1)" filter="url(#cr-refl)">
                  <g filter="url(#cr-light)">{cyc ? <>{frame((el) => { rframes.current[i] = el; }, 2)}{frame((el) => { rnexts.current[i] = el; }, 3)}</> : img}</g>
                </g>
              </g>
              <g filter="url(#cr-light)">
                {cyc
                  ? <g ref={(el) => { body.current[i] = el; }}>{look}</g>
                  : a.kind === 'walk'
                  ? <g ref={(el) => { body.current[i] = el; }}>
                      <g clipPath="url(#cr-top)">{img}</g>
                      <g clipPath="url(#cr-leg)"><g ref={(el) => { legs.current[i] = el; }}>{img}</g></g>
                    </g>
                  : <g ref={(el) => { body.current[i] = el; }}>{img}</g>}
              </g>
              {a.kind === 'boat' && <ellipse ref={(el) => { wakes.current[i] = el; }} cx={-w * 0.62} cy={-2} rx={w * 0.35} ry={3} fill="#F4EEDD" style={{ mixBlendMode: 'screen', opacity: 0 }} />}
              {a.lantern && <circle cx={a.lantern === 'pole' ? w * 0.42 : a.lantern === 'cab' ? w * 0.05 : w * 0.32} cy={a.lantern === 'pole' ? -98 : a.lantern === 'cab' ? -62 : -42} r={a.lantern === 'pole' ? 34 : 26} fill="url(#cr-glow)" style={{ mixBlendMode: 'screen' }} />}
            </g>
          );
        })}
        {map.occ.map((_, i) => (
          <g key={'o' + i} ref={(el) => { occRefs.current[i] = el; }} clipPath={`url(#cr-o${era}-${i})`} style={{ filter: soft }}>
            <image href={under} x="0" y="0" width="1600" height="900" preserveAspectRatio="none" />
            <image href={over} x="0" y="0" width="1600" height="900" preserveAspectRatio="none" style={{ animation: overAnim, opacity: evening ? 0 : 1 }} />
          </g>
        ))}
      </g>
    </svg>
  );
}
