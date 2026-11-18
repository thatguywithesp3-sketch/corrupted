// Between the parts of the day the camera leaves the office and takes a short tour of Port-Aurum: the Old Town, the
// market square with the opera, the harbour. The time of day changes while we look (night thins into dawn; dusk sinks
// into night and the lamplighter goes round), small ink figures go about their business, and at each stop one thing the
// city is saying today appears on a scrap of paper — including what it says because of us.
// Morning comes before the paper; evening comes before the dark ledger. Tap to go on; it also leaves by itself.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { RomeiFlag } from './Heraldry';
import { Crowd, type Pools } from './Crowd';
import { CROWD } from './crowdMap';
import type { GameState } from '../../engine';
import * as G from '../../engine';

export type PanoKind = 'morning' | 'evening';

/** the whole tour, seconds. Stops: Old Town 0–2.8, move, Market square 4.2–6.3, move, Harbour 7.7–end */
const T = 10.5;
const STOP = { a: [0, 2.8], b: [4.2, 6.3], c: [7.7, T] } as const;
/** when the camera is over a point of the picture (x in % of its width): used to time lamps, windows, figures */
const seenAt = (x: number) => (x < 33 ? 0.4 + (x / 33) * 2.2 : x < 62 ? STOP.b[0] - 0.3 + ((x - 33) / 29) * 2 : STOP.c[0] - 0.4 + ((x - 62) / 38) * 2.2);

const SOFT = 'blur(0.5px) saturate(0.9) contrast(1.06)';
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.1 -0.2"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;
const INKC = '#251B12';

type Voice = { t: string; tone: 'good' | 'bad' | 'neu' };
/** what the city is saying: built from the state, so our deeds come back as the city's talk */
function voices(s: GameState, kind: PanoKind): Voice[] {
  const c = s.city, out: Voice[] = [];
  const stage = s.threat < 35 ? 1 : s.threat < 70 ? 2 : 3;
  if (kind === 'morning') {
    if (c) {
      c.news.filter((n) => n.kind === 'attack' || n.kind === 'complaint').slice(0, 1).forEach((n) => out.push({ t: n.head, tone: 'bad' }));
      c.news.filter((n) => n.kind === 'open' || n.kind === 'rival').slice(0, 2 - out.length).forEach((n) => out.push({ t: n.head, tone: n.kind === 'rival' ? 'bad' : 'neu' }));
    }
    if (stage === 3) out.push({ t: 'Місто читає про вас за ранковою кавою', tone: 'bad' });
    else if (stage === 2) out.push({ t: 'У кав’ярнях дедалі частіше згадують вашу управу', tone: 'bad' });
  } else {
    if (c?.tribute) out.push({ t: `«Дахи» принесли до шухляди ${G.fmt(c.tribute)} крон`, tone: 'good' });
    if (c?.last) out.push({ t: `${c.last.ok ? 'Вдалося' : 'Не вдалося'}: ${c.last.title}`, tone: c.last.ok ? 'good' : 'bad' });
    const hunter = c?.rivals.filter((r) => !r.ally && r.heat >= 5).sort((a, z) => z.heat - a.heat)[0];
    if (hunter) out.push({ t: `У вікнах ${hunter.name.replace('Пан ', 'пана ').replace('Пані ', 'пані ').replace('Граф ', 'графа ')} ще горить світло`, tone: 'bad' });
    if (stage >= 2) out.push({ t: stage === 3 ? 'Біля управи до ночі чергує репортер' : 'У шинках шепочуться про ваші статки', tone: 'bad' });
  }
  // the quiet background of the era: one observed fact, never a judgement
  if (s.era === 1 && out.length < 2) {
    const BG = kind === 'morning'
      ? ['На Ринковій торгують чотирма мовами, а сваряться однією', 'На стіні пакгаузу хтось намалював три смуги: блакитну, чорну й жовту. Двірник замазав їх до обіду', 'Біля гімназії продають вальдорський буквар — з-під поли, але відкрито', 'Пошта зі столиці знову запізнилася на тиждень']
      : ['У шинку на Подолі співають пісню, якої немає в імперському співанику', 'Імперський патруль сьогодні не вийшов: нема чим платити', 'У вікнах Старого міста світло до півночі — сперечаються про мову', 'На вокзалі проводжають делегатів до столиці. Мало хто вірить, що їх почують'];
    out.push({ t: BG[(s.year + (kind === 'morning' ? 0 : 1)) % BG.length], tone: 'neu' });
  }
  if (s.era === 2 && out.length < 2) {
    const BG2: Record<G.Regime, [string[], string[]]> = {
      empire: [['На вокзалі знову проводжають ешелон: оркестр, хустки, мовчання', 'Цукор зник із прилавків, а з ним і продавці цукру', 'Біля шпиталю в маєтку черга з листами до поранених'],
        ['Вікна заклеєно навхрест: кажуть, з моря видно місто', 'У порту розвантажують снаряди до ночі', 'У кав’ярні сперечаються, коли скінчиться війна. Ставки ростуть']],
      provisional: [['Хтось уночі збив кречета з воріт управи. Двірник підмів і пішов', 'На площі мітинг: говорять усі, слухає ніхто', 'Жандармів більше нема. Міліції ще нема'],
        ['Солдати з фронту продають шинелі на Ринковій', 'У трамваї курять. Кондуктор каже: тепер свобода', 'Ціни на хліб змінюються двічі на день']],
      civil: [['Уночі стріляли біля вокзалу. Зранку ніхто нічого не чув', 'На стіні три шари листівок: ради, республіка, знову ради', 'Черга по хліб починається до світанку'],
        ['Комендантська година. Вулиці порожні, крім патрулів', 'У гавані ще горить склад, підпалений позавчора', 'Хто має срібло, міняє на борошно. Хто має борошно, мовчить']],
      soviet: [['Непман на Ринковій відкрив другу крамницю й найняв прикажчика', 'Над Ратушею — новий прапор, під Ратушею — старі ями', 'Біля «Трибуни праці» читають стінну газету'],
        ['На заводі нічна зміна: місто знову димить', 'У клубі колишнього собору показують кіно', 'Двірник знає про будинок більше, ніж усі мешканці разом']]
    };
    const reg = G.regimeOf(s) || 'empire', bg = BG2[reg][kind === 'morning' ? 0 : 1];
    out.push({ t: bg[(s.year + s.served) % bg.length], tone: 'neu' });
  }
  // the harbour stop always gets the port: trade in the morning, the sleeping harbour at night
  const up = c ? c.econ.trade >= c.prev.trade : true;
  const port: Voice = kind === 'morning'
    ? { t: c ? `Торгівля в порту ${up ? 'пожвавилася' : 'просіла'}: ${c.econ.trade} пунктів` : 'Пароплави розводять пари, докери вже на причалі', tone: c ? (up ? 'good' : 'bad') : 'neu' }
    : { t: 'Ліхтарники обходять набережну. Гавань засинає.', tone: 'neu' };
  return [...out.slice(0, 2), port];
}

// ---------------------------------------------------------------- the city's life: townsfolk from the same engraving
// Sprites (public/art/life/*.webp) are drawn in the panorama's own technique; where they walk and how they move and
// take the light lives in Crowd.tsx and crowdMap.ts. Here: who is out, by era and by power.

const TOWNSFOLK = ['w-clerk', 'w-merchant', 'w-lady', 'w-worker', 'w-washer', 'w-paperboy', 'w-priest', 'w-student', 'w-fishwife', 'w-oldman', 'w-nanny', 'w-flowergirl', 'w-reader', 'w-yoke', 'w-porter'];
const PORTFOLK = ['w-docker', 'w-porter', 'w-sailor', 'w-worker', 'w-fishwife', 'w-barrow'];
const NIGHTFOLK = ['w-merchant', 'w-lady', 'w-worker', 'w-sailor', 'w-reader', 'w-oldman', 'w-student'];

/** Era II (art/life/w2-*, v2-*, i2-*): who is out depends on the power. The war years: soldiers, sailors, soldiers'
 *  wives, the wounded, a field kitchen, army carts and lorries. 1917: the same, plus the militia and the meetings.
 *  The civil war: patrols, commissars, queues, no cabs. Under the councils: workers, nepmen, a tram and a motor car. */
const ERA2_FOLK: Record<G.Regime, { walk: string[]; port: string[]; night: string[]; v: string[]; idle: string[] }> = {
  empire: { walk: ['w2-soldier', 'w2-woman', 'w2-invalid', 'w2-newsboy', 'w2-trader', 'w2-student', 'w2-granny', 'w-lady', 'w-worker', 'w-merchant'], port: ['w2-soldier', 'w2-sailor', 'w-docker', 'w-porter', 'w2-worker'], night: ['w2-soldier', 'w2-sailor', 'w-merchant', 'w2-woman'], v: ['v-tram', 'v2-cart', 'v2-lorry', 'v-fiacre'], idle: ['i2-kitchen', 'i2-queue', 'i-gossip'] },
  provisional: { walk: ['w2-soldier', 'w2-militia', 'w2-woman', 'w2-student', 'w2-newsboy', 'w2-invalid', 'w2-girl', 'w2-trader', 'w-worker'], port: ['w2-sailor', 'w2-soldier', 'w-docker', 'w2-worker'], night: ['w2-militia', 'w2-sailor', 'w2-soldier', 'w2-student'], v: ['v-tram', 'v2-lorry', 'v2-cart', 'v-fiacre'], idle: ['i2-agitator', 'i2-queue', 'i-talk'] },
  civil: { walk: ['w2-soldier', 'w2-commissar', 'w2-militia', 'w2-woman', 'w2-granny', 'w2-invalid', 'w2-worker', 'w2-sailor'], port: ['w2-sailor', 'w2-soldier', 'w-docker', 'w2-worker'], night: ['w2-militia', 'w2-soldier', 'w2-commissar', 'w2-sailor'], v: ['v2-lorry', 'v2-cart', 'v2-lorry', 'v2-cart'], idle: ['i2-queue', 'i2-agitator', 'i2-kitchen'] },
  soviet: { walk: ['w2-worker', 'w2-girl', 'w2-trader', 'w2-commissar', 'w2-newsboy', 'w2-student', 'w2-woman', 'w2-granny', 'w2-sailor'], port: ['w-docker', 'w-porter', 'w2-worker', 'w2-sailor'], night: ['w2-worker', 'w2-girl', 'w2-militia', 'w2-trader'], v: ['v-tram', 'v2-car', 'v2-cart', 'v2-lorry'], idle: ['i2-agitator', 'i-kiosk', 'i-talk'] }
};
/** who walks where: the street and the square get townsfolk, the quay dockers and sailors, the road vehicles */
function poolsFor(era: number, reg: G.Regime | 'empire', night: boolean): Pools {
  if (era === 2) {
    const f = ERA2_FOLK[reg];
    return { street: night ? f.night : f.walk, square: night ? f.night : f.walk, quay: night ? [...f.port.slice(0, 2), f.night[0]] : f.port, road: f.v, water: ['b-row', 'b-launch', 'b-barge'],
      idle: { square: night ? ['i-couple', 'i-beggar'] : f.idle, quay: ['i-rest'], street: night ? [] : ['i-talk'] } };
  }
  return { street: night ? NIGHTFOLK : TOWNSFOLK, square: night ? NIGHTFOLK : TOWNSFOLK, quay: night ? ['w-gendarme', 'w-sailor', 'w-worker', 'w-docker'] : PORTFOLK,
    road: night ? ['v-fiacre', 'v-landau'] : ['v-tram', 'v-fiacre', 'v-milk', 'v-barrels', 'v-landau'], water: ['b-row', 'b-sail', 'b-launch', 'b-barge'],
    idle: { square: night ? ['i-beggar', 'i-couple'] : ['i-chestnut', 'i-gossip', 'i-talk', 'i-kiosk', 'i-guard'], quay: ['i-rest', 'i-couple'], street: night ? [] : ['i-talk'] } };
}

/** the flag over the town hall tower, by power: the empire's stripes, the red flag of 1917, the red flag with the
 *  СРС anchor and hammer from 1918 */
function TowerFlag({ reg }: { reg: G.Regime | 'empire' }) {
  const red = reg !== 'empire';
  return (
    <span aria-hidden="true" style={{ position: 'absolute', left: '29.15%', top: '2%', width: 0, height: 0, zIndex: 3 }}>
      <span style={{ position: 'absolute', left: 0, top: 0, width: 1.5, height: 26, background: '#2A2018' }} />
      <svg width="26" height="17" viewBox="0 0 26 17" style={{ position: 'absolute', left: 1.5, top: 1, transformOrigin: '0 50%', animation: 'pano-flag 1.6s ease-in-out infinite alternate', filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,.4)) saturate(.85)' }}>
        {red ? <path d="M0 0 Q7 -1.5 13 1 T26 1 V16 Q19 14 13 16.5 T0 16 Z" fill="#B3261E" />
          : <><path d="M0 0 Q7 -1.5 13 1 T26 1 V6 Q19 4.5 13 6.3 T0 6 Z" fill="#B3261E" /><path d="M0 6 Q7 4.5 13 6.3 T26 6 V11 Q19 9.5 13 11.3 T0 11 Z" fill="#F2EBDD" /><path d="M0 11 Q7 9.5 13 11.3 T26 11 V16 Q19 14 13 16.5 T0 16 Z" fill="#E0B23A" /></>}
        {(reg === 'civil' || reg === 'soviet') && <image href="art/brand/srs-emblem.png" x="8" y="2.5" width="8.5" height="11" />}
      </svg>
    </span>
  );
}

const Smoke = ({ x, y, d = 0, s = 1 }: { x: number; y: number; d?: number; s?: number }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
    {[0, 1, 2].map((i) => <span key={i} className="pano-smoke" style={{ animationDelay: `${d + i * 1.3}s`, width: 26 * s, height: 26 * s, marginLeft: -13 * s, marginTop: -13 * s }} />)}
  </span>
);
/** a street lamp: lit glow that goes out (morning) or comes on (evening) when its time comes */
const Lamp = ({ x, y, r = 10, on, at }: { x: number; y: number; r?: number; on: boolean; at: number }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, borderRadius: '50%', background: 'radial-gradient(circle, #FFD27A 0%, #FFC66A88 26%, transparent 70%)', mixBlendMode: 'screen', animation: `${on ? 'pano-lampon' : 'pano-lampoff'} 1.1s ease-out ${at}s both${on ? `, pano-flick 2.6s ease-in-out ${at + 1.1}s infinite` : ''}` }} />
);

const scatter = (n: number, seed: number, x0: number, x1: number, y0: number, y1: number) => {
  let a = seed; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r() * 6, 0.6 + r() * 0.9] as const);
};
const MOTES = scatter(20, 31, 0, 100, 10, 95), FLOCK = scatter(11, 41, 0, 90, 0, 40).map(([x, y, d, k]) => [x, y, d / 10, k * 1.3] as const);
const GLINTS = scatter(40, 7, 57, 99, 30, 64), STARS = scatter(36, 11, 0, 100, 1, 17);
/** windows of the painted town, lit in a wave as the camera passes: the Old Town houses, the facades above the square, the roofs in front of the harbour (never on the cobbles or the water) */
const WINDOWS = [...scatter(14, 23, 3, 30, 52, 92), ...scatter(14, 29, 36, 58, 38, 48), ...scatter(10, 37, 62, 82, 58, 70)];
const Glint = ({ x, y, d, k }: { x: number; y: number; d: number; k: number }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 10 * k, height: 2.2 * k, marginLeft: -5 * k, borderRadius: 2, background: 'rgba(255,240,200,.95)', boxShadow: '0 0 6px rgba(255,230,170,.9)', mixBlendMode: 'screen', opacity: 0, animation: `pano-glint ${2.4 + k * 1.6}s ease-in-out ${d}s infinite` }} />
);
const Cloud = ({ y, w, d, dur, o, dark }: { y: number; w: number; d: number; dur: number; o: number; dark?: boolean }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: '-20%', top: `${y}%`, width: w, height: w * 0.32, borderRadius: '50%', background: dark ? 'radial-gradient(ellipse, rgba(20,24,40,.9), transparent 70%)' : 'radial-gradient(ellipse, rgba(255,236,210,.9), transparent 70%)', filter: 'blur(14px)', opacity: o, animation: `pano-cloud ${dur}s linear ${d}s infinite` }} />
);
const Gull = ({ x, y, d, dur, k }: { x: number; y: number; d: number; dur: number; k: number }) => (
  <svg aria-hidden="true" width={22 * k} height={10 * k} viewBox="0 0 22 10" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, overflow: 'visible', animation: `pano-gull ${dur}s linear ${d}s infinite` }}>
    <path d="M0 5 Q5 0 11 5 Q17 0 22 5" fill="none" stroke="#2A2420" strokeWidth={1.6 / Math.max(k, 0.7)} style={{ transformOrigin: '11px 5px', animation: `pano-wing ${0.5 + k * 0.3}s ease-in-out ${d}s infinite` }} />
  </svg>
);

/** where the scraps of paper point: the three stops */
const PLACES = ['Старе місто', 'Ринкова площа', 'Гавань'];


const CSS = `
@keyframes pano-cam {
  0% { transform: translateX(calc(-13% + 195px)); animation-timing-function: linear; }
  ${(STOP.a[1] / T) * 100}% { transform: translateX(calc(-19% + 195px)); animation-timing-function: cubic-bezier(.5,0,.3,1); }
  ${(STOP.b[0] / T) * 100}% { transform: translateX(calc(-46% + 195px)); animation-timing-function: linear; }
  ${(STOP.b[1] / T) * 100}% { transform: translateX(calc(-50% + 195px)); animation-timing-function: cubic-bezier(.5,0,.3,1); }
  ${(STOP.c[0] / T) * 100}% { transform: translateX(calc(-100% + 410px)); animation-timing-function: linear; }
  100% { transform: translateX(calc(-100% + 390px)); }
}
@keyframes pano-breath { from { transform: scale(1.04); } to { transform: scale(1.0); } }
@keyframes pano-fadeout { from { opacity: 1; } to { opacity: 0; } }
@keyframes pano-fadein { from { opacity: 0; } to { opacity: 1; } }
@keyframes pano-lane { 0% { left: var(--x0); opacity: 0; } 6% { opacity: 1; } 94% { opacity: 1; } 100% { left: var(--x1); opacity: 0; } }
@keyframes pano-gait { 0%, 100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-.9px) rotate(.8deg); } 50% { transform: translateY(0) rotate(0deg); } 75% { transform: translateY(-.9px) rotate(-.5deg); } }
@keyframes pano-sway { from { transform: rotate(-.7deg) translateY(0); } to { transform: rotate(.7deg) translateY(-.4px); } }
@keyframes pano-lampoff { from { opacity: .95; } to { opacity: 0; } }
@keyframes pano-lampon { 0% { opacity: 0; transform: scale(.4); } 40% { opacity: 1; transform: scale(1.15); } 100% { opacity: .9; transform: scale(1); } }
@keyframes pano-flick { 0%,100% { opacity: .9; } 40% { opacity: .6; } 55% { opacity: 1; } 70% { opacity: .75; } }
@keyframes pano-win { from { opacity: 0; } to { opacity: .85; } }
@keyframes pano-sunrise { from { opacity: 0; transform: translateY(70px) scale(.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes pano-smoke { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 20% { opacity: .55; } 100% { opacity: 0; transform: translate(18px,-70px) scale(1.9); } }
@keyframes pano-beam { from { transform: rotate(-40deg); } to { transform: rotate(320deg); } }
@keyframes pano-gull { from { transform: translate(0,0); } to { transform: translate(900px,-60px); } }
@keyframes pano-flag { from { transform: skewY(-3deg) scaleX(.96); } to { transform: skewY(3deg) scaleX(1); } }
@keyframes pano-wing { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.35); } }
@keyframes pano-grain { 0% { transform: translate(0,0); } 20% { transform: translate(-40px,22px); } 40% { transform: translate(28px,-36px); } 60% { transform: translate(-18px,-12px); } 80% { transform: translate(36px,30px); } 100% { transform: translate(0,0); } }
@keyframes pano-glint { 0%,100% { opacity: 0; transform: scaleX(.4); } 45% { opacity: .9; transform: scaleX(1); } 60% { opacity: 0; } }
@keyframes pano-cloud { from { transform: translateX(0); } to { transform: translateX(1900px); } }
@keyframes pano-star { 0%,100% { opacity: .2; } 50% { opacity: 1; } }
@keyframes pano-blink { 0%, 46%, 100% { opacity: .15; } 50%, 58% { opacity: 1; } }
@keyframes pano-mist { 0%,100% { transform: translateX(0); opacity: .35; } 50% { transform: translateX(-120px); opacity: .55; } }
@keyframes pano-mote { 0% { opacity: 0; transform: translate(0,0); } 25% { opacity: .8; } 75% { opacity: .6; } 100% { opacity: 0; transform: translate(40px,-90px); } }
@keyframes pano-flock { 0% { transform: translate(0, 0) scale(.6); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate(420px, -150px) scale(1.2); opacity: 1; } }
@keyframes pano-boat { from { transform: translateX(0); } to { transform: translateX(-120px); } }
@keyframes pano-title { 0% { opacity: 0; transform: translateY(16px); filter: blur(6px); } 14% { opacity: 1; transform: none; filter: blur(0); } 78% { opacity: 1; transform: none; filter: blur(0); } 100% { opacity: 0; transform: translateY(-26px) scale(.9); filter: blur(3px); } }
@keyframes pano-plaque { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes pano-note { 0% { opacity: 0; transform: translateY(14px) rotate(var(--r)); } 12% { opacity: 1; transform: translateY(0) rotate(var(--r)); } 88% { opacity: 1; transform: translateY(0) rotate(var(--r)); } 100% { opacity: 0; transform: translateY(-8px) rotate(var(--r)); } }
@keyframes pano-notelast { 0% { opacity: 0; transform: translateY(14px) rotate(var(--r)); } 100% { opacity: 1; transform: translateY(0) rotate(var(--r)); } }
@keyframes pano-hint { 0%,100% { opacity: .3; } 50% { opacity: .85; } }
@keyframes pano-timer { from { width: 100%; } to { width: 0%; } }
.pano-smoke { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(235,230,220,.75), rgba(235,230,220,0) 70%); filter: blur(3px); opacity: 0; animation: pano-smoke 4s ease-out infinite; }
`;

export function Panorama({ s, kind, onDone }: { s: GameState; kind: PanoKind; onDone: () => void }) {
  const [out, setOut] = useState(false);
  const lines = useMemo(() => voices(s, kind), [s, kind]);
  const leave = () => { if (out) return; setOut(true); setTimeout(onDone, 550); };
  useEffect(() => { const t = setTimeout(leave, (T + 0.6) * 1000); return () => clearTimeout(t); }); // eslint-disable-line react-hooks/exhaustive-deps
  const era = s.era, img = (n: string) => `art/city/e${era}-${n}.jpg`;
  const night = kind === 'evening', morning = !night;
  // Era II is painted from the same viewpoint, so lamps, windows, lanes and the tower line up with Era I's
  const reg: G.Regime | 'empire' = era === 2 ? G.regimeOf(s) || 'empire' : 'empire', lit = era <= 2;
  const pools = useMemo(() => poolsFor(era, reg, night), [era, reg, night]);
  // the lamps of this painting; the lamplighter lights the ones along his walk as he reaches them
  const cmap = CROWD[(era === 2 ? 2 : 1) as 1 | 2], LLD = 2.6, LLT = 7;
  const ll = cmap.lamplighter;
  const lampOnAt = (x: number, y: number) => (x >= ll.from[0] && x <= ll.to[0] && Math.abs(y - ll.from[1]) < 80 ? LLD + ((x - ll.from[0]) / (ll.to[0] - ll.from[0])) * LLT + 0.1 : seenAt(x / 16) + 0.3);
  const overAnim = night ? `pano-fadein 5.5s ease-in-out 2.2s forwards` : 'pano-fadeout 4.2s ease-in-out .3s both';
  const ink = night ? '#E8DDC2' : '#FFF3DA';
  // the notes: one per stop; the last one stays until the end
  const port = lines[lines.length - 1];
  const notes = [...lines.slice(0, -1).map((l, i) => ({ ...l, place: PLACES[i], at: [0.8, 4.0][i], dur: 3.0, last: false })), { ...port, place: PLACES[2], at: 7.4, dur: 0.7, last: true }];

  return (
    <div onClick={leave} role="button" aria-label="Продовжити" style={{ position: 'absolute', inset: 0, zIndex: 95, overflow: 'hidden', background: '#000', cursor: 'pointer', opacity: out ? 0 : 1, transition: 'opacity .5s ease', pointerEvents: 'auto' }}>
      <style>{CSS}</style>
      {/* the picture, wider than the phone: the camera tours the city in three stops */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, aspectRatio: '16 / 9', height: '100%', animation: `pano-cam ${T}s linear forwards` }}>
        <div style={{ position: 'absolute', inset: 0, animation: `pano-breath ${T}s ease-out forwards`, transformOrigin: '50% 70%' }}>
          {/* the time of day changes under our eyes: night thins into dawn, or dusk sinks into night */}
          <img src={img(night ? 'evening' : 'morning')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT }} />
          {morning && <img src={img('night')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT, animation: 'pano-fadeout 4.2s ease-in-out .3s both' }} />}
          {night && <img src={img('night')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT, opacity: 0, animation: `pano-fadein 5.5s ease-in-out 2.2s forwards` }} />}
          {/* the townsfolk walk the painted ground; lamps and windows light them from above */}
          {lit && <Crowd era={era as 1 | 2} evening={night} pools={pools} under={img(night ? 'evening' : 'morning')} over={img('night')} overAnim={overAnim} soft={SOFT} lamplighterAt={night ? [LLD, LLT] : undefined} reduced={typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches} />}
          {morning && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, rgba(255,214,150,.34), rgba(255,200,130,.08) 50%, transparent 70%)', mixBlendMode: 'screen', opacity: 0, animation: 'pano-fadein 4s ease-in 3.2s forwards' }} />}
          {night && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,16,44,.45), rgba(10,16,44,.15) 60%, rgba(10,16,44,.35))', mixBlendMode: 'multiply', opacity: 0, animation: 'pano-fadein 6s ease-in 2s forwards' }} />}

          {/* street lamps go out (morning) or come on (evening) as the camera reaches them */}
          {lit && cmap.lamps.map(([x, y, r], i) => <Lamp key={i} x={x / 16} y={y / 9} r={r} on={night} at={night ? lampOnAt(x, y) : seenAt(x / 16) + 0.4} />)}
          {/* windows light up in a wave in the evening */}
          {night && lit && WINDOWS.map(([x, y, , k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 4 * k, height: 6 * k, background: '#FFCB6B', boxShadow: '0 0 8px 2px rgba(255,190,90,.7)', mixBlendMode: 'screen', opacity: 0, animation: `pano-win .6s ease-out ${seenAt(x) + (i % 4) * 0.25}s forwards` }} />)}

          {/* the sky */}
          {morning && <>
            <span aria-hidden="true" style={{ position: 'absolute', left: '91.5%', top: '17%', width: 240, height: 240, marginLeft: -120, marginTop: -120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,200,.95), rgba(255,200,120,.4) 30%, transparent 68%)', mixBlendMode: 'screen', animation: `pano-sunrise 3.6s ease-out ${STOP.c[0] - 1.6}s both` }} />
            <Cloud y={3} w={420} d={-6} dur={70} o={0.32} /><Cloud y={9} w={300} d={-30} dur={55} o={0.26} />
            {[[30, 12, 0, 16, 0.8], [44, 10, 2.1, 15, 0.9], [56, 14, 0.6, 20, 0.6], [20, 22, 1, 11, 1.3], [62, 28, 3, 12, 1.1], [70, 20, 5, 22, 0.5], [78, 24, 6.5, 16, 0.7]].map(([x, y, d, dur, k], i) => <Gull key={i} x={x} y={y} d={d} dur={dur} k={k} />)}
            {GLINTS.map(([x, y, d, k], i) => <Glint key={i} x={x} y={y} d={d} k={k} />)}
          </>}
          {night && <>
            <span aria-hidden="true" style={{ position: 'absolute', left: '82%', top: '9%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,230,255,.6), transparent 65%)', mixBlendMode: 'screen', opacity: 0, animation: 'pano-fadein 3s ease-in 4s forwards' }} />
            {STARS.map(([x, y, d, k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 2 * k, height: 2 * k, borderRadius: '50%', background: '#F4F0FF', boxShadow: '0 0 4px #DDE4FF', opacity: 0, animation: `pano-star ${2 + k * 2}s ease-in-out ${3 + d}s infinite` }} />)}
            <Cloud y={4} w={460} d={-10} dur={80} o={0.5} dark />
            {/* the lighthouse sweeping the harbour */}
            <span aria-hidden="true" style={{ position: 'absolute', left: '96.4%', top: '20.5%', width: 0, height: 0, opacity: 0, animation: `pano-fadein 1s ease-out ${STOP.c[0] - 1}s forwards` }}>
              <span style={{ position: 'absolute', left: 0, top: -14, width: 420, height: 28, transformOrigin: '0 50%', background: 'linear-gradient(90deg, rgba(255,230,160,.75), rgba(255,230,160,0))', clipPath: 'polygon(0 45%, 100% 0, 100% 100%, 0 55%)', mixBlendMode: 'screen', animation: 'pano-beam 5s linear infinite' }} />
            </span>
            {/* ships' riding lights: red, green and the masthead white */}
            {[[87.5, 47, '#FF5A4A'], [90.5, 48, '#5AF08A'], [89, 32, '#FFF4D8'], [97, 36, '#FFF4D8'], [80, 30, '#FF5A4A']].map(([x, y, c], i) => (
              <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 7, height: 7, marginLeft: -4, borderRadius: '50%', background: c as string, boxShadow: `0 0 10px 3px ${c}`, opacity: 0, animation: `pano-fadein .6s ease-out ${STOP.c[0] - 0.8 + i * 0.3}s forwards, pano-blink ${3 + i * 0.6}s ease-in-out ${STOP.c[0] + i * 0.3}s infinite` }} />
            ))}
            {GLINTS.slice(0, 22).map(([x, y, d, k], i) => <Glint key={i} x={x} y={y + 2} d={d + 2} k={k * 0.8} />)}
            <span aria-hidden="true" style={{ position: 'absolute', left: '50%', right: 0, top: '52%', height: 90, background: 'linear-gradient(180deg, transparent, rgba(170,180,210,.35), transparent)', filter: 'blur(10px)', animation: 'pano-mist 16s ease-in-out infinite' }} />
          </>}

          {era === 2 && <TowerFlag reg={reg} />}
          {morning && lit && <>
            <span aria-hidden="true" style={{ position: 'absolute', left: '84%', top: '60%', animation: `pano-boat ${T}s linear both` }}><svg width="26" height="8" viewBox="0 0 26 8"><path d="M0 3 H26 L22 7 H4 Z" fill={INKC} /><path d="M10 3 L6 -2 M16 3 L20 -2" stroke={INKC} strokeWidth=".8" /></svg></span>
            {/* pigeons burst off the town hall tower */}
            <span aria-hidden="true" style={{ position: 'absolute', left: '29%', top: '14%', width: 0, height: 0, animation: 'pano-flock 5s cubic-bezier(.3,.1,.6,1) 1.2s both' }}>
              {FLOCK.map(([dx, dy, d, k], i) => <svg key={i} width={20 * k} height={9 * k} viewBox="0 0 22 10" style={{ position: 'absolute', left: dx * 1.4, top: dy * 1.2, overflow: 'visible' }}><path d="M0 5 Q5 0 11 5 Q17 0 22 5" fill="none" stroke="#231C16" strokeWidth="1.4" style={{ transformOrigin: '11px 5px', animation: `pano-wing .3s ease-in-out ${d}s infinite` }} /></svg>)}
            </span>
          </>}
          <Smoke x={14} y={44} d={0} /><Smoke x={54} y={73} d={0.8} s={1.2} /><Smoke x={88} y={42} d={0.4} s={1.5} /><Smoke x={86.5} y={43} d={1.1} s={1.8} /><Smoke x={30} y={60} d={2.2} s={0.8} /><Smoke x={8} y={46} d={3} s={0.9} /><Smoke x={22} y={52} d={1.4} s={0.7} /><Smoke x={63} y={70} d={2.6} s={1} />
        </div>
      </div>

      {/* close to the camera: dust in the morning light */}
      {morning && MOTES.map(([x, y, d, k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 4 * k, height: 4 * k, borderRadius: '50%', background: 'rgba(255,236,190,.9)', filter: `blur(${k > 1.2 ? 1.5 : 0.5}px)`, opacity: 0, mixBlendMode: 'screen', animation: `pano-mote ${9 + k * 6}s ease-in-out ${d + 3}s infinite` }} />)}
      {/* grain and a soft vignette over the moving picture */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: -60, backgroundImage: GRAIN, backgroundSize: '220px 220px', opacity: 0.4, mixBlendMode: 'overlay', animation: 'pano-grain .6s steps(5) infinite', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px 20px rgba(0,0,0,.45)', pointerEvents: 'none' }} />
      {/* thin shades only where the text sits */}
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: `linear-gradient(180deg, ${night ? 'rgba(4,6,16,.6)' : 'rgba(30,14,4,.5)'}, transparent)`, pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 170, background: `linear-gradient(0deg, ${night ? 'rgba(4,6,16,.75)' : 'rgba(20,10,4,.65)'}, transparent)`, pointerEvents: 'none' }} />

      {/* the title: big for a moment, then it settles into a small plaque */}
      <div style={{ position: 'absolute', left: 16, right: 16, top: '24%', textAlign: 'center', color: ink, textShadow: '0 2px 12px rgba(0,0,0,.85), 0 0 30px rgba(0,0,0,.6)', fontFamily: "'Old Standard TT', serif", animation: 'pano-title 2.9s ease-out .15s both', pointerEvents: 'none' }}>
        {morning && lit && reg === 'empire' && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><RomeiFlag w={40} style={{ boxShadow: '0 2px 8px rgba(0,0,0,.6)' }} /></div>}
        {morning && <div style={{ fontSize: 10, letterSpacing: 1.6, fontWeight: 700, opacity: 0.85, whiteSpace: 'nowrap' }}>{reg === 'empire' && era <= 2 ? 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ · РОМЕЙСЬКА ІМПЕРІЯ' : reg === 'soviet' ? 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ · СТСД' : 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ'}</div>}
        <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 64, lineHeight: 1, marginTop: 6 }}>{night ? 'Вечір' : 'Ранок'}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 6 }}>
          <span style={{ width: 40, height: 1, background: ink, opacity: 0.6 }} />
          <span style={{ fontFamily: "'Abril Fatface', serif", fontSize: 26, letterSpacing: 2 }}>{s.year}</span>
          <span style={{ width: 40, height: 1, background: ink, opacity: 0.6 }} />
        </div>
        <div style={{ fontSize: 14, fontStyle: 'italic', marginTop: 4, opacity: 0.9 }}>{s.served + 1}-й рік на службі · {s.first} {s.surname}</div>
      </div>
      <div style={{ position: 'absolute', left: 12, top: 12, display: 'flex', alignItems: 'baseline', gap: 8, padding: '5px 12px', borderRadius: 15, background: 'rgba(20,12,6,.55)', border: '1px solid rgba(240,215,140,.35)', color: ink, fontFamily: "'Old Standard TT', serif", animation: 'pano-plaque .6s ease-out 2.7s both', pointerEvents: 'none' }}>
        <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 17 }}>{night ? 'Вечір' : 'Ранок'}</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{s.year}</span>
        <span style={{ fontSize: 11, opacity: 0.75 }}>{s.served + 1}-й рік служби</span>
      </div>

      {/* what the city is saying: one scrap of paper per stop */}
      {notes.map((n, i) => (
        <div key={i} style={{ position: 'absolute', left: 16, right: 16, bottom: 22, ['--r' as string]: `${i % 2 ? 1.2 : -1.4}deg`, padding: '7px 12px 8px', background: '#F1E8CF', color: '#1F1A14', boxShadow: '0 10px 22px rgba(0,0,0,.6), inset 0 0 18px rgba(140,100,40,.25)', fontFamily: "'Old Standard TT', serif", opacity: 0, animation: n.last ? `pano-notelast .7s ease-out ${n.at}s forwards` : `pano-note ${n.dur}s ease-out ${n.at}s both`, pointerEvents: 'none' } as CSSProperties}>
          <span aria-hidden="true" style={{ position: 'absolute', left: '50%', top: -6, width: 12, height: 12, marginLeft: -6, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #E06A55, #7E1E16)', boxShadow: '0 2px 3px rgba(0,0,0,.5)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: 2, fontWeight: 700, color: '#6A5638' }}>
            <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: n.tone === 'good' ? '#3F8A5A' : n.tone === 'bad' ? '#B8322A' : '#9A8458' }} />
            {(n.place + (night ? ' · ВВЕЧЕРІ ГОВОРЯТЬ' : ' · ЗРАНКУ ГОВОРЯТЬ')).toUpperCase()}
          </div>
          <div style={{ marginTop: 2, fontSize: 15, lineHeight: 1.22 }}>{n.t}</div>
        </div>
      ))}
      <div style={{ position: 'absolute', right: 12, top: 18, textAlign: 'right', fontSize: 10, letterSpacing: 1.5, color: ink, fontFamily: "'Old Standard TT', serif", opacity: 0, animation: 'pano-hint 2.4s ease-in-out 3s infinite both' }}>торкніться ›</div>
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, height: 3, background: night ? '#B8913C' : '#F0D78C', animation: `pano-timer ${T + 0.6}s linear forwards` }} />
    </div>
  );
}
