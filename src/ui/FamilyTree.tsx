// «Історія роду»: the ancestors' wall. Every head of the family hangs in a gilded frame on the damask,
// founder at the top, a gilt cord running down to the living head. Frames are grouped by era under a brass
// plate. Tap a frame: the museum card for that life comes forward (rank, years, how it ended, what was passed on).
// Design law: frames, plates and the card are objects with weight: gilt with a lit edge, a cast shadow on the wall.
import { useState, type CSSProperties } from 'react';
import * as G from '../engine';
import type { GameState } from '../engine';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
type H = GameState['history'][number] & { alive?: boolean };

const END: Record<string, { m: string; f: string; c: string }> = {
  collapse: { m: 'ВИКРИТИЙ', f: 'ВИКРИТА', c: '#9A2418' },
  retire: { m: 'НА СПОКОЇ', f: 'НА СПОКОЇ', c: '#2F6A45' },
  flee: { m: 'ВТІК', f: 'ВТЕКЛА', c: '#6E531E' },
  summit: { m: 'НА ВЕРШИНІ', f: 'НА ВЕРШИНІ', c: '#8C6A1E' }
};

const GILT = 'linear-gradient(135deg, #F6E3A0 0%, #C9A04A 22%, #7A5A1E 48%, #D9B464 70%, #8A6726 100%)';
const CSS = `
@keyframes ft-in { from { opacity: 0; transform: translateY(12px) scale(0.97); } }
@keyframes ft-card { from { opacity: 0; transform: translateY(18px) scale(0.95); } }
.ft-frame { animation: ft-in 380ms cubic-bezier(0.23, 1, 0.32, 1) both; transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1); }
.ft-frame:active { transform: translateY(2px) scale(0.98); }
.ft-card { animation: ft-card 300ms cubic-bezier(0.23, 1, 0.32, 1) both; }
@media (prefers-reduced-motion: reduce) { .ft-frame, .ft-card { animation: m-fade 200ms ease both; } .ft-frame:active { transform: none; } }
`;

/** a gilded oval frame with the sitter's portrait; silhouette when no portrait was painted for that era */
function Frame({ h, size = 96, onClick, delay = 0 }: { h: H; size?: number; onClick?: () => void; delay?: number }) {
  const src = G.portraitFor(h.era, h.gen, h.g || 'm', h.face);
  const W = size, Hh = size * 1.28;
  return (
    <button className="ft-frame" onClick={onClick} aria-label={h.name} style={{ position: 'relative', width: W + 18, height: Hh + 18, padding: 0, border: 'none', background: 'none', cursor: onClick ? 'pointer' : 'default', animationDelay: `${delay}ms`, filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.65)) drop-shadow(8px 16px 14px rgba(0,0,0,0.45))' }}>
      {/* the gilt: outer ring with a lit upper-left edge, a dark inner lip */}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: GILT, boxShadow: 'inset 2px 3px 2px rgba(255,248,214,0.8), inset -3px -4px 4px rgba(60,36,8,0.7)' }} />
      <span style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: 'linear-gradient(315deg, #F2D98C, #6E531E)', boxShadow: 'inset 0 0 0 1px rgba(40,24,4,0.7)' }} />
      <span style={{ position: 'absolute', inset: 9, borderRadius: '50%', overflow: 'hidden', background: src ? `#2A1A10 url(${src}) center 18% / cover` : 'radial-gradient(circle at 50% 35%, #6A5038, #241812 75%)', boxShadow: 'inset 0 0 14px rgba(0,0,0,0.75)' }}>
        {!src && <svg viewBox="0 0 60 77" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}><circle cx="30" cy="30" r="12" fill="#140C08" opacity=".8" /><path d="M8 77 C8 50 52 50 52 77 Z" fill="#140C08" opacity=".8" /></svg>}
        {/* varnish: the lamp catches the glass-like old varnish */}
        <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 35% 18%, rgba(255,240,200,0.22), transparent 70%)' }} />
      </span>
      {/* the ending, as a small enamel badge pinned to the frame */}
      {!h.alive && END[h.kind] && <span style={{ position: 'absolute', right: -4, bottom: 10, padding: '2px 6px', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#F6EEDA', background: END[h.kind].c, border: '1.5px solid #2A1A08', borderRadius: 3, boxShadow: '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)', fontFamily: "'Old Standard TT', serif" }}>{END[h.kind][h.g === 'f' ? 'f' : 'm']}</span>}
      {h.alive && <span style={{ position: 'absolute', right: -4, bottom: 10, padding: '2px 6px', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#2A1B08', background: GILT, border: '1.5px solid #4A3812', borderRadius: 3, boxShadow: '0 2px 3px rgba(0,0,0,0.6)', fontFamily: "'Old Standard TT', serif" }}>ГОЛОВА РОДУ</span>}
    </button>
  );
}

/** an engraved brass name plate under the frame */
const Plate = ({ h }: { h: H }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '3px 10px 4px', marginTop: 2, background: 'linear-gradient(180deg, #EBD08A, #B8913C 55%, #8A6726)', border: '1px solid #4A3812', borderRadius: 2, boxShadow: '0 3px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,246,214,0.75), inset 0 -1px 0 rgba(60,40,10,0.5)', color: '#2A1B08', fontFamily: "'Old Standard TT', serif", textShadow: '0 1px 0 rgba(255,240,200,0.5)', maxWidth: 160 }}>
    <b style={{ fontSize: 12.5, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{h.name}</b>
    <span style={{ fontSize: 10, fontStyle: 'italic' }}>{h.from && h.to ? `${h.from}–${h.to}` : `покоління ${h.gen}`}{h.alive ? ' · живий' : ''}</span>
  </span>
);

function Card({ h, onClose }: { h: H; onClose: () => void }) {
  const src = G.portraitFor(h.era, h.gen, h.g || 'm', h.face);
  const end = END[h.kind];
  const row = (k: string, v: string, c?: string): React.ReactNode => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', borderBottom: '1px dotted rgba(60,40,20,0.35)', fontSize: 13.5 }}><span style={{ color: '#5A4630' }}>{k}</span><b style={{ color: c || '#1F1A14', textAlign: 'right' }}>{v}</b></div>;
  return (
    <div onClick={onClose} className="m-fade" style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(6,3,2,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div className="tx-paper ft-card" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxHeight: '100%', overflowY: 'auto', background: '#F3EAD2', color: '#1F1A14', padding: '16px 16px 14px', border: '1px solid #8C7A54', boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(140,100,40,0.25)', fontFamily: "'Old Standard TT', serif" }}>
        <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: 3, color: '#5A4630' }}>ЕПОХА {ROMAN[h.era - 1]} · ПОКОЛІННЯ {h.gen}</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
          <span style={{ width: 92, height: 118, flexShrink: 0, background: src ? `url(${src}) center 18% / cover` : 'radial-gradient(circle at 50% 35%, #6A5038, #241812 75%)', border: '6px solid transparent', borderImage: `${GILT} 1`, boxShadow: '0 6px 10px rgba(0,0,0,0.5)' }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontFamily: "'Marck Script', cursive", fontSize: 28, lineHeight: 1.05 }}>{h.name}</span>
            <span style={{ display: 'block', fontSize: 14, fontStyle: 'italic', marginTop: 3 }}>{h.rank || h.title}</span>
            {h.from && h.to && <span style={{ display: 'block', fontSize: 13, color: '#5A4630', marginTop: 2 }}>{h.from}–{h.to} · {h.to - h.from} р. на службі</span>}
          </span>
        </div>
        {h.alive ? (
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(63,138,90,0.15)', border: '1.5px solid #3F8A5A', fontSize: 14, fontWeight: 700, color: '#2F6A45' }}>Живий голова роду. Його історію ще пишуть.</div>
        ) : (
          <>
            <div style={{ position: 'relative', marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.4)', borderLeft: `5px solid ${end?.c || '#5A4630'}` }}>
              <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: end?.c }}>ЯК СКІНЧИЛОСЯ</div>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>{h.title}</div>
              {h.text && <div style={{ fontSize: 13.5, lineHeight: 1.35, marginTop: 4 }}>{h.text}</div>}
              {end && <span aria-hidden="true" style={{ position: 'absolute', right: 8, top: 6, padding: '2px 8px', border: `3px double ${end.c}`, color: end.c, fontFamily: "'Ruslan Display', serif", fontSize: 13, transform: 'rotate(-8deg)', opacity: 0.8, mixBlendMode: 'multiply' }}>{end[h.g === 'f' ? 'f' : 'm']}</span>}
            </div>
            <div style={{ marginTop: 10 }}>
              {row('Передав роду', G.fmt(h.inherit) + ' кр.', '#2F6A45')}
              {h.lost ? row('Втрачено', G.fmt(h.lost) + ' кр.', '#9A2418') : null}
              {h.kids !== undefined && row('Дітей', String(h.kids))}
              {h.dream !== undefined && row('Мрія', h.dream ? 'здійснилася' : 'не здійснилася', h.dream ? '#2F6A45' : '#5A4630')}
            </div>
          </>
        )}
        <button className="b3d" onClick={onClose} style={{ width: '100%', marginTop: 14, minHeight: 48, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', color: '#F3E9D2', background: 'linear-gradient(180deg, #2E261C, #1F1A14)', border: '2px solid #6E531E', borderRadius: 3, boxShadow: '0 3px 0 #4A3812', cursor: 'pointer' }}>Повернутися до галереї</button>
      </div>
    </div>
  );
}

export function FamilyTree({ save, onBack }: { save: GameState | null; onBack: () => void }) {
  const [open, setOpen] = useState<H | null>(null);
  const list: H[] = [...(save?.history || [])];
  if (save && !save.ending && save.screen !== 'form') list.push({ era: save.era, gen: save.gen, name: save.first + ' ' + save.surname, kind: 'retire', title: '', inherit: 0, g: save.gender, face: save.face, rank: G.rankName(save), from: save.year - save.served, alive: true });
  const eras = Array.from(new Set(list.map((h) => h.era)));
  const cord: CSSProperties = { width: 3, height: 26, margin: '0 auto', background: 'linear-gradient(90deg, #6E531E, #F2D98C, #6E531E)', boxShadow: '1px 2px 2px rgba(0,0,0,0.6)' };
  let n = 0;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Old Standard TT', serif", color: '#E6D9BC',
      background: 'radial-gradient(ellipse 70% 30% at 50% 0%, rgba(255,196,120,0.22), transparent 70%), repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 22px), radial-gradient(circle at 50% 40%, #4A1410, #1E0806 80%)' }}>
      <style>{CSS}</style>
      <div style={{ flexShrink: 0, textAlign: 'center', padding: '26px 20px 10px' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#D9B870' }}>Галерея предків</div>
        <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 26, color: '#E8C978', textShadow: '0 2px 0 #3A2408, 0 0 18px rgba(232,201,120,0.25)' }}>Рід {save?.surname}</div>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#BFAE86', marginTop: 2 }}>Торкніться портрета, щоб прочитати табличку</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 16px 20px' }}>
        {list.length === 0 && <div style={{ textAlign: 'center', marginTop: 60, fontStyle: 'italic', color: '#BFAE86' }}>Стіна ще порожня.</div>}
        {eras.map((era) => {
          const gens = list.filter((h) => h.era === era);
          return (
            <div key={era} style={{ marginBottom: 18 }}>
              {/* the era plate, screwed to the wall */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 12px' }}>
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #B8913C)' }} />
                <span style={{ padding: '3px 14px', fontSize: 12, letterSpacing: 2, fontWeight: 700, color: '#2A1B08', background: 'linear-gradient(180deg, #EBD08A, #B8913C 55%, #8A6726)', border: '1px solid #4A3812', boxShadow: '0 3px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,246,214,0.7)' }}>ЕПОХА {ROMAN[era - 1]}</span>
                <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #B8913C, transparent)' }} />
              </div>
              {gens.map((h, i) => {
                const d = n++ * 70;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {i > 0 && <span style={cord} />}
                    <Frame h={h} onClick={() => setOpen(h)} delay={d} />
                    <Plate h={h} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, padding: '10px 28px 26px' }}>
        <button className="b3d" onClick={onBack} style={{ width: '100%', minHeight: 54, fontSize: 17, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'inherit', color: '#E6D9BC', background: 'linear-gradient(180deg, #3A2A1A, #241A10)', border: '1px solid #6E531E', borderRadius: 3, boxShadow: '0 3px 0 #120c06, inset 0 0 0 3px rgba(176,141,60,0.25)', cursor: 'pointer' }}>Назад до галереї</button>
      </div>
      {open && <Card h={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
