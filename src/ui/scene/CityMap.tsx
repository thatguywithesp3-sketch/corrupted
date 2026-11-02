// The city plan on the desk: Port-Aurum's districts, the harbour, and every business we know of.
// Tap a pin → the owner's card with the moves we can make. One move per morning.
import { useState } from 'react';
import * as G from '../../engine';
import type { Biz, BizAct, GameState } from '../../engine';
import { T } from './Ledger';
import { DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const PAPER = '#EADFC2';

/** the plan itself, drawn as an old engraved city map */
function Plan({ biz, sel, onPick }: { biz: Biz[]; sel: string | null; onPick: (id: string) => void }) {
  return (
    <svg viewBox="0 0 100 70" width="100%" style={{ display: 'block', background: PAPER }} aria-label="План Порт-Аурума">
      <defs>
        <pattern id="mp-water" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><path d="M0 1 H2" stroke="#6E8AA0" strokeWidth=".25" /></pattern>
        <pattern id="mp-block" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 .8 H1.6" stroke="#8C7E58" strokeWidth=".25" /></pattern>
        <filter id="mp-rough"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="0.6" /></filter>
      </defs>
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
      {/* businesses */}
      {biz.map((b) => {
        const on = b.id === sel, closed = b.status === 'closed', roof = b.status === 'roof';
        const col = closed ? '#8C8478' : roof ? T.clean.pen : b.grudge >= 2 ? T.risk.pen : b.pressure ? T.dirty.pen : '#F6EEDA';
        return (
          <g key={b.id} transform={`translate(${b.x} ${b.y})`} onClick={() => onPick(b.id)} style={{ cursor: 'pointer' }}>
            {on && <circle r="4.4" fill="none" stroke={RED} strokeWidth=".6" strokeDasharray="1.2 .6" />}
            <circle r="2.6" fill={col} stroke={INK} strokeWidth=".45" />
            {closed && <path d="M-1.6 -1.6 L1.6 1.6 M1.6 -1.6 L-1.6 1.6" stroke={INK} strokeWidth=".45" />}
            {roof && <path d="M-1.6 .2 L0 -1.4 L1.6 .2" stroke={INK} strokeWidth=".5" fill="none" />}
            {!closed && !roof && b.pressure > 0 && <text y=".9" textAnchor="middle" fontSize="2.4" fontWeight="700" fontFamily="serif" fill={INK}>{b.pressure}</text>}
            <circle r="5" fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}

const Dots = ({ n, max = 3, c }: { n: number; max?: number; c: string }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: max }, (_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', border: `1px solid ${c}`, background: i < n ? c : 'transparent' }} />)}</span>
);

export function CityMap({ s, run, focus, onClose }: { s: GameState; run: Run; focus: string | null; onClose: () => void }) {
  const c = s.city!;
  const [sel, setSel] = useState<string | null>(focus || c.biz.find((b) => b.status !== 'closed')?.id || null);
  const b = c.biz.find((x) => x.id === sel) || null;
  const res = c.last;
  const act = (a: BizAct) => b && run((x) => G.actOnBiz(x, b.id, a));
  const statusT = (x: Biz) => (x.status === 'closed' ? 'закрито' : x.status === 'roof' ? `під «дахом» · ${G.fmt(x.tribute)} кр./рік` : x.pressure ? `під тиском ${x.pressure}/3` : 'ще не чіпали');

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(10,6,2,0.72)', display: 'flex', flexDirection: 'column', padding: '12px 10px 12px', fontFamily: SERIF, color: INK }}>
      <div className="tx-paper" style={{ position: 'relative', background: PAPER, padding: '10px 10px 8px', transform: 'rotate(-0.5deg)', boxShadow: '0 14px 26px rgba(0,0,0,0.6), inset 0 0 30px rgba(120,90,40,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 18 }}>План Порт-Аурума</span>
          <span style={{ fontSize: 10, letterSpacing: 1.4, fontWeight: 700, color: c.acted ? RED : T.clean.ink }}>{c.acted ? 'ХІД ЗРОБЛЕНО' : 'ОДИН ХІД НА РАНОК'}</span>
        </div>
        <div style={{ border: `1.5px solid ${INK}`, marginTop: 6 }}><Plan biz={c.biz} sel={sel} onPick={setSel} /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 9.5, color: MUTE, marginTop: 4 }}>
          {[['#F6EEDA', 'не чіпали'], [T.dirty.pen, 'під тиском'], [T.clean.pen, '«дах»'], [T.risk.pen, 'образа'], ['#8C8478', 'закрито']].map(([col, t]) => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: col, border: `1px solid ${INK}` }} />{t}</span>
          ))}
        </div>
      </div>

      {/* result of this morning's move, taped on top */}
      {res && (
        <div style={{ position: 'relative', margin: '12px 8px 0', padding: '8px 10px', background: res.ok ? T.clean.note : T.risk.note, borderLeft: `5px solid ${res.ok ? T.clean.pen : T.risk.pen}`, transform: 'rotate(0.6deg)', boxShadow: '2px 4px 6px rgba(0,0,0,0.35)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: res.ok ? T.clean.ink : T.risk.ink }}>{res.title}</div>
          <div style={{ fontSize: 12, lineHeight: 1.3 }}>{res.text}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, fontWeight: 700 }}>
            {res.cash > 0 && <span style={{ color: T.dirty.ink }}>+{G.fmt(res.cash)} брудними</span>}
            {res.d.i ? <span style={{ color: T.risk.ink }}>ризик +{res.d.i}</span> : null}
            {res.d.n ? <span style={{ color: T.risk.ink }}>народ {res.d.n}</span> : null}
            {res.d.p ? <span style={{ color: T.risk.ink }}>покровитель {res.d.p}</span> : null}
            {res.d.s ? <span style={{ color: T.clean.ink }}>система +{res.d.s}</span> : null}
          </div>
        </div>
      )}

      {/* the owner's card */}
      {b && (
        <div className="tx-paper" style={{ position: 'relative', marginTop: 12, flex: 1, minHeight: 0, overflowY: 'auto', background: '#F4ECD6', padding: '10px 12px', boxShadow: '0 10px 18px rgba(0,0,0,0.5)', transform: 'rotate(0.3deg)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 9.5, letterSpacing: 1.4, color: MUTE }}>{G.DISTRICTS[b.district].t.toUpperCase()} · З {b.opened} Р.</span>
              <span style={{ display: 'block', fontSize: 17, fontWeight: 700, lineHeight: 1.15 }}>{G.bizTitle(b)}</span>
              <span style={{ display: 'block', fontSize: 12.5, fontStyle: 'italic' }}>{b.owner}{b.tie === 'press' ? ' · дружить із газетою' : b.tie === 'patron' ? ' · вхожий до губернатора' : ''}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: 9, letterSpacing: 1, color: MUTE }}>ОБОРОТ</span>
              <span style={{ fontFamily: HAND, fontSize: 22, color: T.dirty.ink }}>~{G.fk(b.wealth)}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 11, margin: '6px 0', color: MUTE }}>
            <span>тиск <Dots n={b.pressure} c={T.dirty.ink} /></span>
            <span>образа <Dots n={b.grudge} c={T.risk.ink} /></span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: b.status === 'roof' ? T.clean.ink : b.status === 'closed' ? MUTE : INK }}>{statusT(b)}</span>
          </div>
          {b.status === 'open' ? G.bizActs(s, b).map((o) => {
            const can = o.can && !c.acted;
            return (
              <button key={o.act} onClick={() => can && act(o.act)} disabled={!can}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', padding: '7px 8px', marginTop: 5, cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.5, fontFamily: SERIF, color: INK,
                  background: 'rgba(255,255,255,0.45)', border: `1.5px solid ${o.act === 'seal' ? T.risk.pen : o.act === 'roof' ? T.clean.pen : T.dirty.pen}`, borderLeftWidth: 5 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5 }}>{o.t}</b>
                  <span style={{ display: 'block', fontSize: 11, lineHeight: 1.25, color: MUTE }}>{!o.can && o.why ? o.why : o.sub}</span>
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.risk.ink, whiteSpace: 'nowrap' }}><Ic k="threat" size={12} color={T.risk.ink} /> +{o.risk}</span>
              </button>
            );
          }) : <div style={{ fontSize: 12, fontStyle: 'italic', color: MUTE }}>{b.status === 'roof' ? 'Платить щороку. Поки платить — не чіпаємо.' : 'Заклад закрито. Тут уже нічого не взяти.'}</div>}
          {c.acted && <div style={{ fontSize: 11, fontStyle: 'italic', color: RED, marginTop: 6 }}>Сьогодні хід уже зроблено. Наступний — завтра зранку.</div>}
        </div>
      )}
      <DeskBtn kind="brass" style={{ marginTop: 10, flexShrink: 0 }} onClick={onClose}>Згорнути план</DeskBtn>
    </div>
  );
}
