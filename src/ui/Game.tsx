// The game: engine state + UI state → view-model → era template.
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import * as G from '../engine';
import type { GameState } from '../engine';
import { DcView, type DcNode } from './dc/DcView';
import { buildView, freshUi, type UiState } from './view/buildView';
import { MainMenu } from './MainMenu';
import { Onboarding } from './Onboarding';
import { injectTextures } from './textures';
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
  const view = useMemo(() => buildView({ s, ui, run, setUi }), [s, ui, run, setUi]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0a08', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div className={'era-' + (mode === 'menu' || s.screen === 'form' ? 1 : s.era)} style={{ position: 'relative', width: W, height: H, transform: `scale(${k})`, transformOrigin: 'center', flexShrink: 0 }}>
        {mode === 'menu' ? (
          <MainMenu save={hasSave ? s : null} onContinue={() => setMode('play')} onNew={() => { setS(G.newGame(newSeed())); setUiState(freshUi()); setMode('play'); }} />
        ) : (
          <>
            {s.screen === 'form' ? <Onboarding s={s} run={run} /> : <DcView root={VIEWS[s.era - 1].root} view={view} />}
            <button aria-label="Головне меню" title="Головне меню" onClick={() => setMode('menu')}
              style={{ position: 'absolute', left: 2, top: 2, zIndex: 80, width: 22, height: 22, padding: 0, border: '1px solid rgba(217,184,112,0.6)', borderRadius: 4, background: 'rgba(20,14,8,0.75)', color: '#D9B870', fontSize: 13, lineHeight: '20px', cursor: 'pointer' }}>≡</button>
          </>
        )}
      </div>
    </div>
  );
}
