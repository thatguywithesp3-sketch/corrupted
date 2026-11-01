// Main menu: "Галерея предків". Key art is a portrait gallery of the dynasty;
// the empty gilded frame in the middle holds the game's title, menu items are brass museum plaques.
import { useState } from 'react';
import * as G from '../engine';
import type { GameState } from '../engine';

const ERA_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];


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
  paper: { position: 'absolute', left: 64, top: 296, width: 262, height: 168, boxSizing: 'border-box', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, background: 'linear-gradient(180deg, #F1E7CC, #E2D3AE)', color: '#2A2418', transform: 'rotate(-2deg)', boxShadow: '0 8px 18px rgba(0,0,0,0.65), inset 0 0 22px rgba(120,90,40,0.3)' },
  logo: { position: 'absolute', left: 72, top: 330, width: 246, transform: 'rotate(-5deg)', mixBlendMode: 'multiply', pointerEvents: 'none' },
  word: { fontFamily: "'Ruslan Display', 'Old Standard TT', serif", fontSize: 29, lineHeight: 1, color: '#E8C978', textShadow: '0 2px 0 #3A2408, 0 0 18px rgba(232,201,120,0.25)', letterSpacing: 0.5 },
  sub: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#D9B870' },
  dates: { fontSize: 12, fontStyle: 'italic', color: '#BFAE86' },
  menu: { position: 'absolute', left: 28, right: 28, bottom: 34, display: 'flex', flexDirection: 'column', gap: 12 },
  plaque: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', minHeight: 58, padding: '9px 14px', border: '1px solid #6E531E', borderRadius: 3, cursor: 'pointer', background: 'linear-gradient(180deg, #E9CF86 0%, #C29A45 48%, #9C7631 100%)', boxShadow: '0 3px 0 #4A3812, 0 8px 18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,244,214,0.7), inset 0 0 0 3px rgba(110,83,30,0.35)', color: '#2A1B08', fontFamily: 'inherit' },
  plaqueQuiet: { background: 'linear-gradient(180deg, #3A2A1A, #241A10)', color: '#E6D9BC', border: '1px solid #6E531E', boxShadow: '0 3px 0 #120c06, inset 0 0 0 3px rgba(176,141,60,0.25)' },
  pTitle: { fontSize: 18, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' },
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
      <div style={S.paper}>
        <span style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 700, whiteSpace: 'nowrap' }}>СПРАВА №&nbsp;1874 · ЗБЕРІГАТИ ВІЧНО</span>
        <span style={{ fontSize: 9, fontStyle: 'italic', color: '#5A4630' }}>Рід Грабсів · Вальдорія</span>
        {[78, 60, 84].map((w, i) => <span key={i} style={{ height: 3, width: w + '%', background: 'rgba(42,36,24,0.28)', marginTop: i === 0 ? 8 : 4 }} />)}
      </div>
      <img src="art/logo/stamp.png" alt="Corrupted!" style={S.logo} />

      {panel === 'none' && (
        <div style={S.menu}>
          {inProgress && <Plaque title="Продовжити" sub={where} onClick={onContinue} />}
          <Plaque title="Нова династія" sub={inProgress ? 'Поточна гра буде втрачена' : 'Сім епох, два покоління в кожній'} onClick={() => (inProgress ? setPanel('confirm') : onNew())} quiet={inProgress} />
          {history.length > 0 && <Plaque title="Історія роду" sub={`${history.length} ${history.length === 1 ? 'покоління' : 'поколінь'} у галереї`} onClick={() => setPanel('history')} quiet />}
        </div>
      )}

      {panel === 'confirm' && (
        <div style={{ ...S.menu, gap: 10 }}>
          <div style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.35, padding: '0 6px' }}>Почати нову династію? Поточний рід ({where}) буде стерто з галереї.</div>
          <Plaque title="Так, з нуля" onClick={() => { setPanel('none'); onNew(); }} />
          <Plaque title="Ні, назад" onClick={() => setPanel('none')} quiet />
        </div>
      )}

      {panel === 'history' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,5,4,0.88)', display: 'flex', flexDirection: 'column', padding: '28px 20px 24px', gap: 12 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={S.sub}>Галерея предків</span>
            <span style={{ ...S.word, fontSize: 24 }}>Рід {save?.surname}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 3, background: 'linear-gradient(180deg, #E9CF86, #B8913C)', color: '#2A1B08', boxShadow: '0 2px 0 #4A3812' }}>
                <span style={{ width: 34, textAlign: 'center', fontFamily: "'Ruslan Display', serif", fontSize: 18 }}>{ERA_ROMAN[h.era - 1]}</span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <b style={{ fontSize: 14 }}>{h.name}</b>
                  <span style={{ fontSize: 12, fontStyle: 'italic' }}>покоління {h.gen} · {h.title.toLowerCase()}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{G.fmt(h.inherit)} кр.</span>
              </div>
            ))}
          </div>
          <Plaque title="Назад до галереї" onClick={() => setPanel('none')} quiet />
        </div>
      )}
    </div>
  );
}
