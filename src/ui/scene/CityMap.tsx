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
    <svg viewBox="-4 -4 208 228" style={{ display: 'block', width: 1040 * zoom, height: 1140 * zoom, flexShrink: 0 }} aria-label="План Порт-Аурума">
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

/** a titled segment of a card: small caps heading with a rule, the content underneath */
const Seg = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <div style={{ marginTop: 9 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, letterSpacing: 1.7, fontWeight: 700, color: MUTE }}>
      {title}<span style={{ flex: 1, height: 1, background: 'rgba(31,26,20,0.3)' }} />{right}
    </div>
    <div style={{ marginTop: 5 }}>{children}</div>
  </div>
);
/** a big number cell: the thing to look at first */
const Fact = ({ label, children, tone }: { label: string; children: React.ReactNode; tone?: (typeof T)[keyof typeof T] }) => (
  <span style={{ flex: 1, minWidth: 0, padding: '5px 9px', background: tone ? tone.note : 'rgba(255,255,255,0.4)', border: `1.5px solid ${tone ? tone.pen : 'rgba(31,26,20,0.4)'}` }}>
    <span style={{ display: 'block', fontSize: 9.5, letterSpacing: 1.4, fontWeight: 700, color: tone ? tone.ink : MUTE }}>{label}</span>
    <span style={{ display: 'block', marginTop: 2, color: tone ? tone.ink : INK }}>{children}</span>
  </span>
);

function Blank({ b, wide, rv }: { b: Biz; wide: boolean; rv: Rival | null }) {
  const statusT = b.status === 'closed' ? 'Закрито' : b.status === 'roof' ? 'Під вашим «дахом»' : b.grudge >= 2 ? 'Озлоблений' : b.pressure ? 'Під тиском' : 'Не чіпали';
  const stCol = b.status === 'roof' ? T.clean : b.status === 'closed' ? T.neu : b.grudge >= 2 ? T.risk : b.pressure ? T.dirty : T.neu;
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '20px 12px 11px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.3}deg)`, zIndex: 2 }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 58, height: 58, flexShrink: 0, borderRadius: '50%', border: `2px solid ${INK}`, outline: `1px solid ${INK}`, outlineOffset: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,154,58,0.18)', transform: 'rotate(-6deg)' }}><BizIcon kind={b.kind} size={38} sw={1.6} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10.5, letterSpacing: 1.4, color: MUTE }}>{G.DISTRICTS[b.district].t.toUpperCase()} · З {b.opened} Р.</span>
          <span style={{ display: 'block', fontSize: 19, fontWeight: 700, lineHeight: 1.08 }}>{G.bizTitle(b)}</span>
          <span style={{ display: 'block', fontSize: 13.5, fontStyle: 'italic' }}>{b.owner}</span>
        </span>
      </div>
      <Seg title="ГОЛОВНЕ">
        <div style={{ display: 'flex', gap: 8 }}>
          <Fact label="ОБОРОТ НА РІК"><span style={{ fontFamily: HAND, fontSize: 30, lineHeight: 1, color: T.dirty.ink }}>~{G.fk(b.wealth)}</span></Fact>
          <Fact label="СТАН" tone={stCol}><span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.15, display: 'block' }}>{statusT}</span>{b.status === 'roof' && <span style={{ fontSize: 12, fontWeight: 700 }}>{G.fk(b.tribute)} щороку</span>}</Fact>
        </div>
      </Seg>
      {b.status !== 'closed' && <Seg title="ТИСК І ОБРАЗА">
        <div style={{ display: 'flex', gap: 8 }}>
          <Meter label="ТИСК" n={b.pressure} tone={T.dirty} icon="fist" />
          <Meter label="ОБРАЗА" n={b.grudge} tone={T.risk} icon="eye" />
        </div>
      </Seg>}
      {(b.tie || (rv && b.status === 'open')) && <Seg title="ВАРТО ЗНАТИ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {b.tie && <span style={{ fontSize: 12.5, fontWeight: 700, color: T.risk.ink, background: T.risk.note, padding: '3px 8px', border: `1px solid ${T.risk.pen}` }}>⚠ {b.tie === 'press' ? 'Дружить із газетою' : 'Вхожий до губернатора'} — ризик більший</span>}
          {rv && b.status === 'open' && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: rv.color, padding: '3px 8px' }}>Під рукою суперника: {rv.name}</span>}
        </div>
      </Seg>}
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
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '20px 12px 11px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.3}deg)`, zIndex: 2, borderTop: `7px solid ${r.color}` }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        {/* a stand-in until the portrait is painted */}
        <span style={{ width: 64, height: 64, flexShrink: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${r.color}, #1F1A14 160%)`, border: `2px solid ${INK}`, boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Ruslan Display', serif", fontSize: 32, color: '#F6EEDA', transform: 'rotate(-5deg)' }}>{r.name.split(' ').slice(-1)[0][0]}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10.5, letterSpacing: 1.4, color: MUTE }}>{r.ally ? 'СОЮЗНИК' : 'СУПЕРНИК'} · {r.title.toUpperCase()}</span>
          <span style={{ display: 'block', fontSize: 21, fontWeight: 700, lineHeight: 1.08 }}>{r.name}</span>
          <span style={{ display: 'block', fontSize: 12.5, fontStyle: 'italic', color: MUTE, lineHeight: 1.2 }}>{STYLE_T[r.style]}</span>
        </span>
      </div>
      <Seg title="ГОЛОВНЕ">
        <div style={{ display: 'flex', gap: 8 }}>
          <Fact label="ВПЛИВ У МІСТІ">
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ flex: 1, height: 14, border: `1.5px solid ${INK}`, background: 'rgba(0,0,0,0.08)', position: 'relative' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.power}%`, background: r.color }} /></span>
              <span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{Math.round(r.power)}</span>
            </span>
          </Fact>
          {r.ally
            ? <Fact label="СТАВЛЕННЯ" tone={T.clean}><span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2, display: 'block' }}>Союзник: щороку знижує ваш ризик</span></Fact>
            : <Meter label="ПОЛЮЄ НА ВАС" n={lamps} tone={T.risk} icon="eye" />}
        </div>
      </Seg>
      <Seg title={`ТРИМАЄ ЗАКЛАДІВ: ${held.length}`}>
        {held.length === 0 ? <i style={{ fontSize: 13, color: MUTE }}>поки нічого</i> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {held.map((b) => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px 3px 5px', fontSize: 13, border: `1.5px solid ${r.color}`, background: 'rgba(255,255,255,0.45)' }}><BizIcon kind={b.kind} size={20} />{b.kind.split(' ')[0]}</span>)}
          </div>
        )}
      </Seg>
      {r.last && <Seg title="ОСТАННІЙ ХІД"><span style={{ fontSize: 14, fontWeight: 700 }}>{r.last}</span></Seg>}
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

const MiniPin = ({ col, ring, badge, roof }: { col: string; ring?: string; badge?: { n: string; c: string; at: 'tr' | 'tl' }; roof?: boolean }) => (
  <svg viewBox="-7 -7 14 14" width="38" height="38" aria-hidden="true">
    {ring && <circle r="5.2" fill="none" stroke={ring} strokeWidth="1.5" />}
    <circle r="4" fill={col} stroke={INK} strokeWidth=".5" /><circle r="3" fill="#FBF4DC" fillOpacity=".92" />
    <path d="M-1.7 1.6V-.4L0-1.9l1.7 1.5v2zM-.6 1.6V.4h1.2v1.2" fill="none" stroke={INK} strokeWidth=".45" />
    {badge && <g transform={`translate(${badge.at === 'tr' ? 3.6 : -3.6} -3.6)`}><circle r="2.3" fill={badge.c} stroke={INK} strokeWidth=".4" /><text y=".9" textAnchor="middle" fontSize="3" fontWeight="700" fontFamily="serif" fill="#fff">{badge.n}</text></g>}
    {roof && <g transform="translate(3.4 3.4)"><circle r="2.1" fill="#3F8A5A" stroke={INK} strokeWidth=".35" /><path d="M-1.1 .2L0-1 1.1 .2M-.8 0V1.1H.8V0" stroke="#fff" strokeWidth=".4" fill="none" /></g>}
  </svg>
);

/** the map key: opened on request, closed by a tap */
function Legend({ rivals, onClose }: { rivals: Rival[]; onClose: () => void }) {
  const Row = ({ pin, title, text }: { pin: React.ReactNode; title: string; text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 0', borderBottom: '1px solid rgba(31,26,20,0.18)' }}>
      <span style={{ width: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>{pin}</span>
      <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 15 }}>{title}</b><span style={{ display: 'block', fontSize: 12.5, color: MUTE, lineHeight: 1.25 }}>{text}</span></span>
    </div>
  );
  const H = ({ t }: { t: string }) => <div style={{ margin: '10px 0 2px', fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: RED }}>{t}</div>;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(20,12,4,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 14px 14px' }}>
      <div className="tx-paper" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxHeight: '100%', overflowY: 'auto', background: '#F5EDD7', padding: '14px 14px 12px', boxShadow: '0 14px 30px rgba(0,0,0,0.7), inset 0 0 24px rgba(140,110,50,0.25)', border: `1.5px solid ${INK}` }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 22, flex: 1 }}>Умовні знаки</span>
          <button onClick={onClose} aria-label="Закрити" style={{ width: 36, height: 36, fontSize: 18, fontWeight: 700, cursor: 'pointer', background: 'rgba(0,0,0,0.08)', border: `1.5px solid ${INK}`, color: INK }}>✕</button>
        </div>
        <H t="КОЛІР ШПИЛЬКИ — СТАН ЗАКЛАДУ" />
        <Row pin={<MiniPin col="#F2E9D0" />} title="Не чіпали" text="Заклад живе сам по собі. Можна тиснути." />
        <Row pin={<MiniPin col="#D49A3A" />} title="Під тиском" text="Ви вже натискали: перевірка чи залякування." />
        <Row pin={<MiniPin col="#C93A26" />} title="Образа" text="Власник озлоблений: може піти до газети чи губернатора." />
        <Row pin={<MiniPin col="#3F8A5A" roof />} title="Ваш «дах»" text="Платить щороку. Поки платить — не чіпаємо." />
        <Row pin={<MiniPin col="#8C8478" />} title="Закрито" text="Тут уже нічого не взяти." />
        <H t="ЦИФРИ НА ШПИЛЬЦІ" />
        <Row pin={<MiniPin col="#D49A3A" badge={{ n: '2', c: '#D49A3A', at: 'tr' }} />} title="Тиск (праворуч)" text="Скільки разів натискали, максимум 3." />
        <Row pin={<MiniPin col="#C93A26" badge={{ n: '1', c: '#C93A26', at: 'tl' }} />} title="Образа (ліворуч)" text="Накопичена злість, максимум 3. Від двох — небезпечно." />
        <H t="СУПЕРНИКИ І РАЙОНИ" />
        <Row pin={<MiniPin col="#F2E9D0" ring={rivals[0]?.color || '#2E5E8E'} />} title="Кольорове кільце" text="Заклад під рукою суперника. Колір — його колір." />
        <Row pin={<svg viewBox="0 0 34 8" width="38" height="10"><circle cx="5" cy="4" r="3" fill="#3F8A5A" stroke={INK} /><circle cx="17" cy="4" r="3" fill={rivals[1]?.color || '#7A3F8E'} stroke={INK} /><circle cx="29" cy="4" r="3" fill="#F2E9D0" stroke={INK} /></svg>} title="Крапки під назвою району" text="Хто там тримає заклади: ви, суперник або ніхто." />
        <div style={{ marginTop: 10, fontSize: 12.5, fontStyle: 'italic', color: MUTE }}>Один хід на ранок. Торкніться шпильки — з’явиться картка закладу.</div>
      </div>
    </div>
  );
}

const STYLE_N: Record<string, string> = { expander: 'Скуповує заклади й перебиває чужі дахи', smear: 'Б’є пресою — по народу й по ризику', informer: 'Пише доноси губернатору — б’є по покровителю' };
const RULED = 'repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 27px, rgba(70,90,130,0.22) 27px 28px)';

/** «Розклад сил»: the character's working notebook. One index tab per magnate; the page holds his file, his shops and the moves open against him. */
function PowerSheet({ c, selR, onSel, children }: { c: NonNullable<GameState['city']>; selR: string; onSel: (id: string) => void; children: React.ReactNode }) {
  const rv = c.rivals.find((r) => r.id === selR) || c.rivals[0];
  const f = G.RIVAL_FILE[rv.id];
  const held = G.holdings(c, rv.id), lamps = Math.min(3, Math.round(rv.heat / 3.3));
  const surname = (n: string) => n.replace('Пан ', '').replace('Пані ', '').replace('Граф Ґжеґожевський', 'Ґжеґожевський');
  return (
    <div style={{ position: 'relative', color: INK }}>
      {/* index tabs sticking out of the top edge of the pages */}
      <div style={{ display: 'flex', gap: 5, padding: '0 10px', position: 'relative', zIndex: 1, marginBottom: -2 }}>
        {c.rivals.map((r) => {
          const on = r.id === rv.id, hot = !r.ally && r.heat >= 5;
          return (
            <button key={r.id} onClick={() => onSel(r.id)} style={{ flex: 1, minWidth: 0, position: 'relative', padding: `${on ? 10 : 7}px 4px ${on ? 9 : 5}px`, marginTop: on ? 0 : 5, fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: on ? INK : '#F6EEDA', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              background: on ? 'linear-gradient(180deg,#F6EEDA,#EFE3C2)' : r.color, border: `1.5px solid ${INK}`, borderBottom: on ? 'none' : `1.5px solid ${INK}`, borderTop: `5px solid ${r.color}`, borderRadius: '5px 5px 0 0', boxShadow: on ? 'none' : 'inset 0 -6px 8px rgba(0,0,0,0.3)' }}>
              {surname(r.name)}{hot && <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 3, width: 8, height: 8, borderRadius: '50%', background: RED, border: '1px solid #F6EEDA' }} />}
            </button>
          );
        })}
      </div>
      {/* the page: ruled paper, a red margin line, holes on the left */}
      <div className="tx-paper" style={{ position: 'relative', background: `${RULED} 0 14px / 100% 100% repeat-y, linear-gradient(180deg,#F6EEDA,#EDE1BF)`, padding: '14px 12px 12px 34px', border: `1.5px solid ${INK}`, boxShadow: '0 10px 22px rgba(0,0,0,0.6), inset 0 0 26px rgba(140,110,50,0.25)' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 26, top: 0, bottom: 0, width: 1.5, background: 'rgba(190,60,50,0.55)' }} />
        {[18, 110, 202, 294].map((y) => <span key={y} aria-hidden="true" style={{ position: 'absolute', left: 7, top: y, width: 12, height: 12, borderRadius: '50%', background: '#2A1D12', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.4)' }} />)}

        {children}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* the portrait, pinned in photo corners */}
          <span style={{ position: 'relative', width: 100, height: 132, flexShrink: 0, background: `url(art/rivals/${rv.id}.jpg) center top / cover, radial-gradient(circle at 40% 30%, ${rv.color}, #1F1A14 190%)`, border: `2px solid ${INK}`, boxShadow: '2px 5px 10px rgba(0,0,0,0.5)', transform: 'rotate(-2.5deg)' }}>
            {[{ top: -3, left: -3, r: 0 }, { top: -3, right: -3, r: 90 }, { bottom: -3, right: -3, r: 180 }, { bottom: -3, left: -3, r: 270 }].map((s, i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', ...s, width: 15, height: 15, background: '#F1E6C8', border: `1px solid ${INK}`, clipPath: 'polygon(0 0, 100% 0, 0 100%)', transform: `rotate(${s.r}deg)` } as CSSProperties} />)}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.6, color: rv.ally ? T.clean.ink : RED, fontWeight: 700 }}>{rv.ally ? 'РОДИЧ · СОЮЗНИК' : 'СУПЕРНИК'}</span>
            <span style={{ display: 'block', fontFamily: HAND, fontSize: 30, lineHeight: 1.02 }}>{rv.name}</span>
            <span style={{ display: 'block', fontSize: 13.5, fontStyle: 'italic', marginTop: 2 }}>{rv.title}</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
              <span style={{ padding: '2px 8px', fontSize: 14, fontWeight: 700, background: '#FFF8E0', border: `1.5px solid ${INK}` }}>{f.age} років</span>
              <span style={{ padding: '2px 8px', fontSize: 13, fontWeight: 700, background: '#FFF8E0', border: `1.5px solid ${INK}`, lineHeight: 1.25 }}>{f.from[0].toUpperCase() + f.from.slice(1)}</span>
            </span>
          </span>
        </div>

        <Seg title="СТАН СПРАВ">
          <div style={{ display: 'flex', gap: 7 }}>
            <Fact label="ВПЛИВ"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{Math.round(rv.power)}<span style={{ fontSize: 14 }}>/100</span></span></Fact>
            {rv.ally ? <Fact label="СТАВЛЕННЯ" tone={T.clean}><span style={{ fontSize: 14, fontWeight: 700, display: 'block', lineHeight: 1.2 }}>Союзник</span></Fact> : <Meter label="ПОЛЮЄ" n={lamps} tone={T.risk} icon="eye" />}
            <Fact label="ЗАКЛАДІВ"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{held.length}</span></Fact>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: MUTE }}>{STYLE_N[rv.style]}.</div>
          {rv.last && <div style={{ marginTop: 3, fontFamily: HAND, fontSize: 19 }}>Вночі: {rv.last}</div>}
        </Seg>

        <Seg title={`ЗАКЛАДИ ПІД ${rv.f ? 'ЇЇ' : 'ЙОГО'} РУКОЮ: ${held.length}`}>
          {held.length === 0 ? <i style={{ fontSize: 13.5, color: MUTE }}>Поки нічого. {rv.f ? 'Вона' : 'Він'} ще придивляється.</i> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {held.map((b) => (
                <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 4px 5px', border: `1.5px solid ${rv.color}`, background: 'rgba(255,255,255,0.5)' }}>
                  <BizIcon kind={b.kind} size={26} />
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}><b style={{ display: 'block', fontSize: 14 }}>{G.bizTitle(b)}</b><span style={{ fontSize: 11.5, color: MUTE }}>{G.DISTRICTS[b.district].t} · {b.owner}</span></span>
                  <span style={{ fontFamily: HAND, fontSize: 19, color: T.dirty.ink }}>~{G.fk(b.wealth)}</span>
                </span>
              ))}
            </div>
          )}
        </Seg>

        <Seg title={rv.f ? 'ПРО НЕЇ' : 'ПРО НЬОГО'}>
          <div style={{ fontFamily: HAND, fontSize: 19, lineHeight: '28px' }}>{f.bio}</div>
          <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.3 }}><b>Любить:</b> {f.likes}.</div>
          <div style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.3, padding: '4px 8px', background: T.dirty.note, borderLeft: `4px solid ${T.dirty.pen}` }}><b>Слабке місце:</b> {f.weak}.</div>
          <div style={{ marginTop: 6, fontFamily: HAND, fontSize: 18, color: T.risk.ink }}>{f.quote}</div>
        </Seg>
      </div>
    </div>
  );
}

/** one move against a magnate, as a compact tool in the fixed strip under the notebook */
function ToolChip({ o, on, locked, onPick }: { o: ActOption; on: boolean; locked: boolean; onPick: () => void }) {
  const can = o.can && !locked, tone = oddsTone(o.odds);
  const edge = o.act === 'expose' ? T.risk.pen : o.act === 'marry' ? T.clean.pen : T.hide.pen;
  return (
    <button onClick={() => can && onPick()} disabled={!can} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: '6px 7px 6px 9px', textAlign: 'left', cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.55, fontFamily: SERIF, color: INK,
      background: on ? '#FFF8E0' : 'rgba(246,238,218,0.93)', border: `1.5px solid ${on ? INK : 'rgba(31,26,20,0.35)'}`, borderTop: `5px solid ${edge}`, boxShadow: on ? '0 0 0 2px #B8913C, 0 5px 10px rgba(0,0,0,0.5)' : '0 3px 6px rgba(0,0,0,0.4)', transform: on ? 'translateY(-3px)' : 'none', transition: 'transform .15s' }}>
      <b style={{ fontSize: 13, lineHeight: 1.1 }}>{o.t}</b>
      {can ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontFamily: HAND, fontSize: 17, lineHeight: 1.05, padding: '0 5px', background: tone.note, color: tone.ink, border: `1px solid ${tone.pen}` }}>{Math.round(o.odds * 100)}%</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 700, color: T.risk.ink }}><Ic k="threat" size={12} color={T.risk.ink} />+{o.risk}</span>
      </span> : <span style={{ fontSize: 10.5, color: MUTE, lineHeight: 1.15 }}>{o.why}</span>}
    </button>
  );
}

/** the notebook itself, lying on the desk: leather, stitching, brass corners, a ribbon and the index tabs peeking out */
function NotebookBtn({ rivals, hostile, onClick }: { rivals: Rival[]; hostile: number; onClick: () => void }) {
  const corner = (pos: CSSProperties) => <span aria-hidden="true" style={{ position: 'absolute', width: 13, height: 13, background: 'linear-gradient(135deg,#F0D78C,#B8913C 55%,#7A5A1E)', border: '1px solid #4A3812', ...pos }} />;
  return (
    <button onClick={onClick} aria-label="Розклад сил" style={{ position: 'relative', flex: 1.5, minHeight: 66, padding: '0 14px 0 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', fontFamily: SERIF, color: '#F0D78C',
      background: 'radial-gradient(120% 140% at 30% 0%, #6B4429 0%, #4A2D1A 55%, #33200F 100%)', border: '2px solid #1E120A', borderRadius: 5, boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,220,160,0.25), inset 0 -3px 6px rgba(0,0,0,0.45)' }}>
      {/* index tabs peeking from the page edge */}
      <span aria-hidden="true" style={{ position: 'absolute', right: -6, top: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
        {rivals.map((r) => <span key={r.id} style={{ width: 12, flex: 1, maxHeight: 16, background: r.color, border: '1px solid #1E120A', borderRadius: '0 3px 3px 0', boxShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} />)}
      </span>
      <span aria-hidden="true" style={{ position: 'absolute', inset: 4, border: '1.5px dashed rgba(240,215,140,0.45)', borderRadius: 3, pointerEvents: 'none' }} />
      {corner({ top: -1, left: -1, clipPath: 'polygon(0 0,100% 0,0 100%)' })}{corner({ bottom: -1, left: -1, clipPath: 'polygon(0 0,0 100%,100% 100%)' })}
      {/* ribbon bookmark */}
      <span aria-hidden="true" style={{ position: 'absolute', right: 26, bottom: -9, width: 11, height: 22, background: 'linear-gradient(90deg,#A32A1E,#C93A26)', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 76%,0 100%)', boxShadow: '0 2px 3px rgba(0,0,0,0.5)' }} />
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#F0D78C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.7))' }}>
        <circle cx="12" cy="7" r="2.6" /><circle cx="5.5" cy="17" r="2.2" /><circle cx="18.5" cy="17" r="2.2" /><path d="M10.6 9.2L6.6 15 M13.4 9.2l4 5.8 M7.7 17h8.6" />
      </svg>
      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
        <span style={{ display: 'block', fontFamily: "'Ruslan Display', serif", fontSize: 20, letterSpacing: 1, textShadow: '0 -1px 0 rgba(0,0,0,0.85), 0 1px 0 rgba(255,235,180,0.35)' }}>Розклад сил</span>
        <span style={{ display: 'block', fontSize: 11, color: '#D9C79B', fontStyle: 'italic' }}>{hostile > 0 ? `${hostile} полює на вас` : 'нотатки про суперників'}</span>
      </span>
      {hostile > 0 && <span style={{ position: 'absolute', top: -8, left: -6, minWidth: 22, height: 22, padding: '0 6px', background: RED, color: '#F6EEDA', fontSize: 13, fontWeight: 700, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1E120A', boxShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{hostile}</span>}
    </button>
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
  const [key, setKey] = useState(false);
  const fitted = useRef(false);
  // the sheet must always cover the viewport: no bare desk below the plan
  const minZ = () => { const el = sheet.current || root.current; return el ? Math.max(0.36, +(el.clientHeight / 1140).toFixed(2), +(el.clientWidth / 1040).toFixed(2)) : 0.7; };
  const b = c.biz.find((x) => x.id === sel) || null;
  const rv = panel === 'riv' ? c.rivals.find((r) => r.id === selR) || null : null;
  const bRival = b ? c.rivals.find((r) => r.id === b.rival) || null : null;
  const acts: ActOption[] = rv ? G.rivalActs(s, rv) : panel === 'biz' && b && b.status === 'open' ? G.bizActs(s, b) : [];
  const cur = acts.find((o) => o.act === pick && o.can) || acts.find((o) => o.can) || null;

  // first open: the whole height of the screen is the map
  useLayoutEffect(() => {
    const el = root.current; if (!el || fitted.current) return;
    fitted.current = true;
    setZoom(Math.max(minZ(), Math.min(1.2, +(el.clientHeight / 1000).toFixed(2))));
  }, []);
  // keep the touched shop in the visible part of the map (the card takes the lower part)
  useEffect(() => {
    const sc = sheet.current; if (!sc) return;
    const tm = setTimeout(() => {
      const w = sc.scrollWidth, h = sc.scrollHeight;
      const px = b && panel === 'biz' ? b.x : 100, py = b && panel === 'biz' ? b.y : 110;
      sc.scrollTo({ left: ((px + 4) / 208) * w - sc.clientWidth / 2, top: ((py + 4) / 228) * h - sc.clientHeight / 2, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(tm);
  }, [sel, panel, zoom]);
  useEffect(() => setPick(null), [sel, selR, panel]);

  const stamp = () => {
    if (!cur) return;
    if (rv) run((x) => G.actOnRival(x, rv.id, cur.act as RivalAct));
    else if (b) run((x) => G.actOnBiz(x, b.id, cur.act as BizAct));
  };
  const rivMode = (panel as string) === 'riv';
  const lead = c.acted && c.last;
  const hostile = c.rivals.filter((r) => !r.ally && r.heat >= 5).length;
    const plaque: CSSProperties = { background: 'linear-gradient(180deg, rgba(46,32,18,0.94), rgba(26,18,10,0.94))', border: '1.5px solid #6E531E', boxShadow: '0 4px 10px rgba(0,0,0,0.6)', color: '#F1E6C8' };

  const tabs = (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 4 }}>
      {([['biz', 'ЗАКЛАД'], ['riv', 'РОЗКЛАД СИЛ']] as const).map(([k, l]) => (
        <button key={k} onClick={() => setPanel(k)} style={{ flex: 1, position: 'relative', padding: '10px 4px', minHeight: 44, fontFamily: SERIF, fontSize: 13, fontWeight: 700, letterSpacing: 1.8, cursor: 'pointer', color: panel === k ? INK : '#E6D9BC', background: panel === k ? 'linear-gradient(180deg,#F6EEDA,#E4D6B0)' : 'rgba(0,0,0,0.35)', border: `1.5px solid ${panel === k ? INK : '#6E531E'}` }}>
          {l}{k === 'riv' && hostile > 0 && <span style={{ position: 'absolute', top: -6, right: 6, minWidth: 16, padding: '0 4px', background: RED, color: '#F6EEDA', fontSize: 10, borderRadius: 8 }}>{hostile}</span>}
        </button>
      ))}
    </div>
  );
  const card = panel === 'riv' ? (rv ? <RivalCard r={rv} c={c} wide={false} /> : null) : b ? <Blank b={b} wide={false} rv={bRival} /> : <div style={{ fontSize: 13, fontStyle: 'italic', color: '#E9E1C2' }}>Торкніться закладу на плані.</div>;
  const actions = lead
    ? <Result res={c.last!} />
    : rv && rv.ally ? <div style={{ fontSize: 13, fontStyle: 'italic', color: (rivMode ? INK : '#E9E1C2'), padding: '4px 2px' }}>Дім скріплено шлюбом. Він більше не полює на вас.</div>
    : acts.length
      ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{acts.map((o) => <ActCard key={o.act} o={o} on={cur?.act === o.act} locked={c.acted} onPick={() => setPick(o.act)} />)}</div>
      : panel === 'biz' && b ? <div style={{ fontSize: 13, fontStyle: 'italic', color: (rivMode ? INK : '#E9E1C2'), padding: '4px 2px' }}>{b.status === 'roof' ? 'Платить щороку. Поки платить — не чіпаємо.' : 'Заклад закрито. Тут уже нічого не взяти.'}</div> : null;

  return (
    <div ref={root} className="tx-wood" style={{ position: 'absolute', inset: 0, zIndex: 70, background: '#1A120A', display: 'flex', flexDirection: 'column', fontFamily: SERIF, color: INK }}>
      {/* the whole plan; it shrinks only while a card is open */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={sheet} className="tx-paper" style={{ flex: 1, minHeight: 0, overflow: 'auto', background: PAPER, border: 'none', scrollbarWidth: 'none' }}>
          <Plan biz={c.biz} sel={panel === 'biz' ? sel : null} onPick={(id) => { setSel(id); setPanel('biz'); }} zoom={zoom} rivals={c.rivals} />
        </div>
        {/* floating furniture: title plaque, close, zoom, legend */}
        <div style={{ position: 'absolute', left: 10, top: 10, right: 62, display: 'flex', alignItems: 'center', gap: 8, ...plaque, padding: '5px 10px', pointerEvents: 'none' }}>
          <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 17, flex: 1, whiteSpace: 'nowrap' }}>План Порт-Аурума</span>
          <span style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 700, padding: '2px 7px', background: c.acted ? T.risk.note : T.clean.note, color: c.acted ? T.risk.ink : T.clean.ink, whiteSpace: 'nowrap' }}>{c.acted ? 'ХІД ЗРОБЛЕНО' : '1 ХІД'}</span>
        </div>
        <button onClick={onClose} aria-label="Згорнути план" style={{ position: 'absolute', right: 10, top: 10, width: 40, height: 40, ...plaque, fontSize: 20, fontWeight: 700, cursor: 'pointer', borderRadius: 4 }}>✕</button>
        {panel !== 'riv' && <div style={{ position: 'absolute', right: 10, bottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setKey((v) => !v)} aria-label="Умовні знаки" style={{ width: 46, height: 46, fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: '#F1E6C8', background: 'linear-gradient(180deg, rgba(60,42,22,0.96), rgba(30,20,10,0.96))', border: '1.5px solid #B8913C', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>?</button>
          {([['+', 0.2], ['−', -0.2]] as const).map(([l, d]) => <button key={l} onClick={() => setZoom((z) => Math.min(2, Math.max(minZ(), +(z + d).toFixed(2))))} style={{ width: 46, height: 46, fontSize: 26, fontWeight: 700, fontFamily: SERIF, color: INK, background: 'linear-gradient(180deg,#E2C374,#B8913C 60%,#9A7630)', border: '1.5px solid #4A3812', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>{l}</button>)}
        </div>}
        {key && <Legend rivals={c.rivals} onClose={() => setKey(false)} />}
      </div>

      {panel === null ? (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 10px' }}>
          <NotebookBtn rivals={c.rivals} hostile={hostile} onClick={() => setPanel('riv')} />
          <span style={{ flex: 1, fontSize: 12, fontStyle: 'italic', color: '#E6D9BC', lineHeight: 1.25 }}>{c.acted ? 'Хід зроблено. Наступний — завтра зранку.' : 'Торкніться закладу на плані.'}</span>
        </div>
      ) : (
        <div style={{ flexShrink: 0, maxHeight: panel === 'riv' ? '93%' : '64%', display: 'flex', flexDirection: 'column', margin: '0 6px', padding: '8px 8px 8px', background: 'linear-gradient(180deg, rgba(26,18,10,0.97), rgba(20,13,7,0.99))', border: '1.5px solid #6E531E', borderBottom: 'none', boxShadow: '0 -10px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 2px 4px' }}>
            {panel === 'riv' ? null : tabs}
            {panel === 'riv' ? <PowerSheet c={c} selR={selR} onSel={setSelR}>{lead ? <div style={{ marginBottom: 10 }}><Result res={c.last!} /></div> : null}</PowerSheet> : <>{card}{actions}</>}
          </div>
          {rivMode && !lead && rv && (
            <div style={{ flexShrink: 0, paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: 1.6, fontWeight: 700, color: '#D9C79B', marginBottom: 6 }}>ЩО ЗРОБИТИ З {rv.name.toUpperCase().replace('ГРАФ ҐЖЕҐОЖЕВСЬКИЙ', 'ГРАФОМ').replace('ПАН ВАЙСМАН', 'ВАЙСМАНОМ').replace('ПАНІ БЕРГ', 'БЕРГ')} · 1 ХІД<span style={{ flex: 1, height: 1, background: 'rgba(217,199,155,0.35)' }} /></div>
              {rv.ally ? <div style={{ fontSize: 13, fontStyle: 'italic', color: '#E9E1C2' }}>Дім скріплено шлюбом. {rv.f ? 'Вона' : 'Він'} більше не полює на вас.</div> : <>
                <div style={{ display: 'flex', gap: 6 }}>{acts.map((o) => <ToolChip key={o.act} o={o} on={cur?.act === o.act} locked={c.acted} onPick={() => setPick(o.act)} />)}</div>
                {cur && !c.acted && <div style={{ marginTop: 7, padding: '5px 9px', fontSize: 12, lineHeight: 1.3, color: '#E9E1C2', background: 'rgba(0,0,0,0.3)', borderLeft: '3px solid #B8913C' }}>
                  <b style={{ color: cur.gainT ? '#9FD7B0' : '#F0D78C' }}>{cur.gainT || `до ${G.fmt(cur.gain)} кр.`}</b>{cur.cost ? <b style={{ color: '#F4A08C' }}> · платите {G.fmt(cur.cost)} кр.</b> : null} — {cur.sub}
                </div>}
              </>}
            </div>
          )}
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
