import { getEra, str, ERA_COUNT } from './content';
import { rand, randInt } from './rng';
import { RULES } from './rules';
import { CITY_V, cityEvening, cityMorning, initCity } from './city';
import { clamp100, fmt, fk } from './text';
import type {
  BankDeal,
  AccKey, Alloc, Choice, ChoiceOption, Delta, Doc, EndKind, GameState, Gender, Heir, Kin, Offer, ReportLine, Who
} from './types';

const ACCS: AccKey[] = ['pike', 'dobbs', 'otto'];
const clone = <T>(o: T): T => structuredClone(o);
const S = (s: GameState, key: string, vars?: Record<string, string | number>, g?: Gender) => str(s.era, key, vars, g);
const line = (t: string, tone: ReportLine['tone'], icon: string, strong = false): ReportLine => ({ t, tone, icon, strong });

// ============================================================ setup

export function newGame(seed: number, era = 1): GameState {
  const C = getEra(era);
  return {
    v: 1, rng: seed >>> 0, era, screen: 'form',
    first: C.defaultHero.first, surname: C.defaultHero.surname, gender: C.defaultHero.gender, face: 0, origin: 0, dream: 0,
    gen: 1, tavro: false, shadow: 0, blood: false, thrBase: RULES.threatPerYear, launBonus: 0,
    year: C.startYear, served: 0, rank: 0,
    ...RULES.start, cash: 0, floor: 0, wh: 0,
    acc: clone(C.accomplices),
    doc: 0, ap: 1, owed: {}, pay: {}, alloc: emptyAlloc(), lastAlloc: null, last: {},
    headline: '', body: '', report: [], offers: [], ending: null, heirs: [],
    lastStamp: null, lastDec: null, camp: null,
    kids: [], kidsMax: 1, kidSeq: 0, kidPay: {}, sibs: [], history: []
  };
}

const emptyAlloc = (): Alloc => ({ floor: 0, wh: 0, laun: 0, kid: 0 });

// ============================================================ selectors

export const rankName = (s: GameState, rank = s.rank) => {
  const r = getEra(s.era).ranks[rank];
  return s.gender === 'f' ? r.tf : r.t;
};
export const take = (s: GameState, budget: number, ap: number) =>
  Math.round((budget * RULES.appetite[ap] * getEra(s.era).ranks[s.rank].mult) / 10) * 10;
const baseLaunderLimit = (s: GameState) => getEra(s.era).ranks[s.rank].limit + s.launBonus;
const up50 = (v: number) => Math.ceil(v / 50) * 50;
/** what the banker asks tonight for each deal */
export const bankerCost = (s: GameState, deal: BankDeal) => up50(baseLaunderLimit(s) * (deal === 'limit' ? RULES.banker.limitCost : RULES.banker.feeCost));
export const bankerBoost = (s: GameState) => up50(baseLaunderLimit(s) * RULES.banker.limitBoost);
export const launderLimit = (s: GameState) => baseLaunderLimit(s) + (s.bank === 'limit' ? bankerBoost(s) : 0);
export const launderFee = (s: GameState) => (s.bank === 'fee' ? RULES.banker.fee : RULES.launderFee);
const bribeTotal = (s: GameState) => (s.bank ? bankerCost(s, s.bank) : 0);
export const owedTotal = (s: GameState) => ACCS.reduce((t, k) => t + (s.pay[k] !== false ? s.owed[k] || 0 : 0), 0);
/** dirty money available to hide tonight (after paying accomplices) */
export const available = (s: GameState) => Math.max(0, s.cash - owedTotal(s) - bribeTotal(s));
export const raidOdds = (s: GameState) =>
  Math.round(Math.min(RULES.raidMaxOdds, clamp100(s.threat) / RULES.raidThreatDivisor + (s.tavro ? RULES.raidBrandedBonus : 0)) * 100);
export const dangerZone = (s: GameState) => (s.tavro ? RULES.dangerZoneBranded : RULES.dangerZone);

/** Portrait sets that exist (public/art). Founder of era I uses heroes/, every later head uses heirs/eN-. */
export const PORTRAIT_ERAS = [1, 2, 3, 4, 5];
export function portraitFor(era: number, gen: number, g: Gender, face: number | null | undefined): string | null {
  if (face === null || face === undefined) return null;
  if (era === 1 && gen === 1) return `art/heroes/${g}${face + 1}.jpg`;
  return PORTRAIT_ERAS.includes(era) ? `art/heirs/e${era}-${g}${face + 1}.jpg` : null;
}

export const kidStage = (k: Kin) => (k.age < 12 ? 'child' : k.age < 18 ? 'teen' : 'adult') as 'child' | 'teen' | 'adult';
export const allowance = (k: Kin) => RULES.family.allowance[kidStage(k)];
export const liveKids = (s: GameState) => s.kids.filter((k) => !k.gone);
export const liveSibs = (s: GameState) => s.sibs.filter((k) => !k.gone);
export const kidStars = (k: { prep: number }) => 1 + (k.prep >= 40 ? 1 : 0) + (k.prep >= 80 ? 1 : 0);
/** child whose name receives the "write it on the kids" stash (era III+): the most loyal one */
export function kidStashTarget(s: GameState): Kin | null {
  if (s.era < RULES.family.stashFromEra) return null;
  const L = liveKids(s);
  return L.length ? [...L].sort((a, b) => b.l - a.l)[0] : null;
}
const famFind = (s: GameState, id: string) => s.kids.concat(s.sibs).find((x) => x.id === id);

/** Would this delta push any meter over the edge? (UI shows a skull) */
export function isFatal(s: GameState, d: Delta): boolean {
  const p = s.shadow > 0 ? s.patron : s.patron + (d.p || 0);
  return [p, s.people + (d.n || 0), s.system + (d.s || 0)].some((x) => x <= 0 || x >= 100) || s.threat + (d.i || 0) >= 100;
}

export function offersFor(s: GameState): Offer[] {
  const R = getEra(s.era).ranks, o: Offer[] = [], O = RULES.offers;
  const last = R.length - 1;
  if (s.rank < last && s.patron > O.patronMin) {
    const r = R[s.rank + 1];
    o.push({ id: 'promo', t: S(s, 'offer.promo.t', { rank: s.gender === 'f' ? r.tf : r.t }), sub: S(s, 'offer.promo.sub', { cost: fmt(r.cost) }), btn: S(s, 'offer.promo.btn', { cost: fmt(r.cost) }) });
  }
  if (s.rank === last && s.patron > O.patronMin) o.push({ id: 'pres', t: S(s, 'offer.pres.t'), sub: S(s, 'offer.pres.sub'), btn: S(s, 'offer.pres.btn') });
  if (s.served >= O.retireAfter) o.push({ id: 'retire', t: S(s, 'offer.retire.t'), sub: S(s, 'offer.retire.sub'), btn: S(s, 'offer.retire.btn') });
  if (s.clean >= O.fleeCleanMin) o.push({ id: 'flee', t: S(s, 'offer.flee.t'), sub: S(s, 'offer.flee.sub'), btn: S(s, 'offer.flee.btn') });
  return o;
}

// ============================================================ office documents

const WHO_BY_CHOICE: Record<number, Who> = { 0: { kind: 'boss' }, 1: { kind: 'acc', acc: 'dobbs' }, 2: { kind: 'journo' }, 5: { kind: 'acc', acc: 'otto' } };

/** Today's pile of documents, in order. Pure function of state. */
export function docsFor(s: GameState): Doc[] {
  const C = getEra(s.era);
  const Sc = C.schemes, Ch = C.choices as Choice[];
  const ci = (s.served * 5) % Ch.length, ci2 = (s.served * 5 + 3) % Ch.length;
  const list: Doc[] = [{ kind: 'scheme', scheme: Sc[s.served % Sc.length] }, { kind: 'choice', choice: Ch[ci], who: WHO_BY_CHOICE[ci] || null }];
  if (s.rank >= 2) list.push({ kind: 'choice', choice: Ch[ci2], who: WHO_BY_CHOICE[ci2] || null });
  if (s.served % 3 === 2) list.unshift({ kind: 'choice', choice: meetDoc(s), who: { kind: 'acc', acc: 'pike' } });
  const LS = liveSibs(s), LK = liveKids(s);
  if (s.served % 4 === 3 && LS.length) { const sb = LS[s.served % LS.length]; list.splice(1, 0, { kind: 'choice', choice: sibDoc(s, sb), who: { kind: 'fam', id: sb.id } }); }
  if (s.served % 3 === 1 && LK.length) {
    const kd = [...LK].sort((a, b) => b.age - a.age)[s.served % LK.length];
    list.splice(1, 0, { kind: 'choice', choice: kidDoc(s, kd), who: { kind: 'fam', id: kd.id } });
  }
  return list;
}

export const currentDoc = (s: GameState): Doc => { const d = docsFor(s); return d[Math.min(s.doc, d.length - 1)]; };

/** Scheme question with the budget filled in ("{B}" → "6 000 кр"). */
export const schemeText = (s: GameState, q: string, budget: number) =>
  q.replace('{B}', fmt(budget * getEra(s.era).ranks[s.rank].mult) + ' кр');

function meetDoc(s: GameState): Choice {
  const name = s.acc.pike.n, v = { name };
  return {
    from: name, say: S(s, 'meet.say'), gist: S(s, 'meet.gist', v), q: S(s, 'meet.q', v),
    opts: [
      { t: S(s, 'meet.o1.t'), d: { s: 5, cash: -200 }, al: { pike: { l: 25, k: 5 } }, h: S(s, 'meet.o1.h'), b: S(s, 'meet.o1.b', v) },
      { t: S(s, 'meet.o2.t'), d: { s: -6 }, al: { pike: { l: -25, k: 0 } }, h: S(s, 'meet.o2.h'), b: S(s, 'meet.o2.b', v) },
      { t: S(s, 'meet.o3.t'), dark: true, d: { i: -20, s: -15, p: 5, n: 4 }, flag: 'sellout', h: S(s, 'meet.o3.h', v), b: S(s, 'meet.o3.b') }
    ]
  };
}

function kidDoc(s: GameState, kd: Kin): Choice {
  const g = kd.g, st = kidStage(kd), id = kd.id;
  const v = { name: kd.first, age: kd.age, surname: s.surname, par: S(s, s.gender === 'f' ? 'word.mom' : 'word.dad') };
  if (st === 'child') return {
    from: kd.first, say: S(s, 'kid.child.say', v, s.gender), gist: S(s, 'kid.child.gist', v), q: S(s, 'kid.child.q', v),
    opts: [
      { t: S(s, 'kid.child.o1.t'), d: { s: -5 }, fam: { id, l: 15 }, h: S(s, 'kid.child.o1.h', v), b: S(s, 'kid.child.o1.b') },
      { t: S(s, 'kid.child.o2.t'), d: { cash: -200 }, fam: { id, l: 4 }, h: S(s, 'kid.child.o2.h'), b: S(s, 'kid.child.o2.b') },
      { t: S(s, 'kid.child.o3.t'), dark: true, d: { s: 4 }, fam: { id, l: -18 }, h: S(s, 'kid.child.o3.h'), b: S(s, 'kid.child.o3.b', v, g) }
    ]
  };
  if (st === 'teen' && kd.trait === null) {
    const W = getEra(s.era).words.upbringing;
    const third: ChoiceOption = s.era >= RULES.family.stashFromEra
      ? { t: S(s, 'kid.teen.biz.t', v, g), dark: true, d: { cash: -1500 }, fam: { id, trait: 3, prep: 15, assets: 1500, k: 15 }, h: S(s, 'kid.teen.biz.h'), b: S(s, 'kid.teen.biz.b', v) }
      : { t: S(s, 'kid.teen.god.t'), d: { p: -6 }, fam: { id, trait: 2, prep: 15, l: 5 }, h: S(s, 'kid.teen.god.h', v), b: S(s, 'kid.teen.god.b') };
    return {
      from: kd.first, say: S(s, 'kid.teen.say', v, g), gist: S(s, 'kid.teen.gist', v), q: S(s, 'kid.teen.q', v),
      opts: [
        { t: W.eduOpt, d: { cash: -600 }, fam: { id, trait: 0, prep: 25 }, h: S(s, 'kid.teen.edu.h', { ...v, opt: W.eduOpt.toLowerCase() }), b: W.eduB },
        { t: W.linksOpt, d: { cash: -400, n: 3 }, fam: { id, trait: 1, prep: 15, l: 5 }, h: W.linksH + kd.first + ' ' + s.surname, b: S(s, 'kid.teen.links.b', v) },
        third
      ]
    };
  }
  if (s.served % 2 === 0) return {
    from: kd.first, say: S(s, 'kid.job.say'), gist: S(s, 'kid.job.gist', v), q: S(s, 'kid.job.q', v),
    opts: [
      { t: S(s, 'kid.job.o1.t'), d: { s: 5, n: -6 }, fam: { id, l: 12, k: 18, prep: 15 }, h: S(s, 'kid.job.o1.h', v), b: S(s, 'kid.job.o1.b', v) },
      { t: S(s, 'kid.job.o2.t'), d: { n: 2 }, fam: { id, l: -15 }, h: S(s, 'kid.job.o2.h'), b: S(s, 'kid.job.o2.b', v, g) },
      { t: S(s, 'kid.job.o3.t'), d: { cash: -800 }, fam: { id, l: 6, prep: 10 }, h: S(s, 'kid.job.o3.h', v), b: S(s, 'kid.job.o3.b') }
    ]
  };
  return {
    from: kd.first, say: S(s, 'kid.crash.say', v, g), gist: S(s, 'kid.crash.gist', v, g), q: S(s, 'kid.crash.q', v, g),
    opts: [
      { t: S(s, 'kid.crash.o1.t'), d: { cash: -600, i: 10 }, fam: { id, l: 15, k: 10 }, h: S(s, 'kid.crash.o1.h'), b: S(s, 'kid.crash.o1.b') },
      { t: S(s, 'kid.crash.o2.t'), d: { n: 8, s: -4 }, fam: { id, l: -30 }, h: S(s, 'kid.crash.o2.h', v), b: S(s, 'kid.crash.o2.b', v) },
      { t: S(s, 'kid.crash.o3.t'), dark: true, d: { n: 6, i: -8 }, fam: { id, gone: S(s, 'kid.crash.o3.why') }, h: S(s, 'kid.crash.o3.h', v), b: S(s, 'kid.crash.o3.b') }
    ]
  };
}

function sibDoc(s: GameState, sb: Kin): Choice {
  const g = sb.g, id = sb.id;
  const v = { name: sb.first, surname: s.surname, rel: S(s, g === 'f' ? 'word.sister' : 'word.brother'), amt: fk(sb.assets) };
  if (sb.assets > 0 && s.served % 2 === 1) return {
    from: sb.first, say: S(s, 'sib.assets.say', v), gist: S(s, 'sib.assets.gist', v, g), q: S(s, 'sib.assets.q', v),
    opts: [
      { t: S(s, 'sib.assets.o1.t'), d: { s: 4, n: -4, clean: sb.assets }, fam: { id, assets: -sb.assets, l: 10, k: 15 }, h: S(s, 'sib.assets.o1.h', v), b: S(s, 'sib.assets.o1.b', v) },
      { t: S(s, 'sib.assets.o2.t'), d: {}, fam: { id, l: 6 }, h: S(s, 'sib.assets.o2.h'), b: S(s, 'sib.assets.o2.b', v) },
      { t: S(s, 'sib.assets.o3.t'), dark: true, d: { n: -6, i: 6, clean: Math.round(sb.assets / 2) }, fam: { id, assets: -sb.assets, l: -45 }, h: S(s, 'sib.assets.o3.h'), b: S(s, 'sib.assets.o3.b', v) }
    ]
  };
  if (s.served % 2 === 1) return {
    from: sb.first, say: S(s, 'sib.share.say'), gist: S(s, 'sib.share.gist', v), q: S(s, 'sib.share.q', v),
    opts: [
      { t: S(s, 'sib.share.o1.t'), d: { s: 4, cash: -200 }, fam: { id, l: 15, k: 20 }, h: S(s, 'sib.share.o1.h'), b: S(s, 'sib.share.o1.b', v) },
      { t: S(s, 'sib.share.o2.t'), d: {}, fam: { id, l: -15 }, h: S(s, 'sib.share.o2.h'), b: S(s, 'sib.share.o2.b', v, g) },
      { t: S(s, 'sib.share.o3.t'), dark: true, d: { i: -12, s: -8 }, fam: { id, gone: S(s, 'sib.share.o3.why', v, g) }, h: S(s, 'sib.share.o3.h', v), b: S(s, 'sib.share.o3.b') }
    ]
  };
  const knows = sb.k >= 40;
  return {
    from: sb.first, say: S(s, 'sib.grudge.say'), gist: S(s, sb.k >= 30 ? 'sib.grudge.gistKnows' : 'sib.grudge.gist', v), q: S(s, 'sib.grudge.q', v),
    opts: [
      { t: S(s, 'sib.grudge.o1.t'), d: { cash: -800 }, fam: { id, l: 25 }, h: S(s, 'sib.grudge.o1.h', v), b: S(s, 'sib.grudge.o1.b') },
      { t: S(s, 'sib.grudge.o2.t'), d: {}, fam: { id, l: -20 }, h: S(s, 'sib.grudge.o2.h'), b: S(s, 'sib.grudge.o2.b', v, g) },
      { t: S(s, 'sib.grudge.o3.t'), dark: true, d: { n: -3, i: knows ? 15 : 0 }, fam: { id, gone: S(s, 'sib.grudge.o3.why', v, g) }, h: S(s, 'sib.grudge.o3.h', v), b: S(s, knows ? 'sib.grudge.o3.bKnows' : 'sib.grudge.o3.b', v) }
    ]
  };
}

// ============================================================ core helpers (mutate a draft)

function apply(n: GameState, d: Delta) {
  if (d.p && n.shadow <= 0) n.patron += d.p;
  n.people += d.n || 0;
  n.system += d.s || 0;
  n.threat = Math.max(0, n.threat + (d.i || 0));
  n.cash += d.cash || 0;
  n.clean += d.clean || 0;
  if (n.cash < 0) { n.clean += n.cash; n.cash = 0; }
  if (n.clean < 0) n.clean = 0; // money never goes negative: you pay what you have
}

/** Money an option costs: `cash` costs are paid from the drawer first, then clean; `clean` costs only from clean. */
export const costOf = (d: Delta) => Math.max(0, -(d.cash || 0)) + Math.max(0, -(d.clean || 0));
export function canAfford(s: GameState, d: Delta): boolean {
  const cleanCost = Math.max(0, -(d.clean || 0)), dirtyCost = Math.max(0, -(d.cash || 0));
  return cleanCost <= s.clean && dirtyCost <= s.cash + s.clean - cleanCost;
}
/** Options the UI should enable: affordable ones, or all of them if nothing is affordable. */
export function enabledOptions(s: GameState, opts: { d: Delta }[]): boolean[] {
  const ok = opts.map((o) => canAfford(s, o.d));
  return ok.some(Boolean) ? ok : ok.map(() => true);
}

function deathOf(n: GameState): [string, string] | null {
  const k = n.threat >= 100 ? 'exposed' : n.patron <= 0 ? 'fired' : n.patron >= 100 ? 'soldOut' : n.people <= 0 ? 'riot'
    : n.people >= 100 ? 'tooLoved' : n.system <= 0 ? 'betrayedLow' : n.system >= 100 ? 'betrayedHigh' : null;
  return k ? [S(n, `death.${k}.t`), S(n, `death.${k}.x`)] : null;
}

function newKid(n: GameState, age: number): Kin {
  const N = getEra(n.era).names, g: Gender = rand(n) < 0.5 ? 'm' : 'f';
  const used = n.kids.map((k) => k.first).concat(n.sibs.map((k) => k.first), [n.first]);
  const pool = N[g].filter((x) => !used.includes(x));
  const list = pool.length ? pool : N[g];
  n.kidSeq += 1;
  const kid: Kin = { id: 'k' + n.kidSeq, first: list[randInt(n, list.length)], g, age, trait: null, l: 60, k: 0, prep: 0, assets: 0, gone: false, why: '' };
  n.kids.push(kid);
  return kid;
}

function startFamily(n: GameState) {
  const F = RULES.family;
  n.kids = []; n.kidSeq = 0; n.kidPay = {};
  n.kidsMax = F.maxKids[0] + randInt(n, F.maxKids[1] - F.maxKids[0] + 1);
  newKid(n, F.firstChildAge[0] + randInt(n, F.firstChildAge[1] - F.firstChildAge[0] + 1));
}

function payOut(n: GameState, cost: number) {
  let left = cost;
  (['cash', 'floor', 'wh', 'clean'] as const).forEach((k) => { const c = Math.min(n[k], left); n[k] -= c; left -= c; });
}

function finish(n: GameState, kind: EndKind, title: string, text: string): GameState {
  const E = RULES.endings, stash = n.cash + n.floor + n.wh;
  let inherit = 0, lost = 0;
  if (kind === 'collapse') { inherit = Math.round(n.clean * E.collapseKeepsClean); lost = stash + n.clean - inherit; }
  if (kind === 'retire') { const half = Math.round((n.floor + n.wh) * E.retireKeepsHidden); inherit = n.clean + n.cash + half; lost = n.floor + n.wh - half; }
  if (kind === 'flee') { inherit = Math.round(n.clean * E.fleeKeepsClean); lost = stash + n.clean - inherit; }
  if (kind === 'summit') { inherit = n.clean + stash; lost = 0; }
  const last = getEra(n.era).ranks.length - 1;
  const dream = (n.dream === 0 && n.clean >= RULES.dreamCleanGoal) || (n.dream === 1 && n.rank >= last)
    || (n.dream === 2 && kind === 'retire' && n.threat < RULES.dreamCleanThreat) || (n.dream === 3 && kind === 'summit');
  const dynastyOver = kind === 'collapse' && n.tavro;
  const eraOver = !dynastyOver && n.gen >= RULES.gensPerEra;
  const campaignOver = eraOver && n.era >= ERA_COUNT;
  n.ending = {
    kind, title, text, inherit, lost, dream, dynastyOver, eraOver, campaignOver,
    header: S(n, 'end.header.' + kind),
    life: S(n, 'end.life', { rank: rankName(n), from: n.year - n.served, to: n.year, gen: n.gen }),
    kidAssets: liveKids(n).reduce((a, k) => a + k.assets, 0)
  };
  n.history.push({ era: n.era, gen: n.gen, name: n.first + ' ' + n.surname, kind, title, inherit,
    g: n.gender, face: n.face ?? null, rank: rankName(n), from: n.year - n.served, to: n.year, text, lost, dream, kids: n.kids.length });
  const heirs: Heir[] = [...liveKids(n)].sort((a, b) => b.age - a.age).slice(0, 3);
  if (!heirs.length) {
    const N = getEra(n.era).names;
    heirs.push({ id: 'nephew', first: N.m[(n.year + 3) % N.m.length], g: 'm', trait: null, l: 35, k: 0, prep: 0, assets: 0, age: 20, gone: false, why: '', nephew: true });
  }
  // distinct portrait per heir of the same gender
  (['m', 'f'] as Gender[]).forEach((g) => {
    const pool = [0, 1, 2];
    for (let i = pool.length - 1; i > 0; i--) { const j = randInt(n, i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    heirs.filter((h) => h.g === g).forEach((h, i) => { h.face = pool[i % 3]; });
  });
  n.heirs = dynastyOver || campaignOver ? [] : heirs;
  n.screen = 'ending';
  return n;
}

/** End of a decision: check death, move to next document or to the evening. */
function advance(n: GameState): GameState {
  const dead = deathOf(n);
  if (dead) return finish(n, 'collapse', dead[0], dead[1]);
  n.doc += 1; n.ap = 1;
  if (n.doc >= docsFor(n).length) { n.doc = 0; n.screen = 'evening'; n.alloc = emptyAlloc(); if (n.city) cityEvening(n, n.city); }
  return n;
}

function fitAlloc(a: Alloc, s: GameState): Alloc {
  const out: Alloc = { floor: Math.max(0, a.floor), wh: Math.max(0, a.wh), laun: Math.min(Math.max(0, a.laun), launderLimit(s)), kid: kidStashTarget(s) ? Math.max(0, a.kid || 0) : 0 };
  let over = out.floor + out.wh + out.laun + out.kid - available(s);
  (['kid', 'laun', 'wh', 'floor'] as const).forEach((k) => { if (over > 0) { const c = Math.min(out[k], over); out[k] -= c; over -= c; } });
  return out;
}

// ============================================================ actions: form

export interface HeroPatch { first?: string; surname?: string; gender?: Gender; face?: number; origin?: number; dream?: number }

export function setHero(s: GameState, patch: HeroPatch): GameState {
  const n = clone(s);
  if (patch.gender && patch.gender !== s.gender && patch.first === undefined) {
    const N = getEra(s.era).names, from = s.gender === 'f' ? N.f : N.m, to = patch.gender === 'f' ? N.f : N.m;
    n.first = to[Math.max(0, from.indexOf(s.first)) % to.length];
  }
  Object.assign(n, patch);
  return n;
}

export function rollName(s: GameState): GameState {
  const n = clone(s), N = getEra(s.era).names, list = s.gender === 'f' ? N.f : N.m;
  n.first = list[randInt(n, list.length)];
  n.surname = N.s[randInt(n, N.s.length)];
  return n;
}

export function signForm(s: GameState): GameState {
  const n = clone(s);
  const C0 = getEra(n.era);
  n.first = n.first.trim() || C0.defaultHero.first;
  n.surname = n.surname.trim() || C0.defaultHero.surname;
  if (n.origin === 0) { n.system += 10; n.patron += 5; }
  if (n.origin === 1) { n.people += 10; n.thrBase = 1; }
  if (n.origin === 2) { n.clean += 800; n.launBonus = 200; }
  const title = rankName(n) + ' ' + n.first + ' ' + n.surname;
  n.headline = S(n, 'form.headline.' + n.gender, { title });
  n.body = S(n, 'form.body.' + n.gender, { title });
  startFamily(n);
  n.city = initCity(n);
  n.screen = 'morning';
  return n;
}

// ============================================================ actions: morning / office

export function toOffice(s: GameState): GameState {
  const n = clone(s);
  Object.assign(n, { screen: 'office', doc: 0, ap: 1, last: {}, lastStamp: null });
  return n;
}

export function setAppetite(s: GameState, ap: 0 | 1 | 2): GameState {
  const n = clone(s); n.ap = ap; return n;
}

/** Effect of signing the current scheme at appetite ap (for preview pills). */
export function schemeDelta(s: GameState, ap = s.ap): Delta {
  const d = currentDoc(s);
  if (d.kind !== 'scheme') return {};
  const sc = d.scheme;
  return { p: sc.p[ap], n: sc.n[ap], s: sc.s[ap], i: sc.i[ap], cash: take(s, sc.budget, ap) };
}

export function signScheme(s: GameState): GameState {
  const doc = currentDoc(s);
  if (s.screen !== 'office' || doc.kind !== 'scheme') throw new Error('No scheme to sign');
  const sc = doc.scheme, ap = s.ap, d = schemeDelta(s, ap), n = clone(s);
  apply(n, d);
  n.owed[sc.acc] = (n.owed[sc.acc] || 0) + Math.round((d.cash! * RULES.accShare) / 10) * 10;
  n.acc[sc.acc].k = clamp100(n.acc[sc.acc].k + sc.k[ap]);
  n.headline = sc.h[ap]; n.body = sc.b[ap]; n.last = d;
  n.lastStamp = 'signed'; n.lastDec = { t: sc.yes, d };
  return advance(n);
}

export function declineScheme(s: GameState): GameState {
  const doc = currentDoc(s);
  if (s.screen !== 'office' || doc.kind !== 'scheme') throw new Error('No scheme to decline');
  const no = doc.scheme.no, n = clone(s);
  apply(n, no.d);
  (Object.keys(no.al || {}) as AccKey[]).forEach((k) => { n.acc[k].l = clamp100(n.acc[k].l + (no.al![k] || 0)); });
  n.headline = no.h; n.body = no.b; n.last = no.d;
  n.lastStamp = 'declined'; n.lastDec = { t: no.t, d: no.d };
  return advance(n);
}

export function pickOption(s: GameState, index: number): GameState {
  const doc = currentDoc(s);
  if (s.screen !== 'office' || doc.kind !== 'choice') throw new Error('No choice to answer');
  const o = doc.choice.opts[index];
  if (!o) throw new Error('No option ' + index);
  if (!enabledOptions(s, doc.choice.opts)[index]) throw new Error('Option not affordable');
  const n = clone(s);
  apply(n, o.d);
  if (o.al) (Object.keys(o.al) as AccKey[]).forEach((k) => { const x = n.acc[k], f = o.al![k]!; x.l = clamp100(x.l + (f.l || 0)); x.k = clamp100(x.k + (f.k || 0)); });
  if (o.flag === 'blood') n.blood = true;
  if (o.flag === 'sellout') { n.acc.pike.l = 30; n.acc.pike.k = 0; n.owed.pike = 0; }
  if (o.fam) {
    const kd = famFind(n, o.fam.id), f = o.fam;
    if (kd) {
      if (f.l) kd.l = clamp100(kd.l + f.l);
      if (f.k) kd.k = clamp100(kd.k + f.k);
      if (f.prep) kd.prep = clamp100(kd.prep + f.prep);
      if (f.trait !== undefined) kd.trait = f.trait;
      if (f.assets) kd.assets = Math.max(0, kd.assets + f.assets);
      if (f.gone) { kd.gone = true; kd.why = f.gone; }
      if (kd.l <= 0 && !kd.gone) { kd.gone = true; kd.why = S(n, 'why.renounce', {}, kd.g); }
    }
  }
  n.headline = o.h; n.body = o.b; n.last = o.d;
  n.lastStamp = o.dark ? 'dark' : 'decided'; n.lastDec = { t: o.t, d: o.d };
  return advance(n);
}

// ============================================================ actions: evening

export type StashKey = keyof Alloc;

export function adjustAlloc(s: GameState, key: StashKey, dv: number): GameState {
  const n = clone(s), a = n.alloc;
  if (key === 'kid' && !kidStashTarget(s)) return n;
  const others = a.floor + a.wh + a.laun + a.kid - a[key];
  let v = Math.max(0, Math.min(a[key] + dv, available(s) - others));
  if (key === 'laun') v = Math.min(v, launderLimit(s));
  a[key] = Math.max(0, v);
  return n;
}
export const allTo = (s: GameState, key: StashKey) => adjustAlloc(s, key, 1e9);

export function togglePay(s: GameState, k: AccKey): GameState {
  const n = clone(s);
  n.pay[k] = n.pay[k] === false;
  n.alloc = fitAlloc(n.alloc, n);
  return n;
}

export function toggleKidPay(s: GameState, id: string): GameState {
  const n = clone(s); n.kidPay[id] = n.kidPay[id] === false; return n;
}

/** Bribe the banker for tonight (or cancel). Paid from dirty money in the drawer when the safe is locked. */
export function setBank(s: GameState, deal: BankDeal | null): GameState {
  const n = clone(s);
  if (deal && s.bank !== deal && s.cash - owedTotal(s) < bankerCost(s, deal)) return n;
  n.bank = deal && s.bank !== deal ? deal : null;
  n.alloc = fitAlloc(n.alloc, n);
  return n;
}

export function sameAsLast(s: GameState): GameState {
  if (!s.lastAlloc) return s;
  const n = clone(s); n.alloc = fitAlloc(s.lastAlloc, s); return n;
}

/** dirty money still in the drawer after the planned allocation */
export const unhidden = (s: GameState) => available(s) - s.alloc.floor - s.alloc.wh - s.alloc.laun - s.alloc.kid;

/** Close the safe: pay people, hide money, roll the night (raid, family, meters), age one year. */
export function lockSafe(s: GameState): GameState {
  if (s.screen !== 'evening') throw new Error('Not evening');
  const n = clone(s), rep: ReportLine[] = [], F = RULES.family;

  ACCS.forEach((k) => {
    const o = n.owed[k] || 0;
    if (!o) return;
    const x = n.acc[k];
    if (n.pay[k] !== false) { n.cash -= o; x.l = clamp100(x.l + RULES.accPaidLoyalty); rep.push(line(S(n, 'rep.accPaid', { name: x.n, amt: fmt(o) }), 'ok', 'share')); }
    else { x.l = clamp100(x.l + RULES.accUnpaidLoyalty); rep.push(line(S(n, 'rep.accUnpaid', { name: x.n }), 'warn', 'heart')); }
  });
  n.owed = {}; n.pay = {};

  liveKids(n).forEach((kd) => {
    const cost = allowance(kd), st = kidStage(kd);
    if (n.kidPay[kd.id] !== false && n.clean >= cost) { n.clean -= cost; kd.l = clamp100(kd.l + F.allowanceLoyalty); kd.prep = clamp100(kd.prep + F.allowancePrep[st]); }
    else { kd.l = clamp100(kd.l + F.noAllowanceLoyalty); rep.push(line(S(n, n.kidPay[kd.id] === false ? 'rep.kidNoAllowance' : 'rep.kidNoMoney', { name: kd.first }), 'warn', 'heart')); }
  });
  n.kidPay = {};

  if (s.bank) {
    const cost = bankerCost(s, s.bank);
    n.cash -= cost; n.threat += RULES.banker.threat[s.bank];
    rep.push(line(s.bank === 'limit' ? S(n, 'rep.bankLimit', { amt: fmt(cost), lim: fmt(launderLimit(s)) }) : S(n, 'rep.bankFee', { amt: fmt(cost), fee: Math.round(RULES.banker.fee * 100) }), 'neu', 'laun'));
  }

  const a = fitAlloc(n.alloc, s);
  n.cash = Math.max(0, n.cash - a.floor - a.wh - a.laun - a.kid);
  const kt = kidStashTarget(n);
  if (a.kid > 0 && kt) { kt.assets += a.kid; kt.k = clamp100(kt.k + Math.round(a.kid / 100) * 2); rep.push(line(S(n, 'rep.kidStash', { name: kt.first, amt: fmt(a.kid) }), 'ok', 'kid')); }
  n.floor += a.floor; n.wh += a.wh;
  if (a.wh > 0) n.acc.otto.k = clamp100(n.acc.otto.k + 5);
  if (a.laun > 0) { const net = Math.round(a.laun * (1 - launderFee(s))); n.clean += net; rep.push(line(S(n, 'rep.laundered', { amt: fmt(a.laun), net: fmt(net) }), 'ok', 'laun')); }
  n.lastAlloc = a; n.alloc = emptyAlloc(); n.bank = null;

  ACCS.forEach((k) => {
    const x = n.acc[k], I = RULES.insider;
    if (x.l <= I.loyaltyMax && x.k >= I.knowsMin) {
      n.threat += I.threat; x.k = Math.round(x.k / 2); x.l = 40;
      rep.push(line(S(n, 'rep.insider', { name: x.n }), 'bad', 'ear', true));
      n.headline = S(n, 'news.insider.h'); n.body = S(n, 'news.insider.b');
    }
  });

  if (rand(n) * 100 < raidOdds(n)) {
    const found: string[] = [];
    if (n.cash > 0) { found.push(S(n, 'search.cash', { amt: fmt(n.cash) })); n.cash = 0; }
    if (n.floor > 0 && rand(n) < RULES.floorFoundChance) { found.push(S(n, 'search.floor', { amt: fmt(n.floor) })); n.floor = 0; }
    if (n.wh > 0 && n.acc.otto.l < RULES.warehouseUnsafeLoyalty) { found.push(S(n, 'search.wh', { amt: fmt(n.wh) })); n.wh = 0; }
    if (found.length) {
      n.threat += 10 * found.length;
      rep.push(line(S(n, 'rep.searchFound', { found: found.join(', '), risk: 10 * found.length }), 'bad', 'threat', true));
      n.headline = S(n, 'news.search.h', { surname: n.surname }); n.body = S(n, 'news.search.b');
    } else {
      n.threat = Math.max(0, n.threat - 10);
      rep.push(line(S(n, 'rep.searchEmpty'), 'ok', 'floor', true));
      n.headline = S(n, 'news.searchEmpty.h'); n.body = S(n, 'news.searchEmpty.b');
    }
  } else rep.push(line(S(n, 'rep.noSearch'), 'neu', 'floor'));

  const base = n.thrBase + (n.tavro ? RULES.threatBranded : 0) + (n.blood ? RULES.threatBlood : 0);
  n.threat += base;
  rep.push(line(S(n, n.blood ? 'rep.riskBaseBlood' : 'rep.riskBase', { n: base }), 'neu', 'threat'));
  const dz = dangerZone(n), slid: string[] = [];
  (['patron', 'people', 'system'] as const).forEach((m) => {
    if (m === 'patron' && n.shadow > 0) return;
    const v = n[m];
    if (v <= dz) { n[m] = v - RULES.slidePerYear; slid.push(S(n, 'meter.' + m)); }
    else if (v >= 100 - dz) { n[m] = v + RULES.slidePerYear; slid.push(S(n, 'meter.' + m)); }
  });
  if (slid.length) rep.push(line(S(n, 'rep.slide', { list: slid.join(', ') }), 'warn', 'skull'));
  if (n.shadow > 0) {
    n.shadow -= 1; n.patron = RULES.shadowPatron;
    rep.push(line(n.shadow > 0 ? S(n, 'rep.shadowLeft', { n: n.shadow }) : S(n, 'rep.shadowEnd'), 'neu', 'patron'));
  }

  const flash = getEra(n.era).words.kids.flash, T = F.testify;
  liveKids(n).forEach((kd) => {
    kd.age += 1;
    if (kd.assets > 0 && rand(n) * 100 < Math.min(F.scandalMaxPct, kd.assets / F.scandalAssetsPerPct)) {
      n.threat += F.scandalThreat; kd.k = clamp100(kd.k + 5);
      rep.push(line(S(n, 'rep.scandal', { name: kd.first, flash }), 'bad', 'ear'));
      n.headline = S(n, 'news.scandal.h', { surname: n.surname, flash }, kd.g); n.body = S(n, 'news.scandal.b');
    }
    if (kd.l <= T.loyaltyMax && kd.k >= T.knowsMin) {
      n.threat += T.threat; kd.gone = true; kd.why = S(n, 'why.testify', {}, kd.g);
      rep.push(line(S(n, 'rep.kidTestify', { name: kd.first }, kd.g), 'bad', 'kid', true));
      n.headline = S(n, 'news.kidTestify.h', { surname: n.surname }); n.body = S(n, 'news.kidTestify.b');
    } else if (kd.l <= 0) {
      kd.gone = true; kd.why = S(n, 'why.renounce', {}, kd.g);
      rep.push(line(S(n, 'rep.kidRenounce', { name: kd.first }, kd.g), 'bad', 'kid', true));
    }
  });
  liveSibs(n).forEach((sb) => {
    sb.age += 1;
    const rel = S(n, sb.g === 'f' ? 'word.sister' : 'word.brother');
    if (sb.l <= T.loyaltyMax && sb.k >= T.knowsMin) {
      n.threat += T.threat; sb.gone = true; sb.why = S(n, 'why.testify', {}, sb.g);
      rep.push(line(S(n, 'rep.sibTestify', { rel, name: sb.first }, sb.g), 'bad', 'kid', true));
      n.headline = S(n, 'news.sibTestify.h', { rel, surname: n.surname }); n.body = S(n, 'news.sibTestify.b');
    } else if (sb.l <= 0) {
      sb.gone = true; sb.why = S(n, 'why.sibBreak', {}, sb.g);
      rep.push(line(S(n, 'rep.sibBreak', { rel, name: sb.first }, sb.g), 'warn', 'kid'));
    }
  });
  if (n.kids.length < n.kidsMax && n.served >= F.birthWindow[0] && n.served <= F.birthWindow[1] && rand(n) < F.birthChance) {
    const b = newKid(n, 0);
    rep.push(line(S(n, 'rep.birth', { name: b.first }, b.g), 'ok', 'kid', true));
  }

  n.served += 1; n.year += 1; n.last = {};
  n.report = rep;
  const dead = deathOf(n);
  if (dead) return finish(n, 'collapse', dead[0], dead[1]);
  if (n.served >= RULES.careerYears) return finish(n, 'retire', S(n, 'end.twenty.t'), S(n, 'end.twenty.x'));
  n.offers = offersFor(n);
  n.screen = 'night';
  return n;
}

// ============================================================ actions: night

export function acceptOffer(s: GameState, id: Offer['id']): GameState {
  if (s.screen !== 'night') throw new Error('Not night');
  const n = clone(s);
  if (id === 'retire') return finish(n, 'retire', S(n, 'end.retire.t'), S(n, 'end.retire.x', { n: n.served }));
  if (id === 'flee') return finish(n, 'flee', S(n, 'end.flee.t'), S(n, 'end.flee.x'));
  const R = getEra(n.era).ranks;
  const cost = id === 'pres' ? RULES.presidentFee : R[n.rank + 1].cost;
  if (n.cash + n.floor + n.wh + n.clean < cost) {
    n.report.push(line(S(n, 'rep.noMoney', { cost: fmt(cost) }), 'bad', 'dirty'));
    n.offers = n.offers.filter((x) => x.id !== id);
    return n;
  }
  payOut(n, cost);
  if (id === 'pres') {
    n.camp = { round: 1, me: Math.round(26 + n.people / 5), rival: RULES.campaign.rivalStart, fraud: 0, log: '' };
    n.screen = 'campaign';
    return n;
  }
  n.rank += 1;
  if (n.shadow <= 0) n.patron = Math.max(1, n.patron - RULES.promoPatronCost);
  n.threat += RULES.promoThreat;
  n.report.push(line(S(n, 'rep.promo', { rank: rankName(n) }), 'ok', 'patron', true));
  n.headline = S(n, 'news.promo.h', { rank: rankName(n), first: n.first, surname: n.surname });
  n.body = S(n, 'news.promo.b');
  n.offers = n.offers.filter((x) => x.id !== 'promo');
  return n;
}

export function sleep(s: GameState): GameState {
  const n = clone(s);
  Object.assign(n, { screen: 'morning', doc: 0, ap: 1, last: {} });
  if (n.city && n.city.v === CITY_V) cityMorning(n, n.city); else n.city = initCity(n);
  return n;
}

// ============================================================ actions: election

export interface CampaignAct { id: string; t: string; cost: number; me: number; rival: number; fraud: number; d: Delta; dark?: boolean }

export function campaignActs(s: GameState): CampaignAct[] {
  const W = getEra(s.era).words.campaign;
  return [
    { id: 'rally', t: S(s, 'camp.rally'), cost: 500, me: 3, rival: 0, fraud: 0, d: { n: 4 } },
    { id: 'media', t: W.media, cost: 1500, me: 6, rival: 0, fraud: 0, d: {} },
    { id: 'gift', t: W.gift, cost: 1000, me: 8, rival: 0, fraud: 15, d: { i: 4, n: -2 }, dark: true },
    { id: 'kompromat', t: S(s, 'camp.kompromat'), cost: 800, me: 0, rival: -6, fraud: 10, d: { i: 3 }, dark: true },
    { id: 'admin', t: S(s, 'camp.admin'), cost: 0, me: 6, rival: 0, fraud: 20, d: { s: 6, n: -3 }, dark: true }
  ];
}

export const totalMoney = (s: GameState) => s.cash + s.floor + s.wh + s.clean;

export function campaignAct(s: GameState, id: string): GameState {
  if (s.screen !== 'campaign' || !s.camp) throw new Error('No campaign');
  const a = campaignActs(s).find((x) => x.id === id);
  if (!a) throw new Error('Unknown act ' + id);
  if (totalMoney(s) < a.cost) return s;
  const n = clone(s), c = n.camp!, K = RULES.campaign;
  payOut(n, a.cost);
  apply(n, a.d);
  c.me = Math.min(K.meCap, c.me + a.me);
  c.rival = Math.max(K.rivalFloor, c.rival + a.rival + (rand(n) < 0.5 ? K.rivalDrift[0] : K.rivalDrift[1]));
  c.fraud = Math.min(100, c.fraud + a.fraud);
  c.log = S(n, 'camp.log', { act: a.t });
  c.round += 1; n.last = a.d;
  const dead = deathOf(n);
  if (dead) return finish(n, 'collapse', dead[0], dead[1]);
  if (c.round > K.rounds) n.screen = 'elect';
  return n;
}

/** Election night. stuff=true → ballot stuffing (+votes, +suspicion). */
export function electionNight(s: GameState, stuff: boolean): GameState {
  if (s.screen !== 'elect' || !s.camp) throw new Error('Not election night');
  const n = clone(s), c = n.camp!, K = RULES.campaign;
  let me = c.me + Math.round(rand(n) * 6 - 3);
  const rival = c.rival + Math.round(rand(n) * 6 - 3);
  if (stuff) { me += K.stuffVotes; c.fraud = Math.min(100, c.fraud + K.stuffFraud); }
  const share = Math.round((me / (me + rival)) * 100);
  if (rand(n) * 100 < c.fraud * K.exposeFactor) return finish(n, 'collapse', S(n, 'end.fraud.t'), S(n, 'end.fraud.x'));
  if (share > 50) return finish(n, 'summit', S(n, 'end.president.t'), S(n, 'end.president.x', { share, first: n.first, surname: n.surname }));
  n.patron = Math.max(1, n.patron + K.losePatron); n.screen = 'night'; n.camp = null;
  n.report = [line(S(n, 'rep.electLost', { share }), 'bad', 'patron', true)];
  n.offers = offersFor(n).filter((x) => x.id !== 'pres');
  n.headline = S(n, 'news.electLost.h', { first: n.first, surname: n.surname }, n.gender); n.body = S(n, 'news.electLost.b');
  return n;
}

// ============================================================ actions: will / next generation

/** Pick an heir. Same era for generation 2; at the end of an era the heir opens the next one. */
export function pickHeir(s: GameState, heirId: string): GameState {
  const e = s.ending;
  if (s.screen !== 'ending' || !e) throw new Error('Not at the will');
  const h = s.heirs.find((x) => x.id === heirId);
  if (!h) throw new Error('No such heir');
  const nextEra = e.eraOver ? s.era + 1 : s.era;
  const n = newGame(s.rng, nextEra);
  n.rng = s.rng; n.history = clone(s.history);
  const tr = h.trait === null ? null : getEra(nextEra).traits[h.trait] || null;
  n.screen = 'morning'; n.surname = s.surname; n.first = h.first; n.gender = h.g; n.dream = s.dream; n.face = h.face ?? null;
  n.gen = e.eraOver ? 1 : s.gen + 1;
  if (!e.eraOver) n.year = s.year + 1;
  const H = RULES.heir;
  n.clean = Math.round((e.inherit + (e.dream ? RULES.dreamBonus : 0)) * (h.age < H.minorAge ? H.minorKeeps : 1)) + h.assets;
  startFamily(n);
  n.sibs = s.kids.filter((k) => !k.gone && k.id !== h.id).map((k) => ({
    id: 's' + k.id, first: k.first, g: k.g, age: k.age + 1, trait: k.trait, prep: k.prep,
    l: Math.max(5, k.l - RULES.family.sibResentment), k: k.k, assets: k.assets, gone: false, why: ''
  }));
  n.tavro = e.kind === 'collapse'; n.shadow = e.kind === 'summit' ? RULES.shadowYears : 0; n.rank = e.kind === 'summit' ? 1 : 0;
  n.threat = n.tavro ? 25 : 10;
  if (!e.eraOver) {
    ACCS.forEach((k) => { n.acc[k].k = Math.round(s.acc[k].k / 2); n.acc[k].l = n.tavro ? Math.max(10, s.acc[k].l - 20) : s.acc[k].l; });
  }
  if (tr) apply(n, tr.d);
  if (h.prep >= H.starsRankUp && n.rank < 1) n.rank = 1;
  if (h.nephew) n.patron += H.nephewPatron;
  if (n.shadow > 0) n.patron = RULES.shadowPatron;
  const child = S(n, h.g === 'f' ? 'word.daughter' : 'word.son');
  n.headline = S(n, `heir.${e.kind}.h`, { child, surname: s.surname });
  n.body = S(n, `heir.${e.kind}.b`, { surname: s.surname }) + (h.g === 'f' ? S(n, 'heir.femaleSuffix') : '');
  return n;
}

/** After the dynasty falls (or the campaign is won) — start over from era I, keeping history. */
export function restart(s: GameState, seed = s.rng): GameState {
  const n = newGame(seed, 1);
  n.history = clone(s.history);
  return n;
}
