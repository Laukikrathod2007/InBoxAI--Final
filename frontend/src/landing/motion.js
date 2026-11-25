// Small motion helpers for the landing page. One shared scroll loop, CSS
// variables instead of React re-renders, and full respect for reduced motion.
import { useEffect, useRef, useState } from 'react';

export const prefersReduced = () => typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const clamp = (v) => Math.min(1, Math.max(0, v));
const subs = new Set();
let ticking = false;

function run() {
  ticking = false;
  subs.forEach((fn) => fn());
}
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(run);
  }
}
function subscribe(fn) {
  if (!subs.size) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  subs.add(fn);
  fn();
  return () => {
    subs.delete(fn);
    if (!subs.size) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  };
}

/**
 * Writes scroll progress (0..1) to the element as the CSS variable --p.
 * mode "through": 0 when the top enters the viewport, 1 when the bottom leaves.
 * mode "pin": 0 when the top reaches the viewport top, 1 when the bottom reaches
 * the viewport bottom (use with a tall section and a sticky child).
 */
export function useScrollProgress(ref, { mode = 'through', onChange, reducedValue } = {}) {
  const cb = useRef(onChange);
  useEffect(() => { cb.current = onChange; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReduced()) {
      const v = reducedValue ?? (mode === 'pin' ? 1 : 0.5);
      el.style.setProperty('--p', String(v));
      cb.current?.(v);
      return undefined;
    }
    return subscribe(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = mode === 'pin'
        ? clamp(-r.top / Math.max(1, r.height - vh))
        : clamp((vh - r.top) / (r.height + vh));
      el.style.setProperty('--p', p.toFixed(4));
      cb.current?.(p);
    });
  }, [ref, mode, reducedValue]);
}

export function useScrolled(y = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => subscribe(() => setScrolled(window.scrollY > y)), [y]);
  return scrolled;
}

/**
 * True once the element's top has entered the viewport (or been scrolled past).
 * Uses the shared scroll loop instead of IntersectionObserver, because an
 * observer never fires for elements a jump link skips over.
 */
export function useInView(ref, { threshold = 0.2 } = {}) {
  const [inView, setInView] = useState(prefersReduced);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    let unsub = () => {};
    unsub = subscribe(() => {
      if (el.getBoundingClientRect().top < window.innerHeight * (1 - threshold)) {
        setInView(true);
        unsub();
      }
    });
    return () => unsub();
  }, [ref, threshold, inView]);
  return inView;
}

/** Mouse position as --mx / --my (-1..1) on <html>, for parallax and the mascot's eyes. */
export function usePointerVars() {
  useEffect(() => {
    if (prefersReduced()) return undefined;
    let raf = 0;
    let x = 0;
    let y = 0;
    const onMove = (e) => {
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          const s = document.documentElement.style;
          s.setProperty('--mx', x.toFixed(3));
          s.setProperty('--my', y.toFixed(3));
        });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}

export function useCountUp(from, to, run, ms = 1400) {
  const [v, setV] = useState(() => (prefersReduced() ? to : from));
  useEffect(() => {
    if (!run || prefersReduced()) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(from + (to - from) * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, run, ms]);
  return v;
}

export function useTyping(total, run, cps = 75) {
  const [n, setN] = useState(() => (prefersReduced() ? total : 0));
  useEffect(() => {
    if (!run || prefersReduced()) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(total, Math.floor(((t - t0) / 1000) * cps));
      setN(k);
      if (k < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total, run, cps]);
  return n;
}
