import { useEffect, useRef, type ReactNode } from 'react';
export function Dialog({ title, onClose, children, drawer }: { drawer?: boolean; title: string; onClose: () => void; children: ReactNode }) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(() => { const dialog=ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
 return <dialog className={`dialog ${drawer ? 'drawer' : ''}`} ref={ref} aria-label={title} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onClose();}}} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){ const r=e.currentTarget.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) onClose(); }}}><div className="dialog-head no-print"><h2>{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></div>{children}</dialog>;
}
