// Painted portraits for the people around the hero (Era I): accomplices, the governor, the press, the
// children and the hero's brothers and sisters. Same hand-tinted caricature style as the heroes and rivals.
// Anyone without a painted portrait keeps the old cut-paper silhouette.
import type { Kin } from '../engine';

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const P = (n: string) => `art/people/${n}.jpg`;

/** accomplices by key, and the other recurring faces */
const NPC: Record<string, string> = { pike: 'pike', dobbs: 'dobbs', otto: 'otto', boss: 'governor', journo: 'reporter', okhrana: 'rittmeister' };
export function npcPortrait(era: number, key: string): string | null {
  return era === 1 && NPC[key] ? P(NPC[key]) : null;
}

/** a child or a sibling: by age and sex, the same face for the same person all game */
export function kinPortrait(era: number, k: Kin, sib = k.id.charAt(0) === 's'): string | null {
  if (era !== 1) return null;
  const f = k.g === 'f', h = hash(k.id);
  if (sib) return P(f ? 'sister' : 'brother');
  if (k.age < 13) return P((f ? 'girl' : 'boy') + (1 + (h % 3)));
  if (k.age < 22) return P((f ? 'teeng' : 'teenb') + (1 + (h % 2)));
  return `art/heirs/e1-${f ? 'f' : 'm'}${1 + (h % 3)}.jpg`;
}
