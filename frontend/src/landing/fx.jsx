import { useRef } from 'react';
import { prefersReduced, useInView } from './motion';

/** Fades and lifts its children in once they scroll into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children }) {
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.15 });
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** A card that tilts in 3D toward the pointer, with a soft moving highlight. */
export function Tilt({ className = '', max = 5, children }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch' || prefersReduced()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt relative ${className}`}>
      {children}
    </div>
  );
}
