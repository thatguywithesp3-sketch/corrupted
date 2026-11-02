// Between the parts of the day the camera leaves the office: a slow pan across Port-Aurum, the time of day in
// big letters, and a few lines of what the city is saying today — including what it says because of us.
// Morning comes before the paper; evening (dusk sliding into night) comes before the dark ledger.
// Tap to go on; it also leaves by itself.
import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../../engine';
import * as G from '../../engine';

export type PanoKind = 'morning' | 'evening';

const DUR = 7600;
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
  return out.slice(0, 3);
}

/** a chimney puff that rises, swells and fades; x/y in % of the picture */
const Smoke = ({ x, y, d = 0, s = 1 }: { x: number; y: number; d?: number; s?: number }) => (
  <span aria-hidden="true" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
    {[0, 1, 2].map((i) => <span key={i} className="pano-smoke" style={{ animationDelay: `${d + i * 1.3}s`, width: 26 * s, height: 26 * s, marginLeft: -13 * s, marginTop: -13 * s }} />)}
  </span>
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
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, aspectRatio: '16 / 9', height: '100%', animation: `pano-pan ${DUR}ms cubic-bezier(.45,.05,.4,1) forwards`, transformOrigin: '0 50%' }}>
        <img src={img(night ? 'evening' : 'morning')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT }} />
        {night && <img src={img('night')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: SOFT, opacity: 0, animation: `pano-night 3.2s ease-in 1.6s forwards` }} />}

        {/* life over the picture */}
        {!night && <>
          <span aria-hidden="true" style={{ position: 'absolute', left: '91.5%', top: '18%', width: 220, height: 220, marginLeft: -110, marginTop: -110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,236,190,.95), rgba(255,200,120,.35) 30%, transparent 68%)', mixBlendMode: 'screen', animation: 'pano-sun 5s ease-in-out infinite' }} />
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(200deg, rgba(255,210,140,.28), transparent 45%)', mixBlendMode: 'screen' }} />
          {[[30, 12, 0], [36, 16, 1.2], [44, 10, 2.1], [56, 14, 0.6]].map(([x, y, d], i) => (
            <svg key={i} aria-hidden="true" width="22" height="10" viewBox="0 0 22 10" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, overflow: 'visible', animation: `pano-gull ${9 + i}s linear ${d}s infinite` }}>
              <path d="M0 5 Q5 0 11 5 Q17 0 22 5" fill="none" stroke="#2A2420" strokeWidth="1.6" style={{ transformOrigin: '11px 5px', animation: `pano-wing .7s ease-in-out ${d}s infinite` }} />
            </svg>
          ))}
        </>}
        {night && <>
          <span aria-hidden="true" style={{ position: 'absolute', left: '82%', top: '9%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,230,255,.6), transparent 65%)', mixBlendMode: 'screen' }} />
          {/* the lighthouse sweeping the harbour */}
          <span aria-hidden="true" style={{ position: 'absolute', left: '96.4%', top: '20.5%', width: 0, height: 0 }}>
            <span style={{ position: 'absolute', left: 0, top: -14, width: 420, height: 28, transformOrigin: '0 50%', background: 'linear-gradient(90deg, rgba(255,230,160,.75), rgba(255,230,160,0))', clipPath: 'polygon(0 45%, 100% 0, 100% 100%, 0 55%)', mixBlendMode: 'screen', animation: 'pano-beam 5s linear infinite' }} />
          </span>
          <Glow x={96.4} y={20.5} r={18} c="#FFE6A0" />
          {[[5, 70, 22], [95, 82, 26], [43.5, 50, 10], [48, 53, 9], [37, 58, 9], [57, 56, 9], [69, 54, 10], [28, 48, 8], [63, 46, 8]].map(([x, y, r], i) => <Glow key={i} x={x} y={y} r={r} d={i * 0.37} />)}
        </>}
        <Smoke x={14} y={44} d={0} /><Smoke x={54} y={73} d={0.8} s={1.2} /><Smoke x={74} y={74} d={1.6} /><Smoke x={88} y={42} d={0.4} s={1.5} /><Smoke x={30} y={60} d={2.2} s={0.8} />
      </div>

      {/* grain and a soft vignette over the moving picture */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: -60, backgroundImage: GRAIN, backgroundSize: '220px 220px', opacity: 0.55, mixBlendMode: 'overlay', animation: 'pano-grain .6s steps(5) infinite', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: -60, backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.18, mixBlendMode: 'multiply', animation: 'pano-grain .9s steps(4) infinite reverse', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px 30px rgba(0,0,0,.55)', pointerEvents: 'none' }} />
      {/* cinema bars and the title */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: night ? 'linear-gradient(180deg, rgba(4,6,16,.85) 0%, rgba(4,6,16,.2) 30%, rgba(4,6,16,0) 50%, rgba(4,6,16,.55) 72%, rgba(4,6,16,.92) 100%)' : 'linear-gradient(180deg, rgba(30,14,4,.7) 0%, rgba(30,14,4,.1) 30%, rgba(30,14,4,0) 50%, rgba(20,10,4,.5) 72%, rgba(14,8,4,.9) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 54, textAlign: 'center', color: ink, textShadow: '0 2px 10px rgba(0,0,0,.8)', fontFamily: "'Old Standard TT', serif" }}>
        <div style={{ fontSize: 11, letterSpacing: 4, fontWeight: 700, opacity: 0.85, animation: 'pano-in 1.2s ease-out .2s both' }}>ПОРТ-АУРУМ · СТОЛИЦЯ ВАЛЬДОРІЇ</div>
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
