// Parity: the TypeScript engine must play exactly like the HTML prototype (Era I, first life).
// Both get the same random stream and the same decisions; we compare state after every step.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { currentDoc, newGame } from '../src/engine';
import type { GameState } from '../src/engine';
import { botRng, botStep, STYLES } from '../src/sim/bot';

function loadPrototype() {
  const html = fs.readFileSync(new URL('../prototype/eras/era1.dc.html', import.meta.url), 'utf8');
  const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
  const DCLogic = class { state: any; setState(o: any) { Object.assign(this.state, o); } };
  return new Function('DCLogic', js + '; return Component;')(DCLogic);
}
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => { let t = (a = (a + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// gender-suffix typos in the prototype ("заснув"+"ла"), fixed in the engine
const fixProto = (t: string) => (t || '').replace(/заснувла/g, 'заснула').replace(/грюкнувла/g, 'грюкнула').replace(/пішовла/g, 'пішла');
const pickFields = (x: any) => ({
  screen: x.screen, served: x.served, year: x.year, rank: x.rank, patron: x.patron, people: x.people, system: x.system, threat: x.threat,
  cash: x.cash, floor: x.floor, wh: x.wh, clean: x.clean, headline: fixProto(x.headline), body: fixProto(x.body),
  acc: Object.fromEntries(Object.entries(x.acc).map(([k, a]: any) => [k, [a.l, a.k]])),
  kids: x.kids.map((k: any) => [k.first, k.g, k.age, k.l, k.k, k.prep, k.assets, k.gone, k.why, k.trait]),
  report: (x.report || []).map((r: any) => r.t)
});

describe('parity with HTML prototype (Era I)', () => {
  it('identical first lives for 150 seeds × 3 bot styles', () => {
    const Proto = loadPrototype();
    const realRandom = Math.random;
    let compared = 0, skipped = 0;
    try {
      for (const style of [STYLES.average, STYLES.greedy, STYLES.smart]) {
        for (let seed = 1; seed <= 150; seed++) {
          let s: GameState = newGame(seed);
          Math.random = mulberry(seed);
          const p = new Proto({});
          const r = botRng(seed + 99);
          let diverged = false;
          for (let step = 0; step < 600 && s.history.length === 0 && !diverged; step++) {
            const before = s;
            const next = botStep(s, r, style);
            // mirror the same decision on the prototype
            switch (before.screen) {
              case 'form': p.setState({ origin: next.origin === undefined ? 0 : (botStepOrigin(before, next)), dream: next.dream, gender: next.gender, first: next.first }); p.signForm(); break;
              case 'morning': p.setState({ screen: 'office', doc: 0, ap: 1, last: {}, pend: null, pendD: null, lastStamp: null }); break;
              case 'office': {
                const d = currentDoc(before);
                if (d.kind === 'scheme') {
                  if (next.lastStamp === 'declined') p.decline(); else { p.setState({ ap: next.lastDec ? apOf(before, next) : 1 }); p.sign(); }
                } else {
                  const idx = d.choice.opts.findIndex((o) => o.t === next.lastDec?.t);
                  const po = p.docsFor(p.state)[p.state.doc].d.opts[idx];
                  p.pickOpt(po);
                  // the prototype lets money go negative; the engine never does (it disables unaffordable options)
                  if (p.state.clean < 0) { diverged = true; skipped++; }
                }
                break;
              }
              case 'evening': p.setState({ alloc: { ...next.lastAlloc! }, kidPay: { ...before.kidPay, ...kidPayOf(before, next) } }); p.lock(); break;
              case 'night': if (next.screen === 'night' || next.screen === 'campaign' || next.screen === 'ending') p.accept(offerTaken(before, next)); else p.setState({ screen: 'morning', doc: 0, ap: 1, last: {} }); break;
              case 'campaign': p.campDo(p.campActs()[['rally', 'media', 'gift', 'kompromat', 'admin'].indexOf(campAct(before, next))]); break;
              case 'elect': p.electDo(next.camp ? false : electStuffed(before, next)); break;
            }
            s = next;
            if (diverged) break;
            expect(pickFields(p.state), `seed ${seed} step ${step} (${before.screen})`).toEqual(pickFields(s));
            compared++;
          }
        }
      }
    } finally { Math.random = realRandom; }
    console.log(`parity: ${compared} steps compared, ${skipped} lives stopped at negative money`);
    expect(compared).toBeGreaterThan(5000);
    expect(skipped).toBeLessThan(60);
  });
});

// --- helpers that recover the bot's decision from (before, next)
function botStepOrigin(_b: GameState, n: GameState) { return n.origin; }
function apOf(_b: GameState, n: GameState) { return n.ap === 1 && n.lastDec ? (n as any)._ap ?? guessAp(_b, n) : guessAp(_b, n); }
function guessAp(b: GameState, n: GameState) { return [0, 1, 2].find((ap) => n.lastDec!.d.cash === Math.round((currentDocBudget(b) * [0.05, 0.1, 0.2][ap] * [1, 1.6, 2.4, 3.4][b.rank]) / 10) * 10) ?? 1; }
function currentDocBudget(b: GameState) { const d = currentDoc(b); return d.kind === 'scheme' ? d.scheme.budget : 0; }
function kidPayOf(b: GameState, n: GameState) { const out: Record<string, boolean> = {}; b.kids.forEach((k) => { if (!k.gone && n.report.some((r) => r.t.startsWith(k.first + ' цього року без утримання'))) out[k.id] = false; }); return out; }
function offerTaken(b: GameState, n: GameState) {
  if (n.screen === 'campaign') return 'pres';
  if (n.screen === 'ending') return n.ending!.kind === 'flee' ? 'flee' : 'retire';
  return n.rank > b.rank ? 'promo' : (b.offers.find((o) => !n.offers.some((x) => x.id === o.id))?.id ?? 'promo');
}
function campAct(b: GameState, n: GameState) { return n.last.n === 4 ? 'rally' : n.last.s === 6 ? 'admin' : n.last.i === 4 ? 'gift' : n.last.i === 3 ? 'kompromat' : 'media'; void b; }
function electStuffed(b: GameState, n: GameState) { return !!(n.ending && n.ending.kind && b.camp && false); }
