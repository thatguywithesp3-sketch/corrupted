import type { GameState } from '../../engine';
import * as G from '../../engine';

// At the end of an era the heir is picked together with the family's goal for the new era: the old goal belongs to
// the old world (a manor on the hill means nothing in 1914). The goals are told plainly, without naming powers or
// trusts the player has not met yet; the details arrive with the new era itself.
const INK = '#1F1A14', MUTE = '#6B5A3C', SERIF = "'Old Standard TT', 'PT Serif', serif";

export function DreamPick({ s, heirId, onPick, onBack }: { s: GameState; heirId: string; onPick: (dream: number) => void; onBack: () => void }) {
  const h = s.heirs.find((x) => x.id === heirId);
  const dreams = G.getEra(s.era + 1).dreams;
  return (
    <div role="dialog" aria-label="Мета роду на нову епоху" style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'rgba(12,8,4,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: SERIF }}>
      <div className="tx-paper" style={{ position: 'relative', width: '100%', maxHeight: '100%', overflowY: 'auto', background: '#F5EDD7', color: INK, padding: '16px 14px 14px', boxShadow: '0 16px 30px rgba(0,0,0,0.7)', transform: 'rotate(-0.4deg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: MUTE, textAlign: 'center' }}>НОВА ЕПОХА · МЕТА РОДУ</div>
        <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>Чого прагнутиме {h ? h.first + ' ' + s.surname : 'спадкоємець'}?</div>
        <div style={{ fontSize: 13, fontStyle: 'italic', textAlign: 'center', color: MUTE, marginBottom: 4 }}>Старий світ скінчився, і стара мета разом із ним. Оберіть, до чого рід ітиме в нову добу.</div>
        {dreams.map((d, i) => (
          <button key={i} className="b3d" onClick={() => onPick(i)} style={{ minHeight: 52, padding: '10px 12px', textAlign: 'left', fontFamily: SERIF, color: INK, background: '#FBF6E6', border: `1.5px solid ${INK}`, boxShadow: '0 2px 0 rgba(31,26,20,.6)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{d.t}</span>
            <span style={{ fontSize: 13, fontStyle: 'italic', color: MUTE, lineHeight: 1.3 }}>{d.g}</span>
          </button>
        ))}
        <button onClick={onBack} style={{ alignSelf: 'center', marginTop: 4, padding: '6px 12px', fontFamily: SERIF, fontSize: 13, color: MUTE, background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>← Інший спадкоємець</button>
      </div>
    </div>
  );
}
