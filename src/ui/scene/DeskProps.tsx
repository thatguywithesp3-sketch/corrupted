// The office desk is not empty: an inkwell with a dip pen, a rubber stamp on its pad and a short stack of
// crowns sit in the lamplight above the papers. Pure set dressing (no taps), drawn as real objects:
// lit from the lamp at the upper left, a hard contact shadow and a soft cast shadow to the lower right.
// The only motion is ambient and slow: the lamp glints on the ink and the wax, nothing travels.

export function DeskProps() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 186, height: 210, pointerEvents: 'none', zIndex: 1 }}>
      <style>{'@keyframes dp-glint{0%,100%{opacity:.35}50%{opacity:.9}}.dp-glint{animation:dp-glint 5s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.dp-glint{animation:none}}'}</style>
      <svg viewBox="0 0 390 210" width="390" height="210" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="dp-glass" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#3B4A52" /><stop offset=".6" stopColor="#121A1F" /><stop offset="1" stopColor="#05080A" /></radialGradient>
          <linearGradient id="dp-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F2D98C" /><stop offset=".45" stopColor="#B8913C" /><stop offset="1" stopColor="#5E4416" /></linearGradient>
          <linearGradient id="dp-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6B3A1E" /><stop offset=".4" stopColor="#A2602F" /><stop offset="1" stopColor="#3E1F0E" /></linearGradient>
          <linearGradient id="dp-coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4DD92" /><stop offset=".5" stopColor="#C49A3E" /><stop offset="1" stopColor="#7A5A1E" /></linearGradient>
          <radialGradient id="dp-pad" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#7A2A22" /><stop offset="1" stopColor="#3A0E0A" /></radialGradient>
          <filter id="dp-cast" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>

        {/* inkwell: square cut glass, brass collar, ink inside, a dip pen leaning in */}
        <g transform="translate(46 70)">
          <ellipse cx="34" cy="86" rx="40" ry="10" fill="rgba(10,4,0,0.55)" filter="url(#dp-cast)" transform="translate(10 4)" />
          <ellipse cx="32" cy="82" rx="31" ry="6" fill="rgba(10,4,0,0.6)" />
          <path d="M4 34 L60 34 L64 80 L0 80 Z" fill="url(#dp-glass)" stroke="#05080A" strokeWidth="1.2" />
          <path d="M8 38 L18 38 L14 76 L4 76 Z" fill="rgba(255,255,255,0.16)" />
          <path d="M50 38 L56 38 L60 76 L54 76 Z" fill="rgba(255,255,255,0.06)" />
          <rect x="14" y="22" width="36" height="14" rx="3" fill="url(#dp-brass)" stroke="#4A3812" strokeWidth="1" />
          <ellipse cx="32" cy="23" rx="18" ry="4" fill="#0A0A0C" stroke="#4A3812" strokeWidth="1" />
          <ellipse className="dp-glint" cx="27" cy="22.4" rx="6" ry="1.2" fill="rgba(170,190,220,0.55)" />
          <rect x="17" y="25" width="5" height="9" fill="rgba(255,240,200,0.45)" />
          {/* the pen */}
          <g transform="rotate(28 32 22)">
            <rect x="29.5" y="-58" width="5" height="62" rx="2.5" fill="url(#dp-wood)" stroke="#2A1408" strokeWidth=".8" />
            <rect x="29" y="0" width="6" height="7" fill="url(#dp-brass)" stroke="#4A3812" strokeWidth=".6" />
            <path d="M30 7 L34 7 L32 16 Z" fill="#2A2A2E" />
          </g>
        </g>

        {/* rubber stamp on its pad: turned wooden handle, brass ferrule */}
        <g transform="translate(270 92)">
          <ellipse cx="44" cy="70" rx="50" ry="10" fill="rgba(10,4,0,0.5)" filter="url(#dp-cast)" transform="translate(10 4)" />
          <rect x="4" y="52" width="80" height="18" rx="3" fill="#1F1712" stroke="#0A0604" strokeWidth="1" />
          <rect x="8" y="54" width="72" height="11" rx="2" fill="url(#dp-pad)" />
          <rect x="10" y="55" width="40" height="2" fill="rgba(255,200,180,0.18)" />
          <rect x="30" y="38" width="30" height="16" rx="2" fill="#2A1C12" stroke="#0A0604" strokeWidth="1" />
          <rect x="30" y="38" width="30" height="4" fill="rgba(255,230,190,0.18)" />
          <rect x="36" y="26" width="18" height="13" fill="url(#dp-brass)" stroke="#4A3812" strokeWidth="1" />
          <path d="M45 -6 C58 -6 60 8 56 16 C54 22 54 26 54 26 L36 26 C36 26 36 22 34 16 C30 8 32 -6 45 -6 Z" fill="url(#dp-wood)" stroke="#2A1408" strokeWidth="1" />
          <ellipse className="dp-glint" cx="40" cy="2" rx="4" ry="7" fill="rgba(255,230,190,0.35)" style={{ animationDelay: '1.8s' }} />
        </g>

        {/* a short stack of crowns, one lying aside */}
        <g transform="translate(176 142)">
          <ellipse cx="22" cy="40" rx="30" ry="7" fill="rgba(10,4,0,0.5)" filter="url(#dp-cast)" transform="translate(8 3)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${(i % 2) * 1.5} ${32 - i * 6})`}>
              <ellipse cx="20" cy="6" rx="18" ry="5" fill="#6E5216" />
              <rect x="2" y="2" width="36" height="4" fill="url(#dp-coin)" />
              <ellipse cx="20" cy="2" rx="18" ry="5" fill="url(#dp-coin)" stroke="#6E5216" strokeWidth=".6" />
            </g>
          ))}
          <ellipse cx="20" cy="2" rx="9" ry="2.4" fill="none" stroke="#7A5A1E" strokeWidth=".8" transform="translate(0 6)" />
          <g transform="translate(46 30) rotate(-12)">
            <ellipse cx="10" cy="8" rx="13" ry="4" fill="rgba(10,4,0,0.5)" />
            <ellipse cx="10" cy="5" rx="12" ry="4" fill="url(#dp-coin)" stroke="#6E5216" strokeWidth=".6" />
          </g>
          <ellipse className="dp-glint" cx="14" cy="6" rx="6" ry="1.4" fill="rgba(255,248,220,0.7)" style={{ animationDelay: '3.1s' }} />
        </g>
      </svg>
    </div>
  );
}
