import type { GameState } from './types';

/** mulberry32 — small, fast, deterministic. The generator state lives in GameState.rng,
 *  so a saved game replays identically. Call only on a draft (cloned) state. */
export function rand(s: GameState): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(s: GameState, n: number): number {
  return Math.floor(rand(s) * n);
}

export function pick<T>(s: GameState, list: readonly T[]): T {
  return list[randInt(s, list.length)];
}
