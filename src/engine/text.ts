import type { Gender } from './types';

/** 12345 → "12 345" */
export function fmt(v: number): string {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** compact: 950 → "950", 2500 → "2.5k", 12000 → "12k" */
export function fk(v: number): string {
  const a = Math.abs(Math.round(v)), sg = v < 0 ? '−' : '';
  if (a < 1000) return sg + a;
  const f = (x: number) => (x < 10 ? String(Math.round(x * 10) / 10) : String(Math.round(x)));
  if (a < 1000000) return sg + f(a / 1000) + 'k';
  return sg + f(a / 1000000) + 'M';
}

/** Fill a template: {var} → vars[var]; {masc|fem} → picked by gender g. */
export function fill(tpl: string, vars: Record<string, string | number> = {}, g: Gender = 'm'): string {
  return tpl.replace(/\{([^{}]*)\}/g, (m, body: string) => {
    if (body.includes('|')) {
      const [a, b] = body.split('|');
      return g === 'f' ? b : a;
    }
    return body in vars ? String(vars[body]) : m;
  });
}

export const clamp100 = (v: number) => Math.max(0, Math.min(100, v));
