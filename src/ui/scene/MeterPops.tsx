// When a decision moves the meters, the change rises off the HUD chip as a small inked number
// (+5 green when it helps, −3 red when it hurts) and fades. State indication for an occasional event.
import { useEffect, useRef, useState } from 'react';
import type { GameState, Meter } from '../../engine';

const KEYS: Meter[] = ['patron', 'people', 'system', 'threat'];
/** where each chip sits on the collapsed HUD row (390 × 844 frame) */
const AT: Record<Meter, number> = { patron: 138, people: 192, system: 246, threat: 300 };
interface Pop { id: number; m: Meter; d: number }

export function MeterPops({ s, on }: { s: GameState; on: boolean }) {
  const prev = useRef<Record<Meter, number> | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const seq = useRef(0);
  useEffect(() => {
    const now = { patron: s.patron, people: s.people, system: s.system, threat: s.threat };
    const was = prev.current; prev.current = now;
    if (!was || !on) return;
    const fresh: Pop[] = [];
    KEYS.forEach((m) => { const d = Math.round(now[m] - was[m]); if (d) fresh.push({ id: ++seq.current, m, d }); });
    if (!fresh.length) return;
    setPops((p) => [...p, ...fresh]);
    const ids = fresh.map((f) => f.id);
    const t = setTimeout(() => setPops((p) => p.filter((x) => !ids.includes(x.id))), 1300);
    return () => clearTimeout(t);
  }, [s.patron, s.people, s.system, s.threat, on]);
  if (!pops.length) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 84 }}>
      <style>{'@keyframes mp-rise{0%{opacity:0;transform:translate(-50%,6px) scale(.9)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}30%{transform:translate(-50%,-4px) scale(1)}100%{opacity:0;transform:translate(-50%,-30px)}}@media (prefers-reduced-motion: reduce){.mp-pop{animation-name:m-fade!important}}'}</style>
      {pops.map((p) => {
        const good = p.m === 'threat' ? p.d < 0 : p.d > 0;
        return (
          <span key={p.id} className="mp-pop" style={{ position: 'absolute', left: AT[p.m], top: 112, fontFamily: "'Old Standard TT', serif", fontSize: 17, fontWeight: 700, color: good ? '#8FE3A8' : '#FF8A72', textShadow: '0 1px 0 #000, 0 0 8px rgba(0,0,0,0.9)', animation: 'mp-rise 1.2s cubic-bezier(0.23, 1, 0.32, 1) both' }}>
            {p.d > 0 ? '+' : '−'}{Math.abs(p.d)}
          </span>
        );
      })}
    </div>
  );
}
