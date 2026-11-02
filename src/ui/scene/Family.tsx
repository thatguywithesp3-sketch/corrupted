// The family album and the meter explanations, as real things on the desk (Era I):
// the album is a leather-bound book with photographs in corners and handwritten notes under each;
// the meter card is an index card from the office with the scale drawn on it and the levers listed.
import type { CSSProperties, ReactNode } from 'react';
import * as G from '../../engine';
import type { GameState, Kin, Meter } from '../../engine';
import { T } from './Ledger';
import { DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF } from './parts';

const KEYS: Meter[] = ['patron', 'people', 'system', 'threat'];
const split = (t: string) => t.replace(/\.$/, '').split(/,\s*|;\s*/).map((x) => x.trim()).filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1));

/** where a meter stands: fine, getting close, in the danger zone */
function state(m: Meter, v: number, dz: number): { t: string; tone: (typeof T)[keyof typeof T]; side: 'low' | 'high' | null } {
  if (m === 'threat') return v >= 70 ? { t: 'Критично', tone: T.risk, side: 'high' } : v >= 50 ? { t: 'Небезпечно', tone: T.dirty, side: 'high' } : { t: 'Спокійно', tone: T.clean, side: null };
  if (v <= dz) return { t: 'Небезпечна зона', tone: T.risk, side: 'low' };
  if (v >= 100 - dz) return { t: 'Небезпечна зона', tone: T.risk, side: 'high' };
  if (v <= dz + 10 || v >= 90 - dz) return { t: 'Близько до краю', tone: T.dirty, side: v < 50 ? 'low' : 'high' };
  return { t: 'Рівновага', tone: T.clean, side: null };
}

// ============================================================ the legend rows in the HUD

/** four brass-edged plates: meter, what it is, where it stands now; tap for the card */
export function MeterLegend({ s, open }: { s: GameState; open: (m: Meter) => void }) {
  const MI = G.getEra(s.era).meters, dz = G.dangerZone(s);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 8, fontFamily: SERIF }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.6, color: '#BFB29A' }}>ЩО ОЗНАЧАЄ КОЖНА ШКАЛА · НАТИСНІТЬ</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {KEYS.map((m) => {
          const v = Math.round(s[m]), st = state(m, v, dz);
          return (
            <button key={m} onClick={() => open(m)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', textAlign: 'left', cursor: 'pointer', color: '#EFE4C8', fontFamily: SERIF,
              background: 'linear-gradient(180deg, #3A2C1E, #2A2016)', border: '1px solid #8C6E34', borderRadius: 4, boxShadow: 'inset 0 1px 0 rgba(255,225,160,0.18), 0 2px 4px rgba(0,0,0,0.5)' }}>
              <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 35% 30%, #F0D78C, #B8913C 60%, #7A5A1E)', border: '1px solid #4A3812' }}>
                <Ic k={m} size={18} color="#2A1D10" sw={1.9} />
              </span>
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.15 }}>
                <b style={{ display: 'block', fontSize: 13 }}>{MI[m].name.replace('Ризик викриття', 'Ризик')}</b>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: st.side ? '#F4A08C' : '#9FD7B0', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.side ? '#E8603F' : '#66BC8E' }} />{st.t}
                </span>
              </span>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#F0D78C' }}>{v}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================ the meter card

export function MeterInfo({ s, m, onClose }: { s: GameState; m: Meter; onClose: () => void }) {
  const I = G.getEra(s.era).meters[m], dz = G.dangerZone(s), v = Math.round(s[m]), isT = m === 'threat';
  const st = state(m, v, dz);
  const up = split(I.up), down = split(I.down);
  const zoneL = isT ? 0 : dz, zoneR = isT ? 30 : dz;
  const tip = isT
    ? v >= 50 ? `Знижуйте зараз: ${down.join(', ').toLowerCase()}.` : 'Ризик росте щороку сам собою. Тримайте запас: на кожен великий куш потрібен спосіб його збити.'
    : st.side === 'low' ? `Терміново піднімайте: ${up.slice(0, 2).join(', ').toLowerCase()}.`
      : st.side === 'high' ? `Пригальмуйте. Забагато — так само небезпечно: ${down.slice(0, 2).join(', ').toLowerCase()} повернуть шкалу до середини.`
        : 'Найкраще місце — середина. На краях шкала щороку сама сповзає ще далі.';
  const Lever = ({ dir, items }: { dir: 'up' | 'down'; items: string[] }) => {
    const tn = (dir === 'up') !== isT ? T.clean : T.risk; // for the risk meter, "up" is the bad way
    return (
      <div style={{ flex: 1, minWidth: 0, padding: '7px 9px', background: tn.note, border: `1.5px solid ${tn.pen}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, letterSpacing: 1.3, fontWeight: 700, color: tn.ink }}>{dir === 'up' ? '▲ ПІДНІМАЄ' : '▼ ОПУСКАЄ'}</div>
        <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((x) => <li key={x} style={{ display: 'flex', gap: 5, fontSize: 13, lineHeight: 1.22 }}><span style={{ color: tn.ink }}>•</span>{x}</li>)}
        </ul>
      </div>
    );
  };
  const End = ({ at, title, text, bad }: { at: string; title: string; text: string; bad: boolean }) => (
    <div style={{ flex: 1, minWidth: 0, textAlign: at === 'r' ? 'right' : 'left' }}>
      <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: bad ? T.risk.ink : MUTE }}>{title}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.2, fontWeight: bad ? 700 : 400, color: bad ? T.risk.ink : INK }}>{text}</div>
    </div>
  );
  return (
    <Backdrop onClose={onClose}>
      <div className="tx-paper" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxHeight: '100%', overflowY: 'auto', background: '#F6EEDA', padding: '16px 16px 14px', boxShadow: '0 18px 36px rgba(0,0,0,0.7), inset 0 0 28px rgba(150,110,50,0.22)', border: `1.5px solid ${INK}`, fontFamily: SERIF, color: INK }}>
        {/* a red rule like on an office index card */}
        <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 74, height: 1.5, background: 'rgba(190,60,50,0.5)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 52, height: 52, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 35% 30%, #4A3A28, #1F1A14)', border: '2px solid #B8913C' }}><Ic k={m} size={28} color="#F0D78C" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 22, fontWeight: 700, lineHeight: 1.05 }}>{I.name}</span>
            <span style={{ display: 'block', fontSize: 13, fontStyle: 'italic', color: MUTE }}>{I.short}</span>
          </span>
          <span style={{ textAlign: 'center', flexShrink: 0 }}>
            <span style={{ display: 'block', fontFamily: HAND, fontSize: 38, lineHeight: 1, color: st.tone.ink }}>{v}</span>
            <span style={{ display: 'block', fontSize: 10, fontWeight: 700, padding: '1px 6px', background: st.tone.note, color: st.tone.ink, border: `1px solid ${st.tone.pen}`, whiteSpace: 'nowrap' }}>{st.t}</span>
          </span>
        </div>

        <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.35 }}>{I.what}</p>

        {/* the scale itself: where the edges are, and where you are */}
        <div style={{ marginTop: 28 }}>
          <div style={{ position: 'relative', height: 22, border: `1.5px solid ${INK}`, background: '#FFFDF4' }}>
            {zoneL > 0 && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${zoneL}%`, background: 'repeating-linear-gradient(-55deg, rgba(178,50,30,0.55) 0 2px, transparent 2px 5px)' }} />}
            <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${zoneR}%`, background: 'repeating-linear-gradient(-55deg, rgba(178,50,30,0.55) 0 2px, transparent 2px 5px)' }} />
            {!isT && <span style={{ position: 'absolute', left: `${dz}%`, right: `${dz}%`, top: 0, bottom: 0, background: 'rgba(63,138,90,0.12)' }} />}
            <span style={{ position: 'absolute', left: `calc(${v}% - 2px)`, top: -6, bottom: -6, width: 4, background: st.tone.ink, boxShadow: '0 0 0 1.5px #F6EEDA' }} />
            <span style={{ position: 'absolute', left: `${v}%`, top: -22, transform: 'translateX(-50%)', fontSize: 10.5, fontWeight: 700, color: st.tone.ink, whiteSpace: 'nowrap' }}>ви тут</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTE, marginTop: 2 }}><span>0</span>{!isT && <span>безпечна середина</span>}<span>100</span></div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <End at="l" title={isT ? 'ВНИЗУ' : '▼ ЯКЩО ВПАДЕ ДО 0'} text={I.low} bad={!isT} />
            <End at="r" title="▲ ЯКЩО ДІЙДЕ ДО 100" text={I.high} bad />
          </div>
        </div>

        <div style={{ marginTop: 12, padding: '8px 10px', background: '#1F1A14', color: '#F1E6C8', borderLeft: `5px solid ${st.side ? '#E8603F' : '#66BC8E'}` }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, color: st.side ? '#F4A08C' : '#9FD7B0' }}>ЩО РОБИТИ ЗАРАЗ</div>
          <div style={{ fontSize: 14, lineHeight: 1.3, marginTop: 2 }}>{tip}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Lever dir="up" items={up} />
          <Lever dir="down" items={down} />
        </div>

        <div style={{ marginTop: 9, fontSize: 12, color: MUTE, lineHeight: 1.3 }}>
          {isT ? 'Від 70 — обшуки майже щоночі. Ризик сам додається щороку.' : `Небезпечні зони — заштриховані краї (по ${dz} з кожного боку). Там шкала щороку сама сповзає ще ближче до краю.`}
        </div>
        <DeskBtn kind="ink" style={{ width: '100%', marginTop: 12, minHeight: 48 }} onClick={onClose}>Зрозуміло</DeskBtn>
      </div>
    </Backdrop>
  );
}

const Backdrop = ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
  <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(12,8,4,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 14px 24px' }}>{children}</div>
);

// ============================================================ the family album

function Photo({ k, size = 92 }: { k: Kin; size?: number }) {
  const f = k.g === 'f';
  const corner = (pos: CSSProperties, r: number) => <span aria-hidden="true" style={{ position: 'absolute', ...pos, width: 15, height: 15, background: '#2A1D12', clipPath: 'polygon(0 0, 100% 0, 0 100%)', transform: `rotate(${r}deg)` }} />;
  return (
    <span style={{ position: 'relative', width: size, height: size * 1.25, flexShrink: 0, padding: 6, background: '#FBF6E8', boxShadow: '1px 3px 6px rgba(0,0,0,0.35)', transform: `rotate(${f ? -2 : 2}deg)` }}>
      <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50% / 46%', overflow: 'hidden', position: 'relative', background: k.gone ? 'radial-gradient(circle at 50% 35%, #A49A88, #5E574C)' : 'radial-gradient(circle at 50% 30%, #E7D3A6, #9C7A48 70%, #5E4424)', filter: k.gone ? 'grayscale(1)' : 'sepia(0.35)' }}>
        <svg viewBox="0 0 60 75" width="100%" height="100%" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="30" cy="28" r={k.age < 12 ? 10 : 12} fill="#3A2A18" opacity=".85" />
          {f && <path d="M17 31 C15 14 45 14 43 31 C46 38 44 44 40 46 C38 36 22 36 20 46 C16 44 14 38 17 31 Z" fill="#3A2A18" opacity=".6" />}
          <path d={`M${k.age < 12 ? 14 : 8} 75 C${k.age < 12 ? 14 : 8} 50 ${k.age < 12 ? 46 : 52} 50 ${k.age < 12 ? 46 : 52} 75 Z`} fill="#3A2A18" opacity=".85" />
        </svg>
      </span>
      {corner({ top: 0, left: 0 }, 0)}{corner({ top: 0, right: 0 }, 90)}{corner({ bottom: 0, right: 0 }, 180)}{corner({ bottom: 0, left: 0 }, 270)}
    </span>
  );
}

function Loyalty({ l }: { l: number }) {
  const tn = l <= 30 ? T.risk : l <= 55 ? T.dirty : T.clean;
  return (
    <div style={{ padding: '5px 8px', background: tn.note, border: `1.5px solid ${tn.pen}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Ic k="heart" size={16} color={tn.ink} sw={2} />
        <span style={{ fontSize: 10.5, letterSpacing: 1.3, fontWeight: 700, color: tn.ink, flex: 1 }}>ВІРНІСТЬ РОДУ</span>
        <span style={{ fontFamily: HAND, fontSize: 24, lineHeight: 1, color: tn.ink }}>{l}</span>
      </div>
      <div style={{ position: 'relative', height: 8, marginTop: 4, border: `1px solid ${tn.ink}`, background: 'rgba(255,255,255,0.6)' }}>
        <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${l}%`, background: tn.pen }} />
        <span style={{ position: 'absolute', left: '30%', top: -3, bottom: -3, width: 1.5, background: T.risk.ink }} />
      </div>
    </div>
  );
}

function KidPage({ s, k, i }: { s: GameState; k: Kin; i: number }) {
  const TR = G.getEra(s.era).traits, stage = G.kidStage(k), f = k.g === 'f', stars = G.kidStars(k);
  const role = { child: f ? 'донька' : 'син', teen: f ? 'підлітка' : 'підліток', adult: f ? 'доросла донька' : 'дорослий син' }[stage];
  const trait = k.trait === null ? null : TR[k.trait];
  const warn = !k.gone && (k.k >= 35 && k.l <= 40 ? 'МОЖЕ ЗДАТИ' : k.l <= 30 ? 'МОЖЕ ПІТИ' : null);
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 12, padding: '12px 10px 12px 8px', borderBottom: '1px dashed rgba(90,70,48,0.4)', opacity: k.gone ? 0.65 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <Photo k={k} />
        <span style={{ fontFamily: HAND, fontSize: 17, lineHeight: 1, color: MUTE }}>{k.age} р.</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: HAND, fontSize: 28, lineHeight: 1, flex: 1, minWidth: 0 }}>{k.first}</span>
          {!k.gone && <span title="готовність до спадку" style={{ fontSize: 15, color: '#B8913C', letterSpacing: 1 }}>{'★'.repeat(stars)}<span style={{ color: 'rgba(90,70,48,0.35)' }}>{'★'.repeat(3 - stars)}</span></span>}
        </div>
        <div style={{ fontSize: 12.5, color: MUTE, marginTop: 1 }}>{k.gone ? `Втрачен${f ? 'а' : 'ий'} для роду: ${k.why}` : `${role} · ${i === 0 ? 'старш' + (f ? 'а' : 'ий') : 'молодш' + (f ? 'а' : 'ий')}`}</div>
        {!k.gone && <>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.25 }}>
            {trait ? <><b>{trait.t}</b><span style={{ color: T.clean.ink, fontWeight: 700 }}> · {trait.fx}</span></> : <i style={{ color: MUTE }}>{stage === 'child' ? 'Ще дитина — майбутнє не визначене.' : `Ще не визнач${f ? 'илася' : 'ився'}, ким стати.`}</i>}
          </div>
          <div style={{ marginTop: 7 }}><Loyalty l={k.l} /></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {k.k > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', fontSize: 12, fontWeight: 700, background: k.k >= 40 ? T.risk.note : 'rgba(255,255,255,0.6)', color: k.k >= 40 ? T.risk.ink : INK, border: `1px solid ${k.k >= 40 ? T.risk.pen : 'rgba(31,26,20,0.35)'}` }}><Ic k="ear" size={13} color={k.k >= 40 ? T.risk.ink : INK} />знає {k.k}</span>}
            {k.assets > 0 && <span style={{ padding: '1px 7px', fontSize: 12, fontWeight: 700, background: T.clean.note, color: T.clean.ink, border: `1px solid ${T.clean.pen}` }}>на ім’я {G.fk(k.assets)}</span>}
            <span style={{ padding: '1px 7px', fontSize: 12, color: MUTE, border: '1px solid rgba(31,26,20,0.25)' }}>утримання {G.fk(G.allowance(k))}/рік</span>
          </div>
        </>}
      </div>
      {warn && <span aria-hidden="true" style={{ position: 'absolute', right: 6, bottom: 10, padding: '2px 7px', border: `2.5px double ${RED}`, color: RED, fontFamily: "'Ruslan Display', serif", fontSize: 12, letterSpacing: 1, transform: 'rotate(-9deg)', mixBlendMode: 'multiply', opacity: 0.85 }}>{warn}</span>}
    </div>
  );
}

export function FamilyAlbum({ s, onClose }: { s: GameState; onClose: () => void }) {
  const more = s.kids.length < s.kidsMax && s.served <= 9;
  return (
    <Backdrop onClose={onClose}>
      {/* the cover: dark leather, gilt edge */}
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', padding: 10, background: 'radial-gradient(120% 90% at 30% 0%, #5A2E22, #3A1C14 60%, #26110B)', borderRadius: 6, border: '2px solid #1A0B06', boxShadow: '0 20px 40px rgba(0,0,0,0.75), inset 0 0 0 3px rgba(200,160,80,0.35), inset 0 0 0 4px rgba(0,0,0,0.5)', fontFamily: SERIF, color: INK }}>
        <div style={{ textAlign: 'center', padding: '4px 0 9px', color: '#E8C878', textShadow: '0 -1px 0 rgba(0,0,0,0.8), 0 1px 0 rgba(255,230,170,0.25)' }}>
          <div style={{ fontSize: 10, letterSpacing: 3 }}>РОДИННИЙ АЛЬБОМ</div>
          <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 24, lineHeight: 1.1 }}>Рід {s.surname}</div>
        </div>
        {/* the page: thick cream card */}
        <div className="tx-paper" style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'linear-gradient(180deg,#F3EAD2,#E9DDBE)', padding: '4px 10px 10px', boxShadow: 'inset 0 0 24px rgba(120,90,40,0.3)', border: '1px solid #8C7A54' }}>
          {s.kids.length === 0 && <div style={{ padding: '20px 6px', fontFamily: HAND, fontSize: 20, color: MUTE, textAlign: 'center' }}>Сторінки ще порожні.</div>}
          {s.kids.map((k, i) => <KidPage key={k.id} s={s} k={k} i={i} />)}
          {s.sibs.length > 0 && <>
            <div style={{ marginTop: 10, fontSize: 10, letterSpacing: 1.8, fontWeight: 700, color: MUTE }}>БРАТИ Й СЕСТРИ</div>
            {s.sibs.map((k) => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px dashed rgba(90,70,48,0.35)', opacity: k.gone ? 0.6 : 1 }}>
                <Photo k={k} size={44} />
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontFamily: HAND, fontSize: 20, lineHeight: 1 }}>{k.first}</span><span style={{ fontSize: 12, color: MUTE }}>{k.gone ? k.why : `${k.g === 'f' ? 'сестра' : 'брат'} · ${k.age} р.`}</span></span>
                {!k.gone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: k.l <= 30 ? T.risk.ink : INK }}><Ic k="heart" size={14} color={k.l <= 30 ? T.risk.ink : INK} />{k.l}</span>}
              </div>
            ))}
          </>}
          {/* the key, written on the inside of the cover */}
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(90,70,48,0.35)', fontSize: 12.5, lineHeight: 1.35 }}>
            <div style={{ display: 'flex', gap: 6 }}><Ic k="heart" size={15} color={T.clean.ink} /><span><b>Вірність</b> — головне. Нижче 30 дитина може піти з роду.</span></div>
            <div style={{ display: 'flex', gap: 6, marginTop: 3 }}><Ic k="ear" size={15} color={T.risk.ink} /><span><b>Знає</b> — скільки бачила ваших справ. Багато знає й мало вірна = свідчитиме проти вас.</span></div>
            <div style={{ display: 'flex', gap: 6, marginTop: 3 }}><span style={{ color: '#B8913C', width: 15, textAlign: 'center' }}>★</span><span><b>Готовність до спадку</b> — росте від утримання й того, що ви обрали для дитини в юності.</span></div>
            <div style={{ marginTop: 5, fontFamily: HAND, fontSize: 16, color: MUTE }}>{more ? 'Родина ще може поповнитися.' : 'Більше дітей у цьому поколінні не буде.'}</div>
          </div>
        </div>
        <DeskBtn kind="brass" style={{ marginTop: 10, minHeight: 46 }} onClick={onClose}>Закрити альбом</DeskBtn>
      </div>
    </Backdrop>
  );
}
