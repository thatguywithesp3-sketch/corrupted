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
  it('allows one move per shop per turn and records the result', () => {
    const s0 = morning(), [b, b2] = s0.city!.biz.filter((x) => x.status === 'open');
    const s1 = G.actOnBiz(s0, b.id, 'inspect');
    expect(G.didAct(s1.city!, b.id)).toBe(true);
    expect(G.didAct(s1.city!, b2.id)).toBe(false);
    const s3 = G.actOnBiz(s1, b2.id, 'inspect');
    expect(G.movesMade(s3.city!)).toBe(2);
    expect(s3.city!.today.length).toBe(2);
    expect(s1.city!.last).not.toBeNull();
    expect(s1.threat).toBeGreaterThan(s0.threat);
    const s2 = G.actOnBiz(s1, b.id, 'inspect');
    expect(s2.city!.biz.find((x) => x.id === b.id)!.pressure).toBe(1);
  });
  it('washes the name: a donation calms the risk once per turn, whisperers work every year', () => {
    let s0 = morning(); s0 = { ...s0, threat: 40, clean: 5000, cash: 5000 };
    const s1 = G.actOnInst(s0, 'charity', 'donate');
    expect(s1.threat).toBe(36);
    expect(G.actOnInst(s1, 'charity', 'donate').threat).toBe(36);
    const s2 = G.actOnInst(s1, 'whisper', 'hire');
    expect(s2.city!.fame!.whisper).toBe(true);
    expect(G.movesMade(s2.city!)).toBe(2);
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
    expect(G.didAct(n.city!, b.id)).toBe(true);
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

describe('Era I mechanics fixes (QA 14.11)', () => {
  const start = () => G.signForm(G.newGame(77));
  /** a finished life with the estate, ready for the will */
  const retiredWithEstate = () => {
    const s = { ...start(), screen: 'night' as const, served: 13, estate: true, dreamDone: true, dream: 0, offers: [] };
    return G.acceptOffer(s, 'retire');
  };

  it('the year report compares with the start of the year, not with the evening', () => {
    const s = start();
    expect(s.yearStart).toMatchObject({ patron: s.patron, clean: s.clean, floor: 0, wh: 0 });
    const n = G.sleep({ ...s, screen: 'night', patron: 80, clean: 3000 });
    expect(n.yearStart!.patron).toBe(80);
    expect(n.yearStart!.clean).toBe(3000);
  });

  it('an heir who inherits the estate can still fulfil the estate dream by keeping it', () => {
    const end = retiredWithEstate();
    expect(end.ending!.dream).toBe(true);
    const heir = G.pickHeir(end, end.heirs[0].id);
    expect(heir.estate).toBe(true);
    expect(heir.dream).toBe(0);
    expect(heir.yearStart).toBeDefined();
    const kept = G.acceptOffer({ ...heir, screen: 'night', served: 12, offers: [] }, 'retire');
    expect(kept.ending!.dream).toBe(true);
  });

  it('retiring without the estate does not send you to the estate', () => {
    const n = G.acceptOffer({ ...start(), screen: 'night', served: 12, offers: [] }, 'retire');
    expect(n.ending!.text).not.toContain('маєток');
    expect(retiredWithEstate().ending!.text).toContain('маєток');
  });

  it('rumours only point at shops nobody holds', () => {
    let s = start();
    for (let i = 0; i < 12; i++) {
      s = G.sleep({ ...s, screen: 'night' });
      for (const x of s.city!.news.filter((x) => x.kind === 'rumor')) expect(s.city!.biz.find((b) => b.id === x.biz)!.rival).toBeFalsy();
    }
  });

  it('a city move that cannot be made returns the same state', () => {
    const s = start();
    const used = { ...s, city: { ...s.city!, done: ['a', 'b', 'c', 'd', 'e'] } };
    expect(G.actOnInst(used, 'press', 'article')).toBe(used);
    expect(G.actOnBiz(used, used.city.biz[0].id, 'inspect')).toBe(used);
    expect(G.actOnRival(used, used.city.rivals[0].id, 'bribe')).toBe(used);
  });
});

describe('Era I texts and lore (QA 14.11)', () => {
  it('a heroine\'s Otto is her дівер, in every form', () => {
    expect(G.kinFor('Ваш шурин Отто', 'f')).toBe('Ваш дівер Отто');
    expect(G.kinFor('Склад шурина Отто', 'f')).toBe('Склад дівера Отто');
    expect(G.kinFor('Шурин урядовця', 'f')).toBe('Дівер урядовця');
    expect(G.kinFor('Ваш шурин Отто', 'm')).toBe('Ваш шурин Отто');
    let s = G.signForm(G.setHero(G.newGame(5), { gender: 'f' }));
    expect(s.acc.otto.r).toBe('дівер');
    for (let i = 0; i < 6; i++) { expect(JSON.stringify(G.docsFor({ ...s, served: i }))).not.toMatch(/[Шш]урин/); }
  });

  it('shop owners keep their gender and magnates their case', () => {
    const s = G.signForm(G.newGame(9));
    const c = s.city!;
    const shop = c.biz.find((b) => b.status === 'open' && !b.rival)!;
    shop.owner = 'Пані Мельник';
    const n = G.actOnBiz(s, shop.id, 'inspect');
    const r = n.city!.today[0];
    expect(r.title).toMatch(/Пані Мельник («віддячила»|не зрозуміла натяку)/);
    const held = { ...shop, id: 'bx', rival: 'r1', pressure: 0, status: 'open' as const };
    const acts = G.bizActs({ ...s, city: { ...c, biz: [...c.biz, held] } }, held);
    expect(acts[0].sub).toContain('під рукою Пана Вайсмана');
    expect(acts[1].sub).toContain('ніж платить Пану Вайсману');
    expect(G.rivalCase(c.rivals[2], 'ins')).toBe('Графом Ґжеґожевським');
  });

  it('no president or mayor is left in Era I strings', () => {
    const all = Object.values(getEra(1).strings).join('\n');
    expect(all).not.toMatch(/президент|\bмер\b|меру\b/i);
  });
});

describe('document deck (Era I)', () => {
  const D = getEra(1).deck!;
  const year0 = (seed = 3) => G.signForm(G.newGame(seed));
  const nextYear = (s: GameState) => G.sleep({ ...s, screen: 'night' });

  it('deals one scheme and one decision (two from Senator up) at the start of each year', () => {
    const s = year0();
    expect(s.deck!.today.length).toBe(2);
    expect(D.schemes.some((c) => c.id === s.deck!.today[0])).toBe(true);
    const docs = docsFor(s);
    expect(docs[docs.length - 2].kind === 'scheme' || docs[0].kind === 'scheme').toBe(true);
    const senator = nextYear({ ...s, rank: 2 });
    expect(senator.deck!.today.filter((id) => D.choices.some((c) => c.id === id)).length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic and does not repeat a card until the fitting pile runs out', () => {
    let a = year0(11), b = year0(11);
    const seen: string[] = [];
    for (let y = 0; y < 8; y++) {
      expect(a.deck!.today).toEqual(b.deck!.today);
      a.deck!.today.forEach((id) => { expect(seen).not.toContain(id); seen.push(id); });
      a = nextYear(a); b = nextYear(b);
    }
  });

  it('respects conditions: rank-locked cards never reach a councillor, arcs are never drawn', () => {
    let s = year0(5);
    const locked = new Set(D.schemes.filter((c) => c.cond?.rank && c.cond.rank[0] > 0).map((c) => c.id));
    const arcs = new Set(D.choices.filter((c) => c.arc).map((c) => c.id));
    for (let y = 0; y < 18; y++) { s.deck!.today.forEach((id) => { expect(locked.has(id)).toBe(false); expect(arcs.has(id)).toBe(false); }); s = nextYear(s); }
  });

  it('an answer can set a flag and bring a follow-up back years later', () => {
    let s = year0(7);
    s = { ...s, screen: 'office', doc: 0, deck: { ...s.deck!, today: ['c_revisor'] } };
    const i = docsFor(s).findIndex((d) => d.kind === 'choice' && (d.choice as { id?: string }).id === 'c_revisor');
    s = { ...s, doc: i };
    const n = G.pickOption(s, 0);
    expect(n.deck!.queue).toContainEqual({ id: 'c_revisor2', at: s.served + 3 });
    // the follow-up is dealt when it is due
    const due = G.sleep({ ...n, screen: 'night', served: s.served + 3 });
    expect(due.deck!.today).toContain('c_revisor2');
  });

  it('a magnate answer moves the city layer, and pledged guilds add votes in the Great Council', () => {
    const s = year0(9);
    const before = s.city!.rivals.find((r) => r.id === 'r1')!.heat;
    const t = { ...s, screen: 'office' as const, deck: { ...s.deck!, today: ['c_weisman'] } };
    const n = G.pickOption({ ...t, doc: docsFor(t).findIndex((d) => d.kind === 'choice' && d.who?.kind === 'rival') }, 0);
    expect(n.city!.rivals.find((r) => r.id === 'r1')!.heat).toBe(Math.max(0, before - 4));
    const top = { ...s, screen: 'night' as const, rank: 3, patron: 80, clean: 9000, offers: [], deck: { ...s.deck!, flags: { votes_salt: 5, votes_merchants: 6 } } };
    const plain = { ...top, deck: { ...s.deck!, flags: {} } };
    expect(G.acceptOffer(top, 'pres').camp!.me - G.acceptOffer(plain, 'pres').camp!.me).toBe(2 * G.RULES.campaign.pledgeVotes);
  });

  it('the parity switch brings back the prototype rotation', () => {
    G.RULES.deck.on = false;
    try { const s = year0(4); expect(s.deck).toBeUndefined(); expect((docsFor(s)[0] as { scheme: { from: string } }).scheme.from).toBe(getEra(1).schemes[0].from); }
    finally { G.RULES.deck.on = true; }
  });
});

describe('generations in the city and the end of the day', () => {
  const retiredWithRoof = (kind: 'retire' | 'collapse' = 'retire') => {
    let s = G.signForm(G.newGame(41));
    const b = s.city!.biz.find((x) => x.status === 'open' && !x.rival)!;
    b.status = 'roof'; b.tribute = 120;
    s.city!.rivals[0].heat = 6;
    s = { ...s, screen: 'night', served: 13, offers: [] };
    return kind === 'retire' ? G.acceptOffer(s, 'retire') : { ...G.acceptOffer(s, 'retire'), ending: { ...G.acceptOffer(s, 'retire').ending!, kind: 'collapse' as const } };
  };

  it('the heir keeps the father’s roofs, and each magnate’s house passes to its own heir', () => {
    const end = retiredWithRoof();
    const roofId = end.city!.biz.find((x) => x.status === 'roof')!.id;
    const h = G.pickHeir(end, end.heirs[0].id);
    expect(h.city!.biz.find((x) => x.id === roofId)!.status).toBe('roof');
    const r1 = h.city!.rivals.find((r) => r.id === 'r1')!;
    expect(r1.gen).toBe(2);
    expect(r1.name).toBe('Пан Леопольд Вайсман');
    expect(r1.heat).toBe(3); // old grudges cool off by half
    expect(G.rivalCase(r1, 'dat')).toBe('Пану Леопольду Вайсману');
    expect(G.rivalFile(r1).age).toBe(31);
    expect(h.city!.news.some((x) => x.kind === 'rival' && /сина/.test(x.head))).toBe(true);
  });

  it('a fallen family loses its roofs', () => {
    const h = G.pickHeir(retiredWithRoof('collapse'), retiredWithRoof('collapse').heirs[0].id);
    expect(h.city!.biz.some((x) => x.status === 'roof')).toBe(false);
  });

  it('after the last document the office waits for the player to end the day', () => {
    let s = G.toOffice(G.signForm(G.newGame(43)));
    const n = docsFor(s).length;
    for (let i = 0; i < n; i++) {
      const d = G.currentDoc(s);
      s = d.kind === 'scheme' ? G.declineScheme(s) : G.pickOption(s, G.enabledOptions(s, d.choice.opts).indexOf(true));
    }
    expect(s.screen).toBe('office');
    expect(G.officeDone(s)).toBe(true);
    expect(s.dayLog!.length).toBe(n);
    expect(() => G.declineScheme(s)).toThrow();
    expect(G.movesLeft(s)).toBeGreaterThan(0); // the city still takes moves
    const e = G.endDay(s);
    expect(e.screen).toBe('evening');
    expect(() => G.endDay(G.toOffice(G.signForm(G.newGame(43))))).toThrow();
  });
});
