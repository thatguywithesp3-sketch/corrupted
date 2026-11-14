// ---------- content (data/eras/eraN.json) ----------

/** Effect of a decision on the four meters and money. p=patron, n=people, s=system, i=threat (risk). */
export interface Delta {
  p?: number;
  n?: number;
  s?: number;
  i?: number;
  /** dirty money (negative spends dirty first, then clean) */
  cash?: number;
  clean?: number;
}

export type AccKey = 'pike' | 'dobbs' | 'otto';

export interface Accomplice {
  n: string; // name
  r: string; // role
  l: number; // loyalty 0..100
  k: number; // knows 0..100
}

export interface Rank { t: string; tf: string; cost: number; mult: number; limit: number }
export interface Origin { t: string; tf: string; d: string; fx: string }
export interface Dream { t: string; g: string }
export interface Trait { t: string; fx: string; d: Delta }

export interface Scheme {
  from: string;
  acc: AccKey;
  budget: number;
  yes: string;
  q: string;
  /** per appetite level 0/1/2 (5% / 10% / 20%) */
  i: number[]; n: number[]; s: number[]; p: number[]; k: number[];
  h: string[]; b: string[];
  no: { t: string; d: Delta; al?: Partial<Record<AccKey, number>>; h: string; b: string };
}

/** Effect on a family member (kid or sibling) */
export interface FamFx { id: string; l?: number; k?: number; prep?: number; trait?: number; assets?: number; gone?: string }

export interface ChoiceOption {
  t: string;
  /** what this leads to, in one or two short lines (shown under the option) */
  why?: string[];
  d: Delta;
  al?: Partial<Record<AccKey, { l?: number; k?: number }>>;
  fam?: FamFx;
  flag?: 'blood' | 'sellout';
  dark?: boolean;
  /** deck: story flags this answer sets (conditions and later documents read them) */
  set?: string[];
  /** deck: a follow-up document that comes back in `in` years (an arc) */
  then?: { id: string; in: number };
  /** deck: what this does to a magnate of the city layer */
  riv?: { id: string; heat?: number; power?: number };
  h: string;
  b: string;
}

export type Who =
  | { kind: 'boss' }
  | { kind: 'journo' }
  | { kind: 'acc'; acc: AccKey }
  | { kind: 'fam'; id: string }
  | { kind: 'rival'; id: string };

export interface Choice {
  from: string;
  q: string;
  opts: ChoiceOption[];
  /** first-person line for the dialog screen */
  say?: string;
  /** narrator summary for the dialog screen */
  gist?: string;
}

/** When a deck card can be dealt: every listed test must pass. Ranges are inclusive [min, max]. */
export interface DocCond {
  rank?: [number, number];
  /** years already served */
  year?: [number, number];
  patron?: [number, number]; people?: [number, number]; system?: [number, number]; threat?: [number, number];
  /** story flags that must be set / must not be set */
  flag?: string[]; noFlag?: string[];
  /** a living child at least this old */
  kidAge?: number;
  estate?: boolean;
  /** a magnate at least this angry (and not allied) */
  rivalHeat?: { id: string; min: number };
}

/** A card of the document deck (Era I): drawn by weight among the cards whose conditions pass, no repeats
 *  until the pile runs out. Arc cards are never drawn: they come back only when an earlier answer schedules them. */
interface DeckBase { id: string; w?: number; cond?: DocCond; arc?: boolean }
export type DeckScheme = DeckBase & Scheme;
export type DeckChoice = DeckBase & Omit<Choice, 'opts'> & { opts: Array<Omit<ChoiceOption, 'fam'>>; who?: Who | null };
export interface Deck { schemes: DeckScheme[]; choices: DeckChoice[] }

export interface EraWords {
  campaign: { media: string; gift: string; rival: string };
  dialog: { medium: 'letter' | 'call' | 'chat'; [k: string]: unknown };
  kids: { flash: string; stash: string };
  upbringing: { edu: string; eduOpt: string; eduB: string; links: string; linksOpt: string; linksH: string; biz: string };
}

export interface MeterInfo { name: string; short: string; what: string; low: string; high: string; up: string; down: string }

export interface EraContent {
  era: number;
  startYear: number;
  defaultHero: { first: string; surname: string; gender: Gender };
  accomplices: Record<AccKey, Accomplice>;
  ranks: Rank[];
  names: { m: string[]; f: string[]; s: string[] };
  origins: Origin[];
  dreams: Dream[];
  traits: Trait[];
  schemes: Scheme[];
  choices: Array<Omit<Choice, 'opts'> & { opts: Array<Omit<ChoiceOption, 'fam'>> }>;
  words: EraWords;
  /** the document deck; eras without one deal the prototype's fixed rotation */
  deck?: Deck;
  meters: Record<Meter, MeterInfo>;
  strings: Record<string, string>;
  theme: { look: Record<string, unknown>; colors: Record<string, string>; icons: Record<string, string>; colorMap: Record<string, string> };
}

// ---------- state ----------

export type Gender = 'm' | 'f';
export type Meter = 'patron' | 'people' | 'system' | 'threat';
export type Screen = 'form' | 'morning' | 'office' | 'evening' | 'night' | 'campaign' | 'elect' | 'ending' | 'victory';

export interface Kin {
  id: string; // k1.. for children, s… for siblings
  first: string;
  g: Gender;
  age: number;
  trait: number | null;
  l: number; // loyalty
  k: number; // knows
  prep: number; // readiness 0..100 → stars
  assets: number; // money written in their name (era III+)
  gone: boolean;
  why: string;
}

export interface Heir extends Kin { nephew?: boolean; /** portrait preset index (0..2) the heir will have as head of the family */ face?: number }

export interface ReportLine { t: string; tone: 'ok' | 'warn' | 'bad' | 'neu'; icon: string; strong?: boolean }

export interface Offer { id: 'promo' | 'pres' | 'retire' | 'flee' | 'estate'; t: string; sub: string; btn: string }

export type EndKind = 'collapse' | 'retire' | 'flee' | 'summit';

export interface Ending {
  kind: EndKind;
  title: string;
  text: string;
  inherit: number;
  lost: number;
  dream: boolean;
  dynastyOver: boolean;
  eraOver: boolean;
  campaignOver: boolean;
  header: string;
  life: string;
  kidAssets: number;
}

export interface Campaign { round: number; me: number; rival: number; fraud: number; log: string }

export interface Alloc { floor: number; wh: number; laun: number; kid: number }

/** tonight's deal with the banker (evening only) */
export type BankDeal = 'limit' | 'fee';

export interface DeckState { today: string[]; seen: string[]; flags: Record<string, number>; queue: { id: string; at: number }[] }

export interface YearMark { patron: number; people: number; system: number; threat: number; clean: number; cash: number; floor: number; wh: number }

export type StampKind ='signed' | 'declined' | 'decided' | 'dark';

export interface GameState {
  v: 1;
  rng: number;
  era: number;
  screen: Screen;
  first: string;
  surname: string;
  gender: Gender;
  /** portrait preset of the founder (0..2, per gender); heirs get null until heir portraits exist */
  face: number | null;
  origin: number;
  dream: number;
  gen: number;
  tavro: boolean; // branded dynasty (after a collapse)
  shadow: number; // years of president-parent protection left
  blood: boolean;
  thrBase: number;
  launBonus: number;
  year: number;
  served: number;
  rank: number;
  patron: number;
  people: number;
  system: number;
  threat: number;
  cash: number; // dirty, in the drawer
  floor: number; // hidden stash 1
  wh: number; // hidden stash 2 (relative's warehouse)
  clean: number;
  /** the family owns the estate on Castle Hill (absent in old saves) */
  estate?: boolean;
  /** this life's dream is already fulfilled (the estate was bought) */
  dreamDone?: boolean;
  /** meters and money at the start of the current year, for the year report (absent in old saves) */
  yearStart?: YearMark;
  /** the document deck: this year's cards, what was already dealt, story flags (value: the year set) and arcs due later */
  deck?: DeckState;
  acc: Record<AccKey, Accomplice>;
  doc: number;
  ap: number; // appetite 0..2
  owed: Partial<Record<AccKey, number>>;
  pay: Partial<Record<AccKey, boolean>>;
  alloc: Alloc;
  /** the living city (businesses, economy, morning news) — absent in old saves */
  city?: import('./city').CityState;
  /** banker bribed tonight (cleared when the safe is locked) */
  bank?: BankDeal | null;
  lastAlloc: Alloc | null;
  last: Delta;
  headline: string;
  body: string;
  report: ReportLine[];
  offers: Offer[];
  ending: Ending | null;
  heirs: Heir[];
  lastStamp: StampKind | null;
  lastDec: { t: string; d: Delta } | null;
  camp: Campaign | null;
  kids: Kin[];
  kidsMax: number;
  kidSeq: number;
  kidPay: Record<string, boolean>;
  sibs: Kin[];
  /** stats for the whole campaign */
  history: Array<{ era: number; gen: number; name: string; kind: EndKind; title: string; inherit: number;
    /** for the family tree (saves made before these fields existed lack them) */
    g?: Gender; face?: number | null; rank?: string; from?: number; to?: number; text?: string; lost?: number; dream?: boolean; kids?: number; dreamT?: string }>;
}

// ---------- office documents ----------

export type Doc =
  | { kind: 'scheme'; scheme: Scheme }
  | { kind: 'choice'; choice: Choice; who: Who | null };
