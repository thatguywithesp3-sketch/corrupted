// The chronicle between Era I and Era II (art/LORE.md → «Перехід»): the front page of July 1914 — war — with one
// decision for the new head of the family, who then serves through the war and the revolution inside Era II
// (1914–1941). The pages written for 1917, 1918 and 1920 wait in ERA2_EVENTS to become Era II's great events.
import type { GameState } from './types';

export type ChronMark = 'commissar' | 'vnr' | 'hidden' | 'exile' | 'profiteer' | 'loyal' | 'reds';
/** t: the choice; sub: what it means, shown before the pick; b: what came of it, shown after */
export interface ChronOption { t: string; sub: string; d: { p?: number; n?: number; s?: number; i?: number; cash?: number; clean?: number; floor?: number }; mark?: ChronMark; b: string }
export interface ChronPage { year: number; paper: 'visnyk' | 'pravda' | 'tribuna'; art: string; kicker: string; h: string; lead: string; opts: ChronOption[] }

export const CHRONICLE: ChronPage[] = [
  {
    year: 1914, paper: 'visnyk', art: 'delegates', kicker: 'ЕКСТРЕНИЙ ВИПУСК',
    h: 'Війна! Імператор оголосив війну Конкордії',
    lead: 'Ростислав II обіцяє повернути Верхній Аурум до Різдва. «Дорогий Ростику» і «любий Гарете» більше не листуються. Управа має скласти списки рекрутів Нижнього Ауруму до понеділка, і підпис під ними — ваш.',
    opts: [
      { t: 'Підписати списки як є', sub: 'Відправити на фронт усіх, хто в списку, нікого не викреслюючи. Губернатор оцінить ретельність, місто — ні.', d: { p: 8, n: -6 }, mark: 'loyal', b: 'Ешелони пішли з вокзалу з піснями. Вальдорських прізвищ у списках більшість.' },
      { t: 'Викреслити своїх і сусідів за конверт', sub: 'Заможні родини платять, щоб їхніх синів не забрали. Квоту доберуть з бідних кварталів.', d: { cash: 1200, i: 8, n: -8 }, b: 'Сини купців лишилися вдома. Квоту добрали з Подолу, і Поділ це запам’ятав.' },
      { t: 'Взяти підряд на шинелі для фронту', sub: 'Списки хай підписує хтось інший, а ваші люди шиють шинелі для армії. Великі гроші, поки ніхто не перевіряє якість.', d: { cash: 2000, i: 10, s: 4 }, mark: 'profiteer', b: 'Шинелі розлазяться під першим дощем, зате вчасно. Конкордійські листівки з неба про це вже пишуть.' }
    ]
  }
];

/** the great events of Era II (1917 abdication, 1918 ВНР, 1920 socialists at the gates): written for the chronicle,
 *  now waiting to be played inside the era as front-page events (art/LORE.md → «Перехід», docs/era2-concept.md) */
export const ERA2_EVENTS: ChronPage[] = [
  {
    year: 1917, paper: 'pravda', art: 'portrait', kicker: 'НОВА ГАЗЕТА ДЛЯ НОВОГО МІСТА',
    h: 'Імператор Ростислав II зрікся престолу',
    lead: 'Фронт тріщить, хліба нема, порт третій рік у блокаді. «Вісник» тепер виходить як «Аурумська правда». Над вашим столом досі висить портрет імператора.',
    opts: [
      { t: 'Зняти портрет і сховати в шафу', sub: 'Тихо пристосуватися: портрет зникає зі стіни, але не з дому — раптом імператор повернеться.', d: { n: 2, i: -2 }, b: 'Про всяк випадок. Рама дорога, а часи змінні.' },
      { t: 'Лишити портрет на стіні', sub: 'Показати всім, що ви вірні короні. Нова влада таке запам’ятає.', d: { n: -6, i: 6, p: -4 }, mark: 'loyal', b: 'Відвідувачі дивляться то на портрет, то на вас. Хтось записує.' },
      { t: 'Спалити полотно на подвір’ї управи, раму продати', sub: 'Публічно зректися старої влади, ще й заробити на позолоченій рамі. Натовпу сподобається.', d: { n: 7, cash: 400 }, b: 'Натовп аплодував. Раму купив Солонар.' }
    ]
  },
  {
    year: 1918, paper: 'pravda', art: 'vnr', kicker: 'ВАЛЬДОРІЯ ВІЛЬНА',
    h: 'Велика рада проголосила Вальдорську Народну Республіку',
    lead: 'Над Ратушею й на маяку вперше відкрито майорить жовто-чорно-блакитний прапор. Новому урядові бракує людей, які вміють тримати печатку. А на заводах читають листівки Союзу Ромейських Соціалістів.',
    opts: [
      { t: 'Піти служити ВНР', sub: 'Стати урядовцем молодої Вальдорської республіки. Народ вас любитиме, якщо республіка встоїть.', d: { n: 8, p: 4 }, mark: 'vnr', b: 'Ваш підпис тепер стоїть під указами вальдорською. Вперше ви пишете ними без словника.' },
      { t: 'Чекати, чия візьме', sub: 'Нікому не присягати й пересидіти вдома на лікарняному, поки влада не визначиться.', d: { i: -4 }, b: 'Ви хворієте вже третій тиждень. Лікар — ваш кум, довідки в нього хороші.' },
      { t: 'Таємно домовитися з радами СРС', sub: 'Поставити на соціалістів і сховати їхнього агітатора. Якщо переможуть — вам це зарахують.', d: { s: 6, i: 6 }, mark: 'reds', b: 'На вашому горищі ночує агітатор у шкірянці. Куховарка носить йому суп.' }
    ]
  },
  {
    year: 1920, paper: 'tribuna', art: 'docks', kicker: 'ВСЯ ВЛАДА РАДАМ',
    h: 'Загони СРС біля міста. Уряд ВНР вантажить архіви на пароплав',
    lead: 'Місту лишається день. Біржа зачинена, Солонарові склади охороняють його ж докери. Газета вже набрана під новою назвою: «Трибуна праці».',
    opts: [
      { t: 'Вийти до загонів із ключами від управи', sub: 'Першим здати місто загонам СРС і перейти на службу до нової влади.', d: { p: 14, n: -6, s: 4 }, mark: 'commissar', b: 'Комісар потиснув вам руку й призначив відповідальним за облік. Печатку перерізали того ж вечора.' },
      { t: 'Сховати золото під підлогою й перечекати', sub: 'Ні з ким не йти: гроші — під підлогу, самі — вдома, поки буря не мине.', d: { floor: 1500, i: 6, p: -4 }, mark: 'hidden', b: 'Дошки підлоги знову рипучі, як колись. Сусіди бачили світло в підвалі до ранку.' },
      { t: 'Відплисти з урядом, повернутися з амністією', sub: 'Емігрувати з урядом ВНР, втратити частину статку й повернутися за амністією вже «колишнім».', d: { clean: -2000, p: -10, n: 4 }, mark: 'exile', b: 'Рік на чужині, потім амністія й чергу на прийом до комісара. Ваше прізвище в списку «колишніх».' }
    ]
  }
];

/** a page by its year: the chronicle of 1914 or one of Era II's great events */
export const pageOf = (year: number): ChronPage | undefined => [...CHRONICLE, ...ERA2_EVENTS].find((p) => p.year === year);
/** the pages of the chronicle now on screen */
export const chronPages = (s: GameState): ChronPage[] => (s.chron?.years || CHRONICLE.map((p) => p.year)).map((y) => pageOf(y)!).filter(Boolean);

/** start the chronicle for a fresh Era II head (called by pickHeir at the end of Era I) */
export function startChronicle(n: GameState) {
  n.screen = 'chronicle';
  n.chron = { step: 0, picks: [], marks: [], years: CHRONICLE.map((p) => p.year), seen: [] };
  n.year = CHRONICLE[0].year;
}

/** Era II: is there a great event on this year's front page that the family has not lived through yet? */
export const eventFor = (n: GameState): ChronPage | undefined =>
  n.era === 2 && n.screen === 'morning' && !(n.chron?.seen || []).includes(n.year) ? ERA2_EVENTS.find((p) => p.year === n.year) : undefined;

/** open the year's great event over the morning (the decisions and marks gathered so far are kept) */
export function startEvent(n: GameState) {
  const c = n.chron || { step: 0, picks: [], marks: [] };
  n.chron = { ...c, step: 0, years: [n.year], seen: [...(c.seen || []), n.year] };
  n.screen = 'chronicle';
}

/** take one decision; after the last page the year goes on (Era II begins, or the morning of an event year) */
export function chronPick(s: GameState, i: number): GameState {
  if (s.screen !== 'chronicle' || !s.chron) throw new Error('No chronicle');
  const pages = chronPages(s), page = pages[s.chron.step], o = page?.opts[i];
  if (!o) throw new Error('No such option');
  const n: GameState = JSON.parse(JSON.stringify(s));
  const c = n.chron!;
  const d = o.d;
  if (d.p) n.patron += d.p;
  n.people += d.n || 0; n.system += d.s || 0; n.threat = Math.max(0, n.threat + (d.i || 0));
  n.cash += d.cash || 0; n.floor += d.floor || 0; n.clean = Math.max(0, n.clean + (d.clean || 0));
  (['patron', 'people', 'system'] as const).forEach((k) => { n[k] = Math.max(5, Math.min(95, n[k])); });
  c.picks.push(i); if (o.mark) c.marks.push(o.mark);
  c.step += 1;
  if (c.step < pages.length) { n.year = pages[c.step].year; return n; }
  if (pages[0].year === CHRONICLE[0].year) return beginNewOrder(n);
  // an event year: the morning paper carries the event and what the family did
  n.screen = 'morning';
  n.headline = page.h; n.body = o.b; n.art = page.art;
  n.lastDec = null; // yesterday's office decision does not belong under an event of this size
  if (o.mark === 'exile') { n.tavro = true; n.threat = Math.max(n.threat, 25); }
  return n;
}

/** the first morning of Era II: the city goes to war, and the family's choice is already in the paper */
function beginNewOrder(n: GameState): GameState {
  const m = n.chron!.marks;
  n.year = CHRONICLE[0].year;
  n.screen = 'morning';
  n.lastDec = null;
  const f = n.gender === 'f', g = (m1: string, f1: string) => (f ? f1 : m1), who = `${n.first} ${n.surname}`;
  const fate = m.includes('profiteer') ? `${who} ${g('взяв', 'взяла')} підряд на шинелі для фронту.`
    : m.includes('loyal') ? `Списки рекрутів Нижнього Ауруму ${g('підписав', 'підписала')} ${who} першим підписом.`
      : `Сини міських купців лишилися вдома: у списках їх викреслено. Підпис — ${who}.`;
  n.headline = 'Перші ешелони пішли з Порт-Аурума на фронт';
  n.body = `${fate} Порт закрито для конкордійських суден, ціни на хліб уже ростуть. Солонар скуповує вугілля, «Голос Порту» друкує вірші про «братів у Верхньому Ауруму».`;
  n.art = 'delegates';
  return n;
}
