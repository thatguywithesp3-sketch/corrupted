// The chronicle between Era I and Era II: the front pages of the city paper from 1914 to 1920, one decision on each.
// The paper itself tells the story: «Вісник Порт-Аурума» with the imperial arms, then the bare «Аурумська правда»
// (the arms cut out, the Valdorian ribbon in 1918), then the red «Трибуна праці». Picking an option stamps the
// consequence on the page; «Далі» turns to the next year.
import { useState, type CSSProperties } from 'react';
import * as G from '../../engine';
import type { GameState } from '../../engine';
import { INK, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const PAPER: Record<G.ChronPage['paper'], { bg: string; title: string; font: string; band?: string; ink: string; sub: string }> = {
  visnyk: { bg: '#F1E8CF', title: 'ВІСНИК ПОРТ-АУРУМА', font: "'Ruslan Display', serif", ink: INK, sub: 'ЩОДЕННА ГАЗЕТА МІСТА · ЗАСНОВАНА 1801' },
  pravda: { bg: '#E8E1CC', title: 'АУРУМСЬКА ПРАВДА', font: "'Old Standard TT', serif", ink: INK, sub: 'ГАЗЕТА ВІЛЬНОГО ПОРТ-АУРУМА' },
  tribuna: { bg: '#E3DAC2', title: 'ТРИБУНА ПРАЦІ', font: "'Ruslan Display', serif", band: '#A3241A', ink: '#F4E9D0', sub: 'ОРГАН МІСЬКОЇ РАДИ ТРУДОВИХ ДЕПУТАТІВ' }
};
const LABEL: Record<string, string> = { p: 'влада', n: 'народ', s: 'система', i: 'ризик', cash: 'брудні', clean: 'чисті', floor: 'під підлогою' };
const good = (k: string, v: number) => (k === 'i' ? v < 0 : v > 0);
const CSS = `
@keyframes chr-in { from { opacity: 0; transform: translateY(40px) rotate(2.5deg) scale(.97); } to { opacity: 1; transform: rotate(var(--tilt)); } }
@keyframes chr-stamp { 0% { opacity: 0; transform: scale(1.6) rotate(-14deg); } 60% { opacity: 1; transform: scale(.94) rotate(-8deg); } 100% { opacity: 1; transform: scale(1) rotate(-8deg); } }
@keyframes chr-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
`;

export function Chronicle({ s, run }: { s: GameState; run: Run }) {
  const step = s.chron?.step ?? 0, page = G.CHRONICLE[step];
  const [picked, setPicked] = useState<number | null>(null);
  if (!page) return null;
  const P = PAPER[page.paper], last = step === G.CHRONICLE.length - 1;
  const o = picked === null ? null : page.opts[picked];
  const next = () => { const i = picked!; setPicked(null); run((x) => G.chronPick(x, i)); };
  const tilt = step % 2 ? '0.6deg' : '-0.5deg';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'radial-gradient(ellipse at 50% 0%, #4A3420, #1A120A 70%)', display: 'flex', flexDirection: 'column', fontFamily: SERIF, color: INK, overflow: 'hidden' }}>
      <style>{CSS}</style>
      {/* the years of the chronicle */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px 8px', color: '#E6D9BC' }}>
        <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, opacity: 0.75 }}>ХРОНІКА РОДУ {s.surname.toUpperCase()}</span>
        {G.CHRONICLE.map((p, i) => (
          <span key={p.year} style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: i === step ? '#B8913C' : 'transparent', color: i === step ? '#1F1A14' : i < step ? '#B8A77E' : '#6E604A', border: '1px solid ' + (i <= step ? '#B8913C' : '#4A3E2C') }}>{p.year}</span>
        ))}
      </div>

      {/* the front page */}
      <div key={step} className="tx-paper" style={{ ['--tilt' as string]: tilt, position: 'relative', flex: 1, minHeight: 0, margin: '4px 12px 0', background: P.bg, boxShadow: '0 16px 30px rgba(0,0,0,.7), inset 0 0 40px rgba(130,100,50,.25)', transform: `rotate(${tilt})`, animation: 'chr-in .55s cubic-bezier(.2,.8,.2,1) both', display: 'flex', flexDirection: 'column', overflow: 'hidden' } as CSSProperties}>
        {/* masthead */}
        <div style={{ flexShrink: 0, padding: '12px 12px 8px', background: P.band || 'transparent', color: P.band ? P.ink : INK, textAlign: 'center', borderBottom: `3px double ${P.band ? '#3A0E08' : INK}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {page.paper === 'visnyk' && <img src="art/brand/romei-arms.png" alt="" style={{ height: 34 }} />}
            {page.paper === 'pravda' && <span aria-hidden="true" title="герб вирізано" style={{ width: 26, height: 34, border: '1.5px dashed rgba(31,26,20,.45)', borderRadius: '40% 40% 50% 50%' }} />}
            <span style={{ fontFamily: P.font, fontSize: page.paper === 'pravda' ? 24 : 20, fontWeight: 700, letterSpacing: page.paper === 'pravda' ? 1 : 0.3, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{P.title}</span>
            {page.paper === 'visnyk' && <img src="art/brand/romei-arms.png" alt="" style={{ height: 34 }} />}
          </div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 1.5, opacity: 0.8 }}>
            <span>{P.sub}</span><span>{page.year}</span>
          </div>
          {page.year === 1918 && <div aria-label="вальдорська стрічка" style={{ marginTop: 4, height: 6, background: 'linear-gradient(180deg, #5B9BD5 0 33%, #1F1A14 33% 66%, #E8C33A 66%)' }} />}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: RED }}>{page.kicker}</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.12 }}>{page.h}</div>
          <img src={`art/news/${page.art}.jpg`} alt="" style={{ width: '100%', aspectRatio: '2.2 / 1', objectFit: 'cover', border: `1px solid ${INK}`, filter: `grayscale(${0.15 + step * 0.22}) sepia(${0.35 + step * 0.1}) contrast(1.05)` }} />
          <div style={{ fontSize: 14, lineHeight: 1.35 }}>{page.lead}</div>

          {o === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: MUTE }}>ЩО РОБИТЬ {s.first.toUpperCase()} {s.surname.toUpperCase()}</div>
              {page.opts.map((x, i) => (
                <button key={i} className="b3d" onClick={() => setPicked(i)} style={{ minHeight: 48, padding: '8px 12px', textAlign: 'left', fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: INK, background: '#FBF6E6', border: `1.5px solid ${INK}`, boxShadow: '0 2px 0 rgba(31,26,20,.6)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, animation: `chr-fade .4s ease-out ${0.25 + i * 0.08}s both` }}>
                  <span>{x.t}</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {Object.entries(x.d).filter(([, v]) => v).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 12, fontWeight: 700, padding: '0 6px', borderRadius: 8, color: good(k, v!) ? '#1E5A34' : '#8E1F12', background: good(k, v!) ? 'rgba(63,138,90,.14)' : 'rgba(184,50,42,.12)' }}>{LABEL[k]} {v! > 0 ? '+' : '−'}{Math.abs(v!)}</span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ position: 'relative', marginTop: 4, padding: '12px 12px 12px', border: `1.5px solid ${INK}`, background: 'rgba(255,255,255,.35)', animation: 'chr-fade .35s ease-out both' }}>
              <div style={{ fontSize: 16, fontWeight: 700, paddingRight: 84 }}>{o.t}</div>
              <div style={{ marginTop: 4, fontSize: 14, fontStyle: 'italic', lineHeight: 1.35 }}>{o.b}</div>
              <span aria-hidden="true" style={{ position: 'absolute', right: 8, top: 8, padding: '2px 8px', border: `2px double ${RED}`, color: RED, fontSize: 12, fontWeight: 700, letterSpacing: 1, mixBlendMode: 'multiply', animation: 'chr-stamp .45s cubic-bezier(.2,.8,.2,1) both' }}>ЗАПИСАНО</span>
            </div>
          )}
        </div>
      </div>

      {/* turn the page */}
      <div style={{ flexShrink: 0, padding: '12px 12px 16px' }}>
        <button className="b3d" disabled={o === null} onClick={next} style={{ width: '100%', minHeight: 52, padding: '12px 16px', fontFamily: SERIF, fontSize: 16, fontWeight: 700, textAlign: 'center', color: o ? '#1F1A14' : '#8A7A5A', background: o ? 'linear-gradient(180deg,#E8CB7A,#B8913C 60%,#9A7630)' : 'linear-gradient(180deg,#3A2E1E,#2A2016)', border: '1.5px solid #6E531E', borderRadius: 4, cursor: o ? 'pointer' : 'default', boxShadow: o ? '0 3px 0 #5A4012' : 'none' }}>
          {o === null ? 'Оберіть, що робить голова роду' : last ? 'Нова доба: 1921 →' : `Далі: ${G.CHRONICLE[step + 1].year} →`}
        </button>
      </div>
    </div>
  );
}
