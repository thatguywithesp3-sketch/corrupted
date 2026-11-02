// Port-Aurum as a living city: businesses that open, pay, resist and complain; a small economy;
// the morning paper reports it all. Each morning the official can make ONE move against one business
// (an inspection, sealing it, or offering a "roof"). Everything here runs on its own RNG stream (city.rng),
// so the core game stays bit-identical to the prototype when the city is not touched.
import { clamp100, fmt } from './text';
import type { GameState } from './types';
import { DISTRICTS, getPlan, type District } from './cityplan';
export { DISTRICTS, type District } from './cityplan';

/** bump when the map or the shape of the city changes: older saves get a fresh city */
export const CITY_V = 2;

// ---------------------------------------------------------------- types

export type BizStatus = 'open' | 'roof' | 'closed';
export type BizAct = 'inspect' | 'seal' | 'roof';

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
}

export interface Econ { treasury: number; grain: number; trade: number; crown: number }

export interface CityNews { kind: 'open' | 'rumor' | 'flavor' | 'complaint' | 'closed' | 'roof'; head: string; text: string; biz?: string }

export interface ActResult { biz: string; act: BizAct; ok: boolean; title: string; text: string; cash: number; d: { p?: number; n?: number; s?: number; i?: number } }

export interface CityState {
  v?: number;
  rng: number;
  econ: Econ;
  prev: Econ;
  biz: Biz[];
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
  { k: 'бакалійна лавка', w: [250, 450], d: ['podil', 'market'] },
  { k: 'аптека', w: [400, 700], d: ['old', 'market'] },
  { k: 'шинок', w: [300, 600], d: ['podil', 'port'] },
  { k: 'кравецька майстерня', w: [250, 500], d: ['old', 'podil'] },
  { k: 'пекарня', w: [200, 400], d: ['podil', 'market'] },
  { k: 'ювелірна крамниця', w: [700, 1200], d: ['old'], tie: 'patron' },
  { k: 'друкарня', w: [400, 700], d: ['old', 'podil'], tie: 'press' },
  { k: 'винний склад', w: [600, 1000], d: ['port'] },
  { k: 'цукерня', w: [300, 550], d: ['old', 'market'] },
  { k: 'годинникова майстерня', w: [300, 600], d: ['old'] },
  { k: 'ломбард', w: [600, 1100], d: ['podil', 'market'] },
  { k: 'кав’ярня', w: [350, 650], d: ['old', 'hill'] },
  { k: 'готель', w: [800, 1300], d: ['old', 'port'], tie: 'patron' },
  { k: 'тютюнова крамниця', w: [300, 550], d: ['market', 'port'] },
  { k: 'зерновий склад', w: [700, 1200], d: ['port'] },
  { k: 'лазня', w: [300, 500], d: ['podil', 'hill'] }
];
const NAMES = ['Золотий лев', 'Під Ангелом', 'Дунай', 'Три корони', 'Гранд', 'Фортуна', 'Під Вежею', 'Чорна кава', 'Венеція', 'Нептун', 'Срібний якір', 'Ріг достатку', 'Біла акація', 'Сонячний двір', 'Під Каштаном', 'Варшавська', 'Атлас', 'Новий світ'];
const OWNERS = ['Пан Козловський', 'Пані Новак', 'Пан Шульц', 'Пан Ковальчук', 'Пані Мельник', 'Пан Горват', 'Пан Дворжак', 'Пані Левицька', 'Пан Бергер', 'Пан Петренко', 'Пані Вишневська', 'Пан Земан', 'Пан Ткач', 'Пані Остапчук', 'Пан Лукаш', 'Пані Гаврилюк', 'Пан Сабо', 'Пан Радзивілович'];
const STREETS: Record<District, string[]> = {
  hill: ['Замковій', 'Монастирській', 'Липовій'],
  old: ['Ратушній', 'Оперній', 'Лицарській', 'Срібній'],
  market: ['Ринковій', 'Соляній', 'Хлібній'],
  podil: ['Кожум’яцькій', 'Гончарній', 'Ковальській'],
  port: ['Набережній', 'Митній', 'Корабельній']
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
  const K = cpick(c, KINDS), district = cpick(c, K.d);
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
  const c: CityState = { v: CITY_V, rng: (s.rng ^ 0x9e3779b9) >>> 0, econ, prev: { ...econ }, biz: [], seq: 0, news: [], acted: false, last: null, tribute: 0 };
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
  // our "roofs": quiet money, but every roof is one more person who knows
  const roofs = c.biz.filter((b) => b.status === 'roof');
  if (roofs.length) s.threat += roofs.length;
  roofs.forEach((b) => { if (crand(c) < 0.08) { b.status = 'open'; b.grudge = 2; b.tribute = 0; c.news.push({ kind: 'complaint', biz: b.id, head: `«${b.name}» відмовляється платити`, text: `${b.owner} знайшов нових покровителів і каже, що старі домовленості більше не діють.` }); } });

  // a new business opens (not too many on the map)
  const open = c.biz.filter((b) => b.status !== 'closed').length;
  if (open < 10 && crand(c) < (open < 5 ? 0.85 : 0.5)) {
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

export interface ActOption { act: BizAct; t: string; sub: string; can: boolean; why?: string; risk: number; /** chance of success, 0..1 */ odds: number; /** what success brings: cash now, or per year for a roof */ gain: number; perYear?: boolean }

/** Chance that a move works (the same numbers actOnBiz rolls against; pressure counts after the move). */
export function bizOdds(b: Biz, act: BizAct): number {
  const tieMalus = b.tie ? 0.15 : 0;
  const q = act === 'inspect' ? 0.45 + 0.15 * (b.pressure + 1) - tieMalus - 0.1 * b.grudge
    : act === 'seal' ? 0.5 + 0.1 * Math.min(3, b.pressure + 1) - tieMalus
    : 0.35 + 0.2 * b.pressure - tieMalus - 0.1 * b.grudge;
  return Math.max(0, Math.min(1, q));
}

export function bizActs(_s: GameState, b: Biz): ActOption[] {
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
  const tieMalus = b.tie ? 0.15 : 0;
  if (act === 'inspect') {
    b.pressure += 1;
    res.d.i = opt.risk;
    if (crand(c) < 0.45 + 0.15 * b.pressure - tieMalus - 0.1 * b.grudge) {
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
    if (crand(c) < 0.5 + 0.1 * b.pressure - tieMalus) {
      res.ok = true; res.cash = r10(b.wealth * 1.2);
      res.title = `Пломбу зняли за ${fmt(res.cash)} кр.`; res.text = `${b.owner} приніс гроші того ж дня. Заклад працює, але власник вас ненавидить.`;
      b.grudge += 1;
    } else {
      b.status = 'closed'; b.grudge = 3;
      res.title = `${bizTitle(b)} закрито`; res.text = `Власник не заплатив і закрив справу. Місто втратило заклад, газета — ні: завтра про це напишуть.`;
      res.d.n = -3;
      c.news.unshift({ kind: 'closed', biz: b.id, head: `Зачинено: ${b.kind} «${b.name}»`, text: `Після «перевірки» ${b.owner} не відкрив двері. Сусіди кажуть, справа не в порушеннях.` });
    }
  } else {
    if (crand(c) < 0.35 + 0.2 * b.pressure - tieMalus - 0.1 * b.grudge) {
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

