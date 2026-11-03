// Shared bits for the hand-built era-I scenes (ledger, night, family strip).
import type { CSSProperties, ReactNode } from 'react';
import * as G from '../../engine';

export const INK = '#1F1A14', BLUE = '#23356A', RED = '#8E2A1F', MUTE = '#5A4630', GREEN = '#2F6A45';
export const HAND = "'Marck Script', cursive";
export const SERIF = "'Old Standard TT', serif";

const ICONS = G.getEra(1).theme.icons as Record<string, string>;

/** line icon from the era icon set (24-unit paths) */
export function Ic({ k, size = 18, color = INK, sw = 1.7 }: { k: string; size?: number; color?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={ICONS[k]} />
    </svg>
  );
}

/** chunky desk button (same family as onboarding Back / Next) */
export function DeskBtn({ children, onClick, kind = 'paper', disabled, style }: { children: ReactNode; onClick?: () => void; kind?: 'paper' | 'brass' | 'ink'; disabled?: boolean; style?: CSSProperties }) {
  const look: Record<string, CSSProperties> = {
    paper: { background: '#E9E1C2', color: INK, border: '2px solid #121216', boxShadow: '0 3px 0 #121216' },
    brass: { background: 'linear-gradient(180deg, #E2C374, #B8913C 55%, #9A7630)', color: INK, border: '2px solid #6E531E', boxShadow: '0 3px 0 #4A3812' },
    ink: { background: 'linear-gradient(180deg, #2E261C, #1F1A14)', color: '#F3E9D2', border: '2px solid #6E531E', boxShadow: '0 3px 0 #4A3812' }
  };
  return (
    <button className={'b3d ' + (kind === 'brass' ? 'tx-brass' : kind === 'ink' ? 'tx-leather' : 'tx-paper')} onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ position: 'relative', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 3, fontSize: 15, fontWeight: 700, fontFamily: SERIF, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, ...look[kind], ...style }}>
      {children}
    </button>
  );
}

/** hand-ticked box, like on the onboarding blanks */
export const Tick = ({ on, color = RED }: { on: boolean; color?: string }) => (
  <span style={{ width: 18, height: 18, flexShrink: 0, border: `1.6px solid ${INK}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: HAND, fontSize: 22, lineHeight: 1, color, background: 'rgba(255,255,255,0.35)' }}>{on ? '✓' : ''}</span>
);

/** amount written in ink */
export const Amt = ({ v, color = BLUE, size = 22, sign = '' }: { v: number; color?: string; size?: number; sign?: string }) => (
  <span style={{ fontFamily: HAND, fontSize: size, color, lineHeight: 1, whiteSpace: 'nowrap' }}>{sign}{G.fmt(v)}<span style={{ fontSize: size * 0.6, marginLeft: 3 }}>кр.</span></span>
);
