// Between the parts of the day the camera leaves the office and takes a short tour of Port-Aurum: the Old Town, the
// market square with the opera, the harbour. The time of day changes while we look (night thins into dawn; dusk sinks
// into night and the lamplighter goes round), small ink figures go about their business, and at each stop one thing the
// city is saying today appears on a scrap of paper — including what it says because of us.
// Morning comes before the paper; evening comes before the dark ledger. Tap to go on; it also leaves by itself.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { RomeiFlag } from './Heraldry';
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
  // the harbour stop always gets the port: trade in the morning, the sleeping harbour at night
  const up = c ? c.econ.trade >= c.prev.trade : true;
  const port: Voice = kind === 'morning'
    ? { t: c ? `Торгівля в порту ${up ? 'пожвавилася' : 'просіла'}: ${c.econ.trade} пунктів` : 'Пароплави розводять пари, докери вже на причалі', tone: c ? (up ? 'good' : 'bad') : 'neu' }
    : { t: 'Ліхтарники обходять набережну. Гавань засинає.', tone: 'neu' };
  return [...out.slice(0, 2), port];
}

// ---------------------------------------------------------------- the city's life: tiny ink figures

/** a person walking from x0 to x1 (% of the picture) along the line y; k = size; lantern / pole / sack / basket */
function Walker({ x0, x1, y, y1, k = 1, d = 0, dur = 8, lantern, pole, sack, basket, hat = true }: { x0: number; x1: number; y: number; k?: number; d?: number; dur?: number; lantern?: boolean; pole?: boolean; sack?: boolean; basket?: boolean; hat?: boolean; y1?: number }) {
  const flip = x1 < x0;
  return (
    <span aria-hidden="true" style={{ position: 'absolute', top: `${y}%`, width: 0, height: 0, ['--x0' as string]: `${x0}%`, ['--x1' as string]: `${x1}%`, ['--y0' as string]: `${y}%`, ['--y1' as string]: `${y1 ?? y}%`, left: `${x0}%`, animation: `pano-walk ${dur}s linear ${d}s both` } as CSSProperties}>
      <svg width={12 * k} height={22 * k} viewBox="-6 -22 12 22" style={{ position: 'absolute', left: -6 * k, top: -22 * k, overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}>
        <g style={{ animation: `pano-bob ${0.5}s ease-in-out ${d}s infinite` }}>
          {hat && <path d="M-2.4 -19.6 H2.4 V-21.2 H-1.6 Z M-3.2 -19.6 H3.2" stroke={INKC} strokeWidth=".8" fill={INKC} />}
          <circle cx="0" cy="-18" r="1.9" fill={INKC} />
          <path d="M-2.2 -15.6 L2.2 -15.6 L3 -8 L-3 -8 Z" fill={INKC} />
          <path d="M-1 -8 L-2 -1 M1 -8 L2 -1" stroke={INKC} strokeWidth="1.4" strokeLinecap="round" style={{ transformOrigin: '0 -8px', animation: `pano-step .5s ease-in-out ${d}s infinite` }} />
          {sack && <ellipse cx="-.6" cy="-17" rx="3.6" ry="2.4" fill="#3A2C1E" />}
          {basket && <path d="M2.6 -11 h3 l-.6 2.6 h-1.8 Z" fill="#3A2C1E" />}
          {pole && <path d="M2 -12 L7 -27" stroke={INKC} strokeWidth=".8" />}
        </g>
      </svg>
      {lantern && <span style={{ position: 'absolute', left: (pole ? 8 : 4) * k - 6, top: (pole ? -27 : -10) * k - 6, width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #FFE7A8, rgba(255,200,110,0) 70%)', boxShadow: '0 0 10px 4px rgba(255,190,90,.55)', mixBlendMode: 'screen' }} />}
    </span>
  );
}
/** a horse with a cab, a cart or the horse tram */
function Rig({ x0, x1, y, k = 1, d = 0, dur = 8, kind = 'cab', lantern }: { x0: number; x1: number; y: number; k?: number; d?: number; dur?: number; kind?: 'cab' | 'cart' | 'tram'; lantern?: boolean }) {
  const flip = x1 < x0, w = kind === 'tram' ? 46 : 32;
  return (
    <span aria-hidden="true" style={{ position: 'absolute', top: `${y}%`, width: 0, height: 0, ['--x0' as string]: `${x0}%`, ['--x1' as string]: `${x1}%`, ['--y0' as string]: `${y}%`, ['--y1' as string]: `${y}%`, left: `${x0}%`, animation: `pano-walk ${dur}s linear ${d}s both` } as CSSProperties}>
      <svg width={w * k} height={18 * k} viewBox={`${-w / 2} -18 ${w} 18`} style={{ position: 'absolute', left: (-w / 2) * k, top: -18 * k, overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}>
        <g style={{ animation: `pano-bob .42s ease-in-out ${d}s infinite` }} fill={INKC}>
          {/* the horse */}
          <path d={`M${w / 2 - 11} -10 q2 -3 6 -2 l3 -4 l1.6 1 l-1.4 4.6 l-1 1.4 q-1 3 -5 3 h-4 Z`} />
          <path d={`M${w / 2 - 10} -6 l-1 6 M${w / 2 - 4} -6 l1 6`} stroke={INKC} strokeWidth="1.2" style={{ transformOrigin: `${w / 2 - 7}px -6px`, animation: `pano-step .42s ease-in-out ${d}s infinite` }} />
          {kind === 'tram'
            ? <><rect x={-w / 2} y="-15" width={w - 13} height="11" rx="1.5" /><rect x={-w / 2 + 2} y="-13" width={w - 17} height="4" fill="#E8C878" opacity=".55" /><rect x={-w / 2 - 1} y="-16.5" width={w - 11} height="1.6" /></>
            : kind === 'cab'
              ? <><path d={`M${-w / 2} -5 h${w - 14} v-6 q-3 -5 -9 -5 h-${w - 23} Z`} /><rect x={-w / 2 + 3} y="-13" width="5" height="4" fill="#E8C878" opacity=".5" /></>
              : <><path d={`M${-w / 2} -6 h${w - 14} l-2 -4 h-${w - 18} Z`} /><path d={`M${-w / 2 + 2} -10 q4 -6 ${w - 20} -2 Z`} fill="#4A3826" /></>}
          <circle cx={-w / 2 + 5} cy="-3" r="3" fill="none" stroke={INKC} strokeWidth="1" /><circle cx={w / 2 - 17} cy="-3" r="3" fill="none" stroke={INKC} strokeWidth="1" />
        </g>
      </svg>
      {lantern && <span style={{ position: 'absolute', left: (w / 2 - 14) * k - 6, top: -14 * k - 6, width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #FFE7A8, rgba(255,200,110,0) 70%)', boxShadow: '0 0 12px 5px rgba(255,190,90,.55)', mixBlendMode: 'screen' }} />}
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
/** windows of the painted town (rows of houses), lit in a wave as the camera passes */
const WINDOWS = [...scatter(14, 23, 3, 30, 52, 92), ...scatter(14, 29, 34, 60, 40, 70), ...scatter(10, 37, 62, 82, 44, 66)];
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

/** street lamps of the painted town: the Old Town street (left), the market square, the quay */
const LAMPS: [number, number, number][] = [[12, 88.5, 15], [17.5, 84, 14], [22.5, 80.5, 12], [27.5, 76.5, 10], [38.5, 55, 9], [43.5, 51, 10], [48, 53, 9], [52.5, 55.5, 9], [57, 56, 9], [69, 54, 10], [73.5, 53, 9], [78, 55, 9]];
/** where the scraps of paper point: the three stops */
const PLACES = ['Старе місто', 'Ринкова площа', 'Гавань'];
/** the lamplighter's walk across the square; each square lamp comes on as he reaches it */
const LL = { x0: 36, x1: 59, d: 3.5, dur: 3.2 };
const lampOnAt = (x: number) => (x >= LL.x0 && x <= LL.x1 ? LL.d + ((x - LL.x0) / (LL.x1 - LL.x0)) * LL.dur + 0.1 : seenAt(x) + 0.3);

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
@keyframes pano-walk { from { left: var(--x0); top: var(--y0); } to { left: var(--x1); top: var(--y1, var(--y0)); } }
@keyframes pano-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-.6px); } }
@keyframes pano-step { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(-1); } }
@keyframes pano-lampoff { from { opacity: .95; } to { opacity: 0; } }
@keyframes pano-lampon { 0% { opacity: 0; transform: scale(.4); } 40% { opacity: 1; transform: scale(1.15); } 100% { opacity: .9; transform: scale(1); } }
@keyframes pano-flick { 0%,100% { opacity: .9; } 40% { opacity: .6; } 55% { opacity: 1; } 70% { opacity: .75; } }
@keyframes pano-win { from { opacity: 0; } to { opacity: .85; } }
@keyframes pano-sunrise { from { opacity: 0; transform: translateY(70px) scale(.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes pano-smoke { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 20% { opacity: .55; } 100% { opacity: 0; transform: translate(18px,-70px) scale(1.9); } }
@keyframes pano-beam { from { transform: rotate(-40deg); } to { transform: rotate(320deg); } }
@keyframes pano-gull { from { transform: translate(0,0); } to { transform: translate(900px,-60px); } }
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
          {morning && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, rgba(255,214,150,.34), rgba(255,200,130,.08) 50%, transparent 70%)', mixBlendMode: 'screen', opacity: 0, animation: 'pano-fadein 4s ease-in 3.2s forwards' }} />}
          {night && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,16,44,.45), rgba(10,16,44,.15) 60%, rgba(10,16,44,.35))', mixBlendMode: 'multiply', opacity: 0, animation: 'pano-fadein 6s ease-in 2s forwards' }} />}

          {/* street lamps go out (morning) or come on (evening) as the camera reaches them */}
          {LAMPS.map(([x, y, r], i) => <Lamp key={i} x={x} y={y} r={r} on={night} at={night ? lampOnAt(x) : seenAt(x) + 0.4} />)}
          {/* windows light up in a wave in the evening */}
          {night && WINDOWS.map(([x, y, , k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 4 * k, height: 6 * k, background: '#FFCB6B', boxShadow: '0 0 8px 2px rgba(255,190,90,.7)', mixBlendMode: 'screen', opacity: 0, animation: `pano-win .6s ease-out ${seenAt(x) + (i % 4) * 0.25}s forwards` }} />)}

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

          {/* the city's life */}
          {morning && <>
            {/* the market square: the horse tram, a cart to the market, people crossing */}
            <Rig x0={34} x1={60} y={60} k={0.8} d={1.6} dur={8.4} kind="tram" />
            <Rig x0={58} x1={39} y={57} k={0.65} d={2.4} dur={8} kind="cart" />
            <Walker x0={42} x1={50} y={58.5} k={0.6} d={2.8} dur={7} />
            <Walker x0={53} x1={45} y={61} k={0.62} d={3.2} dur={7} basket hat={false} />
            {/* the quay: dockers with sacks, a boat rowing out */}
            <Walker x0={68} x1={77} y={57} k={0.58} d={4.6} dur={6} sack />
            <Walker x0={70} x1={78.5} y={56.6} k={0.55} d={5.2} dur={6} sack />
            <Walker x0={79} x1={71} y={57.4} k={0.56} d={5.6} dur={6} />
            <span aria-hidden="true" style={{ position: 'absolute', left: '84%', top: '60%', animation: `pano-boat ${T}s linear both` }}><svg width="26" height="8" viewBox="0 0 26 8"><path d="M0 3 H26 L22 7 H4 Z" fill={INKC} /><path d="M10 3 L6 -2 M16 3 L20 -2" stroke={INKC} strokeWidth=".8" /></svg></span>
            {/* pigeons burst off the town hall tower */}
            <span aria-hidden="true" style={{ position: 'absolute', left: '29%', top: '14%', width: 0, height: 0, animation: 'pano-flock 5s cubic-bezier(.3,.1,.6,1) 1.2s both' }}>
              {FLOCK.map(([dx, dy, d, k], i) => <svg key={i} width={20 * k} height={9 * k} viewBox="0 0 22 10" style={{ position: 'absolute', left: dx * 1.4, top: dy * 1.2, overflow: 'visible' }}><path d="M0 5 Q5 0 11 5 Q17 0 22 5" fill="none" stroke="#231C16" strokeWidth="1.4" style={{ transformOrigin: '11px 5px', animation: `pano-wing .3s ease-in-out ${d}s infinite` }} /></svg>)}
            </span>
          </>}
          {night && <>
            {/* the lamplighter crosses the market square lighting the lamps one by one */}
            <Walker x0={LL.x0} x1={LL.x1} y={58.6} k={0.75} d={LL.d} dur={LL.dur} pole lantern />
            {/* cabs with lanterns cross the square, late walkers */}
            <Rig x0={60} x1={35} y={58} k={0.72} d={2.8} dur={7} kind="cab" lantern />
            <Rig x0={37} x1={58} y={61} k={0.68} d={3.6} dur={7.5} kind="cab" lantern />
            <Walker x0={47} x1={41} y={57} k={0.6} d={3.8} dur={6} />
            {/* a gendarme patrol with a lantern on the quay */}
            <Walker x0={78} x1={69} y={57} k={0.58} d={6} dur={6} lantern />
            <Walker x0={79} x1={70} y={57.3} k={0.58} d={6.15} dur={6} />
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
        {morning && era === 1 && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><RomeiFlag w={40} style={{ boxShadow: '0 2px 8px rgba(0,0,0,.6)' }} /></div>}
        {morning && <div style={{ fontSize: 10, letterSpacing: 1.6, fontWeight: 700, opacity: 0.85, whiteSpace: 'nowrap' }}>{era === 1 ? 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ · РОМЕЙСЬКА ІМПЕРІЯ' : 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ'}</div>}
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
