// Balance of the rivals: plays many campaigns with and without them, with bots that ignore the city, squeeze it greedily
// or squeeze it while keeping the rivals in check. Usage: npm run sim:city -- [campaigns=200]
import { CITY_RULES, newGame } from '../src/engine';
import { botRng, botStep, STYLES, type CityPolicy } from '../src/sim/bot';

const N = Number(process.argv[2] || 200);
const ONLY = process.argv[3] || '', POLICIES = (process.argv[4] || 'none,greedy,wise').split(',') as CityPolicy[];
// quick tuning: CITY='{"huntBase":1}' npm run sim:city -- 100 smart wise
if (process.env.CITY) Object.assign(CITY_RULES, JSON.parse(process.env.CITY));
const pct = (x: number, of: number) => ((100 * x) / Math.max(1, of)).toFixed(0).padStart(3) + '%';

function play(seed: number, style: (typeof STYLES)[string], policy: CityPolicy) {
  let s = newGame(seed);
  const r = botRng(seed * 7919 + 1), st = { ...style, city: policy };
  const moves: Record<string, number> = {}; let moveYear = -1;
  let lastYear = -1, attacks = 0, takes = 0, years = 0, allies = 0, roofs = 0, cash = 0;
  for (let i = 0; i < 20000; i++) {
    if (s.screen === 'morning' && s.year !== lastYear && s.city) {
      lastYear = s.year; years++;
      s.city.news.forEach((n) => { if (n.kind === 'attack') attacks++; if (n.kind === 'rival' && n.biz) takes++; });
      roofs += s.city.biz.filter((b) => b.status === 'roof').length;
      allies = Math.max(allies, s.city.rivals.filter((x) => x.ally).length);
    }
    if (s.screen === 'office' && s.city?.last && s.year !== moveYear) { moveYear = s.year; const k = s.city.last.act + (s.city.last.ok ? '+' : '-'); moves[k] = (moves[k] || 0) + 1; }
    const n = botStep(s, r, st);
    if (n === s) break;
    s = n;
  }
  cash = s.history.length;
  return { s, attacks, takes, years, allies, roofs, lives: cash, moves };
}

const rows: string[] = [];
for (const [name, style] of Object.entries(STYLES)) {
  if (ONLY && name !== ONLY) continue;
  for (const policy of POLICIES) {
    for (const on of [false, true]) {
      CITY_RULES.rivalsOn = on;
      const kinds: Record<string, number> = {}, mv: Record<string, number> = {};
      let era = 0, fin = 0, lives = 0, att = 0, tk = 0, yrs = 0, al = 0, rf = 0, firstEnd = 0;
      for (let i = 0; i < N; i++) {
        const o = play(2000 + i, style, policy);
        const maxEra = Math.max(...o.s.history.map((h) => h.era), 1);
        era += maxEra; if (o.s.ending?.campaignOver) fin++;
        Object.entries(o.moves).forEach(([k, v]) => { mv[k] = (mv[k] || 0) + v; });
        lives += o.s.history.length; att += o.attacks; tk += o.takes; yrs += o.years; al += o.allies ? 1 : 0; rf += o.roofs;
        o.s.history.forEach((h) => { kinds[h.kind] = (kinds[h.kind] || 0) + 1; });
        if (o.s.history[0]) firstEnd += o.s.history[0].kind === 'summit' || o.s.history[0].kind === 'retire' ? 0 : 1;
      }
      const ends = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${pct(v, lives)}`).join(' ');
      rows.push(`${name.padEnd(8)} ${policy.padEnd(6)} rivals ${on ? 'ON ' : 'off'} | era ${(era / N).toFixed(2)} | all7 ${pct(fin, N)} | 1st life fell ${pct(firstEnd, N)} | lives ${(lives / N).toFixed(1)} | attacks/yr ${(att / Math.max(1, yrs)).toFixed(2)} takes/yr ${(tk / Math.max(1, yrs)).toFixed(2)} | roofs/yr ${(rf / Math.max(1, yrs)).toFixed(1)} | allied ${pct(al, N)} | ${ends}`);
      if (policy !== 'none' && on) rows.push('   moves/campaign: ' + Object.entries(mv).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N).toFixed(1)}`).join(' · '));
    }
  }
}
console.log(rows.join('\n'));
