// Evening: the black book. The money of the day is settled page by page, like a bookkeeper would:
// I. Cash of the day → II. Accomplices' shares → III. Family upkeep → IV. Hiding places (+ the banker) → V. Totals & the safe.
// Each page explains what it is and what it does in the game, and the book can always be closed "as last year".
import { useState, type ReactNode } from 'react';
import * as G from '../../engine';
import type { GameState, StashKey } from '../../engine';
import { Amt, BLUE, DeskBtn, GREEN, HAND, INK, Ic, MUTE, RED, SERIF, Tick } from './parts';

type Run = (f: (x: GameState) => GameState) => void;

const PAGES = [
  { t: 'Каса дня', sub: 'Що сьогодні лягло в шухляду і що з цього вже не ваше.' },
  { t: 'Частки спільників', sub: 'Кожен, хто допоміг, чекає свої 20%. Затримаєте — запам’ятає.' },
  { t: 'Утримання родини', sub: 'Діти живуть на чисті гроші. Утримання тримає їхню вірність і готує спадкоємця.' },
  { t: 'Схованки', sub: 'Розкладіть брудні гроші. Що лишиться в шухляді, при обшуку заберуть.' },
  { t: 'Підсумок і сейф', sub: 'Перевірте рахунок і замкніть сейф. Далі — ніч і її наслідки.' }
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

// ---------- page furniture

/** printed label · dotted leader · amount in ink */
function Line({ label, children, strong, note }: { label: ReactNode; children: ReactNode; strong?: boolean; note?: ReactNode }) {
  return (
    <div style={{ padding: '3px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: strong ? 15 : 14, fontWeight: strong ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ flex: 1, borderBottom: `1.5px dotted rgba(31,26,20,0.35)`, transform: 'translateY(-4px)' }} />
        {children}
      </div>
      {note && <div style={{ fontSize: 11.5, fontStyle: 'italic', color: MUTE, marginTop: 1 }}>{note}</div>}
    </div>
  );
}
const Rule = ({ double }: { double?: boolean }) => <div style={{ borderTop: double ? `3px double ${INK}` : `1px solid ${INK}`, margin: '4px 0' }} />;

const Stat = ({ k, v, warn }: { k: string; v: number; warn?: boolean }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: HAND, fontSize: 17, color: warn ? RED : INK }}>
    <Ic k={k} size={14} color={warn ? RED : MUTE} />{v}
  </span>
);

/** small square key for − / + / all */
const Key = ({ children, onClick, dark, label }: { children: ReactNode; onClick: () => void; dark?: boolean; label: string }) => (
  <button className="b3d" onClick={onClick} aria-label={label}
    style={{ width: 34, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, cursor: 'pointer', fontFamily: SERIF, fontSize: 18, fontWeight: 700,
      background: dark ? 'linear-gradient(180deg, #2E261C, #1F1A14)' : '#F3EAD3', color: dark ? '#F3E9D2' : INK, border: `1.5px solid ${INK}`, boxShadow: `0 2px 0 ${INK}` }}>{children}</button>
);

// ---------- the book

export function Ledger({ s, run }: { s: GameState; run: Run }) {
  const [page, setPage] = useState(0);
  const last = PAGES.length - 1;
  const kids = G.liveKids(s), kt = G.kidStashTarget(s);
  const owedAll = (['pike', 'dobbs', 'otto'] as const).reduce((t, k) => t + (s.owed[k] || 0), 0);
  const owedPaid = (['pike', 'dobbs', 'otto'] as const).reduce((t, k) => t + (s.pay[k] !== false ? s.owed[k] || 0 : 0), 0);
  const upkeep = kids.filter((k) => s.kidPay[k.id] !== false).reduce((t, k) => t + G.allowance(k), 0);
  const remain = G.unhidden(s), odds = G.raidOdds(s), avail = G.available(s);
  const bribe = s.bank ? G.bankerCost(s, s.bank) : 0;
  const a = s.alloc, lim = G.launderLimit(s), fee = G.launderFee(s);

  let body: ReactNode = null;
  if (page === 0) body = (
    <>
      <Line label="Брудні в шухляді"><Amt v={s.cash} /></Line>
      <Line label="Винні спільникам" note={owedAll ? 'Їхні 20% зі схем. Віддати чи ні — на наступній сторінці.' : 'Сьогодні нікому не винні.'}><Amt v={owedAll} sign="− " color={owedAll ? RED : BLUE} /></Line>
      <Rule double />
      <Line label="Можна сховати" strong note="Якщо віддасте всі частки."><Amt v={Math.max(0, s.cash - owedAll)} size={26} /></Line>
      <div style={{ height: 10 }} />
      <Line label="Чисті на рахунку" note="З них платите утримання дітям і хабарі за посади."><Amt v={s.clean} color={GREEN} /></Line>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', background: odds >= 30 ? 'rgba(142,42,31,0.09)' : 'rgba(35,53,106,0.07)', borderLeft: `3px solid ${odds >= 30 ? RED : BLUE}` }}>
        <Ic k="threat" size={22} color={odds >= 30 ? RED : BLUE} />
        <span style={{ fontSize: 13, lineHeight: 1.35 }}>Ризик <b>{Math.round(s.threat)}</b>. Шанс обшуку цієї ночі — <b style={{ color: odds >= 30 ? RED : INK }}>{odds}%</b>. Що вищий ризик, то частіше приходять.</span>
      </div>
    </>
  );
  if (page === 1) body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(['pike', 'dobbs', 'otto'] as const).map((k) => {
        const x = s.acc[k], owed = s.owed[k] || 0, pay = s.pay[k] !== false, risky = x.l <= 30 && x.k >= 35;
        return (
          <div key={k} style={{ padding: '6px 8px', background: risky ? 'rgba(142,42,31,0.08)' : 'rgba(255,255,255,0.28)', border: `1px solid ${risky ? RED : 'rgba(31,26,20,0.25)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{x.n}</div>
                <div style={{ fontSize: 11.5, fontStyle: 'italic', color: MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.r}</div>
              </div>
              <Stat k="heart" v={x.l} warn={x.l <= 30} /><Stat k="ear" v={x.k} warn={x.k >= 40} />
            </div>
            {owed > 0 ? (
              <button onClick={() => run((y) => G.togglePay(y, k))} style={{ marginTop: 5, width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 0', background: 'none', border: 'none', borderTop: '1px dashed rgba(31,26,20,0.3)', cursor: 'pointer', fontFamily: SERIF, color: INK, textAlign: 'left' }}>
                <Tick on={pay} color={pay ? GREEN : RED} />
                <span style={{ flex: 1, fontSize: 13 }}>{pay ? 'Віддаю частку' : 'Затримую частку'} <i style={{ color: pay ? GREEN : RED }}>{pay ? `вірність +${G.RULES.accPaidLoyalty}` : `вірність ${G.RULES.accUnpaidLoyalty}`}</i></span>
                <Amt v={owed} size={19} color={pay ? BLUE : 'rgba(35,53,106,0.4)'} />
              </button>
            ) : <div style={{ marginTop: 3, fontSize: 12, fontStyle: 'italic', color: MUTE }}>Сьогодні нічого не винні.</div>}
            {risky && <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700, color: RED }}>Ображений і знає забагато — може здати вас ревізору.</div>}
          </div>
        );
      })}
      <Line label="Разом віддаю" strong><Amt v={owedPaid} /></Line>
    </div>
  );
  if (page === 2) body = kids.length ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {kids.map((kd) => {
        const pay = s.kidPay[kd.id] !== false, st = G.kidStage(kd);
        return (
          <button key={kd.id} onClick={() => run((y) => G.toggleKidPay(y, kd.id))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: kd.l <= 30 ? 'rgba(142,42,31,0.08)' : 'rgba(255,255,255,0.28)', border: `1px solid ${kd.l <= 30 ? RED : 'rgba(31,26,20,0.25)'}`, cursor: 'pointer', fontFamily: SERIF, color: INK, textAlign: 'left' }}>
            <Tick on={pay} color={pay ? GREEN : RED} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{kd.first} <span style={{ fontWeight: 400, fontSize: 12, color: MUTE }}>· {({ child: kd.g === 'f' ? 'донька' : 'син', teen: kd.g === 'f' ? 'підлітка' : 'підліток', adult: kd.g === 'f' ? 'доросла донька' : 'дорослий син' })[st]}, {kd.age} р.</span></span>
              <span style={{ display: 'block', fontSize: 12, fontStyle: 'italic', color: pay ? GREEN : RED }}>{pay ? `вірність +${G.RULES.family.allowanceLoyalty} · підготовка +${G.RULES.family.allowancePrep[st]}` : `без утримання: вірність ${G.RULES.family.noAllowanceLoyalty}`}</span>
            </span>
            <Stat k="heart" v={kd.l} warn={kd.l <= 30} />
            <Amt v={G.allowance(kd)} size={19} color={pay ? GREEN : 'rgba(47,106,69,0.4)'} />
          </button>
        );
      })}
      <Rule />
      <Line label="Утримання з чистих" strong note={upkeep > s.clean ? 'Чистих не вистачить — комусь не дістанеться.' : `На рахунку ${G.fmt(s.clean)} кр.`}><Amt v={upkeep} color={upkeep > s.clean ? RED : GREEN} /></Line>
    </div>
  ) : (
    <div style={{ fontSize: 14, fontStyle: 'italic', color: MUTE, lineHeight: 1.45, padding: '8px 0' }}>
      Дітей поки немає. Коли з’являться, тут буде їхнє утримання. Діти без утримання ображаються, а ображені й обізнані можуть свідчити проти роду.
    </div>
  );
  if (page === 3) {
    const rows: { key: StashKey; name: string; ic: string; note: ReactNode; held: number }[] = [
      { key: 'floor', name: G.str(s.era, 'view.stash.floor'), ic: 'floor', note: <>Знайдуть у <b>50%</b> обшуків.</>, held: s.floor },
      { key: 'wh', name: G.str(s.era, 'view.stash.wh'), ic: 'wh', note: s.acc.otto.l >= G.RULES.warehouseUnsafeLoyalty ? <>Надійно, поки шурин вірний (<b>{s.acc.otto.l}</b>). Але він дізнається більше.</> : <b style={{ color: RED }}>Отто ображений — при обшуку здасть склад.</b>, held: s.wh },
      { key: 'laun', name: G.str(s.era, 'view.stash.laun'), ic: 'laun', note: <>Стануть чистими. Ліміт <b>{G.fmt(lim)}</b>, комісія <b>{Math.round(fee * 100)}%</b>.</>, held: 0 }
    ];
    if (kt) rows.push({ key: 'kid', name: getKidStashName(s, kt), ic: 'kid', note: <>Обшук не знайде, але може вибухнути скандал.</>, held: kt.assets });
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 2px 2px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>У ШУХЛЯДІ ЩЕ</span>
          <span style={{ flex: 1 }} />
          <Amt v={remain} size={26} color={remain > 0 ? RED : GREEN} />
        </div>
        {rows.map((r) => (
          <div key={r.key} style={{ padding: '5px 7px', background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(31,26,20,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic k={r.ic} size={17} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.15 }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: MUTE, lineHeight: 1.25 }}>{r.note}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: MUTE, minWidth: 0, flex: 1 }}>{r.key === 'laun' ? <>чистими: <b style={{ color: GREEN }}>{G.fmt(Math.round(a.laun * (1 - fee)))}</b></> : <>там уже: {G.fmt(r.held)}</>}</span>
              <Key label="Менше" onClick={() => run((y) => G.adjustAlloc(y, r.key, -100))}>−</Key>
              <span style={{ width: 66, textAlign: 'center' }}><Amt v={a[r.key] || 0} size={20} /></span>
              <Key label="Більше" onClick={() => run((y) => G.adjustAlloc(y, r.key, 100))}>+</Key>
              <Key label="Усе сюди" dark onClick={() => run((y) => G.allTo(y, r.key))}><Ic k="into" size={16} color="#F3E9D2" /></Key>
            </div>
          </div>
        ))}
        <Banker s={s} run={run} />
      </div>
    );
  }
  if (page === 4) {
    const net = Math.round(a.laun * (1 - fee));
    body = (
      <>
        <Line label="Спільникам"><Amt v={owedPaid} /></Line>
        {bribe > 0 && <Line label={G.str(s.era, 'word.banker') + ' «за турботу»'}><Amt v={bribe} /></Line>}
        <Line label={G.str(s.era, 'view.stash.floor')}><Amt v={a.floor} /></Line>
        <Line label="На склад"><Amt v={a.wh} /></Line>
        {kt && <Line label={'На ім’я ' + kt.first}><Amt v={a.kid} /></Line>}
        <Line label="У відмивання" note={a.laun ? `Повернуться чистими: ${G.fmt(net)} кр.` : undefined}><Amt v={a.laun} /></Line>
        <Rule double />
        <Line label="Лишається в шухляді" strong note={remain > 0 ? 'Ці гроші заберуть, якщо прийдуть з обшуком.' : 'Шухляда порожня. Обшук нічого не знайде.'}><Amt v={remain} size={26} color={remain > 0 ? RED : GREEN} /></Line>
        <div style={{ height: 6 }} />
        <Line label="Утримання дітям (з чистих)"><Amt v={upkeep} color={GREEN} /></Line>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, letterSpacing: 1.5, fontWeight: 700, color: MUTE }}>ШАНС ОБШУКУ</span>
          <span style={{ fontFamily: HAND, fontSize: 34, color: odds >= 30 ? RED : INK, lineHeight: 1 }}>{odds}%</span>
        </div>
      </>
    );
  }
  void avail;

  return (
    <div style={{ position: 'relative', zIndex: 3, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 2px 0', fontFamily: SERIF, color: INK }}>
      <div className="tx-paper" style={{ position: 'relative', flex: 1, minHeight: 0, marginRight: 12, display: 'flex', flexDirection: 'column', transform: 'rotate(-0.4deg)',
        background: '#F2E9D0', boxShadow: '0 14px 26px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.4), inset 0 0 34px rgba(150,110,50,0.22)' }}>
        {/* black leather spine at the top, stitched */}
        <div style={{ height: 20, flexShrink: 0, background: 'linear-gradient(180deg, #2A221A, #15100B)', boxShadow: '0 2px 3px rgba(0,0,0,0.5)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 8, right: 8, top: 9, borderTop: '1.5px dashed rgba(200,170,110,0.5)' }} />
        </div>
        {/* ruled page: blue lines, red double margin */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, padding: '10px 14px 12px 40px', display: 'flex', flexDirection: 'column', gap: 6,
          backgroundImage: 'linear-gradient(90deg, transparent 29px, rgba(142,42,31,0.45) 29px 30px, transparent 30px 32px, rgba(142,42,31,0.45) 32px 33px, transparent 33px), repeating-linear-gradient(180deg, transparent 0 25px, rgba(60,90,150,0.18) 25px 26px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10, letterSpacing: 2, color: MUTE }}>
            <span>ЧОРНА КНИГА · ДЛЯ СЕБЕ</span><span style={{ fontFamily: HAND, fontSize: 18, letterSpacing: 0, color: BLUE }}>{s.year} р.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 13, color: RED }}>{ROMAN[page]}.</span>
            <span style={{ fontFamily: "'Ruslan Display', serif", fontSize: 21, lineHeight: 1.1 }}>{PAGES[page].t}</span>
          </div>
          <div style={{ fontSize: 12.5, fontStyle: 'italic', color: MUTE, lineHeight: 1.3, marginTop: -2 }}>{PAGES[page].sub}</div>
          <div key={page} style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: 4, animation: 'pageIn .22s ease-out' }}>{body}</div>
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

function getKidStashName(s: GameState, kt: G.Kin) {
  return G.getEra(s.era).words.kids.stash + (kt.g === 'f' ? ' · донька ' : ' · син ') + kt.first;
}

/** the banker's offer, once per evening */
function Banker({ s, run }: { s: GameState; run: Run }) {
  const free = s.cash - G.owedTotal(s);
  const deals = [
    { id: 'limit' as const, t: `Ліміт +${G.fmt(G.bankerBoost(s))} кр. на цей вечір`, cost: G.bankerCost(s, 'limit'), risk: G.RULES.banker.threat.limit },
    { id: 'fee' as const, t: `Комісія ${Math.round(G.RULES.banker.fee * 100)}% замість ${Math.round(G.RULES.launderFee * 100)}%`, cost: G.bankerCost(s, 'fee'), risk: G.RULES.banker.threat.fee }
  ];
  return (
    <div style={{ padding: '5px 7px 6px', border: `1px dashed ${BLUE}`, background: 'rgba(35,53,106,0.05)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: BLUE }}>{G.str(s.era, 'word.banker').toUpperCase()} · «ЗА ТУРБОТУ»</div>
      {deals.map((d) => {
        const on = s.bank === d.id, can = on || free >= d.cost;
        return (
          <button key={d.id} onClick={() => can && run((y) => G.setBank(y, d.id))} disabled={!can}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0 0', background: 'none', border: 'none', cursor: can ? 'pointer' : 'default', opacity: can ? 1 : 0.45, fontFamily: SERIF, color: INK, textAlign: 'left' }}>
            <Tick on={on} color={BLUE} />
            <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.2 }}>{d.t} <i style={{ color: RED, whiteSpace: 'nowrap' }}>ризик +{d.risk}</i></span>
            <Amt v={d.cost} size={17} />
          </button>
        );
      })}
    </div>
  );
}
