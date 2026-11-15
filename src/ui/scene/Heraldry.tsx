// The symbols of the world (art/LORE.md → «Символіка»).
// Romean Empire: a red-white-yellow tricolour; the state flag carries the arms in the white band.
// The arms: a double-headed eagle holding an anchor (the port) and a key (money, the «key to the Third Rome»),
// on a white-over-yellow shield. The same eagle is on the obverse of the Romean crown.
// The crown sign: Р under a crown. Valdoria: blue-black-yellow (sea, land, sun), banned until Era IV.
import type { CSSProperties } from 'react';

export const ROMEI = { red: '#B8322A', white: '#F4EFE2', yellow: '#E2B33C', ink: '#1F1A14' };
export const VALDOR = { blue: '#5B9BD5', black: '#1F1A14', yellow: '#E8C33A' };

/** the eagle alone, centred on (0, 0): about 44 wide, from the crown (y -25) to the tail (y 17) */
export function RomeiEagle({ color = ROMEI.red, line = '#6E1C16', tools = ROMEI.ink }: { color?: string; line?: string; tools?: string }) {
  return (
    <g strokeLinejoin="round">
      <g fill={color} stroke={line} strokeWidth=".6">
        {/* raised wings with fanned feathers */}
        <path d="M-3 -5 C-8 -9 -14 -14 -20 -19 L-19.2 -14 L-22 -13 L-19.4 -9 L-22 -7.4 L-18.6 -4 L-20.4 -1.6 L-16.4 .6 L-17.4 3 L-4 3.6 Z" />
        <path d="M3 -5 C8 -9 14 -14 20 -19 L19.2 -14 L22 -13 L19.4 -9 L22 -7.4 L18.6 -4 L20.4 -1.6 L16.4 .6 L17.4 3 L4 3.6 Z" />
        {/* tail */}
        <path d="M-3 7 L-6.6 15 L-3 13.4 L0 17 L3 13.4 L6.6 15 L3 7 Z" />
        {/* body */}
        <path d="M-3.4 -7 C-4.6 -2 -4.6 4 -3 8 L3 8 C4.6 4 4.6 -2 3.4 -7 Z" />
        {/* necks and heads turned apart */}
        <path d="M-2 -7 C-2.6 -10 -4 -13 -6 -15.2 L-4 -17.4 C-1.6 -15 0 -11 0 -7 Z" />
        <path d="M2 -7 C2.6 -10 4 -13 6 -15.2 L4 -17.4 C1.6 -15 0 -11 0 -7 Z" />
        <circle cx="-6.4" cy="-17.6" r="2.6" />
        <circle cx="6.4" cy="-17.6" r="2.6" />
        <path d="M-8.8 -18.4 L-12 -17.2 L-9.4 -16.4 Z M8.8 -18.4 L12 -17.2 L9.4 -16.4 Z" />
        {/* legs */}
        <path d="M-3 4 L-7.6 7.6 L-6.4 8.8 L-2 6 Z M3 4 L7.6 7.6 L6.4 8.8 L2 6 Z" />
      </g>
      <circle cx="-7.2" cy="-18.2" r=".55" fill={ROMEI.white} />
      <circle cx="7.2" cy="-18.2" r=".55" fill={ROMEI.white} />
      {/* the crown over both heads */}
      <path d="M-4 -25 L-2.6 -21.6 L0 -24.6 L2.6 -21.6 L4 -25 L4 -20.2 L-4 -20.2 Z" fill={ROMEI.yellow} stroke={line} strokeWidth=".6" />
      {/* anchor in the left claw (the port), key in the right (money) */}
      <g stroke={tools} strokeWidth="1.3" fill="none" strokeLinecap="round">
        <circle cx="-8.6" cy="7.4" r="1.1" />
        <path d="M-8.6 8.5 V19 M-12.4 16 Q-8.6 21.4 -4.8 16 M-10.6 11 H-6.6" />
        <circle cx="8.6" cy="7.6" r="1.8" />
        <path d="M8.6 9.4 V20 M8.6 20 H11.4 M8.6 17 H11" />
      </g>
    </g>
  );
}

/** the full arms: the eagle on a white-over-yellow shield */
export function RomeiArms({ size = 64, style, title = 'Герб Ромейської імперії' }: { size?: number; style?: CSSProperties; title?: string }) {
  return (
    <svg viewBox="-26 -29 52 66" width={size} height={size * (66 / 52)} style={style} role="img" aria-label={title}>
      <path d="M-24 -27 H24 V6 Q24 28 0 36 Q-24 28 -24 6 Z" fill={ROMEI.white} />
      <path d="M-24 14 H24 Q22 28 0 36 Q-22 28 -24 14 Z" fill={ROMEI.yellow} />
      <path d="M-24 -27 H24 V6 Q24 28 0 36 Q-24 28 -24 6 Z" fill="none" stroke="#6E1C16" strokeWidth="1.4" />
      <RomeiEagle />
    </svg>
  );
}

/** the Romean flag: red, white, yellow; the state flag (arms) carries the eagle in the white band */
export function RomeiFlag({ w = 36, arms = true, style }: { w?: number; arms?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 72 48" width={w} height={(w * 2) / 3} style={style} role="img" aria-label={arms ? 'Державний прапор Ромейської імперії' : 'Прапор Ромейської імперії'}>
      <rect width="72" height="16" fill={ROMEI.red} />
      <rect y="16" width="72" height="16" fill={ROMEI.white} />
      <rect y="32" width="72" height="16" fill={ROMEI.yellow} />
      {arms && <g transform="translate(36 25.3) scale(.37)"><RomeiEagle color={ROMEI.ink} line={ROMEI.ink} tools={ROMEI.red} /></g>}
      <rect width="72" height="48" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
    </svg>
  );
}

/** the banned Valdorian flag: blue, black, yellow (sea, land, sun) */
export function ValdorFlag({ w = 36, style }: { w?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 72 48" width={w} height={(w * 2) / 3} style={style} role="img" aria-label="Вальдорський прапор">
      <rect width="72" height="16" fill={VALDOR.blue} />
      <rect y="16" width="72" height="16" fill={VALDOR.black} />
      <rect y="32" width="72" height="16" fill={VALDOR.yellow} />
    </svg>
  );
}

/** the crown sign: Р under a crown, in a coin. Same drawing as the `cr` icon of Era I (era1.json → theme.icons) */
export const CROWN_SIGN_PATH = 'M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 1 0 0-19z M8.6 9.2 8.1 5.6l2 1.5L12 4.8l1.9 2.3 2-1.5-.5 3.6z M10.2 18.4V10.4h2.9a2.2 2.2 0 0 1 0 4.4h-2.9';
