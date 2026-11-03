// Motion layer: one shared vocabulary of curves and durations for the whole game, and the few entrances
// that turn "the screen swapped" into "a thing arrived on the desk". Rules (Emil Kowalski / LottieFiles):
//   · purpose first: feedback, spatial story, state change, or bridging a jarring swap; no motion for show
//   · transform and opacity only; ease-out for things arriving, the drawer curve for sheets
//   · UI stays under ~300 ms; only rare moments (the paper of the morning, a seal) get a longer beat
//   · prefers-reduced-motion: the same moments, as a short fade, no travel
// Physical objects keep their character: paper slides and settles, a rubber stamp falls and bites.

export const MOTION_CSS = `
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-stamp: cubic-bezier(0.5, 0, 0.75, 0);
}

/* every desk object that can be pressed sinks into the desk under the finger */
.b3d { transition: transform 140ms var(--ease-out), filter 140ms var(--ease-out); -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.b3d:active { transform: translateY(2px) scale(0.985); }

/* a document arrives from the in-tray: slides down onto the pile and settles at its own angle */
@keyframes m-doc-in { from { opacity: 0; transform: translate(-10px, -48px) rotate(-3.5deg); } }
.m-doc-in { animation: m-doc-in 420ms var(--ease-out) both; }

/* the rubber stamp: falls, bites into the paper, settles */
@keyframes m-stamp {
  0% { opacity: 0; transform: scale(1.9) rotate(-11deg); }
  60% { opacity: 1; transform: scale(0.96) rotate(-4deg); }
  100% { }
}
.m-stamp { animation: m-stamp 360ms var(--ease-stamp) both; }

/* the morning paper is laid on the desk; the night report slides out of the copy book */
@keyframes m-paper-in { from { opacity: 0; transform: translateY(36px) rotate(-3deg); } }
.m-paper-in { animation: m-paper-in 520ms var(--ease-out) both; }

/* cards and dialogs over the desk */
@keyframes m-fade { from { opacity: 0; } }
@keyframes m-pop { from { opacity: 0; transform: translateY(10px) scale(0.96); } }
.m-fade { animation: m-fade 220ms var(--ease-out) both; }
.m-pop { animation: m-pop 260ms var(--ease-out) both; }

/* bottom sheets come up from the edge they live on */
@keyframes m-sheet { from { transform: translateY(100%); } }
.m-sheet { animation: m-sheet 420ms var(--ease-drawer) both; }

/* groups that arrive together: a short cascade, never blocking taps */
.m-stagger > * { animation: m-pop 300ms var(--ease-out) both; }
.m-stagger > *:nth-child(2) { animation-delay: 50ms; }
.m-stagger > *:nth-child(3) { animation-delay: 100ms; }
.m-stagger > *:nth-child(4) { animation-delay: 150ms; }
.m-stagger > *:nth-child(5) { animation-delay: 200ms; }
.m-stagger > *:nth-child(n+6) { animation-delay: 240ms; }

/* the night report: this year's mark slides over from last year's, the pencil fill grows with it */
@keyframes m-mark { from { transform: translateX(var(--from)); } }
@keyframes m-fill { from { transform: scaleX(var(--k)); } }

@media (prefers-reduced-motion: reduce) {
  [style*="m-mark"], [style*="m-fill"] { animation: none !important; }
  .b3d:active { transform: none; }
  .m-doc-in, .m-stamp, .m-paper-in, .m-pop, .m-sheet, .m-stagger > * { animation: m-fade 200ms ease both !important; }
  .pano-move, .pano-breath { animation: none !important; }
}
`;

export function injectMotion() {
  if (typeof document === 'undefined' || document.getElementById('motion-css')) return;
  const st = document.createElement('style');
  st.id = 'motion-css';
  st.textContent = MOTION_CSS;
  document.head.appendChild(st);
}
