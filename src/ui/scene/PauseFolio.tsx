// The pause menu as a thing on the desk: the family's leather folio. It opens over the papers, shows that
// the game has already been written down (autosave, a wax seal), and offers the three ways out of the moment.
import { useState } from 'react';
import * as G from '../../engine';
import type { GameState } from '../../engine';
import { FamilyTree } from '../FamilyTree';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const PART: Record<string, string> = { form: 'анкета', morning: 'ранок', office: 'день у кабінеті', evening: 'вечір', night: 'ніч', campaign: 'виборча кампанія', elect: 'вибори', ending: 'кінець служби' };

function Leaf({ title, sub, onClick, kind = 'paper' }: { title: string; sub: string; onClick: () => void; kind?: 'paper' | 'leather' }) {
  const dark = kind === 'leather';
  return (
    <button className={'b3d ' + (dark ? 'tx-leather' : 'tx-paper')} onClick={onClick}
      style={{ position: 'relative', width: '100%', minHeight: 58, padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: "'Old Standard TT', serif",
        background: dark ? 'linear-gradient(180deg, #3A2A1A, #241A10)' : 'linear-gradient(180deg, #F7EFD8, #E9DDBA)', color: dark ? '#E6D9BC' : '#1F1A14',
        border: dark ? '1px solid #6E531E' : '1px solid #8C7A54', borderRadius: 3, boxShadow: dark ? '0 3px 0 #120c06, inset 0 0 0 3px rgba(176,141,60,0.22)' : '0 3px 0 #6E5A36, 0 6px 10px rgba(0,0,0,0.35)' }}>
      <b style={{ display: 'block', fontSize: 17 }}>{title}</b>
      <span style={{ display: 'block', fontSize: 12.5, fontStyle: 'italic', opacity: 0.8 }}>{sub}</span>
    </button>
  );
}

export function PauseFolio({ s, onClose, onExit }: { s: GameState; onClose: () => void; onExit: () => void }) {
  const [tree, setTree] = useState(false);
  if (tree) return <div style={{ position: 'absolute', inset: 0, zIndex: 96 }}><FamilyTree save={s} onBack={() => setTree(false)} /></div>;
  const name = s.screen === 'form' ? 'Новий рід' : `${G.rankName(s)} ${s.first} ${s.surname}`;
  return (
    <div onClick={onClose} className="m-fade" style={{ position: 'absolute', inset: 0, zIndex: 96, background: 'rgba(8,4,2,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 18px' }}>
      {/* the folio: dark leather cover with tooled border and brass corners */}
      <div className="m-pop" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', padding: 12, borderRadius: 6, background: 'radial-gradient(120% 90% at 30% 0%, #5A2E22, #3A1C14 60%, #26110B)', border: '2px solid #1A0B06', boxShadow: '0 22px 44px rgba(0,0,0,0.8), inset 0 0 0 3px rgba(200,160,80,0.35), inset 0 0 0 4px rgba(0,0,0,0.5)', fontFamily: "'Old Standard TT', serif" }}>
        {[{ top: -2, left: -2 }, { top: -2, right: -2 }, { bottom: -2, right: -2 }, { bottom: -2, left: -2 }].map((p, i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', ...p, width: 18, height: 18, background: 'linear-gradient(135deg,#F0D78C,#B8913C 55%,#7A5A1E)', border: '1px solid #4A3812', clipPath: ['polygon(0 0,100% 0,0 100%)', 'polygon(0 0,100% 0,100% 100%)', 'polygon(100% 0,100% 100%,0 100%)', 'polygon(0 0,100% 100%,0 100%)'][i] }} />)}
        <div style={{ textAlign: 'center', padding: '4px 0 10px', color: '#E8C878', textShadow: '0 -1px 0 rgba(0,0,0,0.8)' }}>
          <div style={{ fontSize: 10, letterSpacing: 3 }}>СПРАВИ РОДУ</div>
          <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 24, lineHeight: 1.1 }}>Рід {s.surname || '—'}</div>
        </div>
        {/* the page: where we are, and the proof it is written down */}
        <div className="tx-paper" style={{ position: 'relative', background: 'linear-gradient(180deg,#F3EAD2,#E9DDBE)', padding: '12px 14px', border: '1px solid #8C7A54', boxShadow: 'inset 0 0 24px rgba(120,90,40,0.3)', color: '#1F1A14' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#5A4630' }}>ЕПОХА {ROMAN[s.era - 1]} · ПОКОЛІННЯ {s.gen}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, paddingRight: 70 }}>{name}</div>
          <div style={{ fontSize: 13.5, fontStyle: 'italic', color: '#5A4630' }}>{s.year} рік · {PART[s.screen] || s.screen}</div>
          <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.35 }}>Гра записується сама після кожного рішення. Можна вийти будь-коли: повернетеся рівно сюди.</div>
          <span aria-hidden="true" style={{ position: 'absolute', right: 10, top: 10, width: 62, height: 62, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: 1, lineHeight: 1.1, color: '#F6E3D0',
            background: 'radial-gradient(circle at 35% 30%, #D2503A, #8E1F12 70%, #5A1008)', boxShadow: '0 3px 5px rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,200,180,0.35), inset 0 -3px 4px rgba(40,0,0,0.5)', transform: 'rotate(-10deg)' }}>ЗАПИ-<br />САНО</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
          <Leaf title="Повернутися до справ" sub="Продовжити з того самого місця" onClick={onClose} />
          {s.screen !== 'form' && <Leaf title="Галерея предків" sub="Родовід і долі всіх голів роду" onClick={() => setTree(true)} />}
          <Leaf kind="leather" title="Вийти до головного меню" sub="Усе вже збережено" onClick={onExit} />
        </div>
      </div>
    </div>
  );
}
