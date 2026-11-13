import { describe, expect, it } from 'vitest';
import { overlaps } from '../src/ui/scene/mapLayout';
import { getPlan } from '../src/engine/cityplan';

// every painted place and every shop on the map must stay a clean tap target
describe('map layout', () => {
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
