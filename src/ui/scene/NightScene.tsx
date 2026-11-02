// Night: the year is closed. The office window shows Port-Aurum asleep; on the desk below it lies
// the year's report from the copy-book, stamped CLOSED. "Next year" brings the dawn into the window.
import { useEffect, useState, type ReactNode } from 'react';
import * as G from '../../engine';
import type { GameState, Meter } from '../../engine';
import { City, type Phase } from './City';
import { BLUE, DeskBtn, GREEN, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const FILE: Record<Phase, string> = { night: 'night', dawn: 'morning', dusk: 'evening', day: 'morning' };
/** Generated view of Port-Aurum for the era and time of day (public/art/city/eN-night|morning|evening.jpg).
 *  Night and morning are both mounted so dawn cross-fades in the window; a missing file falls back to the drawn city. */
function CityView({ era, phase, lightsOut }: { era: number; phase: Phase; lightsOut?: boolean }) {
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const want = FILE[phase], src = (n: string) => `art/city/e${era}-${n}.jpg`;
  if (bad[want]) return <City phase={phase} width="100%" height="100%" lightsOut={lightsOut} />;
  return (
    <>
      {Array.from(new Set(['night', 'morning', want])).map((n) => (
        <img key={n} src={src(n)} alt="" onError={() => setBad((b) => ({ ...b, [n]: true }))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 55%', opacity: n === want ? 1 : 0, transition: 'opacity 1.4s ease', filter: 'sepia(0.1) contrast(1.03)' }} />
      ))}
    </>
  );
}

/** the office window: dark wood frame, four panes, velvet curtains, dust on the glass */
export function OfficeWindow({ era = 1, phase, height, lightsOut, children }: { era?: number; phase: Phase; height: number; lightsOut?: boolean; children?: ReactNode }) {
  const wood = 'linear-gradient(180deg, #4A2C18, #2E1A0D)';
  return (
    <div style={{ position: 'relative', height, flexShrink: 0, margin: '0 6px' }}>
      {/* deep reveal in the wall */}
      <div style={{ position: 'absolute', inset: 0, background: '#1A0F08', boxShadow: 'inset 0 0 0 8px #24150B, inset 0 6px 18px rgba(0,0,0,0.8)' }} />
      <div style={{ position: 'absolute', left: 12, right: 12, top: 10, bottom: 14, overflow: 'hidden', boxShadow: 'inset 0 0 18px rgba(0,0,0,0.7)' }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'opacity 1.2s' }}><CityView era={era} phase={phase} lightsOut={lightsOut} /></div>
        {/* glass: reflection streak, dust, the lamp reflected */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.07) 38%, transparent 46%), radial-gradient(circle at 20% 85%, rgba(255,200,120,0.12), transparent 30%)', pointerEvents: 'none' }} />
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35, mixBlendMode: 'screen' }} aria-hidden="true">
          <filter id="win-dust"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" /><feColorMatrix values="0 0 0 0 0.8  0 0 0 0 0.78  0 0 0 0 0.7  0 0 0 18 -15.5" /></filter>
          <rect width="100%" height="100%" filter="url(#win-dust)" />
        </svg>
        {/* muntins */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 9, marginLeft: -4.5, background: wood, boxShadow: '2px 0 3px rgba(0,0,0,0.6), inset 1px 0 0 rgba(255,210,150,0.15)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '44%', height: 8, background: wood, boxShadow: '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,210,150,0.15)' }} />
        {children}
      </div>
      {/* frame + sill */}
      <div style={{ position: 'absolute', left: 6, right: 6, top: 4, bottom: 8, border: '7px solid #3A2213', boxShadow: 'inset 0 0 0 1px rgba(255,210,150,0.12), 0 0 0 1px #120A04', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: -4, right: -4, bottom: -2, height: 14, background: 'linear-gradient(180deg, #6A4024, #3A2213)', boxShadow: '0 5px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,170,0.3)', borderRadius: 2 }} />
      {/* curtains */}
      {(['left', 'right'] as const).map((side) => (
        <div key={side} style={{ position: 'absolute', [side]: -8, top: -6, bottom: 4, width: 40, background: 'repeating-linear-gradient(90deg, #4A0F12 0 6px, #6E1A1C 6px 11px, #3A0A0C 11px 14px)', boxShadow: '0 6px 10px rgba(0,0,0,0.6)', borderRadius: side === 'left' ? '0 0 18px 0' : '0 0 0 18px', clipPath: side === 'left' ? 'polygon(0 0, 100% 0, 70% 60%, 85% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 15% 100%, 30% 60%)' }} />
      ))}
    </div>
  );
}

const METERS: Meter[] = ['patron', 'people', 'system', 'threat'];
const TONE = { ok: GREEN, warn: '#9A6A10', bad: RED, neu: MUTE } as const;

export function NightScene({ s, run, before }: { s: GameState; run: Run; before: GameState | null }) {
  const C = G.getEra(s.era);
  const [dawn, setDawn] = useState(false);
  const [stamped, setStamped] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStamped(true), 350); return () => clearTimeout(t); }, []);
  const closedYear = s.year - 1;
  const lead = s.report.find((r) => r.strong) || s.report[0];
  const rest = s.report.filter((r) => r !== lead);
  const b = before;
  const d = (now: number, was: number | undefined) => (was === undefined ? 0 : Math.round(now - was));
  const hidden = s.floor + s.wh, hiddenWas = b ? b.floor + b.wh : undefined;
  const next = () => { if (dawn) return; setDawn(true); setTimeout(() => run(G.sleep), 1500); };

  const Tile = ({ m }: { m: Meter }) => {
    const v = Math.round(s[m]), dv = d(s[m], b?.[m]);
    const good = m === 'threat' ? dv < 0 : Math.abs(v - 50) <= Math.abs(v - dv - 50);
    const dz = G.dangerZone(s), danger = m === 'threat' ? v >= 60 : v <= dz || v >= 100 - dz;
    return (
      <div style={{ flex: 1, minWidth: 0, padding: '5px 2px 4px', textAlign: 'center', border: `1px solid ${danger ? RED : 'rgba(31,26,20,0.3)'}`, background: danger ? 'rgba(142,42,31,0.08)' : 'rgba(255,255,255,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Ic k={m} size={16} color={danger ? RED : MUTE} /></div>
        <div style={{ fontSize: 8.5, letterSpacing: 0.6, color: MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{C.meters[m].name.split(' ')[0].toUpperCase()}</div>
        <div style={{ fontFamily: HAND, fontSize: 24, lineHeight: 1, color: danger ? RED : INK }}>{v}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: dv === 0 ? MUTE : good ? GREEN : RED }}>{dv === 0 ? '—' : (dv > 0 ? '▲ +' : '▼ −') + Math.abs(dv)}</div>
      </div>
    );
  };
  const Money = ({ label, v, dv, color }: { label: string; v: number; dv?: number; color: string }) => (
    <div style={{ flex: 1, minWidth: 0, padding: '4px 6px', borderBottom: `1px solid ${INK}` }}>
      <div style={{ fontSize: 9, letterSpacing: 1, color: MUTE }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: HAND, fontSize: 21, color, lineHeight: 1.1 }}>{G.fk(v)}</span>
        {dv !== undefined && dv !== 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: dv > 0 ? GREEN : RED }}>{dv > 0 ? '+' : '−'}{G.fk(Math.abs(dv))}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', zIndex: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 8, fontFamily: SERIF, color: INK }}>
      <OfficeWindow era={s.era} phase={dawn ? 'dawn' : 'night'} height={186} lightsOut={dawn}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 0 7px', background: 'linear-gradient(180deg, transparent, rgba(8,10,20,0.75))', textAlign: 'center', fontFamily: "'Ruslan Display', serif", fontSize: 13, letterSpacing: 3, color: 'rgba(242,223,168,0.75)', textShadow: '0 1px 3px #000', transition: 'opacity 1s', opacity: dawn ? 0 : 1 }}>ПОРТ-АУРУМ СПИТЬ</div>
      </OfficeWindow>

      {/* the report sheet on the desk in front of the window */}
      <div className="tx-paper" style={{ position: 'relative', flex: 1, minHeight: 0, margin: '-4px 4px 10px', padding: '12px 14px 10px', background: '#F1E8CF', transform: 'rotate(0.6deg)', boxShadow: '0 14px 24px rgba(0,0,0,0.6), inset 0 0 30px rgba(150,110,50,0.22)', display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, letterSpacing: 2, color: MUTE }}><span>КОПІЮВАЛЬНА КНИГА</span><span>ЗВІТ ЗА РІК</span></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 30, lineHeight: 1 }}>РІК {closedYear}</span>
          <span style={{ fontSize: 12, fontStyle: 'italic', color: MUTE, lineHeight: 1.2 }}>{s.served}-й рік<br />на службі</span>
          <span aria-hidden="true" style={{ position: 'absolute', right: 2, top: 4, padding: '4px 10px', border: `3px double ${RED}`, color: RED, fontFamily: "'Ruslan Display', serif", fontSize: 18, letterSpacing: 2,
            transform: stamped ? 'rotate(-10deg) scale(1)' : 'rotate(-4deg) scale(2.4)', opacity: stamped ? 0.82 : 0, transition: 'transform .28s cubic-bezier(.5,0,.75,0), opacity .2s', mixBlendMode: 'multiply' }}>ЗАКРИТО</span>
        </div>
        <div style={{ borderTop: `3px double ${INK}` }} />
        {lead && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '7px 9px', background: lead.tone === 'bad' ? 'rgba(142,42,31,0.1)' : lead.tone === 'ok' ? 'rgba(47,106,69,0.09)' : 'rgba(35,53,106,0.06)', borderLeft: `4px solid ${TONE[lead.tone]}` }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', border: `2px solid ${TONE[lead.tone]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic k={lead.icon || 'threat'} size={20} color={TONE[lead.tone]} /></span>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{lead.t}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>{METERS.map((m) => <Tile key={m} m={m} />)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Money label="ЧИСТІ" v={s.clean} dv={d(s.clean, b?.clean)} color={GREEN} />
          <Money label="СХОВАНО" v={hidden} dv={hiddenWas === undefined ? undefined : hidden - hiddenWas} color={BLUE} />
          <Money label="У ШУХЛЯДІ" v={s.cash} color={s.cash > 0 ? RED : MUTE} />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rest.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.3, fontWeight: r.strong ? 700 : 400, color: r.tone === 'bad' ? RED : INK }}>
              <span style={{ marginTop: 1 }}><Ic k={r.icon || 'threat'} size={14} color={TONE[r.tone]} /></span><span>{r.t}</span>
            </div>
          ))}
          {s.offers.map((o) => (
            <div key={o.id} style={{ marginTop: 4, padding: '7px 9px', border: `2px solid ${o.id === 'flee' ? BLUE : o.id === 'retire' ? GREEN : RED}`, background: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 14 }}>{o.t}</b><span style={{ display: 'block', fontSize: 11.5, fontStyle: 'italic', color: MUTE }}>{o.sub}</span></span>
              <DeskBtn kind="ink" style={{ minHeight: 36, fontSize: 12.5, padding: '0 10px' }} onClick={() => run((x) => G.acceptOffer(x, o.id))}>{o.btn}</DeskBtn>
            </div>
          ))}
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
