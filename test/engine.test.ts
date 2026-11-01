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
