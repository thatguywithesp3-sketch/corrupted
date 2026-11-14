// Swap the balance numbers for a while (the parity test plays with the prototype's numbers).
import { getEra } from './content';
import { PROTOTYPE_PATCH, RULES } from './rules';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** deep-assign `patch` into `target`; returns what it overwrote, so it can be put back */
function patchInto(target: Obj, patch: Obj): Obj {
  const old: Obj = {};
  for (const k of Object.keys(patch)) {
    const v = patch[k], t = target[k];
    if (isObj(v) && isObj(t)) old[k] = patchInto(t, v);
    else { old[k] = structuredClone(t); target[k] = structuredClone(v); }
  }
  return old;
}

/** Run fn with the HTML prototype's balance (rules + Era I ranks), then restore the current one. */
export function withPrototypeBalance<T>(fn: () => T): T {
  const ranks = getEra(1).ranks as unknown as Obj[];
  const oldRules = patchInto(RULES as unknown as Obj, PROTOTYPE_PATCH.rules as unknown as Obj);
  const oldRanks = ranks.map((r) => ({ ...r }));
  PROTOTYPE_PATCH.era1Ranks.forEach((r, i) => Object.assign(ranks[i], r));
  try { return fn(); } finally {
    patchInto(RULES as unknown as Obj, oldRules);
    oldRanks.forEach((r, i) => { Object.keys(ranks[i]).forEach((k) => delete ranks[i][k]); Object.assign(ranks[i], r); });
  }
}
