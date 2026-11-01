// Era materials for CTAs (every button with class "b3d").
// The button keeps its own colour; a texture layer on top adds wear: scratches, rubbed corners,
// grime, gloss, chips — whatever the materials of that era's offices would show.
// Applied via a wrapper class `era-N` on the screen.

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { let t = (a = (a + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const uri = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

/** fine random scratches, mostly along `angle` (deg) */
function scratches(seed: number, n: number, angle: number, spread: number, color: string, w = 240, h = 90) {
  const r = rng(seed); let p = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, len = 6 + r() * 34, a = ((angle + (r() - 0.5) * spread) * Math.PI) / 180;
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, cx = (x + x2) / 2 + (r() - 0.5) * 4, cy = (y + y2) / 2 + (r() - 0.5) * 4;
    p += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${color}" stroke-opacity="${(0.25 + r() * 0.6).toFixed(2)}" stroke-width="${(0.35 + r() * 0.6).toFixed(2)}" fill="none"/>`;
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${p}</svg>`);
}
/** irregular blobs: chips, specks, smudges */
function blobs(seed: number, n: number, rMin: number, rMax: number, color: string, w = 200, h = 80) {
  const r = rng(seed); let p = '';
  for (let i = 0; i < n; i++) {
    const cx = r() * w, cy = r() * h, rad = rMin + r() * (rMax - rMin); let d = '';
    for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2, rr = rad * (0.6 + r() * 0.6); d += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
    p += `<path d="${d}Z" fill="${color}" fill-opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  }
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${p}</svg>`);
}
const noise = (freq: number, alpha: number, seed = 3) =>
  uri(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${alpha} 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>`);
const corners = (c: string, r: number) =>
  ['0 0', '100% 0', '0 100%', '100% 100%'].map((p) => `radial-gradient(circle at ${p}, ${c}, transparent ${r}px)`).join(', ');

interface Material { layers: string[]; blend: string; opacity: number; shadow?: string; extra?: string }
const ERA: Record<number, Material> = {
  // 1870s · gilt brass, mahogany, leather: hairline scratches, brushed lines, rubbed bright corners, grime in the edges
  1: {
    layers: [corners('rgba(255,236,190,0.55)', 9), scratches(11, 32, 15, 70, '#FFF6DC'), scratches(12, 22, -20, 60, '#2A1A08'),
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)', noise(0.9, 0.35, 4)],
    blend: 'overlay', opacity: 0.65, shadow: 'inset 0 0 0 1px rgba(60,40,10,0.35), inset 0 0 10px rgba(40,25,5,0.45)'
  },
  // 1918 · linocut poster, rough paper, stencil: missing ink specks, ink bleed, torn fibres
  2: {
    layers: [blobs(21, 45, 0.5, 1.8, '#F2E6CF'), blobs(22, 30, 0.5, 1.4, '#000'), noise(0.6, 0.5, 7), corners('rgba(242,230,207,0.6)', 6)],
    blend: 'normal', opacity: 0.35, shadow: 'inset 0 0 0 2px rgba(0,0,0,0.18)'
  },
  // 1949 · enamel, bakelite, lacquered desk: chipped enamel, crazing, deep gloss band
  3: {
    layers: ['linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 45%, transparent 50%)', blobs(31, 9, 1.5, 4, '#1A1410', 220, 90),
      scratches(32, 14, 90, 180, '#FFFFFF'), noise(1.2, 0.25, 9), corners('rgba(20,14,10,0.55)', 7)],
    blend: 'normal', opacity: 0.45, shadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.3)'
  },
  // 1990s · laminate, cheap plastic, photocopies: scuff streaks, toner noise, yellowed tape on a corner
  4: {
    layers: [scratches(41, 45, -35, 25, '#FFFFFF', 240, 90), noise(1.6, 0.5, 11), 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.12) 48%, transparent 56%)'],
    blend: 'overlay', opacity: 0.85, shadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)'
  },
  // 2000s · chrome, glossy plastic, lacquered SUV: wet gloss, specular glint, fingerprint smudge
  5: {
    layers: ['linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 46%, rgba(0,0,0,0.08) 54%, transparent 100%)',
      'radial-gradient(ellipse 22px 14px at 82% 70%, rgba(255,255,255,0.18), transparent)', 'radial-gradient(circle 3px at 12% 18%, rgba(255,255,255,0.95), transparent)'],
    blend: 'normal', opacity: 0.8, shadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.25)'
  },
  // 2010s · matte flat design, soft-touch plastic: almost clean, fine grain only
  6: { layers: [noise(1.4, 0.18, 13)], blend: 'overlay', opacity: 1, shadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)' },
  // 2020s · glass, OLED, screens: diagonal sheen, faint scanlines, dead-pixel speck
  7: {
    layers: ['linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.14) 32%, transparent 44%)', 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)',
      blobs(71, 3, 0.6, 1, '#00E5FF', 200, 60)],
    blend: 'screen', opacity: 0.9, shadow: 'inset 0 0 0 1px rgba(0,229,255,0.18)'
  }
};

export function textureCss(): string {
  let css = '.b3d{position:relative;isolation:isolate}';
  css += '.b3d::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1}';
  for (const [n, m] of Object.entries(ERA)) {
    css += `.era-${n} .b3d::after{background-image:${m.layers.join(',')};background-size:${m.layers.map((l) => (l.startsWith('url') ? 'auto' : '100% 100%')).join(',')};mix-blend-mode:${m.blend};opacity:${m.opacity}${m.shadow ? ';box-shadow:' + m.shadow : ''}}`;
    if (m.extra) css += `.era-${n} .b3d:not([class*="tx-"])::before{${m.extra}}`;
  }
  // keep text crisp above the wear on very small controls
  css += '.b3d[aria-label="Головне меню"]::after{display:none}';
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
