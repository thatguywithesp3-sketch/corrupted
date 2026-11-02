// Port-Aurum as a living city: businesses that open, pay, resist and complain; a small economy;
// the morning paper reports it all. Each morning the official can make ONE move against one business
// (an inspection, sealing it, or offering a "roof"). Everything here runs on its own RNG stream (city.rng),
// so the core game stays bit-identical to the prototype when the city is not touched.
import { clamp100, fmt } from './text';
import type { GameState } from './types';
import { DISTRICTS, getPlan, type District } from './cityplan';
export { DISTRICTS, type District } from './cityplan';

/** bump when the map or the shape of the city changes: older saves get a fresh city */
export const CITY_V = 4;

/** Numbers that decide how hard the rivals are. Tuned with the simulator (npm run sim:city). */
export const CITY_RULES = {
  rivalsOn: true,
  heldInspect: 0.25, // inspecting a shop under somebody else's roof works this much worse
  grace: 2, // years in office before the magnates start hunting (they only expand)
  expandW: 3, huntBase: 1.1, huntPerHeat: 0.7, poachFrom: 3, restW: 0.8,
  smear: { threat: 3, people: 2 }, inform: { patron: 4, threat: 3 }, poachChance: 0.5, boycott: 150,
  allyShield: 1, // risk an allied house takes off us every year
  bribeBase: 150, bribePerPower: 6, bribeDrop: 3, exposeDamage: 14, marryHeat: 4
};

const initRivals = (): Rival[] => [
  { id: 'r1', name: 'Пан Вайсман', title: 'купець першої гільдії', style: 'expander', color: '#2E5E8E', power: 38, heat: 1, ally: false, focus: 'port', last: '' },
  { id: 'r2', name: 'Пані Берг', title: 'власниця «Голосу Порту»', style: 'smear', color: '#7A3F8E', f: true, power: 30, heat: 2, ally: false, focus: 'old', last: '' },
  { id: 'r3', name: 'Граф Ґжеґожевський', title: 'старий рід із Замкового пагорба', style: 'informer', color: '#9A5A22', power: 34, heat: 1, ally: false, focus: 'hill', last: '' }
];
const sx = (r: Rival, m: string, f: string) => (r.f ? f : m);
export const rivalOf = (c: CityState, id?: string | null) => c.rivals.find((r) => r.id === id) || null;


// ---------------------------------------------------------------- types

export type BizStatus = 'open' | 'roof' | 'closed';
export type BizAct = 'inspect' | 'seal' | 'roof' | 'outbid';
export type RivalAct = 'bribe' | 'expose' | 'marry';
export type RivalStyle = 'expander' | 'smear' | 'informer';

/** A local magnate: wants the same shops and roofs we do, and hunts us when he is angry. */
export interface Rival {
  id: string; name: string; title: string; style: RivalStyle; color: string; f?: boolean; // f: a woman
  power: number; // 0..100 clout in the city
  heat: number; // 0..10 how much he wants us gone
  ally: boolean; // bound to us by marriage
  focus: District; // where he likes to expand
  last: string; // what he did last night
}

export interface Biz {
  id: string;
  kind: string;
  name: string;
  owner: string;
  district: District;
  x: number; y: number; // map position, 0..200 × 0..140 (the centre of its lot)
  lot: number; // id of the lot (house) on the plan it stands on
  wealth: number; // yearly takings that matter to us, kr.
  pressure: number; // 0..3 how hard we have leaned on it
  grudge: number; // 0..3 how much the owner hates us
  tie: 'patron' | 'press' | null; // owner's friends
  status: BizStatus;
  opened: number; // year
  tribute: number; // yearly payment while under our "roof"
  rival?: string | null; // id of the magnate who holds the roof instead of us
}

export interface Econ { treasury: number; grain: number; trade: number; crown: number }

export interface CityNews { kind: 'open' | 'rumor' | 'flavor' | 'complaint' | 'closed' | 'roof' | 'rival' | 'attack'; head: string; text: string; biz?: string; rival?: string }

export interface ActResult { biz: string; rival?: string; act: BizAct; ok: boolean; title: string; text: string; cash: number; d: { p?: number; n?: number; s?: number; i?: number } }

export interface CityState {
  v?: number;
  rng: number;
  econ: Econ;
  prev: Econ;
  biz: Biz[];
  rivals: Rival[];
  seq: number;
  news: CityNews[];
  /** a move was already made this morning */
  acted: boolean;
  last: ActResult | null;
  /** tribute that went into the drawer this evening */
  tribute: number;
}

// ---------------------------------------------------------------- content (Era I)

const KINDS: { k: string; w: [number, number]; tie?: 'press' | 'patron'; d: District[] }[] = [
  { k: 'бакалійна лавка', w: [250, 450], d: ['podil', 'market', 'zar'] },
  { k: 'аптека', w: [400, 700], d: ['old', 'market', 'univ'] },
  { k: 'шинок', w: [300, 600], d: ['podil', 'port', 'zar', 'sloboda'] },
  { k: 'кравецька майстерня', w: [250, 500], d: ['old', 'podil', 'zar'] },
  { k: 'пекарня', w: [200, 400], d: ['podil', 'market', 'zar'] },
  { k: 'ювелірна крамниця', w: [700, 1200], d: ['old'], tie: 'patron' },
  { k: 'друкарня', w: [400, 700], d: ['old', 'podil', 'univ'], tie: 'press' },
  { k: 'винний склад', w: [600, 1000], d: ['port', 'sloboda'] },
  { k: 'цукерня', w: [300, 550], d: ['old', 'market'] },
  { k: 'годинникова майстерня', w: [300, 600], d: ['old'] },
  { k: 'ломбард', w: [600, 1100], d: ['podil', 'market', 'zar', 'station'] },
  { k: 'кав’ярня', w: [350, 650], d: ['old', 'hill', 'univ', 'station'] },
  { k: 'готель', w: [800, 1300], d: ['old', 'port', 'station'], tie: 'patron' },
  { k: 'тютюнова крамниця', w: [300, 550], d: ['market', 'port', 'station'] },
  { k: 'зерновий склад', w: [700, 1200], d: ['port', 'sloboda', 'station'] },
  { k: 'лазня', w: [300, 500], d: ['podil', 'hill', 'zar'] },
  // the newer half of the city: these open as the capital grows
  { k: 'книгарня', w: [250, 450], d: ['univ', 'old'] },
  { k: 'залізничний буфет', w: [300, 550], d: ['station'] },
  { k: 'вугільний склад', w: [500, 900], d: ['sloboda', 'station'] },
  { k: 'ливарня', w: [700, 1250], d: ['sloboda', 'zar'] },
  { k: 'візницька біржа', w: [350, 600], d: ['station', 'market'] },
  { k: 'фотоательє', w: [300, 500], d: ['univ', 'old'] }
];
/** the south bank is built up as the capital grows: it opens after the first few businesses */
const NEW_DIST: District[] = ['zar', 'station', 'univ', 'sloboda'];
const NAMES = ['Золотий лев', 'Під Ангелом', 'Дунай', 'Три корони', 'Гранд', 'Фортуна', 'Під Вежею', 'Чорна кава', 'Венеція', 'Нептун', 'Срібний якір', 'Ріг достатку', 'Біла акація', 'Сонячний двір', 'Під Каштаном', 'Варшавська', 'Атлас', 'Новий світ'];
const OWNERS = ['Пан Козловський', 'Пані Новак', 'Пан Шульц', 'Пан Ковальчук', 'Пані Мельник', 'Пан Горват', 'Пан Дворжак', 'Пані Левицька', 'Пан Бергер', 'Пан Петренко', 'Пані Вишневська', 'Пан Земан', 'Пан Ткач', 'Пані Остапчук', 'Пан Лукаш', 'Пані Гаврилюк', 'Пан Сабо', 'Пан Радзивілович'];
const STREETS: Record<District, string[]> = {
  hill: ['Замковій', 'Монастирській', 'Липовій'],
  old: ['Ратушній', 'Оперній', 'Лицарській', 'Срібній'],
  market: ['Ринковій', 'Соляній', 'Хлібній'],
  podil: ['Кожум’яцькій', 'Гончарній', 'Ковальській'],
  port: ['Набережній', 'Митній', 'Корабельній'],
  zar: ['Заріцькій', 'Мостовій', 'Слобідській'],
  station: ['Вокзальній', 'Паровозній', 'Депо'],
  univ: ['Університетській', 'Академічній', 'Ботанічній'],
  sloboda: ['Заводській', 'Ливарній', 'Пристанській']
};
const FLAVOR: [string, string][] = [
  ['Пароплав «Королева Марія» привіз англійське вугілля', 'Портові вантажники працюють і вночі. Ціни на вугілля можуть знизитися до зими.'],
  ['Опера оголосила сезон', 'Першою виставою стане «Чарівна флейта». Ложі на прем’єру розпродано за день.'],
  ['На Ринковій перекладають бруківку', 'Міська управа обіцяє закінчити до ярмарку. Візники скаржаться на об’їзди.'],
  ['У гавані помічено контрабандну шхуну', 'Митна варта затримала дві бочки рому. Власник шхуни зник.'],
  ['Газові ліхтарі дійдуть до Подолу', 'Компанія освітлення просить у міста ще 3 000 крон.'],
  ['Студенти зібралися біля університету', 'Вимагали дешевших обідів. Поліція розійшлася без бійки.'],
  ['Холера в сусідньому повіті', 'Санітарна комісія радить кип’ятити воду. На вокзалі ставлять карантинний пост.'],
  ['Ярмарок зібрав рекордний виторг', 'Купці з трьох губерній торгували кіньми, сукном і медом.'],
  ['Міст через гирло знову відклали', 'Інженери кажуть, що грошей вистачить лише на опори.'],
  ['У Монастирі відреставрували бані', 'Позолоту оплатили купці Старого міста. Імен жертводавців не розголошують.'],
  ['Пожежа на Гончарній', 'Згоріли два сараї. Пожежна команда приїхала через годину.'],
  ['Нова лінія кінного трамваю', 'Вагони ходитимуть від вокзалу до Ринку щопівгодини.'],
  ['Банк «Аурум» підвищив відсоток', 'Вкладникам обіцяють п’ять відсотків річних. Конкуренти мовчать.'],
  ['Губернатор прийняв делегацію купців', 'Говорили про портові мита. Купці вийшли задоволені.']
];

// ---------------------------------------------------------------- rng (separate stream)

function crand(c: CityState): number {
  let t = (c.rng = (c.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const cint = (c: CityState, n: number) => Math.floor(crand(c) * n);
const cpick = <T>(c: CityState, l: readonly T[]) => l[cint(c, l.length)];
const r10 = (v: number) => Math.round(v / 10) * 10;

// ---------------------------------------------------------------- setup & daily life

function newBiz(c: CityState, year: number): Biz {
  const south = c.seq >= 5; // the new districts open once the city has grown a little
  const pool = KINDS.filter((k) => k.d.some((d) => south || !NEW_DIST.includes(d)));
  const K = cpick(c, pool), ds = K.d.filter((d) => south || !NEW_DIST.includes(d)), district = cpick(c, ds);
  const lots = getPlan().byDistrict[district], free = lots.filter((l) => !c.biz.some((x) => x.lot === l.id));
  const lot = cpick(c, free.length ? free : lots);
  const used = new Set(c.biz.map((x) => x.name));
  let name = cpick(c, NAMES); for (let i = 0; i < 6 && used.has(name); i++) name = cpick(c, NAMES);
  const tie = K.tie || (crand(c) < 0.15 ? (crand(c) < 0.5 ? 'press' : 'patron') : null);
  c.seq += 1;
  return {
    id: 'b' + c.seq, kind: K.k, name, owner: cpick(c, OWNERS), district,
    x: lot.x, y: lot.y, lot: lot.id,
    wealth: r10(K.w[0] + crand(c) * (K.w[1] - K.w[0])), pressure: 0, grudge: 0, tie, status: 'open', opened: year, tribute: 0
  };
}

export function initCity(s: GameState): CityState {
  const econ = { treasury: 24000, grain: 3, trade: 100, crown: 100 };
  const c: CityState = { v: CITY_V, rng: (s.rng ^ 0x9e3779b9) >>> 0, econ, prev: { ...econ }, biz: [], rivals: initRivals(), seq: 0, news: [], acted: false, last: null, tribute: 0 };
  for (let i = 0; i < 4; i++) c.biz.push(newBiz(c, s.year - 1 - cint(c, 6)));
  cityMorning(s, c);
  if (!c.news.some((x) => x.kind === 'open')) { const b = newBiz(c, s.year); c.biz.push(b); c.news.unshift({ kind: 'open', biz: b.id, head: `Відкриття на ${street(c, b)}: ${b.kind} «${b.name}»`, text: `${b.owner} відкриває ${b.kind} «${b.name}». Сусіди кажуть, справи підуть добре.` }); }
  return c;
}

const street = (c: CityState, b: Biz) => cpick(c, STREETS[b.district]);
export const bizTitle = (b: Biz) => `${b.kind} «${b.name}»`;

/** New day in the city: prices move, a business may open, owners with grudges may complain. Mutates s and c. */
export function cityMorning(s: GameState, c: CityState) {
  const e = c.econ; c.prev = { ...e };
  e.trade = Math.round(Math.max(70, Math.min(140, e.trade + (crand(c) - 0.45) * 10)));
  e.grain = Math.max(1, Math.min(6, Math.round((e.grain + (crand(c) - 0.5) * 0.8) * 10) / 10));
  e.crown = Math.round(Math.max(80, Math.min(120, e.crown + (crand(c) - 0.5) * 6)));
  e.treasury = r10(Math.max(5000, e.treasury + (e.trade - 100) * 60 + (crand(c) - 0.5) * 3000));
  c.acted = false; c.last = null; c.news = [];

  // owners with a grudge go to the paper or to the governor
  c.biz.filter((b) => b.status !== 'closed' && b.grudge >= 2).forEach((b) => {
    if (crand(c) < 0.35 + 0.15 * (b.grudge - 2)) {
      s.threat += b.tie === 'press' ? 6 : 3;
      if (b.tie === 'patron') s.patron = Math.max(1, s.patron - 5);
      b.grudge = 1;
      c.news.push({ kind: 'complaint', biz: b.id, head: `${b.owner}: «Чиновники нас душать»`, text: `Власник ${b.kind === 'аптека' ? 'аптеки' : 'закладу'} «${b.name}» розповів редакції про часті перевірки й натяки на «подяку». Редакція шукає інших свідків.` });
    }
  });
  rivalNight(s, c);
  // our "roofs": quiet money, but every roof is one more person who knows
  const roofs = c.biz.filter((b) => b.status === 'roof');
  if (roofs.length) s.threat += roofs.length;
  roofs.forEach((b) => { if (crand(c) < 0.08) { b.status = 'open'; b.grudge = 2; b.tribute = 0; c.news.push({ kind: 'complaint', biz: b.id, head: `«${b.name}» відмовляється платити`, text: `${b.owner} знайшов нових покровителів і каже, що старі домовленості більше не діють.` }); } });

  // a new business opens (not too many on the map)
  const open = c.biz.filter((b) => b.status !== 'closed').length;
  if (open < 18 && crand(c) < (open < 5 ? 0.85 : open < 10 ? 0.55 : 0.4)) {
    const b = newBiz(c, s.year);
    c.biz.push(b);
    c.news.unshift({ kind: 'open', biz: b.id, head: `Відкриття на ${street(c, b)}: ${b.kind} «${b.name}»`, text: `${b.owner} відкриває ${b.kind} «${b.name}». Кажуть, справи підуть добре: торгівля в порту ${e.trade >= 100 ? 'на підйомі' : 'хоч і повільна, та стабільна'}.` });
  }
  // a rumour about somebody's good takings: a daily lead
  const quiet = c.biz.filter((b) => b.status === 'open' && !c.news.some((x) => x.biz === b.id));
  if (quiet.length) {
    const b = cpick(c, quiet), up = c.econ.trade >= 100;
    c.news.push({ kind: 'rumor', biz: b.id, head: `Кажуть, «${b.name}» ${up ? 'не встигає рахувати виторг' : 'тримається, попри кризу'}`, text: `${b.owner} (${b.kind}, ${DISTRICTS[b.district].t}) ${up ? 'замовив нову вивіску й найняв ще двох прикажчиків' : 'знизив ціни, але покупців не меншає'}.${b.pressure ? ' Після недавньої перевірки — помітно знервований.' : ''}` });
  }
  // world news
  const f1 = cpick(c, FLAVOR); let f2 = cpick(c, FLAVOR); if (f2 === f1) f2 = FLAVOR[(FLAVOR.indexOf(f1) + 3) % FLAVOR.length];
  c.news.push({ kind: 'flavor', head: f1[0], text: f1[1] }, { kind: 'flavor', head: f2[0], text: f2[1] });
}

/** Tribute from "roofed" businesses goes into the drawer when the evening starts. */
export function cityEvening(s: GameState, c: CityState) {
  const t = c.biz.filter((b) => b.status === 'roof').reduce((a, b) => a + b.tribute, 0);
  c.tribute = r10((t * c.econ.trade) / 100);
  s.cash += c.tribute;
}

// ---------------------------------------------------------------- the morning move

export interface ActOption { act: BizAct | RivalAct; /** money it costs (dirty) */ cost?: number; /** text instead of the cash gain */ gainT?: string; t: string; sub: string; can: boolean; why?: string; risk: number; /** chance of success, 0..1 */ odds: number; /** what success brings: cash now, or per year for a roof */ gain: number; perYear?: boolean }

/** Chance that a move works (the same numbers actOnBiz rolls against; pressure counts after the move). */
export function bizOdds(b: Biz, act: BizAct, s?: GameState): number {
  if (act === 'outbid') {
    const rv = s?.city ? rivalOf(s.city, b.rival) : null;
    return Math.max(0.1, Math.min(0.9, 0.55 + ((s?.patron ?? 50) - 50) / 150 - (rv ? rv.power / 220 : 0) + 0.05 * b.pressure));
  }
  const tieMalus = b.tie ? 0.15 : 0;
  const q = act === 'inspect' ? 0.45 + 0.15 * (b.pressure + 1) - tieMalus - 0.1 * b.grudge - (b.rival ? CITY_RULES.heldInspect : 0)
    : act === 'seal' ? 0.5 + 0.1 * Math.min(3, b.pressure + 1) - tieMalus
    : 0.35 + 0.2 * b.pressure - tieMalus - 0.1 * b.grudge;
  return Math.max(0, Math.min(1, q));
}

export function bizActs(s: GameState, b: Biz): ActOption[] {
  const rv = s.city && b.rival ? rivalOf(s.city, b.rival) : null;
  if (rv) {
    const cost = r10(b.wealth * 0.35);
    return [
      { act: 'inspect', t: 'Податкова перевірка', sub: `Заклад під рукою ${rv.name}: ${'перевірка'} вдається гірше, а він це запам’ятає.`, can: b.status === 'open' && b.pressure < 3, why: b.pressure >= 3 ? 'Тиснути сильніше вже нікуди' : undefined, risk: 2, odds: bizOdds(b, 'inspect'), gain: r10(b.wealth * (0.3 + 0.2 * b.pressure)) },
      { act: 'outbid', t: 'Перебити дах', sub: `Дати власнику більше, ніж платить ${rv.name}. ${rv.name} цього не пробачить.`, can: b.status === 'open' && s.cash >= cost, why: s.cash < cost ? `Бракує брудних: потрібно ${fmt(cost)} кр.` : undefined, risk: 2, odds: bizOdds(b, 'outbid', s), gain: r10(b.wealth * 0.25), perYear: true, cost },
      { act: 'seal', t: 'Опечатати заклад', sub: '', can: false, why: `Під рукою ${rv.name}: чіпати відкрито не можна`, risk: 0, odds: 0, gain: 0 }
    ];
  }
  const tie = b.tie === 'press' ? ' Власник дружить із газетою.' : b.tie === 'patron' ? ' Власник ходить до губернатора.' : '';
  return [
    { act: 'inspect', t: 'Податкова перевірка', sub: `Натякнути, що порушення знайдуться завжди. Може «віддячити» ~${fmt(r10(b.wealth * (0.3 + 0.2 * b.pressure)))} кр.${tie}`, can: b.status === 'open' && b.pressure < 3, why: b.pressure >= 3 ? 'Тиснути сильніше вже нікуди' : undefined, risk: 1 + (b.tie ? 2 : 0), odds: bizOdds(b, 'inspect'), gain: r10(b.wealth * (0.3 + 0.2 * b.pressure)) },
    { act: 'seal', t: 'Опечатати заклад', sub: `Знайти «порушення» і повісити пломбу. Або платить ~${fmt(r10(b.wealth * 1.2))} кр., або закриється.`, can: b.status === 'open' && b.pressure >= 1, why: b.pressure < 1 ? 'Спершу перевірка: власник має відчути тиск' : undefined, risk: 3 + (b.tie ? 3 : 0), odds: bizOdds(b, 'seal'), gain: r10(b.wealth * 1.2) },
    { act: 'roof', t: 'Запропонувати «дах»', sub: `Захист від інших чиновників за ~${fmt(r10(b.wealth * 0.25))} кр. щороку. Ризик +1 на рік, поки платить.`, can: b.status === 'open' && b.pressure >= 1, why: b.pressure < 1 ? 'Без тиску власник не зрозуміє, навіщо йому захист' : undefined, risk: 2, odds: bizOdds(b, 'roof'), gain: r10(b.wealth * 0.25), perYear: true }
  ];
}

/** One move per morning against one business. */
export function actOnBiz(s: GameState, id: string, act: BizAct): GameState {
  if (s.screen !== 'morning') throw new Error('Moves are made in the morning');
  const n = structuredClone(s);
  const c = n.city || (n.city = initCity(n));
  if (c.acted) return n;
  const b = c.biz.find((x) => x.id === id);
  if (!b) return n;
  const opt = bizActs(n, b).find((o) => o.act === act);
  if (!opt || !opt.can) return n;
  c.acted = true;
  const res: ActResult = { biz: b.id, act, ok: false, title: '', text: '', cash: 0, d: {} };
  const q = bizOdds(b, act, n);
  const holder = rivalOf(c, b.rival);
  if (act === 'inspect') {
    b.pressure += 1;
    res.d.i = opt.risk;
    if (holder) holder.heat = Math.min(10, holder.heat + 1);
    if (crand(c) < q) {
      res.ok = true; res.cash = r10(b.wealth * (0.3 + 0.2 * (b.pressure - 1)));
      res.title = `${b.owner} «віддячив»`; res.text = `Інспектор повернувся з конвертом: ${fmt(res.cash)} кр. Перевірка нічого не знайшла.`;
    } else {
      b.grudge += 1;
      res.title = `${b.owner} не зрозумів натяку`; res.text = `Власник показав усі книги й пообіцяв поскаржитися. Тиснути можна далі, але він уже насторожі.`;
      if (b.tie === 'press') { res.d.n = -2; res.d.i = (res.d.i || 0) + 2; }
      if (b.tie === 'patron') res.d.p = -3;
    }
  } else if (act === 'seal') {
    b.pressure = Math.min(3, b.pressure + 1);
    res.d.i = opt.risk;
    if (crand(c) < q) {
      res.ok = true; res.cash = r10(b.wealth * 1.2);
      res.title = `Пломбу зняли за ${fmt(res.cash)} кр.`; res.text = `${b.owner} приніс гроші того ж дня. Заклад працює, але власник вас ненавидить.`;
      b.grudge += 1;
    } else {
      b.status = 'closed'; b.grudge = 3;
      res.title = `${bizTitle(b)} закрито`; res.text = `Власник не заплатив і закрив справу. Місто втратило заклад, газета — ні: завтра про це напишуть.`;
      res.d.n = -3;
      c.news.unshift({ kind: 'closed', biz: b.id, head: `Зачинено: ${b.kind} «${b.name}»`, text: `Після «перевірки» ${b.owner} не відкрив двері. Сусіди кажуть, справа не в порушеннях.` });
    }
  } else if (act === 'outbid' && holder) {
    n.cash -= opt.cost || 0; res.d.i = opt.risk;
    holder.heat = Math.min(10, holder.heat + 2);
    if (crand(c) < q) {
      res.ok = true; b.rival = null; b.status = 'roof'; b.tribute = r10(b.wealth * 0.25); b.grudge = 0; holder.power = Math.max(5, holder.power - 4);
      res.title = `«${b.name}» перейшов під ваш дах`; res.text = `Ви заплатили ${fmt(opt.cost || 0)} кр. і перебили ${holder.name}. Цього не забудуть.`; res.d.s = 1;
    } else {
      res.title = `${holder.name} ${sx(holder, 'утримав', 'утримала')} «${b.name}»`; res.text = `Гроші пішли, власник злякався й відмовився. ${holder.name} уже знає, хто стукав у двері.`;
    }
  } else {
    if (crand(c) < q) {
      res.ok = true; b.status = 'roof'; b.tribute = r10(b.wealth * 0.25); b.grudge = 0;
      res.title = `${b.owner} під вашим «дахом»`; res.text = `Щовечора в шухляду лягатиме данина ~${fmt(b.tribute)} кр. на рік. Поки платить — інші чиновники його не чіпають.`;
      res.d.i = 2; res.d.s = 2;
    } else {
      b.grudge += 1; res.d.i = 1;
      res.title = `${b.owner} відмовився`; res.text = `Сказав, що краще заплатить штраф, ніж вам. Запам’ятав розмову.`;
    }
  }
  n.cash += res.cash;
  if (res.d.p) n.patron = clamp100(n.patron + res.d.p);
  if (res.d.n) n.people = clamp100(n.people + res.d.n);
  if (res.d.s) n.system = clamp100(n.system + res.d.s);
  if (res.d.i) n.threat += res.d.i;
  b.grudge = Math.min(3, b.grudge);
  c.last = res;
  return n;
}

/** for saves made before the city existed */
export function ensureCity(s: GameState): GameState {
  if (s.city && s.city.v === CITY_V) return s;
  const n = structuredClone(s); n.city = initCity(n); return n;
}


// ---------------------------------------------------------------- the rivals' night

const clampN = (v: number, a: number, z: number) => Math.max(a, Math.min(z, v));
const SMEAR = ['«Голос Порту» вийшов із карикатурою на міського голову: той у кареті, а позаду — порожній міський гаманець.', 'У «Голосі Порту» — стаття «Куди діваються гроші з чавунного скарбця?». Автора не названо.', 'Вранці на розі продавали листівку з вашим профілем і написом «Дорого стоїть чесність».'];
const INFORM = ['Граф написав губернатору «про непорядки в управі». Губернатор попросив пояснень.', 'До канцелярії губернатора дійшов анонімний лист про ваші «подарунки». Почерк впізнаваний.', 'За обідом у губернатора граф сказав: «Дехто в місті давно забув, чий він слуга».'];

/** held shops per rival */
/** The personal file on each magnate: who he is, what he wants, where he is weak. Content only, not saved state. */
export interface RivalFile { age: number; from: string; bio: string; likes: string; weak: string; quote: string }
export const RIVAL_FILE: Record<string, RivalFile> = {
  r1: { age: 54, from: 'прийшов до порту юнгою', bio: 'Прибув до Порт-Аурума хлопчиком-юнгою з вантажем чужого вугілля. Тепер має склади на Набережній, пай у пароплавстві й кілька шинків під чужими іменами. Рахує повільно, але нічого не забуває.', likes: 'цифри, порядок, розписки із закрученою печаткою', weak: 'вважає, що все в місті продається, тож і сам легко платить за «дах» — і так само легко його перебиває', quote: '«Місто — це товар. Хтось же має ним торгувати.»' },
  r2: { age: 47, from: 'вдова друкаря з Подолу', bio: 'Успадкувала «Голос Порту» разом із боргами й з перших днів почала друкувати те, чого інші бояться. За п’ять років зробила листок найчитанішим у місті. Подейкують, що половину скандалів вона вигадує сама.', likes: 'гучні заголовки, чужі секрети, чай із коньяком', weak: 'мріє про салон у Старому місті, а двері туди відчиняє лише губернатор, тож його ім’я в її листку з’являється рідко й без глузування', quote: '«Правда — це те, що надруковано першим.»' },
  r3: { age: 68, from: 'останній із роду, що колись володів півміста', bio: 'Рід Ґжеґожевських сидів на пагорбі ще до першого мосту. Від маєтків лишилися замок, титул і листування з губернатором, яке граф вважає владою. Вас він називає не інакше як «вискочка з управи».', likes: 'родовід, полювання, довгі листи з підкресленнями', weak: 'тоне в боргах і панічно боїться, що замок піде з молотка; за відстрочку може забути всі образи', quote: '«Мій рід тут був, коли вашого ще не було навіть у списках.»' }
};

export const holdings = (c: CityState, id: string) => c.biz.filter((b) => b.rival === id && b.status !== 'closed');

/** Who has what, per district: shops under us, under each rival, and free. */
export function control(c: CityState) {
  const out = {} as Record<District, { me: number; free: number; rivals: Record<string, number> }>;
  (Object.keys(DISTRICTS) as District[]).forEach((d) => {
    const bs = c.biz.filter((b) => b.district === d && b.status !== 'closed');
    out[d] = { me: bs.filter((b) => b.status === 'roof').length, free: bs.filter((b) => b.status === 'open' && !b.rival).length, rivals: {} };
    c.rivals.forEach((r) => { out[d].rivals[r.id] = bs.filter((b) => b.rival === r.id).length; });
  });
  return out;
}

/** Between our evening and the next morning the magnates make their moves. Mutates s and c; reported in the paper. */
export function rivalNight(s: GameState, c: CityState) {
  const K = CITY_RULES;
  if (!K.rivalsOn) return;
  for (const r of c.rivals) {
    const held = holdings(c, r.id).length, mine = c.biz.filter((b) => b.status === 'roof');
    if (r.ally) {
      s.threat = Math.max(0, s.threat - K.allyShield);
      r.power = clampN(r.power + 1, 5, 95); r.last = 'союзник';
      if (crand(c) < 0.3) c.news.push({ kind: 'rival', rival: r.id, head: `${r.name} публічно ${sx(r, 'підтримав', 'підтримала')} вас`, text: `Родичі не кидають своїх: ${r.name} ${sx(r, 'сказав', 'сказала')} на прийомі, що «мер — людина порядна». Ризик трохи знизився.` });
      continue;
    }
    // jealousy: he cools off when we leave him alone and burns when we hold more than he does
    r.heat = clampN(r.heat + (mine.length > held ? 0.5 : -0.5) + (crand(c) - 0.5) * 0.6, 0, 10);
    r.power = clampN(r.power + held * 0.8 - 1.2 + (crand(c) - 0.5), 5, 95);
    const free = c.biz.filter((b) => b.status === 'open' && !b.rival);
    const hunting = s.served >= K.grace;
    const w = [free.length ? K.expandW : 0, hunting ? K.huntBase + K.huntPerHeat * r.heat : 0, hunting && mine.length && r.heat >= K.poachFrom ? 0.45 * (r.heat - K.poachFrom + 1) : 0, K.restW];
    let x = crand(c) * w.reduce((a, b) => a + b, 0), pick = 0;
    for (; pick < w.length - 1; pick++) { if (x < w[pick]) break; x -= w[pick]; }
    const sev = 1 + (r.power > 55 ? 1 : 0) + (r.heat >= 6 ? 1 : 0);
    if (pick === 0) {
      const near = free.filter((b) => b.district === r.focus), b = cpick(c, near.length ? near : free);
      b.rival = r.id; r.power = clampN(r.power + 2, 5, 95); r.last = `${sx(r, 'узяв', 'узяла')} під руку «${b.name}»`;
      c.news.push({ kind: 'rival', rival: r.id, biz: b.id, head: `${r.name} ${sx(r, 'узяв', 'узяла')} «${b.name}» під свою руку`, text: `${b.owner} тепер платить ${r.name}. Інспекторам радять туди не заходити, якщо не хочуть клопоту.` });
    } else if (pick === 1) {
      if (r.style === 'smear') {
        s.threat += K.smear.threat * sev; s.people = clampN(s.people - K.smear.people * sev, 0, 100); r.last = sx(r, 'облив', 'облила') + ' брудом у пресі';
        c.news.push({ kind: 'attack', rival: r.id, head: `Брудна преса: ${r.name}`, text: SMEAR[cint(c, SMEAR.length)] });
      } else if (r.style === 'informer') {
        s.patron = clampN(s.patron - K.inform.patron * sev, 0, 100); s.threat += K.inform.threat * sev; r.last = sx(r, 'поскаржився', 'поскаржилась') + ' губернатору';
        c.news.push({ kind: 'attack', rival: r.id, head: `Донос: ${r.name}`, text: INFORM[cint(c, INFORM.length)] });
      } else {
        const lost = Math.min(s.cash, K.boycott * sev); s.cash -= lost; s.threat += 1; r.last = sx(r, 'переманив', 'переманила') + ' ваших людей';
        c.news.push({ kind: 'attack', rival: r.id, head: `${r.name} ${sx(r, 'переманив', 'переманила')} людей`, text: `Двоє ваших посильних перейшли до ${r.name}${lost ? ` і прихопили ${fmt(lost)} кр. з каси` : ''}. Тепер вони знають забагато.` });
      }
    } else if (pick === 2) {
      const b = cpick(c, mine);
      if (crand(c) < K.poachChance) {
        b.status = 'open'; b.rival = r.id; b.tribute = 0; b.grudge = 0; r.power = clampN(r.power + 3, 5, 95); r.last = `${sx(r, 'перебив', 'перебила')} дах «${b.name}»`;
        c.news.push({ kind: 'rival', rival: r.id, biz: b.id, head: `${r.name} ${sx(r, 'перебив', 'перебила')} ваш дах над «${b.name}»`, text: `${b.owner} більше не платить вам. Хтось пообіцяв йому надійніший захист.` });
      } else {
        r.last = sx(r, 'спробував', 'спробувала') + ' перебити дах'; c.news.push({ kind: 'rival', rival: r.id, biz: b.id, head: `${r.name} ${sx(r, 'пробував', 'пробувала')} забрати «${b.name}»`, text: `${b.owner} відмовив. Цього разу.` });
      }
    } else r.last = 'вичікує';
  }
}

// ---------------------------------------------------------------- moves against a rival

export interface RivalOption extends ActOption { act: RivalAct }

const eligibleKid = (s: GameState) => [...s.kids].filter((k) => !k.gone && k.age >= 16).sort((a, b) => b.age - a.age)[0] || null;
export const marriageCost = (r: Rival) => r10(300 + r.power * 8);
export const exposeOdds = (s: GameState, r: Rival) => clampN(0.5 + (s.patron - 50) / 150 - r.power / 250, 0.15, 0.85);

export function rivalActs(s: GameState, r: Rival): RivalOption[] {
  const K = CITY_RULES, kid = eligibleKid(s), bribe = r10(K.bribeBase + r.power * K.bribePerPower), dowry = marriageCost(r);
  if (r.ally) return [];
  return [
    { act: 'bribe', t: 'Підкупити', sub: `Подарунок ${r.name}: гроші, що виглядають як шана. Злість спадає: з вами, виявляється, можна домовитись.`, can: s.cash >= bribe && r.heat >= 0.5, why: s.cash < bribe ? `Бракує брудних: потрібно ${fmt(bribe)} кр.` : 'Не сердиться і так', risk: 0, odds: 0.85, gain: 0, gainT: `злість −${K.bribeDrop}`, cost: bribe },
    { act: 'expose', t: sx(r, 'Здати його', 'Здати її'), sub: `Анонімно «повідомити» куди слід про ${r.name}. Якщо вдасться, вплив і два заклади під ${sx(r, 'його', 'її')} рукою похитнуться. Якщо ні — дізнаються, хто писав.`, can: true, risk: 2, odds: exposeOdds(s, r), gain: 0, gainT: `вплив −${K.exposeDamage}` },
    { act: 'marry', t: 'Віддати дитину заміж', sub: `${kid ? `${kid.first} (${kid.age} р.)` : 'Дитина'} вийде за родича ${r.name}. Дім стане союзником назавжди, але ви втратите дитину в родині.`, can: !!kid && r.heat <= K.marryHeat && s.cash >= dowry, why: !kid ? 'Немає дитини від 16 років' : r.heat > K.marryHeat ? `${r.name} надто злий: спершу вгамуйте` : `Придане ${fmt(dowry)} кр. — бракує брудних`, risk: 0, odds: 1, gain: 0, gainT: 'союзник назавжди', cost: dowry }
  ];
}

export function actOnRival(s: GameState, id: string, act: RivalAct): GameState {
  if (s.screen !== 'morning') throw new Error('Moves are made in the morning');
  const n = structuredClone(s);
  const c = n.city || (n.city = initCity(n));
  if (c.acted) return n;
  const r = rivalOf(c, id);
  if (!r) return n;
  const opt = rivalActs(n, r).find((o) => o.act === act);
  if (!opt || !opt.can) return n;
  c.acted = true;
  const K = CITY_RULES, res: ActResult = { biz: '', rival: r.id, act: act as never, ok: false, title: '', text: '', cash: 0, d: {} };
  n.cash -= opt.cost || 0;
  if (act === 'bribe') {
    if (crand(c) < opt.odds) { r.heat = Math.max(0, r.heat - K.bribeDrop); res.ok = true; res.title = `${r.name} ${sx(r, 'прийняв', 'прийняла')} дарунок`; res.text = 'Подяка тривала довше, ніж слід було б. Зате полювання вщухло.'; }
    else { res.title = `${r.name} ${sx(r, 'взяв', 'взяла')} гроші й нічого не ${sx(r, 'обіцяв', 'обіцяла')}`; res.text = 'Дарунок прийнято, а злість лишилась. Таке трапляється.'; res.d.i = 1; }
  } else if (act === 'expose') {
    res.d.i = opt.risk;
    if (crand(c) < opt.odds) {
      r.power = Math.max(5, r.power - K.exposeDamage); r.heat = Math.min(10, r.heat + 2); res.ok = true;
      const lost = holdings(c, r.id).slice(0, 2); lost.forEach((b) => { b.rival = null; });
      res.title = `${r.name} ${sx(r, 'втратив', 'втратила')} вплив`; res.text = `Перевірка до нього дійшла. ${lost.length ? `Заклади ${lost.map((b) => `«${b.name}»`).join(' і ')} лишилися без захисту.` : 'Щоправда, захищати йому вже нікого.'} Тепер шукатимуть, хто це влаштував.`;
    } else {
      r.heat = Math.min(10, r.heat + 3); res.d.i = opt.risk + 1; res.title = `${r.name} ${sx(r, 'дізнався', 'дізналася')}, хто писав`; res.text = 'Донос не спрацював, а почерк виявився впізнаваним. Тепер на вас полюватимуть серйозніше.';
    }
  } else {
    const kid = eligibleKid(n)!;
    kid.gone = true;
    kid.why = `${kid.g === 'f' ? 'вийшла заміж' : 'одружився'} — тепер у родині ${r.name}`;
    r.ally = true; r.heat = 0; r.power = clampN(r.power + 6, 5, 95); res.ok = true; res.d.s = 2;
    res.title = `Союз із ${r.name}`; res.text = `${kid.first} ${kid.g === 'f' ? 'увійшла' : 'увійшов'} до їхнього дому. Весілля вийшло гучним, а ворожнеча — тихою. Тепер ${r.name} щороку знижує ваш ризик.`;
  }
  c.last = res;
  if (res.d.i) n.threat += res.d.i;
  if (res.d.s) n.system = clamp100(n.system + res.d.s);
  return n;
}
