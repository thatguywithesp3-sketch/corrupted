// Step-by-step character creation. Every step is a separate official blank with one choice,
// an explanation of what it is and how it affects the game, and Back / Next.
import { useState, type CSSProperties, type ReactNode } from 'react';
import * as G from '../engine';
import { Die } from './Die';
import { EdisonBulbs } from './EdisonBulbs';
import type { GameState } from '../engine';

interface Props { s: GameState; run: (f: (x: GameState) => GameState) => void }

const INK = '#1F1A14', BLUE = '#2A3A6A', RED = '#8E2A1F', MUTE = '#5A4630';
const HAND = "'Marck Script', cursive";

interface Blank { form: string; title: string; paper: string; tilt: number; stamp: string }
const BLANKS: Blank[] = [
  { form: 'Форма 1-А', title: 'Заява на державну посаду', paper: '#F3EAD3', tilt: -0.6, stamp: 'ВХІДНИЙ' },
  { form: 'Форма 2', title: 'Особова відомість', paper: '#EFE6CC', tilt: 0.5, stamp: 'ПЕРЕВІРЕНО' },
  { form: 'Додаток 3', title: 'Фотокартка до справи', paper: '#ECE2C6', tilt: -0.4, stamp: 'НАКЛЕЄНО' },
  { form: 'Форма 4-Б', title: 'Довідка про походження', paper: '#F1E5CA', tilt: 0.7, stamp: 'ЗАСВІДЧЕНО' },
  { form: 'Форма 5 · таємно', title: 'Особисте зобов’язання', paper: '#E9DDC0', tilt: -0.5, stamp: 'ЦІЛКОМ ТАЄМНО' }
];

const box = (on: boolean): CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box', padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
  // opaque card so the cast shadow never doubles the text; the chosen card is lit by the lamp
  background: on ? 'radial-gradient(ellipse 90% 120% at 35% 30%, #FFF8DE 0%, #FBE9B4 60%, #F1D894 100%)' : CARD,
  boxShadow: on ? 'inset 0 0 0 1px rgba(255,255,255,0.7), inset 0 0 16px rgba(255,190,80,0.45), 0 0 12px rgba(255,190,90,0.45)' : 'inset 0 0 0 1px rgba(255,255,255,0.35)',
  border: on ? `2px solid ${RED}` : '1px solid #8C7E58', color: INK, fontFamily: 'inherit', textShadow: 'none'
});
const CARD = '#F6EEDA';
/** effect line "Система +10 · Покровитель +5" → separate inked tags */
const Tags = ({ text }: { text: string }) => (
  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
    {text.split(' · ').map((t, i) => (
      <span key={i} style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.2, color: '#F6EEDA', background: BLUE, padding: '2px 7px', borderRadius: 2, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.3)' }}>{t}</span>
    ))}
  </span>
);
const Mark = ({ on }: { on: boolean }) => (
  <span style={{ width: 20, height: 20, flexShrink: 0, border: `2px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HAND, fontSize: 24, lineHeight: 1, color: RED }}>{on ? 'x' : ''}</span>
);
const Label = ({ children }: { children: ReactNode }) => <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: MUTE }}>{children}</div>;

function NoteBox({ title, color, tint, children }: { title: string; color: string; tint: string; children: ReactNode }) {
  return (
    <div style={{ padding: '7px 11px 9px', background: tint, borderLeft: `3px solid ${color}`, fontSize: 13, lineHeight: 1.35 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: 0.3, marginBottom: 2 }}>{title}</div>
      {children}
    </div>
  );
}

function Note({ what, effect }: { what: string; effect: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <NoteBox title="Що це" color={BLUE} tint="rgba(42,58,106,0.09)">{what}</NoteBox>
      <NoteBox title="У грі" color={RED} tint="rgba(150,40,20,0.08)">{effect}</NoteBox>
    </div>
  );
}


/** a filled-in line of the blank: handwriting on the rule, the printed caption under it */
const Field = ({ label, value, big }: { label: string; value: string; big?: boolean }) => (
  <div>
    <div style={{ fontFamily: HAND, fontSize: big ? 26 : 19, lineHeight: 1.05, color: BLUE, borderBottom: `1px solid ${INK}`, padding: '0 4px 1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transform: 'rotate(-0.6deg)' }}>{value}</div>
    <div style={{ fontSize: 8.5, letterSpacing: 1.4, color: MUTE, marginTop: 2, textTransform: 'uppercase' }}>{label}</div>
  </div>
);

/** steel gem paperclip: wire with a lit top edge and its shadow on the paper */
const CLIP = 'M5.5 16 V34 A2 2 0 0 0 9.5 34 V6 A3.75 3.75 0 0 0 2 6 V38 A5.5 5.5 0 0 0 13 38 V20';
const Paperclip = () => (
  <svg width="21" height="60" viewBox="-1 -3 17 48" style={{ position: 'absolute', left: 10, top: -20, overflow: 'visible', transform: 'rotate(-4deg)', zIndex: 2 }} aria-hidden="true">
    <defs><linearGradient id="clip-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F4F0" /><stop offset=".4" stopColor="#9EA2A4" /><stop offset=".7" stopColor="#D8DAD6" /><stop offset="1" stopColor="#6C7072" /></linearGradient></defs>
    <path d={CLIP} fill="none" stroke="rgba(30,20,8,0.45)" strokeWidth="1.8" strokeLinecap="round" transform="translate(1.6 2.2)" style={{ filter: 'blur(0.9px)' }} />
    <path d={CLIP} fill="none" stroke="#5E6264" strokeWidth="1.9" strokeLinecap="round" />
    <path d={CLIP} fill="none" stroke="url(#clip-steel)" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M2.4 9 V30 M9.1 9 V24" stroke="rgba(255,255,255,0.75)" strokeWidth=".45" strokeLinecap="round" />
  </svg>
);

/** the applicant's photo card, clipped to the blank with a paperclip */
const ClippedPhoto = ({ src }: { src: string }) => (
  <div style={{ position: 'relative', flexShrink: 0, marginTop: 6, transform: 'rotate(-3deg)' }}>
    <div style={{ width: 78, height: 100, padding: '4px 4px 12px', background: '#FBF7EA', boxShadow: '0 1px 1px rgba(40,25,8,0.5), 3px 5px 8px rgba(40,25,8,0.35)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', height: '100%', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'sepia(0.15) contrast(1.02)', boxShadow: 'inset 0 0 6px rgba(60,40,10,0.35)' }} />
    </div>
    {/* slight lift of the photo under the clip's pressure */}
    <span style={{ position: 'absolute', left: 6, top: 0, width: 20, height: 26, background: 'linear-gradient(180deg, rgba(0,0,0,0.1), transparent)', pointerEvents: 'none' }} />
    <Paperclip />
  </div>
);

export function Onboarding({ s, run }: Props) {
  const [step, setStep] = useState(0);
  const C = G.getEra(s.era);
  const last = BLANKS.length - 1;
  const b = BLANKS[step];
  const canNext = step !== 0 || (s.first.trim() !== '' && s.surname.trim() !== '');
  const next = () => { if (!canNext) return; if (step === last) run(G.signForm); else setStep(step + 1); };
  const origin = C.origins[s.origin], dream = C.dreams[s.dream];
  const face = G.portraitFor(1, 1, s.gender, s.face);

  let body: ReactNode = null;
  if (step === 0) body = (
    <>
      <Label>I. ІМ’Я ТА ПРІЗВИЩЕ ЗАЯВНИКА</Label>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([['first', 'Ім’я'], ['surname', 'Прізвище']] as const).map(([k, l]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: `1px solid ${INK}` }}>
              <span style={{ fontSize: 11, color: MUTE, width: 62 }}>{l}</span>
              <input aria-label={l} value={s[k]} maxLength={16} onChange={(e) => run((x) => G.setHero(x, { [k]: e.target.value }))}
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: HAND, fontSize: 30, color: BLUE, padding: 0 }} />
            </label>
          ))}
        </div>
        <Die onRoll={() => run(G.rollName)} label="Випадкове ім’я" />
      </div>
      <Note what="Ім’я засновника роду. Кубик підкаже випадкове ім’я цієї епохи."
        effect="Прізвище стане назвою вашої династії на всі сім епох. Імена спадкоємців гра придумає сама." />
    </>
  );
  if (step === 1) body = (
    <>
      <Label>II. ЗАЯВНИК — ЦЕ</Label>
      <div style={{ display: 'flex', gap: 8 }}>
        {([['m', 'Пан'], ['f', 'Пані']] as const).map(([g, t]) => (
          <button key={g} className="b3d" onClick={() => run((x) => G.setHero(x, { gender: g }))} style={{ ...box(s.gender === g), justifyContent: 'center', minHeight: 64, fontSize: 20 }}>
            <Mark on={s.gender === g} /> {t}
          </button>
        ))}
      </div>
      <Note what="Стать засновника роду."
        effect="Епоха реагує на неї: газети, колеги й покровителі ставляться до жінки на посаді інакше, особливо на початку. Механіка схем і рішень однакова." />
    </>
  );
  if (step === 2) body = (
    <>
      <Label>III. ФОТОКАРТКА · ОБЕРІТЬ ОДНУ</Label>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <button key={i} className="b3d" onClick={() => run((x) => G.setHero(x, { face: i }))} aria-label={'Фото ' + (i + 1)}
            style={{ flex: 1, height: 214, padding: '4px 4px 14px', background: '#FFFDF6', cursor: 'pointer', border: s.face === i ? `3px solid ${RED}` : '1px solid #8C7E58', transform: `rotate(${[-2, 1, -1][i]}deg)`, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
            <span style={{ display: 'block', width: '100%', height: '100%', backgroundImage: `url(art/heroes/${s.gender}${i + 1}.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: s.face === i ? 'none' : 'grayscale(0.55)' }} />
          </button>
        ))}
      </div>
      <Note what="Як виглядає засновник роду."
        effect="Портрет з’являється на табличці з ім’ям угорі екрана та в галереї предків. На правила гри не впливає." />
    </>
  );
  if (step === 3) body = (
    <>
      <Label>IV. ПОХОДЖЕННЯ · ОДНА ГРАФА</Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {C.origins.map((o, i) => (
          <button key={i} className="b3d" onClick={() => run((x) => G.setHero(x, { origin: i }))} style={box(s.origin === i)}>
            <Mark on={s.origin === i} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <b style={{ fontSize: 16 }}>{s.gender === 'f' ? o.tf : o.t}</b>
              <i style={{ fontSize: 13.5, color: '#3A2A18', lineHeight: 1.25 }}>{o.d}</i>
              <Tags text={o.fx} />
            </span>
          </button>
        ))}
      </div>
      <Note what="З якої родини ви прийшли на службу."
        effect="Дає стартову перевагу на все перше життя: кращі стосунки з покровителем, прихильність міста або гроші та банк, що відмиває більше." />
    </>
  );
  if (step === 4) body = (
    <>
      <Label>V. МЕТА ЖИТТЯ · ВІДОМА ЛИШЕ ВАМ</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {C.dreams.map((d, i) => (
          <button key={i} className="b3d" onClick={() => run((x) => G.setHero(x, { dream: i }))}
            style={{ ...box(s.dream === i), flexDirection: 'column', alignItems: 'flex-start', gap: 3, minHeight: 74, background: s.dream === i ? INK : CARD, color: s.dream === i ? '#F3E9D2' : INK, border: s.dream === i ? `2px solid ${INK}` : '1px solid #8C7E58' }}>
            <b style={{ fontSize: 14, lineHeight: 1.15 }}>{d.t}</b>
            <span style={{ fontSize: 11, color: s.dream === i ? '#D9B870' : MUTE }}>{d.g}</span>
          </button>
        ))}
      </div>
      <Note what="Таємна мета, до якої йде ваш рід. Спадкоємці успадковують її."
        effect="Якщо досягти мети до кінця життя, спадкоємець отримає +1 000 чистими. Прогрес видно щоранку під газетою." />
    </>
  );

  return (
    <div className="tx-wood" style={{ position: 'relative', width: 390, height: 844, boxSizing: 'border-box', padding: '8px 14px 14px', background: '#4A2618', display: 'flex', flexDirection: 'column', gap: 10, fontFamily: "'Old Standard TT', serif", color: INK, overflow: 'hidden' }}>
      <EdisonBulbs count={BLANKS.length} step={step} />

      <div className="tx-paper" key={step} style={{ position: 'relative', flex: 1, minHeight: 0, padding: '16px 16px 18px', background: b.paper, transform: `rotate(${b.tilt}deg)`, boxShadow: '0 12px 24px rgba(0,0,0,0.6), inset 0 0 30px rgba(150,110,50,0.22)', display: 'flex', flexDirection: 'column', gap: 12, animation: 'blankIn .28s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 2, color: MUTE }}>
          <span>МІСТО ПОРТ-АУРУМ</span><span>{b.form.toUpperCase()} · {s.year}</span>
        </div>
        <div style={{ fontFamily: "'Ruslan Display', serif", fontSize: 23, textAlign: 'center', lineHeight: 1.15 }}>{b.title}</div>
        <div style={{ borderTop: `3px double ${INK}` }} />
        {body}
        <div style={{ flex: 1 }} />
        {step === last && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '0 2px' }}>
            {face && <ClippedPhoto src={face} />}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 2 }}>
              <Field label="Заявник" value={`${s.first} ${s.surname}`} big />
              <Field label="Походження" value={s.gender === 'f' ? origin.tf : origin.t} />
              <Field label="Мета життя" value={dream.t} />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, fontSize: 11, color: MUTE }}>
          <span>Аркуш {step + 1} з {BLANKS.length}</span>
        </div>
        {step !== last && <span style={{ position: 'absolute', right: 18, bottom: 44, padding: '3px 10px', border: `2px solid ${RED}`, color: RED, fontSize: 13, fontWeight: 700, letterSpacing: 2, transform: 'rotate(-8deg)', opacity: 0.6 }}>{b.stamp}</span>}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="b3d" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          style={{ flex: 1, minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9E1C2', color: INK, border: '2px solid #121216', borderRadius: 3, fontSize: 15, fontWeight: 700, cursor: step === 0 ? 'default' : 'pointer', opacity: step === 0 ? 0.4 : 1, boxShadow: '0 3px 0 #121216', fontFamily: 'inherit' }}>← Назад</button>
        <button className="b3d" onClick={next} disabled={!canNext}
          style={{ flex: 1.6, minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: step === last ? 'linear-gradient(180deg, #2E261C, #1F1A14)' : 'linear-gradient(180deg, #E2C374, #B8913C 55%, #9A7630)', color: step === last ? '#F3E9D2' : INK, border: '2px solid #6E531E', borderRadius: 3, fontSize: 16, fontWeight: 700, cursor: canNext ? 'pointer' : 'default', opacity: canNext ? 1 : 0.5, boxShadow: '0 3px 0 #4A3812', fontFamily: 'inherit' }}>
          {step === last ? <>Підписати й подати <img src="art/brand/seal.png" alt="" style={{ width: 30 }} /></> : 'Далі →'}
        </button>
      </div>
      <style>{'@keyframes blankIn{from{opacity:0;transform:translateX(40px) rotate(3deg)}}'}</style>
    </div>
  );
}
