// Can the life dreams be reached? Plays first lives of Era I with a careful bot that chases one dream.
// Usage: npm run sim:goals -- [lives=300] [cityMoves=2] [greed=2.5]
// Targets (docs: «Епоха I: баланс і потік»): clean name 40–50%, estate 35–45%, top rank 30–40%, doge 10–15%.
import { playGoalLife, type GoalBot } from '../src/sim/bot';
import { getEra, RULES } from '../src/engine';

const N = Number(process.argv[2] || 300), CM = Number(process.argv[3] ?? 2), GREED = Number(process.argv[4] || 2.5);
// quick tuning without editing rules.ts: RULES='{"estate":{"price":5000}}' npm run sim:goals
const deep = (t: any, o: any) => { for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && t[k]) deep(t[k], o[k]); else t[k] = o[k]; } };
if (process.env.RULES) deep(RULES, JSON.parse(process.env.RULES));

const pct = (x: number) => ((100 * x) / N).toFixed(1).padStart(5) + '%';
const top = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${pct(v).trim()}`).join(' · ');
console.log(`${N} first lives per dream · city moves/yr ${CM} · greed ${GREED}`);
for (const dream of [0, 1, 2, 3] as const) {
  const g: GoalBot = { dream, greed: GREED, cityMoves: CM };
  const ends: Record<string, number> = {}, rank = [0, 0, 0, 0];
  let ok = 0, years = 0, summit = 0, campaigns = 0;
  for (let i = 0; i < N; i++) {
    const s = playGoalLife(1000 + i, g);
    if (!s.ending) continue;
    if (s.ending.dream) ok++;
    if (s.ending.kind === 'summit') summit++;
    if (s.camp || s.ending.kind === 'summit') campaigns++;
    ends[s.ending.title] = (ends[s.ending.title] || 0) + 1;
    years += s.served; rank[s.rank]++;
  }
  console.log(`\n${getEra(1).dreams[dream].t.padEnd(22)} DREAM ${pct(ok)} · years ${(years / N).toFixed(1)} · rank ${rank.map((x) => pct(x).trim()).join('/')}${dream === 3 ? ` · elected ${pct(summit).trim()}` : ''}`);
  console.log('   ends: ' + top(ends));
}
