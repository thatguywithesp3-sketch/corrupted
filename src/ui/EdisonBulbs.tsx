// Step indicator: a row of Edison carbon-filament bulbs hanging from a brass rail.
// done = warm steady glow, current = bright and flickering, ahead = unlit glass.

const W = 34, H = 58;

function Bulb({ state, n }: { state: 'done' | 'cur' | 'off'; n: number }) {
  const on = state !== 'off';
  const id = 'b' + n;
  return (
    <div style={{ position: 'relative', width: W, height: H + 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ width: 2, height: 10, background: 'linear-gradient(90deg,#1A120A,#4A3622,#1A120A)' }} />
      {on && <span className={state === 'cur' ? 'bulb-flicker' : ''} style={{ position: 'absolute', left: '50%', top: 40, width: state === 'cur' ? 78 : 50, height: state === 'cur' ? 78 : 50, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,190,90,${state === 'cur' ? 0.55 : 0.28}), rgba(255,150,40,0) 70%)`, pointerEvents: 'none' }} />}
      <svg width={W} height={H} viewBox="0 0 34 58" style={{ position: 'relative', overflow: 'visible' }} className={state === 'cur' ? 'bulb-flicker' : ''}>
        <defs>
          <linearGradient id={id + 'brass'} x1="0" x2="1">
            <stop offset="0" stopColor="#5A4318" /><stop offset=".35" stopColor="#E2C374" /><stop offset=".6" stopColor="#B8913C" /><stop offset="1" stopColor="#4A3612" />
          </linearGradient>
          <radialGradient id={id + 'glass'} cx="45%" cy="40%" r="60%">
            {on ? <><stop offset="0" stopColor="#FFE9B0" stopOpacity={state === 'cur' ? 0.95 : 0.55} /><stop offset=".55" stopColor="#F4A23C" stopOpacity={state === 'cur' ? 0.55 : 0.3} /><stop offset="1" stopColor="#7A3A0A" stopOpacity=".35" /></>
              : <><stop offset="0" stopColor="#6E6250" stopOpacity=".35" /><stop offset="1" stopColor="#1E1810" stopOpacity=".55" /></>}
          </radialGradient>
        </defs>
        {/* screw base */}
        <rect x="11" y="0" width="12" height="13" rx="1.5" fill={`url(#${id}brass)`} />
        {[3, 6, 9].map((y) => <rect key={y} x="10.5" y={y} width="13" height="1.4" fill="#3A2A0E" opacity=".55" />)}
        <path d="M11 13 h12 l1 3 h-14 z" fill="#2A1E0A" />
        {/* glass: Edison teardrop */}
        <path d="M10 16 C10 22 3 27 3 38 C3 49 10 56 17 56 C24 56 31 49 31 38 C31 27 24 22 24 16 Z" fill={`url(#${id}glass)`} stroke={on ? 'rgba(255,220,160,0.55)' : 'rgba(200,190,170,0.35)'} strokeWidth="1" />
        {/* stem + support wires */}
        <path d="M15 16 L15 30 M19 16 L19 30" stroke={on ? '#C98A3A' : '#5A5040'} strokeWidth=".8" />
        {/* squirrel-cage carbon filament */}
        <path d="M15 30 L9 38 L15 47 L17 38 L19 47 L25 38 L19 30" fill="none" stroke={on ? (state === 'cur' ? '#FFF4C8' : '#FFC46A') : '#3A3228'} strokeWidth={on ? 1.3 : 0.9} strokeLinejoin="round"
          style={on ? { filter: `drop-shadow(0 0 ${state === 'cur' ? 3 : 1.5}px #FFB040)` } : undefined} />
        {/* glass highlight */}
        <path d="M8 34 C8 28 11 24 13 21" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span style={{ marginTop: -2, fontFamily: "'Old Standard TT', serif", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: on ? '#E9C98A' : 'rgba(217,184,112,0.45)' }}>{['I', 'II', 'III', 'IV', 'V'][n] || n + 1}</span>
    </div>
  );
}

export function EdisonBulbs({ count, step }: { count: number; step: number }) {
  return (
    <div aria-label={`Крок ${step + 1} з ${count}`} style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 22, paddingTop: 6 }}>
      <span style={{ position: 'absolute', left: 40, right: 40, top: 2, height: 6, borderRadius: 3, background: 'linear-gradient(180deg,#E2C374,#8C6A24 60%,#4A3612)', boxShadow: '0 2px 3px rgba(0,0,0,0.6)' }} />
      {Array.from({ length: count }, (_, i) => <Bulb key={i} n={i} state={i < step ? 'done' : i === step ? 'cur' : 'off'} />)}
      <style>{'@keyframes bulbFlicker{0%,100%{opacity:1}42%{opacity:1}44%{opacity:.82}46%{opacity:1}71%{opacity:.93}73%{opacity:1}}.bulb-flicker{animation:bulbFlicker 3.2s infinite}@media (prefers-reduced-motion: reduce){.bulb-flicker{animation:none}}'}</style>
    </div>
  );
}
