// Balance simulator: plays many full campaigns with simple bots and prints stats.
// Usage: npm run sim -- [games=500]
import { playCampaign, STYLES } from '../src/sim/bot';

const N = Number(process.argv[2] || 500);
for (const [name, style] of Object.entries(STYLES)) {
  const kinds: Record<string, number> = {}, titles: Record<string, number> = {};
  let lives = 0, eraSum = 0, reachedEnd = 0, years = 0, kids = 0, lost = 0, nephews = 0, presidents = 0;
  const eraReached = new Array(8).fill(0);
  for (let i = 0; i < N; i++) {
    const s = playCampaign(1000 + i, style);
    const maxEra = Math.max(...s.history.map((h) => h.era));
    eraReached[maxEra]++; eraSum += maxEra;
    if (s.ending?.campaignOver) reachedEnd++;
    lives += s.history.length;
    s.history.forEach((h) => { kinds[h.kind] = (kinds[h.kind] || 0) + 1; titles[h.title] = (titles[h.title] || 0) + 1; if (h.kind === 'summit') presidents++; });
    years += s.served; kids += s.kids.length; lost += s.kids.filter((k) => k.gone).length;
    if (s.heirs.some((h) => h.nephew)) nephews++;
  }
  const pct = (x: number, of: number) => ((100 * x) / of).toFixed(1) + '%';
  console.log(`\n== ${name} · ${N} campaigns`);
  console.log(`avg furthest era: ${(eraSum / N).toFixed(2)} · finished all 7 eras: ${pct(reachedEnd, N)} · lives per campaign: ${(lives / N).toFixed(1)}`);
  console.log('furthest era reached:', eraReached.slice(1).map((x, i) => `${i + 1}:${pct(x, N)}`).join(' '));
  console.log('how lives end:', Object.entries(kinds).map(([k, v]) => `${k} ${pct(v, lives)}`).join(' · '));
  console.log('top titles:', Object.entries(titles).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, v]) => `${k} ${pct(v, lives)}`).join(' · '));
  console.log(`presidents: ${presidents} · kids lost in last life: ${pct(lost, Math.max(1, kids))}`);
}
