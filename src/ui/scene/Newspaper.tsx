// Morning: the city paper. Front page about you, an engraving from the city, the city chronicle
// (new shops, complaints, closures — each one a lead you can follow on the city plan), prices and the
// exchange, your secret goal. One move per morning on the plan, then off to work.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as G from '../../engine';
import type { GameState } from '../../engine';
import { CityMap } from './CityMap';
import { T } from './Ledger';
import { DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;
/* eslint-disable @typescript-eslint/no-explicit-any */

const NEWS = '#EFE7D2';
const Rule = ({ double }: { double?: boolean }) => <div style={{ borderTop: double ? `3px double ${INK}` : `1px solid ${INK}`, margin: '5px 0' }} />;
const ColHead = ({ t }: { t: string }) => <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.8, textAlign: 'center', borderTop: `1.5px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: '2px 0', margin: '2px 0 5px' }}>{t}</div>;

/** a newspaper engraving: a piece of the city view, printed in black ink with a halftone screen */
function Engraving({ era, seed, caption }: { era: number; seed: number; caption: string }) {
  const x = 15 + ((seed * 37) % 70), y = 30 + ((seed * 53) % 50);
  return (
    <figure style={{ margin: 0 }}>
      <div style={{ position: 'relative', height: 112, border: `1px solid ${INK}`, overflow: 'hidden', background: '#ddd' }}>
        <img src={`art/city/e${era}-morning.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${x}% ${y}%`, transform: 'scale(1.8)', transformOrigin: `${x}% ${y}%`, filter: 'grayscale(1) contrast(1.55) brightness(1.08) sepia(0.25)' }} />
        <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.35, backgroundImage: 'radial-gradient(circle, #000 0.6px, transparent 0.9px)', backgroundSize: '3px 3px' }} />
      </div>
      <figcaption style={{ fontSize: 9.5, fontStyle: 'italic', color: MUTE, marginTop: 2, lineHeight: 1.2 }}>{caption}</figcaption>
    </figure>
  );
}

export function Newspaper({ s, run, v }: { s: GameState; run: Run; v: any }) {
  useEffect(() => { if (!s.city) run(G.ensureCity); }, [s.city, run]);
  const [map, setMap] = useState<string | null | false>(false);
  const c = s.city;
  const tv = Math.min(100, Math.max(0, s.threat)), stage = tv < 35 ? 1 : tv < 70 ? 2 : 3;
  const e = c?.econ, p = c?.prev;
  const arrow = (a?: number, b?: number, good = 1) => (a === undefined || b === undefined || a === b ? <span style={{ color: MUTE }}>—</span> : <span style={{ color: (a > b ? 1 : -1) * good > 0 ? T.clean.ink : T.risk.ink }}>{a > b ? '▲' : '▼'}</span>);
  const leads = (c?.news || []).filter((n) => n.kind !== 'flavor');
  const flavor = (c?.news || []).filter((n) => n.kind === 'flavor');
  const bizOf = (id?: string) => c?.biz.find((b) => b.id === id);

  return (
    <div style={{ position: 'relative', zIndex: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 4px 0', fontFamily: SERIF, color: INK }}>
      {/* how loud the press is about you */}
      <div style={{ position: 'absolute', left: 18, top: 2, zIndex: 2, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', background: '#1F1A14', color: '#E6D9BC', fontSize: 9.5, fontWeight: 700, letterSpacing: 1.4, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
        ВИ В ГАЗЕТІ
        <span style={{ display: 'flex', gap: 2 }}>{[1, 2, 3].map((k) => <span key={k} style={{ width: 14, height: 7, background: k <= stage ? '#E8603F' : '#3D3328' }} />)}</span>
        <span style={{ fontWeight: 400, letterSpacing: 0.4, color: stage === 3 ? '#E8603F' : '#E6D9BC' }}>{['дрібна замітка', 'про вас пишуть', 'ВИ НА ПЕРШІЙ ШПАЛЬТІ'][stage - 1]}</span>
      </div>

      <div className="tx-paper" style={{ position: 'relative', flex: 1, minHeight: 0, background: NEWS, transform: 'rotate(-0.8deg)', boxShadow: '0 14px 24px rgba(0,0,0,0.6), inset 0 0 30px rgba(150,110,50,0.18)', display: 'flex', flexDirection: 'column' }}>
        {/* the fold */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'linear-gradient(90deg, rgba(0,0,0,0.08), rgba(255,255,255,0.4))', pointerEvents: 'none' }} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 12px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: MUTE }}><span>Т. XIV · № {v.issueNo} · Ранок, {s.year}</span><span>Ціна 5 кр.</span></div>
          <Rule />
          <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 25, textAlign: 'center', lineHeight: 1 }}>Вісник Порт-Аурума</div>
          <Rule double />
          <div style={{ fontSize: 8.5, letterSpacing: 2, textAlign: 'center', color: MUTE }}>МІСТО · ТОРГІВЛЯ · ГРОМАДСЬКІ РОБОТИ · ВИХОДИТЬ ЩОРАНКУ</div>
          <Rule />

          {/* front page */}
          <div style={{ fontSize: 21, fontWeight: 700, textAlign: 'center', lineHeight: 1.12, margin: '6px 0 6px', position: 'relative' }}>
            {stage >= 2 && <span style={{ position: 'absolute', inset: '-6px -4px', border: `2px solid ${RED}`, borderRadius: '50%', opacity: 0.55, transform: 'rotate(-2deg)' }} />}
            {s.headline}
          </div>
          {v.hasYest && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 5, padding: '4px 6px', margin: '0 0 6px', border: '1.5px dashed #8C7E58', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, color: MUTE }}>
              ЧЕРЕЗ ВАШЕ РІШЕННЯ «{v.yestT}»:
              {v.yestPills.map((x: any, i: number) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 7px 1px 4px', borderRadius: 9, background: x.bg, border: `1.5px solid ${x.bd}`, color: x.fg, fontSize: 11 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={x.ic.stroke} strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d={x.ic.path} /></svg>{x.text}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 9 }}>
            <div style={{ width: '46%', flexShrink: 0 }}><Engraving era={s.era} seed={s.year + s.served} caption="Замальовка нашого художника з Ратушної площі." /></div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.35, textAlign: 'justify', hyphens: 'auto' }}><span style={{ float: 'left', fontFamily: "'Ruslan Display', serif", fontSize: 30, lineHeight: 0.9, marginRight: 3 }}>{s.body.charAt(0)}</span>{s.body.slice(1)}</p>
          </div>
          <Rule double />

          {/* two columns: chronicle | prices */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1.35, minWidth: 0 }}>
              <ColHead t="МІСЬКА ХРОНІКА" />
              {leads.length === 0 && <div style={{ fontSize: 11.5, fontStyle: 'italic', color: MUTE }}>У місті тихо. Нових закладів не відкривали.</div>}
              {leads.map((n, i) => {
                const b = bizOf(n.biz), live = b && b.status === 'open';
                return (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.15, color: n.kind === 'complaint' || n.kind === 'closed' ? RED : INK }}>{n.head}</div>
                    <div style={{ fontSize: 11, lineHeight: 1.3, textAlign: 'justify' }}>{n.text}</div>
                    {live && (
                      <button onClick={() => setMap(b!.id)} style={{ marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', background: 'transparent', border: `1.5px solid ${RED}`, borderRadius: 12, cursor: 'pointer', fontFamily: HAND, fontSize: 15, color: RED, transform: 'rotate(-1.5deg)' }}>
                        ✎ обвести · на плані
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ColHead t="БІРЖА Й ЦІНИ" />
              {e && p && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <tbody>
                    {([['Торгівля в порту', e.trade + '%', arrow(e.trade, p.trade)], ['Зерно, бушель', e.grain.toFixed(1) + ' кр.', arrow(e.grain, p.grain, -1)], ['Крона', e.crown, arrow(e.crown, p.crown)], ['Міська казна', G.fk(e.treasury), arrow(e.treasury, p.treasury)]] as const).map(([k, val, a]) => (
                      <tr key={k} style={{ borderBottom: '1px dotted rgba(31,26,20,0.35)' }}>
                        <td style={{ padding: '2px 0', lineHeight: 1.15 }}>{k}</td>
                        <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{val} {a}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ fontSize: 9.5, fontStyle: 'italic', color: MUTE, marginTop: 3, lineHeight: 1.25 }}>Коли торгівля росте, заклади заробляють більше — і більше можуть «віддячити».</div>
              <ColHead t="З СВІТУ" />
              {flavor.map((n, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.15 }}>{n.head}</div>
                  <div style={{ fontSize: 10.5, lineHeight: 1.25 }}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 8, padding: '6px 9px', border: `1.5px solid ${INK}`, outline: `1px solid ${INK}`, outlineOffset: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.6 }}>ВАША МЕТА</div>
            <div style={{ fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.25 }}>{v.dreamText}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <DeskBtn style={{ flex: 1, fontSize: 14, position: 'relative' }} onClick={() => setMap(null)}>
          <Ic k="floor" size={18} /> План міста
          {c && !c.acted && <span style={{ position: 'absolute', top: -7, right: -5, padding: '1px 6px', background: RED, color: '#F6EEDA', fontSize: 9.5, fontWeight: 700, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>1 хід</span>}
        </DeskBtn>
        <DeskBtn kind="brass" style={{ flex: 1.4 }} onClick={() => run(G.toOffice)}>До роботи →</DeskBtn>
      </div>
      {map !== false && c && document.getElementById('overlay-root') && createPortal(
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}><CityMap s={s} run={run} focus={map} onClose={() => setMap(false)} /></div>, document.getElementById('overlay-root')!)}
    </div>
  );
}
