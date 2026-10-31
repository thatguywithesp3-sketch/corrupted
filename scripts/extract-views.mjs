// Turns each era's prototype template (prototype/eras/eraN.dc.html) into a JSON tree the game renders.
// The look of every screen therefore stays identical to the design canvas; logic comes from the engine.
// Run: npm run extract (runs after extract-content)
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'src/data/views');
fs.mkdirSync(outDir, { recursive: true });

// small copy fixes on top of the prototype markup
const TEXT_FIXES = [[/Тут почалася б епоха/g, 'Далі — епоха'], [/Почати знову · \d{4}/g, 'Почати знову']];

function toAst(node) {
  if (node.type === 'text') {
    let v = node.data;
    for (const [a, b] of TEXT_FIXES) v = v.replace(a, b);
    if (!v.trim()) return v.includes('\n') ? null : { t: 'x', v };
    return { t: 'x', v: v.replace(/\s+/g, ' ') };
  }
  if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') return null;
  const ch = (node.children || []).map(toAst).filter(Boolean);
  const a = node.attribs || {};
  if (node.name === 'sc-if') return { t: 'if', v: a.value, ch };
  if (node.name === 'sc-for') return { t: 'for', v: a.list, as: a.as, ch };
  const attrs = {};
  for (const [k, v] of Object.entries(a)) if (!k.startsWith('hint-')) attrs[k] = v;
  return { t: 'e', n: node.name, a: attrs, ch };
}

for (let n = 1; n <= 7; n++) {
  const html = fs.readFileSync(path.join(root, `prototype/eras/era${n}.dc.html`), 'utf8');
  const inner = html.split(/<x-dc[^>]*>/)[1].split('</x-dc>')[0];
  const helmet = (inner.match(/<helmet>([\s\S]*?)<\/helmet>/) || ['', ''])[1];
  const fonts = [...helmet.matchAll(/<link[^>]*href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const css = (helmet.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
  const body = inner.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const doc = parseDocument(body, { lowerCaseAttributeNames: false, lowerCaseTags: false, recognizeSelfClosing: true, decodeEntities: true });
  const ast = doc.children.map(toAst).filter((x) => x && x.t !== 'x');
  fs.writeFileSync(path.join(outDir, `era${n}.json`), JSON.stringify({ fonts, css, root: ast[0] }));
  console.log(`view era${n}: ${JSON.stringify(ast[0]).length} bytes`);
}
