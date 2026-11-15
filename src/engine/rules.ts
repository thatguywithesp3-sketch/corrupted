/** Balance numbers in one place. They started as the HTML prototype (v52); PROTOTYPE_PATCH below
 *  holds the prototype's values for every number changed since, so the parity test can still play
 *  the engine against the prototype (see balance.ts). Tuned with `npm run sim:goals`. */
export const RULES = {
  careerYears: 20,
  gensPerEra: 2,
  appetite: [0.05, 0.1, 0.2],
  accShare: 0.2, // accomplice's cut of every scheme
  launderFee: 0.1,
  /** yearly bribe to the banker: either a higher laundering limit or a lower fee, for this evening only */
  banker: { limitCost: 0.3, limitBoost: 0.6, feeCost: 0.15, fee: 0.03, threat: { limit: 2, fee: 1 } },
  start: { patron: 50, people: 50, system: 50, threat: 10, clean: 1000 },
  dangerZone: 15,
  dangerZoneBranded: 19,
  slidePerYear: 3,
  threatPerYear: 2,
  threatBranded: 2,
  threatBlood: 5,
  raidMaxOdds: 0.9,
  raidThreatDivisor: 130,
  raidBrandedBonus: 0.1,
  floorFoundChance: 0.5,
  warehouseUnsafeLoyalty: 40,
  insider: { loyaltyMax: 25, knowsMin: 40, threat: 25 },
  accPaidLoyalty: 10,
  accUnpaidLoyalty: -20,
  promoPatronCost: 10,
  promoThreat: 2,
  offers: { patronMin: 55, retireAfter: 12, fleeCleanMin: 4000 },
  presidentFee: 2000,
  /** the estate on Castle Hill: bought once with clean money; fulfils the "estate" dream and stays with the family */
  estate: { on: true, price: 5000, offerFrom: 1 },
  /** the document deck (Era I): conditional cards and arcs instead of the prototype's fixed rotation */
  deck: { on: true },
  /** city moves a year: base + one per rank */
  cityMoves: { base: 3, perRank: 1 },
  endings: {
    collapseKeepsClean: 0.5,
    retireKeepsHidden: 0.5,
    fleeKeepsClean: 0.4
  },
  dreamBonus: 1000,
  dreamCleanGoal: 8000,
  dreamCleanThreat: 27,
  heir: { minorAge: 16, minorKeeps: 0.7, nephewPatron: -10, starsRankUp: 80 },
  shadowYears: 5,
  shadowPatron: 70,
  family: {
    firstChildAge: [6, 8],
    maxKids: [1, 3],
    birthWindow: [1, 9],
    birthChance: 0.3,
    allowance: { child: 50, teen: 150, adult: 100 },
    allowanceLoyalty: 6,
    allowancePrep: { child: 5, teen: 12, adult: 5 },
    noAllowanceLoyalty: -12,
    stashFromEra: 3,
    scandalMaxPct: 35,
    scandalAssetsPerPct: 150,
    scandalThreat: 8,
    testify: { loyaltyMax: 25, knowsMin: 40, threat: 25 },
    sibResentment: 20
  },
  campaign: { rounds: 4, rivalStart: 38, rivalDrift: [2, 3], meCap: 70, rivalFloor: 10, stuffVotes: 8, stuffFraud: 30, exposeFactor: 0.6, losePatron: -20, pledgeVotes: 8 }
};

export type Rules = typeof RULES;

/** The prototype's values of everything changed since v52 (rules, Era I ranks), and switches for
 *  mechanics the prototype does not have. Applied only by the parity test through withBalance(). */
export const PROTOTYPE_PATCH = {
  rules: {
    threatPerYear: 2,
    promoThreat: 5,
    promoPatronCost: 15,
    offers: { patronMin: 60 },
    presidentFee: 3000,
    estate: { on: false },
    deck: { on: false },
    dreamCleanThreat: 30,
    campaign: { rivalStart: 45 },
    cityMoves: { base: 1e9 },
    family: { allowance: { child: 100, teen: 300, adult: 200 } }
  },
  era1Ranks: [
    { t: 'Радник', tf: 'Радниця', cost: 0, mult: 1, limit: 400 },
    { t: 'Мер', tf: 'Мерка', cost: 1500, mult: 1.6, limit: 800 },
    { t: 'Віцегубернатор', tf: 'Віцегубернаторка', cost: 3000, mult: 2.4, limit: 1300 },
    { t: 'Міністр', tf: 'Міністерка', cost: 6000, mult: 3.4, limit: 2000 }
  ]
};
