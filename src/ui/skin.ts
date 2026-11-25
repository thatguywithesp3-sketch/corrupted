// Era II's four powers wear the same office differently (docs/era2-concept.md). The skeleton stays: the desk,
// the paper, the plan of the city. What changes is the material under the elbows, the things on the desk, the
// masthead and the rubber stamps on the plan — each power one step further from the empire, never all at once:
//   empire        leather, cut-glass inkwell, crowns           (Era I as it was)
//   provisional   the same leather gone dull, an inkwell, paper money in bundles, the stamp pad
//   vnr           the dull leather, an inkwell, a Valdorian dictionary and new stamps (the ВНР, 1918–1919)
//   civil         a bare plywood board, a tin mug with bread, the field telephone, the stamp pad
//   soviet        red baize, tea in a metal holder, the telephone, the stamp pad
import * as G from '../engine';

export type Skin = 'empire' | 'provisional' | 'vnr' | 'civil' | 'soviet';
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
  vnr: {
    desk: { img: 'linear-gradient(rgba(24,16,8,0.3), rgba(24,16,8,0.3)), url(art/desk/leather.jpg)', size: '100% 100%, 200px 200px' },
    props: [
      { src: 'art/desk/inkwell.png', x: 24, y: 8, w: 108, rot: -4, glint: [24, 18, 0] },
      { src: 'art/desk/notes.png', x: 150, y: 58, w: 120, rot: 5 },
      { src: 'art/desk/pad.png', x: 270, y: 30, w: 100, rot: -4 }
    ],
    paper: { bg: '#EDE5CC', head: '#1F1A14', headFont: "'Ruslan Display', serif", headSize: 28, motto: 'ВАЛЬДОРІЯ ВІЛЬНА · ВИХОДИТЬ ДЕРЖАВНОЮ МОВОЮ', vol: 'Рік I', price: 'Ціна 50 кр.', rule: '#2F4A8A' },
    mapStamp: { t: 'ВАЛЬДОРСЬКА НАРОДНА РЕСПУБЛІКА ·', sub: 'ГУБКОМІСАРІАТ', col: '#2F4A8A', round: true },
    mapNotes: [{ at: 'okhrana', t: 'Державна варта', col: '#4A4038', dx: -4, dy: 9.5 }, { at: 'press', t: 'вивіски — до суботи', col: '#2F4A8A', dx: -10, dy: 8.4 }],
    mapFilter: 'sepia(.12)'
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

// ---- Era II art by power: the same places, the same scenes, drawn anew once the old order is gone
const y = (s: { era: number; year: number }) => (s.era === 2 ? s.year : 0);
/** which drawing of a place to show. Era I: the 1870s. Era II: the war years 1914–1917 (-e2a; the gendarmerie under
 *  the empire, the people's militia from 1917, -e2p), then the institutions under the councils from 1918 and the
 *  magnates' houses under the settled state from 1922 (-e2) */
export function interiorPeriod(s: { era: number; year: number }, id: string): '' | '-e2a' | '-e2p' | '-e2v' | '-e2' {
  if (s.era !== 2) return '';
  if (id.charAt(0) === 'r') return s.year >= 1922 ? '-e2' : '-e2a';
  if (s.year >= 1920) return '-e2';
  // the ВНР keeps the war-years rooms; its State Guard has its own office (okhrana-e2v)
  if (id === 'okhrana' && s.year >= 1918) return '-e2v';
  return id === 'okhrana' && s.year >= 1917 ? '-e2p' : '-e2a';
}
export const interiorSrc = (s: { era: number; year: number }, id: string) => `art/interiors/${id}${interiorPeriod(s, id)}.jpg`;
/** map buildings redrawn for Era II: red flags from the revolution of 1917 (town hall, militia, the paper), the trust and the communal flats from 1922 */
const MAP_E2: Record<string, number> = { ratusha: 1917, gendarm: 1917, orphanage: 1920, press: 1917, market: 1920, station: 1920, foundry: 1922, weisman: 1922, graf: 1922, cathedral: 1922, customs: 1922, univ: 1922, shop1: 1922, shop2: 1922, shop3: 1922, shop4: 1922 };
export const mapArt = (s: { era: number; year: number }, art: string) => (MAP_E2[art] && y(s) >= MAP_E2[art] ? art + '-e2' : art);
/** Era II newspaper sketches: the same scene names, drawn for 1914–1930 (public/art/news/e2) */
const NEWS_E2 = new Set(['garrison', 'docks', 'court', 'quarantine', 'bourse', 'harbour', 'council', 'raid', 'bank', 'heir', 'delegates', 'gendarmes', 'fair', 'fire', 'press', 'estate', 'family', 'contractor', 'insider', 'scandal', 'promo', 'portrait']);
/** scenes whose Era II drawing belongs to the new order: before this year the paper prints the war-years drawing
 *  (public/art/news/e2a, the empire 1914–1916: troop trains, the duma, the imperial court, gendarmes) */
const NEWS_FROM: Record<string, number> = { delegates: 1920, council: 1920, court: 1920, raid: 1920, bank: 1920, estate: 1920, heir: 1920, gendarmes: 1917, fair: 1921, harbour: 1920, bourse: 1917, portrait: 1917 };
export function newsSrc(s: { era: number; year: number }, scene: string): string {
  if (s.era !== 2 || !NEWS_E2.has(scene)) return `art/news/${scene}.jpg`;
  return NEWS_FROM[scene] && s.year < NEWS_FROM[scene] ? `art/news/e2a/${scene}.jpg` : `art/news/e2/${scene}.jpg`;
}

/** a shop inside: public/art/interiors/biz/<slug>.jpg (Era I, the 1870s) and <slug>-e2.jpg (Era II, 1914–1930s) */
const BIZ_SLUG: Record<string, string> = {
  'бакалійна лавка': 'grocery', 'аптека': 'pharmacy', 'шинок': 'tavern', 'кравецька майстерня': 'tailor', 'пекарня': 'bakery',
  'ювелірна крамниця': 'jeweller', 'друкарня': 'printshop', 'винний склад': 'winestore', 'цукерня': 'confectioner',
  'годинникова майстерня': 'watchmaker', 'ломбард': 'pawnshop', 'кав’ярня': 'cafe', 'готель': 'hotel', 'тютюнова крамниця': 'tobacco',
  'зерновий склад': 'granary', 'лазня': 'bathhouse', 'книгарня': 'bookshop', 'залізничний буфет': 'buffet', 'вугільний склад': 'coalyard',
  'ливарня': 'foundry', 'візницька біржа': 'cabstand', 'фотоательє': 'photo'
};
export const bizInterior = (s: { era: number }, kind: string) => (s.era <= 2 && BIZ_SLUG[kind] ? `art/interiors/biz/${BIZ_SLUG[kind]}${s.era === 2 ? '-e2' : ''}.jpg` : null);

/** the printed plan itself, by power: the paper, the ink, the lettering, the district names, what is in the harbour.
 *  The empire's plan is Era I's; the civil war scrawls barricades and burnt blocks over it; the councils reprint it
 *  in 1922 as a cheaper municipal edition with new names. */
export type PlanLook = {
  /** 'engraving' — the hand-tinted plan of Era I; 'plan' — the municipal survey of Era II (flat tints, grid) */
  style: 'engraving' | 'plan';
  paper: string; ink: string; roofs: string[]; font: string; caps: boolean; steam: boolean; war: boolean;
  title: string; sub: string; names: Partial<Record<string, string>>; places: Partial<Record<string, string>>;
};
const PLAN_OLD: PlanLook = { style: 'engraving', paper: '#E8DBB8', ink: '#2A2014', roofs: ['#D9C39C', '#D0B58E', '#C8C0A8'], font: 'Old Standard TT, serif', caps: false, steam: false, war: false, title: 'ПОРТ-АУРУМ', sub: 'план міста', names: {}, places: {} };
const PLAN_SOVIET: PlanLook = {
  style: 'plan', paper: '#E6E1CF', ink: '#232A30', roofs: ['#CFC6AE', '#C4BDA8', '#BDBAAE'], font: "'PT Sans', sans-serif", caps: true, steam: true, war: false,
  title: 'ПОРТ-АУРУМ', sub: 'план міста · губкомунгосп', names: { hill: 'Пагорб Свободи', podil: 'Червоний Поділ', sloboda: 'Робітнича слобода' },
  places: { Ратуша: 'Міськвиконком', Ливарня: '«Аурумсталь»', Собор: 'Собор (зачинено)' }
};
// Era II is a survey plan throughout; the empire's edition keeps the old names, the councils rename the city
const PLAN_E2 = { style: 'plan' as const, paper: '#E9E4D2', ink: '#262626', font: "'PT Sans', sans-serif", caps: true, steam: true };
const PLAN_1914: PlanLook = { ...PLAN_OLD, ...PLAN_E2, title: 'ПОРТ-АУРУМ', sub: 'план міста · управа · 1914' };
const PLAN_CIVIL: PlanLook = { ...PLAN_OLD, ...PLAN_E2, war: true, title: 'ПОРТ-АУРУМ', sub: 'план міста · зі штабу' };
/** one object per power, so the memoised plan only redraws when the power changes */
export function planLook(s: { era: number; year: number }): PlanLook {
  if (s.era !== 2) return PLAN_OLD;
  const reg = G.regimeOf(s);
  return reg === 'soviet' ? PLAN_SOVIET : reg === 'civil' ? PLAN_CIVIL : PLAN_1914;
}

/** the state's sign on letterheads and official letters (art/LORE.md → «Символіка»): the empire's falcon until 1917,
 *  nothing under the Provisional Government, the Valdorian flag under the ВНР, the СРС anchor and hammer in the
 *  civil war, the СТСД arms from 1922 */
/** gold on red needs a red ground: on paper the new state's signs are printed in black ink */
export const ARMS_INK = 'brightness(0) opacity(0.82)';
export function stateArms(s: { era: number; year: number }): { src: string; alt: string; label: string; ink?: boolean } | null {
  const reg = s.era === 1 ? 'empire' : G.regimeOf(s);
  if (reg === 'empire') return { src: 'art/brand/romei-arms.png', alt: 'Герб Ромейської імперії', label: 'КАНЦЕЛЯРІЯ ГУБЕРНАТОРА ВАЛЬДОРІЇ' };
  if (reg === 'vnr') return { src: 'art/brand/vnr-flag.svg', alt: 'Прапор Вальдорської Народної Республіки: жовтий, чорний, блакитний', label: 'ВАЛЬДОРСЬКА НАРОДНА РЕСПУБЛІКА · ГУБКОМІСАРІАТ' };
  if (reg === 'civil') return { src: 'art/brand/srs-emblem.png', alt: 'Емблема Союзу Ромейських Соціалістів: якір і молот', label: 'ГУБЕРНСЬКИЙ РЕВКОМ', ink: true };
  if (reg === 'soviet') return { src: 'art/brand/ststd-arms.png', alt: 'Герб Союзу Трудових Соціалістичних Держав', label: 'ГУБВИКОНКОМ · СТСД', ink: true };
  return null;
}
