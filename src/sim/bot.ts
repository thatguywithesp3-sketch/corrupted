import {
  acceptOffer, allTo, campaignAct, currentDoc, declineScheme, electionNight, liveKids, lockSafe, pickHeir, pickOption,
  setAppetite, setHero, signForm, signScheme, sleep, toOffice, toggleKidPay, newGame, restart,
  isFatal, schemeDelta, officeDone, endDay, enabledOptions, kidStashTarget, totalMoney, getEra, actOnBiz, actOnRival, bizActs, rivalActs, didAct, actOnInst, CITY_RULES, RULES, dirtyTotal, chronPick
} from '../engine';
import type { Delta, GameState } from '../engine';

/** Tiny deterministic RNG for the bot's own choices (separate from the game's RNG). */
export function botRng(seed: number) {
  let a = seed >>> 0;
  return () => { let t = (a = (a + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** how the bot treats the city: ignore it; squeeze shops greedily; or squeeze shops while keeping the rivals in check */
export type CityPolicy = 'none' | 'greedy' | 'wise';
export interface BotStyle { greed: number; offerRate: number; skipAllowance: number; darkRate: number; smart?: boolean; city?: CityPolicy }
export const STYLES: Record<string, BotStyle> = {
  careful: { greed: 0.2, offerRate: 0.3, skipAllowance: 0.05, darkRate: 0.05 },
  average: { greed: 0.5, offerRate: 0.35, skipAllowance: 0.15, darkRate: 0.2 },
  greedy: { greed: 0.85, offerRate: 0.5, skipAllowance: 0.3, darkRate: 0.4 },
  /** reads the meters and plays sensibly — a stand-in for a decent human */
  smart: { greed: 0, offerRate: 0, skipAllowance: 0, darkRate: 0, smart: true }
};

function score(s: GameState, d: Delta): number {
  if (isFatal(s, d)) return 1e6;
  const p = s.shadow > 0 ? s.patron : s.patron + (d.p || 0);
  const m = [p, s.people + (d.n || 0), s.system + (d.s || 0)];
  const edge = m.reduce((a, x) => a + Math.max(0, Math.abs(x - 50) - 20) ** 2, 0);
  const t = Math.max(0, s.threat + (d.i || 0));
  const money = (d.cash || 0) + (d.clean || 0);
  return edge * 3 + t * 1.5 + t * t / 40 - money / 120;
}

/** One city move for the morning, or null when the bot makes none. */
/** keepClean: clean money the bot will not spend on charity (it is saving it for something) */
export function cityMove(s: GameState, policy: CityPolicy = 'none', keepClean = 0): GameState | null {
  const n = cityMoveRaw(s, policy, keepClean);
  return n === s ? null : n; // the move could not be made
}
function cityMoveRaw(s: GameState, policy: CityPolicy, keepClean: number): GameState | null {
  if (policy === 'none') return null;
  const c = s.city;
  if (!c) return null;
  // wash the name before it is too late: the cheap levers first, the gendarmerie when it is getting hot
  if (s.threat >= 30) {
    const F = CITY_RULES.fame, fm = c.fame || {}, free = (id: string) => !didAct(c, 'i:' + id);
    if (!fm.whisper && free('whisper') && dirtyTotal(s) >= F.whisper.cost * 4) return actOnInst(s, 'whisper', 'hire');
    if (free('press') && dirtyTotal(s) >= F.article.cost + 150) return actOnInst(s, 'press', 'article');
    if (s.threat >= 50 && free('okhrana') && dirtyTotal(s) >= F.silence.cost) return actOnInst(s, 'okhrana', 'silence');
    if (!fm.fund && free('charity') && s.clean - F.fund.clean >= Math.max(F.fund.clean, keepClean)) return actOnInst(s, 'charity', 'fund');
    if (free('charity') && s.clean - F.donate.clean >= Math.max(F.donate.clean * 2, keepClean)) return actOnInst(s, 'charity', 'donate');
  }
  if (policy === 'wise') {
    const angry = [...c.rivals].filter((r) => !r.ally && r.heat >= 4.5).sort((a, b) => b.heat - a.heat);
    for (const r of angry.filter((x) => !didAct(c, x.id))) {
      const acts = rivalActs(s, r), by = (k: string) => acts.find((o) => o.act === k && o.can);
      const m = by('marry') || by('bribe') || (by('expose') && by('expose')!.odds > 0.5 ? by('expose') : null);
      if (m) return actOnRival(s, r.id, m.act as 'bribe' | 'expose' | 'marry');
    }
    if (s.threat >= 65) return null; // lie low
  }
  let best: { id: string; act: string; v: number } | null = null;
  for (const b of c.biz) {
    if (b.status !== 'open' || didAct(c, b.id)) continue;
    for (const o of bizActs(s, b)) {
      if (!('can' in o) || !o.can) continue;
      const gain = o.perYear ? o.gain * 3 : o.gain;
      const v = o.odds * gain - o.risk * (s.threat > 45 ? 70 : 35) - (o.cost || 0);
      if (v > 0 && (!best || v > best.v)) best = { id: b.id, act: o.act, v };
    }
  }
  return best ? actOnBiz(s, best.id, best.act as 'inspect') : null;
}

function smartStep(s: GameState, st: BotStyle): GameState {
  switch (s.screen) {
    case 'form': return signForm(setHero(s, { origin: 0, dream: 0 }));
    case 'morning': return cityMove(s, st.city) || toOffice(s);
    case 'office': {
      if (officeDone(s)) return endDay(s);
      const d = currentDoc(s);
      if (d.kind === 'scheme') {
        let best = -1, bs = score(s, d.scheme.no.d);
        for (const ap of [0, 1, 2] as const) { const sc = score(s, schemeDelta(s, ap)); if (sc < bs) { bs = sc; best = ap; } }
        return best < 0 ? declineScheme(s) : signScheme(setAppetite(s, best as 0 | 1 | 2));
      }
      let bi = 0, bs = Infinity;
      const en = enabledOptions(s, d.choice.opts);
      d.choice.opts.forEach((o, i) => { if (!en[i]) return; const fam = o.fam?.gone ? 40 : 0; const sc = score(s, o.d) + fam - (o.fam?.l || 0) / 3; if (sc < bs) { bs = sc; bi = i; } });
      return pickOption(s, bi);
    }
    case 'evening': {
      let n = allTo(s, 'laun');
      if (kidStashTarget(n) && (kidStashTarget(n)!.l >= 50)) n = allTo(n, 'kid');
      n = allTo(n, s.acc.otto.l >= 45 ? 'wh' : 'floor');
      n = allTo(n, 'floor');
      return lockSafe(n);
    }
    case 'night': {
      const ids = s.offers.map((o) => o.id);
      if (ids.includes('retire') && (s.threat >= 60 || s.served >= 16)) return acceptOffer(s, 'retire');
      if (ids.includes('pres') && totalMoney(s) > 6000 && s.threat < 55) return acceptOffer(s, 'pres');
      if (ids.includes('promo') && totalMoney(s) > getEra(s.era).ranks[s.rank + 1].cost + 1500 && s.patron < 85) return acceptOffer(s, 'promo');
      return sleep(s);
    }
    case 'campaign': return campaignAct(s, totalMoney(s) > 2500 ? 'media' : 'rally');
    case 'elect': return electionNight(s, false);
    case 'chronicle': return chronPick(s, 0);
    case 'ending':
      if (!s.heirs.length) return s;
      return pickHeir(s, [...s.heirs].sort((a, b) => (b.prep + b.l + (b.age >= 16 ? 50 : 0)) - (a.prep + a.l + (a.age >= 16 ? 50 : 0)))[0].id);
    default: return s;
  }
}

/** One step of a simple player. Returns the next state. */
export function botStep(s: GameState, r: () => number, st: BotStyle): GameState {
  if (st.smart) return smartStep(s, st);
  switch (s.screen) {
    case 'form': return signForm(setHero(s, { origin: Math.floor(r() * 3), dream: Math.floor(r() * 4), gender: r() < 0.5 ? 'm' : 'f' }));
    case 'morning': return cityMove(s, st.city) || toOffice(s);
    case 'office': {
      if (officeDone(s)) return endDay(s);
      const d = currentDoc(s);
      if (d.kind === 'scheme') {
        if (r() < 0.12) return declineScheme(s);
        return signScheme(setAppetite(s, (r() < st.greed ? 2 : r() < 0.5 ? 1 : 0) as 0 | 1 | 2));
      }
      const opts = d.choice.opts;
      const en = enabledOptions(s, opts);
      const ok = opts.map((_, i) => i).filter((i) => en[i]);
      let i = ok[Math.floor(r() * ok.length)];
      if (opts[i].dark && r() > st.darkRate) i = ok.find((j) => !opts[j].dark) ?? i;
      return pickOption(s, i);
    }
    case 'evening': {
      let n = s;
      liveKids(n).forEach((k) => { if (r() < st.skipAllowance) n = toggleKidPay(n, k.id); });
      const keys = ['laun', 'floor', 'wh', 'kid'] as const;
      n = allTo(n, keys[Math.floor(r() * 2)]);
      n = allTo(n, 'laun'); n = allTo(n, 'wh'); n = allTo(n, 'kid'); n = allTo(n, 'floor');
      return lockSafe(n);
    }
    case 'night':
      if (s.offers.length && r() < st.offerRate) return acceptOffer(s, s.offers[Math.floor(r() * s.offers.length)].id);
      return sleep(s);
    case 'campaign': return campaignAct(s, ['rally', 'media', 'gift', 'kompromat', 'admin'][Math.floor(r() * 5)]);
    case 'elect': return electionNight(s, r() < st.darkRate);
    case 'chronicle': return chronPick(s, Math.floor(r() * 3));
    case 'ending':
      if (s.heirs.length) return pickHeir(s, s.heirs[Math.floor(r() * s.heirs.length)].id);
      return s;
    default: return s;
  }
}

/** Play one full campaign (until the dynasty falls or era VII ends). */
export function playCampaign(seed: number, style: BotStyle = STYLES.average, maxSteps = 20000) {
  let s = newGame(seed);
  const r = botRng(seed * 7919 + 1);
  for (let i = 0; i < maxSteps; i++) {
    const n = botStep(s, r, style);
    if (n === s) break; // terminal: ending with no heirs
    s = n;
  }
  return s;
}

export { restart };

// ---------------------------------------------------------------- goal bots (npm run sim:goals)

/** A careful player who chases one life dream: sees the previews, keeps the meters near the middle,
 *  buys promotions when it can, and spends up to `cityMoves` city moves every morning. */
export interface GoalBot { dream: 0 | 1 | 2 | 3; greed: number; cityMoves: number }

function goalScore(s: GameState, d: Delta, g: GoalBot): number {
  if (isFatal(s, d)) return 1e6;
  const p = s.shadow > 0 ? s.patron : s.patron + (d.p || 0);
  const m = [p, s.people + (d.n || 0), s.system + (d.s || 0)];
  let edge = m.reduce((a, x) => a + Math.max(0, Math.abs(x - 50) - 20) ** 2, 0);
  // careers need the patron's favour for every promotion offer
  const career = g.dream === 1 || g.dream === 3 || (g.dream === 0 && !s.estate && s.rank < 2);
  if (career) edge += Math.max(0, RULES.offers.patronMin + 11 - p) ** 2 * 0.5 + Math.max(0, p - 88) ** 2 * 3;
  const t = Math.max(0, s.threat + (d.i || 0));
  const money = (d.cash || 0) + (d.clean || 0);
  return edge * 3 + t * (g.dream === 2 ? 3 : 1.5) + (t * t) / 40 - (money * g.greed) / 120;
}

export function goalStep(s: GameState, g: GoalBot): GameState {
  switch (s.screen) {
    case 'form': return signForm(setHero(s, { origin: g.dream === 0 ? 2 : g.dream === 2 ? 1 : 0, dream: g.dream }));
    case 'morning': {
      let n = s;
      const keep = g.dream === 0 && !n.estate ? RULES.estate.price : g.dream === 1 || g.dream === 3 ? (getEra(n.era).ranks[n.rank + 1]?.cost ?? RULES.presidentFee) : 0;
      for (let k = 0; k < g.cityMoves; k++) { const m = cityMove(n, 'wise', keep); if (!m || m === n) break; n = m; }
      return toOffice(n);
    }
    case 'office': {
      if (officeDone(s)) return endDay(s);
      const d = currentDoc(s);
      if (d.kind === 'scheme') {
        let best = -1, bs = goalScore(s, d.scheme.no.d, g);
        for (const ap of [0, 1, 2] as const) { const sc = goalScore(s, schemeDelta(s, ap), g); if (sc < bs) { bs = sc; best = ap; } }
        return best < 0 ? declineScheme(s) : signScheme(setAppetite(s, best as 0 | 1 | 2));
      }
      let bi = 0, bs = Infinity;
      const en = enabledOptions(s, d.choice.opts);
      d.choice.opts.forEach((o, i) => { if (!en[i]) return; const sc = goalScore(s, o.d, g) + (o.fam?.gone ? 40 : 0) - (o.fam?.l || 0) / 3; if (sc < bs) { bs = sc; bi = i; } });
      return pickOption(s, bi);
    }
    case 'evening': {
      let n = allTo(s, 'laun');
      n = allTo(n, s.acc.otto.l >= 45 ? 'wh' : 'floor');
      return lockSafe(allTo(n, 'floor'));
    }
    case 'night': {
      const ids = s.offers.map((o) => o.id), R = getEra(s.era).ranks, money = totalMoney(s);
      const next = R[s.rank + 1];
      if (ids.includes('estate') && (g.dream === 0 || s.clean > RULES.estate.price * 2)) return acceptOffer(s, 'estate');
      if (g.dream === 3 && ids.includes('pres') && money >= RULES.presidentFee + 2000 && s.threat < 60) return acceptOffer(s, 'pres');
      if ((g.dream === 1 || g.dream === 3) && ids.includes('promo') && money >= next.cost) return acceptOffer(s, 'promo');
      if (g.dream === 0 && ids.includes('promo') && s.rank < 2 && money >= next.cost) return acceptOffer(s, 'promo');
      if (g.dream === 2 && ids.includes('retire') && s.threat < RULES.dreamCleanThreat - 2) return acceptOffer(s, 'retire');
      if (g.dream === 0 && ids.includes('retire') && s.dreamDone) return acceptOffer(s, 'retire');
      if (ids.includes('retire') && s.threat >= 75) return acceptOffer(s, 'retire');
      return sleep(s);
    }
    case 'campaign': {
      for (const a of ['media', 'gift', 'rally', 'admin']) { const n = campaignAct(s, a); if (n !== s) return n; }
      return s;
    }
    case 'elect': return electionNight(s, false);
    default: return s;
  }
}

/** One first life of Era I played by a goal bot; returns the final state (screen 'ending'). */
export function playGoalLife(seed: number, g: GoalBot, maxSteps = 6000) {
  let s = newGame(seed);
  for (let i = 0; i < maxSteps && s.screen !== 'ending'; i++) {
    const n = goalStep(s, g);
    if (n === s) break;
    s = n;
  }
  return s;
}
