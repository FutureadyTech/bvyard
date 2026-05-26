// v0.4 — Phased sidebar, code-view toggle, section-aware shell
const NAV_DEFS = {
  'dashboard':       { label: 'Dashboard',         href: 'dashboard.html',       icon: '▦' },
  'demand':          { label: 'Demands',           href: 'demand.html',          icon: '✎' },
  'stock-out':       { label: 'Fulfillment',       href: 'stock-out.html',       icon: '✅' },
  'dispatch':        { label: 'Outward (Gate-out)', href: 'dispatch.html',       icon: '🚚' },
  'purchase-orders': { label: 'Purchase Orders',   href: 'purchase-orders.html', icon: '◧' },
  'stock-in':        { label: 'Goods Receipt (from vendor)', href: 'stock-in.html', icon: '📥' },
  'spoilage':        { label: 'Spoilage / Write-off', href: 'spoilage.html',     icon: '⚠' },
  'inventory':       { label: 'Inventory',         href: 'inventory.html',       icon: '📦' },
  'low-stock':       { label: 'Low Stock Alerts',  href: 'low-stock.html',       icon: '!' },
  'reports':         { label: 'Reports',           href: 'reports.html',         icon: '📊' },
  'products':        { label: 'Items',             href: 'products.html',        icon: '▤' },
  'categories':      { label: 'Categories',        href: 'categories.html',      icon: '▣' },
  'suppliers':       { label: 'Suppliers',          href: 'suppliers.html',       icon: '🏭' },
  'users':           { label: 'Users & Roles',     href: 'users.html',           icon: '◉' }
};

function requireAuth() {
  const u = Session.get();
  if (!u) { window.location.href = 'index.html'; return null; }
  return u;
}

function renderShell(activeKey, pageTitle, pageSub) {
  const user = requireAuth();
  if (!user) return;
  const role = ROLES[user.role];
  const allowed = new Set(role.nav);

  if (!allowed.has(activeKey)) {
    document.body.innerHTML = '<div style="padding:60px;text-align:center;color:#64748b;"><h2>Access denied</h2><p>Your role does not permit access to this page.</p><a class="btn btn-primary" href="dashboard.html">Back to Dashboard</a></div>';
    return;
  }

  // Build phased nav
  const navHtml = NAV_GROUPS.map(group => {
    const items = group.items.filter(k => allowed.has(k));
    if (!items.length) return '';
    return `
      <div class="nav-section">${group.label}</div>
      ${items.map(k => {
        const n = NAV_DEFS[k];
        return `<a href="${n.href}" class="${k === activeKey ? 'active' : ''}">
          <span class="icon">${n.icon}</span><span>${n.label}</span>
        </a>`;
      }).join('')}
    `;
  }).join('');

  const initials = user.name.split(' ').slice(-2).map(s => s[0]).join('').toUpperCase();
  const sectionsLabel = (user.sections && !user.sections.includes('*'))
    ? user.sections.map(sid => DB.section(sid)?.name).filter(Boolean).join(', ')
    : 'All sections';
  const prefs = Prefs.get();

  document.body.classList.add('has-shell');
  document.body.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="logo">B</div>
          <div>
            <h1>BV Yard</h1>
            <p>Mumbai</p>
          </div>
        </div>
        <nav>${navHtml}</nav>
        <div style="padding:14px 18px;font-size:11px;color:rgba(255,255,255,0.4);border-top:1px solid rgba(255,255,255,0.08);margin-top:20px;">
          v0.4 prototype<br/>${sectionsLabel}
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <div class="main">
        <header class="topbar">
          <div class="row" style="gap:10px;">
            <button class="menu-toggle" id="menuToggle" aria-label="Open menu">☰</button>
            <div class="page-title">${pageTitle}${pageSub ? `<small>${pageSub}</small>` : ''}</div>
          </div>
          <div class="topbar-right">
            <label class="toggle-pill" title="When ON, items display as codes only — for screens visible to outsiders">
              <input type="checkbox" id="codeToggle" ${prefs.codeView ? 'checked' : ''}>
              <span>Code view</span>
            </label>
            <select id="roleSwitcher" class="role-switcher" title="Preview a different role">
              ${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === user.role ? 'selected' : ''}>View as: ${r.label}</option>`).join('')}
            </select>
            <div class="user-chip" id="userChip" title="Click to log out">
              <div class="avatar">${initials}</div>
              <div class="meta">
                <div class="name">${user.name}</div>
                <div class="role">${user.rank} · ${user.designation}</div>
              </div>
            </div>
          </div>
        </header>
        <main class="content" id="pageContent">${document.getElementById('pageContent')?.innerHTML || ''}</main>
      </div>
    </div>
    <div class="toast" id="toast"></div>
    <div class="modal-backdrop" id="modalBackdrop"><div class="modal" id="modal"></div></div>
  `;

  // ── Mobile sidebar toggle ──────────────────────────────────
  const sidebar        = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const menuToggle     = document.getElementById('menuToggle');

  function openSidebar()  { sidebar.classList.add('open'); sidebarOverlay.classList.add('open'); }
  function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }

  menuToggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Close sidebar when a nav link is tapped on mobile
  sidebar.querySelectorAll('nav a').forEach(a => a.addEventListener('click', closeSidebar));

  document.getElementById('codeToggle').addEventListener('change', e => {
    const p = Prefs.get();
    p.codeView = e.target.checked;
    Prefs.set(p);
    location.reload();
  });
  document.getElementById('roleSwitcher').addEventListener('change', e => {
    Session.switchRole(e.target.value);
    location.reload();
  });
  document.getElementById('userChip').addEventListener('click', () => {
    if (confirm('Log out?')) { Session.clear(); window.location.href = 'index.html'; }
  });
}

function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return alert(msg);
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 2400);
}

function openModal(title, bodyHtml, onSave, saveLabel = 'Save', size = '') {
  const backdrop = document.getElementById('modalBackdrop');
  const modal = document.getElementById('modal');
  if (size === 'wide') modal.style.maxWidth = '900px'; else modal.style.maxWidth = '640px';
  modal.innerHTML = `
    <div class="modal-head">
      <h3>${title}</h3>
      <button class="btn btn-sm" id="modalClose">×</button>
    </div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-foot">
      <button class="btn" id="modalCancel">Cancel</button>
      ${onSave ? `<button class="btn btn-primary" id="modalSave">${saveLabel}</button>` : ''}
    </div>
  `;
  backdrop.classList.add('open');
  document.getElementById('modalClose').onclick = closeModal;
  document.getElementById('modalCancel').onclick = closeModal;
  if (onSave) document.getElementById('modalSave').onclick = () => {
    const ok = onSave();
    if (ok !== false) closeModal();
  };
}
function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
}

function fmtMoney(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtDateTime(d) { if (!d) return '—'; return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

// Local-time helpers — avoids UTC offset bugs in date/datetime-local inputs
function localToday() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function localNow() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function can(perm) {
  const u = Session.get();
  if (!u) return false;
  return ROLES[u.role]?.can?.[perm] === true;
}
function userSections() {
  const u = Session.get();
  return u?.sections || ['*'];
}

// Pack qty helper for UI — input as packs OR loose qty, output total in baseUnit
function packToBaseQty(p, packs, loose) {
  return (Number(packs || 0) * (p.packToBase || 1)) + Number(loose || 0);
}
