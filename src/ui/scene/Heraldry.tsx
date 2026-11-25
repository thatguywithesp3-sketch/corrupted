// The symbols of the world (art/LORE.md → «Символіка»).
// Romean Empire: a red-white-yellow tricolour; the state flag carries the arms in the white band.
// The arms: a black gyrfalcon (кречет) under a crown, holding a key (money, the «key to the Third Rome») and an anchor
// (the port), on a white-over-yellow shield; the official drawing is public/art/brand/romei-arms.png. The same falcon is
// on the coins of the Romean crown and on the emperor's order.
// The crown sign: Р under a crown. Valdoria: yellow-black-blue (sunny sky, land, sea), banned until Era IV.
import type { CSSProperties } from 'react';

export const ROMEI = { red: '#B8322A', white: '#F4EFE2', yellow: '#E2B33C', ink: '#1F1A14' };
export const VALDOR = { blue: '#5B9BD5', black: '#1F1A14', yellow: '#E8C33A' };

/** the crowned gyrfalcon alone, centred on (0, 0): about 44 wide, from the crown (y -26) to the tail (y 18).
 * Wings displayed, head turned to the right, a key in the left talon and an anchor in the right, as on the official arms
 * (public/art/brand/romei-arms.png). */
export function RomeiFalcon({ color = ROMEI.ink, line = ROMEI.ink, tools = ROMEI.ink, eye = ROMEI.white }: { color?: string; line?: string; tools?: string; eye?: string }) {
  return (
    <g strokeLinejoin="round">
      <g fill={color} stroke={line} strokeWidth=".5">
        {/* wings raised and spread, long primaries */}
        <path d="M-3.6 -5 C-8 -11 -13 -16 -20.5 -20 C-19 -17 -18.4 -15 -18.6 -13.4 L-21.6 -12.6 L-18.4 -10 L-21.4 -8.4 L-17.8 -6 L-20.2 -3.8 L-16.4 -2.6 L-18 .2 L-13.4 -.4 L-14 2.6 L-9.6 1.2 L-4 3.4 Z" />
        <path d="M3.6 -5 C8 -11 13 -16 20.5 -20 C19 -17 18.4 -15 18.6 -13.4 L21.6 -12.6 L18.4 -10 L21.4 -8.4 L17.8 -6 L20.2 -3.8 L16.4 -2.6 L18 .2 L13.4 -.4 L14 2.6 L9.6 1.2 L4 3.4 Z" />
        {/* tail fan */}
        <path d="M-3 7.6 L-5.6 16.6 L-2.6 15 L0 18 L2.6 15 L5.6 16.6 L3 7.6 Z" />
        {/* body: a falcon's narrow, deep chest */}
        <path d="M-4 -6.6 C-5.4 -1 -4.6 5 -2.6 9 L2.6 9 C4.6 5 5.4 -1 4 -6.6 C2.6 -8.6 -2.6 -8.6 -4 -6.6 Z" />
        {/* head turned to the right, with the hooked beak */}
        <path d="M-2.2 -8 C-3.4 -11.6 -2 -15.8 1.4 -16.2 C4.2 -16.4 5.8 -14.6 5.6 -12.6 L3 -9.6 C2 -8.4 -.6 -7.6 -2.2 -8 Z" />
        <path d="M5 -14.6 C7.4 -14.8 8.6 -13.2 7.6 -11 L6.6 -11.8 L5.4 -12.2 Z" />
        {/* legs */}
        <path d="M-2.6 5 L-7.4 9 L-6.2 10.2 L-1.6 7 Z M2.6 5 L7.4 9 L6.2 10.2 L1.6 7 Z" />
      </g>
      {/* eye and the dark «moustache» stripe of a falcon */}
      <circle cx="2.6" cy="-13.4" r=".75" fill={eye} />
      <path d="M2.2 -12.4 L1.4 -9.8" stroke={eye} strokeWidth=".35" strokeOpacity=".6" />
      {/* a small closed crown over the head */}
      <path d="M-2.4 -21.6 L-1.2 -19.2 L.6 -21.4 L2.4 -19.2 L3.6 -21.6 L3.6 -18 L-2.4 -18 Z" fill={ROMEI.yellow} stroke={line === ROMEI.ink ? '#7A5A14' : line} strokeWidth=".5" />
      <path d="M.6 -21.4 V-23.4 M-.3 -22.5 H1.5" stroke={ROMEI.yellow} strokeWidth=".6" />
      {/* key in the left talon (money, the key to the Third Rome), anchor in the right (the port) */}
      <g stroke={tools} strokeWidth="1.3" fill="none" strokeLinecap="round">
        <circle cx="-8.4" cy="8.2" r="1.9" />
        <path d="M-8.4 10.1 V20.6 M-8.4 20.6 H-11.2 M-8.4 17.6 H-10.8" />
        <circle cx="8.4" cy="8.4" r="1.1" />
        <path d="M8.4 9.5 V20 M4.6 17 Q8.4 22.4 12.2 17 M6.4 12 H10.4" />
      </g>
    </g>
  );
}

/** the full arms: the crowned gyrfalcon on a white-over-yellow shield */
export function RomeiArms({ size = 64, style, title = 'Герб Ромейської імперії' }: { size?: number; style?: CSSProperties; title?: string }) {
  return (
    <svg viewBox="-26 -29 52 66" width={size} height={size * (66 / 52)} style={style} role="img" aria-label={title}>
      <path d="M-24 -27 H24 V6 Q24 28 0 36 Q-24 28 -24 6 Z" fill={ROMEI.white} />
      <path d="M-24 14 H24 Q22 28 0 36 Q-22 28 -24 14 Z" fill={ROMEI.yellow} />
      <path d="M-24 -27 H24 V6 Q24 28 0 36 Q-24 28 -24 6 Z" fill="none" stroke="#6E1C16" strokeWidth="1.4" />
      <RomeiFalcon tools="#3A2A10" />
    </svg>
  );
}

/** the Romean flag: red, white, yellow; the state flag (arms) carries the gyrfalcon in the white band */
export function RomeiFlag({ w = 36, arms = true, style }: { w?: number; arms?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 72 48" width={w} height={(w * 2) / 3} style={style} role="img" aria-label={arms ? 'Державний прапор Ромейської імперії' : 'Прапор Ромейської імперії'}>
      <rect width="72" height="16" fill={ROMEI.red} />
      <rect y="16" width="72" height="16" fill={ROMEI.white} />
      <rect y="32" width="72" height="16" fill={ROMEI.yellow} />
      {arms && <g transform="translate(36 25.2) scale(.37)"><RomeiFalcon tools={ROMEI.red} /></g>}
      <rect width="72" height="48" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
    </svg>
  );
}

/** the banned Valdorian flag: yellow, black, blue (sunny sky, land, sea) */
export function ValdorFlag({ w = 36, style }: { w?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 72 48" width={w} height={(w * 2) / 3} style={style} role="img" aria-label="Вальдорський прапор">
      <rect width="72" height="16" fill={VALDOR.yellow} />
      <rect y="16" width="72" height="16" fill={VALDOR.black} />
      <rect y="32" width="72" height="16" fill={VALDOR.blue} />
    </svg>
  );
}

/** the crown sign: Р under a crown, in a coin. Same drawing as the `cr` icon of Era I (era1.json → theme.icons) */
export const CROWN_SIGN_PATH = 'M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 1 0 0-19z M8.6 9.2 8.1 5.6l2 1.5L12 4.8l1.9 2.3 2-1.5-.5 3.6z M10.2 18.4V10.4h2.9a2.2 2.2 0 0 1 0 4.4h-2.9';
