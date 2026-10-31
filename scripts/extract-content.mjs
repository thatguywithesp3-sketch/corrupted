// Extracts era content from the HTML prototype into src/data/eras/eraN.json.
//
// Sources (copied from the design prototype into /prototype):
//   prototype/eras/eraN.dc.html  — generated per-era prototype; its Component class holds the era data
//   prototype/era-pairs.json     — the text substitutions the prototype generator used for eras II–VII
//   src/data/strings.base.uk.json — hand-ported Era I strings that the engine uses
//
// Run: npm run extract
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const base = JSON.parse(fs.readFileSync(path.join(root, 'src/data/strings.base.uk.json'), 'utf8'));
delete base._comment;
const pairs = JSON.parse(fs.readFileSync(path.join(root, 'prototype/era-pairs.json'), 'utf8'));
const colorMaps = JSON.parse(fs.readFileSync(path.join(root, 'prototype/era-colors.json'), 'utf8'));

function loadComponent(n) {
  const html = fs.readFileSync(path.join(root, `prototype/eras/era${n}.dc.html`), 'utf8');
  const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
  const DCLogic = class { constructor() {} setState(o) { Object.assign(this.state, o); } };
  const C = new Function('DCLogic', js + '; return Component;')(DCLogic);
  return new C({});
}

// Turn one generator pair (written against JS source) into plain-text replacements.
function textPairs(a, b) {
  const qa = (a.match(/'/g) || []).length, qb = (b.match(/'/g) || []).length;
  if (qa === 0) return [[a, b, true]];
  if (qa % 2 === 1 || qb % 2 === 1) {
    const sa = a.split("'"), sb = b.split("'");
    let best = 0;
    sa.forEach((x, i) => { if (x.length > sa[best].length) best = i; });
    if (sb[best] === undefined) return [];
    return [[sa[best], sb[best], true]];
  }
  const la = [...a.matchAll(/'([^']*)'/g)].map((m) => m[1]);
  const lb = [...b.matchAll(/'([^']*)'/g)].map((m) => m[1]);
  if (la.length !== lb.length) return [];
  return la.map((x, i) => [x, lb[i], x.length >= 8]).filter((p) => p[0] && p[0] !== p[1]);
}

function eraStrings(n) {
  const out = { ...base };
  if (n === 1) return { strings: out, unmatched: [] };
  const unmatched = [];
  for (const [a, b] of pairs[String(n)]) {
    let hit = false;
    for (const [from, to, substr] of textPairs(a, b)) {
      for (const k of Object.keys(out)) {
        const v = out[k];
        if (substr ? v.includes(from) : v === from) { out[k] = substr ? v.split(from).join(to) : to; hit = true; }
      }
    }
    if (!hit) unmatched.push(a.slice(0, 70));
  }
  return { strings: out, unmatched };
}

const outDir = path.join(root, 'src/data/eras');
fs.mkdirSync(outDir, { recursive: true });
for (let n = 1; n <= 7; n++) {
  const c = loadComponent(n);
  const fresh = c.fresh();
  const { strings, unmatched } = eraStrings(n);
  const content = {
    era: n,
    startYear: fresh.year,
    defaultHero: { first: fresh.first, surname: fresh.surname, gender: fresh.gender },
    accomplices: fresh.acc,
    ranks: c.ranks(),
    names: c.names(),
    origins: c.origins(),
    dreams: c.dreams(),
    traits: c.traits().map((t) => ({ t: t.t, fx: t.fx, d: t.d })),
    schemes: c.schemes(),
    choices: c.choices(),
    words: {
      campaign: c.campWords(),
      dialog: c.dlgWords(),
      kids: c.kidWords(),
      upbringing: c.traitWords()
    },
    meters: c.meterInfo(),
    strings,
    theme: { look: c.look(), colors: c.colors(), icons: c.paths(), colorMap: colorMaps[String(n)] || {} }
  };
  fs.writeFileSync(path.join(outDir, `era${n}.json`), JSON.stringify(content, null, 1));
  console.log(`era${n}: ${content.schemes.length} schemes, ${content.choices.length} choices, ${Object.keys(strings).length} strings` +
    (unmatched.length ? `, ${unmatched.length} generator pairs not used by engine strings` : ''));
}
