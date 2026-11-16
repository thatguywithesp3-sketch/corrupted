// Port-Aurum as a living city: businesses that open, pay, resist and complain; a small economy;
// the morning paper reports it all. Each morning the official can make ONE move against one business
// (an inspection, sealing it, or offering a "roof"). Everything here runs on its own RNG stream (city.rng),
// so the core game stays bit-identical to the prototype when the city is not touched.
import { clamp100, fmt, kinFor } from './text';
import type { GameState } from './types';
import { RULES } from './rules';
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
  bribeBase: 150, bribePerPower: 6, bribeDrop: 3, exposeDamage: 14, marryHeat: 4,
  // the good name: what each lever costs and how much risk it takes off
  fame: {
    donate: { clean: 250, calm: 4, people: 2 },
    fund: { clean: 1500, calmYr: 2, peopleYr: 1 },
    article: { cost: 200, calm: 6, odds: 0.75 },
    share: { cost: 1500, calmYr: 1, smearCut: 0.5 },
    whisper: { cost: 120, calmYr: 2, peopleYr: 1 },
    silence: { cost: 350, calm: 10, odds: 0.8, backfire: 4, people: 2 }
  }
};

const initRivals = (): Rival[] => [
  { id: 'r1', name: 'Пан Солонар', title: 'купець першої гільдії, склади й пароплави', style: 'expander', color: '#2E5E8E', power: 38, heat: 1, ally: false, focus: 'port', last: '' },
  { id: 'r2', name: 'Пані Берг', title: 'власниця «Голосу Порту»', style: 'smear', color: '#7A3F8E', f: true, power: 30, heat: 2, ally: false, focus: 'old', last: '' },
  { id: 'r3', name: 'Граф Кречетов-Задонський', title: 'старий рід, рідня двору', style: 'informer', color: '#9A5A22', power: 34, heat: 1, ally: false, focus: 'hill', last: '' }
];
const sx = (r: Rival, m: string, f: string) => (r.f ? f : m);
/** the magnates' names in the other cases (content, not saved state) */
const RIVAL_CASES: Record<string, { gen: string; dat: string; acc: string; ins: string }> = {
  r1: { gen: 'Пана Солонара', dat: 'Пану Солонару', acc: 'Пана Солонара', ins: 'Паном Солонаром' },
  r2: { gen: 'Пані Берг', dat: 'Пані Берг', acc: 'Пані Берг', ins: 'Пані Берг' },
  r3: { gen: 'Графа Кречетова-Задонського', dat: 'Графу Кречетову-Задонському', acc: 'Графа Кречетова-Задонського', ins: 'Графом Кречетовим-Задонським' }
};
export const rivalCase = (r: Rival, k: 'gen' | 'dat' | 'acc' | 'ins') => (r.gen && r.gen > 1 ? RIVAL_HEIRS[r.id]?.cases[k] : RIVAL_CASES[r.id]?.[k]) || r.name;
/** a shop owner is a woman when she is «Пані …» */
const ow = (b: { owner: string }, m: string, f: string) => (b.owner.startsWith('Пані') ? f : m);
/** «відкриває візницьку біржу»: feminine kinds take the accusative */
const kindAcc = (k: string) => k.split(' ').map((w) => w.replace(/а$/, 'у').replace(/я$/, 'ю')).join(' ');
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export const rivalOf = (c: CityState, id?: string | null) => c.rivals.find((r) => r.id === id) || null;


// ---------------------------------------------------------------- types

export type BizStatus = 'open' | 'roof' | 'closed';
export type BizAct = 'inspect' | 'seal' | 'roof' | 'outbid';
export type RivalAct = 'bribe' | 'expose' | 'marry';
/** the four ways to whitewash a name: charity, the press, whisperers in the taverns, the gendarmerie */
export type InstId = 'charity' | 'press' | 'whisper' | 'okhrana';
export type InstAct = 'donate' | 'fund' | 'article' | 'share' | 'hire' | 'dismiss' | 'silence';
export type RivalStyle = 'expander' | 'smear' | 'informer';

/** A local magnate: wants the same shops and roofs we do, and hunts us when he is angry. */
export interface Rival {
  id: string; name: string; title: string; style: RivalStyle; color: string; f?: boolean; // f: a woman
  power: number; // 0..100 clout in the city
  heat: number; // 0..10 how much he wants us gone
  ally: boolean; // bound to us by marriage
  focus: District; // where he likes to expand
  last: string; // what he did last night
  /** 2 once the house has passed to the next generation (with ours) */
  gen?: number;
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

export interface ActResult { biz: string; rival?: string; act: BizAct | InstAct; ok: boolean; title: string; text: string; cash: number; /** what the move cost, and from which purse */ spent?: number; spentClean?: boolean; d: { p?: number; n?: number; s?: number; i?: number } }

export interface CityState {
  v?: number;
  rng: number;
  econ: Econ;
  prev: Econ;
  biz: Biz[];
  rivals: Rival[];
  seq: number;
  news: CityNews[];
  /** units (shop ids and magnate ids) already moved on this turn: one move per unit per turn, as in Civilization */
  done: string[];
  /** every result of this turn, so each card keeps its own stamp */
  today: ActResult[];
  last: ActResult | null;
  /** standing arrangements that keep the family name clean (absent in old saves) */
  fame?: { fund?: boolean; share?: boolean; whisper?: boolean };
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
// World news of the 1870s. The empire is old and tired; nobody says so, the paper just reports it.
// Tone: deadpan chronicle, no sermon. The awakening of Valdorian language shows up as small facts.
const FLAVOR: [string, string][] = [
  ['Пароплав «Королева Марія» привіз заморське вугілля', 'Портові вантажники працюють і вночі. Ціни на вугілля можуть знизитися до зими.'],
  ['Опера оголосила сезон', 'Першою виставою стане «Чарівна флейта». Ложі на прем’єру розпродано за день.'],
  ['На Ринковій перекладають бруківку', 'Міська управа обіцяє закінчити до ярмарку. Візники скаржаться на об’їзди.'],
  ['У гавані помічено контрабандну шхуну', 'Митна варта затримала дві бочки рому. Власник шхуни зник.'],
  ['Газові ліхтарі дійдуть до Подолу', 'Компанія освітлення просить у міста ще 3 000 крон.'],
  ['Холера в сусідньому повіті', 'Санітарна комісія радить кип’ятити воду. На вокзалі ставлять карантинний пост.'],
  ['Ярмарок зібрав рекордний виторг', 'Купці з трьох губерній торгували кіньми, сукном і медом.'],
  ['Міст через гирло знову відклали', 'Інженери кажуть, що грошей вистачить лише на опори.'],
  ['Пожежа на Гончарній', 'Згоріли два сараї. Пожежна команда приїхала через годину.'],
  ['Нова лінія кінного трамваю', 'Вагони ходитимуть від вокзалу до Ринку щопівгодини.'],
  ['Банк «Аурум» підвищив відсоток', 'Вкладникам обіцяють п’ять відсотків річних. Конкуренти мовчать.'],
  // the empire
  ['Імперські облігації знову подешевшали', 'Біржа в Порт-Аурумі закрилася на два пункти нижче. Маклери радять купувати землю, а не папір.'],
  ['Столиця просить Вальдорію збільшити внесок до скарбниці', 'Губернатор зачитав указ на сходах Ратуші. Слухачів було менше, ніж голубів.'],
  ['Імперський гарнізон скоротили на третину', 'Казна не встигає платити жалування. Звільнені солдати шукають роботу в порту.'],
  ['Ювілей вступу на престол Яромира III відсвяткують скромно', 'Феєрверк скасовано з економії. Портрети імператора в управах обіцяють помити.'],
  ['Собор відслужив молебень за єдність імперії', 'Владика нагадав, що чотири століття тому віра зібрала ці землі докупи. Парафіяни поспішали на ярмарок.'],
  ['Купці просять друкувати накладні двома мовами', 'Ромейською пишуть закони, вальдорською торгуються на Ринку. Канцелярія обіцяє подумати.'],
  ['Студенти зібралися на вечір вальдорської поезії', 'Читали з рукописів: друкованих збірок ще немає. Поліція постояла під вікнами й пішла.'],
  ['У гімназіях дозволили факультатив рідної мови', 'Дві години на тиждень, після обіду. Записалося більше, ніж очікували.'],
  ['Делегати від Вальдорії поїхали до столиці', 'Везуть прохання про портові мита. Повернутися обіцяли до осені.'],
  // the Valdorian flag (blue, black, yellow: sea, land, sun) is banned; it only shows up in police reports
  ['Жандарми накрили криївку вальдорських націоналістів', 'У погребі на Подолі знайшли два прапори й скриню листівок. Господар каже, що погріб здавав під картоплю.'],
  ['Жандарми накрили криївку вальдорських націоналістів', 'На горищі гімназії вилучено блакитно-чорно-жовтий прапор. Учні клянуться, що це латки для театру.'],
  ['На маяку знову вивісили заборонений прапор', 'Висів до світанку. Доглядач маяка спав і нічого не бачив, як і минулого разу.']
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
  const c: CityState = { v: CITY_V, rng: (s.rng ^ 0x9e3779b9) >>> 0, econ, prev: { ...econ }, biz: [], rivals: initRivals(), seq: 0, news: [], done: [], today: [], last: null, tribute: 0 };
  for (let i = 0; i < 4; i++) c.biz.push(newBiz(c, s.year - 1 - cint(c, 6)));
  cityMorning(s, c);
  if (!c.news.some((x) => x.kind === 'open')) { const b = newBiz(c, s.year); c.biz.push(b); c.news.unshift({ kind: 'open', biz: b.id, head: `Відкриття на ${street(c, b)}: ${b.kind} «${b.name}»`, text: `${b.owner} відкриває ${kindAcc(b.kind)} «${b.name}». Сусіди кажуть, справи підуть добре.` }); }
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
  c.done = []; c.today = []; c.last = null; c.news = [];

  // owners with a grudge go to the paper or to the governor
  c.biz.filter((b) => b.status !== 'closed' && b.grudge >= 2).forEach((b) => {
    if (crand(c) < 0.35 + 0.15 * (b.grudge - 2)) {
      s.threat += b.tie === 'press' ? 6 : 3;
      if (b.tie === 'patron') s.patron = Math.max(1, s.patron - 5);
      b.grudge = 1;
      c.news.push({ kind: 'complaint', biz: b.id, head: `${b.owner}: «Чиновники нас душать»`, text: `${ow(b, 'Власник', 'Власниця')} ${b.kind === 'аптека' ? 'аптеки' : 'закладу'} «${b.name}» ${ow(b, 'розповів', 'розповіла')} редакції про часті перевірки й натяки на «подяку». Редакція шукає інших свідків.` });
    }
  });
  rivalNight(s, c);
  // the good name works on its own: the fund, the share in the paper and the whisperers
  const F = CITY_RULES.fame, fm = c.fame || {};
  if (fm.fund) { s.threat = Math.max(0, s.threat - F.fund.calmYr); s.people = clampN(s.people + F.fund.peopleYr, 0, 100); }
  if (fm.share) s.threat = Math.max(0, s.threat - F.share.calmYr);
  if (fm.whisper) { s.threat = Math.max(0, s.threat - F.whisper.calmYr); s.people = clampN(s.people + F.whisper.peopleYr, 0, 100); }
  // our "roofs": quiet money, but every roof is one more person who knows
  const roofs = c.biz.filter((b) => b.status === 'roof');
  if (roofs.length) s.threat += roofs.length;
  roofs.forEach((b) => { if (crand(c) < 0.08) { b.status = 'open'; b.grudge = 2; b.tribute = 0; c.news.push({ kind: 'complaint', biz: b.id, head: `«${b.name}» відмовляється платити`, text: `${b.owner} ${ow(b, 'знайшов', 'знайшла')} нових покровителів і каже, що старі домовленості більше не діють.` }); } });

  // a new business opens (not too many on the map)
  const open = c.biz.filter((b) => b.status !== 'closed').length;
  if (open < 18 && crand(c) < (open < 5 ? 0.85 : open < 10 ? 0.55 : 0.4)) {
    const b = newBiz(c, s.year);
    c.biz.push(b);
    c.news.unshift({ kind: 'open', biz: b.id, head: `Відкриття на ${street(c, b)}: ${b.kind} «${b.name}»`, text: `${b.owner} відкриває ${kindAcc(b.kind)} «${b.name}». Кажуть, справи підуть добре: торгівля в порту ${e.trade >= 100 ? 'на підйомі' : 'хоч і повільна, та стабільна'}.` });
  }
  // a rumour about somebody's good takings: a daily lead (only shops nobody holds yet)
  const quiet = c.biz.filter((b) => b.status === 'open' && !b.rival && !c.news.some((x) => x.biz === b.id));
  if (quiet.length) {
    const b = cpick(c, quiet), up = c.econ.trade >= 100;
    c.news.push({ kind: 'rumor', biz: b.id, head: `Кажуть, «${b.name}» ${up ? 'не встигає рахувати виторг' : 'тримається, попри кризу'}`, text: `${b.owner} (${b.kind}, ${DISTRICTS[b.district].t}) ${up ? ow(b, 'замовив нову вивіску й найняв', 'замовила нову вивіску й найняла') + ' ще двох прикажчиків' : ow(b, 'знизив', 'знизила') + ' ціни, але покупців не меншає'}.${b.pressure ? ' Після недавньої перевірки — помітно ' + ow(b, 'знервований', 'знервована') + '.' : ''}` });
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
  if (c.fame?.whisper) {
    const w = CITY_RULES.fame.whisper.cost;
    if (dirtyTotal(s) >= w) payDirty(s, w);
    else { c.fame.whisper = false; c.news.push({ kind: 'flavor', head: 'Шептуни розійшлися', text: 'Цього разу їм не заплатили, і в шинках про вас знову говорять що завгодно.' }); }
  }
}

// ---------------------------------------------------------------- the morning move

/** this shop or magnate has already had its move on this turn */
export const didAct = (c: CityState, id: string) => !!c.done && c.done.includes(id);
/** how many moves were made on this turn */
export const movesMade = (c: CityState) => (c.done ? c.done.length : 0);
/** this turn's result for one unit, if it was moved */
export const resultFor = (c: CityState, id: string) => (c.today || []).find((r) => (r.rival || r.biz) === id) || null;
const markDone = (c: CityState, id: string) => { (c.done ||= []).push(id); };
/** a move that could not be made: hand back the same state (callers and bots can tell nothing happened),
 *  unless this call had to create the city for an old save */
const noMove = (s: GameState, n: GameState) => (s.city ? s : n);
/** all dirty money: the drawer, the floor and the relative's warehouse — city moves can be paid from any of it */
export const dirtyTotal = (s: GameState) => s.cash + s.floor + s.wh;
/** pay dirty money: the drawer first, then the floor, then the warehouse */
function payDirty(n: GameState, cost: number) {
  let left = cost;
  (['cash', 'floor', 'wh'] as const).forEach((k) => { const c = Math.min(n[k], left); n[k] -= c; left -= c; });
}
/** moves allowed this year: a few, one more for every rank */
export const movesMax = (s: GameState) => RULES.cityMoves.base + RULES.cityMoves.perRank * s.rank;
/** moves still left this year */
export const movesLeft = (s: GameState) => Math.max(0, movesMax(s) - (s.city ? movesMade(s.city) : 0));
const OUT_OF_MOVES = 'Ходи на цей рік вичерпано';
function capMoves<T extends ActOption>(s: GameState, opts: T[]): T[] {
  return movesLeft(s) > 0 ? opts : opts.map((o) => (o.can ? { ...o, can: false, why: OUT_OF_MOVES } : o));
}

export interface ActOption { act: BizAct | RivalAct | InstAct; /** money it costs (dirty, or clean when `clean`) */ cost?: number; clean?: boolean; /** what it takes off the risk */ calm?: number; /** text instead of the cash gain */ gainT?: string; t: string; sub: string; can: boolean; why?: string; risk: number; /** chance of success, 0..1 */ odds: number; /** what success brings: cash now, or per year for a roof */ gain: number; perYear?: boolean }

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

export const bizActs = (s: GameState, b: Biz) => capMoves(s, bizActsRaw(s, b));
function bizActsRaw(s: GameState, b: Biz): ActOption[] {
  const rv = s.city && b.rival ? rivalOf(s.city, b.rival) : null;
  if (rv) {
    const cost = r10(b.wealth * 0.35);
    return [
      { act: 'inspect', t: 'Податкова перевірка', sub: `Заклад під рукою ${rivalCase(rv, 'gen')}: перевірка вдається гірше, а ${sx(rv, 'він', 'вона')} це запам’ятає.`, can: b.status === 'open' && b.pressure < 3, why: b.pressure >= 3 ? 'Тиснути сильніше вже нікуди' : undefined, risk: 2, odds: bizOdds(b, 'inspect'), gain: r10(b.wealth * (0.3 + 0.2 * b.pressure)) },
      { act: 'outbid', t: 'Перебити дах', sub: `Дати власнику більше, ніж платить ${rivalCase(rv, 'dat')}. ${rv.name} цього не пробачить.`, can: b.status === 'open' && dirtyTotal(s) >= cost, why: dirtyTotal(s) < cost ? `Бракує брудних: потрібно ${fmt(cost)} кр.` : undefined, risk: 2, odds: bizOdds(b, 'outbid', s), gain: r10(b.wealth * 0.25), perYear: true, cost },
      { act: 'seal', t: 'Опечатати заклад', sub: '', can: false, why: `Під рукою ${rivalCase(rv, 'gen')}: чіпати відкрито не можна`, risk: 0, odds: 0, gain: 0 }
    ];
  }
  const tie = b.tie === 'press' ? ' Власник дружить із газетою.' : b.tie === 'patron' ? ' Власник ходить до губернатора.' : '';
  return [
    { act: 'inspect', t: 'Податкова перевірка', sub: `Натякнути, що порушення знайдуться завжди. Може «віддячити» ~${fmt(r10(b.wealth * (0.3 + 0.2 * b.pressure)))} кр.${tie}`, can: b.status === 'open' && b.pressure < 3, why: b.pressure >= 3 ? 'Тиснути сильніше вже нікуди' : undefined, risk: 1 + (b.tie ? 2 : 0), odds: bizOdds(b, 'inspect'), gain: r10(b.wealth * (0.3 + 0.2 * b.pressure)) },
    { act: 'seal', t: 'Опечатати заклад', sub: `Знайти «порушення» і повісити пломбу. Або платить ~${fmt(r10(b.wealth * 1.2))} кр., або закриється.`, can: b.status === 'open' && b.pressure >= 1, why: b.pressure < 1 ? 'Спершу перевірка: власник має відчути тиск' : undefined, risk: 3 + (b.tie ? 3 : 0), odds: bizOdds(b, 'seal'), gain: r10(b.wealth * 1.2) },
    { act: 'roof', t: 'Запропонувати «дах»', sub: `Захист від інших чиновників за ~${fmt(r10(b.wealth * 0.25))} кр. щороку. Ризик +1 на рік, поки платить.`, can: b.status === 'open' && b.pressure >= 1, why: b.pressure < 1 ? 'Без тиску власник не зрозуміє, навіщо йому захист' : undefined, risk: 2, odds: bizOdds(b, 'roof'), gain: r10(b.wealth * 0.25), perYear: true }
  ];
}

/** One move per business per turn. */
export function actOnBiz(s: GameState, id: string, act: BizAct): GameState {
  if (!['morning', 'office', 'evening'].includes(s.screen)) throw new Error('Moves are made during the day');
  const n = structuredClone(s);
  const c = n.city || (n.city = initCity(n));
  if (didAct(c, id) || movesLeft(n) <= 0) return noMove(s, n);
  const b = c.biz.find((x) => x.id === id);
  if (!b) return noMove(s, n);
  const opt = bizActs(n, b).find((o) => o.act === act);
  if (!opt || !opt.can) return noMove(s, n);
  markDone(c, b.id);
  const res: ActResult = { biz: b.id, act, ok: false, title: '', text: '', cash: 0, d: {} };
  const q = bizOdds(b, act, n);
  const holder = rivalOf(c, b.rival);
  if (act === 'inspect') {
    b.pressure += 1;
    res.d.i = opt.risk;
    if (holder) holder.heat = Math.min(10, holder.heat + 1);
    if (crand(c) < q) {
      res.ok = true; res.cash = r10(b.wealth * (0.3 + 0.2 * (b.pressure - 1)));
      res.title = `${b.owner} «${ow(b, 'віддячив', 'віддячила')}»`; res.text = `Інспектор повернувся з конвертом: ${fmt(res.cash)} кр. Перевірка нічого не знайшла.`;
    } else {
      b.grudge += 1;
      res.title = `${b.owner} не ${ow(b, 'зрозумів', 'зрозуміла')} натяку`; res.text = ow(b, 'Власник показав усі книги й пообіцяв поскаржитися. Тиснути можна далі, але він уже насторожі.', 'Власниця показала всі книги й пообіцяла поскаржитися. Тиснути можна далі, але вона вже насторожі.');
      if (b.tie === 'press') { res.d.n = -2; res.d.i = (res.d.i || 0) + 2; }
      if (b.tie === 'patron') res.d.p = -3;
    }
  } else if (act === 'seal') {
    b.pressure = Math.min(3, b.pressure + 1);
    res.d.i = opt.risk;
    if (crand(c) < q) {
      res.ok = true; res.cash = r10(b.wealth * 1.2);
      res.title = `Пломбу зняли за ${fmt(res.cash)} кр.`; res.text = `${b.owner} ${ow(b, 'приніс', 'принесла')} гроші того ж дня. Заклад працює, але ${ow(b, 'власник', 'власниця')} вас ненавидить.`;
      b.grudge += 1;
    } else {
      b.status = 'closed'; b.grudge = 3;
      res.title = `${cap(bizTitle(b))} закрито`; res.text = `${ow(b, 'Власник не заплатив і закрив', 'Власниця не заплатила й закрила')} справу. Місто втратило заклад, газета — ні: вранці про це напишуть.`;
      res.d.n = -3;
      c.news.unshift({ kind: 'closed', biz: b.id, head: `Зачинено: ${b.kind} «${b.name}»`, text: `Після «перевірки» ${b.owner} не ${ow(b, 'відкрив', 'відкрила')} двері. Сусіди кажуть, справа не в порушеннях.` });
    }
  } else if (act === 'outbid' && holder) {
    payDirty(n, opt.cost || 0); res.spent = opt.cost || 0; res.d.i = opt.risk;
    holder.heat = Math.min(10, holder.heat + 2);
    if (crand(c) < q) {
      res.ok = true; b.rival = null; b.status = 'roof'; b.tribute = r10(b.wealth * 0.25); b.grudge = 0; holder.power = Math.max(5, holder.power - 4);
      res.title = `«${b.name}» перейшов під ваш дах`; res.text = `Ви заплатили ${fmt(opt.cost || 0)} кр. і перебили ${rivalCase(holder, 'acc')}. Цього не забудуть.`; res.d.s = 1;
    } else {
      res.title = `${holder.name} ${sx(holder, 'утримав', 'утримала')} «${b.name}»`; res.text = `Гроші пішли, ${ow(b, 'власник злякався й відмовився', 'власниця злякалася й відмовилася')}. ${holder.name} уже знає, хто стукав у двері.`;
    }
  } else {
    if (crand(c) < q) {
      res.ok = true; b.status = 'roof'; b.tribute = r10(b.wealth * 0.25); b.grudge = 0;
      res.title = `${b.owner} під вашим «дахом»`; res.text = `Щовечора в шухляду лягатиме данина ~${fmt(b.tribute)} кр. на рік. Поки платить — інші чиновники ${ow(b, 'його', 'її')} не чіпають.`;
      res.d.i = 2; res.d.s = 2;
    } else {
      b.grudge += 1; res.d.i = 1;
      res.title = `${b.owner} ${ow(b, 'відмовився', 'відмовилася')}`; res.text = ow(b, 'Сказав, що краще заплатить штраф, ніж вам. Запам’ятав розмову.', 'Сказала, що краще заплатить штраф, ніж вам. Запам’ятала розмову.');
    }
  }
  n.cash += res.cash;
  if (res.d.p) n.patron = clamp100(n.patron + res.d.p);
  if (res.d.n) n.people = clamp100(n.people + res.d.n);
  if (res.d.s) n.system = clamp100(n.system + res.d.s);
  if (res.d.i) n.threat += res.d.i;
  b.grudge = Math.min(3, b.grudge);
  c.last = res; (c.today ||= []).push(res);
  return n;
}

/** for saves made before the city existed */
export function ensureCity(s: GameState): GameState {
  if (s.city && s.city.v === CITY_V) return s;
  const n = structuredClone(s); n.city = initCity(n); return n;
}


// ---------------------------------------------------------------- the rivals' night

const clampN = (v: number, a: number, z: number) => Math.max(a, Math.min(z, v));
const SMEAR = ['«Голос Порту» вийшов із карикатурою на вас: ви в кареті, а позаду — порожній міський гаманець.', 'У «Голосі Порту» — стаття «Куди діваються гроші з чавунного скарбця?». Автора не названо.', 'Вранці на розі продавали листівку з вашим профілем і написом «Дорого стоїть чесність».'];
const INFORM = ['Граф написав губернатору «про непорядки в управі». Губернатор попросив пояснень.', 'До канцелярії губернатора дійшов анонімний лист про ваші «подарунки». Почерк впізнаваний.', 'За обідом у губернатора граф сказав: «Дехто в місті давно забув, чий він слуга».'];

/** held shops per rival */
/** The personal file on each magnate: who he is, what he wants, where he is weak. Content only, not saved state. */
export interface RivalFile { age: number; from: string; bio: string; likes: string; weak: string; quote: string }
export const RIVAL_FILE: Record<string, RivalFile> = {
  r1: { age: 54, from: 'син сільського солоного візника', bio: 'Батько возив сіль із лиманів на Ринок, син почав із однієї ятки й бочки оселедців. Тепер у нього склади на Набережній, пай у пароплавстві, кілька шинків під чужими іменами, а в записнику — ціна на ливарню. Імперській скарбниці платить мита, вальдорським купцям дає кредити, а сам не належить нікому: родом вальдорець, рахує ромейською. Рахує повільно, але нічого не забуває.', likes: 'цифри, порядок, розписки із закрученою печаткою', weak: 'вважає, що все в місті продається, тож і сам легко платить за «дах» — і так само легко його перебиває', quote: '«Місто — це товар. Хтось же має ним торгувати.»' },
  r2: { age: 47, from: 'вдова друкаря з Подолу', bio: 'Успадкувала «Голос Порту» разом із боргами й з перших днів почала друкувати те, чого інші бояться. Листок виходить ромейською, але торік з’явився додаток вальдорською: продається вдвічі краще. Подейкують, що половину скандалів вона вигадує сама. Насправді вона продає не газету, а думку міста: хто заніс, про того пишуть як про благодійника, хто ні — того малюють у кареті з чужим гаманцем.', likes: 'гучні заголовки, чужі секрети, чай із коньяком', weak: 'мріє про салон у Старому місті, а двері туди відчиняє лише губернатор, тож його ім’я в її листку з’являється рідко й без глузування', quote: '«Правда — це те, що надруковано першим.»' },
  r3: { age: 68, from: 'старий рід, далека рідня дому Святогорських', bio: 'Кречетови-Задонські служили імперії, ще коли її збирали докупи: воєводи, посли, хрещені батьки при дворі. Земель поменшало, замок облазить, але двері досі відчиняються самі: губернатор обідає в графа щочетверга, а лист із його печаткою в міністерстві читають першим. Удома говорить ромейською, вальдорською — лише зі слугами. Вас називає не інакше як «вискочка з управи».', likes: 'родовід, полювання, довгі листи з підкресленнями', weak: 'має доступ, але не має грошей: тоне в боргах і панічно боїться, що замок піде з молотка; за відстрочку може забути всі образи', quote: '«Мій рід тут був, коли вашого ще не було навіть у списках.»' }
};

/** The next generation of each magnate's house: when our family passes to an heir, so do theirs. */
interface RivalHeir { name: string; title: string; f?: boolean; file: RivalFile; cases: { gen: string; dat: string; acc: string; ins: string }; news: [string, string] }
export const RIVAL_HEIRS: Record<string, RivalHeir> = {
  r1: {
    name: 'Пан Северин Солонар', title: 'син купця, господар ливарні й пароплавства',
    file: { age: 31, from: 'син Солонара, вчився в столиці', bio: 'Старий Солонар передав синові склади, пароплави й записник із боргами всього порту. Северин вчився в столиці, говорить трьома мовами й рахує швидше за батька. Першим ділом купив ливарню й пай у вугільних копальнях. Батько купував заклади, син купує людей у ратуші: так дешевше.', likes: 'ливарня, вугілля, парові машини', weak: 'хоче, щоб його поважав старий рід із пагорба, а там у ньому досі бачать онука солоного візника', quote: '«Батько рахував крони. Я рахую відсотки.»' },
    cases: { gen: 'Пана Северина Солонара', dat: 'Пану Северину Солонару', acc: 'Пана Северина Солонара', ins: 'Паном Северином Солонаром' },
    news: ['Склади Солонара перейшли до сина', 'Старий купець відійшов від справ. Северин Солонар уже купив ливарню, звільнив половину прикажчиків і найняв бухгалтерів зі столиці.']
  },
  r2: {
    name: 'Пані Ельза Берг', title: 'донька Берг, редакторка «Голосу Порту»', f: true,
    file: { age: 26, from: 'донька вдови Берг', bio: 'Мати передала їй газету й звичку друкувати першою. Ельза перевела «Голос Порту» на вальдорську повністю й продає вдвічі більше. Мати вигадувала скандали, донька їх розкопує: у неї знайомі серед писарів, кучерів і покоївок.', likes: 'нічні засідання редакції, велосипед, чужі листи', weak: 'вірить у те, що пише, тож її купують не грошима, а правдою про когось іншого; але рахунки редакції досі оплачують ті самі клієнти, що й за матері', quote: '«Мама писала, що чула. Я пишу, що бачила.»' },
    cases: { gen: 'Пані Ельзи Берг', dat: 'Пані Ельзі Берг', acc: 'Пані Ельзу Берг', ins: 'Пані Ельзою Берг' },
    news: ['«Голос Порту» має нову редакторку', 'Вдова Берг передала газету доньці. Перший номер Ельзи Берг вийшов повністю вальдорською й розійшовся до обіду.']
  },
  r3: {
    name: 'Граф Анатолій Кречетов-Задонський', title: 'небіж старого графа, свій при дворі',
    file: { age: 34, from: 'небіж старого графа, повернувся зі столиці', bio: 'Старий граф помер, лишивши небожеві замок, герб і борги. Анатолій прожив молодість у столиці при дворі й повернувся з манерами, позиками й друзями в міністерствах. Сам доносів не пише: за нього пишуть інші, а він лише передає листи за обідом.', likes: 'карти, полювання, листи з печатками міністерств', weak: 'програє в карти більше, ніж має; за сплачений борг забуде будь-яку образу', quote: '«Дядько воював із вискочками. Я з ними обідаю й записую.»' },
    cases: { gen: 'Графа Анатолія Кречетова-Задонського', dat: 'Графу Анатолію Кречетову-Задонському', acc: 'Графа Анатолія Кречетова-Задонського', ins: 'Графом Анатолієм Кречетовим-Задонським' },
    news: ['Помер граф Кречетов-Задонський', 'Замок на пагорбі успадкував небіж Анатолій, який двадцять років прожив при дворі. Кредитори графа вже стоять біля брами.']
  }
};
/** The magnates were renamed on 16.11 (Вайсман → Солонар, Ґжеґожевський → Кречетов-Задонський). A save keeps the
 * names inside its text (rival names, news, the day's log), so an old save is rewritten once on load. Longest forms first. */
const RENAMED: [string, string][] = [
  ['Леопольда Вайсмана', 'Северина Солонара'],
  ['Леопольду Вайсману', 'Северину Солонару'],
  ['Леопольдом Вайсманом', 'Северином Солонаром'],
  ['Леопольд Вайсман', 'Северин Солонар'],
  ['Леопольдом', 'Северином'],
  ['Леопольда', 'Северина'],
  ['Леопольду', 'Северину'],
  ['Леопольд', 'Северин'],
  ['Вайсманом', 'Солонаром'],
  ['Вайсмана', 'Солонара'],
  ['Вайсману', 'Солонару'],
  ['Вайсман', 'Солонар'],
  ['Казимира Ґжеґожевського', 'Анатолія Кречетова-Задонського'],
  ['Казимиру Ґжеґожевському', 'Анатолію Кречетову-Задонському'],
  ['Казимиром Ґжеґожевським', 'Анатолієм Кречетовим-Задонським'],
  ['Казимир Ґжеґожевський', 'Анатолій Кречетов-Задонський'],
  ['Казимиром', 'Анатолієм'],
  ['Казимира', 'Анатолія'],
  ['Казимиру', 'Анатолію'],
  ['Казимир', 'Анатолій'],
  ['Ґжеґожевського', 'Кречетова-Задонського'],
  ['Ґжеґожевському', 'Кречетову-Задонському'],
  ['Ґжеґожевським', 'Кречетовим-Задонським'],
  ['Ґжеґожевських', 'Кречетових-Задонських'],
  ['Ґжеґожевський', 'Кречетов-Задонський']
];
export function renameLegacy(raw: string): string {
  const TITLES: [string, string][] = [
    ['"title":"купець першої гільдії"', '"title":"купець першої гільдії, склади й пароплави"'],
    ['"title":"старий рід із Замкового пагорба"', '"title":"старий рід, рідня двору"'],
    ['"title":"син купця, господар пароплавства"', '"title":"син купця, господар ливарні й пароплавства"'],
    ['"title":"небіж старого графа, господар замку"', '"title":"небіж старого графа, свій при дворі"']
  ];
  const all = [...RENAMED, ...TITLES];
  if (!all.some(([a]) => raw.includes(a))) return raw;
  return all.reduce((t, [a, b]) => t.split(a).join(b), raw);
}

/** heirs of the magnates whose portraits exist in public/art/rivals/<id>-g2.jpg */
export const RIVAL_HEIR_PORTRAITS = new Set<string>(['r1', 'r2', 'r3']);
export const rivalFile = (r: Rival): RivalFile => (r.gen && r.gen > 1 && RIVAL_HEIRS[r.id] ? RIVAL_HEIRS[r.id].file : RIVAL_FILE[r.id]);
export const rivalPortrait = (r: Rival) => `art/rivals/${r.id}${r.gen && r.gen > 1 && RIVAL_HEIR_PORTRAITS.has(r.id) ? '-g2' : ''}.jpg`;

/** The city the heir takes over (same era): the shops, our roofs, the magnates and their grudges stay;
 *  each magnate's house passes to its own heir. A collapse loses our roofs: owners stop paying a fallen family. */
export function inheritCity(old: CityState, collapse: boolean): CityState {
  const c: CityState = structuredClone(old);
  c.done = []; c.today = []; c.last = null; c.tribute = 0; c.news = [];
  if (collapse) c.biz.forEach((b) => { if (b.status === 'roof') { b.status = 'open'; b.tribute = 0; b.grudge = 0; } });
  c.rivals.forEach((r) => {
    const h = RIVAL_HEIRS[r.id];
    if (!h || (r.gen && r.gen > 1)) return;
    r.gen = 2; r.name = h.name; r.title = h.title; r.f = !!h.f;
    r.heat = Math.round(r.heat / 2); r.power = clampN(Math.round(r.power * 0.85), 5, 95);
    r.last = r.ally ? 'союзник, як і батьки' : 'новий голова дому';
    c.news.push({ kind: 'rival', rival: r.id, head: h.news[0], text: h.news[1] + (r.ally ? ' Шлюбний союз із вашим родом лишається в силі.' : '') });
  });
  return c;
}

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
      if (crand(c) < 0.3) c.news.push({ kind: 'rival', rival: r.id, head: `${r.name} публічно ${sx(r, 'підтримав', 'підтримала')} вас`, text: `Родичі не кидають своїх: ${r.name} ${sx(r, 'сказав', 'сказала')} на прийомі, що «${s.first} ${s.surname} — людина порядна». Ризик трохи знизився.` });
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
      c.news.push({ kind: 'rival', rival: r.id, biz: b.id, head: `${r.name} ${sx(r, 'узяв', 'узяла')} «${b.name}» під свою руку`, text: `${b.owner} тепер платить ${rivalCase(r, 'dat')}. Інспекторам радять туди не заходити, якщо не хочуть клопоту.` });
    } else if (pick === 1) {
      if (r.style === 'smear') {
        const cut = c.fame?.share ? K.fame.share.smearCut : 1; s.threat += Math.round(K.smear.threat * sev * cut); s.people = clampN(s.people - Math.round(K.smear.people * sev * cut), 0, 100); r.last = sx(r, 'облив', 'облила') + ' брудом у пресі';
        c.news.push({ kind: 'attack', rival: r.id, head: `Брудна преса: ${r.name}`, text: SMEAR[cint(c, SMEAR.length)] });
      } else if (r.style === 'informer') {
        s.patron = clampN(s.patron - K.inform.patron * sev, 0, 100); s.threat += K.inform.threat * sev; r.last = sx(r, 'поскаржився', 'поскаржилась') + ' губернатору';
        c.news.push({ kind: 'attack', rival: r.id, head: `Донос: ${r.name}`, text: INFORM[cint(c, INFORM.length)] });
      } else {
        const lost = Math.min(s.cash, K.boycott * sev); s.cash -= lost; s.threat += 1; r.last = sx(r, 'переманив', 'переманила') + ' ваших людей';
        c.news.push({ kind: 'attack', rival: r.id, head: `${r.name} ${sx(r, 'переманив', 'переманила')} людей`, text: `Двоє ваших посильних перейшли до ${rivalCase(r, 'gen')}${lost ? ` і прихопили ${fmt(lost)} кр. з каси` : ''}. Тепер вони знають забагато.` });
      }
    } else if (pick === 2) {
      const b = cpick(c, mine);
      if (crand(c) < K.poachChance) {
        b.status = 'open'; b.rival = r.id; b.tribute = 0; b.grudge = 0; r.power = clampN(r.power + 3, 5, 95); r.last = `${sx(r, 'перебив', 'перебила')} дах «${b.name}»`;
        c.news.push({ kind: 'rival', rival: r.id, biz: b.id, head: `${r.name} ${sx(r, 'перебив', 'перебила')} ваш дах над «${b.name}»`, text: `${b.owner} більше не платить вам. Хтось пообіцяв ${ow(b, 'йому', 'їй')} надійніший захист.` });
      } else {
        r.last = sx(r, 'спробував', 'спробувала') + ' перебити дах'; c.news.push({ kind: 'rival', rival: r.id, biz: b.id, head: `${r.name} ${sx(r, 'пробував', 'пробувала')} забрати «${b.name}»`, text: `${b.owner} ${ow(b, 'відмовив', 'відмовила')}. Цього разу.` });
      }
    } else r.last = 'вичікує';
  }
}

// ---------------------------------------------------------------- moves against a rival

export interface RivalOption extends ActOption { act: RivalAct }

const eligibleKid = (s: GameState) => [...s.kids].filter((k) => !k.gone && k.age >= 16).sort((a, b) => b.age - a.age)[0] || null;
export const marriageCost = (r: Rival) => r10(300 + r.power * 8);
export const exposeOdds = (s: GameState, r: Rival) => clampN(0.5 + (s.patron - 50) / 150 - r.power / 250, 0.15, 0.85);

export const rivalActs = (s: GameState, r: Rival) => capMoves(s, rivalActsRaw(s, r));
function rivalActsRaw(s: GameState, r: Rival): RivalOption[] {
  const K = CITY_RULES, kid = eligibleKid(s), bribe = r10(K.bribeBase + r.power * K.bribePerPower), dowry = marriageCost(r);
  if (r.ally) return [];
  return [
    { act: 'bribe', t: 'Підкупити', sub: `Подарунок ${rivalCase(r, 'dat')}: гроші, що виглядають як шана. Злість спадає: з вами, виявляється, можна домовитись.`, can: dirtyTotal(s) >= bribe && r.heat >= 0.5, why: dirtyTotal(s) < bribe ? `Бракує брудних: потрібно ${fmt(bribe)} кр.` : 'Не сердиться і так', risk: 0, odds: 0.85, gain: 0, gainT: `злість −${K.bribeDrop}`, cost: bribe },
    { act: 'expose', t: sx(r, 'Здати його', 'Здати її'), sub: `Анонімно «повідомити» куди слід про ${rivalCase(r, 'acc')}. Якщо вдасться, вплив і два заклади під ${sx(r, 'його', 'її')} рукою похитнуться. Якщо ні — дізнаються, хто писав.`, can: true, risk: 2, odds: exposeOdds(s, r), gain: 0, gainT: `вплив −${K.exposeDamage}` },
    { act: 'marry', t: 'Поріднитися шлюбом', sub: `${kid ? `${kid.first} (${kid.age} р.)` : 'Дитина'} ${kid && kid.g === 'm' ? 'візьме за дружину родичку' : 'вийде за родича'} ${rivalCase(r, 'gen')}. Дім стане союзником назавжди, але ви втратите дитину в родині.`, can: !!kid && r.heat <= K.marryHeat && dirtyTotal(s) >= dowry, why: !kid ? 'Немає дитини від 16 років' : r.heat > K.marryHeat ? `${r.name} надто злий: спершу вгамуйте` : `Придане ${fmt(dowry)} кр. — бракує брудних`, risk: 0, odds: 1, gain: 0, gainT: 'союзник назавжди', cost: dowry }
  ];
}

export function actOnRival(s: GameState, id: string, act: RivalAct): GameState {
  if (!['morning', 'office', 'evening'].includes(s.screen)) throw new Error('Moves are made during the day');
  const n = structuredClone(s);
  const c = n.city || (n.city = initCity(n));
  if (didAct(c, id) || movesLeft(n) <= 0) return noMove(s, n);
  const r = rivalOf(c, id);
  if (!r) return noMove(s, n);
  const opt = rivalActs(n, r).find((o) => o.act === act);
  if (!opt || !opt.can) return noMove(s, n);
  markDone(c, r.id);
  const K = CITY_RULES, res: ActResult = { biz: '', rival: r.id, act: act as never, ok: false, title: '', text: '', cash: 0, d: {} };
  payDirty(n, opt.cost || 0); res.spent = opt.cost || 0;
  if (act === 'bribe') {
    if (crand(c) < opt.odds) { r.heat = Math.max(0, r.heat - K.bribeDrop); res.ok = true; res.title = `${r.name} ${sx(r, 'прийняв', 'прийняла')} дарунок`; res.text = 'Подяка тривала довше, ніж слід було б. Зате полювання вщухло.'; }
    else { res.title = `${r.name} ${sx(r, 'взяв', 'взяла')} гроші й нічого не ${sx(r, 'обіцяв', 'обіцяла')}`; res.text = 'Дарунок прийнято, а злість лишилась. Таке трапляється.'; res.d.i = 1; }
  } else if (act === 'expose') {
    res.d.i = opt.risk;
    if (crand(c) < opt.odds) {
      r.power = Math.max(5, r.power - K.exposeDamage); r.heat = Math.min(10, r.heat + 2); res.ok = true;
      const lost = holdings(c, r.id).slice(0, 2); lost.forEach((b) => { b.rival = null; });
      res.title = `${r.name} ${sx(r, 'втратив', 'втратила')} вплив`; res.text = `Перевірка до ${sx(r, 'нього', 'неї')} дійшла. ${lost.length ? `Заклади ${lost.map((b) => `«${b.name}»`).join(' і ')} лишилися без захисту.` : 'Щоправда, захищати йому вже нікого.'} Тепер шукатимуть, хто це влаштував.`;
    } else {
      r.heat = Math.min(10, r.heat + 3); res.d.i = opt.risk + 1; res.title = `${r.name} ${sx(r, 'дізнався', 'дізналася')}, хто писав`; res.text = 'Донос не спрацював, а почерк виявився впізнаваним. Тепер на вас полюватимуть серйозніше.';
    }
  } else {
    const kid = eligibleKid(n)!;
    kid.gone = true;
    kid.why = `${kid.g === 'f' ? 'вийшла заміж' : 'одружився'} — тепер у родині ${rivalCase(r, 'gen')}`;
    r.ally = true; r.heat = 0; r.power = clampN(r.power + 6, 5, 95); res.ok = true; res.d.s = 2;
    res.title = `Союз із ${rivalCase(r, 'ins')}`; res.text = `${kid.first} ${kid.g === 'f' ? 'увійшла' : 'увійшов'} до їхнього дому. Весілля вийшло гучним, а ворожнеча — тихою. Тепер ${r.name} щороку знижує ваш ризик.`;
  }
  c.last = res; (c.today ||= []).push(res);
  if (res.d.i) n.threat += res.d.i;
  if (res.d.s) n.system = clamp100(n.system + res.d.s);
  return n;
}

// ---------------------------------------------------------------- the good name

export interface Inst { id: InstId; t: string; place: string; sub: string; x: number; y: number; art: string }
/** the four places in the city where a name is washed; positions are on the plan (same units as the shops) */
export const INSTS: Inst[] = [
  { id: 'charity', t: 'Сиротинець святої Анни', place: 'при монастирі', sub: 'Пожертви бачать усі. Добрі справи — найкраща відповідь на чутки.', x: 133, y: 93, art: 'orphanage' },
  { id: 'press', t: 'Редакція «Вісника»', place: 'Старе місто', sub: 'Газета пише те, за що їй платять. Або те, чим володіє її пайовик.', x: 84, y: 44, art: 'press' },
  { id: 'whisper', t: 'Ринкові шептуни', place: 'Торговий майдан', sub: 'Люди в шинках і на ринку щодня розповідають, яка ви порядна людина.', x: 104, y: 98, art: 'market' },
  { id: 'okhrana', t: 'Жандармське управління', place: 'Замкова вулиця', sub: 'Ротмістр уміє зробити так, що критики раптом замовкають.', x: 74, y: 75, art: 'gendarm' }
];
export const instOf = (id: string) => INSTS.find((i) => 'i:' + i.id === id || i.id === id) || null;

export const instActs = (s: GameState, id: InstId) => capMoves(s, instActsRaw(s, id));
function instActsRaw(s: GameState, id: InstId): ActOption[] {
  const F = CITY_RULES.fame, fm = s.city?.fame || {};
  switch (id) {
    case 'charity': return [
      { act: 'donate', t: 'Пожертва сиротинцю', sub: `Публічний дар чистими: про вас говорять як про благодійника. Ризик −${F.donate.calm}, народ +${F.donate.people}.`, can: s.clean >= F.donate.clean, why: `Потрібно ${fmt(F.donate.clean)} кр. чистими`, risk: 0, odds: 1, gain: 0, gainT: `ризик −${F.donate.calm}`, cost: F.donate.clean, clean: true, calm: F.donate.calm },
      fm.fund
        ? { act: 'fund', t: 'Фонд роду працює', sub: `Щороку: ризик −${F.fund.calmYr}, народ +${F.fund.peopleYr}.`, can: false, why: `Фонд уже заснований: щороку ризик −${F.fund.calmYr}`, risk: 0, odds: 1, gain: 0 }
        : { act: 'fund', t: 'Заснувати фонд роду', sub: `Фонд «${s.surname} — дітям»: разовий внесок, а далі щороку ризик −${F.fund.calmYr} і народ +${F.fund.peopleYr}.`, can: s.clean >= F.fund.clean, why: `Потрібно ${fmt(F.fund.clean)} кр. чистими`, risk: 0, odds: 1, gain: 0, gainT: `ризик −${F.fund.calmYr} щороку`, cost: F.fund.clean, clean: true, perYear: true }
    ];
    case 'press': return [
      { act: 'article', t: 'Замовна стаття', sub: `Нарис про вашу чесну службу. Редактор може й злякатися: тоді гроші пропали.`, can: dirtyTotal(s) >= F.article.cost, why: `Бракує брудних: потрібно ${fmt(F.article.cost)} кр.`, risk: 0, odds: F.article.odds, gain: 0, gainT: `ризик −${F.article.calm}`, cost: F.article.cost, calm: F.article.calm },
      fm.share
        ? { act: 'share', t: 'Пай у «Віснику» ваш', sub: '', can: false, why: `Щороку ризик −${F.share.calmYr}, брудна преса б’є вдвічі слабше`, risk: 0, odds: 1, gain: 0 }
        : { act: 'share', t: 'Купити пай у газеті', sub: `Через підставну особу. Щороку ризик −${F.share.calmYr}, а нападки «Голосу Порту» б’ють вдвічі слабше.`, can: dirtyTotal(s) >= F.share.cost, why: `Бракує брудних: потрібно ${fmt(F.share.cost)} кр.`, risk: 0, odds: 1, gain: 0, gainT: `ризик −${F.share.calmYr} щороку`, cost: F.share.cost, perYear: true }
    ];
    case 'whisper': return fm.whisper
      ? [{ act: 'dismiss', t: 'Розпустити шептунів', sub: `Заощадите ${fmt(F.whisper.cost)} кр. на рік, але чутки підуть без нагляду.`, can: true, risk: 0, odds: 1, gain: 0, gainT: `−${fmt(F.whisper.cost)} кр. витрат` }]
      : [{ act: 'hire', t: 'Найняти шептунів', sub: `${fmt(F.whisper.cost)} кр. щороку брудними. Щороку ризик −${F.whisper.calmYr}, народ +${F.whisper.peopleYr}.`, can: dirtyTotal(s) >= F.whisper.cost, why: `Бракує брудних: потрібно ${fmt(F.whisper.cost)} кр.`, risk: 0, odds: 1, gain: 0, gainT: `ризик −${F.whisper.calmYr} щороку`, cost: F.whisper.cost, perYear: true }];
    case 'okhrana': return [
      { act: 'silence', t: 'Заткнути критиків', sub: `Ротмістр «поговорить» із тими, хто скаржиться. Образи власників зникнуть, але місто це відчує. Якщо ротмістр передумає — ризик +${F.silence.backfire}.`, can: dirtyTotal(s) >= F.silence.cost, why: `Бракує брудних: потрібно ${fmt(F.silence.cost)} кр.`, risk: 0, odds: F.silence.odds, gain: 0, gainT: `ризик −${F.silence.calm}`, cost: F.silence.cost, calm: F.silence.calm }
    ];
  }
}

/** One move per institution per turn. */
export function actOnInst(s: GameState, id: InstId, act: InstAct): GameState {
  if (!['morning', 'office', 'evening'].includes(s.screen)) throw new Error('Moves are made during the day');
  const n = structuredClone(s);
  const c = n.city || (n.city = initCity(n));
  const uid = 'i:' + id;
  if (didAct(c, uid) || movesLeft(n) <= 0) return noMove(s, n);
  const opt = instActs(n, id).find((o) => o.act === act);
  if (!opt || !opt.can) return noMove(s, n);
  markDone(c, uid);
  const F = CITY_RULES.fame, fm = (c.fame ||= {});
  const res: ActResult = { biz: uid, act, ok: true, title: '', text: '', cash: 0, d: {} };
  if (opt.clean) n.clean -= opt.cost || 0; else payDirty(n, opt.cost || 0);
  res.spent = opt.cost || 0; res.spentClean = !!opt.clean;
  const calm = (k: number) => { const was = n.threat; n.threat = Math.max(0, n.threat - k); res.d.i = n.threat - was; };
  if (act === 'donate') { calm(F.donate.calm); n.people = clamp100(n.people + F.donate.people); res.d.n = F.donate.people; res.title = 'Сиротинець дякує благодійнику'; res.text = 'Ігуменя згадала вас у недільній проповіді. На ринку кажуть: «Не такий уже він і поганий».'; }
  else if (act === 'fund') { fm.fund = true; res.title = `Фонд «${n.surname} — дітям» відкрито`; res.text = 'Табличка на воротах сиротинця, щорічний бал і фотографія в газеті. Добре ім’я тепер працює саме.'; }
  else if (act === 'share') { fm.share = true; res.title = kinFor('Пай у «Віснику» записано на шурина', n.gender); res.text = 'Редактор тепер двічі перечитує все, що стосується вашої родини.'; }
  else if (act === 'hire') { fm.whisper = true; res.title = 'Шептуни взялися до роботи'; res.text = 'Візник, двоє прикажчиків і вдова з рибного ряду щодня згадують, як ви комусь допомогли.'; }
  else if (act === 'dismiss') { fm.whisper = false; res.title = 'Шептунів розпущено'; res.text = 'Гроші залишилися в шухляді, а чутки — без нагляду.'; }
  else if (act === 'article') {
    if (crand(c) < F.article.odds) { calm(F.article.calm); res.title = 'Нарис про чесного чиновника'; res.text = '«Вісник» на другій шпальті розповів, як ви навели лад у справах міста. Сусіди читали вголос.'; }
    else { res.ok = false; res.title = 'Статтю зарізали'; res.text = 'Редактор узяв гроші, але цензор у Ратуші статтю не пропустив. Гроші не повертають.'; }
  } else if (act === 'silence') {
    if (crand(c) < F.silence.odds) {
      calm(F.silence.calm); n.people = clamp100(n.people - F.silence.people); res.d.n = -F.silence.people;
      c.biz.forEach((b) => { b.grudge = 0; });
      res.title = 'Критики замовкли'; res.text = 'Двоє крамарів забрали скарги, автор листа до газети раптом поїхав до родичів. Місто стало тихішим — і трохи наляканим.';
    } else { res.ok = false; n.threat += F.silence.backfire; res.d.i = F.silence.backfire; res.title = 'Ротмістр узяв гроші й записав вас'; res.text = 'Конверт зник у шухляді, а ваше прізвище — у його записнику. Тепер він знає про вас більше.'; }
  }
  c.last = res; (c.today ||= []).push(res);
  return n;
}
