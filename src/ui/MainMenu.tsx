// Main menu: "Галерея предків". Key art is a portrait gallery of the dynasty;
// the empty gilded frame in the middle holds the game's title, menu items are brass museum plaques.
import { useState } from 'react';
import * as G from '../engine';
import type { GameState } from '../engine';
import { FamilyTree } from './FamilyTree';

const ERA_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// The gallery opens like a ceremony (a rare moment, so it may take a beat): the seal is pressed in,
// the name rises under it, the plaques follow. Then only the gas lamp and a glint on the wax stay alive.
const MENU_CSS = `
@keyframes mm-press { 0% { opacity: 0; transform: scale(1.35) rotate(-8deg); } 55% { opacity: 1; transform: scale(0.96) rotate(1deg); } 100% { transform: none; } }
@keyframes mm-rise { from { opacity: 0; transform: translateY(14px); } }
@keyframes mm-flame { 0%, 100% { opacity: .85; } 20% { opacity: 1; } 35% { opacity: .7; } 60% { opacity: .95; } 80% { opacity: .78; } }
@keyframes mm-gloss { 0%, 70% { transform: translateX(-120%); } 100% { transform: translateX(260%); } }
.mm-dark { animation: mm-dark 1300ms linear both; }
.mm-cone { animation: mm-cone 1400ms linear both, mm-flame 3.2s ease-in-out 1.4s infinite; }
@keyframes mm-dark { 0%, 18% { opacity: 1; } 24% { opacity: .55; } 28% { opacity: .9; } 36% { opacity: .35; } 40% { opacity: .7; } 100% { opacity: 0; } }
@keyframes mm-cone { 0%, 18% { opacity: 0; } 24% { opacity: .8; } 28% { opacity: .2; } 36% { opacity: 1; } 40% { opacity: .6; } 100% { opacity: 1; } }
.mm-seal { animation: mm-press 700ms cubic-bezier(0.5, 0, 0.75, 0) 900ms both; }
.mm-gloss { animation: mm-gloss 6s cubic-bezier(0.77, 0, 0.175, 1) 2.2s infinite; }
.mm-word { animation: mm-rise 600ms cubic-bezier(0.23, 1, 0.32, 1) 1300ms both; }
.mm-menu > * { animation: mm-rise 420ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.mm-menu > *:nth-child(1) { animation-delay: 1450ms; }
.mm-menu > *:nth-child(2) { animation-delay: 1520ms; }
.mm-menu > *:nth-child(3) { animation-delay: 1590ms; }
.mm-flame { animation: mm-flame 3.2s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .mm-seal, .mm-word, .mm-menu > * { animation: m-fade 200ms ease both; }
  .mm-gloss, .mm-flame { animation: none; }
  .mm-dark { animation: none; opacity: 0; }
  .mm-cone { animation: none; }
}
`;


export interface MainMenuProps {
  save: GameState | null;
  onContinue: () => void;
  onNew: () => void;
}

const S = {
  root: { position: 'relative', width: 390, height: 844, overflow: 'hidden', background: '#0b0807', fontFamily: "'Old Standard TT', Georgia, serif", color: '#E6D9BC' },
  art: { position: 'absolute', inset: 0, backgroundImage: 'url(art/menu-gallery.jpg)', backgroundSize: 'auto 100%', backgroundPosition: 'center top' },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, background: 'linear-gradient(180deg, rgba(11,8,7,0) 0%, rgba(11,8,7,0.82) 38%, #0b0807 70%)' },
  title: { position: 'absolute', left: 116, top: 279, width: 160, height: 184, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center', background: 'radial-gradient(ellipse at 50% 40%, rgba(70,14,10,0.55), rgba(20,4,3,0.75))', boxShadow: 'inset 0 0 24px rgba(0,0,0,0.8)' },
  frameBg: { position: 'absolute', left: 116, top: 280, width: 162, height: 186, background: 'radial-gradient(ellipse at 50% 45%, #2A1410, #0E0705 75%)', boxShadow: 'inset 0 0 26px rgba(0,0,0,0.9)' },
  seal: { position: 'absolute', left: 112, top: 290, width: 170, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.7))', pointerEvents: 'none' },
  wordmark: { position: 'absolute', left: 30, top: 508, width: 330, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9)) drop-shadow(0 4px 14px rgba(0,0,0,0.95)) drop-shadow(0 0 30px rgba(0,0,0,0.8))', pointerEvents: 'none' },
  word: { fontFamily: "'Ruslan Display', 'Old Standard TT', serif", fontSize: 29, lineHeight: 1, color: '#E8C978', textShadow: '0 2px 0 #3A2408, 0 0 18px rgba(232,201,120,0.25)', letterSpacing: 0.5 },
  sub: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#D9B870' },
  dates: { fontSize: 12, fontStyle: 'italic', color: '#BFAE86' },
  menu: { position: 'absolute', left: 28, right: 28, bottom: 34, display: 'flex', flexDirection: 'column', gap: 12 },
  plaque: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', gap: 2, width: '100%', minHeight: 58, padding: '9px 14px', border: '1px solid #6E531E', borderRadius: 3, cursor: 'pointer', background: 'linear-gradient(180deg, #E9CF86 0%, #C29A45 48%, #9C7631 100%)', boxShadow: '0 3px 0 #4A3812, 0 8px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,244,214,0.7), inset 0 0 0 3px rgba(110,83,30,0.35)', color: '#2A1B08', fontFamily: 'inherit' },
  plaqueQuiet: { background: 'linear-gradient(180deg, #3A2A1A, #241A10)', color: '#E6D9BC', border: '1px solid #6E531E', boxShadow: '0 3px 0 #120c06, inset 0 0 0 3px rgba(176,141,60,0.25)' },
  pTitle: { fontSize: 18, lineHeight: 1.2, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' },
  pSub: { fontSize: 12, fontStyle: 'italic', opacity: 0.85 }
} as const satisfies Record<string, React.CSSProperties>;

function Plaque({ title, sub, onClick, quiet }: { title: string; sub?: string; onClick: () => void; quiet?: boolean }) {
  return (
    <button className="b3d" onClick={onClick} style={{ ...S.plaque, ...(quiet ? S.plaqueQuiet : {}) }}>
      <span style={S.pTitle}>{title}</span>
      {sub && <span style={S.pSub}>{sub}</span>}
    </button>
  );
}

export function MainMenu({ save, onContinue, onNew }: MainMenuProps) {
  const [panel, setPanel] = useState<'none' | 'confirm' | 'history'>('none');
  const inProgress = !!save && save.screen !== 'form' && !(save.ending && save.heirs.length === 0);
  const history = save?.history || [];
  const where = save ? `Епоха ${ERA_ROMAN[save.era - 1]} · ${save.year} · ${G.rankName(save)} ${save.first.charAt(0)}. ${save.surname}` : '';

  return (
    <div style={S.root}>
      <div style={S.art} />
      <div style={S.shade} />
      <div style={S.frameBg} />
      <style>{MENU_CSS}</style>
      {/* the room is dark when you come in; the gas lamp over the gallery catches, flickers and lights the portraits */}
      <div aria-hidden="true" className="mm-dark" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: '#050302' }} />
      <div aria-hidden="true" className="mm-cone" style={{ position: 'absolute', left: '50%', top: -40, width: 520, height: 720, marginLeft: -260, pointerEvents: 'none', background: 'radial-gradient(ellipse 42% 60% at 50% 4%, rgba(255,214,150,0.32), rgba(255,180,100,0.08) 55%, transparent 75%)', mixBlendMode: 'screen' }} />
      {/* the lamp over the gallery breathes a little, like a gas flame */}
      <div aria-hidden="true" className="mm-flame" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 32% at 50% 0%, rgba(255,196,120,0.22), transparent 70%)', mixBlendMode: 'screen' }} />
      {/* the family seal is pressed into the empty frame, then catches the light now and then */}
      <div className="mm-seal" style={S.seal}>
        <img src="art/brand/seal.png" alt="" style={{ width: '100%', display: 'block' }} />
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', WebkitMaskImage: 'url(art/brand/seal.png)', maskImage: 'url(art/brand/seal.png)', WebkitMaskSize: '100% auto', maskSize: '100% auto', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' }}>
          <span className="mm-gloss" style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: 0, width: '45%', background: 'linear-gradient(100deg, transparent, rgba(255,235,220,0.45), transparent)', mixBlendMode: 'screen' }} />
        </span>
      </div>
      <img className="mm-word" src="art/brand/wordmark.png" alt="Corrupted!" style={S.wordmark} />

      {panel === 'none' && (
        <div className="mm-menu" style={S.menu}>
          {inProgress && <Plaque title="Продовжити" sub={where} onClick={onContinue} />}
          <Plaque title="Нова династія" sub={inProgress ? 'Поточна гра буде втрачена' : 'Сім епох, два покоління в кожній'} onClick={() => (inProgress ? setPanel('confirm') : onNew())} quiet={inProgress} />
          {(history.length > 0 || inProgress) && <Plaque title="Історія роду" sub={history.length ? `${history.length} ${history.length === 1 ? 'покоління' : 'поколінь'} у галереї` : 'Родовідне дерево'} onClick={() => setPanel('history')} quiet />}
        </div>
      )}

      {panel === 'confirm' && (
        <div style={{ ...S.menu, gap: 10 }}>
          <div style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.35, padding: '0 6px' }}>Почати нову династію? Поточний рід ({where}) буде стерто з галереї.</div>
          <Plaque title="Так, з нуля" onClick={() => { setPanel('none'); onNew(); }} />
          <Plaque title="Ні, назад" onClick={() => setPanel('none')} quiet />
        </div>
      )}

      {panel === 'history' && <FamilyTree save={save} onBack={() => setPanel('none')} />}
    </div>
  );
}
