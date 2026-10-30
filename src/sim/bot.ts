import {
  acceptOffer, allTo, campaignAct, currentDoc, declineScheme, electionNight, liveKids, lockSafe, pickHeir, pickOption,
  setAppetite, setHero, signForm, signScheme, sleep, toOffice, toggleKidPay, newGame, restart,
  isFatal, schemeDelta, enabledOptions, kidStashTarget, totalMoney, getEra
} from '../engine';
import type { Delta, GameState } from '../engine';

/** Tiny deterministic RNG for the bot's own choices (separate from the game's RNG). */
export function botRng(seed: number) {
  let a = seed >>> 0;
  return () => { let t = (a = (a + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface BotStyle { greed: number; offerRate: number; skipAllowance: number; darkRate: number; smart?: boolean }
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

function smartStep(s: GameState): GameState {
  switch (s.screen) {
    case 'form': return signForm(setHero(s, { origin: 0, dream: 0 }));
    case 'morning': return toOffice(s);
    case 'office': {
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
    case 'ending':
      if (!s.heirs.length) return s;
      return pickHeir(s, [...s.heirs].sort((a, b) => (b.prep + b.l + (b.age >= 16 ? 50 : 0)) - (a.prep + a.l + (a.age >= 16 ? 50 : 0)))[0].id);
    default: return s;
  }
}

/** One step of a simple player. Returns the next state. */
export function botStep(s: GameState, r: () => number, st: BotStyle): GameState {
  if (st.smart) return smartStep(s);
  switch (s.screen) {
    case 'form': return signForm(setHero(s, { origin: Math.floor(r() * 3), dream: Math.floor(r() * 4), gender: r() < 0.5 ? 'm' : 'f' }));
    case 'morning': return toOffice(s);
    case 'office': {
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
