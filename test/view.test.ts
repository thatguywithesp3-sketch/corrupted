// Every screen of every era renders from engine state without errors.
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { newGame, signForm } from '../src/engine';
import type { GameState } from '../src/engine';
import { botRng, botStep, STYLES } from '../src/sim/bot';
import { DcView, type DcNode } from '../src/ui/dc/DcView';
import { buildView, freshUi, type UiState } from '../src/ui/view/buildView';
import fs from 'node:fs';

const views = [1, 2, 3, 4, 5, 6, 7].map((n) => JSON.parse(fs.readFileSync(new URL(`../src/data/views/era${n}.json`, import.meta.url), 'utf8')).root as DcNode);
const render = (s: GameState, ui: UiState) => {
  const v = buildView({ s, ui, run: () => {}, setUi: () => {} });
  return renderToStaticMarkup(createElement(DcView, { root: views[s.era - 1], view: v }));
};

describe('views', () => {
  for (let era = 1; era <= 7; era++) {
    it(`era ${era}: all screens render`, () => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 6; seed++) {
        let s = newGame(seed * 13, era);
        const r = botRng(seed);
        for (let i = 0; i < 300; i++) {
          seen.add(s.screen);
          const html = render(s, freshUi());
          expect(html.length).toBeGreaterThan(1000);
          if (i % 7 === 0) render(s, { pend: 'o0', pendD: { p: 5, i: 3 }, hudOpen: true, info: 'threat', album: true });
          const n = botStep(s, r, seed % 2 ? STYLES.smart : STYLES.greedy);
          if (n === s || n.era !== era) break;
          s = n;
        }
      }
      expect(seen.has('office') && seen.has('evening') && seen.has('ending')).toBe(true);
    });
  }
  it('screen texts come from the right era', () => {
    const s4 = signForm(newGame(5, 4));
    expect(render(s4, freshUi())).toContain(s4.headline.slice(0, 10));
  });
});
