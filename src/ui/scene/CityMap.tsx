// The city plan, unfolded on the desk. The map takes most of the screen and can be dragged;
// the owner's blank is clipped to its edge; the moves we can make are listed next to it.
// Tap a pin → the blank shows the owner; pick a move → stamp it. One move per morning.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import * as G from '../../engine';
import type { ActOption, Biz, BizAct, GameState, Rival, RivalAct } from '../../engine';
import { T } from './Ledger';
import { BizGlyph, BizIcon } from './BizIcon';
import { PlanArt } from './PlanArt';
import { DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const PAPER = '#E6D9B8';
const pinColor = (b: Biz) => (b.rival && b.status === 'open' ? '#F2E9D0' : b.status === 'closed' ? '#8C8478' : b.status === 'roof' ? '#3F8A5A' : b.grudge >= 2 ? '#C93A26' : b.pressure ? '#D49A3A' : '#F2E9D0');
const oddsTone = (p: number) => (p >= 0.65 ? T.clean : p >= 0.4 ? T.dirty : T.risk);
const short = (b: Biz) => b.kind.split(' ')[0];

/** the plan: the generated engraving underneath, the pins on top */
function Plan({ biz, sel, onPick, zoom, rivals }: { biz: Biz[]; sel: string | null; onPick: (id: string) => void; zoom: number; rivals: Rival[] }) {
  const colOf = (id?: string | null) => rivals.find((r) => r.id === id)?.color;
  const ctl = G.control({ biz, rivals } as never);
  const order = [...biz].sort((a, z) => (a.id === sel ? 1 : 0) - (z.id === sel ? 1 : 0) || a.y - z.y);
  return (
    <svg viewBox="-4 -4 208 148" style={{ display: 'block', width: 1040 * zoom, height: 740 * zoom, flexShrink: 0 }} aria-label="План Порт-Аурума">
      <defs>
        <filter id="mp-sh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx=".5" dy=".9" stdDeviation=".5" floodColor="#000" floodOpacity=".55" /></filter>
        <radialGradient id="mp-head" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" /></radialGradient>
      </defs>
      <PlanArt />
      {/* who holds each district: one dot per shop under us (green), under a rival (his colour), or free */}
      {(Object.keys(G.DISTRICTS) as G.District[]).map((k) => {
        const d = ctl[k], dots = [...Array(d.me).fill('#3F8A5A'), ...rivals.flatMap((r) => Array(d.rivals[r.id]).fill(r.color)), ...Array(d.free).fill('')];
        const [lx, ly] = G.DISTRICTS[k].label;
        return <g key={k} transform={`translate(${lx - (dots.length * 2.6) / 2 + 1.3} ${ly + 2.6})`}>{dots.map((col, i) => <circle key={i} cx={i * 2.6} r="1" fill={col || '#F2E9D0'} stroke={INK} strokeWidth=".25" />)}</g>;
      })}
      {/* businesses: pushpins with a little label each */}
      {order.map((b) => {
        const on = b.id === sel, closed = b.status === 'closed', roof = b.status === 'roof';
        const col = pinColor(b), rc = colOf(b.rival);
        const lw = short(b).length * 1.45 + 1.8;
        return (
          <g key={b.id} transform={`translate(${b.x} ${b.y})`} onClick={() => onPick(b.id)} style={{ cursor: 'pointer' }}>
            <g style={{ transform: on ? 'translateY(-1.2px) scale(1.25)' : 'none', transition: 'transform .2s' }}>
              {on && <circle r="5.2" fill="none" stroke={RED} strokeWidth=".6" strokeDasharray="1.3 .7"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" /></circle>}
              {rc && b.status === 'open' && <circle r="3.9" fill="none" stroke={rc} strokeWidth="1.1" />}
              <g filter="url(#mp-sh)">
                <circle r="3" fill={col} stroke={INK} strokeWidth=".4" />
                <circle r="3" fill="url(#mp-head)" />
              </g>
              <circle r="2.35" fill="#FBF4DC" fillOpacity=".92" />
              <BizGlyph kind={b.kind} x={-1.8} y={-1.8} size={3.6} color={closed ? '#7A7468' : INK} sw={1.9} />
              {closed && <path d="M-2 -2 L2 2 M2 -2 L-2 2" stroke="#8E1F12" strokeWidth=".6" />}
              {roof && <g transform="translate(2.1 2.1)"><circle r="1.45" fill="#3F8A5A" stroke={INK} strokeWidth=".25" /><path d="M-.8 .15 L0 -.7 L.8 .15 M-.55 0 V.8 H.55 V0" stroke="#fff" strokeWidth=".3" fill="none" /></g>}
              {!closed && !roof && b.pressure > 0 && <g transform="translate(2.2 -2.2)"><circle r="1.55" fill="#D49A3A" stroke={INK} strokeWidth=".3" /><text y=".6" textAnchor="middle" fontSize="2" fontWeight="700" fontFamily="serif" fill={INK}>{b.pressure}</text></g>}
              {!closed && b.grudge > 0 && <g transform="translate(-2.2 -2.2)"><circle r="1.55" fill="#C93A26" stroke={INK} strokeWidth=".3" /><text y=".6" textAnchor="middle" fontSize="2" fontWeight="700" fontFamily="serif" fill="#fff">{b.grudge}</text></g>}
            </g>
            <g transform="translate(0 5.6)">
              <rect x={-lw / 2} y="-1.9" width={lw} height="2.9" rx=".4" fill={on ? '#FFF7DC' : '#F2E9D0'} fillOpacity={on ? 1 : 0.9} stroke={on ? RED : '#5A4A30'} strokeWidth={on ? 0.35 : 0.15} />
              <text textAnchor="middle" y=".3" fontFamily="Old Standard TT, serif" fontSize="2.2" fontWeight={on ? 700 : 400} fill={closed ? '#7A7468' : INK}>{short(b)}</text>
            </g>
            <circle r="6" fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}

/** a big meter: label, three chunky lamps, n/3 */
const Meter = ({ label, n, tone, icon }: { label: string; n: number; tone: (typeof T)[keyof typeof T]; icon: 'eye' | 'fist' }) => (
  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: n ? tone.note : 'rgba(31,26,20,0.06)', border: `1.5px solid ${n ? tone.pen : 'rgba(31,26,20,0.3)'}` }}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={n ? tone.ink : MUTE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icon === 'eye' ? <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 100-5z" /> : <path d="M12 3v10 M7 9l5 5 5-5 M5 20h14" />}
    </svg>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 9.5, letterSpacing: 1.3, fontWeight: 700, color: n ? tone.ink : MUTE }}>{label}</span>
      <span style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${n ? tone.ink : MUTE}`, background: i < n ? `radial-gradient(circle at 35% 30%, ${tone.pen}, ${tone.ink})` : 'transparent', boxShadow: i < n ? '0 1px 2px rgba(0,0,0,0.5)' : 'inset 0 1px 2px rgba(0,0,0,0.25)' }} />)}
      </span>
    </span>
    <span style={{ fontFamily: HAND, fontSize: 24, lineHeight: 1, color: n ? tone.ink : MUTE }}>{n}<span style={{ fontSize: 14 }}>/3</span></span>
  </span>
);

/** the blank pinned to the map's edge */
const Clip = ({ side }: { side: 'top' | 'left' }) => (
  <span aria-hidden="true" style={{ position: 'absolute', zIndex: 3, ...(side === 'top' ? { top: -9, left: '84%', marginLeft: -26, width: 52, height: 20 } : { left: -9, top: 26, width: 20, height: 52 }), borderRadius: 4, background: 'linear-gradient(180deg,#E2C374,#9A7630 60%,#6E531E)', border: '1.5px solid #4A3812', boxShadow: '0 3px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
    <span style={{ position: 'absolute', inset: 4, borderRadius: 2, border: '1px solid rgba(60,40,10,0.5)', background: 'rgba(0,0,0,0.12)' }} />
  </span>
);

function Blank({ b, wide, rv }: { b: Biz; wide: boolean; rv: Rival | null }) {
  const statusT = b.status === 'closed' ? 'закрито' : b.status === 'roof' ? `під «дахом» · ${G.fk(b.tribute)}/рік` : b.pressure ? `під тиском ${b.pressure}/3` : 'ще не чіпали';
  const stCol = b.status === 'roof' ? T.clean : b.status === 'closed' ? T.neu : b.grudge >= 2 ? T.risk : b.pressure ? T.dirty : T.neu;
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '20px 11px 8px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.4}deg)`, zIndex: 2 }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <span style={{ width: 46, height: 46, flexShrink: 0, borderRadius: '50%', border: `2px solid ${INK}`, outline: `1px solid ${INK}`, outlineOffset: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,154,58,0.18)', transform: 'rotate(-6deg)', marginTop: 2 }}><BizIcon kind={b.kind} size={30} sw={1.6} /></span>
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
      {rv && b.status === 'open' && <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700, color: '#fff', background: rv.color, padding: '2px 7px', display: 'inline-block' }}>під рукою: {rv.name}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
        <Meter label="ТИСК" n={b.pressure} tone={T.dirty} icon="fist" />
        <Meter label="ОБРАЗА" n={b.grudge} tone={T.risk} icon="eye" />
      </div>
      <div style={{ marginTop: 6, textAlign: 'right' }}><span style={{ padding: '1px 8px', fontSize: 11.5, fontWeight: 700, background: stCol.note, color: stCol.ink, border: `1px solid ${stCol.pen}` }}>{statusT}</span></div>
    </div>
  );
}

function ActCard({ o, on, locked, onPick }: { o: ActOption; on: boolean; locked: boolean; onPick: () => void }) {
  const can = o.can && !locked;
  const tone = oddsTone(o.odds);
  const edge = o.act === 'seal' || o.act === 'expose' ? T.risk.pen : o.act === 'roof' || o.act === 'outbid' || o.act === 'marry' ? T.clean.pen : o.act === 'bribe' ? T.hide.pen : T.dirty.pen;
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
          <b style={{ color: o.gainT ? T.clean.ink : T.dirty.ink }}>{o.gainT ? o.gainT : <>{o.act === 'seal' ? 'або ' : 'до '}{G.fmt(o.gain)} кр.{o.perYear ? ' / рік' : ''}</>}</b>
          {o.cost ? <b style={{ color: T.risk.ink }}>· платите {G.fmt(o.cost)} кр.</b> : null}
          {!on && <span style={{ color: MUTE, fontSize: 11 }}>шанс · ризик</span>}
        </span>}
      {on && can && <span style={{ display: 'block', fontSize: 11, lineHeight: 1.25, color: MUTE, marginTop: 2 }}>{o.sub}</span>}
    </button>
  );
}

const STYLE_T: Record<string, string> = { expander: 'Скуповує заклади й перебиває чужі дахи', smear: 'Брудна преса: б’є по народу й по ризику', informer: 'Доноси губернатору: б’є по покровителю' };

function RivalCard({ r, c, wide }: { r: Rival; c: NonNullable<GameState['city']>; wide: boolean }) {
  const held = G.holdings(c, r.id), lamps = Math.min(3, Math.round(r.heat / 3.3));
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '18px 11px 9px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.4}deg)`, zIndex: 2, borderTop: `6px solid ${r.color}` }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <span style={{ width: 46, height: 46, flexShrink: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${r.color}, #1F1A14 160%)`, border: `2px solid ${INK}`, boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Ruslan Display', serif", fontSize: 26, color: '#F6EEDA', transform: 'rotate(-6deg)', marginTop: 2 }}>{r.name.split(' ').slice(-1)[0][0]}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.4, color: MUTE }}>{r.ally ? 'СОЮЗНИК' : 'СУПЕРНИК'} · {r.title.toUpperCase()}</span>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{r.name}</span>
          <span style={{ display: 'block', fontSize: 11.5, fontStyle: 'italic', color: MUTE }}>{STYLE_T[r.style]}</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 7 }}>
        <span style={{ flex: 1, padding: '4px 8px', border: `1.5px solid ${r.color}`, background: 'rgba(255,255,255,0.35)' }}>
          <span style={{ display: 'block', fontSize: 9.5, letterSpacing: 1.3, fontWeight: 700, color: MUTE }}>ВПЛИВ У МІСТІ</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span style={{ flex: 1, height: 12, border: `1.5px solid ${INK}`, background: 'rgba(0,0,0,0.08)', position: 'relative' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.power}%`, background: r.color }} /></span>
            <span style={{ fontFamily: HAND, fontSize: 22, lineHeight: 1 }}>{Math.round(r.power)}</span>
          </span>
        </span>
        {r.ally
          ? <span style={{ flex: 1, padding: '4px 8px', background: T.clean.note, border: `1.5px solid ${T.clean.pen}`, color: T.clean.ink, fontWeight: 700, fontSize: 12.5, lineHeight: 1.2 }}>Союзник: щороку знижує ваш ризик</span>
          : <Meter label="ПОЛЮЄ НА ВАС" n={lamps} tone={T.risk} icon="eye" />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 7, fontSize: 11.5 }}>
        <span style={{ fontWeight: 700, color: MUTE }}>ТРИМАЄ {held.length}:</span>
        {held.length === 0 && <i style={{ color: MUTE }}>поки нічого</i>}
        {held.map((b) => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px 1px 3px', border: `1px solid ${r.color}`, background: 'rgba(255,255,255,0.4)' }}><BizIcon kind={b.kind} size={14} />{b.kind.split(' ')[0]}</span>)}
      </div>
      {r.last && <div style={{ marginTop: 6, fontSize: 11.5, color: MUTE }}>Вночі: <b style={{ color: INK }}>{r.last}</b></div>}
    </div>
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
  const rivalFocus = focus && focus.startsWith('r:') ? focus.slice(2) : null;
  const bizFocus = focus && !focus.startsWith('r:') ? focus : null;
  // the plan lies open across the whole screen; the card slides up only once something is touched
  const [panel, setPanel] = useState<null | 'biz' | 'riv'>(rivalFocus ? 'riv' : bizFocus ? 'biz' : null);
  const [sel, setSel] = useState<string | null>(bizFocus || null);
  const [selR, setSelR] = useState<string>(rivalFocus || c.rivals.slice().sort((a, z) => z.heat - a.heat)[0]?.id || '');
  const [pick, setPick] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.05);
  const fitted = useRef(false);
  const b = c.biz.find((x) => x.id === sel) || null;
  const rv = panel === 'riv' ? c.rivals.find((r) => r.id === selR) || null : null;
  const bRival = b ? c.rivals.find((r) => r.id === b.rival) || null : null;
  const acts: ActOption[] = rv ? G.rivalActs(s, rv) : panel === 'biz' && b && b.status === 'open' ? G.bizActs(s, b) : [];
  const cur = acts.find((o) => o.act === pick && o.can) || acts.find((o) => o.can) || null;

  // first open: the whole height of the screen is the map
  useLayoutEffect(() => {
    const el = root.current; if (!el || fitted.current) return;
    fitted.current = true;
    setZoom(Math.max(0.8, Math.min(1.2, +(el.clientHeight / 760).toFixed(2))));
  }, []);
  // keep the touched shop in the visible part of the map (the card takes the lower part)
  useEffect(() => {
    const sc = sheet.current; if (!sc) return;
    const tm = setTimeout(() => {
      const w = sc.scrollWidth, h = sc.scrollHeight;
      const px = b && panel === 'biz' ? b.x : 100, py = b && panel === 'biz' ? b.y : 62;
      sc.scrollTo({ left: ((px + 4) / 208) * w - sc.clientWidth / 2, top: ((py + 4) / 148) * h - sc.clientHeight / 2, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(tm);
  }, [sel, panel, zoom]);
  useEffect(() => setPick(null), [sel, selR, panel]);

  const stamp = () => {
    if (!cur) return;
    if (rv) run((x) => G.actOnRival(x, rv.id, cur.act as RivalAct));
    else if (b) run((x) => G.actOnBiz(x, b.id, cur.act as BizAct));
  };
  const lead = c.acted && c.last;
  const hostile = c.rivals.filter((r) => !r.ally && r.heat >= 5).length;
  const legend: [string, string][] = [['#F2E9D0', 'не чіпали'], ['#D49A3A', 'під тиском'], ['#3F8A5A', '«дах»'], ['#C93A26', 'образа'], ['#8C8478', 'закрито'], ['#2E5E8E', 'чужий дах']];
  const plaque: CSSProperties = { background: 'linear-gradient(180deg, rgba(46,32,18,0.94), rgba(26,18,10,0.94))', border: '1.5px solid #6E531E', boxShadow: '0 4px 10px rgba(0,0,0,0.6)', color: '#F1E6C8' };

  const tabs = (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 4 }}>
      {([['biz', 'ЗАКЛАД'], ['riv', 'СУПЕРНИКИ']] as const).map(([k, l]) => (
        <button key={k} onClick={() => setPanel(k)} style={{ flex: 1, position: 'relative', padding: '6px 4px', fontFamily: SERIF, fontSize: 12, fontWeight: 700, letterSpacing: 1.6, cursor: 'pointer', color: panel === k ? INK : '#E6D9BC', background: panel === k ? 'linear-gradient(180deg,#F6EEDA,#E4D6B0)' : 'rgba(0,0,0,0.35)', border: `1.5px solid ${panel === k ? INK : '#6E531E'}` }}>
          {l}{k === 'riv' && hostile > 0 && <span style={{ position: 'absolute', top: -6, right: 6, minWidth: 16, padding: '0 4px', background: RED, color: '#F6EEDA', fontSize: 10, borderRadius: 8 }}>{hostile}</span>}
        </button>
      ))}
    </div>
  );
  const rivalChips = (
    <div style={{ display: 'flex', gap: 6 }}>
      {c.rivals.map((r) => <button key={r.id} onClick={() => setSelR(r.id)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px', fontFamily: SERIF, fontSize: 11.5, fontWeight: selR === r.id ? 700 : 400, cursor: 'pointer', color: INK, background: selR === r.id ? '#FFF8E0' : 'rgba(246,238,218,0.7)', border: `1.5px solid ${selR === r.id ? INK : 'rgba(31,26,20,0.35)'}`, boxShadow: selR === r.id ? `0 0 0 2px ${r.color}` : 'none' }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: r.color, flexShrink: 0, border: `1px solid ${INK}` }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name.replace('Граф Ґжеґожевський', 'Граф Ґ.')}</span>
      </button>)}
    </div>
  );
  const card = panel === 'riv' ? (rv ? <RivalCard r={rv} c={c} wide={false} /> : null) : b ? <Blank b={b} wide={false} rv={bRival} /> : <div style={{ fontSize: 13, fontStyle: 'italic', color: '#E9E1C2' }}>Торкніться закладу на плані.</div>;
  const actions = lead
    ? <Result res={c.last!} />
    : rv && rv.ally ? <div style={{ fontSize: 13, fontStyle: 'italic', color: '#E9E1C2', padding: '4px 2px' }}>Дім скріплено шлюбом. Він більше не полює на вас.</div>
    : acts.length
      ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{acts.map((o) => <ActCard key={o.act} o={o} on={cur?.act === o.act} locked={c.acted} onPick={() => setPick(o.act)} />)}</div>
      : panel === 'biz' && b ? <div style={{ fontSize: 13, fontStyle: 'italic', color: '#E9E1C2', padding: '4px 2px' }}>{b.status === 'roof' ? 'Платить щороку. Поки платить — не чіпаємо.' : 'Заклад закрито. Тут уже нічого не взяти.'}</div> : null;

  return (
    <div ref={root} className="tx-wood" style={{ position: 'absolute', inset: 0, zIndex: 70, background: '#1A120A', display: 'flex', flexDirection: 'column', fontFamily: SERIF, color: INK }}>
      {/* the whole plan; it shrinks only while a card is open */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0, margin: '6px 6px 0', display: 'flex', flexDirection: 'column' }}>
        <div ref={sheet} className="tx-paper" style={{ flex: 1, minHeight: 0, overflow: 'auto', background: PAPER, border: '1px solid #5A4A30', boxShadow: '0 16px 30px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.5)', scrollbarWidth: 'none' }}>
          <Plan biz={c.biz} sel={panel === 'biz' ? sel : null} onPick={(id) => { setSel(id); setPanel('biz'); }} zoom={zoom} rivals={c.rivals} />
        </div>
        {(['left', 'right', 'top', 'bottom'] as const).map((side) => {
          const h = side === 'left' || side === 'right';
          const dir = { left: '90deg', right: '270deg', top: '180deg', bottom: '0deg' }[side];
          const sz = h ? 22 : 14;
          return (
            <div key={side} aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', [side]: 0, ...(h ? { top: 0, bottom: 0, width: sz } : { left: 0, right: 0, height: sz }),
              background: `repeating-linear-gradient(${dir}, rgba(50,32,8,0.55) 0 1px, rgba(0,0,0,0) 1px 3px) 0 0 / ${h ? '8px 100%' : '100% 8px'} no-repeat, linear-gradient(${dir}, #7A6438 0, #C9B685 14%, #F6EBCB 34%, #D9C79B 58%, rgba(214,196,150,0.5) 80%, rgba(214,196,150,0) 100%)`,
              boxShadow: { left: '7px 0 12px rgba(40,25,5,0.5)', right: '-7px 0 12px rgba(40,25,5,0.5)', top: '0 7px 12px rgba(40,25,5,0.5)', bottom: '0 -7px 12px rgba(40,25,5,0.5)' }[side] }} />
          );
        })}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 36px rgba(90,60,20,0.45)' }} />

        {/* floating furniture: title plaque, close, zoom, legend */}
        <div style={{ position: 'absolute', left: 30, top: 20, right: 76, display: 'flex', alignItems: 'center', gap: 8, ...plaque, padding: '5px 10px', pointerEvents: 'none' }}>
          <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 17, flex: 1, whiteSpace: 'nowrap' }}>План Порт-Аурума</span>
          <span style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 700, padding: '2px 7px', background: c.acted ? T.risk.note : T.clean.note, color: c.acted ? T.risk.ink : T.clean.ink, whiteSpace: 'nowrap' }}>{c.acted ? 'ХІД ЗРОБЛЕНО' : '1 ХІД'}</span>
        </div>
        <button onClick={onClose} aria-label="Згорнути план" style={{ position: 'absolute', right: 30, top: 20, width: 40, height: 40, ...plaque, fontSize: 20, fontWeight: 700, cursor: 'pointer', borderRadius: 4 }}>✕</button>
        <div style={{ position: 'absolute', right: 30, top: 72, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([['+', 0.2], ['−', -0.2]] as const).map(([l, d]) => <button key={l} onClick={() => setZoom((z) => Math.min(2, Math.max(0.36, +(z + d).toFixed(2))))} style={{ width: 40, height: 40, fontSize: 24, fontWeight: 700, fontFamily: SERIF, color: INK, background: 'linear-gradient(180deg,#E2C374,#B8913C 60%,#9A7630)', border: '1.5px solid #4A3812', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>{l}</button>)}
        </div>
        {!panel && <div style={{ position: 'absolute', left: 30, bottom: 22, display: 'flex', gap: 8, flexWrap: 'wrap', padding: '3px 8px', background: 'rgba(242,233,208,0.92)', border: '1px solid #5A4A30', fontSize: 9.5, color: MUTE, pointerEvents: 'none', maxWidth: 'calc(100% - 100px)' }}>
          {legend.map(([col, tx]) => <span key={tx} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: col, border: `1px solid ${INK}` }} />{tx}</span>)}
        </div>}
      </div>

      {panel === null ? (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 10px' }}>
          <DeskBtn kind="ink" style={{ flex: 1.2, position: 'relative', minHeight: 48, fontSize: 13 }} onClick={() => setPanel('riv')}>
            Суперники{hostile > 0 && <span style={{ position: 'absolute', top: -7, right: -4, minWidth: 18, padding: '0 5px', background: RED, color: '#F6EEDA', fontSize: 11, borderRadius: 9 }}>{hostile}</span>}
          </DeskBtn>
          <span style={{ flex: 2, fontSize: 12, fontStyle: 'italic', color: '#E6D9BC', lineHeight: 1.25 }}>{c.acted ? 'Хід зроблено. Наступний — завтра зранку.' : 'Торкніться закладу на плані: з’явиться його картка.'}</span>
        </div>
      ) : (
        <div style={{ flexShrink: 0, maxHeight: '60%', display: 'flex', flexDirection: 'column', margin: '0 6px', padding: '8px 8px 8px', background: 'linear-gradient(180deg, rgba(26,18,10,0.97), rgba(20,13,7,0.99))', border: '1.5px solid #6E531E', borderBottom: 'none', boxShadow: '0 -10px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 2px 4px' }}>
            {tabs}
            {panel === 'riv' && rivalChips}
            {card}
            {actions}
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 8 }}>
            <DeskBtn style={{ flex: 1 }} onClick={() => setPanel(null)}>До карти</DeskBtn>
            {!c.acted && <DeskBtn kind="brass" style={{ flex: 2, flexDirection: 'column', gap: 0, lineHeight: 1.1 }} disabled={!cur} onClick={stamp}>
              {cur ? <><span style={{ fontSize: 10, letterSpacing: 1.6, opacity: 0.75 }}>ПРОШТАМПУВАТИ</span><span>{cur.t}</span></> : 'Оберіть дію'}
            </DeskBtn>}
          </div>
        </div>
      )}
    </div>
  );
}
