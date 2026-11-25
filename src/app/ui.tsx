import { useEffect, useRef, type ReactNode } from 'react';
import { animate, m, useReducedMotion } from 'motion/react';
const paths: Record<string, ReactNode> = {
 home: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
 orders: <path d="M8 4h12v17H4V4h4M9 2h6v4H9zM8 11h8M8 16h6"/>,
 customers: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
 plus: <path d="M12 5v14M5 12h14"/>, tape: <path d="M3 7h18v10H3zM7 7v5M11 7v3M15 7v5M19 7v3"/>,
 sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/></>,
 moon: <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z"/>, arrow: <path d="M4 12h16M14 6l6 6-6 6"/>, check: <path d="m5 12 4 4L19 6"/>,
 clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, coin: <><circle cx="12" cy="12" r="9"/><path d="M8 7h8M8 10h8M10 7c6 0 6 6 0 6l5 5"/></>,
};
export function Icon({ name, className = '' }: { name: string; className?: string }) { return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.tape}</svg>; }
export function Count({ value, format = String }: { value: number; format?: (n: number) => string }) {
 const ref = useRef<HTMLSpanElement>(null); const reduced = useReducedMotion();
 useEffect(() => { if (reduced) { if (ref.current) ref.current.textContent = format(value); return; } const controls = animate(0, value, { duration: .65, onUpdate: n => { if (ref.current) ref.current.textContent = format(Math.round(n)); } }); return () => controls.stop(); }, [value, reduced, format]);
 return <span ref={ref}>{format(value)}</span>;
}
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty-state"><span className="empty-icon"><Icon name="tape" /></span><h3>{title}</h3><p>{children || 'Your next piece of work starts here.'}</p></div>; }
export function StepTransition({ children, step }: { children: ReactNode; step: number }) { const reduced = useReducedMotion(); return <m.div key={step} initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .18 }}>{children}</m.div>; }
