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

export function DeskProps() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 182, height: 220, pointerEvents: 'none', zIndex: 1 }}>
      <style>{'@keyframes dp-glint{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}.dp-glint{animation:dp-glint 6s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.dp-glint{animation:none;opacity:.5}}'}</style>
      <Obj src="art/desk/inkwell.png" x={28} y={44} w={112} rot={-4} glint={[24, 18, 0]} />
      <Obj src="art/desk/coins.png" x={166} y={96} w={92} rot={6} glint={[40, 10, 2.4]} />
      <Obj src="art/desk/stamp.png" x={282} y={40} w={78} rot={3} glint={[38, 14, 4.1]} />
    </div>
  );
}
