import { describe, expect, it } from 'vitest';
import { overlaps, DECOR, HOMES, OUR_HOME } from '../src/ui/scene/mapLayout';
import { INSTS } from '../src/engine/city';
import { CLEARINGS } from '../src/engine/cityplan';
import { getPlan } from '../src/engine/cityplan';

// every painted place and every shop on the map must stay a clean tap target
describe('map layout', () => {
  it('every painted place stands in the middle of its own clearing (no houses under it, its square under it)', () => {
    const places = [...DECOR.filter((p) => p.art !== 'lighthouse'), ...Object.values(HOMES), OUR_HOME, ...INSTS];
    places.forEach((p) => expect(CLEARINGS.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < 1.5), `${p.art} at ${p.x},${p.y}`).toBe(true));
  });
  it('painted places never cover each other', () => {
    expect(overlaps([])).toEqual([]);
  });
  it('shops never cover painted places or each other (18 open shops, many cities)', () => {
    const lots = getPlan().lots;
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 60; k++) {
      const pick = [...lots].sort(() => rnd() - 0.5).slice(0, 18).map((l) => ({ id: 'b' + l.id, x: l.x, y: l.y }));
      expect(overlaps(pick)).toEqual([]);
    }
  });
});
