import type { EraContent } from './types';
import era1 from '../data/eras/era1.json';
import era2 from '../data/eras/era2.json';
import era3 from '../data/eras/era3.json';
import era4 from '../data/eras/era4.json';
import era5 from '../data/eras/era5.json';
import era6 from '../data/eras/era6.json';
import era7 from '../data/eras/era7.json';
import { fill } from './text';
import type { Gender } from './types';

const ERAS = [era1, era2, era3, era4, era5, era6, era7] as unknown as EraContent[];

export const ERA_COUNT = ERAS.length;

export function getEra(n: number): EraContent {
  const c = ERAS[n - 1];
  if (!c) throw new Error('Unknown era ' + n);
  return c;
}

/** Localised string for an era, with template filling. Missing keys are loud in dev. */
export function str(era: number, key: string, vars?: Record<string, string | number>, g?: Gender): string {
  const t = getEra(era).strings[key];
  if (t === undefined) throw new Error('Missing string ' + key);
  return fill(t, vars, g);
}
