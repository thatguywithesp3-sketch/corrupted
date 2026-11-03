// The family's own place in the HUD: a brass-edged mahogany rail with an oval cameo per child
// (and brother / sister), loyalty as a coloured ring, empty frames for children still to come.
// Tap → the family album.
import * as G from '../../engine';
import type { GameState, Kin } from '../../engine';
import { HAND, SERIF } from './parts';

const ring = (k: Kin) => (k.l <= 30 ? '#E8603F' : k.l <= 50 ? '#D9A441' : '#66BC8E');

function Cameo({ k, sib }: { k: Kin; sib?: boolean }) {
  const f = k.g === 'f';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <span style={{ position: 'relative', width: 22, height: 27, flexShrink: 0, borderRadius: '50%', padding: 2, background: 'linear-gradient(160deg, #F2DCA0, #9A7430 60%, #5E4416)', boxShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
        <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', overflow: 'hidden', background: f ? 'radial-gradient(circle at 50% 30%, #E9D2B8, #B8957A)' : 'radial-gradient(circle at 50% 30%, #DCD2BE, #9E927A)', boxShadow: `inset 0 0 0 1.5px ${ring(k)}` }}>
          {/* silhouette in profile, as in a cut-paper cameo */}
          <svg viewBox="0 0 20 24" width="100%" height="100%" aria-hidden="true">
            <path d={f ? 'M10 4 C14 4 15 7 14.5 9 C16 10 15.5 12 14 12.5 C13.5 14 12.5 15 11.5 15.5 L12 18 C15 18.5 18 20 19 24 H1 C2 20 5 18.5 8 18 L8.5 15.5 C6 14.5 5 12 5.2 9 C5.5 5.5 7.5 4 10 4 Z M6 6 C4 7 3.5 11 5 14 C4 10 5 8 6 6 Z'
              : 'M10 5 C13.5 5 14.5 7.5 14.2 9.5 C15.6 10.4 15.2 12.2 13.8 12.6 C13.2 14.4 12 15.6 11 16 L11.4 18.2 C15 18.8 18 20.5 19 24 H1 C2 20.5 5 18.8 8.6 18.2 L9 16 C6.8 15 5.6 12.8 5.8 9.8 C6 6.8 7.8 5 10 5 Z'} fill={sib ? '#4A3A2A' : '#2A1E14'} opacity=".85" />
          </svg>
        </span>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, minWidth: 0 }}>
        <span style={{ fontFamily: HAND, fontSize: 14, color: '#F2DFA8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 58 }}>{k.first}</span>
        <span style={{ fontSize: 8.5, color: 'rgba(242,223,168,0.6)', whiteSpace: 'nowrap' }}>{sib ? (k.g === 'f' ? 'сестра' : 'брат') : k.age + ' р.'}</span>
      </span>
    </span>
  );
}

/** the city plan, rolled up and tied: always within reach on the rail; a red tag while today's move is unused */
function MapRoll({ s, onMap }: { s: GameState; onMap: () => void }) {
  const fresh = !!s.city && !s.city.acted;
  return (
    <button className="b3d" onClick={onMap} aria-label="План міста" title="План міста"
      style={{ position: 'relative', flexShrink: 0, width: 64, minHeight: 38, marginTop: 6, padding: '2px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, cursor: 'pointer', fontFamily: SERIF,
        background: 'linear-gradient(180deg, #5A2E1A, #3A1C0E)', border: '1px solid #1A0C05', borderRadius: 4, boxShadow: 'inset 0 1px 0 rgba(255,210,160,0.2), inset 0 0 0 2px rgba(176,141,60,0.35), 0 3px 5px rgba(0,0,0,0.5)' }}>
      <svg viewBox="0 0 34 26" width="30" height="21" aria-hidden="true" style={{ flexShrink: 0, filter: 'drop-shadow(1px 2px 1px rgba(0,0,0,0.6))' }}>
        <defs><linearGradient id="mr-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBF1D2" /><stop offset=".45" stopColor="#E3CF9C" /><stop offset="1" stopColor="#9C8354" /></linearGradient></defs>
        <rect x="3" y="7" width="28" height="12" rx="6" fill="url(#mr-p)" stroke="#5A4630" strokeWidth=".8" />
        <ellipse cx="4.5" cy="13" rx="2.6" ry="6" fill="#E9D7A6" stroke="#5A4630" strokeWidth=".8" />
        <path d="M4.5 9.5 a2 3.5 0 1 0 .1 0" fill="none" stroke="#8C7448" strokeWidth=".7" />
        <path d="M12 8 v10" stroke="#7A2A1E" strokeWidth="2.2" />
        <path d="M12 18 l-2 6 M12 18 l2.5 5.5" stroke="#7A2A1E" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 10 H29 M16 13 H27 M16 16 H28" stroke="#A88E5E" strokeWidth=".6" />
      </svg>
      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 1.2, color: '#F2DFA8', lineHeight: 1 }}>ПЛАН</span>
      {fresh && <span style={{ position: 'absolute', top: -6, right: -4, padding: '0 5px', fontSize: 9, fontWeight: 700, color: '#F6EEDA', background: '#9A2418', borderRadius: 7, border: '1px solid #1A0C05' }}>1 хід</span>}
    </button>
  );
}

export function FamilyStrip({ s, onOpen, onMap }: { s: GameState; onOpen: () => void; onMap?: () => void }) {
  return (
    <div style={{ position: 'relative', zIndex: 5, display: 'flex', gap: 6 }}>
      <FamilyRail s={s} onOpen={onOpen} />
      {onMap && <MapRoll s={s} onMap={onMap} />}
    </div>
  );
}

function FamilyRail({ s, onOpen }: { s: GameState; onOpen: () => void }) {
  const kids = G.liveKids(s), sibs = s.sibs.filter((x) => !x.gone);
  const empty = Math.max(0, Math.min(3, s.kidsMax) - s.kids.length);
  const warn = kids.concat(sibs).some((k) => k.l <= 30);
  return (
    <button onClick={onOpen} aria-label="Родина · альбом" title="Родинний альбом"
      className="b3d" style={{ position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, minHeight: 38, padding: '4px 10px 4px 6px', marginTop: 6, cursor: 'pointer', fontFamily: SERIF, textAlign: 'left',
        background: 'linear-gradient(180deg, #5A2E1A, #3A1C0E)', border: '1px solid #1A0C05', borderRadius: 4,
        boxShadow: 'inset 0 1px 0 rgba(255,210,160,0.2), inset 0 0 0 2px rgba(176,141,60,0.35), 0 3px 5px rgba(0,0,0,0.5)' }}>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '2px 7px', background: 'linear-gradient(180deg, #E2C374, #9A7630)', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,240,200,0.6)', flexShrink: 0 }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.4, color: '#2A1C08' }}>РОДИНА</span>
        <span style={{ fontSize: 8, color: '#3A2A10', whiteSpace: 'nowrap' }}>{s.surname}</span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        {kids.map((k) => <Cameo key={k.id} k={k} />)}
        {sibs.slice(0, Math.max(0, 3 - kids.length)).map((k) => <Cameo key={k.id} k={k} sib />)}
        {Array.from({ length: kids.length + sibs.length ? Math.min(empty, 1) : empty || 1 }, (_, i) => (
          <span key={'e' + i} style={{ width: 22, height: 27, borderRadius: '50%', border: '1.5px dashed rgba(242,223,168,0.35)', flexShrink: 0 }} />
        ))}
        {!kids.length && !sibs.length && <span style={{ fontSize: 10.5, fontStyle: 'italic', color: 'rgba(242,223,168,0.6)' }}>дітей поки немає</span>}
      </span>
      {warn && <span style={{ fontSize: 9, fontWeight: 700, color: '#F08A6E', letterSpacing: 0.5 }}>ОБРАЗА</span>}
      <span style={{ color: '#D9B870', fontSize: 14 }}>›</span>
    </button>
  );
}
