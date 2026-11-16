// The chronicle between Era I and Era II (art/LORE.md → «Перехід»): the front page of July 1914 — war — with one
// decision for the new head of the family, who then serves through the war and the revolution inside Era II
// (1914–1941). The pages written for 1917, 1918 and 1920 wait in ERA2_EVENTS to become Era II's great events.
import type { GameState } from './types';

export type ChronMark = 'commissar' | 'vnr' | 'hidden' | 'exile' | 'profiteer' | 'loyal' | 'reds';
export interface ChronOption { t: string; d: { p?: number; n?: number; s?: number; i?: number; cash?: number; clean?: number; floor?: number }; mark?: ChronMark; b: string }
export interface ChronPage { year: number; paper: 'visnyk' | 'pravda' | 'tribuna'; art: string; kicker: string; h: string; lead: string; opts: ChronOption[] }

export const CHRONICLE: ChronPage[] = [
  {
    year: 1914, paper: 'visnyk', art: 'delegates', kicker: 'ЕКСТРЕНИЙ ВИПУСК',
    h: 'Війна! Імператор оголосив війну Конкордії',
    lead: 'Ростислав II обіцяє повернути Верхній Аурум до Різдва. «Дорогий Ростику» і «любий Гарете» більше не листуються. Управа має скласти списки рекрутів Нижнього Ауруму до понеділка.',
    opts: [
      { t: 'Підписати списки як є', d: { p: 8, n: -6 }, mark: 'loyal', b: 'Ешелони пішли з вокзалу з піснями. Вальдорських прізвищ у списках більшість.' },
      { t: 'Викреслити своїх і сусідів за конверт', d: { cash: 1200, i: 8, n: -8 }, b: 'Сини купців лишилися вдома. Квоту добрали з Подолу, і Поділ це запам’ятав.' },
      { t: 'Взяти підряд на шинелі для фронту', d: { cash: 2000, i: 10, s: 4 }, mark: 'profiteer', b: 'Шинелі розлазяться під першим дощем, зате вчасно. Конкордійські листівки з неба про це вже пишуть.' }
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
      { t: 'Зняти портрет і сховати в шафу', d: { n: 2, i: -2 }, b: 'Про всяк випадок. Рама дорога, а часи змінні.' },
      { t: 'Лишити портрет на стіні', d: { n: -6, i: 6, p: -4 }, mark: 'loyal', b: 'Відвідувачі дивляться то на портрет, то на вас. Хтось записує.' },
      { t: 'Спалити полотно на подвір’ї управи, раму продати', d: { n: 7, cash: 400 }, b: 'Натовп аплодував. Раму купив Солонар.' }
    ]
  },
  {
    year: 1918, paper: 'pravda', art: 'council', kicker: 'ВАЛЬДОРІЯ ВІЛЬНА',
    h: 'Велика рада проголосила Вальдорську Народну Республіку',
    lead: 'Над Ратушею й на маяку вперше відкрито майорить блакитно-чорно-жовтий прапор. Новому урядові бракує людей, які вміють тримати печатку. А на заводах читають листівки Союзу Ромейських Соціалістів.',
    opts: [
      { t: 'Піти служити ВНР', d: { n: 8, p: 4 }, mark: 'vnr', b: 'Ваш підпис тепер стоїть під указами вальдорською. Вперше ви пишете ними без словника.' },
      { t: 'Чекати, чия візьме', d: { i: -4 }, b: 'Ви хворієте вже третій тиждень. Лікар — ваш кум, довідки в нього хороші.' },
      { t: 'Таємно домовитися з радами СРС', d: { s: 6, i: 6 }, mark: 'reds', b: 'На вашому горищі ночує агітатор у шкірянці. Куховарка носить йому суп.' }
    ]
  },
  {
    year: 1920, paper: 'tribuna', art: 'docks', kicker: 'ВСЯ ВЛАДА РАДАМ',
    h: 'Загони СРС біля міста. Уряд ВНР вантажить архіви на пароплав',
    lead: 'Місту лишається день. Біржа зачинена, Солонарові склади охороняють його ж докери. Газета вже набрана під новою назвою: «Трибуна праці».',
    opts: [
      { t: 'Вийти до загонів із ключами від управи', d: { p: 14, n: -6, s: 4 }, mark: 'commissar', b: 'Комісар потиснув вам руку й призначив відповідальним за облік. Печатку перерізали того ж вечора.' },
      { t: 'Сховати золото під підлогою й перечекати', d: { floor: 1500, i: 6, p: -4 }, mark: 'hidden', b: 'Дошки підлоги знову рипучі, як колись. Сусіди бачили світло в підвалі до ранку.' },
      { t: 'Відплисти з урядом, повернутися з амністією', d: { clean: -2000, p: -10, n: 4 }, mark: 'exile', b: 'Рік на чужині, потім амністія й чергу на прийом до комісара. Ваше прізвище в списку «колишніх».' }
    ]
  }
];

/** start the chronicle for a fresh Era II head (called by pickHeir at the end of Era I) */
export function startChronicle(n: GameState) {
  n.screen = 'chronicle';
  n.chron = { step: 0, picks: [], marks: [] };
  n.year = CHRONICLE[0].year;
}

/** take one decision; after the last page Era II begins (in 1914, the year of the war) */
export function chronPick(s: GameState, i: number): GameState {
  if (s.screen !== 'chronicle' || !s.chron) throw new Error('No chronicle');
  const page = CHRONICLE[s.chron.step], o = page?.opts[i];
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
  if (c.step < CHRONICLE.length) { n.year = CHRONICLE[c.step].year; return n; }
  return beginNewOrder(n);
}

/** the first morning of Era II: the city goes to war, and the family's choice is already in the paper */
function beginNewOrder(n: GameState): GameState {
  const m = n.chron!.marks;
  n.year = CHRONICLE[0].year;
  n.screen = 'morning';
  const f = n.gender === 'f', g = (m1: string, f1: string) => (f ? f1 : m1), who = `${n.first} ${n.surname}`;
  const fate = m.includes('profiteer') ? `${who} ${g('взяв', 'взяла')} підряд на шинелі для фронту.`
    : m.includes('loyal') ? `Списки рекрутів Нижнього Ауруму ${g('підписав', 'підписала')} ${who} першим підписом.`
      : `Сини міських купців лишилися вдома: у списках їх викреслено. Підпис — ${who}.`;
  n.headline = 'Перші ешелони пішли з Порт-Аурума на фронт';
  n.body = `${fate} Порт закрито для конкордійських суден, ціни на хліб уже ростуть. Солонар скуповує вугілля, «Голос Порту» друкує вірші про «братів у Верхньому Ауруму».`;
  n.art = 'delegates';
  return n;
}
