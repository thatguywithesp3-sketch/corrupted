// The city plan, unfolded on the desk. The map takes most of the screen and can be dragged;
// the owner's blank is clipped to its edge; the moves we can make are listed next to it.
// Tap a pin → the blank shows the owner; pick a move → stamp it. One move per morning.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as G from '../../engine';
import type { ActOption, Biz, BizAct, GameState } from '../../engine';
import { T } from './Ledger';
import { DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const PAPER = '#E6D9B8';
const pinColor = (b: Biz) => (b.status === 'closed' ? '#8C8478' : b.status === 'roof' ? '#3F8A5A' : b.grudge >= 2 ? '#C93A26' : b.pressure ? '#D49A3A' : '#F2E9D0');
const oddsTone = (p: number) => (p >= 0.65 ? T.clean : p >= 0.4 ? T.dirty : T.risk);
const short = (b: Biz) => b.kind.split(' ')[0];

/** the plan itself, drawn as an old engraved city map */
function Plan({ biz, sel, onPick }: { biz: Biz[]; sel: string | null; onPick: (id: string) => void }) {
  const order = [...biz].sort((a, z) => (a.id === sel ? 1 : 0) - (z.id === sel ? 1 : 0) || a.y - z.y);
  return (
    <svg viewBox="0 0 100 70" style={{ display: 'block', height: '100%', width: 'auto', aspectRatio: '100 / 70', minWidth: '100%', flexShrink: 0 }} aria-label="План Порт-Аурума">
      <defs>
        <pattern id="mp-water" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><path d="M0 1 H2" stroke="#6E8AA0" strokeWidth=".25" /></pattern>
        <pattern id="mp-block" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 .8 H1.6" stroke="#8C7E58" strokeWidth=".25" /></pattern>
        <filter id="mp-rough"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="0.6" /></filter>
        <filter id="mp-sh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx=".5" dy=".9" stdDeviation=".5" floodColor="#000" floodOpacity=".55" /></filter>
        <radialGradient id="mp-head" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" /></radialGradient>
        <radialGradient id="mp-stain" cx=".5" cy=".5" r=".5"><stop offset=".78" stopColor="#8A6A30" stopOpacity="0" /><stop offset=".9" stopColor="#8A6A30" stopOpacity=".28" /><stop offset="1" stopColor="#8A6A30" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="100" height="70" fill={PAPER} />
      {/* sea and river mouth */}
      <path d="M62 0 C60 14 66 22 63 34 C60 46 66 58 62 70 L100 70 L100 0 Z" fill="url(#mp-water)" />
      <path d="M62 0 C60 14 66 22 63 34 C60 46 66 58 62 70" stroke="#4A6478" strokeWidth=".5" fill="none" />
      <path d="M0 66 C20 63 40 68 63 64" stroke="#4A6478" strokeWidth="2.2" fill="none" opacity=".35" />
      {/* piers */}
      {[22, 32, 44].map((y) => <rect key={y} x="62" y={y} width="9" height="1.4" fill="#8C7E58" stroke={INK} strokeWidth=".2" />)}
      {/* hill contours */}
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx="15" cy="17" rx={12 - i * 2.6} ry={9 - i * 2} fill="none" stroke="#7A6A48" strokeWidth=".25" />)}
      {/* city blocks */}
      {Object.entries(G.DISTRICTS).map(([k, d]) => (
        <g key={k}>
          <rect x={d.box[0] - 2} y={d.box[1] - 2} width={d.box[2] - d.box[0] + 4} height={d.box[3] - d.box[1] + 4} fill="url(#mp-block)" stroke="#5A4A30" strokeWidth=".3" rx="1" filter="url(#mp-rough)" />
          <text x={(d.box[0] + d.box[2]) / 2} y={d.box[1] - 3} textAnchor="middle" fontFamily="Old Standard TT, serif" fontSize="2.6" letterSpacing=".4" fill="#4A3A22">{d.t.toUpperCase()}</text>
        </g>
      ))}
      {/* main streets */}
      <path d="M26 30 L36 38 L58 40 M30 24 L56 26 M20 48 L36 48 M54 30 L62 28 M50 50 L62 46" stroke="#5A4A30" strokeWidth=".5" fill="none" strokeDasharray="1.4 .6" />
      {/* landmarks */}
      <g fill={INK}><path d="M14 12 l1 -3 l1 3 z" /><circle cx="15" cy="13" r="1.4" fill="#B8913C" stroke={INK} strokeWidth=".2" /><rect x="40" y="18" width="1.6" height="5" /><path d="M39.6 18 l1.2 -2.4 l1.2 2.4 z" /></g>
      <text x="96" y="66" textAnchor="end" fontFamily="Old Standard TT, serif" fontSize="2.4" fontStyle="italic" fill="#3A5468">гавань</text>
      {/* compass */}
      <g transform="translate(92 8)"><circle r="3.4" fill="none" stroke={INK} strokeWidth=".25" /><path d="M0 -3.2 L.8 0 L0 3.2 L-.8 0 Z" fill={INK} /><text y="-4.2" textAnchor="middle" fontSize="2" fontFamily="serif">Пн</text></g>
      {/* an old coffee ring and the folds the sheet came in */}
      <circle cx="30" cy="57" r="5" fill="url(#mp-stain)" />
      {[33.3, 66.6].map((x) => <g key={x}><path d={`M${x} 0 V70`} stroke="#3A2A10" strokeOpacity=".22" strokeWidth=".18" /><path d={`M${x + 0.35} 0 V70`} stroke="#FFF6DC" strokeOpacity=".45" strokeWidth=".3" /></g>)}
      <path d="M0 35 H100" stroke="#3A2A10" strokeOpacity=".22" strokeWidth=".18" /><path d="M0 35.35 H100" stroke="#FFF6DC" strokeOpacity=".45" strokeWidth=".3" />

      {/* businesses: pushpins with a little label each */}
      {order.map((b) => {
        const on = b.id === sel, closed = b.status === 'closed', roof = b.status === 'roof';
        const col = pinColor(b);
        const lw = short(b).length * 1.1 + 1.4;
        return (
          <g key={b.id} transform={`translate(${b.x} ${b.y})`} onClick={() => onPick(b.id)} style={{ cursor: 'pointer' }}>
            <g style={{ transform: on ? 'translateY(-1.2px) scale(1.25)' : 'none', transition: 'transform .2s' }}>
              {on && <circle r="5.2" fill="none" stroke={RED} strokeWidth=".6" strokeDasharray="1.3 .7"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" /></circle>}
              <g filter="url(#mp-sh)">
                <circle r="2.6" fill={col} stroke={INK} strokeWidth=".4" />
                <circle r="2.6" fill="url(#mp-head)" />
              </g>
              {closed && <path d="M-1.7 -1.7 L1.7 1.7 M1.7 -1.7 L-1.7 1.7" stroke={INK} strokeWidth=".6" />}
              {roof && <path d="M-1.8 .5 L0 -1.5 L1.8 .5 M-1.2 .3 V1.7 H1.2 V.3" stroke="#fff" strokeWidth=".5" fill="none" />}
              {!closed && !roof && b.pressure > 0 && <text y="1" textAnchor="middle" fontSize="3" fontWeight="700" fontFamily="serif" fill={INK}>{b.pressure}</text>}
            </g>
            <g transform="translate(0 4.9)">
              <rect x={-lw / 2} y="-1.7" width={lw} height="2.6" rx=".4" fill={on ? '#FFF7DC' : '#F2E9D0'} fillOpacity={on ? 1 : 0.88} stroke={on ? RED : '#5A4A30'} strokeWidth={on ? 0.35 : 0.15} />
              <text textAnchor="middle" y=".25" fontFamily="Old Standard TT, serif" fontSize="1.9" fontWeight={on ? 700 : 400} fill={closed ? '#7A7468' : INK}>{short(b)}</text>
            </g>
            <circle r="6" fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}

const Dots = ({ n, max = 3, c }: { n: number; max?: number; c: string }) => (
  <span style={{ display: 'inline-flex', gap: 3 }}>{Array.from({ length: max }, (_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', border: `1.5px solid ${c}`, background: i < n ? c : 'transparent' }} />)}</span>
);

/** the blank pinned to the map's edge */
const Clip = ({ side }: { side: 'top' | 'left' }) => (
  <span aria-hidden="true" style={{ position: 'absolute', zIndex: 3, ...(side === 'top' ? { top: -9, left: '84%', marginLeft: -26, width: 52, height: 20 } : { left: -9, top: 26, width: 20, height: 52 }), borderRadius: 4, background: 'linear-gradient(180deg,#E2C374,#9A7630 60%,#6E531E)', border: '1.5px solid #4A3812', boxShadow: '0 3px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
    <span style={{ position: 'absolute', inset: 4, borderRadius: 2, border: '1px solid rgba(60,40,10,0.5)', background: 'rgba(0,0,0,0.12)' }} />
  </span>
);

function Blank({ b, wide }: { b: Biz; wide: boolean }) {
  const statusT = b.status === 'closed' ? 'закрито' : b.status === 'roof' ? `під «дахом» · ${G.fk(b.tribute)}/рік` : b.pressure ? `під тиском ${b.pressure}/3` : 'ще не чіпали';
  const stCol = b.status === 'roof' ? T.clean : b.status === 'closed' ? T.neu : b.grudge >= 2 ? T.risk : b.pressure ? T.dirty : T.neu;
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '13px 11px 8px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.4}deg)`, zIndex: 2 }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.4, color: MUTE }}>{G.DISTRICTS[b.district].t.toUpperCase()} · З {b.opened} Р.</span>
          <span style={{ display: 'block', fontSize: 17, fontWeight: 700, lineHeight: 1.1 }}>{G.bizTitle(b)}</span>
          <span style={{ display: 'block', fontSize: 13, fontStyle: 'italic' }}>{b.owner}</span>
        </span>
        <span style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ display: 'block', fontSize: 9, letterSpacing: 1, color: MUTE }}>ОБОРОТ / РІК</span>
          <span style={{ fontFamily: HAND, fontSize: 26, lineHeight: 1, color: T.dirty.ink }}>~{G.fk(b.wealth)}</span>
        </span>
      </div>
      {b.tie && <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700, color: T.risk.ink, background: T.risk.note, padding: '2px 6px', display: 'inline-block' }}>⚠ {b.tie === 'press' ? 'Дружить із газетою' : 'Вхожий до губернатора'} — ризик більший</div>}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 11, marginTop: 5, color: MUTE, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>тиск <Dots n={b.pressure} c={T.dirty.ink} /></span>
        <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>образа <Dots n={b.grudge} c={T.risk.ink} /></span>
        <span style={{ marginLeft: 'auto', padding: '1px 7px', fontWeight: 700, background: stCol.note, color: stCol.ink, border: `1px solid ${stCol.pen}` }}>{statusT}</span>
      </div>
    </div>
  );
}

function ActCard({ o, on, locked, onPick }: { o: ActOption; on: boolean; locked: boolean; onPick: () => void }) {
  const can = o.can && !locked;
  const tone = oddsTone(o.odds);
  const edge = o.act === 'seal' ? T.risk.pen : o.act === 'roof' ? T.clean.pen : T.dirty.pen;
  return (
    <button onClick={() => can && onPick()} disabled={!can}
      style={{ position: 'relative', width: '100%', textAlign: 'left', display: 'block', padding: '5px 9px 5px 11px', cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.55, fontFamily: SERIF, color: INK,
        background: on ? '#FFF8E0' : 'rgba(246,238,218,0.92)', border: `1.5px solid ${on ? INK : 'rgba(31,26,20,0.35)'}`, borderLeft: `7px solid ${edge}`, boxShadow: on ? '0 6px 12px rgba(0,0,0,0.5), 0 0 0 2px #B8913C' : '0 3px 6px rgba(0,0,0,0.35)', transform: on ? 'translateY(-2px)' : 'none', transition: 'transform .15s, box-shadow .15s' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <b style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.1 }}>{o.t}</b>
        {can && <>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, padding: '0 6px', background: tone.note, color: tone.ink, border: `1px solid ${tone.pen}` }} title="шанс успіху">
            <span style={{ fontFamily: HAND, fontSize: 19, lineHeight: 1.05 }}>{Math.round(o.odds * 100)}%</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: T.risk.ink }}><Ic k="threat" size={13} color={T.risk.ink} />+{o.risk}</span>
        </>}
      </span>
      {!o.can && o.why ? <span style={{ display: 'block', fontSize: 11.5, color: MUTE, marginTop: 2 }}>{o.why}</span>
        : can && <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2, fontSize: 12 }}>
          <b style={{ color: T.dirty.ink }}>{o.act === 'seal' ? 'або ' : 'до '}{G.fmt(o.gain)} кр.{o.perYear ? ' / рік' : ''}</b>
          {!on && <span style={{ color: MUTE, fontSize: 11 }}>шанс · ризик</span>}
        </span>}
      {on && can && <span style={{ display: 'block', fontSize: 11, lineHeight: 1.25, color: MUTE, marginTop: 2 }}>{o.sub}</span>}
    </button>
  );
}

function Result({ res }: { res: NonNullable<GameState['city']>['last'] }) {
  if (!res) return null;
  return (
    <div style={{ position: 'relative', padding: '10px 12px', background: res.ok ? T.clean.note : T.risk.note, borderLeft: `7px solid ${res.ok ? T.clean.pen : T.risk.pen}`, transform: 'rotate(-0.5deg)', boxShadow: '2px 5px 9px rgba(0,0,0,0.45)' }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: -7, left: '42%', width: 50, height: 15, background: 'rgba(235,225,190,0.7)', transform: 'rotate(-3deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
      <div style={{ fontSize: 10, letterSpacing: 1.6, fontWeight: 700, color: res.ok ? T.clean.ink : T.risk.ink }}>{res.ok ? 'ВДАЛОСЯ' : 'НЕ ВДАЛОСЯ'}</div>
      <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.15, color: res.ok ? T.clean.ink : T.risk.ink }}>{res.title}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.3, marginTop: 2 }}>{res.text}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, fontSize: 12, fontWeight: 700 }}>
        {res.cash > 0 && <span style={{ padding: '1px 7px', background: T.dirty.note, color: T.dirty.ink, border: `1px solid ${T.dirty.pen}` }}>+{G.fmt(res.cash)} брудними</span>}
        {res.d.i ? <span style={{ padding: '1px 7px', background: T.risk.note, color: T.risk.ink, border: `1px solid ${T.risk.pen}` }}>ризик +{res.d.i}</span> : null}
        {res.d.n ? <span style={{ padding: '1px 7px', background: T.risk.note, color: T.risk.ink, border: `1px solid ${T.risk.pen}` }}>народ {res.d.n}</span> : null}
        {res.d.p ? <span style={{ padding: '1px 7px', background: T.risk.note, color: T.risk.ink, border: `1px solid ${T.risk.pen}` }}>покровитель {res.d.p}</span> : null}
        {res.d.s ? <span style={{ padding: '1px 7px', background: T.clean.note, color: T.clean.ink, border: `1px solid ${T.clean.pen}` }}>система +{res.d.s}</span> : null}
      </div>
    </div>
  );
}

export function CityMap({ s, run, focus, onClose }: { s: GameState; run: Run; focus: string | null; onClose: () => void }) {
  const c = s.city!;
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [sel, setSel] = useState<string | null>(focus || c.biz.find((b) => b.status !== 'closed')?.id || null);
  const [pick, setPick] = useState<BizAct | null>(null);
  const b = c.biz.find((x) => x.id === sel) || null;
  const acts = b && b.status === 'open' ? G.bizActs(s, b) : [];
  const cur = acts.find((o) => o.act === pick && o.can) || acts.find((o) => o.can) || null;

  useLayoutEffect(() => {
    const el = root.current; if (!el) return;
    const f = () => setWide(el.clientWidth >= 640);
    f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect();
  }, []);
  // the sheet is wider than the screen: slide the selected pin to the middle
  useEffect(() => {
    const sc = sheet.current; if (!sc || !b) return;
    const w = sc.scrollWidth;
    sc.scrollTo({ left: (b.x / 100) * w - sc.clientWidth / 2, behavior: 'smooth' });
  }, [sel, wide]);
  useEffect(() => setPick(null), [sel]);

  const stamp = () => cur && b && run((x) => G.actOnBiz(x, b.id, cur.act));
  const lead = c.acted && c.last;
  const legend: [string, string][] = [['#F2E9D0', 'не чіпали'], ['#D49A3A', 'під тиском'], ['#3F8A5A', '«дах»'], ['#C93A26', 'образа'], ['#8C8478', 'закрито']];

  const mapSheet = (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={sheet} className="tx-paper" style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden', background: PAPER, border: '1px solid #5A4A30', boxShadow: '0 16px 30px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.5)', scrollbarWidth: 'none', display: 'flex' }}>
        <Plan biz={c.biz} sel={sel} onPick={setSel} />
      </div>
      {/* edge shading and a curled corner, so it lies on the table rather than hangs */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 36px rgba(90,60,20,0.45)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, background: 'linear-gradient(135deg, rgba(0,0,0,0) 48%, #CDBE98 50%, #F1E6C8 100%)', boxShadow: '-3px -3px 6px rgba(0,0,0,0.3)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 8, bottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap', padding: '2px 7px', background: 'rgba(242,233,208,0.9)', border: '1px solid #5A4A30', fontSize: 9.5, color: MUTE, pointerEvents: 'none' }}>
        {legend.map(([col, t]) => <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: col, border: `1px solid ${INK}` }} />{t}</span>)}
      </div>
    </div>
  );

  const actions = lead
    ? <Result res={c.last!} />
    : b && b.status === 'open'
      ? <div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: wide ? 12 : 6 }}>
          {acts.map((o) => <div key={o.act} style={{ flex: 1, minWidth: 0 }}><ActCard o={o} on={cur?.act === o.act} locked={c.acted} onPick={() => setPick(o.act)} /></div>)}
        </div>
      : b ? <div style={{ fontSize: 13, fontStyle: 'italic', color: '#E9E1C2', padding: '4px 2px' }}>{b.status === 'roof' ? 'Платить щороку. Поки платить — не чіпаємо.' : 'Заклад закрито. Тут уже нічого не взяти.'}</div> : null;

  const bottom = (
    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
      <DeskBtn style={{ flex: 1 }} onClick={onClose}>{c.acted ? 'Згорнути план' : 'Згорнути'}</DeskBtn>
      {!c.acted && <DeskBtn kind="brass" style={{ flex: 2, flexDirection: 'column', gap: 0, lineHeight: 1.1 }} disabled={!cur} onClick={stamp}>
        {cur ? <><span style={{ fontSize: 10, letterSpacing: 1.6, opacity: 0.75 }}>ПРОШТАМПУВАТИ</span><span>{cur.t}</span></> : 'Оберіть заклад і дію'}
      </DeskBtn>}
    </div>
  );

  return (
    <div ref={root} className="tx-wood" style={{ position: 'absolute', inset: 0, zIndex: 70, background: '#1A120A', display: 'flex', flexDirection: 'column', padding: '8px 10px 10px', gap: 8, fontFamily: SERIF, color: INK }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexShrink: 0, color: '#F1E6C8' }}>
        <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 18 }}>План Порт-Аурума</span>
        <span style={{ fontSize: 10.5, letterSpacing: 1.4, fontWeight: 700, padding: '2px 8px', background: c.acted ? T.risk.note : T.clean.note, color: c.acted ? T.risk.ink : T.clean.ink }}>{c.acted ? 'ХІД ЗРОБЛЕНО' : 'ОДИН ХІД НА РАНОК'}</span>
      </div>

      {wide ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16 }}>
          {mapSheet}
          <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingLeft: 12, paddingTop: 6 }}>
            {b && <Blank b={b} wide />}
            {actions}
          </div>
        </div>
      ) : (
        <>
          {mapSheet}
          <div style={{ flexShrink: 0, maxHeight: '46%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginTop: -26, padding: '14px 6px 2px', position: 'relative' }}>
            {b && <Blank b={b} wide={false} />}
            {actions}
          </div>
        </>
      )}
      {bottom}
    </div>
  );
}
