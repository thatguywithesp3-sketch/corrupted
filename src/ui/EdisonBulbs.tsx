// Step indicator: Edison carbon-filament bulbs set into the desk.
// A niche is cut into the wood; a worn brass plate with screws sits at its back; each bulb screws into
// a brass socket on that plate. Glass carries dust, smudges, fine scratches and soot at the top,
// bulbs cast shadows on the plate, lit bulbs spill warm light on the niche walls.
// done = steady dim glow, current = bright and flickering, ahead = unlit.

const BW = 40, BH = 66;

function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="eb-dust" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="4" />
          <feColorMatrix values="0 0 0 0 0.86  0 0 0 0 0.8  0 0 0 0 0.7  0 0 0 16 -11.2" />
        </filter>
        <filter id="eb-smudge" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="11" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.9  0 0 0 1.4 -0.75" />
        </filter>
        <filter id="eb-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id="eb-brass" x1="0" x2="1">
          <stop offset="0" stopColor="#3E2C0E" /><stop offset=".3" stopColor="#A8863E" /><stop offset=".45" stopColor="#D8BA70" />
          <stop offset=".62" stopColor="#8E6C2C" /><stop offset="1" stopColor="#2E2008" />
        </linearGradient>
        <radialGradient id="eb-soot" cx="50%" cy="15%" r="60%">
          <stop offset="0" stopColor="#1A1008" stopOpacity=".55" /><stop offset="1" stopColor="#1A1008" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const GLASS = 'M12 17 C12 23 4 28 4 41 C4 54 12 63 20 63 C28 63 36 54 36 41 C36 28 28 23 28 17 Z';

function Bulb({ state, n }: { state: 'done' | 'cur' | 'off'; n: number }) {
  const on = state !== 'off', cur = state === 'cur', id = 'eb' + n;
  return (
    <div style={{ position: 'relative', width: BW, height: BH }}>
      {/* shadow of the bulb on the back plate (lamp is upper-left) */}
      <svg width={BW} height={BH} viewBox="0 0 40 66" style={{ position: 'absolute', left: 5, top: 4, opacity: on ? 0.25 : 0.45, filter: 'blur(2px)' }} aria-hidden="true">
        <path d={GLASS} fill="#000" /><rect x="13" y="0" width="14" height="17" fill="#000" />
      </svg>
      {on && <span className={cur ? 'bulb-flicker' : ''} style={{ position: 'absolute', left: '50%', top: 44, width: cur ? 96 : 58, height: cur ? 96 : 58, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,176,72,${cur ? 0.62 : 0.2}), rgba(255,140,40,0) 68%)`, pointerEvents: 'none', mixBlendMode: 'screen' }} />}
      <svg width={BW} height={BH} viewBox="0 0 40 66" style={{ position: 'relative', overflow: 'visible' }} className={cur ? 'bulb-flicker' : ''}>
        <defs>
          <clipPath id={id + 'c'}><path d={GLASS} /></clipPath>
          <radialGradient id={id + 'g'} cx="46%" cy="58%" r="62%">
            {on ? <><stop offset="0" stopColor="#FFE6A8" stopOpacity={cur ? 1 : 0.42} /><stop offset=".5" stopColor="#E8902E" stopOpacity={cur ? 0.62 : 0.24} /><stop offset="1" stopColor="#4A2206" stopOpacity=".5" /></>
              : <><stop offset="0" stopColor="#6A5E48" stopOpacity=".12" /><stop offset=".72" stopColor="#2A2014" stopOpacity=".32" /><stop offset="1" stopColor="#0E0A06" stopOpacity=".75" /></>}
          </radialGradient>
        </defs>
        {/* socket: worn brass, threads, dark collar */}
        <rect x="12" y="0" width="16" height="15" rx="1.6" fill="url(#eb-brass)" />
        <rect x="12" y="0" width="16" height="15" rx="1.6" fill="#000" filter="url(#eb-grain)" opacity=".5" />
        {[3, 6.5, 10].map((y) => <path key={y} d={`M11.6 ${y} Q20 ${y + 1.6} 28.4 ${y}`} stroke="#2A1C06" strokeWidth="1.1" fill="none" opacity=".7" />)}
        <path d="M14 1 L14 14" stroke="#F4DFA0" strokeWidth=".7" opacity=".55" />
        <path d="M11 15 h18 l1.2 2.4 h-20.4 z" fill="#1A1208" />
        {/* glass body */}
        <path d={GLASS} fill={`url(#${id}g)`} />
        <g clipPath={`url(#${id}c)`}>
          <ellipse cx="20" cy="22" rx="14" ry="10" fill="url(#eb-soot)" opacity={on ? 0.6 : 1} />
          {/* stem, support wires, carbon filament (squirrel cage) */}
          <path d="M18 17 L18 33 M22 17 L22 33 M17 33 h6" stroke={on ? '#B07A34' : '#4A4034'} strokeWidth=".7" fill="none" />
          <path d="M18 33 L11 42 L17.5 53 L20 42 L22.5 53 L29 42 L22 33" fill="none"
            stroke={on ? (cur ? '#FFF2C2' : '#F2A85A') : '#2C261E'} strokeWidth={on ? 1.15 : 0.8} strokeLinejoin="round"
            style={on ? { filter: `drop-shadow(0 0 ${cur ? 2.5 : 1.2}px #FF9A30)` } : undefined} />
          {/* dust, fingerprints, hairline scratches */}
          <rect x="0" y="16" width="40" height="34" filter="url(#eb-dust)" opacity={on ? 0.3 : 0.5} />
          <rect x="0" y="0" width="40" height="66" filter="url(#eb-smudge)" opacity=".22" />
          <path d="M9 47 l9 -4 M24 56 l6 -5 M27 30 l4 6" stroke="#FFF" strokeWidth=".35" opacity=".35" />
          {/* window-like reflection of the room lamp */}
          <path d="M9 38 C9 31 12 26 14.5 23" fill="none" stroke="rgba(255,248,230,0.55)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M31 47 C30 52 27 56 24 58" fill="none" stroke="rgba(255,240,210,0.18)" strokeWidth="1.2" strokeLinecap="round" />
        </g>
        <path d={GLASS} fill="none" stroke={on ? 'rgba(255,214,150,0.5)' : 'rgba(190,175,150,0.28)'} strokeWidth=".9" />
        {/* tip of the glass (pip) */}
        <path d="M18.6 63 Q20 66.2 21.4 63" fill={on ? 'rgba(255,210,140,0.5)' : 'rgba(120,110,95,0.5)'} />
      </svg>
    </div>
  );
}

const screw = (x: string, y: number) => (
  <span style={{ position: 'absolute', left: x, top: y, width: 7, height: 7, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #E6CF8E, #6E531E 70%)', boxShadow: '0 1px 1px rgba(0,0,0,0.6), inset 0 0 0 0.5px rgba(0,0,0,0.4)' }}>
    <span style={{ position: 'absolute', left: 1, right: 1, top: 3, height: 1, background: '#3A2A0C', transform: 'rotate(35deg)' }} />
  </span>
);

export function EdisonBulbs({ count, step }: { count: number; step: number }) {
  const anyCur = step >= 0;
  return (
    <div aria-label={`Крок ${step + 1} з ${count}`} style={{ position: 'relative', margin: '2px 34px 0', height: 104, borderRadius: 6,
      // niche cut into the wood: dark walls, deep inner shadow, thin lit lip at the bottom edge
      background: 'linear-gradient(180deg, #120A04 0%, #24150A 18%, #2E1C0E 100%)',
      boxShadow: 'inset 0 10px 14px rgba(0,0,0,0.85), inset 0 -2px 3px rgba(0,0,0,0.6), inset 6px 0 10px rgba(0,0,0,0.6), inset -6px 0 10px rgba(0,0,0,0.6), 0 1px 0 rgba(255,214,160,0.18)' }}>
      <Defs />
      {/* worn brass back plate */}
      <div style={{ position: 'absolute', left: 8, right: 8, top: 7, bottom: 22, borderRadius: 3,
        background: 'linear-gradient(180deg, #6A5226 0%, #8C6E34 30%, #5E4820 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,236,180,0.25), inset 0 -6px 10px rgba(0,0,0,0.45), 0 2px 3px rgba(0,0,0,0.6)' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, borderRadius: 3, mixBlendMode: 'multiply', opacity: 0.6 }} aria-hidden="true">
          <filter id="eb-plate"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.6" numOctaves="3" seed="2" /><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.14  0 0 0 0 0.05  0 0 0 1.2 -0.25" /></filter>
          <rect width="100%" height="100%" filter="url(#eb-plate)" />
        </svg>
        {screw('6px', 6)}{screw('calc(100% - 13px)', 6)}
      </div>
      {/* warm light from lit bulbs on the niche floor */}
      {anyCur && <span style={{ position: 'absolute', left: 10, right: 10, bottom: 0, height: 26, background: `radial-gradient(ellipse ${(step + 1) * 18}% 100% at ${(step + 0.5) / count * 100}% 100%, rgba(255,170,70,0.28), transparent 70%)`, pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 9, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {Array.from({ length: count }, (_, i) => <Bulb key={i} n={i} state={i < step ? 'done' : i === step ? 'cur' : 'off'} />)}
      </div>
      {/* engraved numerals on a brass strip at the front lip */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} style={{ width: BW, textAlign: 'center', fontFamily: "'Old Standard TT', serif", fontSize: 10, fontWeight: 700, letterSpacing: 1,
            color: i <= step ? '#E7C27A' : '#7A6440', textShadow: '0 -1px 0 rgba(0,0,0,0.7), 0 1px 0 rgba(255,220,150,0.15)' }}>{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i]}</span>
        ))}
      </div>
      <style>{'@keyframes bulbFlicker{0%,100%{opacity:1}42%{opacity:1}44%{opacity:.84}46%{opacity:1}71%{opacity:.94}73%{opacity:1}}.bulb-flicker{animation:bulbFlicker 3.2s infinite}@media (prefers-reduced-motion: reduce){.bulb-flicker{animation:none}}'}</style>
    </div>
  );
}
