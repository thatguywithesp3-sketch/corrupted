// Evening: the black book. The money of the day is settled page by page, like a bookkeeper would:
// I. Cash of the day → II. Accomplices' shares → III. Family upkeep → IV. Hiding places (+ the banker) → V. Totals & the safe.
//
// Information design on the page (still pen, pencil and paper):
//   · colour = meaning, the same on every page: dirty money ochre, clean green, paid out red, hidden blue,
//     laundering teal, risk scarlet;
//   · every number is a pencil-shaded block in its colour; key totals are paper stickers taped to the page;
//   · each page is cut into sections with a pencilled header;
//   · a "where the money goes" strip shows tonight's plan at a glance.
import { useState, type ReactNode } from 'react';
import * as G from '../../engine';
import type { GameState, StashKey } from '../../engine';
import { BLUE, DeskBtn, HAND, INK, Ic, MUTE, RED, SERIF, Tick } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

// ---------- colour = meaning
type Tone = 'dirty' | 'clean' | 'out' | 'hide' | 'laun' | 'risk' | 'neu';
const T: Record<Tone, { ink: string; pen: string; note: string; name: string }> = {
  dirty: { ink: '#6E3E0E', pen: '#C98A3A', note: '#F5DFA6', name: 'брудні' },
  clean: { ink: '#1F5A36', pen: '#5FA374', note: '#D8EBC8', name: 'чисті' },
  out: { ink: '#7E2016', pen: '#D0604A', note: '#F6D2C4', name: 'віддати' },
  hide: { ink: '#1E2F60', pen: '#5A78B8', note: '#D4DDF2', name: 'сховати' },
  laun: { ink: '#135A66', pen: '#3E9CAE', note: '#CFEBEE', name: 'відмити' },
  risk: { ink: '#8E1F12', pen: '#E0503A', note: '#F8C9B8', name: 'ризик' },
  neu: { ink: INK, pen: '#8C7E58', note: '#EFE6CC', name: '' }
};

const PAGES = [
  { t: 'Каса дня', sub: 'Що лежить у шухляді, що з цього вже не ваше і скільки можна сховати.' },
  { t: 'Частки спільників', sub: 'Кожен, хто допоміг, чекає свої 20%. Затримаєте — запам’ятає.' },
  { t: 'Утримання родини', sub: 'Діти живуть на чисті гроші. Утримання тримає їхню вірність і готує спадкоємця.' },
  { t: 'Схованки', sub: 'Розкладіть брудні гроші. Що лишиться в шухляді, при обшуку заберуть.' },
  { t: 'Підсумок і сейф', sub: 'Перевірте рахунок і замкніть сейф. Далі — ніч і її наслідки.' }
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const rot = (seed: number) => ((seed * 37) % 7 - 3) * 0.35;

// ---------- page furniture

/** a number shaded in coloured pencil, written over in ink */
function Block({ v, tone, size = 19, sign = '', unit = 'кр.', seed = 1, dim }: { v: number | string; tone: Tone; size?: number; sign?: string; unit?: string; seed?: number; dim?: boolean }) {
  const t = T[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, padding: '2px 8px 1px', borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0, opacity: dim ? 0.4 : 1,
      background: `repeating-linear-gradient(-62deg, ${t.pen}66 0 1.3px, transparent 1.3px 3px), ${t.pen}26`, boxShadow: `inset 0 0 0 1px ${t.pen}80`, transform: `rotate(${rot(seed)}deg)` }}>
      <span style={{ fontFamily: HAND, fontSize: size, lineHeight: 1, color: t.ink }}>{sign}{typeof v === 'number' ? G.fmt(v) : v}</span>
      {unit && <span style={{ fontFamily: HAND, fontSize: size * 0.58, color: t.ink, opacity: 0.8 }}>{unit}</span>}
    </span>
  );
}

/** a key total on a paper sticker, taped to the page */
function Sticker({ label, children, tone, sub, seed = 1 }: { label: string; children: ReactNode; tone: Tone; sub?: ReactNode; seed?: number }) {
  const t = T[tone];
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, padding: '9px 8px 6px', background: t.note, transform: `rotate(${rot(seed) * 1.6}deg)`,
      boxShadow: '0 1px 1px rgba(40,25,8,0.35), 2px 4px 6px rgba(40,25,8,0.22)', borderTop: `3px solid ${t.pen}` }}>
      <span style={{ position: 'absolute', left: '50%', top: -9, width: 34, height: 13, marginLeft: -17, background: 'rgba(250,244,222,0.62)', boxShadow: '0 0 1px rgba(0,0,0,0.25)', transform: `rotate(${-rot(seed) * 3}deg)` }} />
      <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 1, color: t.ink, lineHeight: 1.15 }}>{label}</div>
      <div style={{ fontFamily: HAND, fontSize: 26, lineHeight: 1.05, color: t.ink, whiteSpace: 'nowrap' }}>{children}</div>
      {sub && <div style={{ fontSize: 10, fontStyle: 'italic', color: t.ink, opacity: 0.8, lineHeight: 1.2 }}>{sub}</div>}
    </div>
  );
}
const Stickers = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', gap: 8, padding: '8px 2px 4px' }}>{children}</div>;

/** pencilled section header */
function Sec({ title, tone = 'neu', right, children }: { title: string; tone?: Tone; right?: ReactNode; children?: ReactNode }) {
  const t = T[tone];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 3, marginBottom: 4,
        backgroundImage: `repeating-linear-gradient(-62deg, ${t.pen}aa 0 1.2px, transparent 1.2px 2.6px)`, backgroundSize: '100% 3px', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom left' }}>
        <span style={{ width: 8, height: 8, background: t.pen, transform: 'rotate(45deg)', flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.6, color: t.ink }}>{title}</span>
        <span style={{ flex: 1 }} />{right}
      </div>
      {children}
    </div>
  );
}

/** printed label · dotted leader · value */
function Line({ label, children, note, strong }: { label: ReactNode; children: ReactNode; note?: ReactNode; strong?: boolean }) {
  return (
    <div style={{ padding: '3px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: strong ? 14.5 : 13.5, fontWeight: strong ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{label}</span>
        <span style={{ flex: 1, minWidth: 8, borderBottom: '1.5px dotted rgba(31,26,20,0.3)', transform: 'translateY(4px)' }} />
        {children}
      </div>
      {note && <div style={{ fontSize: 11, fontStyle: 'italic', color: MUTE, marginTop: 1 }}>{note}</div>}
    </div>
  );
}

/** loyalty / knows as small pencilled marks */
const Mark = ({ k, v, warn }: { k: 'heart' | 'ear'; v: number; warn: boolean }) => (
  <span title={k === 'heart' ? 'вірність' : 'знає'} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 5px', borderRadius: 2,
    background: warn ? `${T.risk.pen}2e` : 'transparent', boxShadow: warn ? `inset 0 0 0 1px ${T.risk.pen}88` : 'none' }}>
    <Ic k={k} size={13} color={warn ? T.risk.ink : MUTE} /><span style={{ fontFamily: HAND, fontSize: 16, color: warn ? T.risk.ink : INK }}>{v}</span>
  </span>
);

/** where tonight's dirty money goes, as one pencilled strip */
function Flow({ segs }: { segs: { label: string; v: number; tone: Tone }[] }) {
  const live = segs.filter((x) => x.v > 0), total = live.reduce((t, x) => t + x.v, 0) || 1;
  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ display: 'flex', height: 14, border: `1.5px solid ${INK}`, background: 'rgba(255,255,255,0.4)', transform: 'rotate(-0.3deg)' }}>
        {live.map((x, i) => (
          <span key={i} title={x.label} style={{ width: (x.v / total) * 100 + '%', borderRight: i < live.length - 1 ? `1px solid ${INK}` : 'none',
            background: `repeating-linear-gradient(-62deg, ${T[x.tone].pen} 0 1.6px, transparent 1.6px 3px), ${T[x.tone].pen}55` }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', marginTop: 4 }}>
        {live.map((x, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: T[x.tone].ink, whiteSpace: 'nowrap' }}>
            <span style={{ width: 9, height: 9, background: T[x.tone].pen, boxShadow: `inset 0 0 0 1px ${T[x.tone].ink}55` }} />{x.label} <b>{G.fk(x.v)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/** − / + keys */
const Key = ({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) => (
  <button className="b3d" onClick={onClick} aria-label={label}
    style={{ width: 30, height: 30, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, cursor: 'pointer', fontFamily: SERIF, fontSize: 18, fontWeight: 700,
      background: '#F3EAD3', color: INK, border: `1.5px solid ${INK}`, boxShadow: `0 2px 0 ${INK}` }}>{children}</button>
);
/** "all in": everything that's left goes here */
const AllIn = ({ onClick, tone }: { onClick: () => void; tone: Tone }) => (
  <button className="b3d" onClick={onClick} aria-label="Усе сюди"
    style={{ height: 30, padding: '0 8px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, borderRadius: 3, cursor: 'pointer', fontFamily: SERIF, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6,
      background: T[tone].ink, color: '#F6EEDA', border: `1.5px solid ${INK}`, boxShadow: `0 2px 0 ${INK}`, whiteSpace: 'nowrap' }}>УСЕ СЮДИ</button>
);

// ---------- the book

export function Ledger({ s, run }: { s: GameState; run: Run }) {
  const [page, setPage] = useState(0);
  const last = PAGES.length - 1;
  const kids = G.liveKids(s), kt = G.kidStashTarget(s);
  const ACC = ['pike', 'dobbs', 'otto'] as const;
  const owedAll = ACC.reduce((t, k) => t + (s.owed[k] || 0), 0);
  const owedPaid = ACC.reduce((t, k) => t + (s.pay[k] !== false ? s.owed[k] || 0 : 0), 0);
  const upkeep = kids.filter((k) => s.kidPay[k.id] !== false).reduce((t, k) => t + G.allowance(k), 0);
  const remain = G.unhidden(s), odds = G.raidOdds(s);
  const bribe = s.bank ? G.bankerCost(s, s.bank) : 0;
  const a = s.alloc, lim = G.launderLimit(s), fee = G.launderFee(s), net = Math.round(a.laun * (1 - fee));
  const cleanAfter = s.clean - Math.min(upkeep, s.clean) + net;
  const flow = [
    { label: 'спільникам', v: owedPaid, tone: 'out' as Tone },
    { label: 'банкіру', v: bribe, tone: 'out' as Tone },
    { label: 'під підлогу', v: a.floor, tone: 'hide' as Tone },
    { label: 'на склад', v: a.wh, tone: 'hide' as Tone },
    { label: 'на дитину', v: a.kid, tone: 'hide' as Tone },
    { label: 'відмити', v: a.laun, tone: 'laun' as Tone },
    { label: 'у шухляді', v: remain, tone: 'risk' as Tone }
  ];
  const risky = odds >= 30;

  let body: ReactNode = null;
  if (page === 0) body = (
    <>
      <Stickers>
        <Sticker label="БРУДНІ" tone="dirty" seed={1} sub="у шухляді">{G.fmt(s.cash)}</Sticker>
        <Sticker label="ЧИСТІ" tone="clean" seed={2} sub="на рахунку">{G.fmt(s.clean)}</Sticker>
        <Sticker label="ОБШУК" tone={risky ? 'risk' : 'neu'} seed={3} sub={`ризик ${Math.round(s.threat)}`}>{odds}%</Sticker>
      </Stickers>
      <Sec title="ВЖЕ НЕ ВАШЕ" tone="out">
        <Line label="Частки спільникам" note={owedAll ? 'Їхні 20% зі схем. Віддати чи ні — на сторінці II.' : 'Сьогодні нікому не винні.'}><Block v={owedAll} tone="out" sign={owedAll ? '− ' : ''} seed={4} /></Line>
        <Line label="Утримання дітям" note="Платиться з чистих — сторінка III."><Block v={upkeep} tone="clean" sign={upkeep ? '− ' : ''} seed={5} /></Line>
      </Sec>
      <Sec title="МОЖНА СХОВАТИ" tone="dirty">
        <Line label="Брудні після часток" strong><Block v={Math.max(0, s.cash - owedAll)} tone="dirty" size={24} seed={6} /></Line>
      </Sec>
      <Sec title="ПЛАН НА ВЕЧІР" tone="neu"><Flow segs={flow} /></Sec>
    </>
  );
  if (page === 1) body = (
    <>
      {ACC.map((k, i) => {
        const x = s.acc[k], owed = s.owed[k] || 0, pay = s.pay[k] !== false, danger = x.l <= 30 && x.k >= 35;
        const after = Math.max(0, Math.min(100, x.l + (owed ? (pay ? G.RULES.accPaidLoyalty : G.RULES.accUnpaidLoyalty) : 0)));
        return (
          <Sec key={k} title={x.n.toUpperCase()} tone={danger ? 'risk' : owed ? 'out' : 'neu'} right={<><Mark k="heart" v={x.l} warn={x.l <= 30} /><Mark k="ear" v={x.k} warn={x.k >= 40} /></>}>
            <div style={{ fontSize: 11.5, fontStyle: 'italic', color: MUTE, marginTop: -2 }}>{x.r}</div>
            {owed > 0 ? (
              <button onClick={() => run((y) => G.togglePay(y, k))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0 2px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SERIF, color: INK, textAlign: 'left' }}>
                <Tick on={pay} color={pay ? T.clean.ink : T.risk.ink} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.2 }}>{pay ? 'Віддаю частку' : 'Затримую частку'}
                  <span style={{ display: 'block', fontSize: 11, color: pay ? T.clean.ink : T.risk.ink }}>вірність {x.l} → <b>{after}</b></span></span>
                <Block v={owed} tone="out" dim={!pay} seed={i + 7} />
              </button>
            ) : <div style={{ fontSize: 12, color: MUTE, padding: '3px 0' }}>Сьогодні нічого не винні.</div>}
            {danger && <div style={{ fontSize: 11.5, fontWeight: 700, color: T.risk.ink }}>Ображений і знає забагато — може здати вас ревізору.</div>}
          </Sec>
        );
      })}
      <Stickers>
        <Sticker label="РАЗОМ ВІДДАЮ" tone="out" seed={2}>{G.fmt(owedPaid)}</Sticker>
        <Sticker label="ЗАТРИМУЮ" tone={owedAll - owedPaid ? 'risk' : 'neu'} seed={5} sub={owedAll - owedPaid ? 'хтось образиться' : 'нікого не кривджу'}>{G.fmt(owedAll - owedPaid)}</Sticker>
      </Stickers>
    </>
  );
  if (page === 2) body = kids.length ? (
    <>
      {kids.map((kd, i) => {
        const pay = s.kidPay[kd.id] !== false, st = G.kidStage(kd);
        const after = Math.max(0, Math.min(100, kd.l + (pay ? G.RULES.family.allowanceLoyalty : G.RULES.family.noAllowanceLoyalty)));
        const role = ({ child: kd.g === 'f' ? 'донька' : 'син', teen: kd.g === 'f' ? 'підлітка' : 'підліток', adult: kd.g === 'f' ? 'доросла донька' : 'дорослий син' })[st];
        return (
          <Sec key={kd.id} title={kd.first.toUpperCase() + ' · ' + role.toUpperCase() + ', ' + kd.age + ' Р.'} tone={kd.l <= 30 ? 'risk' : 'clean'} right={<Mark k="heart" v={kd.l} warn={kd.l <= 30} />}>
            <button onClick={() => run((y) => G.toggleKidPay(y, kd.id))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SERIF, color: INK, textAlign: 'left' }}>
              <Tick on={pay} color={pay ? T.clean.ink : T.risk.ink} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.2 }}>{pay ? 'Утримую' : 'Без утримання'}
                <span style={{ display: 'block', fontSize: 11, color: pay ? T.clean.ink : T.risk.ink }}>вірність {kd.l} → <b>{after}</b>{pay ? ` · підготовка +${G.RULES.family.allowancePrep[st]}` : ''}</span></span>
              <Block v={G.allowance(kd)} tone="clean" dim={!pay} seed={i + 3} />
            </button>
          </Sec>
        );
      })}
      <Stickers>
        <Sticker label="З ЧИСТИХ" tone={upkeep > s.clean ? 'risk' : 'clean'} seed={1} sub={upkeep > s.clean ? 'не вистачить на всіх' : `лишиться ${G.fmt(s.clean - upkeep)}`}>{G.fmt(upkeep)}</Sticker>
        <Sticker label="ДІТЕЙ У РОДІ" tone="neu" seed={4} sub={s.kids.length < s.kidsMax ? 'може побільшати' : 'більше не буде'}>{kids.length}</Sticker>
      </Stickers>
    </>
  ) : (
    <Sec title="ДІТЕЙ ПОКИ НЕМАЄ" tone="clean">
      <div style={{ fontSize: 13, fontStyle: 'italic', color: MUTE, lineHeight: 1.45 }}>Коли з’являться, тут буде їхнє утримання. Діти без утримання ображаються, а ображені й обізнані можуть свідчити проти роду.</div>
    </Sec>
  );
  if (page === 3) {
    const rows: { key: StashKey; name: string; ic: string; tone: Tone; note: ReactNode; held: number }[] = [
      { key: 'floor', name: G.str(s.era, 'view.stash.floor'), ic: 'floor', tone: 'hide', note: <>Знайдуть у <b>50%</b> обшуків.</>, held: s.floor },
      { key: 'wh', name: G.str(s.era, 'view.stash.wh'), ic: 'wh', tone: s.acc.otto.l >= G.RULES.warehouseUnsafeLoyalty ? 'hide' : 'risk', note: s.acc.otto.l >= G.RULES.warehouseUnsafeLoyalty ? <>Надійно, поки шурин вірний (<b>{s.acc.otto.l}</b>). Але дізнається більше.</> : <b>Отто ображений — при обшуку здасть склад.</b>, held: s.wh },
      { key: 'laun', name: G.str(s.era, 'view.stash.laun'), ic: 'laun', tone: 'laun', note: <>Ліміт <b>{G.fmt(lim)}</b> · комісія <b>{Math.round(fee * 100)}%</b> · чистими: <b>{G.fmt(net)}</b></>, held: 0 }
    ];
    if (kt) rows.push({ key: 'kid', name: G.getEra(s.era).words.kids.stash + ' · ' + kt.first, ic: 'kid', tone: 'hide', note: <>Обшук не знайде, але може вибухнути скандал.</>, held: kt.assets });
    body = (
      <>
        <Stickers>
          <Sticker label="У ШУХЛЯДІ ЩЕ" tone={remain > 0 ? 'risk' : 'clean'} seed={2} sub={remain > 0 ? 'заберуть при обшуку' : 'усе розкладено'}>{G.fmt(remain)}</Sticker>
          <Sticker label="ШАНС ОБШУКУ" tone={risky ? 'risk' : 'neu'} seed={5}>{odds}%</Sticker>
        </Stickers>
        <Flow segs={flow} />
        {rows.map((r, i) => (
          <Sec key={r.key} title={r.name.toUpperCase()} tone={r.tone} right={r.key !== 'laun' ? <span style={{ fontSize: 10, color: MUTE }}>там уже {G.fk(r.held)}</span> : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.25, color: r.tone === 'risk' ? T.risk.ink : MUTE }}>{r.note}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Key label="Менше" onClick={() => run((y) => G.adjustAlloc(y, r.key, -100))}>−</Key>
              <span style={{ flex: 1, display: 'flex', justifyContent: 'center' }}><Block v={a[r.key] || 0} tone={r.tone === 'risk' ? 'risk' : r.tone} size={20} seed={i + 2} /></span>
              <Key label="Більше" onClick={() => run((y) => G.adjustAlloc(y, r.key, 100))}>+</Key>
              <AllIn tone={r.tone} onClick={() => run((y) => G.allTo(y, r.key))} />
            </div>
          </Sec>
        ))}
        <Banker s={s} run={run} />
      </>
    );
  }
  if (page === 4) body = (
    <>
      <Flow segs={flow} />
      <Sec title="ВІДДАЮ" tone="out">
        <Line label="Спільникам"><Block v={owedPaid} tone="out" seed={1} /></Line>
        {bribe > 0 && <Line label={G.str(s.era, 'word.banker') + ' «за турботу»'}><Block v={bribe} tone="out" seed={2} /></Line>}
        <Line label="Утримання дітям" note="з чистих"><Block v={upkeep} tone="clean" seed={3} /></Line>
      </Sec>
      <Sec title="ХОВАЮ" tone="hide">
        <Line label={G.str(s.era, 'view.stash.floor')}><Block v={a.floor} tone="hide" seed={4} /></Line>
        <Line label="На склад"><Block v={a.wh} tone="hide" seed={5} /></Line>
        {kt && <Line label={'На ім’я ' + kt.first}><Block v={a.kid} tone="hide" seed={6} /></Line>}
      </Sec>
      <Sec title="ВІДМИВАЮ" tone="laun">
        <Line label="У банк" note={a.laun ? `Повернуться чистими: ${G.fmt(net)} кр.` : undefined}><Block v={a.laun} tone="laun" seed={7} /></Line>
      </Sec>
      <Stickers>
        <Sticker label="У ШУХЛЯДІ" tone={remain > 0 ? 'risk' : 'clean'} seed={1} sub={remain > 0 ? 'під загрозою' : 'порожньо'}>{G.fmt(remain)}</Sticker>
        <Sticker label="ОБШУК" tone={risky ? 'risk' : 'neu'} seed={4}>{odds}%</Sticker>
        <Sticker label="ЧИСТИХ ВРАНЦІ" tone="clean" seed={6}>{G.fk(cleanAfter)}</Sticker>
      </Stickers>
    </>
  );

  return (
    <div style={{ position: 'relative', zIndex: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 2px 0', fontFamily: SERIF, color: INK }}>
      <div className="tx-paper" style={{ position: 'relative', flex: 1, minHeight: 0, marginRight: 12, display: 'flex', flexDirection: 'column', transform: 'rotate(-0.4deg)',
        background: '#F2E9D0', boxShadow: '0 14px 26px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.4), inset 0 0 34px rgba(150,110,50,0.22)' }}>
        {/* black leather spine at the top, stitched */}
        <div style={{ height: 20, flexShrink: 0, background: 'linear-gradient(180deg, #2A221A, #15100B)', boxShadow: '0 2px 3px rgba(0,0,0,0.5)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 8, right: 8, top: 9, borderTop: '1.5px dashed rgba(200,170,110,0.5)' }} />
        </div>
        {/* ruled page: blue lines, red double margin */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, padding: '10px 14px 12px 40px', display: 'flex', flexDirection: 'column', gap: 4,
          backgroundImage: 'linear-gradient(90deg, transparent 29px, rgba(142,42,31,0.45) 29px 30px, transparent 30px 32px, rgba(142,42,31,0.45) 32px 33px, transparent 33px), repeating-linear-gradient(180deg, transparent 0 25px, rgba(60,90,150,0.15) 25px 26px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10, letterSpacing: 2, color: MUTE }}>
            <span>ЧОРНА КНИГА · ДЛЯ СЕБЕ</span><span style={{ fontFamily: HAND, fontSize: 18, letterSpacing: 0, color: BLUE }}>{s.year} р.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 13, color: RED }}>{ROMAN[page]}.</span>
            <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 21, lineHeight: 1.1 }}>{PAGES[page].t}</span>
          </div>
          <div style={{ fontSize: 12, fontStyle: 'italic', color: MUTE, lineHeight: 1.3 }}>{PAGES[page].sub}</div>
          <div key={page} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', margin: '0 -4px', padding: '0 4px 6px', animation: 'pageIn .22s ease-out' }}>{body}</div>
        </div>
        {/* index tabs on the fore-edge */}
        <div style={{ position: 'absolute', right: -14, top: 34, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PAGES.map((p, i) => (
            <button key={i} onClick={() => setPage(i)} aria-label={p.t} title={p.t}
              style={{ width: 22, height: 34, padding: '0 0 0 4px', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', fontFamily: SERIF, fontSize: 10, fontWeight: 700,
                background: i === page ? '#F2E9D0' : i < page ? '#D9C79A' : '#BFA978', color: i === page ? RED : '#4A3A22', boxShadow: i === page ? '2px 1px 2px rgba(0,0,0,0.35)' : '2px 1px 2px rgba(0,0,0,0.45), inset 3px 0 4px rgba(0,0,0,0.18)' }}>{ROMAN[i]}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {page === 0 && s.lastAlloc
          ? <DeskBtn style={{ flex: 1, fontSize: 13, lineHeight: 1.1 }} onClick={() => { run(G.sameAsLast); setPage(last); }}>↺ Як торік</DeskBtn>
          : <DeskBtn style={{ flex: 1 }} disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>← Назад</DeskBtn>}
        {page < last
          ? <DeskBtn kind="brass" style={{ flex: 1.6 }} onClick={() => setPage(page + 1)}>{PAGES[page + 1].t} →</DeskBtn>
          : <DeskBtn kind={remain > 0 ? 'paper' : 'brass'} style={{ flex: 1.6, ...(remain > 0 ? { background: 'linear-gradient(180deg, #D8B9A0, #B08060 55%, #8A5E40)' } : {}) }} onClick={() => run(G.lockSafe)}>
              <Ic k={remain > 0 ? 'lockOpen' : 'lockShut'} size={20} /> {remain > 0 ? 'Замкнути з ризиком' : 'Замкнути сейф'}
            </DeskBtn>}
      </div>
      <style>{'@keyframes pageIn{from{opacity:0;transform:translateY(6px)}}'}</style>
    </div>
  );
}

/** the banker's offer, once per evening */
function Banker({ s, run }: { s: GameState; run: Run }) {
  const free = s.cash - G.owedTotal(s);
  const deals = [
    { id: 'limit' as const, t: `Ліміт +${G.fmt(G.bankerBoost(s))} на цей вечір`, cost: G.bankerCost(s, 'limit'), risk: G.RULES.banker.threat.limit },
    { id: 'fee' as const, t: `Комісія ${Math.round(G.RULES.banker.fee * 100)}% замість ${Math.round(G.RULES.launderFee * 100)}%`, cost: G.bankerCost(s, 'fee'), risk: G.RULES.banker.threat.fee }
  ];
  return (
    <Sec title={G.str(s.era, 'word.banker').toUpperCase() + ' · «ЗА ТУРБОТУ»'} tone="laun">
      {deals.map((d, i) => {
        const on = s.bank === d.id, can = on || free >= d.cost;
        return (
          <button key={d.id} onClick={() => can && run((y) => G.setBank(y, d.id))} disabled={!can}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', background: 'none', border: 'none', cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.45, fontFamily: SERIF, color: INK, textAlign: 'left' }}>
            <Tick on={on} color={T.laun.ink} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.2 }}>{d.t}<span style={{ display: 'block', fontSize: 10.5, color: T.risk.ink }}>ризик +{d.risk}</span></span>
            <Block v={d.cost} tone="out" size={17} seed={i + 4} />
          </button>
        );
      })}
    </Sec>
  );
}
