// The printed plan of Port-Aurum under the interactive pins. One geography (src/engine/cityplan.ts: the castle hill
// north-west, the old town on the bay with the town hall on the water, the market square and the opera, the harbour
// on the bay's south shore, the lighthouse on its island, the river with its stone bridge, the new districts south),
// drawn in the hand of its era:
//   Era I  — an engraved and hand-tinted plan: every ordinary house a small block seen from above and the south, its
//            hipped roof hatched, its front wall pricked with windows, all in quiet tones so the painted places and
//            the shops stand out without shouting; the bay shaded along the shore, sailing ships at anchor.
//   Era II — a municipal survey of the 1920s (look.style 'plan'): flat tints per district, black outlines, industrial
//            hatching, sans-serif lettering, a lettered grid for finding addresses, steamers in the harbour.
import { memo } from 'react';
import * as G from '../../engine';
import type { PlanLook } from '../skin';
import { DECOR, SHEET } from './mapLayout';

const INK = '#2A2014', PAPER = '#E8DBB8', ROAD = '#F0E6C6';
const f = (n: number) => n.toFixed(2);
const polyD = (p: G.Pt[]) => 'M' + p.map((q) => q.join(' ')).join(' L') + ' Z';
const W = G.PLAN_W, H = G.PLAN_H;
/** the cobbled squares lie exactly under the buildings that stand on them, so every building sits in its own place */
const pad = (x: number, y: number, w: number): [number, number, number, number] => [x, y - 0.6, w * 0.82, w * 0.36];
const placeOf = (art: string) => DECOR.find((p) => p.art === art)!;
const UNIV = G.INSTS.find((i) => i.id === 'univ')!;
const SQUARES = [
  pad(placeOf('ratusha').x, placeOf('ratusha').y, 15), pad(placeOf('opera').x, placeOf('opera').y, 15), pad(placeOf('station').x, placeOf('station').y, 22),
  ...G.INSTS.filter((i) => i.id === 'whisper').map((i) => pad(i.x, i.y, 21))
];

// Ordinary houses, precomputed once into a handful of paths (thousands of houses, so no per-house elements).
// Engraved: the roof is lifted by the height of the walls and the front wall (the side facing south, towards the
// viewer) hangs below it; the roof is hipped, its sunlit slope lighter. Survey: the bare footprint.
const WALL = 1.15;
const HOUSES = (() => {
  const plan = G.getPlan();
  const front: string[] = [], roofs: string[][] = [[], [], []], ridge: string[] = [], lit: string[] = [], foot: string[] = [];
  plan.bldgs.forEach((b, i) => {
    const a = (b.r * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const Q = (u: number, v: number, dy = 0): G.Pt => [b.x + u * ca - v * sa, b.y + u * sa + v * ca + dy];
    const S = (p: G.Pt) => `${f(p[0])} ${f(p[1])}`;
    const hw = b.w / 2, hh = b.h / 2;
    const corners = [Q(-hw, -hh), Q(hw, -hh), Q(hw, hh), Q(-hw, hh)];
    foot.push(`M${corners.map(S).join('L')}Z`);
    // the front wall: the lowest edge of the footprint, from the roof line down to the ground
    const idx = [0, 1, 2, 3].sort((p, q) => corners[q][1] - corners[p][1]).slice(0, 2).sort((p, q) => corners[p][0] - corners[q][0]);
    const [l, r] = idx.map((k) => corners[k]);
    front.push(`M${S([l[0], l[1] - WALL])}L${S([r[0], r[1] - WALL])}L${S(r)}L${S(l)}Z`);
    const up = (p: G.Pt): G.Pt => [p[0], p[1] - WALL];
    roofs[(i * 7 + (b.k || 0)) % 3].push(`M${corners.map((p) => S(up(p))).join('L')}Z`);
    const long = b.w >= b.h, L = long ? hw : hh, Sx = long ? hh : hw, rr = Math.max(0, L - Sx);
    const R1 = up(long ? Q(-rr, 0) : Q(0, -rr)), R2 = up(long ? Q(rr, 0) : Q(0, rr));
    const c = (long ? [Q(-hw, -hh), Q(-hw, hh), Q(hw, -hh), Q(hw, hh)] : [Q(-hw, -hh), Q(hw, -hh), Q(-hw, hh), Q(hw, hh)]).map(up);
    ridge.push(`M${S(R1)}L${S(R2)}M${S(c[0])}L${S(R1)}L${S(c[1])}M${S(c[2])}L${S(R2)}L${S(c[3])}`);
    lit.push(long ? `M${S(up(Q(-hw, -hh)))}L${S(up(Q(hw, -hh)))}L${S(R2)}L${S(R1)}Z` : `M${S(up(Q(-hw, -hh)))}L${S(up(Q(-hw, hh)))}L${S(R2)}L${S(R1)}Z`);
  });
  return { front: front.join(''), roofs: roofs.map((r) => r.join('')), ridge: ridge.join(''), lit: lit.join(''), foot: foot.join('') };
})();
const SEA = `M${G.COAST.map((p) => p.join(' ')).join(' L')} L${W + 4} ${H + 4} L${W + 4} -4 Z`;
const COASTLINE = `M${G.COAST.map((p) => p.join(' ')).join(' L')}`;

const STEAMER = (x: number, y: number, s: number, ink: string, flip = false) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} stroke={ink} strokeWidth=".25" strokeLinejoin="round">
    <path d="M-4.5 0 L4.5 0 L3.6 1.6 L-3.6 1.6 Z" fill="#4A4440" />
    <rect x="-3" y="-1.4" width="5.4" height="1.4" fill="#E9E2CC" />
    <rect x="-.6" y="-3.6" width="1.3" height="2.2" fill="#8E2A1F" />
    <path d="M.1 -3.8 q1.5 -1.2 3.4 -.8 q1.6 .3 3 -.6" fill="none" stroke="#7A7468" strokeWidth=".45" strokeLinecap="round" opacity=".6" />
  </g>
);
const SHIP = (x: number, y: number, s = 1, flip = false) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} stroke={INK} strokeWidth=".25" strokeLinejoin="round">
    <path d="M-4 0 L4 0 L3 1.6 L-3 1.6 Z" fill="#6B5A3C" />
    <path d="M0 0 V-6.5 M-2.2 0 V-4.6 M2.2 0 V-4.2" fill="none" />
    <path d="M.4 -6 L3.4 -.6 L.4 -.6 Z M-.4 -6 L-3 -1 L-.4 -1 Z" fill="#F4ECD2" />
    <path d="M2.6 -4 L4.4 -.6 L2.6 -.6 Z M-2.6 -4.2 L-4 -1 L-2.6 -1 Z" fill="#F4ECD2" />
  </g>
);
/** where ships ride: at anchor in the bay and out at sea */
const ANCHOR: [number, number, number, boolean][] = [[214, 140, 1, false], [228, 118, 0.9, true], [204, 172, 0.85, false], [236, 168, 1, true], [288, 60, 1, false], [292, 238, 0.9, true], [284, 300, 1, false], [290, 110, 0.8, true]];
/** piers of the harbour (from the south shore into the bay) and the landing stage under the town hall */
const PIERS: [number, number, number, number][] = [[198, 190, 3, 12], [212, 194, 3, 13], [226, 198, 3, 13], [240, 203, 3, 12], [182, 104, 8, 2.4]];

const Label = ({ x, y, t, size = 2.1, italic = true, rot = 0, font = 'Old Standard TT, serif', ink = INK, paper = PAPER, spacing = 0 }: { x: number; y: number; t: string; size?: number; italic?: boolean; rot?: number; font?: string; ink?: string; paper?: string; spacing?: number }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={font} fontSize={size} letterSpacing={spacing} fontStyle={italic && !font.includes('PT Sans') ? 'italic' : 'normal'} fill={ink} stroke={paper} strokeWidth=".6" paintOrder="stroke" transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{t}</text>
);

function PlanArtInner({ look }: { look: PlanLook }) {
  const ink = look.ink, paper = look.paper, survey = look.style === 'plan';
  const Lbl = (p: Parameters<typeof Label>[0]) => <Label {...p} font={look.font} ink={ink} paper={paper} />;
  const oldRing = polyD(G.DISTRICTS.old.poly);
  const engraved: Record<string, string> = { hill: '#DCD6B2', old: '#E6D7B6', market: '#E6D7B6', podil: '#E3D4B2', port: '#DED6BE', zar: '#E3D4B2', station: '#DED6BE', univ: '#E0D9B8', sloboda: '#DAD2BC' };
  const tint: Record<string, string> = { hill: '#D9DCC0', old: '#ECDDC2', market: '#EFDCC4', podil: '#E7DCC6', port: '#D5D7D0', zar: '#E7DCC6', station: '#DADAD2', univ: '#DFE2CF', sloboda: '#D2CECA' };
  const works = new Set(['port', 'station', 'sloboda']);
  const water = survey ? '#C3D5DB' : '#CFD8D2', waterInk = survey ? '#2F4D5E' : '#3E5A70';
  const cols = 'АБВГДЕЖ'.split(''), step = 50;
  return (
    <>
      <defs>
        <pattern id="pa-water" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><path d="M0 .8 H1.6" stroke={waterInk} strokeWidth=".18" /></pattern>
        <pattern id="pa-wl" width="2.2" height="2.2" patternUnits="userSpaceOnUse"><path d="M0 1.1 H2.2" stroke={waterInk} strokeWidth=".12" /></pattern>
        <pattern id="pa-roof" width=".8" height=".8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 .4 H.8" stroke="#6A5A3A" strokeWidth=".2" /></pattern>
        <pattern id="pa-hatch" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 .7 H1.4" stroke="#5A4A30" strokeWidth=".12" strokeOpacity=".55" /></pattern>
        <pattern id="pa-ind" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 1 H2" stroke="#2A2A2A" strokeWidth=".16" strokeOpacity=".5" /></pattern>
        <pattern id="pa-win" width=".9" height="1.15" patternUnits="userSpaceOnUse" y="-.35"><rect x=".25" y=".3" width=".32" height=".42" fill="#3A2A14" fillOpacity=".32" /></pattern>
        <pattern id="pa-park" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><circle cx=".8" cy=".8" r=".5" fill="#6F8A55" fillOpacity=".75" /><circle cx=".8" cy=".8" r=".5" fill="none" stroke="#3E5A2C" strokeWidth=".1" /></pattern>
        <pattern id="pa-cobble" width="1" height="1" patternUnits="userSpaceOnUse"><circle cx=".3" cy=".3" r=".08" fill="#8A7A58" /><circle cx=".8" cy=".8" r=".08" fill="#8A7A58" /></pattern>
        <filter id="pa-paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .1  0 0 0 .13 0" /></filter>
        <radialGradient id="pa-stain" cx=".5" cy=".5" r=".5"><stop offset=".78" stopColor="#8A6A30" stopOpacity="0" /><stop offset=".9" stopColor="#8A6A30" stopOpacity=".3" /><stop offset="1" stopColor="#8A6A30" stopOpacity="0" /></radialGradient>
        <clipPath id="pa-sea"><path d={SEA} /></clipPath>
      </defs>
      <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill={paper} />
      <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} filter="url(#pa-paper)" opacity={survey ? 0.5 : 1} />

      {/* districts: an engraved wash, or a flat survey tint with hatching for the works */}
      {(Object.keys(G.DISTRICTS) as G.District[]).map((k) => (
        <g key={k}>
          <path d={polyD(G.DISTRICTS[k].poly)} fill={survey ? tint[k] : engraved[k]} fillOpacity={survey ? 1 : 0.75} stroke={survey ? ink : '#7A6A48'} strokeWidth={survey ? 0.3 : 0.25} strokeDasharray={survey ? '2 .6 .4 .6' : '.6 .5'} />
          {survey && works.has(k) && <path d={polyD(G.DISTRICTS[k].poly)} fill="url(#pa-ind)" />}
        </g>
      ))}

      {/* the sea and the bay; the shore shaded in long engraved strokes, or a flat ruled survey sea */}
      <path d={SEA} fill={water} />
      <path d={SEA} fill={survey ? 'url(#pa-wl)' : 'url(#pa-water)'} />
      {!survey && <g clipPath="url(#pa-sea)"><path d={COASTLINE} fill="none" stroke={waterInk} strokeWidth="7" strokeOpacity=".12" /><path d={COASTLINE} fill="none" stroke={waterInk} strokeWidth="3" strokeOpacity=".16" /></g>}
      <path d={COASTLINE} fill="none" stroke={waterInk} strokeWidth={survey ? 0.45 : 0.55} />
      {/* the lighthouse island */}
      <ellipse cx={G.ISLAND[0]} cy={G.ISLAND[1] + 1} rx="9" ry="5" fill={survey ? '#D8D0BC' : '#D9C79B'} stroke={waterInk} strokeWidth=".4" />
      {!survey && <ellipse cx={G.ISLAND[0]} cy={G.ISLAND[1] + 1} rx="9" ry="5" fill="url(#pa-hatch)" />}

      {/* the river and the stone bridge */}
      <path d={G.RIVER} fill="none" stroke={waterInk} strokeWidth="6.4" opacity={survey ? 0.9 : 0.35} />
      <path d={G.RIVER} fill="none" stroke={water} strokeWidth="5.4" />
      <path d={G.RIVER} fill="none" stroke={survey ? 'url(#pa-wl)' : 'url(#pa-water)'} strokeWidth="5.4" />
      <g transform={`translate(${G.BRIDGE[0]} ${G.BRIDGE[1]}) rotate(-38)`}>
        <rect x="-2.2" y="-5" width="4.4" height="10" fill={survey ? '#2A2A2A' : '#CDBD90'} stroke={ink} strokeWidth=".35" />
        {!survey && [-3, 0, 3].map((y) => <path key={y} d={`M-2.2 ${y} h4.4`} stroke={ink} strokeWidth=".2" />)}
      </g>

      {/* piers and the quay */}
      {PIERS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={survey ? '#B9B5AA' : '#8C7A54'} stroke={ink} strokeWidth=".2" />)}
      {(look.steam ? ANCHOR.map(([x, y, s, fl], i) => <g key={i}>{STEAMER(x, y, s, ink, fl)}</g>) : ANCHOR.map(([x, y, s, fl], i) => <g key={i}>{SHIP(x, y, s, fl)}</g>))}
      {look.war && <g opacity=".85">{/* a steamer sunk at its berth */}<path d="M226 196 V190 M229 196 V191.5" stroke={ink} strokeWidth=".35" /><rect x="227" y="192.5" width="1.4" height="3.5" fill="#3A3430" /></g>}

      {/* the green ring where the old walls were; the castle hill */}
      <path d={oldRing} fill="none" stroke="#9DB07A" strokeOpacity={survey ? 0.3 : 0.5} strokeWidth="3" strokeLinejoin="round" />
      <path d={oldRing} fill="none" stroke="#4A6A38" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" strokeDasharray=".05 1.35" />
      {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="54" cy="56" rx={40 - i * 7.4} ry={36 - i * 6.6} fill="none" stroke={survey ? '#6A6A5A' : '#7A6A48'} strokeWidth=".22" strokeOpacity=".7" />)}
      {[[40, 205, 6, 5], [80, 30, 7, 5], [92, 56, 5, 4], [UNIV.x, UNIV.y - 0.6, 15, 6]].map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="url(#pa-park)" stroke="#4A6A38" strokeWidth=".2" opacity={survey ? 0.7 : 1} />)}

      {/* the houses */}
      {survey ? (
        <path d={HOUSES.foot} fill="#D9C9A6" stroke="#2A2A2A" strokeWidth=".12" strokeOpacity=".7" />
      ) : (
        <>
          <path d={HOUSES.front} fill="#C8B48C" />
          <path d={HOUSES.front} fill="url(#pa-win)" />
          <path d={HOUSES.front} fill="none" stroke="#7A6848" strokeWidth=".1" />
          {['#CDB592', '#C3AC8C', '#BEB6A2'].map((c, i) => <path key={i} d={HOUSES.roofs[i]} fill={c} stroke="#8A7854" strokeWidth=".12" strokeLinejoin="round" />)}
          <path d={HOUSES.lit} fill="#FFF8E4" fillOpacity=".3" />
          {HOUSES.roofs.map((d, i) => <path key={'h' + i} d={d} fill="url(#pa-hatch)" />)}
          <path d={HOUSES.ridge} fill="none" stroke="#7A6848" strokeWidth=".12" strokeOpacity=".9" />
        </>
      )}

      {/* rails: the station to the harbour and the works */}
      {['M178 284 C192 276 202 262 210 244', 'M190 298 L226 306'].map((d, i) => <g key={i}><path d={d} stroke={ink} strokeWidth="1.6" fill="none" strokeDasharray=".25 1.1" opacity=".7" /><path d={d} stroke={ink} strokeWidth=".3" fill="none" transform="translate(-.45 .3)" /><path d={d} stroke={ink} strokeWidth=".3" fill="none" transform="translate(.45 -.3)" /></g>)}
      {/* avenues, over the blocks */}
      {G.ROADS.map((d, i) => <g key={i}><path d={d} fill="none" stroke={survey ? ink : '#5A4A30'} strokeWidth={survey ? 1.9 : 1.7} strokeLinejoin="round" opacity={survey ? 0.85 : 0.65} /><path d={d} fill="none" stroke={survey ? '#F7F3E8' : ROAD} strokeWidth="1.2" strokeLinejoin="round" /></g>)}
      {/* squares */}
      {SQUARES.map(([x, y, rx, ry], i) => <g key={i}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill={survey ? '#F7F3E8' : ROAD} stroke={survey ? ink : '#5A4A30'} strokeWidth=".3" />{!survey && <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="url(#pa-cobble)" />}</g>)}

      {/* the civil war on the plan: barricades in red pencil at the bridge, the station and the harbour gate,
          burnt blocks hatched over in charcoal */}
      {look.war && <g style={{ pointerEvents: 'none' }}>
        {[[40, 180, 7], [232, 238, 6], [176, 290, 5], [62, 322, 5]].map(([x, y, r], i) => <g key={i}><ellipse cx={x} cy={y} rx={r} ry={r * 0.7} fill="#3A3430" fillOpacity=".45" /><ellipse cx={x} cy={y} rx={r} ry={r * 0.7} fill="url(#pa-roof)" opacity=".7" /></g>)}
        {['M140 236 l2 -1.4 l2 1.4 l2 -1.4 l2 1.4 l2 -1.4 l2 1.4', 'M147 256 l2 1.4 l2 -1.4 l2 1.4 l2 -1.4 l2 1.4 l2 -1.4', 'M156 286 l2 -1.3 l2 1.3 l2 -1.3 l2 1.3 l2 -1.3 l2 1.3', 'M186 212 l1.3 2 l-1.3 2 l1.3 2 l-1.3 2'].map((d, i) => <path key={i} d={d} fill="none" stroke="#8E2A1F" strokeWidth=".55" strokeLinejoin="round" />)}
      </g>}

      {/* the survey grid: lettered columns, numbered rows, for finding an address */}
      {survey && <g style={{ pointerEvents: 'none' }}>
        {Array.from({ length: Math.ceil(W / step) + 1 }, (_, i) => <path key={'x' + i} d={`M${i * step} -4 V${H + 4}`} stroke="#A3241C" strokeWidth=".18" strokeOpacity=".35" />)}
        {Array.from({ length: Math.ceil(H / step) + 1 }, (_, i) => <path key={'y' + i} d={`M-4 ${i * step} H${W + 4}`} stroke="#A3241C" strokeWidth=".18" strokeOpacity=".35" />)}
        {cols.slice(0, Math.ceil(W / step)).map((c, i) => <text key={c} x={i * step + step / 2} y="1.6" textAnchor="middle" fontSize="2.6" fontFamily={look.font} fontWeight={700} fill="#A3241C" fillOpacity=".7">{c}</text>)}
        {Array.from({ length: Math.ceil(H / step) }, (_, i) => <text key={i} x="-1.4" y={i * step + step / 2} textAnchor="middle" fontSize="2.6" fontFamily={look.font} fontWeight={700} fill="#A3241C" fillOpacity=".7">{i + 1}</text>)}
      </g>}

      {/* labels */}
      {(Object.keys(G.DISTRICTS) as G.District[]).map((k) => <Lbl key={k} x={G.DISTRICTS[k].label[0]} y={G.DISTRICTS[k].label[1]} t={(look.names[k] || G.DISTRICTS[k].t).toUpperCase()} size={survey ? 3.6 : 3.3} italic={false} spacing={survey ? 0.4 : 0} />)}
      <Lbl x={40} y={212.4} t="Сквер" size={1.9} />
      <Lbl x={G.BRIDGE[0] + 6} y={G.BRIDGE[1] + 9} t="Кам’яний міст" size={1.9} />
      <Lbl x={74} y={258} t="р. Аурумка" size={2.3} rot={-2} />
      <Label x={216} y={152} t={survey ? 'АУРУМСЬКА ЗАТОКА' : 'Аурумська затока'} size={survey ? 2.6 : 3} font={look.font} ink={waterInk} paper={water} spacing={survey ? 0.5 : 0.2} />
      <Label x={290} y={170} t={survey ? 'МОРЕ' : 'Море'} size={3.2} rot={90} font={look.font} ink={waterInk} paper={water} spacing={1} />
      <Lbl x={278} y={326} t="Заводська пристань" size={2} rot={90} />

      {/* compass, scale, cartouche */}
      <g transform={`translate(${W - 12} ${H - 12})`}><circle r="5" fill="none" stroke={ink} strokeWidth=".3" /><path d="M0 -4.8 L1.1 0 L0 4.8 L-1.1 0 Z" fill={ink} /><path d="M-4.8 0 L0 -1.1 L4.8 0 L0 1.1 Z" fill="none" stroke={ink} strokeWidth=".25" /><text y="-6.2" textAnchor="middle" fontSize="2" fontFamily={look.font} fill={ink}>{survey ? 'Пн' : 'Пн.'}</text></g>
      <g transform={`translate(12 ${H - 2})`}><path d="M0 0 H22 M0 -1 V1 M11 -.8 V.8 M22 -1 V1" stroke={ink} strokeWidth=".35" /><rect x="0" y="-.5" width="11" height="1" fill={ink} /><text x="11" y="3.4" textAnchor="middle" fontSize="2" fontFamily={look.font} fill={ink}>{survey ? '500 м' : '500 сажнів'}</text></g>
      <g transform={`translate(${W - 40} 4)`}>
        <rect width="38" height="10" fill={paper} fillOpacity=".85" stroke={ink} strokeWidth=".3" /><rect x=".7" y=".7" width="36.6" height="8.6" fill="none" stroke={ink} strokeWidth=".15" />
        <text x="19" y="5" textAnchor="middle" fontSize={survey ? 3 : 3.2} fontFamily={look.caps ? look.font : 'Ruslan Display, serif'} fontWeight={look.caps ? 700 : 400} letterSpacing={survey ? 0.4 : 0} fill={ink}>{look.title}</text>
        <text x="19" y="8" textAnchor="middle" fontSize={look.sub.length > 18 ? 1.4 : 1.8} fontFamily={look.font} fontStyle={look.caps ? 'normal' : 'italic'} fill={ink}>{look.sub}</text>
      </g>

      {/* the neat line: a double rule round the plan, the sheet's blank margin outside it */}
      <rect x="-4" y="-4" width={W + 8} height={H + 8} fill="none" stroke={ink} strokeWidth=".55" />
      <rect x="-5.6" y="-5.6" width={W + 11.2} height={H + 11.2} fill="none" stroke={ink} strokeWidth=".2" />
      {/* the folds the sheet came in, a coffee ring, aged edges */}
      <circle cx="44" cy="120" r="7" fill="url(#pa-stain)" opacity={survey ? 0.5 : 1} /><circle cx="210" cy="330" r="6" fill="url(#pa-stain)" opacity={survey ? 0.5 : 1} />
      {[W / 3, (2 * W) / 3].map((x) => <g key={x}><path d={`M${x} ${SHEET.y} V${SHEET.y + SHEET.h}`} stroke="#3A2A10" strokeOpacity=".2" strokeWidth=".18" /><path d={`M${x + 0.4} ${SHEET.y} V${SHEET.y + SHEET.h}`} stroke="#FFF6DC" strokeOpacity=".45" strokeWidth=".35" /></g>)}
      {[H / 3, (2 * H) / 3].map((y) => <g key={y}><path d={`M${SHEET.x} ${y} H${SHEET.x + SHEET.w}`} stroke="#3A2A10" strokeOpacity=".2" strokeWidth=".18" /><path d={`M${SHEET.x} ${y + 0.4} H${SHEET.x + SHEET.w}`} stroke="#FFF6DC" strokeOpacity=".45" strokeWidth=".35" /></g>)}
    </>
  );
}
export const PlanArt = memo(PlanArtInner);
