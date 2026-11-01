// Port-Aurum seen through the office window, 1870s. One drawing, four times of day.
// Procedural but fixed (seeded), so the city is always the same city.
import { useMemo } from 'react';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

const W = 360, H = 210, HORIZON = 150;

function lcg(seed: number) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }

interface Bld { x: number; w: number; h: number; roof: 'flat' | 'gable' | 'dome' | 'spire'; win: [number, number, boolean, number][]; chim: number[]; far: boolean }

function build(): { far: Bld[]; near: Bld[]; stars: [number, number, number][]; masts: number[] } {
  const r = lcg(1874);
  const mk = (far: boolean): Bld[] => {
    const out: Bld[] = [];
    let x = -6;
    while (x < W + 6) {
      const w = far ? 14 + r() * 22 : 20 + r() * 30, h = far ? 26 + r() * 34 : 34 + r() * 52;
      const roofs: Bld['roof'][] = far ? ['flat', 'gable', 'gable', 'dome', 'spire', 'flat'] : ['flat', 'gable', 'gable', 'flat'];
      let roof = roofs[Math.floor(r() * roofs.length)];
      if (!far && Math.abs(x - 210) < 20) roof = 'dome';
      const win: Bld['win'] = [];
      if (!far) for (let wy = HORIZON - h + 8; wy < HORIZON - 6; wy += 9) for (let wx = x + 4; wx < x + w - 5; wx += 7) if (r() < 0.8) win.push([wx, wy, r() < 0.45, Math.floor(r() * 9)]);
      const chim = !far && roof !== 'dome' && r() < 0.6 ? [x + 4 + r() * (w - 10)] : [];
      out.push({ x, w, h, roof, win, chim, far });
      x += w + (far ? -2 : 1);
    }
    return out;
  };
  const stars: [number, number, number][] = Array.from({ length: 46 }, () => [r() * W, r() * (HORIZON - 70), 0.3 + r() * 0.9]);
  return { far: mk(true), near: mk(false), stars, masts: [26, 58, 300, 334] };
}

const SKY: Record<Phase, [string, string, string]> = {
  dawn: ['#3B4A78', '#C98C78', '#F2C98E'],
  day: ['#6E9CC8', '#A9C6DC', '#DCE6E4'],
  dusk: ['#2A2D5A', '#A4506A', '#F09A4A'],
  night: ['#05070F', '#0D1428', '#1E2A48']
};

function roofPath(b: Bld, top: number) {
  const { x, w } = b;
  if (b.roof === 'gable') return `M${x} ${top} L${x + w / 2} ${top - w * 0.35} L${x + w} ${top} Z`;
  if (b.roof === 'dome') return `M${x + 2} ${top} A${w / 2 - 2} ${w / 2.4} 0 0 1 ${x + w - 2} ${top} Z M${x + w / 2 - 1} ${top - w / 2.4} v-8 h2 v8 Z`;
  if (b.roof === 'spire') return `M${x + w * 0.3} ${top} L${x + w / 2} ${top - 30} L${x + w * 0.7} ${top} Z`;
  return '';
}

export function City({ phase, width = W, height = H, lightsOut = false }: { phase: Phase; width?: number | string; height?: number | string; lightsOut?: boolean }) {
  const C = useMemo(build, []);
  const night = phase === 'night', dusk = phase === 'dusk', dawn = phase === 'dawn';
  const [s0, s1, s2] = SKY[phase];
  const farC = night ? '#141A2C' : dusk ? '#4A3550' : dawn ? '#6A6078' : '#8C98A8';
  const nearC = night ? '#0A0D16' : dusk ? '#241A26' : dawn ? '#3A3240' : '#5A5A62';
  const winOn = night || dusk;
  const water = night ? '#0A1222' : dusk ? '#3A2A40' : dawn ? '#5A607A' : '#5E86A6';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id="cy-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s0} /><stop offset=".65" stopColor={s1} /><stop offset="1" stopColor={s2} /></linearGradient>
        <radialGradient id="cy-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={night ? '#F4F0DC' : '#FFF4D0'} /><stop offset=".35" stopColor={night ? 'rgba(220,225,240,0.35)' : 'rgba(255,220,150,0.5)'} /><stop offset="1" stopColor="rgba(255,220,150,0)" /></radialGradient>
        <linearGradient id="cy-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={water} /><stop offset="1" stopColor="#05070C" /></linearGradient>
        <filter id="cy-smoke"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.12" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.48  0 0 0 0 0.46  0 0 0 0.9 -0.3" /><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      <rect width={W} height={H} fill="url(#cy-sky)" />
      {night && C.stars.map(([x, y, o], i) => <circle key={i} cx={x} cy={y} r={o > 0.9 ? 0.9 : 0.55} fill="#E8ECF8" opacity={o} className={i % 5 === 0 ? 'cy-twinkle' : undefined} style={{ animationDelay: `${(i % 7) * 0.6}s` }} />)}
      {/* moon or sun */}
      {night && <><circle cx="292" cy="38" r="26" fill="url(#cy-sun)" /><circle cx="292" cy="38" r="9" fill="#EEEAD6" /><circle cx="296" cy="35" r="8" fill="#0B1020" opacity=".2" /></>}
      {dawn && <circle cx="70" cy="140" r="40" fill="url(#cy-sun)" />}
      {dusk && <circle cx="300" cy="138" r="46" fill="url(#cy-sun)" />}
      {phase === 'day' && <circle cx="250" cy="30" r="34" fill="url(#cy-sun)" opacity=".8" />}
      {/* far skyline: cathedral, spires, warehouses */}
      {C.far.map((b, i) => <g key={i} fill={farC}><rect x={b.x} y={HORIZON - 14 - b.h} width={b.w} height={b.h + 14} /><path d={roofPath(b, HORIZON - 14 - b.h)} /></g>)}
      {/* near rows of houses with chimneys and lit windows */}
      {C.near.map((b, i) => (
        <g key={i}>
          {b.chim.map((cx, j) => <g key={j}><rect x={cx} y={HORIZON - b.h - 10} width="4" height="12" fill={nearC} />
            <rect x={cx - 10} y={HORIZON - b.h - 44} width="26" height="36" filter="url(#cy-smoke)" opacity={night ? 0.25 : 0.45} className="cy-smoke" /></g>)}
          <rect x={b.x} y={HORIZON - b.h} width={b.w} height={b.h} fill={nearC} />
          <path d={roofPath(b, HORIZON - b.h)} fill={nearC} />
          {winOn && b.win.map(([wx, wy, on, d], j) => on && (
            <rect key={j} x={wx} y={wy} width="3" height="4.2" fill={night ? '#F2B860' : '#E8A050'} opacity={night ? 0.9 : 0.6}
              className={lightsOut && d < 5 ? 'cy-out' : undefined} style={lightsOut ? { animationDelay: `${0.6 + d * 0.35}s` } : undefined} />
          ))}
        </g>
      ))}
      {/* embankment with gas lamps */}
      <rect x="0" y={HORIZON} width={W} height="5" fill={night ? '#151515' : '#3A3532'} />
      {[20, 80, 140, 200, 260, 320].map((x) => <g key={x}>
        <rect x={x} y={HORIZON - 12} width="1.2" height="12" fill="#111" />
        {winOn && <><circle cx={x + 0.6} cy={HORIZON - 13} r="7" fill="rgba(255,200,110,0.22)" /><circle cx={x + 0.6} cy={HORIZON - 13} r="1.6" fill="#FFD890" /></>}
      </g>)}
      {/* harbour water with reflections, ships' masts */}
      <rect x="0" y={HORIZON + 5} width={W} height={H - HORIZON - 5} fill="url(#cy-water)" />
      {winOn && [20, 80, 140, 200, 260, 320].map((x) => <rect key={x} x={x - 1.5} y={HORIZON + 7} width="4" height="26" fill="rgba(255,200,110,0.18)" className="cy-ripple" />)}
      {night && <rect x="283" y={HORIZON + 6} width="18" height="40" fill="rgba(230,230,210,0.12)" className="cy-ripple" />}
      {C.masts.map((x, i) => <g key={i} stroke={night ? '#06080E' : '#2A2622'} strokeWidth="1.2" fill="none">
        <path d={`M${x} ${HORIZON + 22} V${HORIZON - 46} M${x - 12} ${HORIZON - 30} H${x + 12} M${x - 8} ${HORIZON - 40} H${x + 8} M${x} ${HORIZON - 46} L${x - 16} ${HORIZON + 14} M${x} ${HORIZON - 46} L${x + 16} ${HORIZON + 14}`} strokeWidth=".6" />
        <path d={`M${x - 20} ${HORIZON + 14} H${x + 22} L${x + 16} ${HORIZON + 22} H${x - 15} Z`} fill={night ? '#06080E' : '#2A2622'} stroke="none" />
      </g>)}
      <style>{'.cy-twinkle{animation:cyTw 3s ease-in-out infinite}@keyframes cyTw{50%{opacity:.15}}.cy-ripple{animation:cyRip 2.6s ease-in-out infinite}@keyframes cyRip{50%{transform:scaleX(1.5);opacity:.6}}.cy-ripple{transform-box:fill-box;transform-origin:center}.cy-out{animation:cyOut .4s forwards}@keyframes cyOut{to{opacity:0}}.cy-smoke{animation:cySm 6s ease-in-out infinite;transform-box:fill-box}@keyframes cySm{50%{transform:translate(4px,-3px)}}@media (prefers-reduced-motion: reduce){.cy-twinkle,.cy-ripple,.cy-smoke{animation:none}}'}</style>
    </svg>
  );
}
