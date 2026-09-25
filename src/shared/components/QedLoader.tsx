import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';


const FADE_MS = 400;

const CSS = `
.qed-wrap {
  --qed-maroon: #7a1010;
  --qed-maroon-dim: #7a1010aa;
  --qed-ink: #3a2c2c;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Spinner. --u is the size unit (set from the size prop): 40 units wide. */
.qed-spinner {
  width: calc(40 * var(--u));
  aspect-ratio: 1;
  color: var(--qed-maroon);
  position: relative;
  background: radial-gradient(calc(10 * var(--u)), currentColor 94%, #0000);
  will-change: transform;
}
.qed-spinner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(calc(9 * var(--u)) at bottom right, #0000 94%, currentColor) top    left,
    radial-gradient(calc(9 * var(--u)) at bottom left , #0000 94%, currentColor) top    right,
    radial-gradient(calc(9 * var(--u)) at top    right, #0000 94%, currentColor) bottom left,
    radial-gradient(calc(9 * var(--u)) at top    left , #0000 94%, currentColor) bottom right;
  background-size: calc(20 * var(--u)) calc(20 * var(--u));
  background-repeat: no-repeat;
  animation: qed-l18 1.5s infinite cubic-bezier(0.3, 1, 0, 1);
}
@keyframes qed-l18 {
  33%  { inset: calc(-10 * var(--u)); transform: rotate(0deg); }
  66%  { inset: calc(-10 * var(--u)); transform: rotate(90deg); }
  100% { inset: 0;                    transform: rotate(90deg); }
}

/* Caption: 4.5s cycle = 3 spinner turns, so the words change in step. */
.qed-caption {
  position: relative;
  height: 28px;
  width: 260px;
  text-align: center;
}
.qed-caption > span {
  position: absolute;
  inset: 0;
  line-height: 28px;
  opacity: 0;
  font-size: 17px;
  font-weight: 500;
  color: var(--qed-ink);
  letter-spacing: 0.02em;
}
.qed-caption > span b { color: var(--qed-maroon); font-weight: 700; }
.qed-cap-d { letter-spacing: 0.16em; }

.qed-cap-q { animation: qed-cap-q 4.5s ease-in-out infinite; }
.qed-cap-e { animation: qed-cap-e 4.5s ease-in-out infinite; }
.qed-cap-d { animation: qed-cap-d 4.5s ease-in-out infinite; }

@keyframes qed-cap-q {
  0%, 4%    { opacity: 0; transform: translateY(6px); }
  9%, 23%   { opacity: 1; transform: translateY(0); }
  28%, 100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes qed-cap-e {
  0%, 32%   { opacity: 0; transform: translateY(6px); }
  37%, 56%  { opacity: 1; transform: translateY(0); }
  61%, 100% { opacity: 0; transform: translateY(-6px); }
}
@keyframes qed-cap-d {
  0%, 65%   { opacity: 0; transform: translateY(6px); }
  70%, 89%  { opacity: 1; transform: translateY(0); }
  94%, 100% { opacity: 0; transform: translateY(-6px); }
}

.qed-footer {
  font-size: 11px;
  letter-spacing: 0.16em;
  line-height: 14px;
  color: var(--qed-maroon-dim);
  font-weight: 600;
}

/* Centering. The block (spinner + caption + LOADING) is centered as one unit,
   which leaves the spinner itself above the middle. Its text sits 122px below
   the spinner's top edge (40 gap + 28 caption + 40 gap + 14 label), so shift the
   block down by half of that: the spinner lands exactly on the screen center. */
.qed-splash .qed-wrap,
.qed-fill .qed-wrap { transform: translateY(61px); }

.qed-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
}

/* Full-screen overlay */
.qed-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ece9e4;
  opacity: 1;
  transition: opacity ${FADE_MS}ms ease;
}
.qed-splash--hide { opacity: 0; pointer-events: none; }

@media (prefers-reduced-motion: reduce) {
  .qed-spinner::before, .qed-cap-q, .qed-cap-e, .qed-cap-d { animation: none; }
  .qed-cap-q { opacity: 1; }
}
`;

/* ------------------------------------------------------------------ */
/* Inline loader                                                       */
/* ------------------------------------------------------------------ */

export interface QedLoaderProps {
  /** Spinner width in px. Default 60. Curves stay sharp at any size. */
  size?: number;
  /**
   * Center the spinner in the middle of the screen (Suspense fallbacks, page loaders).
   * Without it the loader sits wherever you place it, like any inline element.
   */
  fill?: boolean;
}

export function QedLoader({ size = 60, fill = false }: QedLoaderProps) {
  // The soft-curve filter is sized to the spinner, so give each size its own id.
  const filterId = `qed-soft-${String(size).replace('.', '_')}`;
  const spinnerStyle = {
    '--u': `${size / 40}px`,
    filter: `url(#${filterId})`,
  } as CSSProperties;

  const loader = (
    <div className="qed-wrap" role="status" aria-live="polite" aria-label="Loading">
      <style>{CSS}</style>

      {/* Rounds every corner and smooths the edge: blur, then re-sharpen the alpha. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={(1.6 * size) / 60} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -4.5"
            />
          </filter>
        </defs>
      </svg>

      <div className="qed-spinner" style={spinnerStyle} />

      <div className="qed-caption">
        <span className="qed-cap-q"><b>Q</b>uality</span>
        <span className="qed-cap-e"><b>E</b>ducation</span>
        <span className="qed-cap-d"><b>QED</b></span>
      </div>

      <div className="qed-footer">LOADING</div>
    </div>
  );

  return fill ? <div className="qed-fill">{loader}</div> : loader;
}

/* ------------------------------------------------------------------ */
/* Full-screen splash for reloads                                      */
/* ------------------------------------------------------------------ */

export interface QedSplashProps {
  /**
   * Keep the splash up while true (e.g. `isLoading` from your auth / data hook).
   * If you leave it out, the splash waits for the browser's `load` event.
   */
  loading?: boolean;
  /** Shortest time (ms) the splash stays up, so it never just flashes. Default 1200. */
  minDuration?: number;
  /** Spinner width in px. Default 60. */
  size?: number;
}

export function QedSplash({ loading, minDuration = 1200, size }: QedSplashProps) {
  const [windowLoaded, setWindowLoaded] = useState(
    typeof document === 'undefined' || document.readyState === 'complete'
  );
  const [minElapsed, setMinElapsed] = useState(minDuration <= 0);
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');

  // Wait for the browser's load event (only used when `loading` isn't passed).
  useEffect(() => {
    if (windowLoaded) return;
    const onLoad = () => setWindowLoaded(true);
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [windowLoaded]);

  // Minimum display time.
  useEffect(() => {
    if (minDuration <= 0) return;
    const t = setTimeout(() => setMinElapsed(true), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  const ready = (loading === undefined ? windowLoaded : !loading) && minElapsed;

  // Fade out, then remove from the DOM.
  useEffect(() => {
    if (!ready) return;
    setPhase('fade');
    const t = setTimeout(() => setPhase('gone'), FADE_MS);
    return () => clearTimeout(t);
  }, [ready]);

  if (phase === 'gone') return null;

  return (
    <div className={`qed-splash${phase === 'fade' ? ' qed-splash--hide' : ''}`}>
      <QedLoader size={size} />
    </div>
  );
}

export default QedLoader;