import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { m, LazyMotion, MotionConfig, useReducedMotion } from 'motion/react';
import { LocalRepository, type Data } from '../data/repository';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Customers } from '../features/customers/Customers';
import { CustomerDetails } from '../features/customers/CustomerDetails';
import { Orders } from '../features/orders/Orders';
import { OrderDetails } from '../features/orders/OrderDetails';
import { Wizard } from '../features/orders/Wizard';
import { Icon } from './ui';
const loadFeatures = () => import('./motionFeatures').then(module => module.default);
const repo = new LocalRepository();
const links = [{ to: '/', icon: 'home', label: 'Overview' }, { to: '/orders', icon: 'orders', label: 'Order book' }, { to: '/customers', icon: 'customers', label: 'Customers' }, { to: '/new', icon: 'plus', label: 'New order' }];
export function App() {
 const [data, setData] = useState<Data | null>(null); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
 const saving = useRef(false); const location = useLocation(); const reduced = useReducedMotion();
 useEffect(() => { repo.load().then(setData).catch(e => setError(e.message)); }, []);
 useEffect(() => { if (data) document.documentElement.dataset.theme = data.settings.theme; }, [data]);
 useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
 useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
 async function commit(next: Data) {
  if (saving.current) return false;
  saving.current = true; setError(''); setNotice('');
  try { const saved = await repo.save(next); setData(saved); setNotice('Saved on this device'); return true; }
  catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); return false; }
  finally { saving.current = false; }
 }
 if (!data) return <main className="loading"><Icon name="tape" /><h1>Smart Tailoring</h1>{error ? <p role="alert">{error}</p> : <p>Opening your order book…</p>}</main>;
 const props = { data, commit };
 const theme = () => void commit({ ...data, settings: { ...data.settings, theme: data.settings.theme === 'light' ? 'dark' : 'light' } });
 return <LazyMotion features={loadFeatures}><MotionConfig reducedMotion="user"><div className="shell">
 <aside className="rail"><Link className="brand" to="/"><span className="brand-mark"><Icon name="tape" /></span><span>Smart Tailoring<small>THE DIGITAL ATELIER</small></span></Link>
 <span className="nav-caption">WORKSPACE</span><nav aria-label="Main navigation">{links.map(l => <NavLink to={l.to} end={l.to === '/'} key={l.to}><Icon name={l.icon}/>{l.label}<span className="nav-dot" /></NavLink>)}</nav>
 <div className="rail-note"><Icon name="tape"/><h3>Made to measure.<br/>Managed with care.</h3><p>A little more order.<br/>More room for your craft.</p><div className="tape" /></div>
 <div className="rail-foot"><span className="avatar">ST</span><div><strong>Your local studio</strong><small>Synthetic demo · on this device</small></div><span className="online-dot" /></div>
 </aside><main className="main"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{location.pathname.startsWith('/new') ? 'New order' : location.pathname.startsWith('/customers') ? 'Customers' : location.pathname.startsWith('/orders') ? 'Order book' : 'Overview'}</strong></div><div className="top-actions"><span className="local-label"><span className="online-dot"/>Local demo</span><button className="theme-toggle" onClick={theme} aria-label="Switch light or dark theme"><m.span key={data.settings.theme} initial={reduced ? false : { rotate: -45, scale: .6 }} animate={{ rotate: 0, scale: 1 }}><Icon name={data.settings.theme === 'light' ? 'moon' : 'sun'} /></m.span></button><span className="avatar small-avatar">ST</span></div></header>
 <div className="content">{error && <p className="alert" role="alert">{error} <button onClick={() => window.location.reload()}>Reload data</button></p>}{notice && <m.div className="notice" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><Icon name="check"/>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></m.div>}
 <m.div key={location.pathname} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>
 <Routes><Route path="/" element={<Dashboard {...props} />} /><Route path="/new" element={<Wizard {...props} />} /><Route path="/orders" element={<Orders {...props} />} /><Route path="/orders/:orderId" element={<OrderDetails key={location.pathname} {...props} />} /><Route path="/customers" element={<Customers {...props} />} /><Route path="/customers/:customerId" element={<CustomerDetails key={location.pathname} {...props} />} /><Route path="*" element={<div className="empty-state"><h1>This page is off the pattern.</h1><Link className="primary" to="/">Return to overview</Link></div>} /></Routes>
 </m.div><footer className="page-footer"><span>SMART TAILORING <span className="footer-dot">·</span> Crafted for your everyday craft</span><span>LOCAL WORKSPACE / 02</span></footer></div></main>
 <nav className="tabbar" aria-label="Mobile navigation">{links.map(l => <NavLink to={l.to} end={l.to === '/'} key={l.to}><Icon name={l.icon}/><span>{l.label}</span></NavLink>)}</nav>
 </div></MotionConfig></LazyMotion>;
}
