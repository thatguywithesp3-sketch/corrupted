import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
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

/** height of the arrangement at full size: the tallest object (the inkwell) ends here */
const NATURAL = 170;

// The props never sit on the interface. They live only in the free strip of leather between the bottom of
// the HUD and the top of the current document, measured live (the document changes height with every
// paper, hint and dialog). When the strip is short the arrangement shrinks; when it is too short to read as
// objects it is not shown at all, and the strip itself clips anything that would still reach the paper.
function useFreeBand(ref: RefObject<HTMLDivElement>) {
  const [band, setBand] = useState<{ top: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const me = ref.current, host = me?.parentElement;
    if (!me || !host) return;
    const offTop = (el: HTMLElement) => { let y = 0, e: HTMLElement | null = el; while (e && e !== host) { y += e.offsetTop; e = e.offsetParent as HTMLElement | null; } return y; };
    const measure = () => {
      const doc = host.querySelector<HTMLElement>('.m-doc-in');
      const hud = [...host.querySelectorAll<HTMLElement>('div')].find((d) => d !== me && !me.contains(d) && (d.textContent || '').startsWith('СТАН СПРАВ') && d.offsetHeight < 90);
      if (!doc) { setBand(null); return; }
      const top = hud ? offTop(hud) + hud.offsetHeight + 4 : 182;
      const h = offTop(doc) - 6 - top;
      setBand((b) => (b && b.top === top && b.h === h ? b : { top, h }));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(host);
    const mo = new MutationObserver(() => requestAnimationFrame(measure)); mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [ref]);
  return band;
}

export function DeskProps() {
  const ref = useRef<HTMLDivElement>(null);
  const band = useFreeBand(ref);
  const k = band ? Math.min(1, band.h / NATURAL) : 0;
  const show = !!band && k >= 0.5;
  return (
    <div ref={ref} aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: band ? band.top : 182, height: show ? band!.h : 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1, visibility: show ? 'visible' : 'hidden' }}>
      <style>{'@keyframes dp-glint{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}.dp-glint{animation:dp-glint 6s ease-in-out infinite}@media (prefers-reduced-motion: reduce){.dp-glint{animation:none;opacity:.5}}'}</style>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: NATURAL, transform: `scale(${k})`, transformOrigin: '50% 0' }}>
        <Obj src="art/desk/inkwell.png" x={28} y={8} w={112} rot={-4} glint={[24, 18, 0]} />
        <Obj src="art/desk/coins.png" x={166} y={60} w={92} rot={6} glint={[40, 10, 2.4]} />
        <Obj src="art/desk/stamp.png" x={282} y={4} w={78} rot={3} glint={[38, 14, 4.1]} />
      </div>
    </div>
  );
}
