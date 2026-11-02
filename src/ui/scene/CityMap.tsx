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

/** the rival's strip of the notebook: a sticky note in the margin of the schema */
const STYLE_N: Record<string, string> = { expander: 'скуповує заклади, перебиває чужі дахи', smear: 'б’є пресою — по народу й по ризику', informer: 'пише доноси губернатору — б’є по покровителю' };

/** «Розклад сил»: the character's own working notes: a hand-drawn schema of who stands where, a table of districts, a dossier per magnate */
function PowerSheet({ c, selR, onSel, hostile, children }: { c: NonNullable<GameState['city']>; selR: string; onSel: (id: string) => void; hostile: number; children: React.ReactNode }) {
  const rv = c.rivals.find((r) => r.id === selR) || c.rivals[0];
  const ctl = G.control(c);
  const W = 360, H = 236, cx = W / 2, cy = 124, n = c.rivals.length;
  const pos = c.rivals.map((_, i) => { const a = (-90 + (360 / n) * i + (n === 3 ? 0 : 0)) * Math.PI / 180; return [cx + Math.cos(a) * 128 * (i === 0 ? 0.62 : 1), cy + Math.sin(a) * 76] as const; });
  // first rival at top, the others spread to the lower left/right
  const place = c.rivals.map((_, i) => (n === 3 ? [[cx, 34], [62, 178], [W - 62, 178]][i] : pos[i]));
  const wob = (i: number) => (i === 0 ? 0 : i === 1 ? -6 : 6);
  const risk = hostile >= 2 ? ['високий', T.risk] as const : hostile === 1 ? ['середній', T.dirty] as const : ['низький', T.clean] as const;
  const dRows = (Object.keys(G.DISTRICTS) as G.District[]).map((d) => ({ d, x: ctl[d], tot: ctl[d].me + ctl[d].free + c.rivals.reduce((a, r) => a + (ctl[d].rivals[r.id] || 0), 0) })).filter((r) => r.tot > 0);
  const hunt = c.rivals.filter((r) => !r.ally && r.heat >= 5);
  return (
    <div className="tx-paper" style={{ position: 'relative', background: 'linear-gradient(180deg,#F1E7C8,#E8DBB4)', padding: '22px 12px 12px', boxShadow: '0 10px 22px rgba(0,0,0,0.6), inset 0 0 26px rgba(140,110,50,0.28)', transform: 'rotate(-0.25deg)', color: INK }}>
      <Clip side="top" />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, letterSpacing: 2, color: MUTE }}>МОЇ НОТАТКИ · ПОРТ-АУРУМ</span>
          <span style={{ display: 'block', fontFamily: HAND, fontSize: 30, lineHeight: 1 }}>Розклад сил</span>
        </span>
        <span style={{ padding: '3px 9px', background: risk[1].note, color: risk[1].ink, border: `1.5px solid ${risk[1].pen}`, fontSize: 12, fontWeight: 700, transform: 'rotate(2deg)' }}>небезпека: {risk[0]}</span>
      </div>

      {/* the schema, drawn by hand: us in the middle, the magnates around, thread between */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', marginTop: 4 }} aria-label="Схема впливу">
        <defs><radialGradient id="ps-seal" cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".4" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".4" /></radialGradient>
          <filter id="ps-sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1" dy="2" stdDeviation="1.4" floodOpacity=".45" /></filter></defs>
        {c.rivals.map((r, i) => {
          const [x, y] = place[i], mx = (x + cx) / 2 + wob(i), my = (y + cy) / 2 + (i === 0 ? 14 : -6);
          const hot = !r.ally && r.heat >= 5, col = r.ally ? '#3F8A5A' : hot ? '#B3321F' : '#7A6A48';
          return (
            <g key={r.id}>
              <path d={`M${cx} ${cy} Q${mx} ${my} ${x} ${y}`} fill="none" stroke={col} strokeWidth={r.ally ? 2.2 : 1.2 + r.heat / 4} strokeDasharray={r.ally ? '0' : hot ? '5 3' : '2 4'} strokeLinecap="round" opacity=".9" />
              <g transform={`translate(${mx} ${my}) rotate(${i === 0 ? 0 : i === 1 ? -22 : 22})`}>
                <rect x="-27" y="-8" width="54" height="15" fill="#F6EEDA" stroke={col} strokeWidth=".8" />
                <text y="3" textAnchor="middle" fontFamily="'Ruslan Display', serif" fontSize="10" fill={col}>{r.ally ? 'союзник' : hot ? 'полює!' : 'стежить'}</text>
              </g>
            </g>
          );
        })}
        {/* us */}
        <g filter="url(#ps-sh)"><circle cx={cx} cy={cy} r="25" fill="#3F8A5A" stroke={INK} strokeWidth="1.5" /><circle cx={cx} cy={cy} r="25" fill="url(#ps-seal)" /><circle cx={cx} cy={cy} r="19" fill="none" stroke="#F6EEDA" strokeOpacity=".6" strokeWidth="1" strokeDasharray="2 2" /></g>
        <text x={cx} y={cy + 6} textAnchor="middle" fontFamily="'Ruslan Display', serif" fontSize="17" fill="#F6EEDA">МИ</text>
        {c.rivals.map((r, i) => {
          const [x, y] = place[i], rad = 17 + r.power / 6, on = r.id === rv.id;
          return (
            <g key={r.id} onClick={() => onSel(r.id)} style={{ cursor: 'pointer' }}>
              {on && <circle cx={x} cy={y} r={rad + 6} fill="none" stroke={INK} strokeWidth="1.6" strokeDasharray="4 3"><animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="16s" repeatCount="indefinite" /></circle>}
              <g filter="url(#ps-sh)"><circle cx={x} cy={y} r={rad} fill={r.color} stroke={INK} strokeWidth="1.5" /><circle cx={x} cy={y} r={rad} fill="url(#ps-seal)" /><circle cx={x} cy={y} r={rad - 6} fill="none" stroke="#F6EEDA" strokeOpacity=".45" strokeWidth="1" /></g>
              <text x={x} y={y + 8} textAnchor="middle" fontFamily="'Ruslan Display', serif" fontSize="22" fill="#F6EEDA">{r.name.split(' ').slice(-1)[0][0]}</text>
              <rect x={x - 46} y={y + rad + 2} width="92" height="14" fill="#F6EEDA" fillOpacity=".85" />
              <text x={x} y={y + rad + 13} textAnchor="middle" fontFamily="Old Standard TT, serif" fontSize="11" fontWeight={on ? 700 : 400} fill={INK}>{r.name.replace('Граф Ґжеґожевський', 'Граф Ґжеґожевський')}</text>
              <g transform={`translate(${x + rad * 0.7} ${y - rad * 0.7})`}><circle r="9" fill="#F6EEDA" stroke={INK} strokeWidth="1" /><text y="4" textAnchor="middle" fontFamily="serif" fontWeight="700" fontSize="11" fill={INK}>{Math.round(r.power)}</text></g>
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: 10.5, color: MUTE, textAlign: 'center', marginTop: -2 }}>число на печатці — вплив у місті · товщина нитки — як сильно полює</div>

      <Seg title="ХТО ДЕ ТРИМАЄ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {dRows.length === 0 && <i style={{ fontSize: 13, color: MUTE }}>У місті ще нічого не поділено.</i>}
          {dRows.map(({ d, x, tot }) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 92, flexShrink: 0, fontSize: 12.5 }}>{G.DISTRICTS[d].t}</span>
              <span style={{ flex: 1, display: 'flex', height: 15, border: `1.5px solid ${INK}`, background: '#F6EEDA' }}>
                {x.me > 0 && <span style={{ flex: x.me, background: '#3F8A5A' }} />}
                {c.rivals.map((r) => (x.rivals[r.id] || 0) > 0 && <span key={r.id} style={{ flex: x.rivals[r.id], background: r.color }} />)}
                {x.free > 0 && <span style={{ flex: x.free, background: 'repeating-linear-gradient(45deg,#E4D6B0 0 3px,#F6EEDA 3px 6px)' }} />}
              </span>
              <span style={{ width: 16, textAlign: 'right', fontFamily: HAND, fontSize: 17 }}>{tot}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6, fontSize: 11.5, color: MUTE }}>
          <span><i style={{ display: 'inline-block', width: 10, height: 10, background: '#3F8A5A', border: `1px solid ${INK}`, marginRight: 4 }} />наші «дахи»</span>
          {c.rivals.map((r) => <span key={r.id}><i style={{ display: 'inline-block', width: 10, height: 10, background: r.color, border: `1px solid ${INK}`, marginRight: 4 }} />{r.name.split(' ')[r.name.startsWith('Граф') ? 1 : 1] ? r.name.replace('Пан ', '').replace('Пані ', '').replace('Граф Ґжеґожевський', 'Граф') : r.name}</span>)}
          <span><i style={{ display: 'inline-block', width: 10, height: 10, background: 'repeating-linear-gradient(45deg,#E4D6B0 0 2px,#F6EEDA 2px 4px)', border: `1px solid ${INK}`, marginRight: 4 }} />ніхто</span>
        </div>
      </Seg>

      {/* the dossier on the one picked: a note pinned to the page */}
      <div style={{ position: 'relative', marginTop: 12, padding: '14px 11px 9px', background: '#FBF4D6', borderTop: `6px solid ${rv.color}`, boxShadow: '1px 4px 9px rgba(0,0,0,0.4)', transform: 'rotate(0.4deg)' }}>
        <span aria-hidden="true" style={{ position: 'absolute', top: -9, left: '45%', width: 54, height: 16, background: 'rgba(225,212,170,0.75)', transform: 'rotate(-3deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
        <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.6, color: MUTE }}>{rv.ally ? 'РОДИЧ · СОЮЗНИК' : 'СУПЕРНИК'} · {rv.title.toUpperCase()}</span>
        <span style={{ display: 'block', fontFamily: HAND, fontSize: 29, lineHeight: 1.05 }}>{rv.name}</span>
        <span style={{ display: 'block', fontFamily: HAND, fontSize: 19, lineHeight: 1.15, color: T.risk.ink, marginTop: 2 }}>{rv.ally ? 'Шлюб скріпив дім: тепер він нас прикриває.' : `Робить так: ${STYLE_N[rv.style]}.`}</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Fact label="ВПЛИВ"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{Math.round(rv.power)}<span style={{ fontSize: 15 }}>/100</span></span></Fact>
          {rv.ally ? <Fact label="СТАВЛЕННЯ" tone={T.clean}><span style={{ fontSize: 14, fontWeight: 700 }}>Союзник</span></Fact> : <Meter label="ПОЛЮЄ" n={Math.min(3, Math.round(rv.heat / 3.3))} tone={T.risk} icon="eye" />}
          <Fact label="ТРИМАЄ"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{G.holdings(c, rv.id).length}</span></Fact>
        </div>
        {G.holdings(c, rv.id).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>{G.holdings(c, rv.id).map((b) => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', fontSize: 12.5, border: `1.5px solid ${rv.color}`, background: 'rgba(255,255,255,0.5)' }}><BizIcon kind={b.kind} size={18} />{b.kind.split(' ')[0]}</span>)}</div>}
        {rv.last && <div style={{ marginTop: 7, fontFamily: HAND, fontSize: 18, lineHeight: 1.15 }}>Вночі: {rv.last}</div>}
      </div>
      {hunt.length === 0 && !rv.ally && <div style={{ marginTop: 6, fontFamily: HAND, fontSize: 15, color: MUTE }}>Поки що ніхто не полює відкрито. Але вони стежать.</div>}
      <Seg title="ЩО МОЖНА ЗРОБИТИ (1 ХІД НА РАНОК)"><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div></Seg>
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
        <div style={{ position: 'absolute', right: 10, top: 62, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([['+', 0.2], ['−', -0.2]] as const).map(([l, d]) => <button key={l} onClick={() => setZoom((z) => Math.min(2, Math.max(minZ(), +(z + d).toFixed(2))))} style={{ width: 40, height: 40, fontSize: 24, fontWeight: 700, fontFamily: SERIF, color: INK, background: 'linear-gradient(180deg,#E2C374,#B8913C 60%,#9A7630)', border: '1.5px solid #4A3812', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>{l}</button>)}
          <button onClick={() => setKey((v) => !v)} aria-label="Умовні знаки" style={{ width: 40, height: 40, fontSize: 20, fontWeight: 700, fontFamily: SERIF, color: '#F1E6C8', background: 'linear-gradient(180deg, rgba(60,42,22,0.96), rgba(30,20,10,0.96))', border: '1.5px solid #B8913C', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>?</button>
        </div>
        {key && <Legend rivals={c.rivals} onClose={() => setKey(false)} />}
      </div>

      {panel === null ? (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 10px' }}>
          <DeskBtn kind="ink" style={{ flex: 1.2, position: 'relative', minHeight: 48, fontSize: 13 }} onClick={() => setPanel('riv')}>
            Розклад сил{hostile > 0 && <span style={{ position: 'absolute', top: -7, right: -4, minWidth: 18, padding: '0 5px', background: RED, color: '#F6EEDA', fontSize: 11, borderRadius: 9 }}>{hostile}</span>}
          </DeskBtn>
          <span style={{ flex: 2, fontSize: 12, fontStyle: 'italic', color: '#E6D9BC', lineHeight: 1.25 }}>{c.acted ? 'Хід зроблено. Наступний — завтра зранку.' : 'Торкніться закладу на плані: з’явиться його картка.'}</span>
        </div>
      ) : (
        <div style={{ flexShrink: 0, maxHeight: panel === 'riv' ? '93%' : '64%', display: 'flex', flexDirection: 'column', margin: '0 6px', padding: '8px 8px 8px', background: 'linear-gradient(180deg, rgba(26,18,10,0.97), rgba(20,13,7,0.99))', border: '1.5px solid #6E531E', borderBottom: 'none', boxShadow: '0 -10px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 2px 4px' }}>
            {tabs}
            {panel === 'riv' ? <PowerSheet c={c} selR={selR} onSel={setSelR} hostile={hostile}>{actions}</PowerSheet> : <>{card}{actions}</>}
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
