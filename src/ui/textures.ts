// Room & materials layer.
// 1) One light source per era (desk lamp, bare bulb, fluorescent tube, window, screen). Every button is lit
//    from it: bright lit edge, shaded far edge, contact shadow + soft cast shadow onto the surface.
// 2) Buttons sit IN the surface: a dark groove around them, as if set into the desk top.
// 3) Wear is soft patina, not scratches: rubbed-bright centre where fingers press, fine grain.
// 4) A room-light pass over the whole screen: lamp pool + vignette, tinted per era.

const uri = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
const grain = (freq: number, alpha: number, seed = 3) =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0"/></filter><rect width="180" height="180" filter="url(#n)"/></svg>`);
/** soft cloudy patina: low-frequency blotches, no lines */
const patina = (alpha: number, seed: number, light = false) =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="120"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="3" seed="${seed}"/><feColorMatrix values="0 0 0 0 ${light ? 1 : 0}  0 0 0 0 ${light ? 0.95 : 0}  0 0 0 0 ${light ? 0.85 : 0}  0 0 0 ${alpha} ${-alpha * 0.35}"/></filter><rect width="260" height="120" filter="url(#p)"/></svg>`);

interface Light {
  /** where the light comes from: [x%, y%] of the screen */
  lamp: [number, number];
  hi: string; lo: string;
  /** contact + cast shadow onto the surface */
  cast: string;
  /** groove around the button (cut into the surface) */
  groove: string;
  wear: string[];
  /** whole-screen room light */
  room: string;
}

const L: Record<number, Light> = {
  // 1870s · warm desk lamp upper-left, mahogany desk, gilt brass
  1: { lamp: [15, 0], hi: 'rgba(255,236,190,0.55)', lo: 'rgba(40,20,4,0.5)', cast: 'drop-shadow(2px 3px 1.5px rgba(20,8,0,0.55)) drop-shadow(6px 10px 9px rgba(20,8,0,0.35))',
    groove: 'rgba(28,12,4,0.6)', wear: ['radial-gradient(ellipse 70% 60% at 50% 55%, rgba(255,240,205,0.14), transparent 70%)', patina(0.2, 5, true), grain(1.1, 0.1, 4)],
    room: 'radial-gradient(ellipse 85% 55% at 18% 0%, rgba(255,200,120,0.18), transparent 60%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(18,8,2,0.5) 100%)' },
  // 1918 · bare bulb overhead, cold office, paper and plywood
  2: { lamp: [50, 0], hi: 'rgba(255,245,225,0.35)', lo: 'rgba(0,0,0,0.45)', cast: 'drop-shadow(0 3px 1.5px rgba(0,0,0,0.5)) drop-shadow(0 10px 9px rgba(0,0,0,0.3))',
    groove: 'rgba(10,6,4,0.5)', wear: [patina(0.22, 9), grain(0.8, 0.14, 7)],
    room: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(255,235,200,0.15), transparent 65%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 50%, rgba(5,3,2,0.55) 100%)' },
  // 1949 · green-shade lamp upper-right on a lacquered desk
  3: { lamp: [82, 3], hi: 'rgba(255,250,230,0.5)', lo: 'rgba(10,10,0,0.45)', cast: 'drop-shadow(-2px 3px 1.5px rgba(10,8,0,0.5)) drop-shadow(-6px 10px 9px rgba(10,8,0,0.3))',
    groove: 'rgba(12,10,4,0.55)', wear: ['linear-gradient(180deg, rgba(255,255,255,0.16), transparent 48%)', patina(0.16, 13, true), grain(1.2, 0.08, 9)],
    room: 'radial-gradient(ellipse 80% 50% at 82% 0%, rgba(220,255,200,0.13), transparent 60%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(6,8,4,0.5) 100%)' },
  // 1990s · fluorescent tube overhead, laminate desk
  4: { lamp: [50, 0], hi: 'rgba(235,255,250,0.45)', lo: 'rgba(0,0,0,0.38)', cast: 'drop-shadow(0 3px 1px rgba(0,0,0,0.45)) drop-shadow(0 8px 8px rgba(0,0,0,0.25))',
    groove: 'rgba(0,0,0,0.42)', wear: [patina(0.16, 17, true), grain(1.6, 0.1, 11)],
    room: 'linear-gradient(180deg, rgba(210,255,240,0.09), transparent 35%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 60%, rgba(0,4,2,0.4) 100%)' },
  // 2000s · warm halogen spots, glossy surfaces
  5: { lamp: [30, 0], hi: 'rgba(255,255,255,0.65)', lo: 'rgba(0,0,0,0.32)', cast: 'drop-shadow(1px 3px 1.5px rgba(0,0,0,0.45)) drop-shadow(3px 12px 11px rgba(0,0,0,0.3))',
    groove: 'rgba(0,0,0,0.32)', wear: ['linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.06) 46%, transparent 52%)'],
    room: 'radial-gradient(ellipse 70% 45% at 30% 0%, rgba(255,230,180,0.15), transparent 60%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 60%, rgba(0,0,0,0.32) 100%)' },
  // 2010s · daylight from a big window on the left
  6: { lamp: [0, 30], hi: 'rgba(255,255,255,0.5)', lo: 'rgba(0,0,0,0.18)', cast: 'drop-shadow(3px 3px 2px rgba(0,0,0,0.16)) drop-shadow(8px 8px 12px rgba(0,0,0,0.1))',
    groove: 'rgba(0,0,0,0.1)', wear: [grain(1.4, 0.06, 13)],
    room: 'linear-gradient(90deg, rgba(255,255,255,0.09), transparent 45%), radial-gradient(ellipse 130% 95% at 50% 45%, transparent 65%, rgba(0,0,0,0.16) 100%)' },
  // 2020s · dark room, cold screen glow from the front
  7: { lamp: [50, 100], hi: 'rgba(160,240,255,0.32)', lo: 'rgba(0,0,0,0.42)', cast: 'drop-shadow(0 -2px 5px rgba(0,229,255,0.12)) drop-shadow(0 6px 10px rgba(0,0,0,0.5))',
    groove: 'rgba(0,0,0,0.45)', wear: ['linear-gradient(120deg, transparent 25%, rgba(255,255,255,0.07) 35%, transparent 45%)'],
    room: 'radial-gradient(ellipse 90% 50% at 50% 100%, rgba(0,229,255,0.09), transparent 70%), radial-gradient(ellipse 120% 90% at 50% 45%, transparent 50%, rgba(0,0,0,0.45) 100%)' }
};

/** lit edge + shaded edge, following the light direction */
function bevel(l: Light) {
  const [x, y] = l.lamp;
  const h = x < 35 ? 'left' : x > 65 ? 'right' : '', v = y <= 50 ? 'top' : 'bottom';
  const opp = (s: string) => ({ left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as Record<string, string>)[s];
  const lit = [v, h].filter(Boolean).join(' '), far = [opp(v), h ? opp(h) : ''].filter(Boolean).join(' ');
  // "to far" starts at the lit side; "to lit" starts at the far side
  return [`linear-gradient(to ${far}, ${l.hi} 0px, transparent 5px)`, `linear-gradient(to ${lit}, ${l.lo} 0px, transparent 6px)`];
}

export function textureCss(): string {
  let css = '.b3d{position:relative;isolation:isolate}';
  css += '.b3d::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1}';
  css += '.room-light{position:absolute;inset:0;pointer-events:none;z-index:95}';
  for (const [n, l] of Object.entries(L)) {
    const layers = [...bevel(l), ...l.wear];
    const sizes = layers.map((x) => (x.startsWith('url') ? 'auto' : '100% 100%')).join(',');
    const contact = l.cast.split(') drop-shadow')[0] + ')';
    css += `.era-${n} .b3d{filter:${l.cast};outline:2px solid ${l.groove};outline-offset:1px}`;
    css += `.era-${n} .b3d:active{filter:${contact} brightness(0.94)}`;
    css += `.era-${n} .b3d::after{background-image:${layers.join(',')};background-size:${sizes}}`;
    css += `.era-${n} .room-light{background:${l.room}}`;
  }
  css += '.b3d[aria-label="Головне меню"]{filter:none;outline:none}.b3d[aria-label="Головне меню"]::after{display:none}';
  return css;
}

let injected = false;
export function injectTextures() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const st = document.createElement('style');
  st.id = 'era-textures';
  st.textContent = textureCss();
  document.head.appendChild(st);
}
