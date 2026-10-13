/* Smart Tailoring - app.js
   Talks to the FastAPI backend when it is reachable. Otherwise it falls back to a
   demo mode that stores everything in this browser, so index.html also works by
   double-clicking it. */
(() => {
'use strict';

const SHOP = 'Smart Tailoring';

/* ───────────────────────── helpers ───────────────────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, cls = '') => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const fmt = (s, o = { day: 'numeric', month: 'short', year: 'numeric' }) => parse(s).toLocaleDateString('en-IN', o);
const inr = n => '\u20B9' + Math.round(n || 0).toLocaleString('en-IN');
const digits = s => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('91')) d = d.slice(2); return d; };
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const hue = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const waLink = (phone, msg) => `https://wa.me/91${digits(phone)}?text=${encodeURIComponent(msg)}`;

const ICONS = {
  home: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.7 3.5 2.6 3.5 5.6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ───────────────────────── domain config ───────────────────────── */
const GM = {
  shirt: { label: 'Shirt', blurb: 'Collar, chest and sleeves', rate: 600 },
  pant: { label: 'Pant', blurb: 'Waist, thigh and bottom', rate: 500 },
};
const FIELDS = {
  shirt: [['collar', 'Collar'], ['shoulder', 'Shoulder'], ['chest', 'Chest'], ['length', 'Length'], ['sleeve', 'Sleeve']],
  pant: [['waist', 'Waist'], ['length', 'Length'], ['thigh', 'Thigh'], ['bottom', 'Bottom']],
};
const TYPES = ['shirt', 'pant'];

const SHIRT_PATH = 'M80 28 L40 42 L6 112 L30 124 L50 92 L50 205 L150 205 L150 92 L170 124 L194 112 L160 42 L120 28 Q100 50 80 28 Z';
const PANT_PATH = 'M50 10 L150 10 L158 225 L108 225 L100 84 L92 225 L42 225 Z';
const ART = {
  shirt: `<svg viewBox="0 0 200 220" fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round" aria-hidden="true"><path d="${SHIRT_PATH}"/></svg>`,
  pant: `<svg viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="9" stroke-linejoin="round" aria-hidden="true"><path d="${PANT_PATH}"/></svg>`,
};
const MEASURE_ART = {
  shirt: `<svg viewBox="0 0 200 220" aria-hidden="true"><path class="body" d="${SHIRT_PATH}"/>
    <path class="mline" data-m="collar" d="M80 28 Q100 50 120 28"/>
    <path class="mline" data-m="shoulder" d="M40 42 L160 42"/>
    <path class="mline" data-m="chest" d="M52 98 L148 98"/>
    <path class="mline" data-m="length" d="M100 60 L100 205"/>
    <path class="mline" data-m="sleeve" d="M44 56 L18 110"/></svg>`,
  pant: `<svg viewBox="0 0 200 246" aria-hidden="true"><path class="body" d="${PANT_PATH}"/>
    <path class="mline" data-m="waist" d="M54 24 L146 24"/>
    <path class="mline" data-m="length" d="M176 10 L176 225"/>
    <path class="mline" data-m="thigh" d="M48 94 L99 94"/>
    <path class="mline" data-m="bottom" d="M42 238 L92 238"/></svg>`,
};

/* ───────────────────────── order maths (same rules as the server) ───────────────────────── */
function derive(o) {
  o.total = o.items.reduce((s, i) => s + i.qty * i.rate, 0);
  o.paid = o.payments.reduce((s, p) => s + p.amount, 0);
  o.balance = Math.max(o.total - o.paid, 0);
  o.code = 'ST-' + String(o.id).padStart(4, '0');
  o.state = o.status === 'completed' ? 'completed' : (o.due_date < today() ? 'overdue' : 'pending');
  return o;
}

/* ───────────────────────── data layer: demo (browser) ───────────────────────── */
function seedDemo() {
  const t = today();
  const d = n => addDays(t, n);
  const shirtA = { collar: 15.5, shoulder: 17.5, chest: 40, length: 29, sleeve: 25 };
  const shirtB = { collar: 15, shoulder: 17, chest: 38.5, length: 28.5, sleeve: 24.5 };
  const shirtC = { collar: 14.5, shoulder: 16.5, chest: 36, length: 27.5, sleeve: 23.5 };
  const shirtD = { collar: 16, shoulder: 18, chest: 42, length: 30, sleeve: 25.5 };
  const shirtOld = { collar: 15, shoulder: 17.5, chest: 39, length: 29, sleeve: 25 };
  const pantA = { waist: 34, length: 41, thigh: 23, bottom: 16 };
  const pantB = { waist: 32, length: 40, thigh: 22, bottom: 15.5 };
  const pantC = { waist: 30, length: 38, thigh: 21, bottom: 15 };
  const pantD = { waist: 28, length: 37, thigh: 20, bottom: 14.5 };
  const customers = [
    ['Rohit Patil', '9822012345'], ['Sneha Jadhav', '9890123456'], ['Amit Deshmukh', '9765432109'],
    ['Pooja Kulkarni', '9921098765'], ['Vikram More', '9604455667'], ['Neha Shinde', '9370011223'],
  ].map(([name, phone], i) => ({ id: i + 1, name, phone, created_at: d(-60) }));
  const sh = (qty, rate) => ({ type: 'shirt', qty, rate });
  const pa = (qty, rate) => ({ type: 'pant', qty, rate });
  const pay = (amount, n, note) => ({ amount, date: d(n), note });
  const rows = [
    [1, -9, -2, [sh(2, 650), pa(1, 550)], { shirt: shirtA, pant: pantA }, [pay(800, -9, 'Advance')], 'pending', 'Navy cotton shirts, white lining'],
    [2, -3, 2, [sh(1, 700)], { shirt: shirtC }, [pay(300, -3, 'Advance')], 'pending', 'Slim fit, full sleeves'],
    [3, -5, 0, [pa(2, 600)], { pant: pantB }, [pay(600, -5, 'Advance')], 'pending', 'Charcoal formal trousers'],
    [4, -1, 6, [sh(3, 600), pa(3, 500)], { shirt: shirtB, pant: pantC }, [pay(1500, -1, 'Advance')], 'pending', 'School uniform set'],
    [5, -14, -4, [sh(2, 650)], { shirt: shirtD }, [pay(1300, -4, 'Paid in full')], 'completed', ''],
    [6, -2, 11, [sh(1, 680), pa(1, 520)], { shirt: shirtC, pant: pantD }, [], 'pending', 'Wedding function, careful finishing'],
    [1, -60, -50, [sh(1, 600)], { shirt: shirtOld }, [pay(600, -50, 'Paid in full')], 'completed', ''],
  ];
  const orders = rows.map(([cid, od, dd, items, measurements, payments, status, notes], i) => ({
    id: i + 1, customer_id: cid, order_date: d(od), due_date: d(dd), status, items,
    fabric_notes: notes, measurements, payments,
    completed_at: status === 'completed' ? d(dd) : null, created_at: d(od),
  }));
  return { customers, orders };
}

const Local = {
  KEY: 'smart-tailoring-demo-v1',
  users: { admin: ['admin123', 'Admin'], tailor: ['tailor123', 'Tailor'] },
  mem: null, // in-memory copy is the source of truth; localStorage only persists it
  load() {
    if (!this.mem) {
      let db = null;
      try { db = JSON.parse(localStorage.getItem(this.KEY)); } catch (_) { /* storage blocked */ }
      if (!db) db = seedDemo();
      this.mem = db;
      this.save(db);
    }
    return this.mem;
  },
  save(db) {
    this.mem = db;
    try { localStorage.setItem(this.KEY, JSON.stringify(db)); } catch (_) { /* storage full or blocked: keep working in memory */ }
  },
  shape(db, o) {
    const c = db.customers.find(x => x.id === o.customer_id) || { name: 'Unknown', phone: '' };
    return derive({ ...JSON.parse(JSON.stringify(o)), customer_name: c.name, customer_phone: c.phone });
  },
  async login(username, password) {
    const u = this.users[username];
    if (!u || u[0] !== password) throw new Error('Wrong username or password');
    return { token: 'demo', user: { username, name: u[1] } };
  },
  async orders() {
    const db = this.load();
    return db.orders.map(o => this.shape(db, o)).sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id);
  },
  async create(p) {
    const db = this.load();
    const phone = digits(p.customer.phone);
    let c = db.customers.find(x => x.phone === phone);
    if (c) c.name = p.customer.name;
    else { c = { id: Math.max(0, ...db.customers.map(x => x.id)) + 1, name: p.customer.name, phone, created_at: today() }; db.customers.push(c); }
    const id = Math.max(0, ...db.orders.map(x => x.id)) + 1;
    const o = {
      id, customer_id: c.id, order_date: p.order_date, due_date: p.due_date, status: 'pending',
      items: p.items, fabric_notes: p.fabric_notes || '', measurements: p.measurements,
      payments: p.advance > 0 ? [{ amount: p.advance, date: p.order_date, note: 'Advance' }] : [],
      completed_at: null, created_at: today(),
    };
    db.orders.push(o); this.save(db);
    return this.shape(db, o);
  },
  find(db, id) { const o = db.orders.find(x => x.id === id); if (!o) throw new Error('Order not found'); return o; },
  async patch(id, b) {
    const db = this.load(); const o = this.find(db, id);
    if (b.due_date) { if (b.due_date < o.order_date) throw new Error('Delivery date cannot be before the order date'); o.due_date = b.due_date; }
    if (typeof b.fabric_notes === 'string') o.fabric_notes = b.fabric_notes.trim();
    if (b.status) { o.status = b.status; o.completed_at = b.status === 'completed' ? today() : null; }
    this.save(db); return this.shape(db, o);
  },
  async pay(id, b) {
    const db = this.load(); const o = this.find(db, id);
    const bal = this.shape(db, o).balance;
    if (b.amount > bal + 0.001) throw new Error(`That is more than the balance of ${inr(bal)}`);
    o.payments.push({ amount: b.amount, date: today(), note: (b.note || '').trim() || 'Payment' });
    this.save(db); return this.shape(db, o);
  },
  async remove(id) {
    const db = this.load(); this.find(db, id);
    db.orders = db.orders.filter(x => x.id !== id);
    db.customers = db.customers.filter(c => db.orders.some(o => o.customer_id === c.id));
    this.save(db);
  },
};

/* ───────────────────────── data layer: server ───────────────────────── */
const Remote = {
  async req(method, path, body) {
    let res;
    try {
      res = await fetch('/api' + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(S.session ? { Authorization: 'Bearer ' + S.session.token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (_) { throw new Error('Cannot reach the shop server. Check the connection and try again'); }
    if (res.status === 401 && S.session) { signOut(true); throw new Error('Your session has ended. Sign in again'); }
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(typeof e.detail === 'string' ? e.detail : 'Something went wrong. Try again'); }
    return res.status === 204 ? null : res.json();
  },
  login: (username, password) => Remote.req('POST', '/login', { username, password }),
  orders: () => Remote.req('GET', '/orders'),
  create: b => Remote.req('POST', '/orders', b),
  patch: (id, b) => Remote.req('PATCH', `/orders/${id}`, b),
  pay: (id, b) => Remote.req('POST', `/orders/${id}/payments`, b),
  remove: id => Remote.req('DELETE', `/orders/${id}`),
};

/* ───────────────────────── state ───────────────────────── */
const S = { api: Local, mode: 'demo', session: null, orders: [], filter: 'all', q: '', cq: '', route: 'dashboard', firstLoad: true };
let draft = null;
let layers = [];

async function detectApi() {
  if (location.protocol === 'file:') return { api: Local, mode: 'demo' };
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 2000);
    const r = await fetch('/api/health', { signal: ctl.signal });
    clearTimeout(timer);
    if (r.ok && (await r.json()).ok) return { api: Remote, mode: 'server' };
  } catch (_) { /* fall through to demo */ }
  return { api: Local, mode: 'demo' };
}

async function refresh() {
  S.orders = await S.api.orders();
  const late = S.orders.filter(o => o.state === 'overdue').length;
  const b = $('#badge-overdue');
  b.hidden = !late; b.textContent = late;
}

/* ───────────────────────── customers (derived from orders) ───────────────────────── */
function customersList() {
  const map = new Map();
  for (const o of S.orders) {
    let c = map.get(o.customer_id);
    if (!c) { c = { id: o.customer_id, name: o.customer_name, phone: o.customer_phone, orders: [] }; map.set(o.customer_id, c); }
    c.orders.push(o);
  }
  return [...map.values()].map(c => {
    c.orders.sort((a, b) => b.order_date.localeCompare(a.order_date) || b.id - a.id);
    c.owed = c.orders.reduce((s, o) => s + o.balance, 0);
    c.spent = c.orders.reduce((s, o) => s + o.paid, 0);
    c.last = c.orders[0].order_date;
    return c;
  }).sort((a, b) => b.last.localeCompare(a.last));
}
function latestMeasure(c, type) {
  for (const o of c.orders) {
    const m = o.measurements && o.measurements[type];
    if (m && Object.keys(m).length) {
      const item = o.items.find(i => i.type === type);
      return { values: m, date: o.order_date, rate: item ? item.rate : null };
    }
  }
  return null;
}

/* ───────────────────────── UI utilities ───────────────────────── */
function toast(msg, kind = '') {
  const t = el('div', 'toast ' + kind);
  t.innerHTML = (kind === 'error' ? ic('x') : ic('check')) + `<span>${esc(msg)}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3200);
}

function modal(inner, cls = '', onClose) {
  const root = $('#layer-root');
  const scrim = el('div', 'scrim');
  const box = el('div', 'dlg ' + cls);
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = inner;
  root.append(scrim, box);
  requestAnimationFrame(() => { scrim.classList.add('open'); box.classList.add('open'); });
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    layers = layers.filter(f => f !== close);
    scrim.classList.remove('open'); box.classList.remove('open');
    setTimeout(() => { scrim.remove(); box.remove(); }, 260);
    if (onClose) onClose();
  };
  layers.push(close);
  scrim.addEventListener('click', close);
  return { box, close };
}

function dialog({ title, html = '', ok = 'Confirm', cancel = 'Cancel', danger = false }) {
  return new Promise(resolve => {
    let settled = false;
    const { box, close } = modal(
      `<h3>${esc(title)}</h3><div class="dlg-body">${html}</div>
       <div class="dlg-actions"><button class="btn btn-ghost" data-r="0">${esc(cancel)}</button>
       <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}" data-r="1">${esc(ok)}</button></div>`,
      '', () => { if (!settled) { settled = true; resolve({ ok: false }); } });
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      if (b.dataset.r === '1') {
        const values = {};
        $$('[name]', box).forEach(n => { values[n.name] = n.type === 'checkbox' ? n.checked : n.value; });
        settled = true; resolve({ ok: true, values });
      }
      close();
    });
    const first = $('input,button[data-r="1"]', box); if (first) first.focus();
  });
}

function setHead(title, sub = '') {
  $('#title').textContent = title;
  $('#subtitle').textContent = sub;
  document.title = `${title} - ${SHOP}`;
}

function countUp(root) {
  $$('[data-count]', root).forEach(n => {
    const target = Number(n.dataset.count), money = n.hasAttribute('data-money');
    const show = v => { n.textContent = money ? inr(v) : Math.round(v); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !target) { show(target); return; }
    const start = performance.now(), dur = 900;
    const tick = now => {
      const p = clamp((now - start) / dur, 0, 1);
      show(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function numberTape(node) {
  const n = Math.ceil(node.parentElement.clientWidth / 40) + 2;
  node.innerHTML = Array.from({ length: n }, (_, i) => `<span style="left:${i * 40 + 5}px">${i}</span>`).join('');
}

const dueText = o => {
  if (o.status === 'completed') return 'Delivered';
  const d = diffDays(today(), o.due_date);
  if (d < 0) return `Overdue by ${plural(-d, 'day')}`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `${d} days left`;
};

function orderRow(o, i = 0) {
  const d = parse(o.due_date);
  const span = Math.max(1, diffDays(o.order_date, o.due_date));
  const pct = o.status === 'completed' ? 100 : clamp(Math.round(diffDays(o.order_date, today()) / span * 100), 4, 100);
  const chips = o.items.map(it => `<span class="chip">${plural(it.qty, GM[it.type].label.toLowerCase())}</span>`).join('');
  return `<div class="orow" role="button" tabindex="0" data-open="${o.id}" style="--i:${i}">
    <div class="dtag ${o.state}"><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-IN', { month: 'short' })}</small></div>
    <div class="obody">
      <div class="otop"><strong>${esc(o.customer_name)}</strong><span class="code">${o.code}</span></div>
      <div class="ochips">${chips}</div>
      <div class="tbar ${o.state}"><i style="width:${pct}%"></i></div>
    </div>
    <div class="oside">
      <span class="pill ${o.state}">${dueText(o)}</span>
      ${o.balance > 0 ? `<span class="owed num">${inr(o.balance)} to collect</span>` : '<span class="owed ok">Paid in full</span>'}
    </div></div>`;
}

const avatar = (name, cls = '') => `<span class="avatar ${cls}" style="--h:${hue(name)}">${esc(initials(name))}</span>`;

/* ───────────────────────── router ───────────────────────── */
const routes = { dashboard: renderDashboard, new: renderNew, orders: renderOrders, customers: renderCustomers, customer: renderCustomer };

function route(keepScroll = false) {
  const [name, arg] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
  const fn = routes[name] || renderDashboard;
  S.route = routes[name] ? name : 'dashboard';
  const navName = S.route === 'customer' ? 'customers' : S.route;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === navName));
  const v = $('#view');
  v.classList.remove('swap'); void v.offsetWidth; v.classList.add('swap');
  fn(arg);
  if (!keepScroll) window.scrollTo(0, 0);
}
function go(name) {
  const target = '#/' + name;
  if (location.hash === target) route(); else location.hash = target;
}
window.addEventListener('hashchange', () => { if (S.session) route(); });

/* ───────────────────────── dashboard ───────────────────────── */
function renderDashboard() {
  const hr = new Date().getHours();
  const name = S.session.user.name;
  const open = S.orders.filter(o => o.status !== 'completed');
  const overdue = open.filter(o => o.state === 'overdue');
  const soon = open.filter(o => { const d = diffDays(today(), o.due_date); return d >= 0 && d <= 3; });
  const owed = S.orders.reduce((s, o) => s + o.balance, 0);
  const collected = S.orders.reduce((s, o) => s + o.paid, 0);
  const frac = owed + collected ? collected / (owed + collected) : 0;
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  setHead(`${greet}, ${name}`, fmt(today(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  if (!S.orders.length) {
    $('#view').innerHTML = `<div class="empty"><h3>The order book is empty</h3><p>Take a customer's measurements to create the first order.</p><a class="btn btn-tape" href="#/new">${ic('plus')} New order</a></div>`;
    return;
  }

  const next = open.slice().sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i));
  const counts = days.map(d => open.filter(o => o.due_date === d).length);
  const max = Math.max(1, overdue.length, ...counts);
  const label = (d, i) => i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmt(d, { weekday: 'short', day: 'numeric' });

  $('#view').innerHTML = `
    <section class="card ledger" aria-label="Summary">
      <div><small>Open orders</small><b class="num" data-count="${open.length}">0</b></div>
      <div><small>Due in 3 days</small><b class="num" data-count="${soon.length}">0</b></div>
      <div class="${overdue.length ? 'bad' : ''}"><small>Overdue</small><b class="num" data-count="${overdue.length}">0</b></div>
      <div><small>Balance to collect</small><b class="num" data-count="${owed}" data-money>0</b></div>
    </section>
    <div class="dash ${S.firstLoad ? 'first-load' : ''}">
      <section class="card">
        <div class="card-h"><h2>Next to deliver</h2><a class="btn btn-ghost btn-sm" href="#/orders">All orders</a></div>
        ${next.length ? next.map((o, i) => orderRow(o, i)).join('') : '<div class="empty" style="margin:12px 20px 20px;border-width:1.5px"><h3>Nothing waiting</h3><p>Every order has been delivered.</p></div>'}
      </section>
      <div class="stack">
        <section class="card">
          <div class="card-h"><h2>This week</h2></div>
          <div class="week" id="week">
            ${overdue.length ? `<div class="wk late"><span>Past due</span><div class="bar"><i data-w="${overdue.length / max * 100}"></i></div><b class="num">${overdue.length}</b></div>` : ''}
            ${days.map((d, i) => `<div class="wk"><span>${label(d, i)}</span><div class="bar"><i data-w="${counts[i] / max * 100}"></i></div><b class="num">${counts[i]}</b></div>`).join('')}
          </div>
        </section>
        <section class="card">
          <div class="card-h"><h2>Money</h2></div>
          <div class="money">
            <svg class="donut" viewBox="0 0 100 100" role="img" aria-label="${Math.round(frac * 100)} percent collected">
              <circle class="track" cx="50" cy="50" r="42"/>
              <circle class="arc" id="arc" cx="50" cy="50" r="42" stroke-dasharray="263.9" stroke-dashoffset="263.9" transform="rotate(-90 50 50)"/>
              <text x="50" y="56" text-anchor="middle">${Math.round(frac * 100)}%</text>
            </svg>
            <div class="legend">
              <div><span class="dot"></span>Collected<b class="num">${inr(collected)}</b></div>
              <div><span class="dot rest"></span>Still to collect<b class="num">${inr(owed)}</b></div>
            </div>
          </div>
        </section>
      </div>
    </div>`;
  const root = $('#view');
  countUp(root);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('#week i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; });
    const arc = $('#arc'); if (arc) arc.style.strokeDashoffset = 263.9 * (1 - frac);
  }));
  S.firstLoad = false;
}

/* ───────────────────────── new order wizard ───────────────────────── */
const STEP_NAMES = ['Customer', 'Garments', 'Measurements', 'Due date and bill'];

function freshDraft() {
  const t = today();
  return {
    customer: { name: '', phone: '' }, order_date: t, due_date: addDays(t, 7),
    items: { shirt: { on: true, qty: 1, rate: GM.shirt.rate }, pant: { on: false, qty: 1, rate: GM.pant.rate } },
    fabric_notes: '', measurements: { shirt: {}, pant: {} }, prefilled: { shirt: null, pant: null },
    advance: '', step: 0, appliedFor: null,
  };
}

function startNew(cust) {
  draft = freshDraft();
  if (cust) {
    draft.customer = { name: cust.name, phone: cust.phone };
    applyKnown(cust);
    draft.step = 1;
  }
  go('new');
}

function knownCustomer() {
  const p = digits(draft.customer.phone);
  return p.length === 10 ? customersList().find(c => c.phone === p) : null;
}

function applyKnown(k) {
  for (const t of TYPES) {
    const L = latestMeasure(k, t);
    if (L) { draft.measurements[t] = { ...L.values }; draft.prefilled[t] = L.date; if (L.rate) draft.items[t].rate = L.rate; }
    else { draft.measurements[t] = {}; draft.prefilled[t] = null; }
  }
  const last = k.orders[0];
  TYPES.forEach(t => { draft.items[t].on = last.items.some(i => i.type === t); });
  if (!TYPES.some(t => draft.items[t].on)) draft.items.shirt.on = true;
  draft.appliedFor = k.id;
}

function renderNew() {
  if (!draft) draft = freshDraft();
  setHead('New order', 'Four quick steps: customer, garments, measurements, bill');
  $('#view').innerHTML = `<div class="wiz">
    <div class="tape-progress" aria-hidden="true"><div class="tape-fill" id="tfill"></div></div>
    <ol class="wsteps" id="wsteps">${STEP_NAMES.map((n, i) => `<li><button type="button" data-step="${i}"><b>${i + 1}</b><span>${n}</span></button></li>`).join('')}</ol>
    <div class="wcard"><div id="wbody"></div></div>
    <div class="wnav">
      <button class="btn btn-ghost" id="wback">${ic('arrowL')} Back</button>
      <button class="linkbtn" id="wdiscard" type="button">Discard draft</button>
      <button class="btn btn-tape" id="wnext" type="button">Next</button>
    </div></div>`;
  bindWizard();
  paintStep(0, true);
}

function paintStep(dir, first = false) {
  const body = $('#wbody');
  const steps = [stepCustomer, stepGarments, stepMeasure, stepBill];
  body.innerHTML = steps[draft.step]();
  body.className = dir > 0 ? 'slide-r' : dir < 0 ? 'slide-l' : '';
  $$('#wsteps li').forEach((li, i) => {
    li.classList.toggle('done', i < draft.step);
    li.classList.toggle('now', i === draft.step);
    $('button', li).disabled = i > draft.step;
  });
  const fillTo = `${(draft.step + 1) / STEP_NAMES.length * 100}%`;
  if (first) requestAnimationFrame(() => requestAnimationFrame(() => { $('#tfill').style.width = fillTo; }));
  else $('#tfill').style.width = fillTo;
  $('#wback').style.visibility = draft.step === 0 ? 'hidden' : 'visible';
  const next = $('#wnext');
  next.textContent = draft.step === 3 ? 'Save order' : 'Next';
  if (draft.step === 0) { drawSuggest(); drawKnown(); }
  if (draft.step === 2) {
    $$('#wbody .mline').forEach(l => { const p = l.closest('.mpanel'); const v = draft.measurements[p.dataset.panel][l.dataset.m]; if (v > 0) l.classList.add('set'); });
  }
  if (draft.step === 3) { drawBill(); dueNote(); }
}

function bindWizard() {
  const body = $('#wbody');
  $('#wnext').addEventListener('click', async () => {
    if (!validateStep()) return;
    if (draft.step === 3) { saveDraft(); return; }
    draft.step++; paintStep(1); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#wback').addEventListener('click', () => { if (draft.step > 0) { draft.step--; paintStep(-1); } });
  $('#wsteps').addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return;
    const i = Number(b.dataset.step);
    if (i < draft.step) { const dir = -1; draft.step = i; paintStep(dir); }
  });
  $('#wdiscard').addEventListener('click', async () => {
    const r = await dialog({ title: 'Discard this draft?', html: '<p>The customer, garments and measurements you entered will be cleared.</p>', ok: 'Discard draft', danger: true });
    if (r.ok) { draft = freshDraft(); renderNew(); }
  });

  body.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'f-phone' || t.id === 'f-name') {
      if (t.id === 'f-phone') { const d = t.value.replace(/[^\d+\s]/g, ''); if (d !== t.value) t.value = d; }
      draft.customer.phone = $('#f-phone').value.trim();
      draft.customer.name = $('#f-name').value;
      t.classList.remove('invalid');
      onCustomerChange();
    } else if (t.id === 'f-notes') draft.fabric_notes = t.value;
    else if (t.id && t.id.startsWith('r-')) { t.value = t.value.replace(/\D/g, '').slice(0, 6); draft.items[t.id.slice(2)].rate = Number(t.value) || 0; if (draft.step === 3) drawBill(); }
    else if (t.dataset.t && t.dataset.k) {
      const v = t.value === '' ? '' : Number(t.value);
      draft.measurements[t.dataset.t][t.dataset.k] = v;
      const line = $(`.mpanel[data-panel="${t.dataset.t}"] [data-m="${t.dataset.k}"]`);
      if (line) line.classList.toggle('set', v > 0);
      t.classList.remove('invalid');
    } else if (t.id === 'f-due') { draft.due_date = t.value; t.classList.remove('invalid'); dueNote(); }
    else if (t.id === 'f-adv') { draft.advance = t.value.replace(/\D/g, '').slice(0, 7); t.value = draft.advance; t.classList.remove('invalid'); drawBill(); }
  });

  body.addEventListener('focusin', e => {
    const t = e.target; if (!t.dataset.t) return;
    const panel = t.closest('.mpanel');
    $$('.mline', panel).forEach(l => l.classList.toggle('on', l.dataset.m === t.dataset.k));
  });
  body.addEventListener('focusout', e => { if (e.target.dataset.t) $$('.mline.on', body).forEach(l => l.classList.remove('on')); });

  body.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pick) {
      const k = customersList().find(c => c.id === Number(b.dataset.pick)); if (!k) return;
      $('#f-phone').value = k.phone; $('#f-name').value = k.name;
      draft.customer = { name: k.name, phone: k.phone };
      onCustomerChange();
    } else if (b.dataset.toggle) {
      const t = b.dataset.toggle, card = b.closest('.gcard');
      const others = TYPES.filter(x => x !== t && draft.items[x].on).length;
      if (draft.items[t].on && !others) { toast('Keep at least one garment on the order', 'error'); return; }
      draft.items[t].on = !draft.items[t].on;
      card.classList.toggle('on', draft.items[t].on);
      b.setAttribute('aria-pressed', draft.items[t].on);
    } else if (b.dataset.inc || b.dataset.dec) {
      const t = b.dataset.inc || b.dataset.dec;
      draft.items[t].qty = clamp(draft.items[t].qty + (b.dataset.inc ? 1 : -1), 1, 50);
      $(`#q-${t}`).textContent = draft.items[t].qty;
    } else if (b.dataset.q) {
      draft.due_date = addDays(draft.order_date, Number(b.dataset.q));
      $('#f-due').value = draft.due_date; dueNote();
    }
  });
}

function onCustomerChange() {
  const k = knownCustomer();
  if (k && draft.appliedFor !== k.id) {
    applyKnown(k);
    const nameBox = $('#f-name');
    if (nameBox && !nameBox.value.trim()) { nameBox.value = k.name; draft.customer.name = k.name; }
  } else if (!k && draft.appliedFor) {
    draft.appliedFor = null; draft.measurements = { shirt: {}, pant: {} }; draft.prefilled = { shirt: null, pant: null };
  }
  drawSuggest(); drawKnown();
}

function stepCustomer() {
  const c = draft.customer;
  return `<h2>Who is this order for?</h2>
    <p class="lead">Enter a phone number or a name. Returning customers bring their saved measurements with them.</p>
    <div class="grid2">
      <div class="field"><label for="f-phone">Phone number</label><input id="f-phone" class="input num" inputmode="tel" autocomplete="off" maxlength="14" placeholder="10-digit mobile number" value="${esc(c.phone)}"></div>
      <div class="field"><label for="f-name">Customer name</label><input id="f-name" class="input" autocomplete="off" placeholder="Full name" value="${esc(c.name)}"></div>
    </div>
    <div class="suggest" id="suggest"></div><div id="known"></div>`;
}
function drawSuggest() {
  const box = $('#suggest'); if (!box) return;
  const pd = digits(draft.customer.phone), qn = draft.customer.name.trim().toLowerCase();
  const exact = knownCustomer();
  const list = exact ? [] : customersList().filter(k => (pd.length >= 3 && k.phone.includes(pd)) || (qn.length >= 2 && k.name.toLowerCase().includes(qn))).slice(0, 4);
  box.innerHTML = list.map(k => `<button type="button" class="sg" data-pick="${k.id}">${avatar(k.name)}<span><b>${esc(k.name)}</b><small>${esc(k.phone)}, ${plural(k.orders.length, 'order')}, last visit ${fmt(k.last, { day: 'numeric', month: 'short' })}</small></span></button>`).join('');
}
function drawKnown() {
  const box = $('#known'); if (!box) return;
  const k = knownCustomer();
  box.innerHTML = k ? `<div class="known">${ic('check')}<div><b>Welcome back, ${esc(k.name)}.</b><div class="muted">${plural(k.orders.length, 'earlier order')}. Saved measurements and rates will be filled in for you.</div></div></div>` : '';
}

function stepGarments() {
  const card = t => {
    const it = draft.items[t];
    return `<div class="gcard ${it.on ? 'on' : ''}">
      <button type="button" class="gtoggle" data-toggle="${t}" aria-pressed="${it.on}">
        <span class="gart">${ART[t]}</span>
        <span class="gtext"><b>${GM[t].label}</b><small>${GM[t].blurb}</small></span>
        <span class="gcheck">${ic('check')}</span>
      </button>
      <div class="gcontrols"><div class="gc-inner">
        <div class="field"><label>Quantity</label><div class="stepper"><button type="button" data-dec="${t}" aria-label="One fewer ${t}">\u2212</button><output id="q-${t}" class="num">${it.qty}</output><button type="button" data-inc="${t}" aria-label="One more ${t}">+</button></div></div>
        <div class="field"><label for="r-${t}">Stitching rate for each</label><div class="unit-input pre"><span>\u20B9</span><input id="r-${t}" class="input num" inputmode="numeric" value="${it.rate}"></div></div>
      </div></div></div>`;
  };
  return `<h2>What are we stitching?</h2>
    <p class="lead">Choose a shirt, a pant, or both. A matching set is a single order.</p>
    <div class="gpair">${card('shirt')}${card('pant')}</div>
    <div class="field" style="margin-top:22px"><label for="f-notes">Fabric and stitching notes</label>
      <textarea id="f-notes" class="input" rows="3" placeholder="Fabric colour, collar style, pleats, anything the cutter should know">${esc(draft.fabric_notes)}</textarea></div>`;
}

function stepMeasure() {
  const types = TYPES.filter(t => draft.items[t].on);
  const panel = t => {
    const m = draft.measurements[t], pre = draft.prefilled[t];
    return `<section class="mpanel" data-panel="${t}">
      <div class="mart">${MEASURE_ART[t]}</div>
      <div>
        <div class="mhead"><h3>${GM[t].label}</h3>${pre ? `<span class="chip chip-tape">Loaded from ${fmt(pre, { day: 'numeric', month: 'short', year: 'numeric' })}. Change what has shifted.</span>` : ''}</div>
        <div class="mfields">${FIELDS[t].map(([k, l]) => `
          <div class="field"><label for="m-${t}-${k}">${l}</label>
            <div class="unit-input"><input id="m-${t}-${k}" class="input num" type="number" inputmode="decimal" step="0.25" min="0" max="99" data-t="${t}" data-k="${k}" value="${m[k] ?? ''}"><span>in</span></div></div>`).join('')}
        </div></div></section>`;
  };
  return `<h2>Take the measurements</h2>
    <p class="lead">All values are in inches. The red line on the garment shows the measurement you are entering, and it turns green once filled.</p>
    ${types.map(panel).join('')}`;
}

function stepBill() {
  return `<h2>Due date and bill</h2>
    <div class="billgrid">
      <div>
        <div class="field"><label for="f-due">Promised delivery date</label><input id="f-due" class="input" type="date" min="${draft.order_date}" value="${draft.due_date}"></div>
        <div class="qchips">${[[3, '3 days'], [7, '1 week'], [10, '10 days'], [14, '2 weeks']].map(([n, l]) => `<button type="button" class="chip chip-btn" data-q="${n}">${l}</button>`).join('')}</div>
        <p class="due-note" id="due-note"></p>
      </div>
      <div class="billbox">
        <div id="bill-lines" style="display:grid;gap:8px"></div>
        <div class="line total"><span>Total</span><span class="num" id="b-total"></span></div>
        <div class="field"><label for="f-adv">Advance received today</label><div class="unit-input pre"><span>\u20B9</span><input id="f-adv" class="input num" inputmode="numeric" placeholder="0" value="${esc(draft.advance)}"></div></div>
        <div class="line bal" id="b-balrow"><span>Balance</span><b class="num" id="b-bal"></b></div>
      </div>
    </div>`;
}
const draftTotal = () => TYPES.filter(t => draft.items[t].on).reduce((s, t) => s + draft.items[t].qty * (Number(draft.items[t].rate) || 0), 0);
function drawBill() {
  const lines = TYPES.filter(t => draft.items[t].on).map(t => {
    const it = draft.items[t];
    return `<div class="line"><span>${plural(it.qty, GM[t].label.toLowerCase())} at ${inr(it.rate)}</span><b class="num">${inr(it.qty * it.rate)}</b></div>`;
  }).join('');
  const total = draftTotal(), adv = Number(draft.advance) || 0;
  $('#bill-lines').innerHTML = lines;
  $('#b-total').textContent = inr(total);
  const bal = Math.max(total - adv, 0);
  $('#b-bal').textContent = inr(bal);
  $('#b-balrow').classList.toggle('zero', bal === 0);
}
function dueNote() {
  const n = $('#due-note'); if (!n) return;
  const d = diffDays(today(), draft.due_date);
  const rel = d < 0 ? 'in the past' : d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`;
  n.textContent = `Ready ${fmt(draft.due_date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${rel}.`;
  $$('.chip-btn', $('#wbody')).forEach(c => c.classList.toggle('active', draft.due_date === addDays(draft.order_date, Number(c.dataset.q))));
}

function validateStep() {
  const bad = (node, msg) => { if (node) { node.classList.add('invalid'); node.focus(); } toast(msg, 'error'); return false; };
  if (draft.step === 0) {
    if (draft.customer.name.trim().length < 2) return bad($('#f-name'), 'Enter the customer\u2019s name');
    if (digits(draft.customer.phone).length !== 10) return bad($('#f-phone'), 'Enter a 10-digit phone number');
  }
  if (draft.step === 1) {
    for (const t of TYPES.filter(x => draft.items[x].on)) {
      if (!(draft.items[t].rate >= 0) || draft.items[t].rate === '') return bad($(`#r-${t}`), `Enter the ${t} stitching rate`);
    }
  }
  if (draft.step === 2) {
    for (const t of TYPES.filter(x => draft.items[x].on)) {
      for (const [k, l] of FIELDS[t]) {
        const v = draft.measurements[t][k];
        if (!(v > 0 && v < 100)) return bad($(`#m-${t}-${k}`), `Add the ${t} ${l.toLowerCase()} measurement`);
      }
    }
  }
  if (draft.step === 3) {
    if (!draft.due_date || draft.due_date < draft.order_date) return bad($('#f-due'), 'Pick a delivery date from today onwards');
    if ((Number(draft.advance) || 0) > draftTotal()) return bad($('#f-adv'), 'The advance is more than the order total');
  }
  return true;
}

async function saveDraft() {
  const btn = $('#wnext'); btn.disabled = true; btn.classList.add('busy');
  try {
    const items = TYPES.filter(t => draft.items[t].on).map(t => ({ type: t, qty: draft.items[t].qty, rate: Number(draft.items[t].rate) || 0 }));
    const measurements = {};
    items.forEach(i => { measurements[i.type] = Object.fromEntries(FIELDS[i.type].map(([k]) => [k, Number(draft.measurements[i.type][k])])); });
    const o = await S.api.create({
      customer: { name: draft.customer.name.trim().replace(/\s+/g, ' '), phone: digits(draft.customer.phone) },
      order_date: draft.order_date, due_date: draft.due_date, items,
      fabric_notes: draft.fabric_notes.trim(), measurements, advance: Number(draft.advance) || 0,
    });
    await refresh();
    draft = null;
    paintSaved(o);
  } catch (e) {
    toast(e.message, 'error'); btn.disabled = false; btn.classList.remove('busy');
  }
}

function paintSaved(o) {
  setHead('Order saved', '');
  const items = o.items.map(i => plural(i.qty, GM[i.type].label.toLowerCase())).join(' and ');
  const msg = `Hello ${o.customer_name}, your order ${o.code} (${items}) is booked at ${SHOP}. Delivery date: ${fmt(o.due_date, { day: 'numeric', month: 'long', year: 'numeric' })}. Advance received: ${inr(o.paid)}. Balance: ${inr(o.balance)}. Thank you!`;
  $('#view').innerHTML = `<div class="saved">
    <svg class="stitch-check" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26"/><path d="M19 31l8 8 15-17"/></svg>
    <h2>${o.code} is saved</h2>
    <p class="muted">${esc(o.customer_name)} gets ${items} on ${fmt(o.due_date, { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
    <div class="saved-actions">
      <button class="btn btn-primary" data-receipt="${o.id}">${ic('receipt')} Print receipt</button>
      <a class="btn btn-ghost" target="_blank" rel="noopener" href="${waLink(o.customer_phone, msg)}">${ic('chat')} Confirm on WhatsApp</a>
      <button class="btn btn-ghost" data-open="${o.id}">View order</button>
      <a class="btn btn-tape" href="#/new" data-fresh>${ic('plus')} New order</a>
    </div></div>`;
}

/* ───────────────────────── orders timeline ───────────────────────── */
function renderOrders() {
  setHead('Orders', 'Every order on one timeline, soonest delivery first');
  const count = k => k === 'all' ? S.orders.length : S.orders.filter(o => o.state === k).length;
  const filters = [['all', 'All'], ['pending', 'On schedule'], ['overdue', 'Overdue'], ['completed', 'Delivered']];
  $('#view').innerHTML = `
    <div class="toolbar">
      <div class="search">${ic('search')}<input id="oq" class="input" type="search" placeholder="Search by name, phone or order number" value="${esc(S.q)}" aria-label="Search orders"></div>
      <div class="chips-row" id="ofilters">${filters.map(([k, l]) => `<button class="chip chip-btn ${S.filter === k ? 'active' : ''}" data-f="${k}">${l} ${count(k)}</button>`).join('')}</div>
    </div><div id="tl"></div>`;
  $('#oq').addEventListener('input', e => { S.q = e.target.value; drawTimeline(); });
  $('#ofilters').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    S.filter = b.dataset.f;
    $$('#ofilters .chip-btn').forEach(c => c.classList.toggle('active', c.dataset.f === S.filter));
    drawTimeline();
  });
  drawTimeline();
}
function drawTimeline() {
  const q = S.q.trim().toLowerCase(), qd = q.replace(/\D/g, '');
  const list = S.orders.filter(o => (S.filter === 'all' || o.state === S.filter) &&
    (!q || o.customer_name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) || (qd && o.customer_phone.includes(qd))));
  const byDue = (a, b) => a.due_date.localeCompare(b.due_date);
  const groups = [
    ['overdue', 'Overdue', list.filter(o => o.state === 'overdue').sort(byDue)],
    ['soon', 'Due in the next 7 days', list.filter(o => o.state === 'pending' && diffDays(today(), o.due_date) <= 7).sort(byDue)],
    ['later', 'Later', list.filter(o => o.state === 'pending' && diffDays(today(), o.due_date) > 7).sort(byDue)],
    ['done', 'Delivered', list.filter(o => o.state === 'completed').sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))],
  ].filter(g => g[2].length);
  $('#tl').innerHTML = groups.length ? `<div class="tl">${groups.map(([k, title, rows]) => `
    <section class="tl-group"><h2 class="tl-head ${k}">${title}<small>${rows.length}</small></h2>
      <div class="card tl-card">${rows.map(o => orderRow(o)).join('')}</div></section>`).join('')}</div>`
    : `<div class="empty"><h3>${S.orders.length ? 'No orders match' : 'No orders yet'}</h3><p>${S.orders.length ? 'Try a different name, phone number or filter.' : 'Create the first order to see it here.'}</p></div>`;
}

/* ───────────────────────── customers ───────────────────────── */
function renderCustomers() {
  setHead('Customers', 'Everyone you have measured, with their history');
  $('#view').innerHTML = `<div class="toolbar"><div class="search">${ic('search')}<input id="cq" class="input" type="search" placeholder="Search by name or phone" value="${esc(S.cq)}" aria-label="Search customers"></div></div><div id="cgrid"></div>`;
  $('#cq').addEventListener('input', e => { S.cq = e.target.value; drawCustomers(); });
  drawCustomers();
}
function drawCustomers() {
  const q = S.cq.trim().toLowerCase(), qd = q.replace(/\D/g, '');
  const list = customersList().filter(c => !q || c.name.toLowerCase().includes(q) || (qd && c.phone.includes(qd)));
  $('#cgrid').innerHTML = list.length ? `<div class="cgrid">${list.map(c => `
    <button class="card ccard" data-cust="${c.id}">
      <div class="chead">${avatar(c.name)}<div><b>${esc(c.name)}</b><small class="num">${esc(c.phone)}</small></div></div>
      <div class="cmeta"><span class="chip">${plural(c.orders.length, 'order')}</span><span class="chip">Last visit ${fmt(c.last, { day: 'numeric', month: 'short' })}</span>${c.owed > 0 ? `<span class="chip owes">${inr(c.owed)} due</span>` : ''}</div>
    </button>`).join('')}</div>`
    : `<div class="empty"><h3>${S.cq ? 'No customer found' : 'No customers yet'}</h3><p>${S.cq ? 'Check the spelling or search by phone number.' : 'Customers appear here after their first order.'}</p></div>`;
}

function renderCustomer(id) {
  const c = customersList().find(x => x.id === Number(id));
  if (!c) { setHead('Customer not found'); $('#view').innerHTML = `<div class="empty"><h3>That customer is not in the book</h3><a class="btn btn-ghost" href="#/customers">Back to customers</a></div>`; return; }
  setHead(c.name, `${plural(c.orders.length, 'order')} since ${fmt(c.orders[c.orders.length - 1].order_date, { month: 'short', year: 'numeric' })}`);
  // measurement history with change markers against the previous fitting
  const hist = c.orders.map(o => ({ o, rows: [] }));
  for (const t of TYPES) {
    const withType = c.orders.filter(o => o.measurements && o.measurements[t] && Object.keys(o.measurements[t]).length);
    withType.forEach((o, i) => {
      const prev = withType[i + 1];
      const tiles = FIELDS[t].map(([k, l]) => {
        const v = o.measurements[t][k], pv = prev ? prev.measurements[t][k] : null;
        const dlt = pv != null && v !== pv ? `<span class="delta">${v > pv ? '+' : '\u2212'}${Math.abs(v - pv)}</span>` : '';
        return `<div class="mtile">${dlt}<b class="num">${v}</b><small>${l}</small></div>`;
      }).join('');
      hist.find(h => h.o === o).rows.push(`<div class="hrow"><span class="hlabel">${GM[t].label}</span><div class="mtiles small">${tiles}</div></div>`);
    });
  }
  const msg = `Hello ${c.name}, this is ${SHOP}.`;
  $('#view').innerHTML = `
    <a class="back" href="#/customers">${ic('arrowL')} All customers</a>
    <section class="card prof">
      ${avatar(c.name)}
      <div class="grow"><h2>${esc(c.name)}</h2><div class="muted num">${esc(c.phone)}</div>
        <div class="cmeta" style="margin-top:8px"><span class="chip">${inr(c.spent)} paid so far</span>${c.owed > 0 ? `<span class="chip owes">${inr(c.owed)} due</span>` : '<span class="chip">No balance</span>'}</div></div>
      <div class="prof-actions">
        <a class="btn btn-ghost btn-sm" href="tel:+91${c.phone}">${ic('phone')} Call</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${waLink(c.phone, msg)}">${ic('chat')} WhatsApp</a>
        <button class="btn btn-tape btn-sm" data-reorder="${c.id}">${ic('plus')} New order</button>
      </div>
    </section>
    <h2 class="sec-title">Measurement history</h2>
    <div class="hist">${hist.map(({ o, rows }) => rows.length ? `
      <article class="card hcard"><header><b>${fmt(o.order_date)}</b><span class="code">${o.code}</span></header>${rows.join('')}</article>` : '').join('')}</div>
    <h2 class="sec-title">Orders</h2>
    <section class="card">${c.orders.map(o => orderRow(o)).join('')}</section>`;
}

/* ───────────────────────── order sheet ───────────────────────── */
let sheetId = null;

function openOrder(id) {
  const o = S.orders.find(x => x.id === id); if (!o) return;
  sheetId = id;
  if (!$('.sheet')) {
    const root = $('#layer-root');
    const scrim = el('div', 'scrim sheet-scrim'), sheet = el('aside', 'sheet');
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    root.append(scrim, sheet);
    scrim.addEventListener('click', closeSheet);
    sheet.addEventListener('click', onSheetClick);
    sheet.addEventListener('submit', onSheetSubmit);
    layers.push(closeSheet);
    requestAnimationFrame(() => { scrim.classList.add('open'); sheet.classList.add('open'); });
  }
  paintSheet(o);
}
function closeSheet() {
  const sheet = $('.sheet'), scrim = $('.sheet-scrim'); if (!sheet) return;
  layers = layers.filter(f => f !== closeSheet);
  sheet.classList.remove('open'); scrim.classList.remove('open'); sheetId = null;
  setTimeout(() => { sheet.remove(); scrim.remove(); }, 380);
}

function paintSheet(o) {
  const items = o.items.map(i => `<div class="line"><span>${plural(i.qty, GM[i.type].label.toLowerCase())} at ${inr(i.rate)}</span><b class="num">${inr(i.qty * i.rate)}</b></div>`).join('');
  const meas = o.items.map(i => {
    const m = o.measurements[i.type] || {};
    return `<section class="sblock"><h3>${GM[i.type].label} measurements, in inches</h3><div class="mtiles">${FIELDS[i.type].map(([k, l]) => `<div class="mtile"><b class="num">${m[k] ?? '-'}</b><small>${l}</small></div>`).join('')}</div></section>`;
  }).join('');
  const pays = o.payments.length
    ? o.payments.map(p => `<li><span>${esc(p.note || 'Payment')}</span><span class="muted">${fmt(p.date, { day: 'numeric', month: 'short' })}</span><b class="num">${inr(p.amount)}</b></li>`).join('')
    : '<li><span class="muted">No payments yet</span></li>';
  const pct = o.total ? clamp(o.paid / o.total * 100, 0, 100) : 0;
  const done = o.status === 'completed';
  $('.sheet').innerHTML = `
    <header class="sheet-h"><h2>${o.code}</h2><span class="pill ${o.state}">${dueText(o)}</span>
      <button class="btn btn-ghost btn-icon" data-act="close" aria-label="Close">${ic('x')}</button></header>
    <div class="tape" aria-hidden="true"></div>
    <div class="sheet-body">
      <div class="cust">${avatar(o.customer_name)}
        <div class="grow"><b>${esc(o.customer_name)}</b><a class="muted num" href="#/customer/${o.customer_id}" data-act="profile">${esc(o.customer_phone)}, view history</a></div>
        <div class="cust-actions">
          <a class="btn btn-ghost btn-icon" href="tel:+91${o.customer_phone}" aria-label="Call ${esc(o.customer_name)}">${ic('phone')}</a>
          <a class="btn btn-ghost btn-icon" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(o.customer_name)}" href="${waLink(o.customer_phone, done ? `Hello ${o.customer_name}, thank you for choosing ${SHOP}.` : `Hello ${o.customer_name}, your order ${o.code} is ready for pickup at ${SHOP}. Balance to pay: ${inr(o.balance)}.`)}">${ic('chat')}</a>
        </div></div>
      <div class="kv">
        <div><small>Ordered</small><b>${fmt(o.order_date)}</b></div>
        <div><small>${done ? 'Delivered' : 'Delivery date'}</small><b>${fmt(done && o.completed_at ? o.completed_at : o.due_date)}</b>
          ${done ? '' : '<div style="margin-top:6px"><button class="linkbtn" data-act="due-toggle" style="font-size:13px">Change date</button></div>'}</div>
      </div>
      <form class="due-edit" data-form="due" hidden><input class="input" type="date" name="due" min="${o.order_date}" value="${o.due_date}" aria-label="New delivery date"><button class="btn btn-primary btn-sm" type="submit">Save date</button></form>
      ${o.fabric_notes ? `<div class="note-box"><b>Notes:</b> ${esc(o.fabric_notes)}</div>` : ''}
      <section class="sblock"><h3>Garments</h3>${items}</section>
      ${meas}
      <section class="sblock"><h3>Bill</h3>
        <div class="line total"><span>Total</span><span class="num">${inr(o.total)}</span></div>
        <div class="paybar" role="img" aria-label="${Math.round(pct)} percent paid"><i style="width:${pct}%"></i></div>
        <div class="line"><span class="muted">Paid ${inr(o.paid)}</span><b class="num" style="color:${o.balance > 0 ? 'var(--thread)' : 'var(--ok)'}">${o.balance > 0 ? inr(o.balance) + ' to collect' : 'Paid in full'}</b></div>
        <ul class="pays">${pays}</ul>
        ${o.balance > 0 ? `<form class="payform" data-form="pay"><div class="unit-input pre"><span>\u20B9</span><input class="input num" name="amount" inputmode="numeric" placeholder="Amount" aria-label="Payment amount"></div><input class="input" name="note" placeholder="Note, for example UPI" aria-label="Payment note" maxlength="60"><button class="btn btn-primary" type="submit">Add payment</button></form>` : ''}
      </section>
    </div>
    <footer class="sheet-f">
      <button class="btn btn-ghost" data-act="receipt">${ic('receipt')} Receipt</button>
      ${done ? `<button class="btn btn-ghost" data-act="reopen">${ic('undo')} Reopen</button>` : `<button class="btn btn-tape" data-act="deliver">${ic('check')} Mark delivered</button>`}
      <button class="btn btn-danger btn-icon" data-act="delete" aria-label="Delete order">${ic('trash')}</button>
    </footer>`;
  const f = $('.sheet .btn-icon'); if (f) f.focus({ preventScroll: true });
}

async function afterChange(msg) {
  await refresh();
  if (sheetId) { const o = S.orders.find(x => x.id === sheetId); if (o) paintSheet(o); }
  if (S.route !== 'new') route(true);
  if (msg) toast(msg);
}

async function onSheetClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const o = S.orders.find(x => x.id === sheetId); if (!o) return;
  const act = b.dataset.act;
  try {
    if (act === 'close') closeSheet();
    else if (act === 'profile') closeSheet();
    else if (act === 'due-toggle') { const f = $('[data-form="due"]'); f.hidden = !f.hidden; if (!f.hidden) $('input', f).focus(); }
    else if (act === 'receipt') openReceipt(o);
    else if (act === 'reopen') { await S.api.patch(o.id, { status: 'pending' }); await afterChange('Order reopened'); }
    else if (act === 'deliver') {
      const bal = o.balance;
      const r = await dialog({
        title: `Mark ${o.code} as delivered?`,
        html: bal > 0 ? `<p>${esc(o.customer_name)} still owes ${inr(bal)}.</p><label class="check"><input type="checkbox" name="collect" checked> Collect ${inr(bal)} now and close the bill</label>` : '<p>The bill is fully paid. This moves the order to Delivered.</p>',
        ok: 'Mark delivered',
      });
      if (!r.ok) return;
      if (bal > 0 && r.values.collect) await S.api.pay(o.id, { amount: bal, note: 'Final payment' });
      await S.api.patch(o.id, { status: 'completed' });
      await afterChange('Order delivered');
    } else if (act === 'delete') {
      const r = await dialog({ title: `Delete ${o.code}?`, html: `<p>This removes the order for ${esc(o.customer_name)}, including its measurements and payments. It cannot be undone.</p>`, ok: 'Delete order', danger: true });
      if (!r.ok) return;
      await S.api.remove(o.id); closeSheet(); await afterChange('Order deleted');
    }
  } catch (err) { toast(err.message, 'error'); }
}

async function onSheetSubmit(e) {
  e.preventDefault();
  const form = e.target, o = S.orders.find(x => x.id === sheetId); if (!o) return;
  const fd = new FormData(form);
  try {
    if (form.dataset.form === 'pay') {
      const amount = Number(String(fd.get('amount')).replace(/[^\d.]/g, ''));
      if (!(amount > 0)) { const i = $('[name=amount]', form); i.classList.add('invalid'); i.focus(); throw new Error('Enter the amount received'); }
      await S.api.pay(o.id, { amount, note: String(fd.get('note') || '') });
      await afterChange('Payment added');
    } else if (form.dataset.form === 'due') {
      const due = String(fd.get('due'));
      if (!due) throw new Error('Pick a new delivery date');
      await S.api.patch(o.id, { due_date: due });
      await afterChange('Delivery date updated');
    }
  } catch (err) { toast(err.message, 'error'); }
}

function openReceipt(o) {
  const lines = o.items.map(i => `<div class="rl"><span>${plural(i.qty, GM[i.type].label.toLowerCase())} at ${inr(i.rate)}</span><span>${inr(i.qty * i.rate)}</span></div>`).join('');
  const pays = o.payments.map(p => `<div class="rl"><span>${esc(p.note || 'Payment')}, ${fmt(p.date, { day: 'numeric', month: 'short' })}</span><span>${inr(p.amount)}</span></div>`).join('');
  const { box, close } = modal(`
    <div class="receipt">
      <h3>${SHOP}</h3><p class="rc-sub">Order receipt ${o.code}</p>
      <div class="rl"><span>Customer</span><span>${esc(o.customer_name)}</span></div>
      <div class="rl"><span>Phone</span><span>${esc(o.customer_phone)}</span></div>
      <div class="rl"><span>Ordered</span><span>${fmt(o.order_date)}</span></div>
      <div class="rl"><span>Delivery</span><span>${fmt(o.due_date)}</span></div>
      <hr>${lines}<hr>
      <div class="rl t"><span>Total</span><span>${inr(o.total)}</span></div>
      ${pays}
      <div class="rl t"><span>Balance</span><span>${inr(o.balance)}</span></div>
      <p class="rc-foot">Please bring this receipt when collecting your order.</p>
    </div>
    <div class="receipt-actions"><button class="btn btn-tape" data-p>${ic('receipt')} Print</button><button class="btn btn-ghost" data-c>Close</button></div>`, 'wide');
  box.addEventListener('click', e => { if (e.target.closest('[data-p]')) window.print(); if (e.target.closest('[data-c]')) close(); });
}

/* ───────────────────────── global events ───────────────────────── */
document.addEventListener('click', e => {
  const open = e.target.closest('[data-open]');
  if (open) { openOrder(Number(open.dataset.open)); return; }
  const cust = e.target.closest('[data-cust]');
  if (cust) { location.hash = '#/customer/' + cust.dataset.cust; return; }
  const re = e.target.closest('[data-reorder]');
  if (re) { const c = customersList().find(x => x.id === Number(re.dataset.reorder)); if (c) startNew(c); return; }
  const rc = e.target.closest('[data-receipt]');
  if (rc) { const o = S.orders.find(x => x.id === Number(rc.dataset.receipt)); if (o) openReceipt(o); return; }
  if (e.target.closest('[data-fresh]')) { e.preventDefault(); draft = null; go('new'); return; }
  if (e.target.closest('[data-theme-toggle]')) applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-open][role="button"]')) {
    e.preventDefault(); openOrder(Number(e.target.dataset.open));
  }
  if (e.key === 'Escape' && layers.length) layers[layers.length - 1]();
});
window.addEventListener('resize', () => { const t = $('#hero-tape'); if (t && !$('#login').hidden) numberTape(t); });

/* ───────────────────────── theme, session, boot ───────────────────────── */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('st-theme', t); } catch (_) { /* ignore */ }
  $$('[data-theme-toggle]').forEach(b => { b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon'); });
  const m = $('meta[name="theme-color"]'); if (m) m.content = t === 'dark' ? '#091410' : '#143b2f';
}

function enterApp() {
  $('#login').hidden = true; $('#app').hidden = false;
  const n = S.session.user.name;
  $('#who-name').textContent = n; $('#who-av').textContent = initials(n); $('#who-av').style.setProperty('--h', hue(n));
  S.firstLoad = true;
  if (!location.hash || location.hash === '#') location.hash = '#/dashboard'; else route();
}

function showLogin(note = '') {
  $('#app').hidden = true; $('#login').hidden = false;
  $('#lp').value = ''; $('#login-error').textContent = note;
  const tape = $('#hero-tape');
  tape.style.animation = 'none'; void tape.offsetWidth; tape.style.animation = '';
  numberTape(tape);
  $('#mode-note').innerHTML = S.mode === 'server'
    ? 'Connected to the shop server. Orders are saved in its database.'
    : 'Demo mode. Orders are saved in this browser only. Start the FastAPI server to keep them in a shared database.';
  $('#mode-note').innerHTML += '<br>Sample sign-in: <b>admin</b> / <b>admin123</b>';
}

function signOut(expired = false) {
  S.session = null; S.orders = []; draft = null;
  try { localStorage.removeItem('st-session'); } catch (_) { /* ignore */ }
  layers.slice().forEach(f => f()); layers = [];
  try { history.replaceState(null, '', location.pathname + location.search); } catch (_) { location.hash = ''; }
  showLogin(expired ? 'Your session ended. Sign in again.' : '');
}

async function boot() {
  let theme = 'light';
  try { theme = localStorage.getItem('st-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (_) { /* ignore */ }
  applyTheme(theme);
  $$('[data-ic]').forEach(n => { n.innerHTML = ic(n.dataset.ic); });
  const found = await detectApi();
  S.api = found.api; S.mode = found.mode;

  $('#signout').addEventListener('click', () => signOut());
  $('#signout-m').addEventListener('click', () => signOut());
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const u = $('#lu').value.trim().toLowerCase(), p = $('#lp').value, btn = $('#login-btn'), err = $('#login-error');
    err.textContent = '';
    if (!u || !p) { err.textContent = 'Enter your username and password.'; return; }
    btn.disabled = true; btn.classList.add('busy');
    try {
      const r = await S.api.login(u, p);
      S.session = { token: r.token, user: r.user, mode: S.mode };
      try { localStorage.setItem('st-session', JSON.stringify(S.session)); } catch (_) { /* ignore */ }
      await refresh();
      enterApp();
    } catch (ex) {
      err.textContent = ex.message;
      const f = $('#lp'); f.classList.add('invalid'); setTimeout(() => f.classList.remove('invalid'), 400);
    } finally { btn.disabled = false; btn.classList.remove('busy'); }
  });

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('st-session')); } catch (_) { /* ignore */ }
  if (saved && saved.mode === S.mode) {
    S.session = saved;
    try { await refresh(); enterApp(); return; } catch (_) { S.session = null; }
  }
  showLogin();
}

boot();
})();
