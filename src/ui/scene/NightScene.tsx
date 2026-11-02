// Night: the year is closed. Between heavy velvet curtains Port-Aurum sleeps; on the desk lies the year's
// report from the copy-book, stamped CLOSED. "Next year" brings the dawn into the view.
// The report speaks the same paper language as the black book: colour = meaning, pencil blocks, stickers, sections.
import { useEffect, useState, type ReactNode } from 'react';
import * as G from '../../engine';
import type { GameState, Meter, ReportLine } from '../../engine';
import { City, type Phase } from './City';
import { Sec, Sticker, Stickers, T, type Tone } from './Ledger';
import { DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

// ============================================================ the view between the curtains

const FILE: Record<Phase, string> = { night: 'night', dawn: 'morning', dusk: 'evening', day: 'morning' };
/** Generated view of Port-Aurum for the era and time of day (public/art/city/eN-night|morning|evening.jpg).
 *  Night and morning are both mounted so dawn cross-fades; a missing file falls back to the drawn city. */
function CityView({ era, phase, lightsOut }: { era: number; phase: Phase; lightsOut?: boolean }) {
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const want = FILE[phase], src = (n: string) => `art/city/e${era}-${n}.jpg`;
  if (bad[want]) return <City phase={phase} width="100%" height="100%" lightsOut={lightsOut} />;
  return (
    <>
      {Array.from(new Set(['night', 'morning', want])).map((n) => (
        <img key={n} src={src(n)} alt="" onError={() => setBad((b) => ({ ...b, [n]: true }))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '55% 45%', opacity: n === want ? 1 : 0, transition: 'opacity 1.4s ease' }} />
      ))}
    </>
  );
}

/** One velvet drape, gathered by a gold rope tie-back. Drawn for the left side; the right one is mirrored.
 *  Folds are separate converging creases (shadow + highlight), so the cloth reads as cloth, not stripes. */
function Drape({ h, id }: { h: number; id: string }) {
  const W = 100, tieY = h * 0.62, tieX = 30;
  const outline = `M0 0 H${W} C${W - 4} ${h * 0.25} ${tieX + 22} ${tieY - 26} ${tieX} ${tieY} C${tieX + 12} ${tieY + 22} ${tieX + 26} ${h - 18} ${tieX + 34} ${h} H0 Z`;
  // creases: from the top (spread) through the tie-back (gathered) to the hem (spread again)
  const creases = Array.from({ length: 11 }, (_, i) => {
    const xt = 3 + i * ((W - 8) / 10), xm = 5 + i * ((tieX - 6) / 10), xb = 3 + i * ((tieX + 30) / 10);
    return `M${xt} 0 C${xt} ${tieY * 0.5} ${xm + 2} ${tieY - 30} ${xm} ${tieY} C${xm} ${tieY + 30} ${xb - 2} ${h - 30} ${xb} ${h}`;
  });
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(6px 4px 6px rgba(0,0,0,0.7))' }} aria-hidden="true">
      <defs>
        <linearGradient id={id + 'v'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A0407" /><stop offset=".55" stopColor="#5E0D14" /><stop offset="1" stopColor="#3A0609" /></linearGradient>
        <radialGradient id={id + 'lamp'} cx="85%" cy="80%" r="70%"><stop offset="0" stopColor="#C4553A" stopOpacity=".35" /><stop offset="1" stopColor="#C4553A" stopOpacity="0" /></radialGradient>
        <filter id={id + 'nap'} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1 0.08" numOctaves="2" seed="5" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 -0.05" /></filter>
        <filter id={id + 'soft'}><feGaussianBlur stdDeviation="1.6" /></filter>
        <clipPath id={id + 'c'}><path d={outline} /></clipPath>
        <linearGradient id={id + 'gold'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6DB8E" /><stop offset=".5" stopColor="#B88A2E" /><stop offset="1" stopColor="#6E4E12" /></linearGradient>
      </defs>
      <path d={outline} fill={`url(#${id}v)`} />
      <g clipPath={`url(#${id}c)`}>
        {creases.map((d, i) => <path key={'d' + i} d={d} stroke="rgba(8,0,2,0.85)" strokeWidth={i % 2 ? 4 : 7} fill="none" filter={`url(#${id}soft)`} transform="translate(2 0)" />)}
        {creases.map((d, i) => <path key={'l' + i} d={d} stroke={i % 3 === 1 ? 'rgba(232,110,110,0.7)' : 'rgba(190,52,60,0.6)'} strokeWidth={i % 2 ? 2 : 3.4} fill="none" filter={`url(#${id}soft)`} transform="translate(-2 0)" />)}
        <rect width={W} height={h} filter={`url(#${id}nap)`} />
        <rect width={W} height={h} fill={`url(#${id}lamp)`} />
        {/* the cloth bulges above and below the tie-back: shading */}
        <ellipse cx={tieX - 4} cy={tieY} rx="40" ry="10" fill="rgba(0,0,0,0.45)" filter={`url(#${id}soft)`} />
        <path d={`M0 ${h - 6} H${W}`} stroke="rgba(0,0,0,0.5)" strokeWidth="6" filter={`url(#${id}soft)`} />
      </g>
      {/* gold rope tie-back with a tassel */}
      <path d={`M-2 ${tieY - 6} C${tieX * 0.4} ${tieY + 10} ${tieX + 4} ${tieY + 8} ${tieX + 6} ${tieY - 2}`} stroke="#3A2606" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={`M-2 ${tieY - 6} C${tieX * 0.4} ${tieY + 10} ${tieX + 4} ${tieY + 8} ${tieX + 6} ${tieY - 2}`} stroke={`url(#${id}gold)`} strokeWidth="3.6" fill="none" strokeLinecap="round" strokeDasharray="2.4 1.4" />
      <circle cx="1" cy={tieY - 6} r="4.5" fill={`url(#${id}gold)`} stroke="#3A2606" strokeWidth=".8" />
      <g transform={`translate(${tieX + 4} ${tieY})`}>
        <circle r="3.6" fill={`url(#${id}gold)`} stroke="#4A320A" strokeWidth=".6" />
        <path d="M-3 3 Q0 6 3 3 L4.5 16 Q0 18 -4.5 16 Z" fill={`url(#${id}gold)`} stroke="#4A320A" strokeWidth=".5" />
        {[-3.6, -2, -0.5, 1, 2.5, 3.8].map((x) => <path key={x} d={`M${x * 0.9} 15 L${x} 22`} stroke="#9A7228" strokeWidth=".8" />)}
      </g>
    </svg>
  );
}

/** valance across the top: three velvet swags with gold fringe */
function Valance({ id }: { id: string }) {
  return (
    <svg width="100%" height="30" viewBox="0 0 360 30" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'block', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.7))' }} aria-hidden="true">
      <defs>
        <linearGradient id={id + 'sw'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A0407" /><stop offset=".6" stopColor="#6A1018" /><stop offset="1" stopColor="#3A0609" /></linearGradient>
        <linearGradient id={id + 'fr'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8C878" /><stop offset="1" stopColor="#8A6420" /></linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="9" fill="#1E0305" />
      {[0, 120, 240].map((x) => (
        <g key={x}>
          <path d={`M${x} 6 Q${x + 60} 34 ${x + 120} 6 Z`} fill={`url(#${id}sw)`} />
          <path d={`M${x + 10} 9 Q${x + 60} 26 ${x + 110} 9`} stroke="rgba(190,60,70,0.4)" strokeWidth="1.4" fill="none" />
          <path d={`M${x + 4} 8 Q${x + 60} 32 ${x + 116} 8`} stroke="rgba(0,0,0,0.5)" strokeWidth="1" fill="none" />
          <path d={`M${x} 6 Q${x + 60} 34 ${x + 120} 6`} stroke={`url(#${id}fr)`} strokeWidth="3.4" fill="none" strokeDasharray="1 1.2" />
        </g>
      ))}
    </svg>
  );
}

/** Port-Aurum seen between drawn-back curtains, no frame: the room opens straight onto the city. */
export function CurtainView({ era = 1, phase, height, lightsOut, children }: { era?: number; phase: Phase; height: number; lightsOut?: boolean; children?: ReactNode }) {
  return (
    <div style={{ position: 'relative', height, flexShrink: 0, margin: '0 -8px' }}>
      <div style={{ position: 'absolute', left: 30, right: 30, top: 6, bottom: 0, overflow: 'hidden' }}>
        <CityView era={era} phase={phase} lightsOut={lightsOut} />
        {/* the room is darker than the city: deep vignette at the edges, curtains' shadow on the view */}
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 26px 6px rgba(0,0,0,0.75)', background: 'linear-gradient(90deg, rgba(0,0,0,0.45), transparent 22%, transparent 78%, rgba(0,0,0,0.45))', pointerEvents: 'none' }} />
        {children}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0 }}><Drape h={height + 6} id="drL" /></div>
      <div style={{ position: 'absolute', right: 0, top: 0, transform: 'scaleX(-1)' }}><Drape h={height + 6} id="drR" /></div>
      <Valance id="val" />
    </div>
  );
}

// ============================================================ the year report

const METERS: Meter[] = ['patron', 'people', 'system', 'threat'];
const LINE_TONE: Record<ReportLine['tone'], Tone> = { ok: 'clean', warn: 'dirty', bad: 'risk', neu: 'neu' };
/** report lines grouped by what they are about */
const GROUP: Record<string, { t: string; tone: Tone }> = {
  share: { t: 'ГРОШІ', tone: 'dirty' }, laun: { t: 'ГРОШІ', tone: 'dirty' }, dirty: { t: 'ГРОШІ', tone: 'dirty' },
  kid: { t: 'РОДИНА І ЛЮДИ', tone: 'hide' }, heart: { t: 'РОДИНА І ЛЮДИ', tone: 'hide' }, ear: { t: 'РОДИНА І ЛЮДИ', tone: 'hide' },
  patron: { t: 'КАР’ЄРА', tone: 'clean' },
  threat: { t: 'РИЗИК І ОБШУК', tone: 'risk' }, floor: { t: 'РИЗИК І ОБШУК', tone: 'risk' }, skull: { t: 'РИЗИК І ОБШУК', tone: 'risk' }
};

/** one meter as a pencilled scale: red danger zones at the ends, last year's mark, this year's value, the change */
function Scale({ m, v, was, dz, label }: { m: Meter; v: number; was: number | null; dz: number; label: string }) {
  const isT = m === 'threat', dv = was === null ? 0 : v - was;
  const better = isT ? dv < 0 : Math.abs(v - 50) < Math.abs(v - dv - 50);
  const danger = isT ? v >= 60 : v <= dz || v >= 100 - dz;
  const hatch = (c: string) => `repeating-linear-gradient(-62deg, ${c} 0 1.3px, transparent 1.3px 3px)`;
  const tone: Tone = danger ? 'risk' : 'neu';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
      <Ic k={m} size={16} color={danger ? T.risk.ink : MUTE} />
      <span style={{ width: 96, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: danger ? T.risk.ink : INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <span style={{ position: 'relative', flex: 1, height: 12, border: `1.2px solid ${INK}`, background: 'rgba(255,255,255,0.35)' }}>
        {/* danger zones */}
        {isT ? <span style={{ position: 'absolute', left: '60%', right: 0, top: 0, bottom: 0, background: hatch(`${T.risk.pen}88`) }} />
          : <><span style={{ position: 'absolute', left: 0, width: dz + '%', top: 0, bottom: 0, background: hatch(`${T.risk.pen}88`) }} /><span style={{ position: 'absolute', right: 0, width: dz + '%', top: 0, bottom: 0, background: hatch(`${T.risk.pen}88`) }} /></>}
        {/* this year's value: pencil fill to the mark */}
        <span style={{ position: 'absolute', left: 0, width: Math.max(0, Math.min(100, v)) + '%', top: 2, bottom: 2, background: hatch(danger ? T.risk.pen : '#6A5A3E'), opacity: 0.75 }} />
        {was !== null && dv !== 0 && <span title="минулого року" style={{ position: 'absolute', left: `calc(${Math.max(0, Math.min(100, was))}% - 1px)`, top: -3, bottom: -3, width: 2, background: 'rgba(31,26,20,0.35)' }} />}
        <span style={{ position: 'absolute', left: `calc(${Math.max(0, Math.min(100, v))}% - 1.5px)`, top: -4, bottom: -4, width: 3, background: danger ? T.risk.ink : INK }} />
      </span>
      <span style={{ width: 28, textAlign: 'right' }}><span style={{ fontFamily: HAND, fontSize: 19, color: T[tone].ink }}>{Math.round(v)}</span></span>
      <span style={{ width: 40, textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '1px 0', borderRadius: 2,
        background: dv === 0 ? 'transparent' : better ? `${T.clean.pen}40` : `${T.risk.pen}40`, color: dv === 0 ? MUTE : better ? T.clean.ink : T.risk.ink }}>{dv === 0 ? '—' : (dv > 0 ? '▲' : '▼') + Math.abs(Math.round(dv))}</span>
    </div>
  );
}

function Lines({ lines }: { lines: ReportLine[] }) {
  return (
    <>
      {lines.map((r, i) => {
        const lt = LINE_TONE[r.tone];
        return (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0', fontSize: 12.5, lineHeight: 1.3, fontWeight: r.strong ? 700 : 400 }}>
            <span style={{ width: 20, height: 20, borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: lt === 'neu' ? 'transparent' : `${T[lt].pen}33`, boxShadow: `inset 0 0 0 1px ${T[lt].pen}88` }}><Ic k={r.icon || 'threat'} size={13} color={T[lt].ink} /></span>
            <span style={{ color: lt === 'risk' ? T.risk.ink : INK }}>{r.t}</span>
          </div>
        );
      })}
    </>
  );
}

export function NightScene({ s, run, before }: { s: GameState; run: Run; before: GameState | null }) {
  const C = G.getEra(s.era);
  const [dawn, setDawn] = useState(false);
  const [stamped, setStamped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStamped(true), 350); return () => clearTimeout(t); }, []);
  const closedYear = s.year - 1;
  const lead = s.report.find((r) => r.strong) || s.report[0];
  const rest = s.report.filter((r) => r !== lead);
  const groups: { t: string; tone: Tone; lines: ReportLine[] }[] = [];
  rest.forEach((r) => { const g = GROUP[r.icon] || { t: 'ІНШЕ', tone: 'neu' as Tone }; let x = groups.find((y) => y.t === g.t); if (!x) groups.push((x = { ...g, lines: [] })); x.lines.push(r); });
  const b = before;
  const hidden = s.floor + s.wh, hiddenWas = b ? b.floor + b.wh : null;
  const dClean = b ? s.clean - b.clean : 0, dHidden = hiddenWas === null ? 0 : hidden - hiddenWas;
  const next = () => { if (dawn) return; setDawn(true); setTimeout(() => run(G.sleep), 1500); };
  const leadTone: Tone = lead ? LINE_TONE[lead.tone] : 'neu';
  const sg = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + G.fk(Math.abs(v));

  return (
    <div style={{ position: 'relative', zIndex: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 6, fontFamily: SERIF, color: INK }}>
      <CurtainView era={s.era} phase={dawn ? 'dawn' : 'night'} height={168} lightsOut={dawn} />

      {/* the report sheet on the desk */}
      <div className="tx-paper" style={{ position: 'relative', flex: 1, minHeight: 0, margin: '-10px 4px 10px', padding: '11px 14px 8px', background: '#F1E8CF', transform: 'rotate(0.5deg)', boxShadow: '0 14px 24px rgba(0,0,0,0.6), inset 0 0 30px rgba(150,110,50,0.22)', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, letterSpacing: 2, color: MUTE }}><span>КОПІЮВАЛЬНА КНИГА</span><span>ЗВІТ ЗА РІК</span></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 28, lineHeight: 1 }}>РІК {closedYear}</span>
          <span style={{ fontSize: 11.5, fontStyle: 'italic', color: MUTE, lineHeight: 1.2 }}>{s.served}-й рік<br />на службі</span>
          <span aria-hidden="true" style={{ position: 'absolute', right: 0, top: 6, padding: '3px 9px', border: `3px double ${RED}`, color: RED, fontFamily: "'Ruslan Display', serif", fontSize: 16, letterSpacing: 2,
            transform: stamped ? 'rotate(-10deg) scale(1)' : 'rotate(-4deg) scale(2.4)', opacity: stamped ? 0.82 : 0, transition: 'transform .28s cubic-bezier(.5,0,.75,0), opacity .2s', mixBlendMode: 'multiply' }}>ЗАКРИТО</span>
        </div>
        <div style={{ borderTop: `3px double ${INK}`, margin: '6px 0 0' }} />

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', margin: '0 -6px', padding: '0 6px 4px' }}>
          {/* the headline of the night, as a big taped note */}
          {lead && (
            <div style={{ position: 'relative', margin: '12px 2px 4px', padding: '9px 10px 8px 10px', display: 'flex', gap: 10, alignItems: 'center', background: T[leadTone].note, borderLeft: `5px solid ${T[leadTone].pen}`, transform: 'rotate(-0.6deg)', boxShadow: '0 1px 1px rgba(40,25,8,0.35), 2px 4px 6px rgba(40,25,8,0.22)' }}>
              <span style={{ position: 'absolute', left: '50%', top: -9, width: 40, height: 13, marginLeft: -20, background: 'rgba(250,244,222,0.62)', boxShadow: '0 0 1px rgba(0,0,0,0.25)', transform: 'rotate(3deg)' }} />
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: T[leadTone].pen, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `inset 0 0 0 2px ${T[leadTone].ink}55` }}><Ic k={lead.icon || 'threat'} size={20} color="#FFF8E8" /></span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: T[leadTone].ink }}>ГОЛОВНЕ ЗА НІЧ</span>
                <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, color: T[leadTone].ink }}>{lead.t}</span>
              </span>
            </div>
          )}

          <Sec title="ШКАЛИ ЗА РІК" tone="neu" right={<span style={{ fontSize: 9.5, color: MUTE }}>▮ зараз · ┃ торік</span>}>
            {METERS.map((m) => <Scale key={m} m={m} v={s[m]} was={b ? b[m] : null} dz={G.dangerZone(s)} label={C.meters[m].name.split(' ')[0].toUpperCase()} />)}
          </Sec>

          <Sec title="ГРОШІ" tone="dirty" />
          <Stickers>
            <Sticker label="ЧИСТІ" tone="clean" seed={1} sub={dClean ? `за рік ${sg(dClean)}` : 'без змін'}>{G.fk(s.clean)}</Sticker>
            <Sticker label="СХОВАНО" tone="hide" seed={3} sub={dHidden ? `за рік ${sg(dHidden)}` : 'без змін'}>{G.fk(hidden)}</Sticker>
            <Sticker label="У ШУХЛЯДІ" tone={s.cash > 0 ? 'risk' : 'neu'} seed={5} sub={s.cash > 0 ? 'під загрозою' : 'порожньо'}>{G.fk(s.cash)}</Sticker>
          </Stickers>

          {groups.map((g) => g.t === 'ГРОШІ' ? <Lines key={g.t} lines={g.lines} /> : (
            <Sec key={g.t} title={g.t} tone={g.tone}><Lines lines={g.lines} /></Sec>
          ))}

          {s.offers.length > 0 && (
            <Sec title="ПРОПОЗИЦІЇ НА РАНОК" tone="clean">
              {s.offers.map((o) => (
                <div key={o.id} style={{ margin: '4px 0', padding: '7px 9px', borderLeft: `4px solid ${o.id === 'flee' ? T.hide.pen : o.id === 'retire' ? T.clean.pen : T.out.pen}`, background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5 }}>{o.t}</b><span style={{ display: 'block', fontSize: 11, fontStyle: 'italic', color: MUTE }}>{o.sub}</span></span>
                  <DeskBtn kind="ink" style={{ minHeight: 34, fontSize: 12, padding: '0 10px' }} onClick={() => run((x) => G.acceptOffer(x, o.id))}>{o.btn}</DeskBtn>
                </div>
              ))}
            </Sec>
          )}
        </div>
      </div>

      <DeskBtn kind="ink" style={{ flexShrink: 0, minHeight: 56, fontSize: 17 }} onClick={next}>
        {dawn ? 'Світає…' : <>Наступний рік: {s.year} →</>}
      </DeskBtn>
      {/* dawn wash over the whole room before the morning paper */}
      <div style={{ position: 'absolute', inset: -12, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(255,214,160,0.9), rgba(255,236,200,0.95))', opacity: dawn ? 1 : 0, transition: 'opacity 1.1s ease-in .35s', zIndex: 10 }} />
    </div>
  );
}
