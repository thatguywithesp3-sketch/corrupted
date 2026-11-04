// Between the parts of the day the camera leaves the office: a slow pan across Port-Aurum, the time of day in
// big letters, and a few lines of what the city is saying today — including what it says because of us.
// Morning comes before the paper; evening (dusk sliding into night) comes before the dark ledger.
// Tap to go on; it also leaves by itself.
import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../../engine';
import * as G from '../../engine';

export type PanoKind = 'morning' | 'evening';

const DUR = 22000;
/** a touch of blur and less saturation hides the generator's mush at close range */
const SOFT = 'blur(0.6px) saturate(0.88) contrast(1.06)';
/** film grain: a tile of noise, drawn once, jittered every frame like an old print under a projector */
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.1 -0.2"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`; // the pan; the card leaves by itself a little after

/** what the city is saying: built from the state, so our deeds come back as the city's talk */
function voices(s: GameState, kind: PanoKind): { t: string; tone: 'good' | 'bad' | 'neu' }[] {
  const c = s.city, out: { t: string; tone: 'good' | 'bad' | 'neu' }[] = [];
  const stage = s.threat < 35 ? 1 : s.threat < 70 ? 2 : 3;
  if (kind === 'morning') {
    if (c) {
      c.news.filter((n) => n.kind === 'attack' || n.kind === 'complaint').slice(0, 1).forEach((n) => out.push({ t: n.head, tone: 'bad' }));
      c.news.filter((n) => n.kind === 'open' || n.kind === 'rival').slice(0, 2 - out.length).forEach((n) => out.push({ t: n.head, tone: n.kind === 'rival' ? 'bad' : 'neu' }));
      const up = c.econ.trade >= c.prev.trade;
      out.push({ t: `Торгівля в порту ${up ? 'пожвавилася' : 'просіла'}: ${c.econ.trade} пунктів`, tone: up ? 'good' : 'bad' });
    }
    if (stage === 3) out.push({ t: 'Місто читає про вас за ранковою кавою', tone: 'bad' });
    else if (stage === 2) out.push({ t: 'У кав’ярнях дедалі частіше згадують вашу управу', tone: 'bad' });
  } else {
    if (c?.tribute) out.push({ t: `«Дахи» принесли до шухляди ${G.fmt(c.tribute)} крон`, tone: 'good' });
    if (c?.last) out.push({ t: `${c.last.ok ? 'Вдалося' : 'Не вдалося'}: ${c.last.title}`, tone: c.last.ok ? 'good' : 'bad' });
    const hunter = c?.rivals.filter((r) => !r.ally && r.heat >= 5).sort((a, z) => z.heat - a.heat)[0];
    if (hunter) out.push({ t: `У вікнах ${hunter.name.replace('Пан ', 'пана ').replace('Пані ', 'пані ').replace('Граф ', 'графа ')} ще горить світло`, tone: 'bad' });
    if (stage >= 2) out.push({ t: stage === 3 ? 'Біля управи до ночі чергує репортер' : 'У шинках шепочуться про ваші статки', tone: 'bad' });
    if (out.length < 2) out.push({ t: 'Ліхтарники обходять набережну. Гавань засинає.', tone: 'neu' });
  }
  // the quiet background of the era: one observed fact, never a judgement
  if (s.era === 1 && out.length < 3) {
    const BG = kind === 'morning'
      ? ['На Ринковій торгують чотирма мовами, а сваряться однією', 'Над Ратушею два прапори: імперський вище, вальдорський новіший', 'Біля гімназії продають вальдорський буквар — з-під поли, але відкрито', 'Пошта зі столиці знову запізнилася на тиждень']
      : ['У шинку на Подолі співають пісню, якої немає в імперському співанику', 'Імперський патруль сьогодні не вийшов: нема чим платити', 'У вікнах Старого міста світло до півночі — сперечаються про мову', 'На вокзалі проводжають делегатів до столиці. Мало хто вірить, що їх почують'];
    out.push({ t: BG[(s.year + (kind === 'morning' ? 0 : 1)) % BG.length], tone: 'neu' });
  }
  return out.slice(0, 3);
}

/** a chimney puff that rises, swells and fades; x/y in % of the picture */
const Smoke = ({ x, y, d = 0, s = 1 }: { x: number; y: number; d?: number; s?: number }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
    {[0, 1, 2].map((i) => <span key={i} className="pano-smoke" style={{ animationDelay: `${d + i * 1.3}s`, width: 26 * s, height: 26 * s, marginLeft: -13 * s, marginTop: -13 * s }} />)}
  </span>
);

/** fixed pseudo-random scatter, so the sparkles sit in the same places every time */
const scatter = (n: number, seed: number, x0: number, x1: number, y0: number, y1: number) => {
  let a = seed; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), r() * 6, 0.6 + r() * 0.9] as const);
};
const MOTES = scatter(26, 31, 0, 100, 10, 95), FLOCK = scatter(13, 41, 0, 90, 0, 40).map(([x, y, d, k]) => [x, y, d / 10, k * 1.3] as const);
const GLINTS = scatter(46, 7, 57, 99, 30, 64), STARS = scatter(40, 11, 0, 100, 1, 17), WINDOWS = scatter(34, 23, 2, 80, 30, 92);
const Glint = ({ x, y, d, k }: { x: number; y: number; d: number; k: number }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 10 * k, height: 2.2 * k, marginLeft: -5 * k, borderRadius: 2, background: 'rgba(255,240,200,.95)', boxShadow: '0 0 6px rgba(255,230,170,.9)', mixBlendMode: 'screen', opacity: 0, animation: `pano-glint ${2.4 + k * 1.6}s ease-in-out ${d}s infinite` }} />
);
const Cloud = ({ y, w, d, dur, o, dark }: { y: number; w: number; d: number; dur: number; o: number; dark?: boolean }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: '-20%', top: `${y}%`, width: w, height: w * 0.32, borderRadius: '50%', background: dark ? 'radial-gradient(ellipse, rgba(20,24,40,.9), transparent 70%)' : 'radial-gradient(ellipse, rgba(255,236,210,.9), transparent 70%)', filter: 'blur(14px)', opacity: o, animation: `pano-cloud ${dur}s linear ${d}s infinite` }} />
);
const Gull = ({ x, y, d, dur, k, c = '#2A2420' }: { x: number; y: number; d: number; dur: number; k: number; c?: string }) => (
  <svg aria-hidden="true" width={22 * k} height={10 * k} viewBox="0 0 22 10" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, overflow: 'visible', animation: `pano-gull ${dur}s linear ${d}s infinite` }}>
    <path d="M0 5 Q5 0 11 5 Q17 0 22 5" fill="none" stroke={c} strokeWidth={1.6 / Math.max(k, 0.7)} style={{ transformOrigin: '11px 5px', animation: `pano-wing ${0.5 + k * 0.3}s ease-in-out ${d}s infinite` }} />
  </svg>
);

const Glow = ({ x, y, r = 14, c = '#FFC66A', d = 0 }: { x: number; y: number; r?: number; c?: string; d?: number }) => (
  <span aria-hidden="true" className="pano-flick" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, borderRadius: '50%', background: `radial-gradient(circle, ${c} 0%, ${c}88 25%, transparent 70%)`, mixBlendMode: 'screen', animationDelay: `${d}s` }} />
);

const CSS = `
@keyframes pano-pan { from { transform: translateX(0) scale(1.06); } to { transform: translateX(calc(-100% + 390px)) scale(1.0); } }
@keyframes pano-in { from { opacity: 0; transform: translateY(14px); letter-spacing: 18px; } to { opacity: 1; transform: none; } }
@keyframes pano-line { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes pano-night { from { opacity: 0; } to { opacity: 1; } }
@keyframes pano-smoke { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 20% { opacity: .55; } 100% { opacity: 0; transform: translate(18px,-70px) scale(1.9); } }
@keyframes pano-flick { 0%,100% { opacity: .85; } 40% { opacity: .55; } 55% { opacity: 1; } 70% { opacity: .7; } }
@keyframes pano-beam { from { transform: rotate(-40deg); } to { transform: rotate(320deg); } }
@keyframes pano-gull { from { transform: translate(0,0); } to { transform: translate(900px,-60px); } }
@keyframes pano-wing { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.35); } }
@keyframes pano-grain { 0% { transform: translate(0,0); } 20% { transform: translate(-40px,22px); } 40% { transform: translate(28px,-36px); } 60% { transform: translate(-18px,-12px); } 80% { transform: translate(36px,30px); } 100% { transform: translate(0,0); } }
@keyframes pano-glint { 0%,100% { opacity: 0; transform: scaleX(.4); } 45% { opacity: .9; transform: scaleX(1); } 60% { opacity: 0; } }
@keyframes pano-cloud { from { transform: translateX(0); } to { transform: translateX(1900px); } }
@keyframes pano-star { 0%,100% { opacity: .2; } 50% { opacity: 1; } }
@keyframes pano-win { 0%, 30% { opacity: 0; } 34%, 78% { opacity: .9; } 82%, 100% { opacity: 0; } }
@keyframes pano-cab { 0% { transform: translate(0,0); opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { transform: translate(300px,-36px); opacity: 0; } }
@keyframes pano-blink { 0%, 46%, 100% { opacity: .15; } 50%, 58% { opacity: 1; } }
@keyframes pano-out { 0% { opacity: 1; } 60% { opacity: .9; } 100% { opacity: 0; } }
@keyframes pano-rays { from { transform: rotate(0deg); } to { transform: rotate(40deg); } }
@keyframes pano-mist { 0%,100% { transform: translateX(0); opacity: .35; } 50% { transform: translateX(-120px); opacity: .55; } }
@keyframes pano-breath { from { transform: scale(1) translateY(0); } to { transform: scale(1.035) translateY(-6px); } }
@keyframes pano-mote { 0% { opacity: 0; transform: translate(0,0); } 25% { opacity: .8; } 75% { opacity: .6; } 100% { opacity: 0; transform: translate(40px,-90px); } }
@keyframes pano-leak { 0% { transform: translateX(0) rotate(18deg); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(900px) rotate(18deg); opacity: 0; } }
@keyframes pano-flock { 0% { transform: translate(-260px, 40px) scale(.9); } 100% { transform: translate(560px, -120px) scale(1.15); } }
@keyframes pano-flicker { 0%, 100% { opacity: 0; } 21% { opacity: .05; } 23% { opacity: 0; } 64% { opacity: .035; } 66% { opacity: 0; } }
@keyframes pano-sparkle { 0%, 100% { opacity: 0; transform: scale(.2) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(45deg); } }
@keyframes pano-hint { 0%,100% { opacity: .35; } 50% { opacity: .9; } }
@keyframes pano-sun { 0%,100% { opacity: .75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
.pano-smoke { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(235,230,220,.75), rgba(235,230,220,0) 70%); filter: blur(3px); opacity: 0; animation: pano-smoke 4s ease-out infinite; }
.pano-flick { animation: pano-flick 2.6s ease-in-out infinite; }
`;

export function Panorama({ s, kind, onDone }: { s: GameState; kind: PanoKind; onDone: () => void }) {
  const [out, setOut] = useState(false);
  const lines = useMemo(() => voices(s, kind), [s, kind]);
  const leave = () => { if (out) return; setOut(true); setTimeout(onDone, 650); };
  useEffect(() => { const t = setTimeout(leave, DUR + 900); return () => clearTimeout(t); }); // eslint-disable-line react-hooks/exhaustive-deps
  const era = s.era, img = (n: string) => `art/city/e${era}-${n}.jpg`;
  const night = kind === 'evening';
  const ink = night ? '#E8DDC2' : '#FFF3DA';

  return (
    <div onClick={leave} role="button" aria-label="Продовжити" style={{ position: 'absolute', inset: 0, zIndex: 95, overflow: 'hidden', background: '#000', cursor: 'pointer', opacity: out ? 0 : 1, transition: 'opacity .6s ease', pointerEvents: 'auto' }}>
      <style>{CSS}</style>
      {/* the picture, wider than the phone: the camera pans across the whole city */}
      <div className="pano-move" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, aspectRatio: '16 / 9', height: '100%', animation: `pano-pan ${DUR}ms cubic-bezier(.37,0,.63,1) forwards`, transformOrigin: '0 50%' }}>
        <div className="pano-breath" style={{ position: 'absolute', inset: 0, animation: 'pano-breath 11s ease-in-out infinite alternate', transformOrigin: '50% 60%' }}>
        <img src={img(night ? 'evening' : 'morning')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT }} />
        {night && <img src={img('night')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT, opacity: 0, animation: `pano-night 6s ease-in-out 2.5s forwards` }} />}

        {/* life over the picture */}
        {!night && <>
          <span aria-hidden="true" style={{ position: 'absolute', left: '91.5%', top: '18%', width: 220, height: 220, marginLeft: -110, marginTop: -110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,236,190,.95), rgba(255,200,120,.35) 30%, transparent 68%)', mixBlendMode: 'screen', animation: 'pano-sun 5s ease-in-out infinite' }} />
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, rgba(255,210,140,.28), transparent 45%)', mixBlendMode: 'screen' }} />
          {/* slow rays from the low sun */}
          <span aria-hidden="true" style={{ position: 'absolute', left: '91.5%', top: '18%', width: 0, height: 0 }}>
            <span style={{ position: 'absolute', left: -700, top: -700, width: 1400, height: 1400, background: 'repeating-conic-gradient(from 200deg, rgba(255,226,170,.16) 0 4deg, transparent 4deg 13deg)', maskImage: 'radial-gradient(circle, #000 10%, transparent 60%)', WebkitMaskImage: 'radial-gradient(circle, #000 10%, transparent 60%)', mixBlendMode: 'screen', animation: 'pano-rays 30s linear infinite alternate' }} />
          </span>
          <Cloud y={3} w={420} d={-6} dur={70} o={0.35} /><Cloud y={9} w={300} d={-30} dur={55} o={0.3} /><Cloud y={1} w={520} d={-48} dur={90} o={0.22} />
          {/* the night lamps go out one by one */}
          {[[43.5, 50, 10, 1], [48, 53, 9, 2.5], [37, 58, 9, 4], [57, 56, 9, 5.5], [69, 54, 10, 7], [5, 70, 18, 9]].map(([x, y, r, d], i) => (
            <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, borderRadius: '50%', background: 'radial-gradient(circle, #FFC66A, #FFC66A66 25%, transparent 70%)', mixBlendMode: 'screen', animation: `pano-out 3s ease-in ${d}s both` }} />
          ))}
          {/* gulls: far ones small and slow, near ones large and quick */}
          {[[30, 12, 0, 16, 0.8], [36, 16, 1.2, 18, 0.7], [44, 10, 2.1, 15, 0.9], [56, 14, 0.6, 20, 0.6], [20, 22, 3, 11, 1.4], [62, 28, 5, 12, 1.2], [8, 6, 7, 9, 1.8], [70, 20, 9, 22, 0.5], [74, 24, 9.6, 22, 0.5], [50, 34, 4, 14, 1]].map(([x, y, d, dur, k], i) => <Gull key={i} x={x} y={y} d={d} dur={dur} k={k} />)}
          {GLINTS.map(([x, y, d, k], i) => <Glint key={i} x={x} y={y} d={d} k={k} />)}
          {[[6.5, 8, 0], [11.4, 7.2, 1.3], [14.6, 9.5, 2.4], [16.8, 11, 3.1], [29.2, 4, 1.9]].map(([x, y, d], i) => (
            <svg key={i} aria-hidden="true" width="26" height="26" viewBox="-13 -13 26 26" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, marginLeft: -13, marginTop: -13, mixBlendMode: 'screen', animation: `pano-sparkle 3.4s ease-in-out ${d}s infinite` }}>
              <path d="M0 -12 L1.4 -1.4 L12 0 L1.4 1.4 L0 12 L-1.4 1.4 L-12 0 L-1.4 -1.4 Z" fill="#FFF4D0" />
            </svg>
          ))}
          <span aria-hidden="true" className="pano-flick" style={{ position: 'absolute', left: '96.4%', top: '20.5%', width: 24, height: 24, marginLeft: -12, marginTop: -12, borderRadius: '50%', background: 'radial-gradient(circle, #FFF2C0, transparent 70%)', mixBlendMode: 'screen', animation: 'pano-blink 4s ease-in-out infinite' }} />
        </>}
        {night && <>
          <span aria-hidden="true" style={{ position: 'absolute', left: '82%', top: '9%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,230,255,.6), transparent 65%)', mixBlendMode: 'screen' }} />
          {/* the lighthouse sweeping the harbour */}
          <span aria-hidden="true" style={{ position: 'absolute', left: '96.4%', top: '20.5%', width: 0, height: 0 }}>
            <span style={{ position: 'absolute', left: 0, top: -14, width: 420, height: 28, transformOrigin: '0 50%', background: 'linear-gradient(90deg, rgba(255,230,160,.75), rgba(255,230,160,0))', clipPath: 'polygon(0 45%, 100% 0, 100% 100%, 0 55%)', mixBlendMode: 'screen', animation: 'pano-beam 5s linear infinite' }} />
          </span>
          <Glow x={96.4} y={20.5} r={18} c="#FFE6A0" />
          <Glow x={29.2} y={13.6} r={12} c="#FFF0C8" />
          {[[5, 70, 22], [95, 82, 26], [43.5, 50, 10], [48, 53, 9], [37, 58, 9], [57, 56, 9], [69, 54, 10], [28, 48, 8], [63, 46, 8]].map(([x, y, r], i) => <Glow key={i} x={x} y={y} r={r} d={i * 0.37} />)}
          {STARS.map(([x, y, d, k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 2 * k, height: 2 * k, borderRadius: '50%', background: '#F4F0FF', boxShadow: '0 0 4px #DDE4FF', opacity: 0, animation: `pano-star ${2 + k * 2}s ease-in-out ${3 + d}s infinite` }} />)}
          <Cloud y={4} w={460} d={-10} dur={80} o={0.55} dark /><Cloud y={11} w={320} d={-40} dur={60} o={0.45} dark />
          {/* windows lighting up and going dark across the town */}
          {WINDOWS.map(([x, y, d, k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 5 * k, height: 7 * k, background: '#FFCB6B', boxShadow: '0 0 8px 2px rgba(255,190,90,.7)', mixBlendMode: 'screen', opacity: 0, animation: `pano-win ${9 + k * 7}s linear ${2 + d * 1.7}s infinite` }} />)}
          {/* a cab with a lantern crossing the square, a lamplighter's light on the quay */}
          <span aria-hidden="true" style={{ position: 'absolute', left: '33%', top: '62%', width: 12, height: 12, borderRadius: '50%', background: 'radial-gradient(circle, #FFE3A0, transparent 70%)', boxShadow: '0 0 12px 4px rgba(255,200,110,.6)', animation: 'pano-cab 14s linear 3s infinite' }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: '58%', top: '57%', width: 9, height: 9, borderRadius: '50%', background: 'radial-gradient(circle, #FFE3A0, transparent 70%)', boxShadow: '0 0 10px 3px rgba(255,200,110,.55)', animation: 'pano-cab 19s linear 8s infinite' }} />
          {/* ships' riding lights: red, green and the masthead white */}
          {[[87.5, 47, '#FF5A4A', 0], [90.5, 48, '#5AF08A', 0.7], [89, 32, '#FFF4D8', 1.4], [97, 36, '#FFF4D8', 2.1], [80, 30, '#FF5A4A', 2.8]].map(([x, y, c, d], i) => (
            <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 7, height: 7, marginLeft: -3.5, borderRadius: '50%', background: c as string, boxShadow: `0 0 10px 3px ${c}`, animation: `pano-blink ${3 + i * 0.6}s ease-in-out ${d}s infinite` }} />
          ))}
          {GLINTS.slice(0, 26).map(([x, y, d, k], i) => <Glint key={i} x={x} y={y + 2} d={d + 2} k={k * 0.8} />)}
          <span aria-hidden="true" style={{ position: 'absolute', left: '50%', right: 0, top: '52%', height: 90, background: 'linear-gradient(180deg, transparent, rgba(170,180,210,.35), transparent)', filter: 'blur(10px)', animation: 'pano-mist 16s ease-in-out infinite' }} />
        </>}
        <Smoke x={14} y={44} d={0} /><Smoke x={54} y={73} d={0.8} s={1.2} /><Smoke x={74} y={74} d={1.6} /><Smoke x={88} y={42} d={0.4} s={1.5} /><Smoke x={86.5} y={43} d={1.1} s={1.8} /><Smoke x={30} y={60} d={2.2} s={0.8} /><Smoke x={8} y={46} d={3} s={0.9} /><Smoke x={22} y={52} d={1.4} s={0.7} /><Smoke x={63} y={70} d={2.6} s={1} /><Smoke x={46} y={77} d={0.2} s={0.9} />
        </div>
      </div>

      {/* close to the camera: dust in the morning light, bats across the moon, a flock of pigeons */}
      {!night && MOTES.map(([x, y, d, k], i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 4 * k, height: 4 * k, borderRadius: '50%', background: 'rgba(255,236,190,.9)', filter: `blur(${k > 1.2 ? 1.5 : 0.5}px)`, opacity: 0, mixBlendMode: 'screen', animation: `pano-mote ${9 + k * 6}s ease-in-out ${d}s infinite` }} />)}
      {!night && <span aria-hidden="true" style={{ position: 'absolute', top: '-20%', bottom: '-20%', width: 160, left: '-40%', background: 'linear-gradient(90deg, transparent, rgba(255,190,110,.22), rgba(255,230,170,.12), transparent)', transform: 'rotate(18deg)', mixBlendMode: 'screen', animation: 'pano-leak 13s ease-in-out 2s infinite' }} />}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: night ? '17%' : '44%', width: 0, height: 0, animation: `pano-flock ${night ? 9 : 7}s cubic-bezier(.3,.1,.6,1) ${night ? 6 : 5}s infinite` }}>
        {FLOCK.map(([dx, dy, d, k], i) => (
          night
            ? <svg key={i} width={18 * k} height={9 * k} viewBox="0 0 18 9" style={{ position: 'absolute', left: dx * 1.6, top: dy * 1.2, overflow: 'visible' }}><path d="M0 3 L4 1 L6 4 L9 2 L12 4 L14 1 L18 3 L13 7 L9 5 L5 7 Z" fill="#0A0A10" style={{ transformOrigin: '9px 4px', animation: `pano-wing .25s ease-in-out ${d}s infinite` }} /></svg>
            : <svg key={i} width={22 * k} height={10 * k} viewBox="0 0 22 10" style={{ position: 'absolute', left: dx * 2.6, top: dy * 1.8, overflow: 'visible' }}><path d="M0 5 Q5 0 11 5 Q17 0 22 5" fill="none" stroke="#231C16" strokeWidth="1.3" style={{ transformOrigin: '11px 5px', animation: `pano-wing .32s ease-in-out ${d}s infinite` }} /></svg>
        )).slice(0, night ? 4 : FLOCK.length)}
      </span>
      {/* the projector breathes: a faint flicker of the whole picture */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0, animation: 'pano-flicker 5.3s steps(1) infinite', pointerEvents: 'none' }} />
      {/* grain and a soft vignette over the moving picture */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: -60, backgroundImage: GRAIN, backgroundSize: '220px 220px', opacity: 0.55, mixBlendMode: 'overlay', animation: 'pano-grain .6s steps(5) infinite', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: -60, backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.18, mixBlendMode: 'multiply', animation: 'pano-grain .9s steps(4) infinite reverse', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px 30px rgba(0,0,0,.55)', pointerEvents: 'none' }} />
      {/* cinema bars and the title */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: night ? 'linear-gradient(180deg, rgba(4,6,16,.85) 0%, rgba(4,6,16,.2) 30%, rgba(4,6,16,0) 50%, rgba(4,6,16,.55) 72%, rgba(4,6,16,.92) 100%)' : 'linear-gradient(180deg, rgba(30,14,4,.7) 0%, rgba(30,14,4,.1) 30%, rgba(30,14,4,0) 50%, rgba(20,10,4,.5) 72%, rgba(14,8,4,.9) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 54, textAlign: 'center', color: ink, textShadow: '0 2px 10px rgba(0,0,0,.8)', fontFamily: "'Old Standard TT', serif" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, fontWeight: 700, opacity: 0.85, animation: 'pano-in 1.2s ease-out .2s both' }}>{s.era === 1 ? 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ · РОМАНСЬКА ІМПЕРІЯ' : 'ПОРТ-АУРУМ · ВАЛЬДОРІЯ'}</div>
        <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 66, lineHeight: 1, marginTop: 10, animation: 'pano-in 1.4s ease-out .5s both' }}>{night ? 'Вечір' : 'Ранок'}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8, animation: 'pano-in 1.4s ease-out .9s both' }}>
          <span style={{ width: 40, height: 1, background: ink, opacity: 0.6 }} />
          <span style={{ fontFamily: "'Abril Fatface', serif", fontSize: 30, letterSpacing: 2 }}>{s.year}</span>
          <span style={{ width: 40, height: 1, background: ink, opacity: 0.6 }} />
        </div>
        <div style={{ fontSize: 14, fontStyle: 'italic', marginTop: 6, opacity: 0.9, animation: 'pano-in 1.4s ease-out 1.2s both' }}>{s.served}-й рік на службі · {s.first} {s.surname}</div>
      </div>

      {/* what the city is saying today */}
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 86, display: 'flex', flexDirection: 'column', gap: 9, fontFamily: "'Old Standard TT', serif" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, fontWeight: 700, color: ink, opacity: 0.7, animation: 'pano-line .8s ease-out 1.8s both' }}>{night ? 'МІСТО ЗАСИНАЄ. ГОВОРЯТЬ:' : 'МІСТО ПРОКИДАЄТЬСЯ. ГОВОРЯТЬ:'}</div>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 15.5, lineHeight: 1.25, color: ink, textShadow: '0 1px 6px rgba(0,0,0,.9)', animation: `pano-line .8s ease-out ${2.3 + i * 0.9}s both` }}>
            <span style={{ flexShrink: 0, width: 8, height: 8, marginTop: 6, transform: 'rotate(45deg)', background: l.tone === 'good' ? '#6FCB92' : l.tone === 'bad' ? '#F07A5A' : '#D9C79B' }} />
            <span>{l.t}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontSize: 12, letterSpacing: 2, color: ink, fontFamily: "'Old Standard TT', serif", animation: 'pano-hint 2.4s ease-in-out 3s infinite both' }}>торкніться, щоб продовжити</div>
      {/* the timer: a thin line burning down */}
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, height: 3, background: night ? '#B8913C' : '#F0D78C', animation: `pano-timer ${DUR + 900}ms linear forwards` }} />
      <style>{'@keyframes pano-timer { from { width: 100%; } to { width: 0%; } }'}</style>
    </div>
  );
}
