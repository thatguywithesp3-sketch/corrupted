// The office after the last document: the day's register on the desk. Nothing moves on until the player
// ends the day, so the city map is still there for this year's moves.
import * as G from '../../engine';
import type { GameState, StampKind } from '../../engine';
import { DeskBtn, GREEN, INK, Ic, MUTE, RED, SERIF } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const STAMP: Record<StampKind, { t: string; c: string }> = {
  signed: { t: 'ПІДПИСАНО', c: GREEN },
  declined: { t: 'ВІДМОВЛЕНО', c: MUTE },
  decided: { t: 'ВИРІШЕНО', c: '#23356A' },
  dark: { t: 'ТЕМНА СПРАВА', c: RED }
};

export function DayDone({ s, run, onMap }: { s: GameState; run: Run; onMap: () => void }) {
  const log = s.dayLog || [];
  const left = G.movesLeft(s), max = G.movesMax(s);
  return (
    <div style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 4px 0', fontFamily: SERIF, color: INK }}>
      <div className="tx-paper m-paper-in" style={{ position: 'relative', flex: 1, minHeight: 0, margin: '0 4px', padding: '12px 12px 8px', background: '#F1E8CF', transform: 'rotate(-0.4deg)', boxShadow: '0 14px 24px rgba(0,0,0,0.6), inset 0 0 30px rgba(150,110,50,0.22)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 2, color: MUTE }}><span>ДЕННИК УРЯДОВЦЯ</span><span>{s.year} р.</span></div>
        <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 24, lineHeight: 1.1, marginTop: 2 }}>Справи дня закрито</div>
        <div style={{ borderTop: `3px double ${INK}`, margin: '4px 0 8px' }} />

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {log.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, width: 82, padding: '2px 0', textAlign: 'center', border: `2px double ${STAMP[e.stamp].c}`, color: STAMP[e.stamp].c, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, transform: `rotate(${i % 2 ? 2 : -2}deg)`, mixBlendMode: 'multiply' }}>{STAMP[e.stamp].t}</span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: 14, lineHeight: 1.2 }}>{e.t}</b>
                <span style={{ display: 'block', fontSize: 12, fontStyle: 'italic', color: MUTE, lineHeight: 1.25 }}>У завтрашній газеті: «{e.h}»</span>
              </span>
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '8px 8px', border: `1.5px solid ${INK}`, outline: `1px solid ${INK}`, outlineOffset: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic k="floor" size={22} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.3 }}>
              <b style={{ display: 'block', fontSize: 14 }}>{left > 0 ? 'Місто ще чекає' : 'Ходи на цей рік використано'}</b>
              {left > 0 ? `Ходів на карті цього року: ${left} із ${max}. Можна зробити їх зараз, до вечора.` : 'Наступні ходи будуть уранці нового року.'}
            </span>
            <DeskBtn style={{ flexShrink: 0, minHeight: 40, fontSize: 14, padding: '0 12px' }} onClick={onMap}>Карта</DeskBtn>
          </div>
        </div>
      </div>

      <DeskBtn kind="brass" style={{ flexShrink: 0, minHeight: 56, flexDirection: 'column', gap: 0, lineHeight: 1.1 }} onClick={() => run(G.endDay)}>
        <span style={{ fontSize: 18 }}>Завершити день →</span>
        <span style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.75 }}>ДАЛІ ВЕЧІР: ЧОРНА КНИГА Й СЕЙФ</span>
      </DeskBtn>
    </div>
  );
}
