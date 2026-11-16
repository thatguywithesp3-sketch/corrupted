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

// ---------------------------------------------------------------- painted places
// Only what matters to us is painted, like the monuments on a pictorial city map: the places where the family
// name is washed, the magnates' houses, our own house, the shops we can touch. The rest of the city stays a
// quiet engraved wash underneath. Sprites are hand-tinted engravings (public/art/map), anchored by their base.
import { DECOR, HOMES, OUR_HOME, INST_W, HOME_W, shopArt, spriteH, layoutShops } from './mapLayout';

/** a painted building standing on a little clearing; its base sits on (x, y) */
function Sprite({ art, x, y, w, dim, quiet }: { art: string; x: number; y: number; w: number; dim?: boolean; quiet?: boolean }) {
  const h = spriteH(art, w);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="-.4" rx={w * 0.56} ry={w * 0.2} fill="#EFE5C9" fillOpacity=".92" />
      <ellipse cx=".6" cy="0" rx={w * 0.46} ry={w * 0.13} fill="#3A2A10" fillOpacity=".18" />
      <image href={`art/map/${art}.webp`} x={-w / 2} y={-h * 0.94} width={w} height={h} preserveAspectRatio="xMidYMax meet" style={dim ? { filter: 'grayscale(1) opacity(.55)' } : quiet ? { filter: 'sepia(.45) saturate(.6) opacity(.85)' } : undefined} />
    </g>
  );
}
/** a small engraved name plate under a painted place. `gold`: a place we can act at (brass plate);
 * `quiet`: a landmark we only look at (just the engraved name, no plate) */
function Plaque({ x, y, t, on, color, gold, quiet }: { x: number; y: number; t: string; on?: boolean; color?: string; gold?: boolean; quiet?: boolean }) {
  if (quiet) return <text x={x} y={y + 0.3} textAnchor="middle" fontFamily="Old Standard TT, serif" fontSize="1.9" fontStyle="italic" fill="#4A3B22" stroke="#EFE5C9" strokeWidth=".7" paintOrder="stroke" style={{ pointerEvents: 'none' }}>{t}</text>;
  const fs = gold ? 2.3 : 2, w = t.length * (gold ? 1.5 : 1.32) + (gold ? 3.4 : 2.4), h = gold ? 3.3 : 2.9;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h + 1} width={w} height={h} rx=".3" fill={gold ? 'url(#mp-brass)' : on ? '#FFF7DC' : '#F4EBCF'} stroke={on ? RED : gold ? '#5A4012' : color || '#5A4A30'} strokeWidth={on ? 0.45 : gold ? 0.32 : 0.22} filter={gold ? 'url(#mp-sh)' : undefined} />
      {gold && <rect x={-w / 2 + 0.5} y={-h + 1.5} width={w - 1} height={h - 1} rx=".2" fill="none" stroke="#FFF2C0" strokeOpacity=".55" strokeWidth=".18" />}
      {color && !gold && <rect x={-w / 2} y="-1.9" width=".9" height="2.9" fill={color} />}
      <text textAnchor="middle" y={gold ? 0.25 : 0.3} fontFamily="Old Standard TT, serif" fontSize={fs} fontWeight={on || gold ? 700 : 400} fill={INK}>{t}</text>
    </g>
  );
}
/** the brass medallion hung over a place we can act at: its emblem says what the place is for */
const INST_GLYPH: Record<G.InstId, string> = {
  charity: 'M0 2.2 C-2.6 .4 -2.6 -1.9 -1.2 -1.9 C-.5 -1.9 0 -1.3 0 -.9 C0 -1.3 .5 -1.9 1.2 -1.9 C2.6 -1.9 2.6 .4 0 2.2 Z',
  press: 'M1.9 -2.1 C.2 -1.4 -1 .2 -1.5 1.9 M1.9 -2.1 C1.4 -.4 .2 .6 -1.1 1.1 M-1.5 1.9 L-1.9 2.3',
  whisper: 'M-2 -1.4 H2 V.9 H-.2 L-1.3 2 V.9 H-2 Z M-1 -.3 H-.6 M-.2 -.3 H.2 M.6 -.3 H1',
  okhrana: 'M-1.9 -1.9 L1.9 1.9 M1.9 -1.9 L-1.9 1.9 M-2.2 -1 L-1 -2.2 M2.2 -1 L1 -2.2'
};
const PLACE_NAME: Record<G.InstId, string> = { charity: 'Сиротинець', press: '«Вісник»', whisper: 'Ринок', okhrana: 'Жандармерія' };
function InstSign({ id, x, y, on }: { id: G.InstId; x: number; y: number; on: boolean }) {
  const fill = id === 'charity' || id === 'okhrana';
  return (
    <g transform={`translate(${x} ${y})`}>
      <g style={{ transform: on ? 'scale(1.18)' : 'none', transition: 'transform .2s' }}>
                <g filter="url(#mp-sh)"><circle r="4.1" fill="url(#mp-brass)" stroke="#4A3410" strokeWidth=".4" /><circle r="4.1" fill="url(#mp-head)" /></g>
        <circle r="3.1" fill="#FBF4DC" stroke="#8A6A28" strokeWidth=".2" />
        <path d={INST_GLYPH[id]} fill={fill ? RED : 'none'} stroke={fill && id === 'charity' ? 'none' : id === 'okhrana' ? '#23356A' : INK} strokeWidth=".45" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}
/** a painted <g> that behaves like a button: focusable, Enter/Space, a name for screen readers */
const asBtn = (label: string, fn: () => void) => ({
  role: 'button', tabIndex: 0, 'aria-label': label, onClick: fn,
  onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } },
  style: { cursor: 'pointer', outline: 'none' } as CSSProperties
});
const Mark = ({ x, y, ok }: { x: number; y: number; ok: boolean }) => (
  <g transform={`translate(${x} ${y}) rotate(-14)`}><circle r="2.1" fill="#F6EEDA" stroke={ok ? '#2F6E46' : '#8E1F12'} strokeWidth=".45" /><path d={ok ? 'M-1 0 L-.2 .9 L1.1 -.9' : 'M-.9 -.9 L.9 .9 M.9 -.9 L-.9 .9'} stroke={ok ? '#2F6E46' : '#8E1F12'} strokeWidth=".55" fill="none" strokeLinecap="round" /></g>
);

/** the plan: the quiet engraving underneath, the painted places and the shops on top */
function Plan({ biz, sel, onPick, zoom, rivals, marks, selInst, onInst, onRival, live }: { live: Set<string>; biz: Biz[]; sel: string | null; onPick: (id: string) => void; zoom: number; rivals: Rival[]; marks: { biz: string; ok: boolean }[]; selInst: string | null; onInst: (id: G.InstId) => void; onRival: (id: string) => void }) {
  const colOf = (id?: string | null) => rivals.find((r) => r.id === id)?.color;
  const ctl = G.control({ biz, rivals } as never);
  const markOf = (id: string) => marks.find((m) => m.biz === id);
  // everything painted is drawn back to front, so nearer buildings overlap farther ones
  type Item = { y: number; el: React.ReactNode };
  const items: Item[] = [];
  DECOR.forEach((p, i) => items.push({ y: p.y, el: <g key={'d' + i} style={{ pointerEvents: 'none' }}><Sprite art={p.art} x={p.x} y={p.y} w={p.w} quiet />{p.t && <Plaque x={p.x} y={p.y + 2.2} t={p.t} quiet />}</g> }));
  items.push({ y: OUR_HOME.y, el: <g key="home" style={{ pointerEvents: 'none' }}><Sprite art={OUR_HOME.art} x={OUR_HOME.x} y={OUR_HOME.y} w={HOME_W.grabs} /><Plaque x={OUR_HOME.x} y={OUR_HOME.y + 2.6} t="Ваш дім" color="#3F8A5A" /></g> });
  G.INSTS.forEach((p) => {
    const on = selInst === p.id, mk = markOf('i:' + p.id), w = INST_W[p.id], h = spriteH(p.art, w), lit = live.has(p.id);
    items.push({ y: p.y, el: (
      <g key={p.id} {...asBtn(G.INSTS.find((i) => i.id === p.id)!.t, () => onInst(p.id))} className="mp-hit">
        {/* the brass ring on the ground: a place where a move can be made this year */}
        <ellipse cx={p.x} cy={p.y - 0.4} rx={w * 0.66} ry={w * 0.25} fill="#F3DC93" fillOpacity={lit ? 0.45 : 0.18} stroke="#B8913C" strokeWidth=".45" />
        {lit && <ellipse cx={p.x} cy={p.y - 0.4} rx={w * 0.66} ry={w * 0.25} fill="none" stroke="#C9A24A" strokeWidth=".5"><animate attributeName="rx" values={`${w * 0.62};${w * 0.8};${w * 0.62}`} dur="2.4s" repeatCount="indefinite" /><animate attributeName="ry" values={`${w * 0.23};${w * 0.32};${w * 0.23}`} dur="2.4s" repeatCount="indefinite" /><animate attributeName="stroke-opacity" values=".9;0;.9" dur="2.4s" repeatCount="indefinite" /></ellipse>}
        {on && <ellipse cx={p.x} cy={p.y - 0.4} rx={w * 0.72} ry={w * 0.29} fill="none" stroke={RED} strokeWidth=".6" strokeDasharray="1.3 .7" />}
        <Sprite art={p.art} x={p.x} y={p.y} w={w} />
        <InstSign id={p.id} x={p.x + w * 0.45} y={p.y - h * 0.72} on={on} />
        <Plaque x={p.x} y={p.y + 3} t={PLACE_NAME[p.id]} on={on} gold />
        {mk && <Mark x={p.x + w * 0.42} y={p.y - 1.5} ok={mk.ok} />}
        <rect x={p.x - w / 2} y={p.y - h * 0.94} width={w + 4.5} height={h * 0.94 + 4.5} fill="transparent" />
      </g>
    ) });
  });
  rivals.forEach((r) => {
    const h = HOMES[r.id]; if (!h) return;
    items.push({ y: h.y, el: (
      <g key={r.id} {...asBtn(r.name, () => onRival(r.id))} className="mp-hit">
        <Sprite art={h.art} x={h.x} y={h.y} w={HOME_W[h.art]} />
        <Plaque x={h.x} y={h.y + 2.8} t={/^Граф /.test(r.name) ? 'Граф ' + (r.name.split(' ').pop() || '').split('-')[0] : r.name.replace(/^(Пан|Пані) \S+ (\S+)$/, '$1 $2')} color={r.color} />
        <rect x={h.x - 8} y={h.y - 17} width="16" height="21" fill="transparent" />
      </g>
    ) });
  });
  const at = layoutShops(biz);
  [...biz].forEach((b0) => {
    const b = { ...b0, ...at[b0.id] };
    const on = b.id === sel, closed = b.status === 'closed', roof = b.status === 'roof';
    const col = pinColor(b), rc = colOf(b.rival), mk = markOf(b.id);
    items.push({ y: b.y + (on ? 50 : 0), el: (
      <g key={b.id} {...asBtn(`${b.name}, ${b.kind}`, () => onPick(b.id))} className="mp-hit">
        {on && <ellipse cx={b.x} cy={b.y + 4.2} rx="6.6" ry="2.6" fill="none" stroke={RED} strokeWidth=".6" strokeDasharray="1.3 .7" />}
        <Sprite art={shopArt(b.id)} x={b.x} y={b.y + 4.2} w={9.5} dim={closed} />
        {/* the shop sign hangs above the roof: enamel medallion with the trade's emblem */}
        <g transform={`translate(${b.x} ${b.y - 9.6})`}>
          <g style={{ transform: on ? 'scale(1.2)' : 'none', transition: 'transform .2s' }}>
            {rc && b.status === 'open' && <circle r="4.2" fill="none" stroke={rc} strokeWidth="1.1" />}
            <g filter="url(#mp-sh)"><circle r="3.3" fill={col} stroke={INK} strokeWidth=".4" /><circle r="3.3" fill="url(#mp-head)" /></g>
            <circle r="2.6" fill="#FBF4DC" />
            <BizGlyph kind={b.kind} x={-2.05} y={-2.05} size={4.1} color={closed ? '#7A7468' : INK} paper="#FBF4DC" />
            {closed && <path d="M-2.3 -2.3 L2.3 2.3 M2.3 -2.3 L-2.3 2.3" stroke="#8E1F12" strokeWidth=".7" />}
            {roof && <g transform="translate(2.5 2.5)"><circle r="1.45" fill="#3F8A5A" stroke={INK} strokeWidth=".25" /><path d="M-.8 .15 L0 -.7 L.8 .15 M-.55 0 V.8 H.55 V0" stroke="#fff" strokeWidth=".3" fill="none" /></g>}
            {!closed && !roof && b.pressure > 0 && <g transform="translate(2.6 -2.6)"><circle r="1.55" fill="#D49A3A" stroke={INK} strokeWidth=".3" /><text y=".6" textAnchor="middle" fontSize="2" fontWeight="700" fontFamily="serif" fill={INK}>{b.pressure}</text></g>}
            {!closed && b.grudge > 0 && <g transform="translate(-2.6 -2.6)"><circle r="1.55" fill="#C93A26" stroke={INK} strokeWidth=".3" /><text y=".6" textAnchor="middle" fontSize="2" fontWeight="700" fontFamily="serif" fill="#fff">{b.grudge}</text></g>}
          </g>
        </g>
        <Plaque x={b.x} y={b.y + 7.2} t={short(b)} on={on} />
        {mk && <Mark x={b.x - 4.6} y={b.y - 4} ok={mk.ok} />}
        <rect x={b.x - 5} y={b.y - 13.5} width="10" height="22" fill="transparent" />
      </g>
    ) });
  });
  items.sort((a, z) => a.y - z.y);
  return (
    <svg viewBox="-4 -4 208 228" style={{ display: 'block', width: 1040 * zoom, height: 1140 * zoom, flexShrink: 0 }} aria-label="План Порт-Аурума">
      <defs>
        <filter id="mp-sh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx=".5" dy=".9" stdDeviation=".5" floodColor="#000" floodOpacity=".55" /></filter>
        <linearGradient id="mp-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6E3A1" /><stop offset=".5" stopColor="#D9B45C" /><stop offset="1" stopColor="#A67F2E" /></linearGradient>
        <style>{'.mp-hit:focus-visible > *:first-child { stroke: #8E1F12; stroke-width: .8; stroke-dasharray: 1.3 .7 }'}</style>
        <radialGradient id="mp-head" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" /></radialGradient>
      </defs>
      <PlanArt />
      {/* who holds each district: one dot per shop under us (green), under a rival (his colour), or free */}
      {(Object.keys(G.DISTRICTS) as G.District[]).map((k) => {
        const d = ctl[k], dots = [...Array(d.me).fill('#3F8A5A'), ...rivals.flatMap((r) => Array(d.rivals[r.id]).fill(r.color)), ...Array(d.free).fill('')];
        const [lx, ly] = G.DISTRICTS[k].label;
        return <g key={k} transform={`translate(${lx - (dots.length * 2.6) / 2 + 1.3} ${ly + 2.6})`}>{dots.map((col, i) => <circle key={i} cx={i * 2.6} r="1" fill={col || '#F2E9D0'} stroke={INK} strokeWidth=".25" />)}</g>;
      })}
      {items.map((it) => it.el)}
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
      <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.3, fontWeight: 700, color: n ? tone.ink : MUTE }}>{label}</span>
      <span style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${n ? tone.ink : MUTE}`, background: i < n ? `radial-gradient(circle at 35% 30%, ${tone.pen}, ${tone.ink})` : 'transparent', boxShadow: i < n ? '0 1px 2px rgba(0,0,0,0.5)' : 'inset 0 1px 2px rgba(0,0,0,0.25)' }} />)}
      </span>
    </span>
    <span style={{ fontFamily: HAND, fontSize: 22, lineHeight: 1, color: n ? tone.ink : MUTE }}>{n}<span style={{ fontSize: 14 }}>/3</span></span>
  </span>
);

/** the blank pinned to the map's edge */
const Clip = ({ side }: { side: 'top' | 'left' }) => (
  <span aria-hidden="true" style={{ position: 'absolute', zIndex: 3, ...(side === 'top' ? { top: -9, left: '84%', marginLeft: -24, width: 52, height: 20 } : { left: -9, top: 26, width: 20, height: 52 }), borderRadius: 4, background: 'linear-gradient(180deg,#E2C374,#9A7630 60%,#6E531E)', border: '1.5px solid #4A3812', boxShadow: '0 3px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
    <span style={{ position: 'absolute', inset: 4, borderRadius: 2, border: '1px solid rgba(60,40,10,0.5)', background: 'rgba(0,0,0,0.12)' }} />
  </span>
);

/** a titled segment of a card: small caps heading with a rule, the content underneath */
const Seg = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <div style={{ marginTop: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: 1.7, fontWeight: 700, color: MUTE }}>
      {title}<span style={{ flex: 1, height: 1, background: 'rgba(31,26,20,0.3)' }} />{right}
    </div>
    <div style={{ marginTop: 4 }}>{children}</div>
  </div>
);
/** a big number cell: the thing to look at first */
const Fact = ({ label, children, tone }: { label: string; children: React.ReactNode; tone?: (typeof T)[keyof typeof T] }) => (
  <span style={{ flex: 1, minWidth: 0, padding: '4px 8px', background: tone ? tone.note : 'rgba(255,255,255,0.4)', border: `1.5px solid ${tone ? tone.pen : 'rgba(31,26,20,0.4)'}` }}>
    <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: tone ? tone.ink : MUTE }}>{label}</span>
    <span style={{ display: 'block', marginTop: 2, color: tone ? tone.ink : INK }}>{children}</span>
  </span>
);

function Blank({ b, wide, rv }: { b: Biz; wide: boolean; rv: Rival | null }) {
  const statusT = b.status === 'closed' ? 'Закрито' : b.status === 'roof' ? 'Під вашим «дахом»' : b.grudge >= 2 ? 'Озлоблений' : b.pressure ? 'Під тиском' : 'Не чіпали';
  const stCol = b.status === 'roof' ? T.clean : b.status === 'closed' ? T.neu : b.grudge >= 2 ? T.risk : b.pressure ? T.dirty : T.neu;
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '20px 12px 12px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.3}deg)`, zIndex: 2 }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 58, height: 58, flexShrink: 0, borderRadius: '50%', border: `2px solid ${INK}`, outline: `1px solid ${INK}`, outlineOffset: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF4DC', boxShadow: 'inset 0 0 0 4px rgba(212,154,58,0.25)', transform: 'rotate(-6deg)' }}><BizIcon kind={b.kind} size={36} paper="#FBF4DC" /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.4, color: MUTE }}>{G.DISTRICTS[b.district].t.toUpperCase()} · З {b.opened} Р.</span>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 700, lineHeight: 1.08 }}>{G.bizTitle(b)}</span>
          <span style={{ display: 'block', fontSize: 14, fontStyle: 'italic' }}>{b.owner}</span>
        </span>
      </div>
      <Seg title="ГОЛОВНЕ">
        <div style={{ display: 'flex', gap: 8 }}>
          <Fact label="ОБОРОТ НА РІК"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1, color: T.dirty.ink }}>~{G.fk(b.wealth)}</span></Fact>
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
          {b.tie && <span style={{ fontSize: 12, fontWeight: 700, color: T.risk.ink, background: T.risk.note, padding: '2px 8px', border: `1px solid ${T.risk.pen}` }}>⚠ {b.tie === 'press' ? 'Дружить із газетою' : 'Вхожий до губернатора'} — ризик більший</span>}
          {rv && b.status === 'open' && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: rv.color, padding: '2px 8px' }}>Під рукою суперника: {rv.name}</span>}
        </div>
      </Seg>}
    </div>
  );
}

/** the card of a place where the name is washed: the building, what it does, what already works for us */
/** who is inside each institution: the alt text of its picture (public/art/interiors/<id>.jpg) */
const INTERIOR: Record<G.InstId, string> = {
  charity: 'Усередині: ігуменя з книгою пожертв, черниці біля казана, сироти над юшкою. На стіні — дошка благодійників, під нею скринька.',
  press: 'Усередині: редактор за обідом приймає конверт, репортер Квілл пише в блокнот, цензор із Ратуші креслить червоним олівцем.',
  whisper: 'Усередині: перекупки, вантажники й шинкар. За кілька монет вони щодня розповідають на ринку, яка ви порядна людина.',
  okhrana: 'Усередині: ротмістр над досьє, донощик мне шапку, у кутку — вилучені вальдорські прапори з бирками.'
};
function InstCard({ p, s }: { p: G.Inst; s: GameState }) {
  const fm = s.city?.fame || {}, F = G.CITY_RULES.fame;
  const works: string[] = [];
  if (p.id === 'charity' && fm.fund) works.push(`Фонд роду: щороку ризик −${F.fund.calmYr}, народ +${F.fund.peopleYr}`);
  if (p.id === 'press' && fm.share) works.push(`Ваш пай: щороку ризик −${F.share.calmYr}, нападки преси вдвічі слабші`);
  if (p.id === 'whisper' && fm.whisper) works.push(`Шептуни працюють: щороку ризик −${F.whisper.calmYr}, коштують ${G.fmt(F.whisper.cost)} кр.`);
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '20px 12px 12px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: 'rotate(-0.3deg)', zIndex: 2, borderTop: '6px solid #B8913C' }}>
      {/* what it looks like inside: the engraving heads the card edge to edge and speaks for itself */}
      <img src={`art/interiors/${p.id}.jpg`} alt={INTERIOR[p.id]} onError={(e) => { e.currentTarget.style.display = 'none'; }}
        style={{ display: 'block', width: 'calc(100% + 24px)', margin: '-20px -12px 10px', aspectRatio: '2 / 1', objectFit: 'cover', objectPosition: '50% 40%', filter: 'sepia(0.12) contrast(1.03)', borderBottom: `3px double ${INK}` }} />
      <Clip side="top" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.4, color: MUTE }}>ДОБРЕ ІМ’Я · {p.place.toUpperCase()}</span>
          <span style={{ display: 'block', fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{p.t}</span>
          <span style={{ display: 'block', fontSize: 12, fontStyle: 'italic', color: MUTE, lineHeight: 1.25, marginTop: 2 }}>{p.sub}</span>
        </span>
      </div>
      {/* one line instead of a block: the picture above already takes the room */}
      <div style={{ marginTop: 6, paddingTop: 4, borderTop: `1px solid rgba(31,26,20,0.3)`, display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: s.threat >= 60 ? T.risk.ink : INK }}>Ризик <span style={{ fontFamily: HAND, fontSize: 20 }}>{Math.round(s.threat)}</span>/100</span>
        <span style={{ marginLeft: 'auto', color: MUTE }}>брудні {G.fk(G.dirtyTotal(s))} · чисті {G.fk(s.clean)}</span>
      </div>
      {works.map((w) => <div key={w} style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: T.clean.ink, background: T.clean.note, padding: '2px 8px', border: `1px solid ${T.clean.pen}` }}>✓ {w}</div>)}
    </div>
  );
}

function ActCard({ o, on, locked, onPick }: { o: ActOption; on: boolean; locked: boolean; onPick: () => void }) {
  const can = o.can && !locked;
  const tone = oddsTone(o.odds);
  const edge = o.act === 'seal' || o.act === 'expose' ? T.risk.pen : o.act === 'roof' || o.act === 'outbid' || o.act === 'marry' ? T.clean.pen : o.act === 'bribe' ? T.hide.pen : T.dirty.pen;
  return (
    <button onClick={() => can && onPick()} disabled={!can}
      style={{ position: 'relative', width: '100%', textAlign: 'left', display: 'block', padding: '4px 8px 4px 12px', cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.55, fontFamily: SERIF, color: INK,
        background: on ? '#FFF8E0' : 'rgba(246,238,218,0.92)', border: `1.5px solid ${on ? INK : 'rgba(31,26,20,0.35)'}`, borderLeft: `7px solid ${edge}`, boxShadow: on ? '0 6px 12px rgba(0,0,0,0.5), 0 0 0 2px #B8913C' : '0 3px 6px rgba(0,0,0,0.35)', transform: on ? 'translateY(-2px)' : 'none', transition: 'transform .15s, box-shadow .15s' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <b style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.1 }}>{o.t}</b>
        {can && <>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, padding: '0 4px', background: tone.note, color: tone.ink, border: `1px solid ${tone.pen}` }} title="шанс успіху">
            <span style={{ fontFamily: HAND, fontSize: 18, lineHeight: 1.05 }}>{Math.round(o.odds * 100)}%</span>
          </span>
          {o.risk > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: T.risk.ink }}><Ic k="threat" size={13} color={T.risk.ink} />+{o.risk}</span>}
        </>}
      </span>
      {!o.can && o.why ? <span style={{ display: 'block', fontSize: 12, color: MUTE, marginTop: 2 }}>{o.why}</span>
        : can && <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2, fontSize: 12 }}>
          <b style={{ color: o.gainT ? T.clean.ink : T.dirty.ink }}>{o.gainT ? o.gainT : <>{o.act === 'seal' ? 'або ' : 'до '}{G.fmt(o.gain)} кр.{o.perYear ? ' / рік' : ''}</>}</b>
          {o.cost ? <b style={{ color: T.risk.ink }}>· платите {G.fmt(o.cost)} кр.</b> : null}
          {!on && o.risk > 0 && <span style={{ color: MUTE, fontSize: 12 }}>шанс · ризик</span>}
        </span>}
      {on && can && <span style={{ display: 'block', fontSize: 12, lineHeight: 1.25, color: MUTE, marginTop: 2 }}>{o.sub}</span>}
    </button>
  );
}

const STYLE_T: Record<string, string> = { expander: 'Скуповує заклади й перебиває чужі дахи', smear: 'Брудна преса: б’є по народу й по ризику', informer: 'Доноси губернатору: б’є по покровителю' };

/** each magnate's house inside, with nobody in it: the room outlives every head of the house (public/art/interiors/<rival id>.jpg) */
const HOUSE: Record<string, string> = {
  r1: 'Порожня контора Солонарів над складами: стіна досягнень — від ятки з бочкою до ливарні, перша банкнота в слоїку, соляна бочка під скляним ковпаком, старі чоботи у вітрині, перші ваги, гільдійська грамота, книга боргів і сигара, що ще димить.',
  r2: 'Порожня вітальня-редакція Бергів: оксамитове крісло з мундштуком, що тліє, карикатури сохнуть на мотузках, чай із коньяком і стос конвертів, верстат біля вікна.',
  r3: 'Порожня зала замку Кречетових-Задонських: родовий герб із кречетом над каміном, спільний портрет предка з імператором на полюванні й голова оленя з того полювання, родове дерево з короною на вершині, портрети предків, плями від проданих картин, стіл на двох для почесного гостя.'
};
function RivalCard({ r, c, wide }: { r: Rival; c: NonNullable<GameState['city']>; wide: boolean }) {
  const held = G.holdings(c, r.id), lamps = Math.min(3, Math.round(r.heat / 3.3));
  return (
    <div className="tx-paper" style={{ position: 'relative', background: '#F5EDD7', padding: '20px 12px 12px', boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 0 22px rgba(140,110,50,0.22)', transform: `rotate(${wide ? 0.5 : -0.3}deg)`, zIndex: 2, borderTop: `7px solid ${r.color}` }}>
      <Clip side={wide ? 'left' : 'top'} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* a stand-in until the portrait is painted */}
        <span style={{ width: 64, height: 64, flexShrink: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${r.color}, #1F1A14 160%)`, border: `2px solid ${INK}`, boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 0 0 3px rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Ruslan Display', serif", fontSize: 28, color: '#F6EEDA', transform: 'rotate(-5deg)' }}>{r.name.split(' ').slice(-1)[0][0]}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.4, color: MUTE }}>{r.ally ? 'СОЮЗНИК' : 'СУПЕРНИК'} · {r.title.toUpperCase()}</span>
          <span style={{ display: 'block', fontSize: 22, fontWeight: 700, lineHeight: 1.08 }}>{r.name}</span>
          <span style={{ display: 'block', fontSize: 12, fontStyle: 'italic', color: MUTE, lineHeight: 1.2 }}>{STYLE_T[r.style]}</span>
        </span>
      </div>
      <Seg title="ГОЛОВНЕ">
        <div style={{ display: 'flex', gap: 8 }}>
          <Fact label="ВПЛИВ У МІСТІ">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, height: 14, border: `1.5px solid ${INK}`, background: 'rgba(0,0,0,0.08)', position: 'relative' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${r.power}%`, background: r.color }} /></span>
              <span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{Math.round(r.power)}</span>
            </span>
          </Fact>
          {r.ally
            ? <Fact label="СТАВЛЕННЯ" tone={T.clean}><span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, display: 'block' }}>Союзник: щороку знижує ваш ризик</span></Fact>
            : <Meter label="ПОЛЮЄ НА ВАС" n={lamps} tone={T.risk} icon="eye" />}
        </div>
      </Seg>
      <Seg title={`ТРИМАЄ ЗАКЛАДІВ: ${held.length}`}>
        {held.length === 0 ? <i style={{ fontSize: 14, color: MUTE }}>поки нічого</i> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {held.map((b) => <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 4px', fontSize: 14, border: `1.5px solid ${r.color}`, background: 'rgba(255,255,255,0.45)' }}><BizIcon kind={b.kind} size={20} />{b.kind.split(' ')[0]}</span>)}
          </div>
        )}
      </Seg>
      {r.last && <Seg title="ОСТАННІЙ ХІД"><span style={{ fontSize: 14, fontWeight: 700 }}>{r.last}</span></Seg>}
    </div>
  );
}

type Last = NonNullable<NonNullable<GameState['city']>['last']>;
const deltas = (res: Last) => {
  const ch: [string, (typeof T)[keyof typeof T]][] = [];
  if (res.cash > 0) ch.push([`+${G.fmt(res.cash)} брудними`, T.dirty]);
  if (res.d.i) ch.push([res.d.i > 0 ? `ризик +${res.d.i}` : `ризик ${res.d.i}`, res.d.i > 0 ? T.risk : T.clean]);
  if (res.d.n) ch.push([res.d.n > 0 ? `народ +${res.d.n}` : `народ ${res.d.n}`, res.d.n > 0 ? T.clean : T.risk]);
  if (res.d.p) ch.push([`покровитель ${res.d.p}`, T.risk]);
  if (res.d.s) ch.push([`система +${res.d.s}`, T.clean]);
  return ch;
};

/** a rubber stamp left on the card of whoever we touched today; nowhere else */
function TodayMark({ res }: { res: Last }) {
  const tone = res.ok ? T.clean : T.risk;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '4px 8px', border: `1.5px dashed ${tone.pen}`, background: 'rgba(255,255,255,0.35)' }}>
      <span style={{ flexShrink: 0, width: 58, height: 58, borderRadius: '50%', border: `3px double ${tone.ink}`, color: tone.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'nowrap', fontFamily: "'Ruslan Display', serif", fontSize: 9, lineHeight: 1.05, transform: 'rotate(-12deg)', mixBlendMode: 'multiply', opacity: 0.85 }}>{res.ok ? 'ВДАЛОСЯ' : 'ПРОВАЛ'}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: MUTE }}>СЬОГОДНІ · ВАШ ХІД</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, lineHeight: 1.15, color: tone.ink }}>{res.title}</span>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>{deltas(res).map(([l, tn]) => <span key={l} style={{ padding: '0 4px', fontSize: 12, fontWeight: 700, background: tn.note, color: tn.ink, border: `1px solid ${tn.pen}` }}>{l}</span>)}</span>
      </span>
    </div>
  );
}

/** the moment of stamping: the stamp slams onto the desk, says what happened, and lifts away */
/** the stamp lands on the result slip; the slip stays on the desk until it is read and put away */
function StampFlash({ res, onDone, s }: { res: Last; onDone: () => void; s: GameState }) {
  const tone = res.ok ? T.clean : T.risk;
  const spent = res.spent || 0, got = res.cash || 0;
  return (
    <div className="m-fade" style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(10,6,2,0.55)' }}>
      <style>{'@keyframes sf-slam{0%{transform:rotate(-4deg) scale(2.6);opacity:0}40%{transform:rotate(-9deg) scale(.94);opacity:1}60%{transform:rotate(-8deg) scale(1)}100%{transform:rotate(-8deg) scale(1)}}'}</style>
      <div role="dialog" aria-label={res.title} className="tx-paper m-pop" style={{ width: '100%', maxWidth: 340, padding: '16px 16px 16px', background: '#F5EDD7', boxShadow: '0 16px 30px rgba(0,0,0,0.7)', textAlign: 'center', transform: 'rotate(.6deg)' }}>
        <div style={{ display: 'inline-block', padding: '4px 16px', border: `4px double ${tone.ink}`, color: tone.ink, fontFamily: "'Ruslan Display', serif", fontSize: 28, letterSpacing: 3, mixBlendMode: 'multiply', animation: 'sf-slam .5s cubic-bezier(.5,0,.75,0) both' }}>{res.ok ? 'ВДАЛОСЯ' : 'ПРОВАЛ'}</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, lineHeight: 1.15 }}>{res.title}</div>
        <div style={{ fontSize: 14, lineHeight: 1.35, marginTop: 4, color: MUTE }}>{res.text}</div>
        {deltas(res).length > 0 && <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>{deltas(res).map(([l, tn]) => <span key={l} style={{ padding: '2px 8px', fontSize: 12, fontWeight: 700, background: tn.note, color: tn.ink, border: `1px solid ${tn.pen}` }}>{l}</span>)}</div>}
        {/* the purse after this move: what went out, what came in, what is left */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '8px 12px', border: `1px dashed ${MUTE}`, fontSize: 14, textAlign: 'left' }}>
          <span style={{ flex: 1 }}>
            {spent > 0 && <span style={{ display: 'block', color: T.risk.ink, fontWeight: 700 }}>−{G.fmt(spent)} кр. {res.spentClean ? 'чистими' : 'брудними'}</span>}
            {got > 0 && <span style={{ display: 'block', color: T.clean.ink, fontWeight: 700 }}>+{G.fmt(got)} кр. брудними</span>}
            {!spent && !got && <span style={{ display: 'block', color: MUTE }}>Гроші не рухалися</span>}
          </span>
          <span style={{ textAlign: 'right' }}><span style={{ display: 'block', fontSize: 10, letterSpacing: 1.2, color: MUTE }}>ЗАЛИШОК</span><b>{G.fmt(G.dirtyTotal(s))}</b> брудних · <b>{G.fmt(s.clean)}</b> чистих</span>
        </div>
        <DeskBtn kind="brass" style={{ width: '100%', marginTop: 16 }} onClick={onDone}>Прочитано</DeskBtn>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0', borderBottom: '1px solid rgba(31,26,20,0.18)' }}>
      <span style={{ width: 40, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>{pin}</span>
      <span style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', fontSize: 16 }}>{title}</b><span style={{ display: 'block', fontSize: 12, color: MUTE, lineHeight: 1.25 }}>{text}</span></span>
    </div>
  );
  const H = ({ t }: { t: string }) => <div style={{ margin: '8px 0 2px', fontSize: 10, letterSpacing: 2, fontWeight: 700, color: RED }}>{t}</div>;
  return (
    <div onClick={onClose} className="m-fade" style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(20,12,4,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '56px 12px 12px' }}>
      <div className="tx-paper m-pop" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxHeight: '100%', overflowY: 'auto', background: '#F5EDD7', padding: '12px 12px 12px', boxShadow: '0 14px 30px rgba(0,0,0,0.7), inset 0 0 24px rgba(140,110,50,0.25)', border: `1.5px solid ${INK}` }}>
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
        <H t="МІСЬКІ УСТАНОВИ" />
        <Row pin={<svg viewBox="-5 -5 10 10" width="30" height="30"><defs><linearGradient id="lg-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6E3A1" /><stop offset="1" stopColor="#A67F2E" /></linearGradient></defs><circle r="4.4" fill="url(#lg-brass)" stroke={INK} strokeWidth=".4" /><circle r="3.3" fill="#FBF4DC" /><path d={INST_GLYPH.press} transform="scale(1.1)" fill="none" stroke={INK} strokeWidth=".5" strokeLinecap="round" /></svg>} title="Латунний медальйон" text="Сиротинець, «Вісник», ринок, жандармерія: тут відмивають ім’я й гасять чутки. Кільце на землі дихає, поки цього року тут можна зробити хід." />
        <div style={{ marginTop: 8, fontSize: 12, fontStyle: 'italic', color: MUTE }}>Кожен заклад, кожен можновладець і кожна установа — по одному ходу на рік. Будівлі без таблички (собор, ратуша, вокзал) — лише орієнтири. Торкніться будівлі — з’явиться її картка.</div>
      </div>
    </div>
  );
}

const STYLE_N: Record<string, string> = { expander: 'Скуповує заклади й перебиває чужі дахи', smear: 'Б’є пресою — по народу й по ризику', informer: 'Пише доноси губернатору — б’є по покровителю' };
const RULED = 'repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 27px, rgba(70,90,130,0.22) 27px 28px)';

/** «Розклад сил»: the character's working notebook. One index tab per magnate; the page holds his file, his shops and the moves open against him. */
function PowerSheet({ c, selR, onSel, children }: { c: NonNullable<GameState['city']>; selR: string; onSel: (id: string) => void; children: React.ReactNode }) {
  const rv = c.rivals.find((r) => r.id === selR) || c.rivals[0];
  const f = G.rivalFile(rv);
  const held = G.holdings(c, rv.id), lamps = Math.min(3, Math.round(rv.heat / 3.3));
  const [page, setPage] = useState<'deal' | 'bio'>('deal');
  const surname = (n: string) => (n.split(' ').pop() || n).split('-')[0]; // «Пані Ельза Берг» → «Берг», «Граф Кречетов-Задонський» → «Кречетов»
  return (
    <div style={{ position: 'relative', color: INK }}>
      {/* index tabs sticking out of the top edge of the pages */}
      <div style={{ display: 'flex', gap: 4, padding: '0 8px', position: 'relative', zIndex: 1, marginBottom: -2 }}>
        {c.rivals.map((r) => {
          const on = r.id === rv.id, hot = !r.ally && r.heat >= 5;
          return (
            <button key={r.id} onClick={() => onSel(r.id)} style={{ flex: 1, minWidth: 0, position: 'relative', padding: `${on ? 10 : 7}px 4px ${on ? 9 : 5}px`, marginTop: on ? 0 : 5, fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: on ? INK : '#F6EEDA', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              background: on ? 'linear-gradient(180deg,#F6EEDA,#EFE3C2)' : r.color, border: `1.5px solid ${INK}`, borderBottom: on ? 'none' : `1.5px solid ${INK}`, borderTop: `5px solid ${r.color}`, borderRadius: '5px 5px 0 0', boxShadow: on ? 'none' : 'inset 0 -6px 8px rgba(0,0,0,0.3)' }}>
              {G.didAct(c, r.id) && <span aria-label="хід зроблено" style={{ marginRight: 4 }}>✓</span>}{surname(r.name)}{hot && <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 3, width: 8, height: 8, borderRadius: '50%', background: RED, border: '1px solid #F6EEDA' }} />}
            </button>
          );
        })}
      </div>
      {/* the page: ruled paper, a red margin line, holes on the left */}
      <div className="tx-paper" style={{ position: 'relative', background: `${RULED} 0 14px / 100% 100% repeat-y, linear-gradient(180deg,#F6EEDA,#EDE1BF)`, padding: '12px 12px 12px 34px', border: `1.5px solid ${INK}`, boxShadow: '0 10px 22px rgba(0,0,0,0.6), inset 0 0 26px rgba(140,110,50,0.25)' }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 26, top: 0, bottom: 0, width: 1.5, background: 'rgba(190,60,50,0.55)' }} />
        {[18, 110, 202, 294].map((y) => <span key={y} aria-hidden="true" style={{ position: 'absolute', left: 7, top: y, width: 12, height: 12, borderRadius: '50%', background: '#2A1D12', boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.4)' }} />)}

        {children}
        {/* the house inside, pasted at the head of the page: who works there and how the house lives */}
        {/* the house photo with the head of the house clipped to its top left corner */}
        <div style={{ position: 'relative', margin: '6px 0 10px' }}>
          <img key={rv.id} src={`art/interiors/${rv.id}.jpg`} alt={HOUSE[rv.id] || ''} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            style={{ display: 'block', width: '100%', aspectRatio: '2 / 1', objectFit: 'cover', objectPosition: '50% 42%', border: `2px solid ${INK}`, boxShadow: '2px 4px 8px rgba(0,0,0,0.4)', transform: 'rotate(0.6deg)', filter: 'sepia(0.12) contrast(1.03)' }} />
          <span role="img" aria-label={rv.name} style={{ position: 'absolute', left: -10, top: -6, width: 86, height: 114, background: `url(${G.rivalPortrait(rv)}) center top / cover, radial-gradient(circle at 40% 30%, ${rv.color}, #1F1A14 190%)`, border: '4px solid #FBF6E6', outline: `1px solid ${INK}`, boxShadow: '3px 6px 12px rgba(0,0,0,0.55)', transform: 'rotate(-4deg)' }}>
            {/* the paperclip holding the portrait to the photo */}
            <svg aria-hidden="true" viewBox="0 0 18 46" width="18" height="46" style={{ position: 'absolute', left: 30, top: -22, overflow: 'visible', transform: 'rotate(6deg)', filter: 'drop-shadow(1px 2px 1.5px rgba(0,0,0,0.55))' }}>
              <path d="M6 32 V9 a4.5 4.5 0 0 1 9 0 V36 a6.5 6.5 0 0 1 -13 0 V13" fill="none" stroke="#7D838B" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M6 32 V9 a4.5 4.5 0 0 1 9 0 V36 a6.5 6.5 0 0 1 -13 0 V13" fill="none" stroke="#E4E8EC" strokeWidth=".8" strokeLinecap="round" transform="translate(-.5 -.5)" />
            </svg>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 10, letterSpacing: 1.6, color: rv.ally ? T.clean.ink : RED, fontWeight: 700 }}>{rv.ally ? 'РОДИЧ · СОЮЗНИК' : 'СУПЕРНИК'}</span>
            <span style={{ display: 'block', fontFamily: HAND, fontSize: 28, lineHeight: 1.02 }}>{rv.name}</span>
            <span style={{ display: 'block', fontSize: 14, fontStyle: 'italic', marginTop: 2 }}>{rv.title}</span>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              <span style={{ padding: '2px 8px', fontSize: 14, fontWeight: 700, background: '#FFF8E0', border: `1.5px solid ${INK}` }}>{f.age} років</span>
              <span style={{ padding: '2px 8px', fontSize: 14, fontWeight: 700, background: '#FFF8E0', border: `1.5px solid ${INK}`, lineHeight: 1.25 }}>{f.from[0].toUpperCase() + f.from.slice(1)}</span>
            </span>
          </span>
        </div>

        {/* two leaves of the same file: the business, then the person; no long scroll */}
        <div role="tablist" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {([['deal', 'Справи'], ['bio', rv.f ? 'Про неї' : 'Про нього']] as const).map(([k, t]) => (
            <button key={k} role="tab" aria-selected={page === k} className="b3d" onClick={() => setPage(k)}
              style={{ flex: 1, minHeight: 36, padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: SERIF, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                color: page === k ? '#F6EEDA' : INK, background: page === k ? INK : 'rgba(255,255,255,0.5)', border: `1.5px solid ${INK}`, boxShadow: page === k ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '0 2px 0 rgba(31,26,20,0.6)' }}>{t}</button>
          ))}
        </div>
        {page === 'deal' ? <>
        <Seg title="СТАН СПРАВ">
          <div style={{ display: 'flex', gap: 8 }}>
            <Fact label="ВПЛИВ"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{Math.round(rv.power)}<span style={{ fontSize: 14 }}>/100</span></span></Fact>
            {rv.ally ? <Fact label="СТАВЛЕННЯ" tone={T.clean}><span style={{ fontSize: 14, fontWeight: 700, display: 'block', lineHeight: 1.2 }}>Союзник</span></Fact> : <Meter label="ПОЛЮЄ" n={lamps} tone={T.risk} icon="eye" />}
            <Fact label="ЗАКЛАДІВ"><span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1 }}>{held.length}</span></Fact>
          </div>
          <div style={{ marginTop: 4, fontSize: 14, color: MUTE }}>{STYLE_N[rv.style]}.</div>
          {rv.last && <div style={{ marginTop: 2, fontFamily: HAND, fontSize: 18 }}>Вночі: {rv.last}</div>}
          {G.resultFor(c, rv.id) && <TodayMark res={G.resultFor(c, rv.id)!} />}
        </Seg>

        <Seg title={`ЗАКЛАДИ ПІД ${rv.f ? 'ЇЇ' : 'ЙОГО'} РУКОЮ: ${held.length}`}>
          {held.length === 0 ? <i style={{ fontSize: 14, color: MUTE }}>Поки нічого. {rv.f ? 'Вона' : 'Він'} ще придивляється.</i> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {held.map((b) => (
                <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 4px', border: `1.5px solid ${rv.color}`, background: 'rgba(255,255,255,0.5)' }}>
                  <BizIcon kind={b.kind} size={26} />
                  <span style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}><b style={{ display: 'block', fontSize: 14 }}>{G.bizTitle(b)}</b><span style={{ fontSize: 12, color: MUTE }}>{G.DISTRICTS[b.district].t} · {b.owner}</span></span>
                  <span style={{ fontFamily: HAND, fontSize: 18, color: T.dirty.ink }}>~{G.fk(b.wealth)}</span>
                </span>
              ))}
            </div>
          )}
        </Seg>
        </> : (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: HAND, fontSize: 16, lineHeight: '22px' }}>{f.bio}</div>
          <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.3 }}><b>Любить:</b> {f.likes}.</div>
          <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.3, padding: '4px 8px', background: T.dirty.note, borderLeft: `4px solid ${T.dirty.pen}` }}><b>Слабке місце:</b> {f.weak}.</div>
          <div style={{ marginTop: 4, fontFamily: HAND, fontSize: 18, color: T.risk.ink }}>{f.quote}</div>
        </div>)}
      </div>
    </div>
  );
}

/** one move against a magnate, as a compact tool in the fixed strip under the notebook */
function ToolChip({ o, on, locked, onPick }: { o: ActOption; on: boolean; locked: boolean; onPick: () => void }) {
  const can = o.can && !locked, tone = oddsTone(o.odds);
  const edge = o.act === 'expose' ? T.risk.pen : o.act === 'marry' ? T.clean.pen : T.hide.pen;
  return (
    <button onClick={() => can && onPick()} disabled={!can} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 8, textAlign: 'center', cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.55, fontFamily: SERIF, color: INK,
      background: on ? '#FFF8E0' : 'rgba(246,238,218,0.93)', border: `1.5px solid ${on ? INK : 'rgba(31,26,20,0.35)'}`, borderTop: `5px solid ${edge}`, boxShadow: on ? '0 0 0 2px #B8913C, 0 5px 10px rgba(0,0,0,0.5)' : '0 3px 6px rgba(0,0,0,0.4)', transform: on ? 'translateY(-3px)' : 'none', transition: 'transform .15s' }}>
      <b style={{ fontSize: 14, lineHeight: 1.1 }}>{o.t}</b>
      {can ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: HAND, fontSize: 18, lineHeight: 1.05, padding: '0 4px', background: tone.note, color: tone.ink, border: `1px solid ${tone.pen}` }}>{Math.round(o.odds * 100)}%</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: T.risk.ink }}><Ic k="threat" size={12} color={T.risk.ink} />+{o.risk}</span>
      </span> : <span style={{ fontSize: 10, color: MUTE, lineHeight: 1.15 }}>{o.why}</span>}
    </button>
  );
}

/** the notebook itself, lying on the desk: leather, stitching, brass corners, a ribbon and the index tabs peeking out */
function NotebookBtn({ rivals, hostile, onClick }: { rivals: Rival[]; hostile: number; onClick: () => void }) {
  const corner = (pos: CSSProperties) => <span aria-hidden="true" style={{ position: 'absolute', width: 13, height: 13, background: 'linear-gradient(135deg,#F0D78C,#B8913C 55%,#7A5A1E)', border: '1px solid #4A3812', ...pos }} />;
  return (
    <button className="b3d" onClick={onClick} aria-label="Розклад сил" style={{ position: 'relative', minHeight: 56, padding: '8px 24px 8px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left', fontFamily: SERIF, color: '#F0D78C',
      background: 'radial-gradient(120% 140% at 30% 0%, #6B4429 0%, #4A2D1A 55%, #33200F 100%)', border: '2px solid #1E120A', borderRadius: 5, boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,220,160,0.25), inset 0 -3px 6px rgba(0,0,0,0.45)' }}>
      {/* index tabs peeking from the page edge */}
      <span aria-hidden="true" style={{ position: 'absolute', right: -6, top: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
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
        <span style={{ display: 'block', whiteSpace: 'nowrap', fontFamily: "'Ruslan Display', serif", fontSize: 18, letterSpacing: 1, textShadow: '0 -1px 0 rgba(0,0,0,0.85), 0 1px 0 rgba(255,235,180,0.35)' }}>Розклад сил</span>
        <span style={{ display: 'block', whiteSpace: 'nowrap', fontSize: 12, color: '#D9C79B', fontStyle: 'italic' }}>{hostile > 0 ? `${hostile} полює на вас` : 'можновладці міста'}</span>
      </span>
      {hostile > 0 && <span style={{ position: 'absolute', top: -8, left: -6, minWidth: 22, height: 22, padding: '0 4px', background: RED, color: '#F6EEDA', fontSize: 14, fontWeight: 700, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1E120A', boxShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>{hostile}</span>}
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
  const [panel, setPanel] = useState<null | 'biz' | 'riv' | 'inst'>(rivalFocus ? 'riv' : bizFocus ? 'biz' : null);
  const [selI, setSelI] = useState<G.InstId>('charity');
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
  const inst = panel === 'inst' ? G.INSTS.find((i) => i.id === selI) || null : null;
  const acts: ActOption[] = rv ? G.rivalActs(s, rv) : inst ? G.instActs(s, inst.id) : panel === 'biz' && b && b.status === 'open' ? G.bizActs(s, b) : [];
  // never pre-select a risky move against a magnate (e.g. «Здати її»): the player has to pick it on purpose
  const cur = acts.find((o) => o.act === pick && o.can) || acts.find((o) => o.can && (!rv || o.risk === 0)) || null;

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
      const bp = b ? layoutShops(c.biz)[b.id] || b : null;
      const px = bp && panel === 'biz' ? bp.x : inst ? inst.x : 100, py = bp && panel === 'biz' ? bp.y : inst ? inst.y - 6 : 110;
      sc.scrollTo({ left: ((px + 4) / 208) * w - sc.clientWidth / 2, top: ((py + 4) / 228) * h - sc.clientHeight / 2, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(tm);
  }, [sel, selI, panel, zoom]);
  useEffect(() => setPick(null), [sel, selR, selI, panel]);

  const [flash, setFlash] = useState(false);
  const stamp = () => {
    if (!cur) return;
    setFlash(true);
    if (rv) run((x) => G.actOnRival(x, rv.id, cur.act as RivalAct));
    else if (inst) run((x) => G.actOnInst(x, inst.id, cur.act as G.InstAct));
    else if (b) run((x) => G.actOnBiz(x, b.id, cur.act as BizAct));
  };
  const rivMode = (panel as string) === 'riv';
  const last = c.last;
  // one move per unit per turn: each shop and each magnate can be dealt with once a day
  const unit = rv ? rv.id : inst ? 'i:' + inst.id : panel === 'biz' && b ? b.id : null;
  const used = unit ? G.didAct(c, unit) : false;
  const left = G.movesLeft(s), most = G.movesMax(s);
  const marks = (c.today || []).filter((r) => !r.rival).map((r) => ({ biz: r.biz, ok: r.ok }));
  // places where a move can still be made this year: their brass ring breathes
  const live = new Set<string>(left > 0 ? G.INSTS.filter((i) => !G.didAct(c, 'i:' + i.id) && G.instActs(s, i.id).some((o) => o.can)).map((i) => i.id) : []);
  const doneT = rv ? `З ${rv.f ? 'нею' : 'ним'} цього року вже говорили. Наступна розмова — наступного року.` : inst ? 'Тут цього року вже були. Знову — наступного року.' : 'Цей заклад цього року вже відвідували. Знову — наступного року.';
  const doneNote = used ? <div style={{ fontSize: 14, fontStyle: 'italic', color: rivMode ? INK : '#E9E1C2', padding: '4px 2px' }}>{doneT}</div> : null;
  const hostile = c.rivals.filter((r) => !r.ally && r.heat >= 5).length;
  const PILL_W = 128;
  const pill: CSSProperties = { display: 'flex', alignItems: 'center', boxSizing: 'border-box', height: 30, padding: '0 9px', borderRadius: 15, background: 'linear-gradient(180deg, rgba(46,32,18,0.9), rgba(26,18,10,0.9))', border: '1px solid #6E531E', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', color: '#F1E6C8' };
    const plaque: CSSProperties = { background: 'linear-gradient(180deg, rgba(46,32,18,0.94), rgba(26,18,10,0.94))', border: '1.5px solid #6E531E', boxShadow: '0 4px 10px rgba(0,0,0,0.6)', color: '#F1E6C8' };

  const card = panel === 'riv' ? (rv ? <RivalCard r={rv} c={c} wide={false} /> : null) : inst ? <>{<InstCard p={inst} s={s} />}{G.resultFor(c, 'i:' + inst.id) && <div style={{ background: '#F5EDD7', padding: '0 8px 8px', marginTop: -8 }}><TodayMark res={G.resultFor(c, 'i:' + inst.id)!} /></div>}</> : b ? <>{<Blank b={b} wide={false} rv={bRival} />}{G.resultFor(c, b.id) && <div style={{ background: '#F5EDD7', padding: '0 8px 8px', marginTop: -8 }}><TodayMark res={G.resultFor(c, b.id)!} /></div>}</> : <div style={{ fontSize: 14, fontStyle: 'italic', color: '#E9E1C2' }}>Торкніться закладу на плані.</div>;
  const actions = used
    ? doneNote
    : rv && rv.ally ? <div style={{ fontSize: 14, fontStyle: 'italic', color: (rivMode ? INK : '#E9E1C2'), padding: '4px 2px' }}>Дім скріплено шлюбом. Він більше не полює на вас.</div>
    : acts.length
      ? <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{acts.map((o) => <ActCard key={o.act} o={o} on={cur?.act === o.act} locked={used} onPick={() => setPick(o.act)} />)}</div>
      : panel === 'biz' && b ? <div style={{ fontSize: 14, fontStyle: 'italic', color: (rivMode ? INK : '#E9E1C2'), padding: '4px 2px' }}>{b.status === 'roof' ? 'Платить щороку. Поки платить — не чіпаємо.' : 'Заклад закрито. Тут уже нічого не взяти.'}</div> : null;

  return (
    <div ref={root} className="tx-wood" style={{ position: 'absolute', inset: 0, zIndex: 70, background: '#1A120A', display: 'flex', flexDirection: 'column', fontFamily: SERIF, color: INK }}>
      {flash && last && <StampFlash res={last} s={s} onDone={() => setFlash(false)} />}
      {/* the whole plan; it shrinks only while a card is open */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, minWidth: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={sheet} className="tx-paper" style={{ flex: 1, minHeight: 0, overflow: 'auto', background: PAPER, border: 'none', scrollbarWidth: 'none' }}>
          <Plan live={live} marks={marks} biz={c.biz} sel={panel === 'biz' ? sel : null} onPick={(id) => { setSel(id); setPanel('biz'); }} zoom={zoom} rivals={c.rivals} selInst={panel === 'inst' ? selI : null} onInst={(id) => { setSelI(id); setPanel('inst'); }} onRival={(id) => { setSelR(id); setPanel('riv'); }} />
        </div>
        {/* floating furniture: small pills in the top left (moves, then the purse), close, zoom, legend.
            No title bar: the map keeps its top edge, district names and buildings stay visible. */}
        <div style={{ position: 'absolute', left: 8, top: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, pointerEvents: 'none' }}>
          <span aria-label={left > 0 ? `Ходів на рік: ${left} з ${most}` : 'Ходи на рік вичерпано'} style={{ ...pill, minWidth: PILL_W, gap: 6 }}>
            <span style={{ fontSize: 10, letterSpacing: 1.2, color: '#D9C79B', fontWeight: 700 }}>ХОДИ</span>
            <span aria-hidden="true" style={{ display: 'flex', gap: 3 }}>{Array.from({ length: most }, (_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i < left ? 'radial-gradient(circle at 35% 30%, #FFE7A0, #C9962E)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(240,215,140,0.55)', boxShadow: i < left ? '0 0 4px rgba(255,200,90,0.6)' : 'none' }} />)}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: left > 0 ? '#F1E6C8' : '#A89A7A' }}>{left}/{most}</span>
          </span>
          {/* the purse: dirty pays for most moves, clean for charity */}
          {([['брудні', G.dirtyTotal(s), '#E3B866'], ['чисті', s.clean, '#9FD3A8']] as const).map(([l, v, col]) => (
            <span key={l + v} className="m-pop" aria-label={`${l}: ${G.fmt(v)} кр.`} style={{ ...pill, width: PILL_W, gap: 5, paddingLeft: 3 }}>
              <img src="art/brand/crown.png" alt="" aria-hidden="true" style={{ width: 22, height: 22, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }} />
              <span style={{ minWidth: 36, fontSize: 15, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>{G.fk(v)}</span>
              <span style={{ fontSize: 10, letterSpacing: 0.6, color: '#CDBB8E' }}>{l}</span>
            </span>
          ))}
        </div>
        <button onClick={onClose} aria-label="Згорнути план" style={{ position: 'absolute', right: 10, top: 10, width: 40, height: 40, ...plaque, fontSize: 22, fontWeight: 700, cursor: 'pointer', borderRadius: 4 }}>✕</button>
        {panel === null && <div style={{ position: 'absolute', left: 10, bottom: 12 }}><NotebookBtn rivals={c.rivals} hostile={hostile} onClick={() => setPanel('riv')} /></div>}
        {panel !== 'riv' && <div style={{ position: 'absolute', right: 10, bottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setKey((v) => !v)} aria-label="Умовні знаки" style={{ width: 46, height: 46, fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: '#F1E6C8', background: 'linear-gradient(180deg, rgba(60,42,22,0.96), rgba(30,20,10,0.96))', border: '1.5px solid #B8913C', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>?</button>
          {([['+', 0.2], ['−', -0.2]] as const).map(([l, d]) => <button key={l} onClick={() => setZoom((z) => Math.min(2, Math.max(minZ(), +(z + d).toFixed(2))))} style={{ width: 46, height: 46, fontSize: 28, fontWeight: 700, fontFamily: SERIF, color: INK, background: 'linear-gradient(180deg,#E2C374,#B8913C 60%,#9A7630)', border: '1.5px solid #4A3812', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)', cursor: 'pointer' }}>{l}</button>)}
        </div>}
        {key && <Legend rivals={c.rivals} onClose={() => setKey(false)} />}
      </div>

      {panel !== null && (
        <div key={panel} className="m-sheet" style={{ flexShrink: 0, maxHeight: panel === 'riv' ? '93%' : '64%', display: 'flex', flexDirection: 'column', margin: '0 4px', padding: '8px 8px 8px', background: 'linear-gradient(180deg, rgba(26,18,10,0.97), rgba(20,13,7,0.99))', border: '1.5px solid #6E531E', borderBottom: 'none', boxShadow: '0 -10px 24px rgba(0,0,0,0.6)' }}>
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 2px 4px' }}>
            {panel === 'riv' ? <PowerSheet c={c} selR={selR} onSel={setSelR}>{null}</PowerSheet> : <>{card}{actions}</>}
          </div>
          {rivMode && rv && (used ? <div style={{ flexShrink: 0, paddingTop: 8, fontSize: 14, fontStyle: 'italic', color: '#E9E1C2' }}>{doneT}</div> : (
            <div style={{ flexShrink: 0, paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, letterSpacing: 1.6, fontWeight: 700, color: '#D9C79B', marginBottom: 4 }}>ЩО ЗРОБИТИ З {G.rivalCase(rv, 'ins').toUpperCase()} · 1 ХІД<span style={{ flex: 1, height: 1, background: 'rgba(217,199,155,0.35)' }} /></div>
              {rv.ally ? <div style={{ fontSize: 14, fontStyle: 'italic', color: '#E9E1C2' }}>Дім скріплено шлюбом. {rv.f ? 'Вона' : 'Він'} більше не полює на вас.</div> : <>
                <div style={{ display: 'flex', gap: 4 }}>{acts.map((o) => <ToolChip key={o.act} o={o} on={cur?.act === o.act} locked={used} onPick={() => setPick(o.act)} />)}</div>
                {cur && !used && <div style={{ marginTop: 8, padding: '4px 8px', fontSize: 12, lineHeight: 1.3, color: '#E9E1C2', background: 'rgba(0,0,0,0.3)', borderLeft: '3px solid #B8913C' }}>
                  <b style={{ color: cur.gainT ? '#9FD7B0' : '#F0D78C' }}>{cur.gainT || `до ${G.fmt(cur.gain)} кр.`}</b>{cur.cost ? <b style={{ color: '#F4A08C' }}> · платите {G.fmt(cur.cost)} кр.</b> : null} — {cur.sub}
                </div>}
              </>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 8 }}>
            <DeskBtn style={{ flex: 1 }} onClick={() => setPanel(null)}>До карти</DeskBtn>
            {!used && <DeskBtn kind="brass" style={{ flex: 2, flexDirection: 'column', gap: 0, lineHeight: 1.1 }} disabled={!cur} onClick={stamp}>
              {cur ? <><span style={{ fontSize: 10, letterSpacing: 1.6, opacity: 0.75 }}>ПРОШТАМПУВАТИ</span><span>{cur.t}</span></> : 'Оберіть дію'}
            </DeskBtn>}
          </div>
        </div>
      )}
    </div>
  );
}
