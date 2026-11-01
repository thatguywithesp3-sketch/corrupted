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
      { t: 'e', n: 'button', a: { class: 'b3d', onClick: '{{f.pick}}', 'aria-label': '{{f.label}}', style: 'flex: 1; height: 182px; padding: 3px 3px 12px; background: #FFFDF6; border: {{f.border}}; cursor: pointer; transform: rotate({{f.rot}}); box-shadow: 0 2px 4px rgba(0,0,0,0.3)' }, ch: [
        { t: 'e', n: 'span', a: { style: 'display: block; width: 100%; height: 100%; background-image: url({{f.src}}); background-size: cover; background-position: center top; filter: {{f.filter}}' }, ch: [] }
      ] }
    ] }
  ] }
];
const ICON16 = { t: 'e', n: 'span', a: { style: 'width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0' }, ch: [
  { t: 'e', n: 'svg', a: { width: '24', height: '24', 'aria-hidden': 'true', style: 'flex-shrink: 0; overflow: visible; transform: scale({{x.ic.k}}); fill: none; stroke: {{x.ic.stroke}}; stroke-width: {{x.ic.sw}}; fill-rule: evenodd; stroke-linejoin: round' }, ch: [{ t: 'e', n: 'path', a: { d: '{{x.ic.path}}' }, ch: [] }] }
] };
const MINI_ITEM = [
  { t: 'e', n: 'span', a: { style: 'flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 2px 3px; border-radius: 9px; border: {{x.border}}' }, ch: [
    { t: 'e', n: 'span', a: { style: 'display: flex; align-items: center; gap: 3px' }, ch: [
      ICON16,
      { t: 'e', n: 'span', a: { style: 'font-size: 15px; font-weight: 700; line-height: 1; color: {{x.color}}; white-space: nowrap' }, ch: [{ t: 'x', v: '{{x.val}}' }] },
      { t: 'if', v: '{{x.plain}}', ch: [{ t: 'if', v: '{{x.hasD}}', ch: [{ t: 'e', n: 'span', a: { style: 'font-size: 9px; color: {{x.arrowColor}}' }, ch: [{ t: 'x', v: '{{x.arrow}}' }] }] }] }
    ] },
    { t: 'if', v: '{{x.hasPv}}', ch: [
      { t: 'e', n: 'span', a: { style: 'display: flex; align-items: center; gap: 3px; white-space: nowrap; line-height: 1' }, ch: [
        { t: 'e', n: 'span', a: { style: 'font-size: 10.5px; font-weight: 700; padding: 1px 5px 2px; border-radius: 7px; background: {{x.dBg}}; color: {{x.dFg}}' }, ch: [{ t: 'x', v: '{{x.dTxt}}' }] },
        { t: 'e', n: 'span', a: { style: 'font-size: 9px; color: rgba(230,217,188,0.55)' }, ch: [{ t: 'x', v: '{{x.was}}' }] }
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
  // compact form so the full-height founder photos fit
  if (node.t === 'e' && node.n === 'button' && node.a.onClick === '{{o.pick}}') node.a.style = node.a.style.replace('min-height: 52px', 'min-height: 42px').replace('padding: 6px 10px', 'padding: 4px 10px');
  if (node.t === 'e' && node.n === 'button' && node.a.onClick === '{{d.pick}}') node.a.style = node.a.style.replace('min-height: 46px', 'min-height: 38px');
  if (node.t === 'e' && node.n === 'button' && node.a.onClick === '{{g.pick}}') node.a.style = node.a.style.replace('min-height: 44px', 'min-height: 36px');
  node.ch = node.ch.filter((c) => !(c.t === 'e' && c.ch && c.ch.length === 1 && c.ch[0].t === 'x' && c.ch[0].v.trim() === '{{o.d}}'));
  node.ch.forEach((c) => { if (c.t === 'x' && c.v.includes('Киньте кубик')) c.v = 'Прізвище стане назвою роду. Кубик — випадкове ім’я.'; });
  const i = node.ch.findIndex((c) => c.t === 'e' && (c.ch || []).some((x) => x.t === 'for' && x.v === '{{genderOpts}}'));
  if (i >= 0) node.ch.splice(i + 1, 0, ...FACE_ROW);
  // hero portrait on the brass name plate
  const j = node.ch.findIndex((c) => c.t === 'e' && (c.a.style || '').startsWith('flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px') && (c.ch || []).some((x) => x.t === 'e' && x.ch && x.ch[0] && x.ch[0].t === 'x' && x.ch[0].v.trim() === '{{plateName}}'));
  if (j >= 0) node.ch.splice(j, 0, { t: 'if', v: '{{hasPortrait}}', ch: [
    { t: 'e', n: 'button', a: { onClick: '{{openAlbum}}', 'aria-label': 'Портрет', style: 'width: 30px; height: 40px; flex-shrink: 0; margin: -2px -3px; padding: 2px; background: #F7F0DE; border: 1px solid #6E531E; box-shadow: 0 1px 3px rgba(0,0,0,0.45); cursor: pointer' }, ch: [
      { t: 'e', n: 'span', a: { style: 'display: block; width: 100%; height: 100%; background-image: url({{portrait}}); background-size: cover; background-position: center top' }, ch: [] }
    ] }
  ] });
  // heir cards on the will get the portrait the heir will have
  if (node.t === 'e' && node.n === 'button' && node.a.onClick === '{{h.pick}}') {
    node.ch.unshift({ t: 'if', v: '{{h.hasFace}}', ch: [
      { t: 'e', n: 'span', a: { style: 'display: block; align-self: stretch; height: 120px; margin: -4px -4px 4px; background-image: url({{h.face}}); background-size: cover; background-position: center top; border: 1px solid #8C7E58' }, ch: [] }
    ] });
  }
  // HUD mini meters: "what if" preview as value + delta chip instead of a cramped "34→36 ▲" pill
  if (node.t === 'for' && node.v === '{{mini}}') node.ch = MINI_ITEM;
  if (node.t === 'e' && node.n === 'span' && node.ch.length === 1 && node.ch[0].t === 'x' && node.ch[0].v === 'ЯКЩО ТАК') {
    node.a.style = 'font-size: 8px; font-weight: 700; letter-spacing: 1px; line-height: 1.15; color: #1F1A14; background: #D9A441; padding: 3px 4px; width: 30px; text-align: center; flex-shrink: 0; box-shadow: 0 1px 0 rgba(0,0,0,0.4)';
  }
  const plus = node.t !== 'e' ? -1 : node.ch.findIndex((c) => c.t === 'e' && c.n === 'span' && c.ch && c.ch.length === 1 && c.ch[0].t === 'x' && c.ch[0].v === '+' && /width: 30px/.test(c.a.style || ''));
  if (plus >= 0) node.ch[plus] = { t: 'if', v: '{{hudTitleShow}}', ch: [node.ch[plus]] };
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
