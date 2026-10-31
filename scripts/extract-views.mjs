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

// ---- additions on top of the canvas markup (game-only UI)
const LABEL = 'font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #5A4630';
const FACE_ROW = [
  { t: 'e', n: 'div', a: { style: LABEL }, ch: [{ t: 'x', v: 'ФОТО ДЛЯ АНКЕТИ' }] },
  { t: 'e', n: 'div', a: { style: 'display: flex; gap: 8px; margin-top: -4px' }, ch: [
    { t: 'for', v: '{{faceOpts}}', as: 'f', ch: [
      { t: 'e', n: 'button', a: { class: 'b3d', onClick: '{{f.pick}}', 'aria-label': '{{f.label}}', style: 'flex: 1; height: 86px; padding: 3px 3px 10px; background: #FFFDF6; border: {{f.border}}; cursor: pointer; transform: rotate({{f.rot}}); box-shadow: 0 2px 4px rgba(0,0,0,0.3)' }, ch: [
        { t: 'e', n: 'span', a: { style: 'display: block; width: 100%; height: 100%; background-image: url({{f.src}}); background-size: cover; background-position: center 18%; filter: {{f.filter}}' }, ch: [] }
      ] }
    ] }
  ] }
];
const INPUT = 'flex: 1; min-width: 0; width: 100%; padding: 0; margin: 0; border: none; outline: none; background: transparent; font: inherit; color: inherit; line-height: inherit';
function inject(node) {
  if (!node || !node.ch) return;
  // editable name: the handwritten "{{fullName}}" line becomes two inputs in the same style
  if (node.t === 'e' && node.ch.length === 1 && node.ch[0].t === 'x' && node.ch[0].v.trim() === '{{fullName}}') {
    node.a.style = node.a.style.replace('white-space: nowrap; overflow: hidden', 'display: flex; gap: 8px');
    node.ch = [
      { t: 'e', n: 'input', a: { 'aria-label': 'Ім’я', value: '{{first}}', onInput: '{{setFirst}}', maxlength: '16', style: INPUT }, ch: [] },
      { t: 'e', n: 'input', a: { 'aria-label': 'Прізвище', value: '{{surname}}', onInput: '{{setSurname}}', maxlength: '16', style: INPUT + '; flex: 1.25' }, ch: [] }
    ];
    return;
  }
  node.ch.forEach((c) => { if (c.t === 'x' && c.v.includes('Киньте кубик')) c.v = 'Впишіть ім’я та прізвище або киньте кубик. Прізвище стане назвою роду.'; });
  const i = node.ch.findIndex((c) => c.t === 'e' && (c.ch || []).some((x) => x.t === 'for' && x.v === '{{genderOpts}}'));
  if (i >= 0) node.ch.splice(i + 1, 0, ...FACE_ROW);
  node.ch.forEach(inject);
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
  inject(ast[0]);
  fs.writeFileSync(path.join(outDir, `era${n}.json`), JSON.stringify({ fonts, css, root: ast[0] }));
  console.log(`view era${n}: ${JSON.stringify(ast[0]).length} bytes`);
}
