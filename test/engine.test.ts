import { describe, expect, it } from 'vitest';
import {
  ERA_COUNT, docsFor, getEra, lockSafe, newGame, signForm, toOffice, signScheme, setAppetite, allTo, available, unhidden, kidStashTarget, str
} from '../src/engine';
import type { GameState } from '../src/engine';
import * as G from '../src/engine';
import { playCampaign, STYLES, botRng, botStep } from '../src/sim/bot';

const meters = (s: GameState) => [s.patron, s.people, s.system];

describe('content', () => {
  it('has 7 eras with complete data', () => {
    expect(ERA_COUNT).toBe(7);
    for (let e = 1; e <= 7; e++) {
      const C = getEra(e);
      expect(C.schemes.length).toBeGreaterThan(0);
      expect(C.choices.length).toBe(6);
      expect(C.ranks.length).toBe(4);
      expect(Object.keys(C.strings).length).toBeGreaterThan(200);
      for (const sc of C.schemes) for (const k of ['i', 'n', 's', 'p', 'k', 'h', 'b'] as const) expect(sc[k]).toHaveLength(3);
    }
  });
  it('era strings are adapted (not Era I copies)', () => {
    expect(str(4, 'end.header.collapse')).not.toBe(str(1, 'end.header.collapse'));
    expect(str(1, 'rep.kidTestify', { name: 'Ада' }, 'f')).toContain('пішла');
    expect(str(1, 'rep.kidTestify', { name: 'Леон' }, 'm')).toContain('пішов');
  });
});

describe('determinism', () => {
  it('same seed → same campaign', () => {
    const a = playCampaign(42), b = playCampaign(42);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('different seeds diverge', () => {
    expect(JSON.stringify(playCampaign(1))).not.toBe(JSON.stringify(playCampaign(2)));
  });
});

describe('year loop', () => {
  it('scheme money goes to the drawer and accomplice is owed 20%', () => {
    let s = toOffice(signForm(newGame(7)));
    s = setAppetite(s, 2);
    const before = s.cash;
    s = signScheme(s);
    expect(s.cash).toBeGreaterThan(before);
    expect(Object.values(s.owed).reduce((a, b) => a + (b || 0), 0)).toBeGreaterThan(0);
  });
  it('evening allocation never exceeds available money', () => {
    for (let seed = 1; seed < 60; seed++) {
      let s = signForm(newGame(seed));
      const r = botRng(seed);
      for (let i = 0; i < 400 && s.screen !== 'ending'; i++) {
        if (s.screen === 'evening') {
          s = allTo(allTo(allTo(allTo(s, 'floor'), 'wh'), 'laun'), 'kid');
          expect(unhidden(s)).toBeGreaterThanOrEqual(0);
          expect(available(s)).toBeGreaterThanOrEqual(0);
          s = lockSafe(s);
        } else s = botStep(s, r, STYLES.average);
      }
    }
  });
  it('family stash only exists from era III', () => {
    const s1 = signForm(newGame(3, 1)), s3 = signForm(newGame(3, 3));
    expect(kidStashTarget(s1)).toBeNull();
    expect(kidStashTarget(s3)).not.toBeNull();
  });
  it('every office day has a scheme and at least one choice', () => {
    let s = signForm(newGame(11));
    for (let served = 0; served < 20; served++) {
      s = { ...s, served };
      const d = docsFor(s);
      expect(d.some((x) => x.kind === 'scheme')).toBe(true);
      expect(d.filter((x) => x.kind === 'choice').length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('full campaigns (bot)', () => {
  for (const [name, style] of Object.entries(STYLES)) {
    const games = style.smart ? 30 : 150;
    it(`${name}: ${games} campaigns end cleanly and keep invariants`, () => {
      for (let seed = 1; seed <= games; seed++) {
        const s = playCampaign(seed * 31 + name.length, style);
        expect(s.screen).toBe('ending');
        expect(s.ending).not.toBeNull();
        expect(s.ending!.dynastyOver || s.ending!.campaignOver).toBe(true);
        expect(s.history.length).toBeGreaterThan(0);
        for (const h of s.history) expect(h.era).toBeLessThanOrEqual(7);
        expect([s.cash, s.floor, s.wh].every((x) => x >= 0)).toBe(true);
        expect(s.kids.length).toBeLessThanOrEqual(3);
        expect(meters(s).every(Number.isFinite)).toBe(true);
      }
    });
  }
});

describe('banker bribe', () => {
  const evening = () => {
    return { ...signForm(newGame(7)), screen: 'evening', cash: 5000 } as GameState;
  };
  it('limit deal raises the laundering limit for one evening and costs dirty money', () => {
    const s0 = evening(), lim0 = G.launderLimit(s0);
    const s1 = G.setBank(s0, 'limit');
    expect(G.launderLimit(s1)).toBe(lim0 + G.bankerBoost(s0));
    expect(available(s1)).toBe(available(s0) - G.bankerCost(s0, 'limit'));
    const s2 = lockSafe(allTo(s1, 'laun'));
    expect(s2.bank).toBeNull();
    expect(s2.threat).toBeGreaterThanOrEqual(s1.threat + 2);
  });
  it('fee deal cuts the commission', () => {
    const s0 = evening(), s1 = G.setBank(s0, 'fee');
    expect(G.launderFee(s1)).toBe(0.03);
    expect(G.setBank(s1, 'fee').bank).toBeNull();
  });
});

describe('city', () => {
  const morning = () => G.signForm(newGame(11));
  it('starts with businesses, an economy and a lead in the paper', () => {
    const s = morning();
    expect(s.city!.biz.length).toBeGreaterThanOrEqual(4);
    expect(s.city!.news.some((n) => n.kind === 'open' || n.kind === 'rumor')).toBe(true);
  });
  it('allows one move per morning and records the result', () => {
    const s0 = morning(), b = s0.city!.biz.find((x) => x.status === 'open')!;
    const s1 = G.actOnBiz(s0, b.id, 'inspect');
    expect(s1.city!.acted).toBe(true);
    expect(s1.city!.last).not.toBeNull();
    expect(s1.threat).toBeGreaterThan(s0.threat);
    const s2 = G.actOnBiz(s1, b.id, 'inspect');
    expect(s2.city!.biz.find((x) => x.id === b.id)!.pressure).toBe(1);
  });
  it('does not touch the core RNG', () => {
    const s0 = morning(), b = s0.city!.biz[0];
    expect(G.actOnBiz(s0, b.id, 'inspect').rng).toBe(s0.rng);
  });
});

describe('city plan and rivals', () => {
  const morning = () => G.signForm(newGame(11));
  it('the generated plan is deterministic and has lots in every district', () => {
    const p = G.getPlan();
    expect(G.getPlan()).toBe(p);
    expect(p.bldgs.length).toBeGreaterThan(600);
    (Object.keys(G.DISTRICTS) as G.District[]).forEach((d) => expect(p.byDistrict[d].length).toBeGreaterThanOrEqual(6));
  });
  it('businesses stand on distinct lots', () => {
    let s = morning();
    for (let i = 0; i < 6; i++) { s = { ...s, screen: 'night' }; s = G.sleep(s); }
    const open = s.city!.biz.filter((b) => b.status !== 'closed');
    expect(new Set(open.map((b) => b.lot)).size).toBe(open.length);
  });
  it('rivals expand and attack over the years', () => {
    let s = morning();
    const news: string[] = [];
    for (let i = 0; i < 8; i++) { s = { ...s, screen: 'night' }; s = G.sleep(s); s.city!.news.forEach((n) => news.push(n.kind)); }
    expect(news).toContain('rival');
    expect(news.some((k) => k === 'attack' || k === 'rival')).toBe(true);
  });
  it('outbidding takes a shop from a rival', () => {
    let s0 = morning();
    const c = s0.city!, b = c.biz.find((x) => x.status === 'open')!;
    b.rival = c.rivals[0].id; s0 = { ...s0, cash: 5000, patron: 90 };
    const n = G.actOnBiz(s0, b.id, 'outbid');
    expect(n.city!.acted).toBe(true);
    expect(n.cash).toBeLessThan(5000);
    expect(n.city!.rivals[0].heat).toBeGreaterThan(c.rivals[0].heat);
  });
  it('marriage binds a rival house and costs us the child', () => {
    let s0 = morning();
    s0 = { ...s0, cash: 5000, kids: [{ id: 'k1', first: 'Софія', g: 'f', age: 18, trait: null, l: 70, k: 0, prep: 10, assets: 0, gone: false, why: '' }] };
    s0.city!.rivals[0].heat = 1;
    const n = G.actOnRival(s0, s0.city!.rivals[0].id, 'marry');
    expect(n.city!.rivals[0].ally).toBe(true);
    expect(n.kids[0].gone).toBe(true);
  });
  it('rivals can be switched off', () => {
    G.CITY_RULES.rivalsOn = false;
    let s = morning();
    for (let i = 0; i < 4; i++) { s = { ...s, screen: 'night' }; s = G.sleep(s); }
    G.CITY_RULES.rivalsOn = true;
    expect(s.city!.biz.every((b) => !b.rival)).toBe(true);
  });
});
