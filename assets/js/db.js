// v0.7 — Stock seeded at 2×minStock, clean slate (no demo demands/fulfillments/dispatch)
const DB_KEY = 'bvyard_db_v12';
const SESSION_KEY = 'bvyard_session_v12';
const PREFS_KEY = 'bvyard_prefs_v1';

const DB = {
  load() {
    let raw = localStorage.getItem(DB_KEY);
    if (!raw) { this.seed(); raw = localStorage.getItem(DB_KEY); }
    return JSON.parse(raw);
  },
  save(state) { localStorage.setItem(DB_KEY, JSON.stringify(state)); },
  seed() { localStorage.setItem(DB_KEY, JSON.stringify(window.SEED_DATA)); },
  reset() {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PREFS_KEY);
    // also clear older versions
    ['navy_ims_db_v1','navy_ims_session_v1','navy_ims_db_v2','navy_ims_session_v2','navy_ims_db_v3','navy_ims_session_v3','bvyard_db_v4','bvyard_session_v4','bvyard_db_v5','bvyard_session_v5','bvyard_db_v6','bvyard_session_v6','bvyard_db_v7','bvyard_session_v7','bvyard_db_v8','bvyard_session_v8','bvyard_db_v9','bvyard_session_v9','bvyard_db_v10','bvyard_session_v10','bvyard_db_v11','bvyard_session_v11'].forEach(k => localStorage.removeItem(k));
    this.seed();
  },

  // Day-of-week helper (Mon/Tue/.../Sun)
  dayOfWeek(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  },

  uid(prefix = 'x') { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
  today() { const d = new Date(); const p = n => String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; },

  list(col) { return this.load()[col] || []; },
  get(col, id) { return this.list(col).find(x => x.id === id); },
  upsert(col, record) {
    const s = this.load();
    if (!record.id) record.id = this.uid(col.slice(0, 2));
    const idx = (s[col] || []).findIndex(x => x.id === record.id);
    if (idx >= 0) s[col][idx] = record;
    else s[col] = (s[col] || []).concat(record);
    this.save(s);
    return record;
  },
  remove(col, id) {
    const s = this.load();
    s[col] = (s[col] || []).filter(x => x.id !== id);
    this.save(s);
  },

  // domain helpers
  product(id) { return this.get('products', id); },
  category(id) { return this.get('categories', id); },
  section(id) { return this.get('sections', id); },
  ship(id) { return this.get('ships', id); },
  supplier(id) { return this.get('suppliers', id); },
  user(id) { return this.get('users', id); },

  // Filter products by current user's sections (or '*' = all)
  productsForUser(userSections) {
    const all = this.list('products');
    if (!userSections || userSections.includes('*')) return all;
    return all.filter(p => userSections.includes(p.sectionId));
  },

  productStockStatus(p) {
    if (!p) return 'unknown';
    if (p.currentStock <= 0) return 'out';
    if (p.currentStock < p.minStock) return 'low';
    if (p.currentStock < p.minStock * 1.25) return 'warn';
    return 'ok';
  },

  lowStockItems(userSections) {
    const prods = this.productsForUser(userSections);
    return prods.filter(p => p.currentStock < p.minStock);
  },

  adjustStock(productId, delta) {
    const s = this.load();
    const p = s.products.find(x => x.id === productId);
    if (p) {
      p.currentStock = Math.max(0, (p.currentStock || 0) + delta);
      this.save(s);
    }
  },

  // Demand fulfilment — recalculate item fulfilledQty + outcome from linked stockOut entries
  // outcome enum: pending | exact | short | over | absent | substituted
  recalcDemandFulfilment(demandId) {
    const s = this.load();
    const d = s.demands.find(x => x.id === demandId);
    if (!d) return;

    d.items.forEach(it => {
      // Sum qty issued for this product (or its substitute, if applicable)
      const myStockOuts = s.stockOut.filter(so => so.demandId === demandId);
      const matching = myStockOuts.flatMap(so => so.items).filter(soi => {
        // Match by original productId OR if the stockout item was a substitute for this demand line
        return soi.productId === it.productId
          || (soi.substitutedForProductId && soi.substitutedForProductId === it.productId);
      });
      const totalIssued = matching.reduce((sum, soi) => sum + (soi.qty || 0), 0);
      it.fulfilledQty = totalIssued;

      // Was any of the fulfilment via a substitute?
      const subst = matching.find(soi => soi.substitutedForProductId === it.productId);
      if (subst) {
        it.substitutedFor = subst.productId;
        it.outcome = 'substituted';
      } else if (totalIssued === 0) {
        // Check if explicitly marked absent in a stockout
        const absent = myStockOuts.some(so => (so.absent || []).includes(it.productId));
        it.outcome = absent ? 'absent' : 'pending';
      } else if (totalIssued === it.demandedQty) {
        it.outcome = 'exact';
      } else if (totalIssued < it.demandedQty) {
        it.outcome = 'short';
      } else {
        it.outcome = 'over';   // over-issue allowed per client decision, just flagged
      }
    });

    // Overall status — don't override terminal/workflow statuses
    const anyIssued = d.items.some(it => it.fulfilledQty > 0);
    const allResolved = d.items.every(it => ['exact','over','absent','substituted'].includes(it.outcome) || it.fulfilledQty >= it.demandedQty);
    if (!['rejected','dispatch_pending','fulfilled'].includes(d.status)) {
      d.status = allResolved ? 'fulfilled' : anyIssued ? 'partially_fulfilled' : (['partially_approved','approved'].includes(d.status) ? d.status : 'pending');
    }
    this.save(s);
  },

  // Sequential demand number: DMD-YYYY-NNN-SHIPCODE
  nextDemandNo(shipId) {
    const year = new Date().getFullYear();
    const ship = this.get('ships', shipId);
    const code = ship?.code || shipId.toUpperCase();
    const count = this.list('demands').filter(d =>
      d.shipId === shipId && (d.demandNo || '').startsWith(`DMD-${year}-`)
    ).length;
    const seq = String(count + 1).padStart(3, '0');
    return `DMD-${year}-${seq}-${code}`;
  },

  // Sequential voucher number: VCH-YYYY-NNN-SHIPCODE
  nextVoucherNo(shipId) {
    const year = new Date().getFullYear();
    const ship = this.get('ships', shipId);
    const code = ship?.code || shipId.toUpperCase();
    const count = this.list('stockOut').filter(so =>
      so.shipId === shipId && (so.voucherNo || '').startsWith(`VCH-${year}-`)
    ).length;
    const seq = String(count + 1).padStart(3, '0');
    return `VCH-${year}-${seq}-${code}`;
  },

  // FIFO batches — returns the available batches for a product, oldest first
  // Looks at stockIn entries to determine batch age (by date received)
  fifoBatchesFor(productId) {
    const ins = this.list('stockIn');
    const batches = [];
    ins.forEach(si => si.items.forEach(it => {
      if (it.productId === productId) {
        batches.push({ srvNo: si.srvNo, srvDate: si.date, batchNo: it.batchNo || '—', expiry: it.expiry, qty: it.qty });
      }
    }));
    // Sort by expiry first (earliest expires first), then by SRV date
    return batches.sort((a, b) => {
      if (a.expiry && b.expiry) return a.expiry.localeCompare(b.expiry);
      return a.srvDate.localeCompare(b.srvDate);
    });
  },

  demandFulfilmentPct(d) {
    if (!d || !d.items.length) return { qtyPct: 0, itemPct: 0 };
    const totalDemanded = d.items.reduce((s, it) => s + it.demandedQty, 0);
    const totalFulfilled = d.items.reduce((s, it) => s + Math.min(it.fulfilledQty || 0, it.demandedQty), 0);
    const itemsFulfilled = d.items.filter(it => (it.fulfilledQty || 0) >= it.demandedQty).length;
    return {
      qtyPct: totalDemanded ? Math.round((totalFulfilled / totalDemanded) * 100) : 0,
      itemPct: Math.round((itemsFulfilled / d.items.length) * 100)
    };
  },

  // Pack formatting helper: "10 bags × 25 kg = 250 kg"
  formatStock(p) {
    if (!p) return '';
    if (!p.packToBase || p.packToBase === 1) return `${p.currentStock} ${p.baseUnit || p.unit || ''}`;
    const packs = Math.floor(p.currentStock / p.packToBase);
    const loose = p.currentStock % p.packToBase;
    if (loose === 0) return `${packs} × ${p.packSize}${p.baseUnit} ${p.packUnit} = ${p.currentStock} ${p.baseUnit}`;
    return `${packs} × ${p.packSize}${p.baseUnit} + ${loose} ${p.baseUnit} = ${p.currentStock} ${p.baseUnit}`;
  },

  // Notification helpers
  // targetRoles: null = all roles see it; array of role keys = only those roles see it
  notify(message, type = 'info', link = null, targetRoles = null) {
    const s = this.load();
    if (!s.notifications) s.notifications = [];
    s.notifications.push({
      id: this.uid('nt'),
      message, type, link, targetRoles,
      createdAt: new Date().toISOString(),
      read: false
    });
    if (s.notifications.length > 50) s.notifications = s.notifications.slice(-50);
    this.save(s);
  },
  markAllRead() {
    const role = Session?.get()?.role;
    const s = this.load();
    if (s.notifications) s.notifications.forEach(n => {
      if (!n.targetRoles || n.targetRoles.includes(role)) n.read = true;
    });
    this.save(s);
  },
  unreadCount() {
    const role = Session?.get()?.role;
    return (this.load().notifications || []).filter(n =>
      !n.read && (!n.targetRoles || n.targetRoles.includes(role))
    ).length;
  },
  listNotifications() {
    const role = Session?.get()?.role;
    return (this.load().notifications || []).filter(n =>
      !n.targetRoles || n.targetRoles.includes(role)
    ).slice().reverse();
  }
};

// Session / mock auth
const Session = {
  set(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); },
  get() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  clear() { localStorage.removeItem(SESSION_KEY); },
  switchRole(role) {
    const u = this.get();
    if (u) {
      u.role = role;
      // When previewing as a section-scoped role, find a user from seed with that role
      // to inherit their section assignment
      const example = DB.list('users').find(x => x.role === role);
      if (example) u.sections = example.sections;
      this.set(u);
    }
  }
};

// Preferences (code view toggle, etc.)
const Prefs = {
  get() {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { codeView: false };
  },
  set(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); },
  toggleCodeView() {
    const p = this.get();
    p.codeView = !p.codeView;
    this.set(p);
    return p.codeView;
  }
};

// Display helper — respects code view toggle
function displayName(p) {
  if (!p) return '—';
  return Prefs.get().codeView ? p.code : `${p.name}`;
}
function displayNameFull(p) {
  if (!p) return '—';
  return Prefs.get().codeView ? p.code : `${p.name} <span class="text-sm text-mute">${p.code}</span>`;
}

// Role permissions
const ROLES = {
  super_admin: {
    label: 'BVO',
    icon: '★',
    nav: ['dashboard', 'demand', 'stock-out', 'dispatch', 'purchase-orders', 'stock-in', 'spoilage', 'inventory', 'low-stock', 'reports', 'products', 'categories', 'suppliers', 'users'],
    can: { create: true, update: true, delete: true, approve: true, approveDispatch: true, approveSpoilage: true, manageUsers: true, viewAllSections: true }
  },
  central_coordinator: {
    label: 'Overall Coordinator',
    icon: '◆',
    nav: ['dashboard', 'demand', 'stock-out', 'dispatch', 'purchase-orders', 'stock-in', 'spoilage', 'inventory', 'low-stock', 'reports', 'products'],
    can: { create: false, update: false, delete: false, approve: false, approveDispatch: false, approveSpoilage: true, manageUsers: true, viewAllSections: true }
  },
  reviewer: {
    label: 'Group OiC',
    icon: '✓',
    nav: ['dashboard', 'demand', 'dispatch', 'purchase-orders', 'spoilage', 'inventory', 'low-stock', 'reports'],
    can: { create: true, update: true, delete: false, approve: true, approveDispatch: true, approveSpoilage: true, manageUsers: false, viewAllSections: true }
  },
  inventory_manager: {
    label: 'Group Incharge',
    icon: '◈',
    nav: ['dashboard', 'demand', 'stock-out', 'purchase-orders', 'stock-in', 'spoilage', 'inventory', 'low-stock', 'products', 'suppliers'],
    can: { create: true, update: true, delete: false, approve: false, approveDispatch: false, approveSpoilage: false, manageUsers: false, viewAllSections: false }
  },
  rd_section: {
    label: 'Receipt & Dispatch Section',
    icon: '↑',
    nav: ['dashboard', 'dispatch'],
    can: { create: true, update: true, delete: false, approve: false, approveDispatch: false, approveSpoilage: false, manageUsers: false, viewAllSections: true }
  },
  gate_keeper: {
    label: 'Gate Keeper',
    icon: '⬚',
    nav: ['dashboard', 'dispatch'],
    can: { create: true, update: true, delete: false, approve: false, approveDispatch: false, approveSpoilage: false, manageUsers: false, viewAllSections: true }
  },
  data_entry: {
    label: 'DEO',
    icon: '✎',
    nav: ['dashboard', 'demand', 'products', 'inventory'],
    can: { create: true, update: true, delete: false, approve: false, approveDispatch: false, approveSpoilage: false, manageUsers: false, viewAllSections: true }
  }
};

// Two parallel flows that share the same inventory pool
const NAV_GROUPS = [
  { label: 'Overview', items: ['dashboard'] },
  { label: 'Demand → Outward (to ships)', items: ['demand', 'stock-out', 'dispatch'] },
  { label: 'Replenishment (from suppliers)', items: ['purchase-orders', 'stock-in', 'spoilage'] },
  { label: 'Insights', items: ['inventory', 'low-stock', 'reports'] },
  { label: 'Admin', items: ['products', 'categories', 'suppliers', 'users'] }
];
