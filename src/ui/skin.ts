// Era II's four powers wear the same office differently (docs/era2-concept.md). The skeleton stays: the desk,
// the paper, the plan of the city. What changes is the material under the elbows, the things on the desk, the
// masthead and the rubber stamps on the plan — each power one step further from the empire, never all at once:
//   empire        leather, cut-glass inkwell, crowns           (Era I as it was)
//   provisional   the same leather gone dull, an inkwell, paper money in bundles, the stamp pad
//   civil         a bare plywood board, a tin mug with bread, the field telephone, the stamp pad
//   soviet        red baize, tea in a metal holder, the telephone, the stamp pad
import * as G from '../engine';

export type Skin = 'empire' | 'provisional' | 'civil' | 'soviet';
export const skinOf = (s: { era: number; year: number }): Skin => G.regimeOf(s) || 'empire';

type Prop = { src: string; x: number; y: number; w: number; rot?: number; glint?: [number, number, number] };

export const SKIN: Record<Skin, {
  /** the blotter: background-image and background-size for the leather pad under the papers */
  desk: { img: string; size: string };
  props: Prop[];
  paper: { bg: string; head: string; headFont: string; headSize: number; motto: string; vol: string; price: string; rule: string };
  /** the stamp on the city plan, if this power has put one there (round: `t` runs around the rim, `sub` across) */
  mapStamp: { t: string; sub: string; col: string; round: boolean } | null;
  /** pencil notes the official has made on his plan: next to an institution */
  mapNotes: { at: G.InstId; t: string; col: string; ring?: boolean; dx: number; dy: number }[];
  /** the plan's paper ages with each power */
  mapFilter: string;
}> = {
  empire: {
    desk: { img: 'linear-gradient(rgba(10,20,12,0.18), rgba(10,20,12,0.18)), url(art/desk/leather.jpg)', size: '100% 100%, 200px 200px' },
    props: [
      { src: 'art/desk/inkwell.png', x: 28, y: 8, w: 112, rot: -4, glint: [24, 18, 0] },
      { src: 'art/desk/coins.png', x: 160, y: 62, w: 106, rot: 4, glint: [40, 10, 2.4] },
      { src: 'art/desk/stamp.png', x: 282, y: 4, w: 78, rot: 3, glint: [38, 14, 4.1] }
    ],
    paper: { bg: '#EFE7D2', head: '#1F1A14', headFont: "'Ruslan Display', serif", headSize: 28, motto: 'МІСТО · ТОРГІВЛЯ · ГРОМАДСЬКІ РОБОТИ · ВИХОДИТЬ ЩОРАНКУ', vol: 'Т. XIV', price: 'Ціна 5 кр.', rule: '#1F1A14' },
    mapStamp: null,
    mapNotes: [],
    mapFilter: 'none'
  },
  provisional: {
    desk: { img: 'linear-gradient(rgba(30,14,6,0.34), rgba(30,14,6,0.34)), url(art/desk/leather.jpg)', size: '100% 100%, 200px 200px' },
    props: [
      { src: 'art/desk/inkwell.png', x: 24, y: 8, w: 108, rot: -4, glint: [24, 18, 0] },
      { src: 'art/desk/notes.png', x: 150, y: 58, w: 120, rot: -6 },
      { src: 'art/desk/pad.png', x: 270, y: 30, w: 100, rot: 5 }
    ],
    paper: { bg: '#ECE4CE', head: '#1F1A14', headFont: "'Ruslan Display', serif", headSize: 28, motto: 'СВОБОДА · ЗАКОННІСТЬ · ДО УСТАНОВЧИХ ЗБОРІВ', vol: 'Т. I', price: 'Ціна 20 кр.', rule: '#1F1A14' },
    mapStamp: { t: 'ТИМЧАСОВИЙ УРЯД · ПОРТ-АУРУМ ·', sub: 'КОМІСАРІАТ', col: '#5B3F8C', round: true },
    mapNotes: [{ at: 'okhrana', t: 'колишня жандармерія', col: '#4A4038', dx: -4, dy: 9.5 }],
    mapFilter: 'sepia(.08)'
  },
  civil: {
    desk: { img: 'linear-gradient(rgba(20,12,4,0.2), rgba(20,12,4,0.2)), url(art/desk/plywood.jpg)', size: '100% 100%, 260px 260px' },
    props: [
      { src: 'art/desk/mug.png', x: 18, y: 50, w: 132, rot: -3 },
      { src: 'art/desk/phone.png', x: 170, y: 0, w: 78, rot: 2, glint: [40, 12, 1.2] },
      { src: 'art/desk/pad.png', x: 266, y: 34, w: 100, rot: -5 }
    ],
    paper: { bg: '#E3DCC6', head: '#2A2420', headFont: "'PT Sans', sans-serif", headSize: 30, motto: 'ВСЯ ВЛАДА — РАДАМ · ВИХОДИТЬ, КОЛИ Є ПАПІР', vol: 'Рік II', price: 'Ціна 500 кр.', rule: '#2A2420' },
    mapStamp: { t: 'РЕВКОМ', sub: 'ПЕРЕВІРЕНО', col: '#5B3F8C', round: false },
    mapNotes: [{ at: 'okhrana', t: 'обходити', col: '#A3241C', ring: true, dx: -4, dy: 9.5 }, { at: 'whisper', t: 'хліб — по картках', col: '#2F4A8A', dx: 0, dy: 8.6 }],
    mapFilter: 'sepia(.22) saturate(.8)'
  },
  soviet: {
    desk: { img: 'linear-gradient(rgba(40,0,0,0.08), rgba(40,0,0,0.08)), url(art/desk/baize.jpg)', size: '100% 100%, 220px 220px' },
    props: [
      { src: 'art/desk/tea.png', x: 30, y: 18, w: 86, rot: -2, glint: [30, 22, 0.6] },
      { src: 'art/desk/phone.png', x: 160, y: 0, w: 78, rot: -2, glint: [40, 12, 3.2] },
      { src: 'art/desk/pad.png', x: 262, y: 36, w: 100, rot: 4 }
    ],
    paper: { bg: '#EAE3CF', head: '#A3241C', headFont: "'PT Sans', sans-serif", headSize: 30, motto: 'ОРГАН ГУБКОМУ СРС І ГУБВИКОНКОМУ', vol: 'Рік {n}', price: 'Ціна 5 кр.', rule: '#A3241C' },
    mapStamp: { t: 'ГУБВИКОНКОМ · ПОРТ-АУРУМ ·', sub: 'ЗАТВЕРДЖЕНО', col: '#A3241C', round: true },
    mapNotes: [{ at: 'okhrana', t: 'т. Кречетов', col: '#4A4038', ring: true, dx: -4, dy: 9.5 }, { at: 'press', t: 'передовицю — вивчити', col: '#A3241C', dx: -10, dy: 8.4 }],
    mapFilter: 'sepia(.15) saturate(.85)'
  }
};

/** the skin for a state (Era I and everything outside Era II keep the empire's) */
export const skin = (s: { era: number; year: number }) => SKIN[skinOf(s)];
