// View-model for the era templates (src/data/views/eraN.json).
// Turns engine state + UI state into the values the template holes ({{…}}) expect.
// Ported from the prototype's renderVals(); colours are written in the Era I palette and
// mapped to the current era at the end (exactly like the prototype generator did).
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as G from '../../engine';
import type { Delta, GameState, Kin } from '../../engine';

export interface UiState {
  pend: string | null;
  pendD: Delta | null;
  hudOpen: boolean;
  info: G.Meter | null;
  album: boolean;
}
export const freshUi = (): UiState => ({ pend: null, pendD: null, hudOpen: false, info: null, album: false });

export interface Ctx {
  s: GameState;
  ui: UiState;
  /** run an engine action (state → state); resets the two-tap preview */
  run: (f: (s: GameState) => GameState) => void;
  setUi: (p: Partial<UiState>) => void;
}

const BASE = G.getEra(1).theme;
const cl = (v: number) => Math.max(0, Math.min(100, v));

function icon(key: string, box: number, framed = false) {
  const c = BASE.colors[key];
  const k = (box * (framed ? 0.66 : 0.95)) / 24;
  return { path: BASE.icons[key], box: box + 'px', k: String(k), fill: 'none', stroke: c, sw: String(1.6 / k), border: framed ? '1.5px solid ' + c : 'none', radius: '50%' };
}
function pill(kind: string, text: string, tone: 'good' | 'bad' | 'neu' | 'paper' | 'warn' = 'neu') {
  const T = { good: ['#1E3A2A', '#66BC8E', '#CDEFD9'], bad: ['#3A1A14', '#E8603F', '#F8CBBE'], neu: ['#2A231B', '#6B5A42', '#E6D9BC'], paper: ['#F7F0DE', '#8C7E58', '#1F1A14'], warn: ['#3A2E12', '#D9A441', '#F2DFA8'] }[tone];
  const ic = icon(kind, 14);
  if (tone === 'paper' && (kind === 'clean' || kind === 'dirty')) ic.stroke = '#5A4630';
  return { ic, text, bg: T[0], bd: T[1], fg: T[2] };
}
const tone = (key: string, cur: number, nxt: number) =>
  key === 'threat' ? (nxt > cur ? 'bad' : 'good') : Math.abs(nxt - 50) > Math.abs(cur - 50) ? 'bad' : 'good';

function fxPills(d: Delta, s: GameState) {
  const out: any[] = [];
  const sg = (v: number) => (v > 0 ? '+' + v : '−' + -v);
  ([['patron', 'p'], ['people', 'n'], ['system', 's'], ['threat', 'i']] as const).forEach(([m, k]) => {
    const v = d[k];
    if (!v) return;
    if (m === 'patron' && s.shadow > 0) return;
    const cur = cl(s[m]);
    out.push(pill(m, sg(v), tone(m, cur, cur + v)));
  });
  const sk = (v: number) => (v > 0 ? '+' : '−') + G.fk(Math.abs(v));
  if (d.cash) out.push(pill('dirty', sk(d.cash), 'warn'));
  if (d.clean) out.push(pill('clean', sk(d.clean), 'warn'));
  if (G.isFatal(s, d)) out.unshift(pill('skull', 'ФАТАЛЬНО', 'bad'));
  return out;
}

function gauge(v: number, ghost: number | null, cx: number, cy: number, r: number, a0: number, a1: number, dz: number) {
  const P = (val: number, rr: number) => { const a = ((a0 + ((a1 - a0) * val) / 100) * Math.PI) / 180; return [(cx + rr * Math.cos(a)).toFixed(1), (cy - rr * Math.sin(a)).toFixed(1)]; };
  const arc = (v1: number, v2: number, rr: number) => { const p = P(v1, rr), q = P(v2, rr); return 'M' + p[0] + ' ' + p[1] + ' A' + rr + ' ' + rr + ' 0 0 1 ' + q[0] + ' ' + q[1]; };
  let ticks = '';
  for (let k = 0; k <= 100; k += 10) { const p = P(k, r - 2), q = P(k, r - (k % 50 === 0 ? 13 : 8)); ticks += 'M' + p[0] + ' ' + p[1] + ' L' + q[0] + ' ' + q[1] + ' '; }
  const n = P(cl(v), r - 10), gp = P(cl(ghost === null ? v : ghost), r - 10);
  return { arc: arc(0, 100, r), red1: arc(0, dz, r - 4), red2: arc(100 - dz, 100, r - 4), ticks, nx: n[0], ny: n[1], gx: gp[0], gy: gp[1], cx: String(cx), cy: String(cy), ghostO: ghost === null ? '0' : '0.9' };
}

function tip(s: GameState) {
  if (s.gen !== 1 || s.era !== 1 || s.served >= 3) return '';
  if (s.screen === 'morning') return 'газета показує, що місто думає про ваші вчорашні рішення. Що вище ризик, то ближче ви до першої шпальти.';
  if (s.screen === 'office') return G.currentDoc(s).kind === 'scheme' ? 'що більше берете собі, то швидше росте ризик викриття. Значки під кнопкою показують, які шкали зміняться.' : 'значки під відповіддю показують, які шкали зміняться. Великий значок — сильна зміна.';
  if (s.screen === 'evening') return 'гроші, які лишаться в шухляді, заберуть при обшуку. Сховайте їх або відмийте через банк.';
  if (s.screen === 'night') return 'що вищий ризик, то частіше обшуки. Якщо шкала в червоній зоні, вона щороку сама сповзає до краю.';
  return '';
}

const STAMP: Record<G.StampKind, { t: string; c: string }> = {
  signed: { t: 'ПІДПИСАНО', c: '#8E2A1F' }, declined: { t: 'ВІДХИЛЕНО', c: '#1F1A14' }, decided: { t: 'ВИРІШЕНО', c: '#23417A' }, dark: { t: 'ВИКОНАТИ', c: '#5E1A12' }
};

/** Map Era-I palette hexes to the current era (one pass, like the generator). Skips era-native subtrees. */
function mapColors(v: any, map: Record<string, string>, skip: Set<any>): any {
  const M: Record<string, string> = {};
  for (const [k, x] of Object.entries(map)) M[k.toUpperCase()] = x;
  const walk = (x: any): any => {
    if (typeof x === 'string') return x.replace(/#[0-9A-Fa-f]{6}\b/g, (h) => M[h.toUpperCase()] || h);
    if (!x || typeof x !== 'object' || skip.has(x) || typeof x === 'function') return x;
    if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) x[i] = walk(x[i]); return x; }
    for (const k of Object.keys(x)) x[k] = walk(x[k]);
    return x;
  };
  return walk(v);
}

export function buildView(ctx: Ctx): any {
  const { s, ui, run, setUi } = ctx;
  const C = G.getEra(s.era), Cc = BASE.colors, R = C.ranks, L: any = C.theme.look;
  const str = (k: string, vars?: Record<string, string | number>) => G.str(s.era, k, vars);
  const fmt = G.fmt, fk = G.fk;
  const delta = (v: number) => (v > 0 ? '▲' + v : '▼' + -v);
  const dz = G.dangerZone(s);
  const tv = cl(s.threat), td = s.last.i || 0;
  const stage = tv < 35 ? 1 : tv < 70 ? 2 : 3;
  const screen = s.screen;
  const tipText = tip(s);
  const short = G.rankName(s) + ' ' + s.first.charAt(0) + '. ' + s.surname;
  const hatch = s.tavro ? 'repeating-linear-gradient(45deg, rgba(150,26,14,1) 0 3px, rgba(232,96,63,0.55) 3px 5px)' : 'repeating-linear-gradient(45deg, rgba(232,96,63,0.9) 0 2px, transparent 2px 5px)';

  const press = (id: string, d: Delta, fn: () => void) => { if (ui.pend === id) fn(); else setUi({ pend: id, pendD: d }); };
  const optView = (id: string, t: string, d: Delta, i: number, dark: boolean, fn: () => void, enabled = true) => {
    const armed = ui.pend === id, other = !!ui.pend && !armed, light = !dark && i === 1;
    return {
      t, pills: fxPills(d, s), armed, flex: dark ? '1 1 100%' : '1 1 40%',
      bg: dark ? '#5E1A12' : light ? '#F7F0DE' : '#1F1A14', color: light ? '#1F1A14' : '#F3E9D2',
      border: armed ? '3px solid #D9A441' : '2px solid ' + (dark ? '#3A0E08' : '#1F1A14'),
      stripBg: dark ? '#3A0E08' : light ? '#1F1A14' : '#2E261C',
      shadow: armed ? '0 6px 0 #000, 0 10px 16px rgba(0,0,0,0.5)' : light ? '0 3px 0 #1F1A14' : '0 3px 0 #000',
      lift: armed ? '-3px' : '0px', opacity: !enabled ? '0.4' : other ? '0.55' : '1', hintColor: light ? '#8E2A1F' : '#F2DFA8',
      act: () => (enabled ? press(id, d, fn) : undefined)
    };
  };

  const meter = (key: G.Meter, label: string, code: keyof Delta) => {
    const v = cl(s[key]), danger = v <= dz || v >= 100 - dz, d = s.last[code] || 0, locked = key === 'patron' && s.shadow > 0;
    return { label, val: String(v), w: v + '%', color: Cc[key], danger: danger && !locked, border: danger && !locked ? '2px solid #E8603F' : '1px solid #4A3E2E',
      hasD: locked || d !== 0, dText: locked ? 'ЗАХИСТ ' + s.shadow : d ? delta(d) : '', ic: icon(key, 28, true), dzW: dz + '%', hatch };
  };

  const v: any = {
    isForm: screen === 'form', isMorning: screen === 'morning', isOffice: screen === 'office', isEvening: screen === 'evening', isNight: screen === 'night',
    isEnding: screen === 'ending', isCampaign: screen === 'campaign', isElect: screen === 'elect', hudOn: screen !== 'form' && screen !== 'ending',
    hudOpen: ui.hudOpen, hudClosed: !ui.hudOpen, toggleHud: () => setUi({ hudOpen: !ui.hudOpen }),
    blotterTop: '112px', inkTop: '136px', hudTitle: 'СТАН СПРАВ', hudCloseText: 'Згорнути', threatLabel: 'Ризик викриття',
    tipOn: tipText !== '', tipText, yearLabel: String(s.year), nightYear: String(s.year - 1),
    plateTop: 'Рік ' + s.year + ' · Покоління ' + s.gen + ' з 2', plateName: short, fullName: s.first + ' ' + s.surname, surname: s.surname, houseUpper: s.surname.toUpperCase(),
    cleanLabel: fk(s.clean), dirtyLabel: fk(s.cash + s.floor + s.wh), icCr: icon('cr', 13), tavro: s.tavro,
    meters: [meter('patron', 'Покровит.', 'p'), meter('people', 'Народ', 'n'), meter('system', 'Система', 's')],
    threat: { w: tv + '%', valText: tv + ' / 100', hasD: td !== 0, dText: td ? delta(td) : '', border: tv >= 70 ? '2px solid #E8603F' : '1px solid #4A3E2E', ic: icon('threat', 28, true) },
    stageSegs: [1, 2, 3].map((k) => ({ bg: k <= stage ? '#E8603F' : '#3D3328' })),
    stageText: ['дрібна замітка', 'про вас пишуть', 'ВИ НА ПЕРШІЙ ШПАЛЬТІ'][stage - 1], stageColor: stage === 3 ? '#E8603F' : '#E6D9BC', circled: stage >= 2
  };

  // ---- HUD (mini + era instrument)
  const pv = screen === 'office' && ui.pend && ui.pendD ? ui.pendD : null;
  v.previewOn = !!pv; v.hudTitleShow = !pv;
  const MK = [['patron', 'p'], ['people', 'n'], ['system', 's'], ['threat', 'i']] as const;
  v.mini = MK.map(([m, k]) => {
    const x = cl(s[m]), locked = m === 'patron' && s.shadow > 0;
    if (pv) {
      const dd = locked ? 0 : pv[k] || 0, nx = cl(x + dd), tc = (dd ? tone(m, x, x + dd) : 'neu') === 'bad' ? '#E8603F' : '#66BC8E';
      return { ic: icon(m, 16), val: dd ? x + '→' + nx : String(x), color: Cc[m], border: dd ? '1.5px solid ' + tc : '1.5px solid transparent', hasD: dd !== 0, arrow: dd > 0 ? '▲' : '▼', arrowColor: tc };
    }
    const d = s.last[k] || 0, danger = m === 'threat' ? x >= 70 : (x <= dz || x >= 100 - dz) && !locked;
    return { ic: icon(m, 16), val: String(x), color: Cc[m], border: danger ? '1.5px solid #E8603F' : '1.5px solid transparent', hasD: d !== 0, arrow: d > 0 ? '▲' : '▼', arrowColor: '#E6D9BC' };
  });
  v.L = L;
  v.hudGauges = L.hud === 'gauge'; v.hudLamps = L.hud === 'lamps'; v.hudLcd = L.hud === 'lcd'; v.hudGloss = L.hud === 'gloss'; v.hudChips = L.hud === 'chips'; v.hudRings = L.hud === 'rings';
  v.hudBars = !(v.hudGauges || v.hudLamps || v.hudLcd || v.hudGloss || v.hudChips || v.hudRings);
  const meterKeys = [['patron', 'Покровит.', 'p'], ['people', 'Народ', 'n'], ['system', 'Система', 's'], ['threat', 'Ризик', 'i']] as const;
  const mrow = (m: (typeof meterKeys)[number]) => {
    const x = cl(s[m[0]]), isT = m[0] === 'threat', locked = m[0] === 'patron' && s.shadow > 0;
    const dd = pv && !locked ? pv[m[2]] || 0 : 0, nx = cl(x + dd);
    const danger = isT ? x >= 70 : (x <= dz || x >= 100 - dz) && !locked;
    return { x, dd, nx, isT, danger, tn: dd ? tone(m[0], x, x + dd) : 'neu', col: Cc[m[0]], label: m[1], key: m[0], locked };
  };
  if (v.hudGauges) {
    const Gg = L.gauge;
    v.gauges = meterKeys.map((m) => {
      const q = mrow(m), g = gauge(q.x, q.dd ? q.x + q.dd : null, 75, Gg.cy, Gg.r, Gg.a0, Gg.a1, q.isT ? 30 : dz), d = s.last[m[2]] || 0;
      const ic = icon(m[0], 14); ic.stroke = Gg.scale;
      return Object.assign(g, {
        face: Gg.face, radius: Gg.radius, shadow: Gg.shadow, scale: Gg.scale, red: Gg.red, needle: Cc[m[0]] === '#E8603F' ? '#8E1F12' : Gg.needle, hub: Gg.hub,
        labelC: Gg.labelC, valC: Gg.valC, valFont: Gg.valFont, labelGap: Gg.labelGap, ghostC: q.dd ? (q.tn === 'bad' ? '#C0392B' : '#2F7A50') : 'transparent',
        border: q.danger ? '2px solid #E8603F' : '2px solid transparent', ic, label: m[1], val: String(q.x), danger: q.danger,
        hasD: q.locked || d !== 0, dText: q.locked ? 'ЗАХИСТ ' + s.shadow : d ? delta(d) : ''
      });
    });
  }
  if (v.hudLamps) {
    const LP = L.lamp;
    v.lampRows = meterKeys.map((m) => {
      const q = mrow(m), lit = Math.round(q.x / 10), litNext = Math.round(cl(q.x + q.dd) / 10), dzN = Math.round(dz / 10);
      const lamps = Array.from({ length: 10 }, (_, k) => {
        const on = k < lit, changing = q.dd && on !== k < litNext, inDz = !q.isT && (k < dzN || k >= 10 - dzN);
        return { bg: on ? q.col : LP.off, glow: on ? '0 0 6px ' + q.col + ', inset 0 -2px 3px rgba(0,0,0,0.35)' : 'inset 0 2px 3px rgba(0,0,0,0.6)', rim: changing ? '#F0EEE8' : inDz ? LP.rimDz : LP.rim };
      });
      return { ic: icon(m[0], 18), label: q.isT ? 'БЮРО' : m[1], labelC: LP.labelC, cls: q.isT && q.x >= 50 ? 'blink' : '', lamps, val: q.dd ? q.x + '→' + q.nx : String(q.x), valC: q.col, valFont: LP.valFont, bg: LP.bg, border: q.danger ? '2px solid #E8603F' : LP.border, danger: q.danger };
    });
  }
  if (v.hudLcd) {
    v.lcdRows = meterKeys.map((m) => {
      const q = mrow(m), n = Math.round(q.x / 10), dzN = q.isT ? 3 : Math.round(dz / 10), nn = Math.round(q.nx / 10);
      const hot = q.isT ? q.x >= 70 : q.x < dz || q.x > 100 - dz;
      const cells = Array.from({ length: 10 }, (_, c) => {
        const inDz = q.isT ? c >= 10 - dzN : c < dzN || c >= 10 - dzN, on = c < n, change = q.dd && c < nn !== on;
        return { bg: change ? 'rgba(30,42,22,0.45)' : on ? (hot ? '#8A1E0E' : '#1E2A16') : inDz ? 'rgba(190,50,30,0.35)' : 'rgba(30,42,22,0.10)', bd: inDz ? '#9A2A14' : 'rgba(30,42,22,0.35)' };
      });
      return { label: m[1].toUpperCase(), bar: '', cells, val: q.dd ? q.x + '>' + q.nx : String(q.x), flag: q.danger ? '!' : '' };
    });
  }
  if (v.hudGloss) v.glossRows = meterKeys.map((m) => { const q = mrow(m); return { ic: icon(m[0], 16), label: m[1], val: q.dd ? q.x + ' → ' + q.nx : String(q.x), valC: q.dd ? (q.tn === 'bad' ? '#FF8A7A' : '#8FE3A8') : '#FFFFFF', w: q.x + '%', gw: q.nx + '%', go: q.dd ? '1' : '0', color: q.col, dzW: (q.isT ? 30 : dz) + '%', danger: q.danger }; });
  if (v.hudChips) v.chips = meterKeys.map((m) => { const q = mrow(m); return { ic: icon(m[0], 16), label: m[1], val: String(q.x), next: q.dd ? '→ ' + q.nx : '', nextC: q.tn === 'bad' ? '#FF6B5B' : '#30D158', w: q.x + '%', color: q.col, border: q.danger ? '2px solid #FF453A' : '2px solid transparent' }; });
  if (v.hudRings) {
    const C1 = 2 * Math.PI * 27, C2 = 2 * Math.PI * 33;
    v.rings = meterKeys.map((m) => { const q = mrow(m), dzv = q.isT ? 30 : dz; return { label: m[1], val: String(q.x), color: q.col, dash: ((C1 * q.x) / 100).toFixed(1) + ' 999', dz1: q.isT ? '0 999' : ((C1 * dzv) / 100).toFixed(1) + ' 999', dz2rot: String(-90 + (360 * (100 - dzv)) / 100), gdash: ((C2 * q.nx) / 100).toFixed(1) + ' 999', go: q.dd ? '1' : '0', ghostC: q.tn === 'bad' ? '#FF6B5B' : '#30D158', danger: q.danger }; });
  }
  const MI = C.meters, keys4 = ['patron', 'people', 'system', 'threat'] as const;
  const opener = (k: G.Meter) => () => setUi({ info: k });
  v.legend = keys4.map((k) => ({ ic: icon(k, 18), name: MI[k].name, short: MI[k].short, open: opener(k) }));
  v.infoOn = !!ui.info; v.closeInfo = () => setUi({ info: null });
  v.info = { ic: icon(ui.info || 'patron', 26), name: '', val: '', what: '', low: '', high: '', up: '', down: '', zone: '' };
  if (ui.info) v.info = Object.assign(v.info, MI[ui.info], { val: String(cl(s[ui.info])), zone: ui.info === 'threat' ? 'від 70 — обшуки майже щоночі.' : 'заштриховані краї шкали (' + dz + ' з кожного боку): там шкала щороку сама сповзає до краю.' });
  ['gauges', 'lampRows', 'lcdRows', 'glossRows', 'chips', 'rings'].forEach((key) => { if (v[key]) v[key].forEach((it: any, idx: number) => { it.open = opener(keys4[idx]); }); });

  // ---- morning newspaper / feed
  v.postTime = (s.served % 5) + 1 + ' год тому';
  const viral = Math.round((tv * tv) / 4 + 40);
  v.postViews = fk(viral * 37); v.postShares = fk(viral * 3); v.postComments = fk(viral);
  v.nightTitle = String(L.nightTitle || '').replace('{y}', String(s.year - 1));
  v.S = Object.assign({}, L.stamp, { hasSub: false, hasSign: false });
  if (s.era === 2) { v.S.sub = '«' + s.year + '» · вх.'; v.S.hasSub = true; }
  if (s.era === 3 || s.era === 4) { v.S.hasSign = true; v.S.sign = s.first.charAt(0) + '. ' + s.surname; }
  v.patronInitial = 'К.'; v.visaMark = ui.pend ? 'підпишіть…' : '—'; v.samizdatOn = L.samizdat && stage >= 2;

  // ---- form
  v.rollName = () => run(G.rollName);
  v.first = s.first;
  v.setFirst = (val: string) => run((x) => G.setHero(x, { first: val.slice(0, 16) }));
  v.setSurname = (val: string) => run((x) => G.setHero(x, { surname: val.slice(0, 16) }));
  v.genderOpts = ([['m', 'Пан'], ['f', 'Пані']] as const).map(([g, t]) => ({ t, mark: s.gender === g ? 'x' : '', pick: () => run((x) => G.setHero(x, { gender: g })) }));
  v.faceOpts = [0, 1, 2].map((i) => ({ src: 'art/heroes/' + s.gender + (i + 1) + '.jpg', label: 'Фото ' + (i + 1), border: s.face === i ? '3px solid #8E2A1F' : '1px solid #8C7E58', rot: ['-2deg', '1deg', '-1deg'][i], filter: s.face === i ? 'none' : 'grayscale(0.55) contrast(0.95)', pick: () => run((x) => G.setHero(x, { face: i })) }));
  v.originOpts = C.origins.map((o, i) => ({ t: s.gender === 'f' ? o.tf : o.t, d: o.d, fx: o.fx, mark: s.origin === i ? 'x' : '', bg: s.origin === i ? 'rgba(176,141,60,0.18)' : 'transparent', border: s.origin === i ? '2px solid #8E2A1F' : '1px solid #8C7E58', pick: () => run((x) => G.setHero(x, { origin: i })) }));
  v.dreamOpts = C.dreams.map((d, i) => ({ t: d.t, g: d.g, bg: s.dream === i ? '#1F1A14' : 'transparent', border: s.dream === i ? '2px solid #1F1A14' : '1px solid #8C7E58', tc: s.dream === i ? '#F3E9D2' : '#1F1A14', gc: s.dream === i ? '#D9B870' : '#5A4630', pick: () => run((x) => G.setHero(x, { dream: i })) }));
  v.signForm = () => run(G.signForm);

  // ---- morning
  const notes = [{ t: str('view.note.grain'), c: '#1F1A14' }];
  if (s.tavro) notes.unshift({ t: str('view.note.tavro', { surname: s.surname }), c: '#8E2A1F' });
  if (s.blood) notes.unshift({ t: str('view.note.quill'), c: '#8E2A1F' });
  if (s.shadow > 0) notes.push({ t: str('view.note.president'), c: '#1F1A14' });
  if (s.gender === 'f' && s.served < 2) notes.push({ t: str('view.note.letters'), c: '#1F1A14' });
  v.sideNotes = notes.slice(0, 3);
  v.issueNo = String(120 + (s.year - C.startYear) * 3);
  v.headline = s.headline; v.body = s.body;
  v.hasYest = !!(s.lastDec && screen === 'morning');
  v.yestT = s.lastDec ? s.lastDec.t : '';
  v.yestPills = s.lastDec ? fxPills(s.lastDec.d, { ...s, shadow: 0 }).filter((x) => x.text !== 'ФАТАЛЬНО') : [];
  const st = s.lastStamp ? STAMP[s.lastStamp] : null;
  v.hasStamp = !!st; v.stampT = st ? (L.stampWords || {})[st.t] || st.t : ''; v.stampC = st ? st.c : '#8E2A1F';
  const last = R.length - 1;
  const dreamProg = [fmt(s.clean) + ' з ' + fmt(G.RULES.dreamCleanGoal) + ' чистими', 'зараз ' + G.rankName(s).toLowerCase() + ', а треба ' + G.rankName(s, last).toLowerCase(), 'загроза ' + tv + ' — на відставці має бути менше 30', 'зараз ' + G.rankName(s).toLowerCase() + ', а вершина — президентство'][s.dream];
  v.dreamText = C.dreams[s.dream].t + ': ' + dreamProg + '.';
  v.toOffice = () => run(G.toOffice);

  // ---- office
  const docs = G.docsFor(s), cur = G.currentDoc(s);
  const dcFrom = cur.kind === 'scheme' ? cur.scheme.from : cur.choice.from;
  v.docLabel = s.doc + 1 + ' З ' + docs.length;
  v.pile = docs.slice(s.doc + 1).map((_, i) => ({ top: 6 + i * 5 + 'px', rot: (i % 2 ? 2.2 : -2.4) + 'deg' }));
  v.docFrom = dcFrom; v.docInitial = dcFrom.charAt(0);
  v.docHeadLine = String(L.docHead || '').replace('{from}', dcFrom).replace('{no}', String(214 + s.served * 3 + s.doc));
  v.cardNo = String(214 + s.served * 3 + s.doc);
  v.isScheme = cur.kind === 'scheme'; v.isChoice = cur.kind === 'choice';
  v.isDialog = cur.kind === 'choice' && !!cur.who; v.notDialog = !v.isDialog; v.dlgOpts = [];
  const dlgW: any = C.words.dialog;
  v.dg = { bg: '#3D3328', sil: '#1F1A14', name: '', role: '', kindLabel: '', mood: '', moodBg: '#E6D9BC', pills: [], hasBadge: false, badge: '', badgeBg: '#8E2A1F', isLetter: false, isCall: false, isChat: false, hatOn: false, hatH: '0px', say: '', gist: '', sign: '', initial: '', place: '', device: '', timer: '', glow: '#1D2A3A', accent: '#4F8BE0', status: '', app: '', chatNote: '', time1: '', time2: '', screenBg: '#0D1117', optsBg: '#0D1117', optsLabelC: '#9AA6B2', optsFont: 'inherit', replyLabel: '' };
  if (cur.kind === 'choice' && cur.who) {
    const w = cur.who, dc = cur.choice;
    let kd = '';
    if (w.kind === 'acc') {
      kd = 'acc'; const a = s.acc[w.acc];
      Object.assign(v.dg, { name: a.n, role: a.r, kindLabel: 'СПІЛЬНИК', bg: 'linear-gradient(180deg, #6B5A42, #3D3328)', sil: '#1F1A14', mood: a.l >= 60 ? 'Настрій: дружній' : a.l >= 35 ? 'Настрій: насторожений' : 'Настрій: ворожий', moodBg: a.l >= 60 ? '#9CDDB5' : a.l >= 35 ? '#F2DFA8' : '#F08A6E', pills: [pill('heart', 'вірність ' + a.l, a.l <= 30 ? 'bad' : 'neu'), pill('ear', 'знає ' + a.k, a.k >= 40 ? 'bad' : 'neu')] });
    } else if (w.kind === 'fam') {
      kd = 'kid'; const k = s.kids.concat(s.sibs).find((x) => x.id === w.id) || ({ id: 'k0', first: dc.from, g: 'm', age: 10, l: 50, k: 0 } as Kin);
      const isSib = k.id.charAt(0) === 's';
      Object.assign(v.dg, { name: k.first + ' ' + s.surname, role: (isSib ? (k.g === 'f' ? 'ваша сестра' : 'ваш брат') : k.g === 'f' ? 'ваша донька' : 'ваш син') + ' · ' + k.age + ' р.', kindLabel: 'РОДИНА', bg: k.g === 'f' ? 'linear-gradient(180deg, #E3B6C4, #7A4A5A)' : 'linear-gradient(180deg, #A9C2DE, #3E5470)', sil: k.g === 'f' ? '#3A1E28' : '#1E2A3A', mood: k.l >= 45 ? (isSib ? 'Тримається роду' : 'Любить вас') : k.l >= 25 ? 'Ображен' + (k.g === 'f' ? 'а' : 'ий') : 'Чужа людина', moodBg: k.l >= 45 ? '#9CDDB5' : k.l >= 25 ? '#F2DFA8' : '#F08A6E', pills: [pill('heart', 'вірність ' + k.l, k.l <= 30 ? 'bad' : 'neu')].concat(k.k ? [pill('ear', 'знає ' + k.k, k.k >= 40 ? 'bad' : 'neu')] : []) });
    } else if (w.kind === 'journo') {
      kd = 'journo';
      Object.assign(v.dg, { name: dc.from, role: 'хоче поставити вам кілька запитань', kindLabel: 'ЖУРНАЛІСТ', bg: 'linear-gradient(180deg, #7FAEE3, #2A3A6A)', sil: '#141C30', hasBadge: true, badge: 'ПРЕСА', badgeBg: '#8E2A1F', mood: tv >= 60 ? 'Має докази' : 'Шукає докази', moodBg: tv >= 60 ? '#F08A6E' : '#F2DFA8', pills: [pill('threat', 'ризик ' + tv, tv >= 60 ? 'bad' : 'neu')] });
    } else {
      kd = 'boss';
      Object.assign(v.dg, { name: dc.from, role: 'ваш покровитель', kindLabel: 'ПОКРОВИТЕЛЬ', bg: 'linear-gradient(180deg, #D9A441, #6E531E)', sil: '#2A1E0A', hasBadge: true, badge: '★', badgeBg: '#6E531E', mood: s.patron >= 60 ? 'Прихильний' : 'Незадоволений', moodBg: s.patron >= 60 ? '#9CDDB5' : '#F08A6E', pills: [pill('patron', 'прихильність ' + cl(s.patron), 'neu')] });
    }
    const says: Record<string, string> = { kid: 'Нам треба поговорити.', acc: 'Треба поговорити. Без свідків.', journo: 'Кілька запитань для завтрашнього номера. Коментар дасте?', boss: 'Маю до вас делікатне прохання.' };
    const g = dc.gist || dc.q.replace(/^[^«]*«/, '').replace(/»\.?$/, '');
    const hh = 20 + (s.served % 3), mm = 10 + ((s.served * 7) % 49), md = dlgW.medium;
    Object.assign(v.dg, {
      isLetter: md === 'letter', isCall: md === 'call', isChat: md === 'chat', say: dc.say || says[kd], gist: g, sign: v.dg.name, initial: v.dg.name.replace(/^(Пан|Пані|Писар) /, '').charAt(0),
      hatOn: md === 'letter' && kd !== 'journo' && kd !== 'kid', hatH: dlgW.hat || '0px', place: dlgW.place ? dlgW.place[kd] : '',
      device: kd === 'kid' && md === 'call' ? (s.era >= 5 ? 'Мобільний · дзвонить родина' : 'Домашній телефон') : dlgW.device || '', timer: '00:' + (10 + ((s.served * 13) % 49)),
      glow: dlgW.glow || '#1D2A3A', accent: dlgW.accent || '#4F8BE0', status: kd === 'journo' ? 'друкує…' : 'в мережі', app: dlgW.app || '', chatNote: dlgW.note || '', time1: hh + ':' + mm, time2: hh + ':' + (mm + 1),
      screenBg: md === 'letter' ? '#2A1A10' : md === 'chat' ? '#0E1621' : '#0D1117', optsBg: md === 'letter' ? '#2A1A10' : md === 'chat' ? '#17212B' : '#0D1117',
      optsLabelC: md === 'letter' ? '#D9B870' : '#9AA6B2', optsFont: md === 'letter' ? 'inherit' : "-apple-system, 'Segoe UI', Roboto, sans-serif", replyLabel: dlgW.reply
    });
  }
  v.q = ''; v.apOpts = []; v.opts = []; v.accNote = ''; v.gainPills = []; v.schemeOpts = [];
  if (cur.kind === 'scheme') {
    const sc = cur.scheme, accx = s.acc[sc.acc];
    v.q = G.schemeText(s, sc.q, sc.budget) + '';
    v.accNote = '20% З НЕЇ — ' + accx.n.toUpperCase();
    v.apOpts = ([0, 1, 2] as const).map((k) => ({
      pct: ['5%', '10%', '20%'][k], amt: '+' + fk(G.take(s, sc.budget, k)) + ' кр.',
      bg: s.ap === k ? '#8E2A1F' : 'transparent', color: s.ap === k ? '#F7F0DE' : '#1F1A14', border: s.ap === k ? '2px solid #5E1A12' : '1px solid #8C7E58', rot: s.ap === k ? '-1.5deg' : '0deg',
      pick: () => { run((x) => G.setAppetite(x, k)); if (ui.pend === 'sign') setUi({ pend: 'sign', pendD: G.schemeDelta(s, k) }); }
    }));
    const amt = G.take(s, sc.budget, s.ap as 0 | 1 | 2), share = Math.round((amt * 0.2) / 10) * 10;
    v.gainPills = [pill('dirty', '+' + fk(amt) + ' брудними', 'paper'), pill('share', fk(share) + ' з них — ' + accx.n, 'paper')];
    v.schemeOpts = [optView('sign', sc.yes, G.schemeDelta(s), 0, false, () => run(G.signScheme)), optView('no', sc.no.t, sc.no.d, 1, false, () => run(G.declineScheme))];
  } else {
    const dc = cur.choice, en = G.enabledOptions(s, dc.opts);
    v.q = dc.q;
    v.opts = dc.opts.map((o, i) => optView('o' + i, o.t, o.d, i, !!o.dark, () => run((x) => G.pickOption(x, i)), en[i]));
    if (v.isDialog) {
      const md = dlgW.medium;
      v.dlgOpts = v.opts.map((o: any, i: number) => {
        if (dc.opts[i].dark) return o;
        if (md === 'chat') return { ...o, bg: '#2B5278', color: '#FFFFFF', border: o.armed ? o.border : '1px solid #3A6A99', stripBg: 'rgba(0,0,0,0.25)', hintColor: '#F2DFA8' };
        if (md === 'call') return { ...o, bg: '#1E2630', color: '#E9EDF1', border: o.armed ? o.border : '1px solid #3A4654', stripBg: 'rgba(0,0,0,0.3)', hintColor: '#F2DFA8' };
        return { ...o, bg: o.bg === '#F7F0DE' ? '#E6D9BC' : o.bg };
      });
    }
  }

  // ---- evening
  v.drawerLabel = fmt(s.cash) + ' кр.';
  v.icCrBig = icon('cr', 26); v.icClean = icon('clean', 16); v.icDirty = icon('dirty', 16);
  v.genDots = [1, 2].map((k) => ({ bg: k <= s.gen ? '#1F1A14' : 'transparent' })); v.genLabel = s.gen + ' з 2';
  v.accCards = (['pike', 'dobbs', 'otto'] as const).map((k, i) => {
    const a = s.acc[k], owed = s.owed[k] || 0, pay = s.pay[k] !== false;
    return { name: a.n, role: a.r, rot: ['-1deg', '0.6deg', '-0.4deg'][i], pills: [pill('heart', String(a.l), a.l <= 30 ? 'bad' : 'paper'), pill('ear', String(a.k), a.k >= 40 ? 'bad' : 'paper')], warn: a.l <= 30 && a.k >= 35,
      owed: owed > 0, notOwed: owed === 0, amtLabel: fk(owed), payLabel: pay ? '✓ Віддаю' : '✗ Не віддаю', payBg: pay ? '#B08D3C' : '#5E1A12', payColor: pay ? '#1F1A14' : '#F3E9D2', toggle: () => run((x) => G.togglePay(x, k)) };
  });
  const LKs = G.liveKids(s);
  v.hasKids = LKs.length > 0; v.kidCols = String(Math.max(2, LKs.length));
  v.kidCostLabel = 'з чистих: ' + fk(LKs.filter((k) => s.kidPay[k.id] !== false).reduce((a, k) => a + G.allowance(k), 0));
  const stageName = (k: Kin) => ({ child: k.g === 'f' ? 'донька' : 'син', teen: 'підліт' + (k.g === 'f' ? 'ка' : 'ок'), adult: k.g === 'f' ? 'доросла донька' : 'дорослий син' })[G.kidStage(k)];
  v.kidCards = LKs.map((k) => {
    const pay = s.kidPay[k.id] !== false;
    return { name: k.first, role: stageName(k) + ' · ' + k.age + ' р.', pills: [pill('heart', String(k.l), k.l <= 30 ? 'bad' : 'paper')].concat(k.k ? [pill('ear', String(k.k), k.k >= 40 ? 'bad' : 'paper')] : []),
      mark: pay ? '✓' : '✗', cost: fk(G.allowance(k)), payBg: pay ? '#B08D3C' : '#5E1A12', payColor: pay ? '#1F1A14' : '#F3E9D2', warn: k.l <= 30, warnText: k.k >= 35 ? 'МОЖЕ ЗДАТИ' : 'МОЖЕ ПІТИ', toggle: () => run((x) => G.toggleKidPay(x, k.id)) };
  });
  v.famIc = icon('fam', 12); v.famLabel = 'Родина ' + LKs.length;
  v.albumOn = ui.album; v.openAlbum = () => setUi({ album: true }); v.closeAlbum = () => setUi({ album: false });
  const TR = C.traits, stars = (p: number) => '★★★'.slice(0, G.kidStars({ prep: p })) + '☆☆☆'.slice(0, 3 - G.kidStars({ prep: p }));
  const kinColors = (k: Kin) => ({ bg: k.gone ? '#8C8478' : k.g === 'f' ? 'linear-gradient(180deg, #E3B6C4, #7A4A5A)' : 'linear-gradient(180deg, #A9C2DE, #3E5470)', sil: k.gone ? '#4A453E' : k.g === 'f' ? '#3A1E28' : '#1E2A3A' });
  const kinPills = (k: Kin, assetTone: 'good' | 'neu') => (k.gone ? [] : [pill('heart', 'вірність ' + k.l, k.l <= 30 ? 'bad' : 'paper')].concat(k.k ? [pill('ear', 'знає ' + k.k, k.k >= 40 ? 'bad' : 'paper')] : [], k.assets ? [pill('kid', 'на ім’я ' + fk(k.assets), assetTone)] : []));
  v.albumKids = s.kids.map((k, i) => ({
    name: k.first + ' ' + s.surname, role: k.gone ? 'Втрачен' + (k.g === 'f' ? 'а' : 'ий') + ' для роду: ' + k.why : stageName(k) + ' · ' + k.age + ' р.',
    trait: k.trait === null ? (G.kidStage(k) === 'child' ? 'Ще дитина — майбутнє не визначене' : 'Ще не визнач' + (k.g === 'f' ? 'илася' : 'ився') + ', ким стати') : TR[k.trait].t + ' · ' + TR[k.trait].fx,
    stars: k.gone ? '' : stars(k.prep), pills: kinPills(k, 'good'), ...kinColors(k),
    rowBg: k.gone ? 'rgba(0,0,0,0.06)' : '#FFFDF6', rowBd: k.gone ? '#8C7E58' : '#D9C9A0', op: k.gone ? '0.6' : '1', rot: (i % 2 ? 2 : -2) + 'deg'
  }));
  v.albumSibs = s.sibs.map((k) => ({ name: k.first + ' ' + s.surname, role: k.gone ? k.why : (k.g === 'f' ? 'сестра' : 'брат') + ' · ' + k.age + ' р.', pills: kinPills(k, 'neu'), ...kinColors(k), rowBg: k.gone ? 'rgba(0,0,0,0.05)' : 'rgba(255,253,246,0.6)', rowBd: '#8C7E58', op: k.gone ? '0.6' : '1' }));
  v.hasSibs = v.albumSibs.length > 0;
  v.albumNote = s.kids.length < s.kidsMax && s.served <= 9 ? 'Родина ще може поповнитися.' : 'Більше дітей у цьому поколінні не буде.';
  const al = s.alloc, lim = G.launderLimit(s), otto = s.acc.otto, kt = G.kidStashTarget(s);
  const KW = C.words.kids;
  const cards: any[] = [
    { key: 'floor', name: str('view.stash.floor'), risk: pill('threat', 'знайдуть у 50%', 'warn'), cur: s.floor },
    { key: 'wh', name: str('view.stash.wh'), risk: otto.l >= 40 ? pill('heart', 'надійно, поки вірний', 'good') : pill('threat', str('view.stash.whRat'), 'bad'), cur: s.wh },
    { key: 'laun', name: str('view.stash.laun'), risk: pill('clean', 'стануть чистими', 'good'), cur: 0 }
  ];
  if (kt) cards.push({ key: 'kid', name: KW.stash + (kt.g === 'f' ? ' · донька ' : ' · син ') + kt.first, risk: pill('kid', 'обшук не знайде', 'good'), cur: kt.assets });
  v.stashCards = cards.map((r) => Object.assign(r, {
    ic: icon(r.key, 22), ring: Cc[r.key], add: fk(al[r.key as G.StashKey] || 0), isBank: r.key === 'laun', notBank: r.key !== 'laun',
    barW: Math.round((al.laun / lim) * 100) + '%', barText: str('view.stash.launBar', { a: fmt(al.laun), b: fmt(lim) }),
    held: fk(r.cur), hasAfter: (al[r.key as G.StashKey] || 0) > 0, after: fk(r.cur + (al[r.key as G.StashKey] || 0)), hic: icon('cr', 13), allIc: icon('into', 18),
    minus: () => run((x) => G.adjustAlloc(x, r.key, -100)), plus: () => run((x) => G.adjustAlloc(x, r.key, 100)), all: () => run((x) => G.allTo(x, r.key))
  }));
  const remain = G.unhidden(s), odds = G.raidOdds(s);
  v.remain = remain > 0
    ? { big: fk(remain), sub: 'Шанс обшуку ' + odds + '%. Усе несховане заберуть.', bg: '#2A1712', bd: '#E8603F', fg: '#F08A6E', lockBg: '#3A1A14', lockIc: icon('lockOpen', 30), lockText: 'РОЗКЛАДІТЬ ГРОШІ ↓' }
    : { big: '0 ✓', sub: 'Усе розкладено. Шанс обшуку ' + odds + '%.', bg: '#15291D', bd: '#66BC8E', fg: '#9CDDB5', lockBg: '#1E3A2A', lockIc: icon('lockShut', 30), lockText: 'УСЕ СХОВАНО' };
  v.lockLabel = remain > 0 ? 'Завершити з ризиком →' : 'Замкнути сейф ✓';
  v.lockBg = remain > 0 ? 'linear-gradient(180deg, #D8B9A0, #B08060 55%, #8A5E40)' : 'linear-gradient(180deg, #E2C374, #B8913C 55%, #9A7630)';
  v.raidOdds = odds + '%'; v.lastOpacity = s.lastAlloc ? '1' : '0.45';
  v.sameAsLast = () => run(G.sameAsLast); v.lock = () => run(G.lockSafe);

  // ---- night
  const RC = { ok: '#2F7A50', warn: '#C08A1A', bad: '#B8331E', neu: '#8C7E58' };
  v.report = s.report.map((r) => ({ t: r.t, c: RC[r.tone] || RC.neu, w: r.strong ? '700' : '400', ic: icon(r.icon || 'threat', 14) }));
  v.offers = s.offers.map((o) => ({ t: o.t, sub: o.sub, btn: o.btn, bg: o.id === 'flee' ? '#2A3A6A' : o.id === 'retire' ? '#2F5A3E' : '#8E2A1F', act: () => run((x) => G.acceptOffer(x, o.id)) }));
  v.hasOffers = v.offers.length > 0;
  v.sleep = () => run(G.sleep);

  // ---- campaign / election
  v.camp = { round: 1, chest: '0', fraudW: '0%', fraudText: '', fraudC: '#2F7A50', fraudBd: '#8C7E58', hasLog: false, log: '' };
  v.poll = []; v.campActs = []; v.electActs = []; v.elect = { title: '', bars: [] };
  if (s.camp) {
    const c = s.camp, W = C.words.campaign, total = G.totalMoney(s), others = Math.max(0, 100 - c.me - c.rival);
    v.camp = { round: Math.min(4, c.round), chest: fk(total), fraudW: c.fraud + '%', fraudText: (c.fraud < 30 ? 'низька · ' : c.fraud < 60 ? 'помітна · ' : 'висока · ') + c.fraud + '%', fraudC: c.fraud < 30 ? '#2F7A50' : c.fraud < 60 ? '#C08A1A' : '#B8331E', fraudBd: c.fraud >= 60 ? '#E8603F' : '#8C7E58', hasLog: !!c.log, log: c.log };
    v.poll = [{ name: s.first.charAt(0) + '. ' + s.surname, val: c.me + '%', w: c.me + '%', color: '#D9A441' }, { name: W.rival, val: c.rival + '%', w: c.rival + '%', color: '#7FAEE3' }, { name: 'Інші / не визначились', val: others + '%', w: others + '%', color: '#A89C84' }];
    v.campActs = G.campaignActs(s).map((a) => {
      const can = total >= a.cost, pills: any[] = [];
      if (a.cost) pills.push(pill('dirty', '−' + fk(a.cost), 'warn'));
      if (a.me) pills.push(pill('people', 'рейтинг +' + a.me, 'good'));
      if (a.rival) pills.push(pill('people', 'суперник ' + a.rival, 'good'));
      if (a.fraud) pills.push(pill('threat', 'підозра +' + a.fraud, 'bad'));
      fxPills(a.d, s).forEach((x) => pills.push(x));
      return { ...optView(a.id, a.t, a.d, a.dark ? 2 : 0, !!a.dark, () => run((x) => G.campaignAct(x, a.id)), can), pills };
    });
    const share = Math.round((c.me / (c.me + c.rival)) * 100);
    v.elect = { title: share > 50 ? 'Ви попереду: ' + share + '% у другому турі' : 'Суперник попереду: ' + (100 - share) + '%', bars: [{ name: s.first + ' ' + s.surname, val: share + '%', w: share + '%', color: '#D9A441' }, { name: W.rival, val: 100 - share + '%', w: 100 - share + '%', color: '#7FAEE3' }] };
    v.electActs = [
      { ...optView('e1', 'Чекати чесного підрахунку', {}, 0, false, () => run((x) => G.electionNight(x, false))), sub: 'Результат як є (±3%). Підозра не зростає.' },
      { ...optView('e2', 'Вкинути бюлетені', { i: 10 }, 2, true, () => run((x) => G.electionNight(x, true))), sub: '+8% голосів, але підозра +30. Шанс викриття = 60% від підозри.' }
    ];
  }

  // ---- ending / will
  const e = s.ending || ({ kind: 'collapse', title: '', text: '', inherit: 0, lost: 0, dream: false, dynastyOver: false, eraOver: false, campaignOver: false, header: '', life: '', kidAssets: 0 } as G.Ending);
  v.endHeader = e.header; v.endTitle = e.title; v.endText = e.text; v.endLife = e.life;
  v.endColor = e.kind === 'collapse' ? '#D64A30' : e.kind === 'summit' ? '#8C6A24' : '#2A3A6A';
  v.isSuccess = e.kind !== 'collapse'; v.endOutline = v.isSuccess ? '2px solid #B8913C' : '0px solid transparent'; v.trophyIc = icon('trophy', 26);
  v.successTitle = e.kind === 'summit' ? 'ВЕРШИНА ДОСЯГНУТА' : e.dream ? 'МЕТУ ЖИТТЯ ДОСЯГНУТО' : e.kind === 'flee' ? 'ВИ ВТЕКЛИ З ГРОШИМА' : 'КАР’ЄРУ ЗАВЕРШЕНО ДОСТОЙНО';
  v.successSub = e.kind === 'summit' ? 'Рід стоїть вище за закон. Нащадок — під вашим захистом.' : e.dream ? 'Спадкоємець отримує +1 000 чистими зверху.' : 'Рід зберіг ім’я та статок.';
  v.willTitle = e.eraOver ? 'ЗАПОВІТ · СПАДКОЄМЕЦЬ ВІДКРИЄ НОВУ ЕПОХУ' : v.isSuccess ? 'ЗАПОВІТ · РІД ПРОЦВІТАЄ — ОБЕРІТЬ СПАДКОЄМЦЯ' : 'ЗАПОВІТ · ОБЕРІТЬ СПАДКОЄМЦЯ';
  const Gc = { c: '#2F7A50', bg: 'rgba(47,122,80,0.10)' }, Rr = { c: '#B8331E', bg: 'rgba(184,51,30,0.09)' }, Au = { c: '#9A7420', bg: 'rgba(217,164,65,0.16)' }, Bl = { c: '#2A4F8A', bg: 'rgba(42,79,138,0.09)' }, Gr = { c: '#8C7E58', bg: 'rgba(140,126,88,0.10)' };
  const heirGets = e.inherit + (e.dream ? G.RULES.dreamBonus : 0);
  v.endTiles = [
    { label: 'РОДУ ДІСТАНЕТЬСЯ', big: fmt(heirGets), unit: 'кр.', sub: e.dream ? 'разом із +1 000 за мрію' : 'чистими грошима', c: Gc.c, bg: Gc.bg, bd: Gc.c, flex: '1.35' },
    { label: e.kind === 'flee' ? 'КИНУТО ВДОМА' : 'ВТРАЧЕНО', big: fmt(e.lost), unit: 'кр.', sub: e.lost ? 'конфіскат і схованки' : 'нічого не забрали', c: e.lost ? Rr.c : Gr.c, bg: e.lost ? Rr.bg : Gr.bg, bd: e.lost ? Rr.c : Gr.c, flex: '1' },
    { label: 'НА СЛУЖБІ', big: String(s.served), unit: 'р.', sub: e.kind === 'summit' ? 'Президент' : G.rankName(s), c: Bl.c, bg: Bl.bg, bd: Bl.c, flex: '0.9' }
  ];
  const B: any[] = [];
  const head = (t: string, k: { c: string }) => B.push({ head: true, row: false, t, c: k.c, bg: '', mark: '', v: '' });
  const row = (t: string, k: { c: string; bg: string }, mark: string, val = '') => B.push({ head: false, row: true, t, c: k.c, bg: k.bg, mark, v: val });
  head('МЕТА ЖИТТЯ', e.dream ? Au : Gr);
  row(C.dreams[s.dream].t, e.dream ? Au : Gr, e.dream ? '★' : '—', e.dream ? 'здійснено · +1 000' : 'не здійснено');
  head('СПАДКОЄМЕЦЬ ОТРИМУЄ', Bl);
  row('Чистий статок роду', Gc, '+', fmt(heirGets) + ' кр.');
  if (e.kind === 'summit') row('Захист батька-президента: Покровитель стоїть на 70', Bl, '✦', '5 років');
  if (e.kind === 'retire') row('Ім’я без плям — місто ставиться прихильно', Bl, '✓');
  if (e.kidAssets) row('Записано на дітей — конфіскація не торкнулась. Дістанеться тому, кого оберете', Gc, '✓', fmt(e.kidAssets) + ' кр.');
  if (e.kind === 'collapse' || e.kind === 'flee') {
    head('ЦІНА ПАДІННЯ', Rr);
    if (e.lost) row(e.kind === 'flee' ? 'Брудні гроші лишилися вдома' : 'Конфісковано й не знайдено', Rr, '−', fmt(e.lost) + ' кр.');
    if (e.kind === 'collapse' && !e.dynastyOver) row(str('view.tavroBullet'), Rr, '!');
  }
  if (G.liveKids(s).length > 1 && s.heirs.length) row('Інші діти лишаться в грі як брати й сестри спадкоємця — з образою', Gr, '↻');
  v.endBullets = B;
  v.showHeirs = s.heirs.length > 0;
  v.heirs = s.heirs.map((h) => ({
    rel: h.nephew ? 'ПЛЕМІННИК · ІНШИХ НЕМАЄ' : (h.g === 'f' ? 'ДОНЬКА' : 'СИН') + ' · ' + h.age + ' р.', name: h.first + ' ' + s.surname,
    trait: h.trait === null ? (h.nephew ? 'Чужий для справ роду' : 'Без особливої підготовки') : TR[h.trait].t,
    fx: h.trait === null ? (h.nephew ? 'Покровитель −10' : '—') : TR[h.trait].fx + (h.prep >= 80 ? ' · старт на посаду вище' : ''),
    stars: stars(h.prep), hasAssets: h.assets > 0, assets: '+ ' + fmt(h.assets) + ' кр. на ' + (h.g === 'f' ? 'її' : 'його') + ' ім’я',
    minor: h.age < G.RULES.heir.minorAge, minorText: 'Неповнолітн' + (h.g === 'f' ? 'я' : 'ій') + ': до повноліття опікун забере 30% статку',
    l: h.l, lc: h.l <= 30 ? '#B8331E' : '#2F7A50', pick: () => run((x) => G.pickHeir(x, h.id))
  }));
  v.eraOver = e.eraOver; v.dynastyOver = e.dynastyOver;
  v.showRestart = e.dynastyOver || e.campaignOver;
  v.restart = () => run((x) => G.restart(x));

  // ---- palette: Era I → current era (era-native values are skipped)
  const skip = new Set<any>([v.L, v.S]);
  const dgNative = { glow: v.dg.glow, accent: v.dg.accent };
  mapColors(v, C.theme.colorMap || {}, skip);
  Object.assign(v.dg, dgNative);
  return v;
}
