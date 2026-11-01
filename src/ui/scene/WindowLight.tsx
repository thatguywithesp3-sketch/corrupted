// Time of day without a clock: the office window is off-screen, but its light falls on the desk.
// Morning — pale gold panes from the left; day — high, white; evening — long orange panes from the right;
// night — faint moonlight and a dark room, only the desk lamp. Changes glide between phases.
import type { Phase } from './City';

const LOOK: Record<Phase, { tf: string; color: string; op: number; dark: string }> = {
  dawn: { tf: 'translate(-40px, 160px) skewY(-14deg) scale(1.05, 0.9)', color: '#FFE2B8', op: 0.24, dark: 'rgba(40,30,60,0.10)' },
  day: { tf: 'translate(30px, 70px) skewY(-6deg) scale(1.15, 1.15)', color: '#FFF6E2', op: 0.26, dark: 'rgba(0,0,0,0)' },
  dusk: { tf: 'translate(120px, 300px) skewY(18deg) scale(1.25, 0.8)', color: '#FFB070', op: 0.2, dark: 'rgba(60,20,30,0.12)' },
  night: { tf: 'translate(150px, 120px) skewY(10deg) scale(0.9, 0.9)', color: '#9FB6E8', op: 0.14, dark: 'rgba(8,12,36,0.22)' }
};

export function WindowLight({ phase }: { phase: Phase }) {
  const L = LOOK[phase];
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 90, overflow: 'hidden' }}>
      {/* the room itself darkens towards night */}
      <div style={{ position: 'absolute', inset: 0, background: L.dark, mixBlendMode: 'multiply', transition: 'background 1.6s ease' }} />
      <svg width="390" height="844" viewBox="0 0 390 844" style={{ position: 'absolute', inset: 0, mixBlendMode: 'soft-light' }}>
        <defs>
          <filter id="wl-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
        </defs>
        <g style={{ transform: L.tf, transition: 'transform 1.6s ease, opacity 1.6s ease', opacity: L.op, transformOrigin: '0 0' }} filter="url(#wl-soft)">
          {/* four panes of the window, separated by the cross of the muntins */}
          {[[0, 0], [118, 0], [0, 150], [118, 150]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="108" height="140" fill={L.color} style={{ transition: 'fill 1.6s ease' }} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export const phaseOf = (screen: string): Phase => (screen === 'morning' ? 'dawn' : screen === 'office' ? 'day' : screen === 'evening' ? 'dusk' : screen === 'night' ? 'night' : 'day');
