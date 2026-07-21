// v0.6 — Sequential demands, rd_section role, per-item approval, spoilage approval, PO workflow

// WhatsApp SVG icon — inline, renders wherever HTML is allowed
const WA_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#25D366" style="vertical-align:middle;margin-right:3px;flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

const NAV_DEFS = {
  'dashboard':       { label: 'Dashboard',         href: 'dashboard.html',       icon: '▦' },
  'demand':          { label: 'Demands',           href: 'demand.html',          icon: '✎' },
  'stock-out':       { label: 'Fulfillment',       href: 'stock-out.html',       icon: '✔' },
  'dispatch':        { label: 'Outward (Gate-out)', href: 'dispatch.html',       icon: '▷' },
  'purchase-orders': { label: 'Purchase Orders',   href: 'purchase-orders.html', icon: '◧' },
  'stock-in':        { label: 'Goods Receipt (from vendor)', href: 'stock-in.html', icon: '↓' },
  'spoilage':        { label: 'Spoilage / Deficiency', href: 'spoilage.html',     icon: '⚠' },
  'inventory':       { label: 'Inventory',         href: 'inventory.html',       icon: '◻' },
  'low-stock':       { label: 'Low Stock Alerts',  href: 'low-stock.html',       icon: '!' },
  'reports':         { label: 'Reports',           href: 'reports.html',         icon: '≡' },
  'returns':         { label: 'Returns',            href: 'returns.html',         icon: '↩' },
  'products':        { label: 'Items',             href: 'products.html',        icon: '▤' },
  'categories':      { label: 'Categories',        href: 'categories.html',      icon: '▣' },
  'suppliers':       { label: 'Suppliers',          href: 'suppliers.html',       icon: '◇' },
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

  const unread = DB.unreadCount();

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
          v0.6 prototype<br/>${sectionsLabel}
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
            ${user.role === 'super_admin' ? `
            <select id="roleSwitcher" class="role-switcher" title="Preview a different role">
              ${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === user.role ? 'selected' : ''}>View as: ${r.label}</option>`).join('')}
            </select>` : ''}
            <div style="position:relative;" id="notifWrap">
              <button id="notifBtn" title="Notifications" style="background:none;border:none;cursor:pointer;padding:6px 8px;border-radius:6px;color:#64748b;position:relative;display:flex;align-items:center;gap:0;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                ${unread > 0 ? `<span id="notifBadge" style="position:absolute;top:0;right:0;background:var(--danger);color:#fff;border-radius:8px;font-size:10px;font-weight:700;padding:0 4px;line-height:16px;min-width:16px;text-align:center;">${unread > 9 ? '9+' : unread}</span>` : ''}
              </button>
            </div>
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
  const roleSwitcher = document.getElementById('roleSwitcher');
  if (roleSwitcher) roleSwitcher.addEventListener('change', e => {
    Session.switchRole(e.target.value);
    location.reload();
  });
  document.getElementById('userChip').addEventListener('click', () => {
    if (confirm('Log out?')) { Session.clear(); window.location.href = 'index.html'; }
  });

  // Day-before demand reminders
  checkDemandReminders();

  // Notification bell
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      const existing = document.getElementById('notifPanel');
      if (existing) { existing.remove(); return; }
      DB.markAllRead();
      const badge = document.getElementById('notifBadge');
      if (badge) badge.remove();
      const notifs = DB.listNotifications().slice(0, 15);
      const panel = document.createElement('div');
      panel.id = 'notifPanel';
      panel.style.cssText = 'position:absolute;right:0;top:calc(100% + 8px);width:320px;max-height:400px;overflow-y:auto;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);z-index:1000;';
      const typeBar = t => t === 'ok' ? 'var(--ok)' : t === 'danger' ? 'var(--danger)' : t === 'warn' ? 'var(--warn)' : 'var(--navy-700)';
      panel.innerHTML = `
        <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-weight:600;font-size:13px;color:var(--text);">Notifications</div>
        ${notifs.length ? notifs.map(n => `
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);font-size:13px;border-left:3px solid ${typeBar(n.type)};">
            <div style="color:var(--text);">${escapeHtml(n.message)}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${fmtDateTime(n.createdAt)}</div>
          </div>
        `).join('') : '<div style="padding:20px 14px;text-align:center;color:var(--text-muted);font-size:13px;">No notifications yet</div>'}
      `;
      document.getElementById('notifWrap').appendChild(panel);
      setTimeout(() => {
        document.addEventListener('click', function closePanel(e) {
          if (!panel.contains(e.target) && !notifBtn.contains(e.target)) {
            panel.remove();
            document.removeEventListener('click', closePanel);
          }
        });
      }, 10);
    });
  }
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

// Proactive day-before demand reminder — fires at most once per demand per day
function checkDemandReminders() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  const p = n => String(n).padStart(2, '0');
  const tmr = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  const today = DB.today();
  const s = DB.load();
  if (!s.remindedOn) s.remindedOn = {};
  const alreadyToday = new Set(s.remindedOn[today] || []);
  const dueTmr = (s.demands || []).filter(dem =>
    dem.dateRequired === tmr &&
    !['rejected', 'fulfilled'].includes(dem.status) &&
    !alreadyToday.has(dem.id)
  );
  if (!dueTmr.length) return;
  if (!s.notifications) s.notifications = [];
  dueTmr.forEach(dem => {
    const ship = (s.ships || []).find(sh => sh.id === dem.shipId);
    s.notifications.push({
      id: DB.uid('nt'),
      message: `Demand ${dem.demandNo} for ${ship?.name || '—'} is due tomorrow — action needed`,
      type: 'warn', link: 'demand.html',
      createdAt: new Date().toISOString(), read: false
    });
    alreadyToday.add(dem.id);
  });
  if (s.notifications.length > 50) s.notifications = s.notifications.slice(-50);
  s.remindedOn[today] = [...alreadyToday];
  Object.keys(s.remindedOn).filter(k => k < today).forEach(k => delete s.remindedOn[k]);
  DB.save(s);
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
