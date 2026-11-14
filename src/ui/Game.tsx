// The game: engine state + UI state → view-model → era template.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as G from '../engine';
import type { GameState } from '../engine';
import { DcView, type DcNode } from './dc/DcView';
import { buildView, freshUi, type UiState } from './view/buildView';
import { MainMenu } from './MainMenu';
import { Onboarding } from './Onboarding';
import { injectTextures } from './textures';
import { injectMotion } from './motion';
import { Ledger } from './scene/Ledger';
import { NightScene } from './scene/NightScene';
import { Newspaper } from './scene/Newspaper';
import { FamilyStrip } from './scene/FamilyStrip';
import { FamilyAlbum, MeterInfo, MeterLegend } from './scene/Family';
import { WindowLight, phaseOf } from './scene/WindowLight';
import { Panorama, type PanoKind } from './scene/Panorama';
import { MeterPops } from './scene/MeterPops';
import { DeskProps } from './scene/DeskProps';
import { CityMap } from './scene/CityMap';
import { PauseFolio } from './scene/PauseFolio';
import { LOCAL_FONT_ERAS } from './fonts';

const MAP_SCREENS = new Set(['morning', 'office', 'evening']);
injectTextures();
injectMotion();
import v1 from '../data/views/era1.json';
import v2 from '../data/views/era2.json';
import v3 from '../data/views/era3.json';
import v4 from '../data/views/era4.json';
import v5 from '../data/views/era5.json';
import v6 from '../data/views/era6.json';
import v7 from '../data/views/era7.json';

interface EraView { fonts: string[]; css: string; root: DcNode }
const VIEWS = [v1, v2, v3, v4, v5, v6, v7] as unknown as EraView[];
/** Eras whose evening / night / family are hand-built React scenes plugged into the template. */
const SCENE_ERAS = new Set([1]);

/** Replace template blocks with slots for the React scenes (evening ledger, night report, HUD family rail). */
function withSlots(root: DcNode): DcNode {
  const r = JSON.parse(JSON.stringify(root)) as DcNode & { ch: DcNode[] };
  const slot = (name: string): DcNode => ({ t: 'e', n: 'dc-slot', a: { name }, ch: [] });
  const isFlexMain = (n: DcNode) => n.t === 'e' && /flex: 1/.test(n.a.style || '');
  r.ch.forEach((n) => {
    if (n.t !== 'if') return;
    if (n.v === '{{isEvening}}') n.ch = [slot('evening')];
    if (n.v === '{{isMorning}}') n.ch = [slot('morning')];
    if (n.v === '{{isNight}}' && n.ch.some(isFlexMain)) n.ch = [slot('night')];
    if (n.v === '{{hudOn}}' && n.ch.length >= 2) n.ch.splice(1, 0, slot('family'));
    if (n.v === '{{albumOn}}') n.ch = [slot('album')];
    if (n.v === '{{infoOn}}') n.ch = [slot('info')];
  });
  // the meter legend in the HUD: a React block instead of the template rows
  const legend = (n: DcNode): boolean => n.t === 'e' && n.ch.some((c) => c.t === 'e' && c.ch.some((x) => x.t === 'x' && /ЩО ОЗНАЧАЄ КОЖНА ШКАЛА/.test(x.v)));
  const swap = (n: DcNode) => { if (n.t === 'x') return; n.ch = n.ch.map((c) => (legend(c) ? slot('legend') : c)); n.ch.forEach(swap); };
  swap(r);
  // motion hooks: the document card arrives (and is keyed by the document), the stamp bites
  const mark = (n: DcNode) => {
    if (n.t === 'x') return;
    if (n.t === 'e' && /transform: rotate\(\{\{L\.docRot\}\}\)/.test(n.a.style || '')) { n.a.class = ((n.a.class || '') + ' m-doc-in').trim(); n.a['data-k'] = '{{docKey}}'; }
    if (n.t === 'if' && n.v === '{{isDialog}}') n.ch.forEach((c) => { if (c.t === 'e') { c.a.class = ((c.a.class || '') + ' m-doc-in').trim(); c.a['data-k'] = '{{docKey}}'; } });
    if (n.t === 'if' && n.v === '{{hasStamp}}') n.ch.forEach((c) => { if (c.t === 'e') { c.a.class = ((c.a.class || '') + ' m-stamp').trim(); c.a['data-k'] = '{{docKey}}'; } });
    n.ch.forEach(mark);
  };
  mark(r);
  // texture pass: every pressable object gets the material it is made of (leather, paper, brass)
  const DARK = /#1F1A14|#2E261C|#14161F|#2C2C2E|#5E1A12|#3A2A1A/i, LIGHT = /#F7F0DE|#E9E1C2|#EFE4C8|#FFFDF6|#F4EAD0/i;
  const tex = (n: DcNode) => {
    if (n.t === 'x') return;
    if (n.t === 'e' && /\bb3d\b/.test(n.a.class || '') && !/tx-/.test(n.a.class || '')) {
      const bg = (/background(?:-color)?: ([^;]+)/.exec(n.a.style || '') || [])[1] || '';
      const add = bg === '{{o.bg}}' ? '{{o.tx}}' : DARK.test(bg) ? 'tx-leather' : LIGHT.test(bg) ? 'tx-paper' : /#E2C374|#B8913C/.test(bg) ? 'tx-brass' : '';
      if (add) n.a.class = n.a.class + ' tx-auto ' + add;
    }
    n.ch.forEach(tex);
  };
  tex(r);
  // the family folio (pause menu) is its own object at the head of the HUD: a leather-bound book with brass
  // corners, set apart from the brass plaque so a thumb on the portrait or the money never opens it by mistake.
  // The year moves from the plaque into the generation line.
  const yr = (n: DcNode): boolean => n.t === 'e' && n.ch.some((c) => c.t === 'e' && c.ch.some((x) => x.t === 'x' && x.v === 'РІК'));
  const E = (n: string, style: string, ch: DcNode[] = [], a: Record<string, string> = {}): DcNode => ({ t: 'e', n, a: { style, ...a }, ch });
  const line = (top: number) => E('span', `position: absolute; left: 13px; right: 13px; top: ${top}px; height: 2.5px; border-radius: 2px; background: linear-gradient(180deg, #F2D98E, #9A7630); box-shadow: 0 1px 0 rgba(0,0,0,0.6)`);
  const corner = (pos: string, clip: string) => E('span', `position: absolute; ${pos}; width: 10px; height: 10px; background: linear-gradient(135deg, #F0D78C, #B8913C 55%, #7A5A1E); clip-path: ${clip}`);
  const folio = E('button', 'position: relative; flex-shrink: 0; width: 54px; align-self: stretch; min-height: 48px; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; font-family: inherit; color: #F0D78C; background: radial-gradient(120% 120% at 30% 0%, #6B4429 0%, #4A2D1A 55%, #2E1B0D 100%); border: 1.5px solid #1A0F07; border-radius: 4px; box-shadow: 0 3px 0 #120A04, 0 5px 9px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,220,160,0.25)', [
    E('span', 'position: absolute; inset: 3px; border: 1px dashed rgba(240,215,140,0.4); border-radius: 2px; pointer-events: none'),
    corner('top: -1px; left: -1px', 'polygon(0 0,100% 0,0 100%)'), corner('top: -1px; right: -1px', 'polygon(0 0,100% 0,100% 100%)'),
    corner('bottom: -1px; left: -1px', 'polygon(0 0,0 100%,100% 100%)'), corner('bottom: -1px; right: -1px', 'polygon(100% 0,0 100%,100% 100%)'),
    line(10), line(17), line(24),
    E('span', 'position: relative; padding-bottom: 6px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-shadow: 0 -1px 0 rgba(0,0,0,0.8)', [{ t: 'x', v: 'МЕНЮ' }])
  ], { onClick: '{{openMenu}}', 'aria-label': 'Меню · справи роду', class: 'b3d' });
  const menuize = (n: DcNode): boolean => {
    if (n.t === 'x') return false;
    const i = n.ch.findIndex((c) => c.t === 'e' && c.ch.some(yr));
    if (i >= 0) {
      const plaque = n.ch[i] as Extract<DcNode, { t: 'e' }>;
      plaque.ch = plaque.ch.filter((c) => !yr(c));
      const gen = (m: DcNode) => { if (m.t === 'x') { if (m.v === 'Покоління {{genLabel}}') m.v = '{{yearLabel}} р. · Покоління {{genLabel}}'; return; } m.ch.forEach(gen); };
      gen(plaque);
      n.ch.splice(i, 0, folio);
      return true;
    }
    return n.ch.some(menuize);
  };
  menuize(r);
  // effect pills become little enamel tokens: domed, rimmed, with a lit top edge
  const tok = (n: DcNode) => { if (n.t === 'x') return; if (n.t === 'e' && /border-radius: 11px; background: \{\{/.test(n.a.style || '')) n.a.class = ((n.a.class || '') + ' tok').trim(); n.ch.forEach(tok); };
  tok(r);
  // the blotter is real leather: a painted tile in the same engraving style, over the old dotted colour
  const blot = r.ch[0];
  if (blot && blot.t === 'if') blot.ch.forEach((c) => { if (c.t === 'e' && /tx-leather/.test(c.a.class || '')) c.a.style = (c.a.style || '').replace(/background-image: [^;]+; background-size: [^;]+;/, "background-image: linear-gradient(rgba(10,20,12,0.18), rgba(10,20,12,0.18)), url(art/desk/leather.jpg); background-size: 100% 100%, 200px 200px;"); });
  // the prototype's inkwell peeked out from under the HUD as a black circle at the right edge (the desk props replace it)
  const ink = (n: DcNode) => { if (n.t !== 'x') { n.ch = n.ch.filter((c) => !(c.t === 'e' && /top: \{\{inkTop\}\}/.test(c.a.style || ''))); n.ch.forEach(ink); } };
  ink(r);
  // the name plate: long ranks («Бургомістерка», «Прокураторка») cut the name off, so the rank gets its own small line
  const plate = (n: DcNode): boolean => {
    if (n.t === 'x') return false;
    const i = n.ch.findIndex((c) => c.t === 'e' && /white-space: nowrap/.test(c.a.style || '') && c.ch.length === 1 && c.ch[0].t === 'x' && c.ch[0].v === '{{plateName}}');
    if (i >= 0) {
      (n.ch[i] as Extract<DcNode, { t: 'e' }>).ch = [{ t: 'x', v: '{{plateWho}}' }];
      n.ch.splice(i, 0, E('span', 'font-size: 10px; font-weight: 700; letter-spacing: 1.2px; color: #4A3712; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 0 rgba(255,240,200,0.5)', [{ t: 'x', v: '{{plateRank}}' }]));
      return true;
    }
    return n.ch.some(plate);
  };
  plate(r);
  // the old "Family N" pill squeezed into the name plate
  const drop = (n: DcNode) => { if (n.t !== 'x') n.ch = n.ch.filter((c) => !(c.t === 'e' && c.a['aria-label'] === 'Родинний альбом')); if (n.t !== 'x') n.ch.forEach(drop); };
  drop(r);
  return r;
}
const SLOTTED = new Map<number, DcNode>();
const rootFor = (era: number) => {
  if (!SCENE_ERAS.has(era)) return VIEWS[era - 1].root;
  if (!SLOTTED.has(era)) SLOTTED.set(era, withSlots(VIEWS[era - 1].root));
  return SLOTTED.get(era)!;
};

const SAVE_KEY = 'corrupted.save.v1';
const W = 390, H = 844;

const newSeed = () => (Date.now() ^ (Math.random() * 1e9)) >>> 0;
function readSave(): GameState | null {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return s; } } catch { /* no storage */ }
  return null;
}

/** Inject the era's fonts and texture CSS once per era. */
function useEraAssets(era: number) {
  useEffect(() => {
    const V = VIEWS[era - 1];
    const id = 'era-assets';
    document.getElementById(id)?.remove();
    const box = document.createElement('div');
    box.id = id;
    if (!LOCAL_FONT_ERAS.has(era)) V.fonts.forEach((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; box.appendChild(l); });
    const st = document.createElement('style'); st.textContent = V.css; box.appendChild(st);
    document.head.appendChild(box);
  }, [era]);
}

/** Phone-shaped screen scaled to fit the window. */
function useFitScale() {
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const f = () => setK(Math.min(window.innerWidth / W, window.innerHeight / H));
    f(); window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return k;
}

export function Game() {
  const [s, setS] = useState<GameState>(() => readSave() || G.newGame(newSeed()));
  const [hasSave, setHasSave] = useState(() => !!readSave());
  const [mode, setMode] = useState<'menu' | 'play'>('menu');
  const [ui, setUiState] = useState<UiState>(freshUi);
  useEffect(() => { if (mode !== 'play') return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); setHasSave(true); } catch { /* ignore */ } }, [s, mode]);
  useEraAssets(s.era);
  const k = useFitScale();

  const run = useCallback((f: (x: GameState) => GameState) => {
    setS((x) => { try { return f(x); } catch (e) { console.warn(e); return x; } });
    setUiState((u) => ({ ...u, pend: null, pendD: null }));
  }, []);
  const setUi = useCallback((p: Partial<UiState>) => setUiState((u) => ({ ...u, ...p })), []);
  // the last evening, to show the year's changes on the night report
  const eve = useRef<GameState | null>(null);
  if (s.screen === 'evening') eve.current = s;
  const scenes = SCENE_ERAS.has(s.era);
  // the city between parts of the day: a panorama before the paper and before the dark ledger
  const [pano, setPano] = useState<PanoKind | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const prevScreen = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== 'play') { prevScreen.current = null; return; }
    const was = prevScreen.current; prevScreen.current = s.screen;
    if (was === s.screen) return;
    if (s.screen === 'morning') setPano('morning');
    else if (s.screen === 'evening') setPano('evening');
  }, [s.screen, mode]);
  const view = useMemo(() => {
    const v = buildView({ s, ui, run, setUi });
    v.openMenu = () => setPaused(true);
    if (scenes) v.slots = {
      morning: s.screen === 'morning' ? <Newspaper s={s} run={run} v={v} fresh={!pano} /> : null,
      evening: s.screen === 'evening' ? <Ledger key={s.year} s={s} run={run} fresh={!pano} /> : null,
      night: s.screen === 'night' ? <NightScene key={s.year} s={s} run={run} before={eve.current} /> : null,
      family: <FamilyStrip s={s} onOpen={() => setUi({ album: true })} onMap={MAP_SCREENS.has(s.screen) ? () => { if (!s.city || s.city.v !== G.CITY_V) run(G.ensureCity); setMapOpen(true); } : undefined} />,
      album: ui.album ? <FamilyAlbum s={s} onClose={() => setUi({ album: false })} /> : null,
      info: ui.info ? <MeterInfo s={s} m={ui.info} onClose={() => setUi({ info: null })} /> : null,
      legend: <MeterLegend s={s} open={(m) => setUi({ info: m })} />
    };
    return v;
  }, [s, ui, run, setUi, scenes, pano]);
  useEffect(() => { if (!MAP_SCREENS.has(s.screen)) setMapOpen(false); }, [s.screen]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0a08', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div className={'era-' + (mode === 'menu' || s.screen === 'form' ? 1 : s.era)} style={{ position: 'relative', width: W, height: H, transform: `scale(${k})`, transformOrigin: 'center', flexShrink: 0 }}>
        {mode === 'menu' ? (
          <MainMenu save={hasSave ? s : null} onContinue={() => setMode('play')} onNew={() => { try { localStorage.removeItem('corrupted.form.step'); } catch { /* no storage */ } setS(G.newGame(newSeed())); setUiState(freshUi()); setMode('play'); }} />
        ) : (
          <>
            {s.screen === 'form' ? <Onboarding s={s} run={run} /> : <DcView root={rootFor(s.era)} view={view} />}
            {scenes && s.screen === 'office' && !view.isDialog && !ui.hudOpen && !ui.album && !ui.info && !mapOpen && <DeskProps />}
            {s.screen === 'form' && <button className="b3d" aria-label="Меню" onClick={() => setPaused(true)} style={{ position: 'absolute', left: 8, top: 8, zIndex: 80, padding: '4px 8px', fontSize: 12, letterSpacing: 1.5, fontWeight: 700, fontFamily: "'Old Standard TT', serif", border: '1px solid #6E531E', borderRadius: 3, background: 'linear-gradient(180deg,#3A2A1A,#241A10)', color: '#E6D9BC', cursor: 'pointer' }}>МЕНЮ</button>}
          </>
        )}
        {mode === 'play' && scenes && s.screen !== 'form' && <WindowLight phase={phaseOf(s.screen)} />}
        {mode === 'play' && scenes && <MeterPops s={s} on={s.screen === 'office' && !ui.hudOpen} />}
        {mode === 'play' && mapOpen && s.city && <div style={{ position: 'absolute', inset: 0, zIndex: 86 }}><CityMap s={s} run={run} focus={null} onClose={() => setMapOpen(false)} /></div>}
        {mode === 'play' && paused && <PauseFolio s={s} onClose={() => setPaused(false)} onExit={() => { setPaused(false); setMode('menu'); }} />}
        {mode === 'play' && pano && <Panorama key={pano + s.year} s={s} kind={pano} onDone={() => setPano(null)} />}
        <div id="overlay-root" style={{ position: 'absolute', inset: 0, zIndex: 85, pointerEvents: 'none' }} />
        <div className="room-light" />
      </div>
    </div>
  );
}
