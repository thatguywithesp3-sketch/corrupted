// Developer console: a plain, functional UI on top of the engine.
// It is NOT the game's final look (that is step 3) — it exists to play, debug and tune the engine.
import { useEffect, useState } from 'react';
import * as G from '../engine';
import type { AccKey, Delta, GameState, StashKey } from '../engine';

const SAVE_KEY = 'corrupted.dev.save';
const METERS = [['patron', 'p'], ['people', 'n'], ['system', 's'], ['threat', 'i']] as const;
const COLORS: Record<string, string> = { patron: '#D9A441', people: '#7FAEE3', system: '#66BC8E', threat: '#E8603F' };

function load(): GameState {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return G.newGame(Date.now() % 1e9);
}

function Chips({ s, d }: { s: GameState; d: Delta }) {
  const meters = G.getEra(s.era).meters;
  return (
    <span className="row">
      {G.isFatal(s, d) && <span className="chip bad">ФАТАЛЬНО</span>}
      {METERS.map(([m, k]) => d[k] ? (
        <span key={m} className={'chip ' + (m === 'threat' ? (d[k]! > 0 ? 'bad' : 'good') : Math.abs(s[m] + d[k]! - 50) > Math.abs(s[m] - 50) ? 'bad' : 'good')}>
          {meters[m].name} {d[k]! > 0 ? '+' : '−'}{Math.abs(d[k]!)}
        </span>) : null)}
      {d.cash ? <span className="chip warn">брудні {d.cash > 0 ? '+' : '−'}{G.fk(Math.abs(d.cash))}</span> : null}
      {d.clean ? <span className="chip warn">чисті {d.clean > 0 ? '+' : '−'}{G.fk(Math.abs(d.clean))}</span> : null}
    </span>
  );
}

function Meters({ s }: { s: GameState }) {
  const M = G.getEra(s.era).meters;
  return (
    <div className="meters">
      {METERS.map(([m]) => (
        <div className="meter" key={m}>
          <span className="mute">{M[m].name}</span><b>{Math.round(s[m])}</b>
          <div className="bar"><i style={{ width: Math.round(Math.max(0, Math.min(100, s[m]))) + '%', background: COLORS[m] }} /></div>
        </div>
      ))}
    </div>
  );
}

export function DevConsole() {
  const [s, setS] = useState<GameState>(load);
  const [err, setErr] = useState('');
  useEffect(() => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* ignore */ } }, [s]);
  const act = (f: (x: GameState) => GameState) => { try { setS(f(s)); setErr(''); } catch (e) { setErr(String(e)); } };
  const C = G.getEra(s.era);
  const rank = G.rankName(s);

  let screen: JSX.Element;
  switch (s.screen) {
    case 'form':
      screen = (
        <>
          <h2>Анкета · епоха {s.era} · {s.year}</h2>
          <div className="row"><input value={s.first} onChange={(e) => act((x) => G.setHero(x, { first: e.target.value }))} /><input value={s.surname} onChange={(e) => act((x) => G.setHero(x, { surname: e.target.value }))} /><button onClick={() => act(G.rollName)}>🎲</button></div>
          <div className="row">{(['m', 'f'] as const).map((g) => <button key={g} disabled={s.gender === g} onClick={() => act((x) => G.setHero(x, { gender: g }))}>{g === 'm' ? 'Пан' : 'Пані'}</button>)}</div>
          <h2>Походження</h2>
          {C.origins.map((o, i) => <button key={i} disabled={s.origin === i} onClick={() => act((x) => G.setHero(x, { origin: i }))}>{s.gender === 'f' ? o.tf : o.t} — <span className="mute">{o.fx}</span></button>)}
          <h2>Мета життя</h2>
          {C.dreams.map((d, i) => <button key={i} disabled={s.dream === i} onClick={() => act((x) => G.setHero(x, { dream: i }))}>{d.t} — <span className="mute">{d.g}</span></button>)}
          <button className="primary" onClick={() => act(G.signForm)}>Почати кар’єру</button>
        </>
      );
      break;
    case 'morning':
      screen = (
        <>
          <div className="news"><b>{s.headline}</b><div>{s.body}</div></div>
          {s.lastDec && <div className="mute">Вчора: {s.lastDec.t} <Chips s={s} d={s.lastDec.d} /></div>}
          <button className="primary" onClick={() => act(G.toOffice)}>До роботи →</button>
        </>
      );
      break;
    case 'office': {
      const docs = G.docsFor(s), d = G.currentDoc(s);
      screen = (
        <>
          <h2>Документ {s.doc + 1} з {docs.length}</h2>
          {d.kind === 'scheme' ? (
            <>
              <b>{d.scheme.from}</b>
              <div>{G.schemeText(s, d.scheme.q, d.scheme.budget)}</div>
              <div className="row">{([0, 1, 2] as const).map((ap) => <button key={ap} disabled={s.ap === ap} onClick={() => act((x) => G.setAppetite(x, ap))}>{['5%', '10%', '20%'][ap]} · +{G.fk(G.take(s, d.scheme.budget, ap))}</button>)}</div>
              <button onClick={() => act(G.signScheme)}>{d.scheme.yes} <Chips s={s} d={G.schemeDelta(s)} /></button>
              <button onClick={() => act(G.declineScheme)}>{d.scheme.no.t} <Chips s={s} d={d.scheme.no.d} /></button>
            </>
          ) : (
            <>
              <b>{d.choice.from}{d.who ? <span className="mute"> · розмова ({d.who.kind})</span> : null}</b>
              {d.choice.say && <div>«{d.choice.say}»</div>}
              <div className="mute">{d.choice.gist || d.choice.q}</div>
              {d.choice.opts.map((o, i) => {
                const en = G.enabledOptions(s, d.choice.opts)[i];
                return <button key={i} className={o.dark ? 'dark' : ''} disabled={!en} onClick={() => act((x) => G.pickOption(x, i))}>{o.t} <Chips s={s} d={o.d} /></button>;
              })}
            </>
          )}
        </>
      );
      break;
    }
    case 'evening': {
      const stash: [StashKey, string][] = [['floor', 'Схованка 1'], ['wh', 'Схованка 2 (родич)'], ['laun', 'Відмити'], ['kid', 'На ім’я дитини']];
      screen = (
        <>
          <h2>Вечірній сейф</h2>
          <div>Не сховано: <b>{G.fk(G.unhidden(s))}</b> · шанс обшуку {G.raidOdds(s)}%</div>
          <h2>Спільники</h2>
          {(['pike', 'dobbs', 'otto'] as AccKey[]).map((k) => (
            <div className="row" key={k}>{s.acc[k].n} ♥{s.acc[k].l} 👂{s.acc[k].k} {s.owed[k] ? <button onClick={() => act((x) => G.togglePay(x, k))}>{s.pay[k] === false ? '✗ не віддаю' : '✓ віддаю'} {G.fk(s.owed[k]!)}</button> : <span className="mute">нічого не винні</span>}</div>
          ))}
          {G.liveKids(s).length > 0 && <h2>Родина (утримання з чистих)</h2>}
          {G.liveKids(s).map((k) => (
            <div className="row" key={k.id}>{k.first}, {k.age} р. ♥{k.l} 👂{k.k} ★{G.kidStars(k)} <button onClick={() => act((x) => G.toggleKidPay(x, k.id))}>{s.kidPay[k.id] === false ? '✗' : '✓'} {G.allowance(k)}</button></div>
          ))}
          <h2>Куди сховати</h2>
          {stash.filter(([k]) => k !== 'kid' || G.kidStashTarget(s)).map(([k, label]) => (
            <div className="row" key={k}>{label}{k === 'kid' ? ' ' + G.kidStashTarget(s)!.first : ''}: <b>{G.fk(s.alloc[k])}</b>
              <button onClick={() => act((x) => G.adjustAlloc(x, k, -100))}>−</button><button onClick={() => act((x) => G.adjustAlloc(x, k, 100))}>+</button><button onClick={() => act((x) => G.allTo(x, k))}>усе</button></div>
          ))}
          <div className="row"><button disabled={!s.lastAlloc} onClick={() => act(G.sameAsLast)}>↺ Як минулого року</button><button className="primary" onClick={() => act(G.lockSafe)}>Замкнути сейф</button></div>
        </>
      );
      break;
    }
    case 'night':
      screen = (
        <>
          <h2>Ніч · звіт</h2>
          {s.report.map((r, i) => <div key={i} className={'rep ' + r.tone}>{r.strong ? <b>{r.t}</b> : r.t}</div>)}
          {s.offers.map((o) => <button key={o.id} onClick={() => act((x) => G.acceptOffer(x, o.id))}><b>{o.t}</b><div className="mute">{o.sub}</div></button>)}
          <button className="primary" onClick={() => act(G.sleep)}>Спати →</button>
        </>
      );
      break;
    case 'campaign':
      screen = (
        <>
          <h2>Кампанія · тиждень {s.camp!.round} з 4</h2>
          <div>Ви {s.camp!.me}% · {C.words.campaign.rival} {s.camp!.rival}% · підозра {s.camp!.fraud}% · фонд {G.fk(G.totalMoney(s))}</div>
          <div className="mute">{s.camp!.log}</div>
          {G.campaignActs(s).map((a) => <button key={a.id} className={a.dark ? 'dark' : ''} disabled={G.totalMoney(s) < a.cost} onClick={() => act((x) => G.campaignAct(x, a.id))}>{a.t} · −{G.fk(a.cost)} · рейтинг +{a.me}{a.rival ? ' · суперник ' + a.rival : ''}{a.fraud ? ' · підозра +' + a.fraud : ''}</button>)}
        </>
      );
      break;
    case 'elect':
      screen = (
        <>
          <h2>Ніч виборів</h2>
          <div>Ви {s.camp!.me} · суперник {s.camp!.rival} · підозра {s.camp!.fraud}%</div>
          <button onClick={() => act((x) => G.electionNight(x, false))}>Чекати чесного підрахунку</button>
          <button className="dark" onClick={() => act((x) => G.electionNight(x, true))}>Вкинути бюлетені</button>
        </>
      );
      break;
    case 'ending': {
      const e = s.ending!;
      screen = (
        <>
          <div className="news"><span className="mute" style={{ color: '#5a4630' }}>{e.header}</span><br /><b>{e.title}</b><div>{e.text}</div><div className="mute" style={{ color: '#5a4630' }}>{e.life}</div></div>
          <div className="row"><span className="chip good">роду {G.fmt(e.inherit)}</span><span className="chip bad">втрачено {G.fmt(e.lost)}</span>{e.dream && <span className="chip warn">мету досягнуто +1000</span>}{e.kidAssets ? <span className="chip good">на дітях {G.fmt(e.kidAssets)}</span> : null}</div>
          {s.heirs.length > 0 && <h2>{e.eraOver ? 'Заповіт · рід переходить у наступну епоху' : 'Заповіт · оберіть спадкоємця'}</h2>}
          {s.heirs.map((h) => <button key={h.id} onClick={() => act((x) => G.pickHeir(x, h.id))}>{h.nephew ? 'Племінник ' : ''}{h.first}, {h.age} р. · ★{G.kidStars(h)} · ♥{h.l}{h.assets ? ' · на ім’я ' + G.fk(h.assets) : ''}{h.trait !== null ? ' · ' + C.traits[h.trait].t : ''}</button>)}
          {e.dynastyOver && <b>Рід упав. Кампанія починається з епохи I.</b>}
          {e.campaignOver && <b>Сім епох пройдено. Рід Грабсів пережив усі режими.</b>}
          {(e.dynastyOver || e.campaignOver) && <button className="primary" onClick={() => act((x) => G.restart(x))}>Почати знову</button>}
        </>
      );
      break;
    }
    default: screen = <div>?</div>;
  }

  return (
    <div className="dev"><div className="wrap">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>{rank} {s.first} {s.surname}</h1>
          <span className="mute">Епоха {s.era} · {s.year} · покоління {s.gen} з 2 · рік служби {s.served}</span>
        </div>
        <div className="row"><span className="chip">чисті {G.fk(s.clean)}</span><span className="chip">брудні {G.fk(s.cash)}</span><span className="chip">сховано {G.fk(s.floor + s.wh)}</span>{s.tavro && <span className="chip bad">тавро</span>}{s.shadow > 0 && <span className="chip good">захист {s.shadow} р.</span>}</div>
        {s.screen !== 'form' && <Meters s={s} />}
        {screen}
        {err && <div className="rep bad">{err}</div>}
      </div>
      <div className="card">
        <div className="row">
          <button onClick={() => setS(G.newGame(Date.now() % 1e9))}>Нова гра</button>
          <select value={s.era} onChange={(e) => setS(G.newGame(Date.now() % 1e9, Number(e.target.value)))}>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>Епоха {n}</option>)}</select>
          <span className="mute">seed/rng {s.rng}</span>
        </div>
        <h2>Історія роду</h2>
        {s.history.length ? s.history.map((h, i) => <div key={i} className="rep">Епоха {h.era}·{h.gen}: {h.name} — {h.title} ({G.fmt(h.inherit)})</div>) : <div className="mute">ще порожньо</div>}
        <h2>Стан (JSON)</h2>
        <pre>{JSON.stringify(s, null, 1)}</pre>
      </div>
    </div></div>
  );
}
