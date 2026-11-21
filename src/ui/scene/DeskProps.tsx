import { useLayoutEffect, useState } from 'react';
// The office desk is not empty: a cut-glass inkwell with a dip pen, the rubber stamp on its pad and a
// stack of crowns sit in the lamplight above the papers. Painted in the same engraving-and-tint style as the
// portraits and the city; each object stands on the leather with a hard contact shadow under it and a soft
// cast shadow thrown to the lower right, away from the lamp. Set dressing only: no taps, only a slow glint.

const Obj = ({ src, x, y, w, rot = 0, glint }: { src: string; x: number; y: number; w: number; rot?: number; glint?: [number, number, number] }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, transform: rot ? `rotate(${rot}deg)` : undefined }}>
    {/* contact shadow where the object meets the leather */}
    <span style={{ position: 'absolute', left: '8%', right: '4%', bottom: -2, height: '16%', borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.75), rgba(0,0,0,0) 70%)', transform: 'translate(4px, 2px)' }} />
    <img src={src} alt="" style={{ position: 'relative', display: 'block', width: '100%', filter: 'drop-shadow(1px 2px 1px rgba(8,4,0,0.7)) drop-shadow(9px 12px 10px rgba(8,4,0,0.55)) saturate(0.92)' }} />
    {glint && <span className="dp-glint" style={{ position: 'absolute', left: `${glint[0]}%`, top: `${glint[1]}%`, width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,246,220,0.95), rgba(255,236,190,0) 65%)', mixBlendMode: 'screen', animationDelay: `${glint[2]}s` }} />}
  </div>
);

/** where the leather shows under the folded HUD: the objects always stand here, at full size */
const DESK_TOP = 182;

// Set dressing only: the objects keep one place and one size whatever the interface does. They lie under it
// (z-index 1, under the HUD at 6 and the papers at 2), so when the HUD unfolds the forecast row or a long
// document rises, the interface simply covers them, like papers put down over an inkwell; nothing is resized
// to fit the free leather (it used to shrink the whole arrangement whenever the strip got shorter).
export function DeskProps({ props }: { props: { src: string; x: number; y: number; w: number; rot?: number; glint?: [number, number, number] }[] }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: DESK_TOP, height: 170, pointerEvents: 'none', zIndex: 1 }}>
      <style>{'@keyframes dp-glint{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}.dp-glint{animation:dp-glint 6s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.dp-glint{animation:none;opacity:.5}}'}</style>
      {props.map((p) => <Obj key={p.src} {...p} />)}
    </div>
  );
}

// Era II: before a telephonogram lands on the desk, the telephone rings — the receiver jumps on its hook twice and a
// short «дзень» rises from the bell, then the phone fades and the clerk's form takes its place. Once per document;
// with reduced motion the phone just shows for a moment.
export function PhoneRing({ k }: { k: string }) {
  const [on, setOn] = useState(true);
  useLayoutEffect(() => { setOn(true); const t = setTimeout(() => setOn(false), 1500); return () => clearTimeout(t); }, [k]);
  if (!on) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 45%, rgba(20,12,4,0.25), rgba(20,12,4,0.7))', animation: 'pr-fade 1.5s ease-in forwards' }}>
      <style>{'@keyframes pr-fade{0%{opacity:0}12%{opacity:1}75%{opacity:1}100%{opacity:0}}@keyframes pr-ring{0%,100%{transform:rotate(0)}10%{transform:rotate(-7deg) translateY(-3px)}20%{transform:rotate(6deg)}30%{transform:rotate(-5deg) translateY(-2px)}40%{transform:rotate(4deg)}50%{transform:rotate(0)}}@keyframes pr-word{0%{opacity:0;transform:translateY(6px) scale(.9)}30%{opacity:1}100%{opacity:0;transform:translateY(-18px) scale(1.05)}}@media (prefers-reduced-motion: reduce){.pr-ph,.pr-w{animation:none!important}}'}</style>
      <div style={{ position: 'relative' }}>
        <img className="pr-ph" src="art/desk/phone.png" alt="" style={{ width: 120, display: 'block', transformOrigin: '50% 90%', animation: 'pr-ring .55s ease-in-out 2', filter: 'drop-shadow(6px 10px 10px rgba(0,0,0,0.6))' }} />
        <span className="pr-w" style={{ position: 'absolute', left: -46, top: 4, fontFamily: "'Marck Script', cursive", fontSize: 26, color: '#F3E3B8', textShadow: '0 1px 2px #000', animation: 'pr-word .55s ease-out 2' }}>дзень!</span>
      </div>
    </div>
  );
}

/** the paper just closed, put aside above the next one: which document it was, the resolution on it and the stamp,
 *  all of it readable (it used to lie under the next document with only the stamp's edge showing). Every era closes a
 *  paper its own way: a stamped sheet (I–II), a carbon copy signed off (III), a fax (IV), a sent e-mail (V), a message
 *  read in the messenger (VI), a disappearing message in a secret chat (VII). */
type Slip = { bg: string; ink: string; sub: string; font: string; head: (no: number) => string; rot: number; radius: number; bubble?: boolean; foot?: string; edge?: string };
const SLIP: Record<number, Slip> = {
  1: { bg: '#EFE4C8', ink: '#2E261C', sub: '#6B5A3C', font: 'inherit', head: (no) => `Документ ${no} · закрито`, rot: -3, radius: 0 },
  3: { bg: '#E6E4DC', ink: '#2B2E3A', sub: '#5A5E6E', font: "'PT Mono', 'Courier New', monospace", head: (no) => `Копія · справа ${no}`, rot: -2.5, radius: 0, edge: 'repeating-linear-gradient(90deg, transparent 0 5px, rgba(60,70,110,0.18) 5px 6px)' },
  4: { bg: '#F2EEDD', ink: '#2A2A2A', sub: '#6A665A', font: "'Courier New', monospace", head: (no) => `ФАКС · вих. ${no}`, rot: -1.5, radius: 0, edge: 'linear-gradient(180deg, rgba(0,0,0,0.12), transparent 30%)' },
  5: { bg: '#FFFFFF', ink: '#1C2A44', sub: '#5A6A86', font: 'Tahoma, Verdana, sans-serif', head: (no) => `✉ Вихідні · лист ${no}`, rot: 0, radius: 4, foot: 'Тема:' },
  6: { bg: '#0A84FF', ink: '#FFFFFF', sub: 'rgba(255,255,255,0.75)', font: '-apple-system, system-ui, sans-serif', head: (no) => `Справа ${no} · закрито`, rot: 0, radius: 16, bubble: true, foot: '✓✓ прочитано' },
  7: { bg: '#1C1C1E', ink: '#F2F2F7', sub: '#8E8E93', font: '-apple-system, system-ui, sans-serif', head: (no) => `🔒 Справа ${no} · закрито`, rot: 0, radius: 16, bubble: true, foot: '⏱ зникне через 24 год' }
};
export function StampSlip({ era, no, answer, word, S, k, inline }: { era: number; no: number; answer: string; word: string; S: Record<string, string | boolean>; k: string; inline?: boolean }) {
  const c = SLIP[era] || SLIP[1];
  const paper = !c.bubble && era <= 4;
  const stamp = c.bubble ? (
    <span style={{ alignSelf: 'flex-start', padding: '1px 7px', borderRadius: 9, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', background: era === 7 ? 'rgba(48,209,88,0.18)' : 'rgba(255,255,255,0.22)', color: era === 7 ? '#30D158' : '#FFFFFF' }}>{word}</span>
  ) : (
    <div style={{ flexShrink: 0, minHeight: era === 5 ? undefined : 24, padding: era === 5 ? '2px 8px' : era <= 2 ? '2px 6px' : '0 7px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: era === 3 || era === 4 ? 14 : (S.radius as string), border: S.border as string, background: S.bg as string, color: S.color as string, fontSize: era === 5 ? 9 : era <= 2 ? 9.5 : 11, fontWeight: 700, letterSpacing: era === 5 ? 0.3 : era <= 2 ? 0.6 : 1.2, transform: era === 5 ? 'none' : 'rotate(-6deg)', opacity: 0.92, boxShadow: S.shadow as string, whiteSpace: 'nowrap', fontFamily: era === 5 ? c.font : 'inherit' }}>
      <span>{word}</span>
      {S.hasSub && <span style={{ fontSize: 9, letterSpacing: 1, fontWeight: 400 }}>{S.sub as string}</span>}
      {S.hasSign && <span style={{ fontSize: 9, letterSpacing: 0, fontWeight: 400, fontFamily: "'Marck Script', cursive", color: '#23417A' }}>{S.sign as string}</span>}
    </div>
  );
  return (
    <div className={(paper ? 'tx-paper ' : '') + 'm-stamp'} data-k={k} aria-label={`Документ ${no}: ${word.toLowerCase()} — ${answer}`}
      style={{ ...(inline ? { position: 'relative', flexShrink: 0, margin: c.bubble ? '0 12px 10px auto' : '0 auto 10px' } : { position: 'absolute', left: 6, top: -80 }), width: inline ? 262 : 240, minHeight: 45, display: 'flex', alignItems: 'center', gap: 8, background: c.bg, backgroundImage: c.edge, color: c.ink, fontFamily: c.font, borderRadius: c.bubble ? `${c.radius}px ${c.radius}px 4px ${c.radius}px` : c.radius, transform: `rotate(${c.rot}deg)`, boxShadow: c.bubble ? '0 3px 10px rgba(0,0,0,0.35)' : '0 4px 8px rgba(0,0,0,0.45)', border: era === 5 ? '1px solid #9DB3D6' : undefined, zIndex: 1, padding: '5px 9px', boxSizing: 'border-box', pointerEvents: 'none' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: c.bubble ? 0.3 : 0.8, color: c.sub, textTransform: c.bubble ? 'none' : 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.head(no)}</div>
        <div style={{ marginTop: 3, fontSize: 12, fontStyle: era <= 2 ? 'italic' : 'normal', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: inline ? 2 : 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.foot && era === 5 ? <span style={{ color: c.sub }}>{c.foot} </span> : null}«{answer}»</div>
        {c.bubble && <div style={{ marginTop: 2, fontSize: 9, color: c.sub, textAlign: 'right', whiteSpace: 'nowrap' }}>{c.foot}</div>}
      </div>
      {stamp}
    </div>
  );
}
