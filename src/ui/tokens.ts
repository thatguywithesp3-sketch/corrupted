// Design tokens: the only spacing and type values the UI may use (see art/DESIGN.md).
export const SPACE = [0, 2, 4, 8, 12, 16, 20, 24, 32] as const;
export const TYPE = { micro: 10, caption: 12, small: 14, body: 16, lead: 18, title: 22, display: 28 } as const;
export const BTN = { pad: '12px 16px', minH: 48, minHMain: 52, font: 16, cardPad: 12 } as const;

/** nearest value on the spacing scale (sign kept) */
export const snapSpace = (v: number) => {
  const a = Math.abs(v);
  if (a === 0) return 0;
  if (a > 32) return v;
  const best = [2, 4, 8, 12, 16, 20, 24, 32].reduce((b, x) => (Math.abs(x - a) < Math.abs(b - a) || (Math.abs(x - a) === Math.abs(b - a) && x < b) ? x : b), 2);
  return Math.sign(v) * best;
};
/** nearest value on the type scale; display sizes above 32 stay as they are */
export const snapType = (v: number) => {
  if (v > 32) return v;
  const S = [10, 12, 14, 16, 18, 22, 28];
  return S.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) || (Math.abs(x - v) === Math.abs(b - v) && x > b) ? x : b), 10);
};
