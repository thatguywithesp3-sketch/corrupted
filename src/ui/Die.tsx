import { useState } from 'react';

// A real bone die lying on the blank, drawn as an object rather than an icon.
// Three faces in a 3/4 view, lit by the era-I desk lamp upper-left:
//   top = brightest, front = mid, right side = in shade.
// Material: aged bone/ivory with yellowed grain, grime in the pips and corners,
// rubbed-off edges, a few hairline scratches and small chips.
// Pips are drilled: a dark pit, with the lower-right wall catching the lamp.
// Two shadows on the paper: a hard contact line and a soft cast shadow to the lower-right.
// Click → the die hops and tumbles, lands on a new face.

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[27, 27], [73, 73]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[27, 24], [73, 24], [27, 50], [73, 50], [27, 76], [73, 76]]
};
// front value → [top, right] (adjacent faces, never the opposite one)
const SIDES: Record<number, [number, number]> = { 1: [2, 3], 2: [1, 3], 3: [1, 2], 4: [1, 2], 5: [1, 3], 6: [2, 3] };

// face transforms: each face is drawn in a 0..100 square and mapped onto the cube
const FRONT = 'matrix(.34,0,0,.34,8,20)';
const TOP = 'matrix(.34,0,-.11,.11,19,9)';
const RIGHT = 'matrix(.11,-.11,0,.34,42,20)';
const FACE = 'M14 0 H86 Q100 0 100 14 V86 Q100 100 86 100 H14 Q0 100 0 86 V14 Q0 0 14 0 Z';

function Pips({ v, light }: { v: number; light: number }) {
  return (
    <>
      {PIPS[v].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="10.5" fill="rgba(70,50,25,0.35)" />{/* grime ring */}
          <circle cx={x} cy={y} r="9" fill="#1C110A" />
          <circle cx={x - 1.5} cy={y - 1.5} r="6" fill="#0C0704" />{/* pit floor in shadow, upper-left */}
          <path d={`M${x + 8.6} ${y + 2} A9 9 0 0 1 ${x + 2} ${y + 8.6}`} stroke={`rgba(255,238,200,${light})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  );
}

export function Die({ onRoll, label }: { onRoll: () => void; label: string }) {
  const [v, setV] = useState(5);
  const [rolling, setRolling] = useState(0);
  const [top, right] = SIDES[v];
  const roll = () => {
    setRolling((r) => r + 1);
    onRoll();
    window.setTimeout(() => setV((cur) => { let n = cur; while (n === cur) n = 1 + Math.floor(Math.random() * 6); return n; }), 170);
  };
  return (
    <button onClick={roll} aria-label={label} title={label}
      style={{ width: 56, height: 56, flexShrink: 0, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative', WebkitTapHighlightColor: 'transparent' }}>
      <svg width="56" height="56" viewBox="0 0 60 60" style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden="true">
        {/* shadows on the paper: soft cast to the lower-right, hard contact under the base */}
        <path d="M12 52 L44 52 L58 40 L58 30 L46 44 Z" fill="rgba(40,22,6,0.42)" style={{ filter: 'blur(2.6px)' }} />
        <path d="M10 53.2 H42.5 L52 43.6" stroke="rgba(25,12,2,0.7)" strokeWidth="1.6" fill="none" strokeLinecap="round" style={{ filter: 'blur(0.7px)' }} />

      </svg>
      <svg key={rolling} width="56" height="56" viewBox="0 0 60 60" className={rolling ? 'die-roll' : ''} style={{ overflow: 'visible', display: 'block', position: 'relative' }}>
        <defs>
                    <filter id="die-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4 0.25" numOctaves="3" seed="21" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.9 -0.28" />
          </filter>
          <filter id="die-blotch" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="8" />
            <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.12  0 0 0 1.6 -0.7" />
          </filter>
          <linearGradient id="die-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBF2DA" /><stop offset="1" stopColor="#E6D6AE" /></linearGradient>
          <linearGradient id="die-front" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stopColor="#E9DAB2" /><stop offset=".6" stopColor="#D5C293" /><stop offset="1" stopColor="#B9A472" /></linearGradient>
          <linearGradient id="die-right" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#A8925F" /><stop offset="1" stopColor="#7E6B42" /></linearGradient>
          <clipPath id="die-body">
            <path d={FACE} transform={FRONT} /><path d={FACE} transform={TOP} /><path d={FACE} transform={RIGHT} />
          </clipPath>
        </defs>

        {/* faces */}
        <path d={FACE} transform={RIGHT} fill="url(#die-right)" />
        <path d={FACE} transform={TOP} fill="url(#die-top)" />
        <path d={FACE} transform={FRONT} fill="url(#die-front)" />

        {/* material: bone grain, yellowed blotches, grime gathered at the lower corners */}
        <g clipPath="url(#die-body)">
          <rect x="0" y="0" width="60" height="60" filter="url(#die-grain)" opacity=".32" />
          <rect x="0" y="0" width="60" height="60" filter="url(#die-blotch)" opacity=".3" />
          <radialGradient id="die-grime" cx="0" cy="1" r="1"><stop offset="0" stopColor="#4A341A" stopOpacity=".45" /><stop offset=".35" stopColor="#4A341A" stopOpacity="0" /></radialGradient>
          <rect x="8" y="20" width="34" height="34" fill="url(#die-grime)" />
        </g>

        {/* pips on all three faces; the shaded side catches less light */}
        <g transform={TOP}><Pips v={top} light={0.5} /></g>
        <g transform={FRONT}><Pips v={v} light={0.38} /></g>
        <g transform={RIGHT}><Pips v={right} light={0.14} /></g>

        {/* rounded edges: worn-bright ridge where top meets front, darker ridge into the shade */}
        <path d="M11 20.2 H40.5" stroke="rgba(255,250,232,0.85)" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M42.6 22 L42.6 51" stroke="rgba(60,40,15,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M43.2 18.6 L50.6 11.2" stroke="rgba(255,244,215,0.6)" strokeWidth="1" strokeLinecap="round" />
        <path d="M8.4 23 V50" stroke="rgba(255,246,222,0.35)" strokeWidth=".8" strokeLinecap="round" />

        {/* wear: chips on the edges, hairline scratches */}
        <path d="M27 20.4 q1.6 1.4 3.4 0" fill="#A99263" opacity=".8" />
        <path d="M42.6 38 q-1.4 1.6 0 3.2" fill="#8E7848" opacity=".8" />
        <path d="M12 47 l7 -4.5 M30 26 l6 3 M21 13.5 l9 -1.4 M46 33 l2.5 -5" stroke="rgba(255,250,235,0.5)" strokeWidth=".35" fill="none" />
        <path d="M16 31 l4 6 M35 45 l4 -2" stroke="rgba(60,40,15,0.35)" strokeWidth=".35" fill="none" />
      </svg>
      <style>{'@keyframes dieRoll{0%{transform:translate(0,0) rotate(0)}30%{transform:translate(-2px,-9px) rotate(-70deg) scale(.94)}60%{transform:translate(1px,-3px) rotate(-200deg) scale(.97)}82%{transform:translate(0,0) rotate(-350deg)}90%{transform:translate(0,-1px) rotate(-362deg)}100%{transform:translate(0,0) rotate(-360deg)}}.die-roll{animation:dieRoll .5s cubic-bezier(.3,.7,.4,1);transform-origin:30px 34px}@media (prefers-reduced-motion: reduce){.die-roll{animation:none}}button:active>.die-press{transform:translateY(1px)}'}</style>
    </button>
  );
}
