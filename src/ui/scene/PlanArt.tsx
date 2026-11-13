// The static engraving of Port-Aurum: ground washes, sea and river, ~2 000 little houses, avenues,
// landmarks, labels. Drawn once from the generated plan; the interactive pins sit on top of it.
import { memo } from 'react';
import * as G from '../../engine';

const INK = '#2A2014', PAPER = '#E8DBB8', ROAD = '#F0E6C6';

// Ordinary houses, precomputed once into a handful of paths (thousands of houses, so no per-house elements):
// the wall is the footprint pushed down-right (light from the upper left), the roof is hipped, its sunlit
// slope a touch lighter. Three muted roof tones: warm tile, faded tile, slate.
const ROOF_TONES = ['#D9C39C', '#D0B58E', '#C8C0A8'];
const HOUSES = (() => {
  const plan = G.getPlan();
  const wall: string[] = [], roofs: string[][] = [[], [], []], ridge: string[] = [], lit: string[] = [];
  const f = (n: number) => n.toFixed(2);
  plan.bldgs.forEach((b, i) => {
    const a = (b.r * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const P = (u: number, v: number, dx = 0, dy = 0) => `${f(b.x + u * ca - v * sa + dx)} ${f(b.y + u * sa + v * ca + dy)}`;
    const hw = b.w / 2, hh = b.h / 2, dx = 0.28, dy = 0.62;
    wall.push(`M${P(-hw, -hh, dx, dy)}L${P(hw, -hh, dx, dy)}L${P(hw, hh, dx, dy)}L${P(-hw, hh, dx, dy)}Z`);
    roofs[(i * 7 + (b.k || 0)) % 3].push(`M${P(-hw, -hh)}L${P(hw, -hh)}L${P(hw, hh)}L${P(-hw, hh)}Z`);
    // hipped roof: a ridge along the long side, hips down to the corners
    const long = b.w >= b.h, L = long ? hw : hh, S = long ? hh : hw, r = Math.max(0, L - S);
    const R1 = long ? P(-r, 0) : P(0, -r), R2 = long ? P(r, 0) : P(0, r);
    const c = long ? [P(-hw, -hh), P(-hw, hh), P(hw, -hh), P(hw, hh)] : [P(-hw, -hh), P(hw, -hh), P(-hw, hh), P(hw, hh)];
    ridge.push(`M${R1}L${R2}M${c[0]}L${R1}L${c[1]}M${c[2]}L${R2}L${c[3]}`);
    // the slope facing the lamp-light (upper side) catches a little light
    lit.push(long ? `M${P(-hw, -hh)}L${P(hw, -hh)}L${R2}L${R1}Z` : `M${P(-hw, -hh)}L${P(-hw, hh)}L${R2}L${R1}Z`);
  });
  return { wall: wall.join(''), roofs: roofs.map((r) => r.join('')), ridge: ridge.join(''), lit: lit.join('') };
})();
const SHIP = (x: number, y: number, s = 1, flip = false) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} stroke={INK} strokeWidth=".25" strokeLinejoin="round">
    <path d="M-4 0 L4 0 L3 1.6 L-3 1.6 Z" fill="#6B5A3C" />
    <path d="M0 0 V-6.5 M-2.2 0 V-4.6 M2.2 0 V-4.2" fill="none" />
    <path d="M.4 -6 L3.4 -.6 L.4 -.6 Z M-.4 -6 L-3 -1 L-.4 -1 Z" fill="#F4ECD2" />
    <path d="M2.6 -4 L4.4 -.6 L2.6 -.6 Z M-2.6 -4.2 L-4 -1 L-2.6 -1 Z" fill="#F4ECD2" />
  </g>
);

const Label = ({ x, y, t, size = 2.1, italic = true, rot = 0 }: { x: number; y: number; t: string; size?: number; italic?: boolean; rot?: number }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Old Standard TT, serif" fontSize={size} fontStyle={italic ? 'italic' : 'normal'} fill={INK} stroke={PAPER} strokeWidth=".6" paintOrder="stroke" transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{t}</text>
);

function PlanArtInner() {
  const polyD = (p: G.Pt[]) => 'M' + p.map((q) => q.join(' ')).join(' L') + ' Z';
  const oldRing = polyD(G.DISTRICTS.old.poly);
  // the ordinary city is one quiet wash: only the places that matter to us are painted (see CityMap landmarks)
  const wash: Record<string, string> = { hill: '#DCD6B2', old: '#E6D7B6', market: '#E6D7B6', podil: '#E3D4B2', port: '#DED6BE', zar: '#E3D4B2', station: '#DED6BE', univ: '#E0D9B8', sloboda: '#DAD2BC' };
  return (
    <>
      <defs>
        <pattern id="pa-water" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><path d="M0 .8 H1.6" stroke="#5F7F98" strokeWidth=".18" /></pattern>
        <pattern id="pa-roof" width=".8" height=".8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 .4 H.8" stroke="#6A5A3A" strokeWidth=".2" /></pattern>
        <pattern id="pa-park" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><circle cx=".8" cy=".8" r=".5" fill="#6F8A55" fillOpacity=".75" /><circle cx=".8" cy=".8" r=".5" fill="none" stroke="#3E5A2C" strokeWidth=".1" /></pattern>
        <pattern id="pa-cobble" width="1" height="1" patternUnits="userSpaceOnUse"><circle cx=".3" cy=".3" r=".08" fill="#8A7A58" /><circle cx=".8" cy=".8" r=".08" fill="#8A7A58" /></pattern>
        <filter id="pa-bs" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx=".28" dy=".3" stdDeviation="0" floodColor="#3A2A10" floodOpacity=".42" /></filter>
        <filter id="pa-paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .1  0 0 0 .13 0" /></filter>
        <radialGradient id="pa-stain" cx=".5" cy=".5" r=".5"><stop offset=".78" stopColor="#8A6A30" stopOpacity="0" /><stop offset=".9" stopColor="#8A6A30" stopOpacity=".3" /><stop offset="1" stopColor="#8A6A30" stopOpacity="0" /></radialGradient>
        <radialGradient id="pa-vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stopColor="#7A5A20" stopOpacity="0" /><stop offset="1" stopColor="#7A5A20" stopOpacity=".28" /></radialGradient>
      </defs>
      <rect x="-4" y="-4" width="208" height="228" fill={PAPER} />
      <rect x="-4" y="-4" width="208" height="228" filter="url(#pa-paper)" />

      {/* ground washes per district */}
      {(Object.keys(G.DISTRICTS) as G.District[]).map((k) => <path key={k} d={polyD(G.DISTRICTS[k].poly)} fill={wash[k]} fillOpacity=".75" stroke="#7A6A48" strokeWidth=".25" strokeDasharray=".6 .5" />)}

      {/* sea, harbour, river */}
      <path d="M178 -4 C182 20 176 40 181 60 S176 100 179 150 S182 190 180 224 L204 224 L204 -4 Z" fill="#CFD8D2" />
      <path d="M178 -4 C182 20 176 40 181 60 S176 100 179 150 S182 190 180 224 L204 224 L204 -4 Z" fill="url(#pa-water)" />
      <path d="M178 -4 C182 20 176 40 181 60 S176 100 179 150 S182 190 180 224" fill="none" stroke="#3E5A70" strokeWidth=".5" />
      <path d="M-4 128 C20 122 40 134 70 126 S120 130 150 124 S172 124 181 120" fill="none" stroke="#3E5A70" strokeWidth="6.2" opacity=".35" />
      <path d="M-4 128 C20 122 40 134 70 126 S120 130 150 124 S172 124 181 120" fill="none" stroke="#CFD8D2" strokeWidth="5.2" />
      <path d="M-4 128 C20 122 40 134 70 126 S120 130 150 124 S172 124 181 120" fill="none" stroke="url(#pa-water)" strokeWidth="5.2" />
      {[28, 50, 74, 98, 148, 172, 196].map((y) => (
        <g key={y}><rect x="176" y={y - 1} width="16" height="2.2" fill="#8C7A54" stroke={INK} strokeWidth=".2" />{[180, 184, 188, 191].map((x) => <circle key={x} cx={x} cy={y - 1} r=".35" fill={INK} />)}</g>
      ))}
      {SHIP(192, 150, 0.9)}{SHIP(196, 186, 1, true)}{SHIP(188, 168, 0.8)}{SHIP(192, 38, 1)}{SHIP(196, 86, 0.9, true)}{SHIP(188, 64, 0.8)}{SHIP(194, 112, 0.8)}
      <g transform="translate(186 12)"><path d="M-4 0 L4 0 L3 1.6 L-3 1.6 Z" fill="#4A4036" stroke={INK} strokeWidth=".2" /><rect x="-1" y="-2.4" width="2" height="2.4" fill="#C8C0A8" stroke={INK} strokeWidth=".2" /><rect x="-.5" y="-5" width="1" height="2.6" fill="#2A2014" /><path d="M0 -5 c1 -1.2 2 -1 3 -2 c1 -1 2 -1 3 -2" fill="none" stroke="#6A6A66" strokeWidth=".8" opacity=".5" strokeLinecap="round" /></g>

      {/* the green ring where the old walls were */}
      <path d={oldRing} fill="none" stroke="#9DB07A" strokeOpacity=".5" strokeWidth="3" strokeLinejoin="round" />
      <path d={oldRing} fill="none" stroke="#4A6A38" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" strokeDasharray=".05 1.35" />
      {/* hill contours */}
      {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="32" cy="30" rx={25 - i * 4.6} ry={22 - i * 4.1} fill="none" stroke="#7A6A48" strokeWidth=".22" strokeOpacity=".8" />)}
      {/* parks */}
      <ellipse cx="26" cy="92" rx="6" ry="5" fill="url(#pa-park)" stroke="#4A6A38" strokeWidth=".2" />
      <ellipse cx="116" cy="22" rx="3.2" ry="3" fill="url(#pa-park)" />
      <path d="M62 34 q4 -3 8 1 q1 6 -4 8 q-6 -1 -4 -9z" fill="url(#pa-park)" stroke="#4A6A38" strokeWidth=".2" />

      {/* the houses: quiet, but solid: a shaded wall under a hipped roof with its ridge, in muted tones */}
      <path d={HOUSES.wall} fill="#9A8460" fillOpacity=".8" />
      {HOUSES.roofs.map((d, i) => <path key={i} d={d} fill={ROOF_TONES[i]} stroke="#8A7854" strokeWidth=".13" strokeLinejoin="round" />)}
      <path d={HOUSES.ridge} fill="none" stroke="#8A7854" strokeWidth=".12" strokeOpacity=".9" />
      <path d={HOUSES.lit} fill="#FFF8E4" fillOpacity=".28" />

      {/* rails to the harbour */}
      <path d="M144 18 L145 112" stroke={INK} strokeWidth=".35" fill="none" /><path d="M144.9 18 L145.9 112" stroke={INK} strokeWidth=".35" fill="none" />
      <path d="M143.5 18 L144.5 112" stroke={INK} strokeWidth="1.6" fill="none" strokeDasharray=".25 1.1" opacity=".7" />

      <path d="M136 160 L146 156 L146 118" stroke={INK} strokeWidth=".35" fill="none" /><path d="M136 161 L147 157 L147 118" stroke={INK} strokeWidth=".35" fill="none" />
      <path d="M82 154 H136 M82 156 H136 M82 158 H136" stroke={INK} strokeWidth=".25" fill="none" opacity=".8" />
      {/* avenues, over the blocks */}
      {G.ROADS.map((d, i) => <g key={i}><path d={d} fill="none" stroke="#5A4A30" strokeWidth="1.7" strokeLinejoin="round" opacity=".65" /><path d={d} fill="none" stroke={ROAD} strokeWidth="1.1" strokeLinejoin="round" /></g>)}

      {/* squares */}
      <ellipse cx="104" cy="37" rx="9" ry="7" fill={ROAD} stroke="#5A4A30" strokeWidth=".3" />
      <ellipse cx="104" cy="37" rx="9" ry="7" fill="url(#pa-cobble)" />
      <ellipse cx="104" cy="92" rx="15" ry="8" fill={ROAD} stroke="#5A4A30" strokeWidth=".3" />
      <ellipse cx="104" cy="92" rx="15" ry="8" fill="url(#pa-cobble)" />

      {/* squares of the south bank */}
      <ellipse cx="106" cy="151" rx="10" ry="4.5" fill={ROAD} stroke="#5A4A30" strokeWidth=".3" /><ellipse cx="106" cy="151" rx="10" ry="4.5" fill="url(#pa-cobble)" />
      <ellipse cx="107" cy="201" rx="13" ry="6" fill="url(#pa-park)" stroke="#4A6A38" strokeWidth=".25" />
      <ellipse cx="30" cy="171" rx="4.5" ry="4" fill={ROAD} stroke="#5A4A30" strokeWidth=".3" />
      <g>{/* the stone bridge over the river */}
        <path d="M96 124.8 h16 l.4 2.6 h-16.8z" fill="#CDBD90" stroke={INK} strokeWidth=".4" />
        {[99, 104, 109].map((x) => <path key={x} d={`M${x - 1.6} 127.4 a1.6 1.6 0 0 1 3.2 0`} fill="none" stroke={INK} strokeWidth=".25" />)}
      </g>

      {/* labels */}
      {(Object.keys(G.DISTRICTS) as G.District[]).map((k) => <Label key={k} x={G.DISTRICTS[k].label[0]} y={G.DISTRICTS[k].label[1]} t={G.DISTRICTS[k].t.toUpperCase()} size={3.3} italic={false} />)}
      
      <Label x={26} y={99.4} t="Сквер" size={1.9} /><Label x={104} y={133.4} t="Кам’яний міст" size={1.9} />
      <Label x={60} y={125.6} t="р. Аурумка" size={2.3} rot={-4} />
      <Label x={192} y={78} t="Гавань" size={2.6} rot={90} />
      <Label x={192} y={178} t="Заводська пристань" size={2.2} rot={90} />

      {/* compass, scale, cartouche */}
      <g transform="translate(192 214)"><circle r="5" fill="none" stroke={INK} strokeWidth=".3" /><path d="M0 -4.8 L1.1 0 L0 4.8 L-1.1 0 Z" fill={INK} /><path d="M-4.8 0 L0 -1.1 L4.8 0 L0 1.1 Z" fill="none" stroke={INK} strokeWidth=".25" /><text y="-6.2" textAnchor="middle" fontSize="2.2" fontFamily="serif">Пн</text></g>
      <g transform="translate(12 218)"><path d="M0 0 H22 M0 -1 V1 M11 -.8 V.8 M22 -1 V1" stroke={INK} strokeWidth=".35" /><rect x="0" y="-.5" width="11" height="1" fill={INK} /><text x="11" y="3.4" textAnchor="middle" fontSize="2" fontFamily="Old Standard TT, serif" fontStyle="italic">100 сажнів</text></g>
      <g transform="translate(184 4)"><rect width="16" height="6.6" fill={PAPER} fillOpacity=".7" stroke={INK} strokeWidth=".3" /><rect x=".6" y=".6" width="14.8" height="5.4" fill="none" stroke={INK} strokeWidth=".15" /><text x="8" y="3.2" textAnchor="middle" fontSize="1.9" fontFamily="Ruslan Display, serif" fill={INK}>ПОРТ-АУРУМ</text><text x="8" y="5.2" textAnchor="middle" fontSize="1.2" fontFamily="Old Standard TT, serif" fontStyle="italic">план міста</text></g>

      {/* the folds the sheet came in, a coffee ring, aged edges */}
      <circle cx="40" cy="104" r="6" fill="url(#pa-stain)" /><circle cx="150" cy="190" r="5" fill="url(#pa-stain)" />
      {[66.6, 133.3].map((x) => <g key={x}><path d={`M${x} -4 V224`} stroke="#3A2A10" strokeOpacity=".2" strokeWidth=".18" /><path d={`M${x + 0.4} -4 V224`} stroke="#FFF6DC" strokeOpacity=".45" strokeWidth=".35" /></g>)}
      {[110, 164].map((y) => <g key={y}><path d={`M-4 ${y} H204`} stroke="#3A2A10" strokeOpacity=".2" strokeWidth=".18" /><path d={`M-4 ${y + 0.4} H204`} stroke="#FFF6DC" strokeOpacity=".45" strokeWidth=".35" /></g>)}
      
    </>
  );
}
export const PlanArt = memo(PlanArtInner);
