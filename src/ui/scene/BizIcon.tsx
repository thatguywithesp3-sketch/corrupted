// One small line-drawn emblem per kind of business, shared by the map pins and the owner's blank.
import type { CSSProperties } from 'react';

const P: Record<string, string> = {
  'бакалійна лавка': 'M8 7h8l3 4v9H5v-9z M9 7L8 4h8l-1 3 M9 14h6',
  'аптека': 'M9 3.5h6V7H9z M7.5 7h9V20h-9z M12 10v6 M9 13h6',
  'шинок': 'M5 8h10v12H5z M15 10h3.5v6H15 M7 5c1-1.5 2 .5 3 -.5s2 .5 3 -.5 M8 11v6 M12 11v6',
  'кравецька майстерня': 'M8.5 16.5L18 4 M15.5 16.5L6 4 M7 15.5a2.6 2.6 0 100 .1 M17 15.5a2.6 2.6 0 100 .1 M3 21h18',
  'пекарня': 'M3.5 14c0-4.5 3.5-8 8.5-8s8.5 3.5 8.5 8v4h-17z M8.5 10.5l2 3 M12.5 9.5l2 3 M16.5 11l1.5 2.5',
  'ювелірна крамниця': 'M6 4h12l4 6-10 11L2 10z M2 10h20 M9 4l-2 6 5 11 5-11-2-6',
  'друкарня': 'M4 4.5h16v15H4z M7 8h5v4H7z M14 8h3 M14 11h3 M7 15h10 M7 17.5h7',
  'винний склад': 'M7 3.5h10c2.2 3.5 2.2 13.5 0 17H7c-2.2-3.5-2.2-13.5 0-17z M5.8 8.5h12.4 M5.8 15.5h12.4 M12 3.5v17',
  'цукерня': 'M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 100-9z M7.8 12L2.5 8v8z M16.2 12l5.3-4v8z M10 11a2.5 2.5 0 012-1.5',
  'годинникова майстерня': 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 100-17z M12 7v5.2l3.6 2.2 M12 3.5v1.6 M12 18.9v1.6 M3.5 12h1.6 M18.9 12h1.6',
  'ломбард': 'M8 4.5a3 3 0 100 6 3 3 0 100-6z M16 4.5a3 3 0 100 6 3 3 0 100-6z M12 13a3 3 0 100 6 3 3 0 100-6z M10.5 10.5l.8 2.6 M13.5 10.5l-.8 2.6',
  'кав’ярня': 'M4.5 9.5h11v5.5a4 4 0 01-4 4h-3a4 4 0 01-4-4z M15.5 10.5h2a2.3 2.3 0 010 4.6h-2 M8 3.5c0 1.2 1.2 1.2 1.2 2.6 M12 3.5c0 1.2 1.2 1.2 1.2 2.6 M3 21h14',
  'готель': 'M3.5 17.5h17 M5.5 17.5a6.5 6.5 0 0113 0 M12 8.5V6 M10 6h4 M3 20.5h18 M9 13a3.5 3.5 0 012.5-2.2',
  'тютюнова крамниця': 'M13.5 8h5.5v7a3.2 3.2 0 01-3.2 3.2h-2.3z M13.5 16.5H3.5 M3.5 15v3 M15 5.5c1.4-1.2-1.4-2.3 0-4 M18 5.5c1.4-1.2-1.4-2.3 0-4',
  'зерновий склад': 'M12 21V8 M12 8.5c-3.2 0-4.2-2.2-4.2-4.5 3.2 0 4.2 2.2 4.2 4.5z M12 8.5c3.2 0 4.2-2.2 4.2-4.5-3.2 0-4.2 2.2-4.2 4.5z M12 14c-3.2 0-4.2-2.2-4.2-4.5 3.2 0 4.2 2.2 4.2 4.5z M12 14c3.2 0 4.2-2.2 4.2-4.5-3.2 0-4.2 2.2-4.2 4.5z M12 19.5c-3 0-4-2-4-4 3 0 4 2 4 4z M12 19.5c3 0 4-2 4-4-3 0-4 2-4 4z',
  'лазня': 'M3.5 14h17v2a4 4 0 01-4 4h-9a4 4 0 01-4-4z M8 11.5c0-2.2 2-2.2 2-4.5 M12 11.5c0-2.2 2-2.2 2-4.5 M16 11.5c0-2.2 2-2.2 2-4.5'
};
const FALLBACK = 'M4 20V10l8-6 8 6v10z M10 20v-6h4v6';

export function BizIcon({ kind, size = 22, color = '#1F1A14', sw = 1.7, style }: { kind: string; size?: number; color?: string; sw?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }} aria-hidden="true">
      <path d={P[kind] || FALLBACK} />
    </svg>
  );
}

/** the same glyph as an SVG fragment, for placing inside the map's own <svg> */
export function BizGlyph({ kind, x, y, size, color = '#1F1A14', sw = 1.8 }: { kind: string; x: number; y: number; size: number; color?: string; sw?: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[kind] || FALLBACK} />
    </svg>
  );
}
