// Renders a design-canvas template (JSON tree from scripts/extract-views.mjs) against a view-model.
// Supports the template language used on the canvas: {{path}} holes, <sc-if value>, <sc-for list as>, onClick="{{fn}}".
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createElement, Fragment, type ReactNode } from 'react';

export type DcNode =
  | { t: 'x'; v: string }
  | { t: 'e'; n: string; a: Record<string, string>; ch: DcNode[] }
  | { t: 'if'; v: string; ch: DcNode[] }
  | { t: 'for'; v: string; as: string; ch: DcNode[] };

type Scope = Record<string, any>;

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const ONE = /^\{\{\s*([^}]+?)\s*\}\}$/;

function lookup(scope: Scope, path: string): any {
  if (path === 'true') return true;
  if (path === 'false') return false;
  let o: any = scope;
  for (const k of path.split('.')) { if (o == null) return undefined; o = o[k]; }
  return o;
}
const evalOne = (scope: Scope, s: string) => { const m = s.match(ONE); return m ? lookup(scope, m[1]) : s; };
const interp = (scope: Scope, s: string) => (s.includes('{{') ? s.replace(HOLE, (_, p) => { const v = lookup(scope, p); return v == null || typeof v === 'function' ? '' : String(v); }) : s);

const styleCache = new Map<string, Record<string, string>>();
function parseStyle(css: string): Record<string, string> {
  let out = styleCache.get(css);
  if (out) return out;
  out = {};
  let depth = 0, quote = '', buf = '';
  const flush = () => {
    const i = buf.indexOf(':');
    if (i > 0) {
      const prop = buf.slice(0, i).trim(), val = buf.slice(i + 1).trim();
      const key = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (val) out![key] = val;
    }
    buf = '';
  };
  for (const ch of css) {
    if (quote) { if (ch === quote) quote = ''; buf += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { flush(); continue; }
    buf += ch;
  }
  flush();
  if (styleCache.size > 5000) styleCache.clear();
  styleCache.set(css, out);
  return out;
}

const camel = (k: string) => (k.startsWith('aria-') || k.startsWith('data-') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()));

function renderNodes(nodes: DcNode[], scope: Scope, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  nodes.forEach((n, i) => {
    const k = key + '.' + i;
    if (n.t === 'x') { out.push(interp(scope, n.v)); return; }
    if (n.t === 'if') { if (evalOne(scope, n.v)) out.push(createElement(Fragment, { key: k }, ...renderNodes(n.ch, scope, k))); return; }
    if (n.t === 'for') {
      const list = evalOne(scope, n.v);
      if (Array.isArray(list)) list.forEach((item, j) => out.push(createElement(Fragment, { key: k + ':' + j }, ...renderNodes(n.ch, { ...scope, [n.as]: item }, k + ':' + j))));
      return;
    }
    const props: Record<string, any> = { key: k };
    for (const [a, raw] of Object.entries(n.a)) {
      if (a === 'onClick') {
        const fn = evalOne(scope, raw);
        // full-screen backdrops close only when the backdrop itself is clicked, not the card on it
        const backdrop = n.n === 'div' && /position: absolute; left: 0; top: 0; right: 0; bottom: 0/.test(n.a.style || '');
        if (typeof fn === 'function') props.onClick = (e: MouseEvent) => { if (backdrop && e.target !== e.currentTarget) return; e.stopPropagation(); fn(); };
        continue;
      }
      const val = interp(scope, raw);
      if (a === 'style') props.style = parseStyle(val);
      else if (a === 'class') props.className = val;
      else props[camel(a)] = val;
    }
    out.push(createElement(n.n, props, ...renderNodes(n.ch, scope, k)));
  });
  return out;
}

export function DcView({ root, view }: { root: DcNode; view: Scope }) {
  return <>{renderNodes([root], view, 'r')}</>;
}
