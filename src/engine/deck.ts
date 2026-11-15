// The document deck (Era I). Each year the office gets one scheme and one or two decisions, dealt from
// cards whose conditions fit the moment (rank, meters, years served, story flags, a child, an angry magnate),
// by weight, without repeats until the pile runs out. Some answers set story flags or schedule a follow-up
// card a few years later (arcs). Eras without a deck, and the parity test (RULES.deck.on = false), keep the
// prototype's fixed rotation in docsFor().
import { getEra } from './content';
import { rand } from './rng';
import { RULES } from './rules';
import type { Deck, DeckChoice, DeckScheme, DeckState, DocCond, GameState } from './types';

/** the era's deck when the deck is switched on */
export const deckOf = (s: GameState): Deck | null => (RULES.deck.on ? getEra(s.era).deck || null : null);

const inRange = (v: number, r?: [number, number]) => !r || (v >= r[0] && v <= r[1]);

/** do the card's conditions hold right now? */
export function condOk(s: GameState, c: DocCond | undefined, flags: Record<string, number> = s.deck?.flags || {}): boolean {
  if (!c) return true;
  if (!inRange(s.rank, c.rank) || !inRange(s.served, c.year)) return false;
  if (!inRange(s.patron, c.patron) || !inRange(s.people, c.people) || !inRange(s.system, c.system) || !inRange(s.threat, c.threat)) return false;
  if (c.flag && !c.flag.every((f) => f in flags)) return false;
  if (c.noFlag && c.noFlag.some((f) => f in flags)) return false;
  if (c.kidAge !== undefined && !s.kids.some((k) => !k.gone && k.age >= c.kidAge!)) return false;
  if (c.estate !== undefined && !!s.estate !== c.estate) return false;
  if (c.rivalHeat) {
    const r = s.city?.rivals.find((x) => x.id === c.rivalHeat!.id);
    if (!r || r.ally || r.heat < c.rivalHeat.min) return false;
  }
  return true;
}

/** a card by id (schemes and decisions share one id space) */
export function cardById(d: Deck, id: string): DeckScheme | DeckChoice | null {
  return d.schemes.find((x) => x.id === id) || d.choices.find((x) => x.id === id) || null;
}
export const isScheme = (d: Deck, id: string) => d.schemes.some((x) => x.id === id);

/** weighted draw of `n` cards from the pile; once every fitting card was seen, the seen ones come back */
function draw<T extends { id: string; w?: number; cond?: DocCond; arc?: boolean }>(s: GameState, st: DeckState, pile: T[], n: number, taken: string[]): T[] {
  const out: T[] = [];
  for (let k = 0; k < n; k++) {
    const fit = pile.filter((c) => !c.arc && !taken.includes(c.id) && !out.includes(c) && condOk(s, c.cond, st.flags));
    let fresh = fit.filter((c) => !st.seen.includes(c.id));
    if (!fresh.length) {
      // the pile ran out: shuffle these cards back in (the rest of what was seen stays seen)
      st.seen = st.seen.filter((id) => !fit.some((c) => c.id === id));
      fresh = fit;
    }
    if (!fresh.length) break;
    const total = fresh.reduce((a, c) => a + (c.w ?? 1), 0);
    let x = rand(s) * total, pick = fresh[fresh.length - 1];
    for (const c of fresh) { x -= c.w ?? 1; if (x < 0) { pick = c; break; } }
    out.push(pick);
    st.seen.push(pick.id);
  }
  return out;
}

/** Deal this year's office cards into s.deck.today (mutates the draft). Call at the start of every year. */
export function dealYear(n: GameState) {
  const d = deckOf(n);
  if (!d) return;
  const st: DeckState = n.deck || (n.deck = { today: [], seen: [], flags: {}, queue: [] });
  // arcs that are due (and still make sense) come first; at most two a year, the rest wait
  const due = st.queue.filter((q) => q.at <= n.served).sort((a, b) => a.at - b.at);
  const arcs: string[] = [];
  for (const q of due) {
    const c = cardById(d, q.id);
    if (c && condOk(n, c.cond, st.flags)) {
      if (arcs.length >= 2 || arcs.includes(c.id)) continue; // waits for next year
      arcs.push(c.id);
    }
    st.queue = st.queue.filter((x) => x !== q); // dealt, or no longer fits: dropped
  }
  const arcScheme = arcs.find((id) => isScheme(d, id));
  const scheme = arcScheme ? [arcScheme] : draw(n, st, d.schemes, 1, arcs).map((c) => c.id);
  const arcChoices = arcs.filter((id) => !isScheme(d, id));
  const want = Math.max(0, 1 + (n.rank >= 2 ? 1 : 0) - arcChoices.length);
  const choices = arcChoices.concat(draw(n, st, d.choices, want, arcChoices).map((c) => c.id));
  st.today = scheme.concat(choices);
}

/** an answer's story effects: flags and a scheduled follow-up */
export function applyStory(n: GameState, o: { set?: string[]; then?: { id: string; in: number } }) {
  if (!n.deck || (!o.set && !o.then)) return;
  (o.set || []).forEach((f) => { n.deck!.flags[f] = n.served; });
  if (o.then) n.deck.queue.push({ id: o.then.id, at: n.served + o.then.in });
}
