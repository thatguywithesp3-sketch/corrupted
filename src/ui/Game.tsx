// The game: engine state + UI state → view-model → era template.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as G from '../engine';
import type { GameState } from '../engine';
import { DcView, type DcNode } from './dc/DcView';
import { buildView, freshUi, type UiState } from './view/buildView';
import { MainMenu } from './MainMenu';
import { Onboarding } from './Onboarding';
import { injectTextures } from './textures';
import { Ledger } from './scene/Ledger';
import { NightScene } from './scene/NightScene';
import { Newspaper } from './scene/Newspaper';
import { FamilyStrip } from './scene/FamilyStrip';
import { FamilyAlbum, MeterInfo, MeterLegend } from './scene/Family';
import { WindowLight, phaseOf } from './scene/WindowLight';
import { Panorama, type PanoKind } from './scene/Panorama';
injectTextures();
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
    V.fonts.forEach((href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; box.appendChild(l); });
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
    if (scenes) v.slots = {
      morning: s.screen === 'morning' ? <Newspaper s={s} run={run} v={v} /> : null,
      evening: s.screen === 'evening' ? <Ledger key={s.year} s={s} run={run} /> : null,
      night: s.screen === 'night' ? <NightScene key={s.year} s={s} run={run} before={eve.current} /> : null,
      family: <FamilyStrip s={s} onOpen={() => setUi({ album: true })} />,
      album: ui.album ? <FamilyAlbum s={s} onClose={() => setUi({ album: false })} /> : null,
      info: ui.info ? <MeterInfo s={s} m={ui.info} onClose={() => setUi({ info: null })} /> : null,
      legend: <MeterLegend s={s} open={(m) => setUi({ info: m })} />
    };
    return v;
  }, [s, ui, run, setUi, scenes]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0a08', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div className={'era-' + (mode === 'menu' || s.screen === 'form' ? 1 : s.era)} style={{ position: 'relative', width: W, height: H, transform: `scale(${k})`, transformOrigin: 'center', flexShrink: 0 }}>
        {mode === 'menu' ? (
          <MainMenu save={hasSave ? s : null} onContinue={() => setMode('play')} onNew={() => { setS(G.newGame(newSeed())); setUiState(freshUi()); setMode('play'); }} />
        ) : (
          <>
            {s.screen === 'form' ? <Onboarding s={s} run={run} /> : <DcView root={rootFor(s.era)} view={view} />}
            <button aria-label="Головне меню" title="Головне меню" onClick={() => setMode('menu')}
              style={{ position: 'absolute', left: 2, top: 2, zIndex: 80, width: 22, height: 22, padding: 0, border: '1px solid rgba(217,184,112,0.6)', borderRadius: 4, background: 'rgba(20,14,8,0.75)', color: '#D9B870', fontSize: 13, lineHeight: '20px', cursor: 'pointer' }}>≡</button>
          </>
        )}
        {mode === 'play' && scenes && s.screen !== 'form' && <WindowLight phase={phaseOf(s.screen)} />}
        {mode === 'play' && pano && <Panorama key={pano + s.year} s={s} kind={pano} onDone={() => setPano(null)} />}
        <div id="overlay-root" style={{ position: 'absolute', inset: 0, zIndex: 85, pointerEvents: 'none' }} />
        <div className="room-light" />
      </div>
    </div>
  );
}
