// Painted portraits for the people around the hero (Era I): accomplices, the governor, the press, the
// children and the hero's brothers and sisters. Same hand-tinted caricature style as the heroes and rivals.
// Anyone without a painted portrait keeps the old cut-paper silhouette.
import type { Kin } from '../engine';
import { regimeOf } from '../engine';

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const P = (n: string) => `art/people/${n}.jpg`;

/** accomplices by key, and the other recurring faces */
const NPC: Record<string, string> = { pike: 'pike', dobbs: 'dobbs', otto: 'otto', boss: 'governor', journo: 'reporter', okhrana: 'rittmeister' };
// Era II: the same roles, other people. The patron and the police change with the power in charge
// (the governor-general → the commissar → the revolutionary committee → the party secretary; the rittmeister →
// the chekist → the organs); the Provisional Government's militia has no face of its own.
const NPC2: Record<string, string> = { pike: 'e2-goltz', dobbs: 'e2-milch', otto: 'e2-karl', journo: 'e2-reporter' };
const BOSS2 = { empire: 'e2-governor', provisional: 'e2-commissar', vnr: 'e2-vnr-commissar', civil: 'e2-revcom', soviet: 'e2-secretary' } as const;
const POLICE2 = { empire: 'rittmeister', provisional: null, vnr: 'e2-varta', civil: 'e2-chekist', soviet: 'e2-organs' } as const;
export function npcPortrait(s: { era: number; year: number }, key: string): string | null {
  if (s.era === 1) return NPC[key] ? P(NPC[key]) : null;
  const reg = regimeOf(s);
  if (!reg) return null;
  const n = key === 'boss' ? BOSS2[reg] : key === 'okhrana' ? POLICE2[reg] : NPC2[key];
  return n ? P(n) : null;
}

/** a child or a sibling: by age and sex, the same face for the same person all game */
export function kinPortrait(era: number, k: Kin, sib = k.id.charAt(0) === 's'): string | null {
  const f = k.g === 'f', h = hash(k.id);
  if (era === 2) {
    // the 1910s–1930s children and siblings: one face per sex and age; grown ones are Era II adults
    if (k.age < 13) return P(f ? 'e2-girl' : 'e2-boy');
    if (k.age < 22) return P(f ? 'e2-teeng' : 'e2-teenb');
    return `art/heirs/e2-${f ? 'f' : 'm'}${1 + (h % 3)}.jpg`;
  }
  if (era !== 1) return null;
  if (sib) return P(f ? 'sister' : 'brother');
  if (k.age < 13) return P((f ? 'girl' : 'boy') + (1 + (h % 3)));
  if (k.age < 22) return P((f ? 'teeng' : 'teenb') + (1 + (h % 2)));
  return `art/heirs/e1-${f ? 'f' : 'm'}${1 + (h % 3)}.jpg`;
}
