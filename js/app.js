/* ============================================================================
   NuTex Inc. — Lean Controller (Bilingual EN/DE, Dark Mode & Dept-Reactive Trend)
   ============================================================================ */

(() => {
  const D = window.NUTEX_DATA;
  const S = window.NUTEX_STATE;
  const V = window.NUTEX_VIEWS;

  const el = {};

  function initDom() {
    el.viewRoot = document.getElementById('view-root');
    el.modalRoot = document.getElementById('modal-root');
    el.popover = document.getElementById('kpi-popover');
    el.navTabs = document.querySelectorAll('[data-nav]');
    el.i18nEls = document.querySelectorAll('[data-i18n]');
    el.pendingBadge = document.getElementById('nav-pending-badge');
    el.trainBadge = document.getElementById('nav-train-badge');
    el.filterDept = document.getElementById('filter-dept');
    el.filterTime = document.getElementById('filter-time');
    el.btnReset = document.getElementById('btn-reset');
    el.roleSelect = document.getElementById('role-switcher');
    el.btnPptx = document.getElementById('btn-pptx');
    el.btnPrint = document.getElementById('btn-print');
    el.btnSettings = document.getElementById('btn-settings');
    el.settingsMenu = document.getElementById('settings-menu');
    el.btnBack = document.getElementById('btn-back');
    el.pageTitle = document.getElementById('page-title');

    el.filterTime.innerHTML = Object.entries(D.TIMEFRAMES)
      .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

    el.roleSelect.innerHTML = D.ROLES
      .map(r => `<option value="${r.id}">${r.name} (${r.title})</option>`).join('');
  }

  function syncTopbar(metrics) {
    // Theme & Language sync (sync html, body & @page print background so PDF has zero white edges!)
    document.body.classList.toggle('dark', S.state.theme === 'dark');
    if (document.documentElement) {
      document.documentElement.classList.toggle('dark', S.state.theme === 'dark');
      document.documentElement.lang = S.state.lang;
    }
    if (window.NUTEX_EXPORT && window.NUTEX_EXPORT.syncPrintPageTheme) {
      window.NUTEX_EXPORT.syncPrintPageTheme();
    }

    el.i18nEls.forEach(node => {
      node.textContent = S.t(node.dataset.i18n);
    });

    const acc = S.getAccessibleDepts();
    el.filterDept.innerHTML =
      `<option value="all">${acc.length === 6 ? S.t('all_depts_short') : S.t('accessible_depts')}</option>` +
      acc.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    el.filterDept.value = acc.some(d => d.id === S.state.filters.dept) ? S.state.filters.dept : 'all';
    el.filterTime.value = S.state.filters.timeframe;
    el.filterTime.style.display = S.state.activeTab === 'projects' ? 'none' : 'inline-block';

    el.roleSelect.value = S.state.roleId;
    el.btnReset.style.display = S.hasActiveFilters() ? 'inline-block' : 'none';

    const role = S.getRole();
    const showFin = S.canViewFinancials();

    const pendingProj = metrics.pendingProjects.length;
    if (el.pendingBadge) {
      el.pendingBadge.textContent = pendingProj;
      el.pendingBadge.style.display = (role.isCEO && pendingProj > 0) ? 'inline-flex' : 'none';
    }

    const pendingTrain = metrics.pendingTrainings.length;
    if (el.trainBadge) {
      el.trainBadge.textContent = pendingTrain;
      el.trainBadge.style.display = (role.isCEO && pendingTrain > 0) ? 'inline-flex' : 'none';
    }

    el.navTabs.forEach(b => {
      if (b.dataset.nav === 'budget') b.style.display = showFin ? '' : 'none';
      b.classList.toggle('active', b.dataset.nav === S.state.activeTab);
    });
    const onOverview = S.state.activeTab === 'overview';
    if (el.btnBack) el.btnBack.style.display = onOverview ? 'none' : '';
    if (el.pageTitle) el.pageTitle.textContent = onOverview ? 'AI Executive Dashboard' : S.t('nav_' + S.state.activeTab);
    if (el.btnSettings) el.btnSettings.classList.toggle('active', S.state.showSettings);
    if (el.settingsMenu) el.settingsMenu.innerHTML = V.renderSettingsMenu();
  }

  // Which overlay is open — used to play the open animation only once (no flicker on in-modal clicks)
  let lastOverlay = '';
  function overlayKey() {
    const st = S.state;
    return [st.roadmapOpen && 'roadmap', st.valueOpen && 'value', st.methodOpen && 'method', st.lossOpen && 'loss',
      st.impactOpen && 'impact', st.detailOpen && ('detail:' + st.detailOpen)].filter(Boolean).join('|');
  }

  function render() {
    if (window.NUTEX_ROADMAP) window.NUTEX_ROADMAP.sync();
    const metrics = S.computeMetrics();
    syncTopbar(metrics);
    const key = overlayKey();
    const sameOverlay = key && key === lastOverlay;
    const prevModal = el.viewRoot.querySelector('.ov-modal');
    const scrollTop = sameOverlay && prevModal ? prevModal.scrollTop : 0;

    el.viewRoot.classList.toggle('overview-mode', S.state.activeTab === 'overview');

    if (S.state.activeTab === 'overview') el.viewRoot.innerHTML = V.renderOverview(metrics);
    else if (S.state.activeTab === 'readiness') el.viewRoot.innerHTML = V.renderReadiness(metrics);
    else if (S.state.activeTab === 'projects') el.viewRoot.innerHTML = V.renderProjects(metrics);
    else if (S.state.activeTab === 'trainings') el.viewRoot.innerHTML = V.renderTrainings(metrics);
    else if (S.state.activeTab === 'licenses') el.viewRoot.innerHTML = V.renderLicenses(metrics);
    else if (S.state.activeTab === 'budget') el.viewRoot.innerHTML = V.renderBudget(metrics);
    else if (S.state.activeTab === 'culture') el.viewRoot.innerHTML = V.renderCulture();
    else el.viewRoot.innerHTML = V.renderDepartments(metrics);

    if (sameOverlay) {
      el.viewRoot.querySelectorAll('.ov-modal-backdrop').forEach(b => b.classList.add('is-static'));
      const m = el.viewRoot.querySelector('.ov-modal');
      if (m) m.scrollTop = scrollTop;
    }
    lastOverlay = key;

    el.modalRoot.innerHTML = V.renderProjectModal() + V.renderTrainingModal();
    hidePopover();
  }

  function showPopover(key, anchor) {
    const info = D.KPI_INFO[key];
    if (!info) return;
    el.popover.innerHTML = `
      <div class="pop-meta"><strong>${info.source}</strong> · ${info.updated} (${info.freq})</div>
      <p>${info.text}</p>
    `;
    el.popover.style.display = 'block';
    const ar = anchor.getBoundingClientRect();
    const pr = el.popover.getBoundingClientRect();
    const left = Math.max(12, Math.min(window.innerWidth - pr.width - 12, ar.left + ar.width / 2 - pr.width / 2));
    const top = ar.bottom + 8 + pr.height > window.innerHeight ? ar.top - pr.height - 8 : ar.bottom + 8;
    el.popover.style.left = `${left}px`;
    el.popover.style.top = `${Math.max(10, top)}px`;
  }

  function hidePopover() {
    if (el.popover) el.popover.style.display = 'none';
  }

  function closeModals() {
    if (S.state.showProjectModal || S.state.showTrainingModal) {
      S.state.showProjectModal = false;
      S.state.showTrainingModal = false;
      render();
    }
  }

  function bindEvents() {
    el.navTabs.forEach(btn => btn.addEventListener('click', () => {
      S.state.activeTab = btn.dataset.nav;
      render();
    }));

    el.filterDept.addEventListener('change', e => {
      S.state.filters.dept = e.target.value;
      S.state.selectedTrendDept = e.target.value === 'all' ? null : e.target.value;
      render();
    });
    el.filterTime.addEventListener('change', e => { S.state.filters.timeframe = e.target.value; render(); });
    el.btnReset.addEventListener('click', () => { S.resetFilters(); render(); });

    el.roleSelect.addEventListener('change', e => { S.setRole(e.target.value); render(); });
    el.btnPptx.addEventListener('click', () => window.NUTEX_EXPORT.exportPowerPoint());
    el.btnPrint.addEventListener('click', () => window.NUTEX_EXPORT.exportPDF());

    // Settings Gear Toggle
    el.btnSettings.addEventListener('click', e => {
      e.stopPropagation();
      S.state.showSettings = !S.state.showSettings;
      render();
    });

    el.settingsMenu.addEventListener('click', e => {
      e.stopPropagation();
      const th = e.target.closest('[data-set-theme]');
      if (th) { S.setTheme(th.dataset.setTheme); render(); return; }
      const lg = e.target.closest('[data-set-lang]');
      if (lg) { S.setLang(lg.dataset.setLang); render(); }
    });

    el.viewRoot.addEventListener('click', e => {
      const info = e.target.closest('[data-kpi-info]');
      if (info) { e.stopPropagation(); showPopover(info.dataset.kpiInfo, info); return; }

      // To-do delegation popover
      const tdPick = e.target.closest('[data-action="todo-delegate"]');
      if (tdPick) {
        S.setDelegation(tdPick.dataset.todo, tdPick.dataset.person);
        S.state.todoOpen = null;
        render(); return;
      }
      const tdUndo = e.target.closest('[data-action="todo-undo"]');
      if (tdUndo) {
        S.setDelegation(tdUndo.dataset.todo, null);
        S.state.todoOpen = null;
        render(); return;
      }
      const tdOpen = e.target.closest('[data-action="todo-open"]');
      if (tdOpen) {
        S.state.todoOpen = S.state.todoOpen === tdOpen.dataset.todo ? null : tdOpen.dataset.todo;
        render();
        const input = el.viewRoot.querySelector('[data-todo-search]');
        if (input) input.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('.ov-pop')) {
        const inPopNav = e.target.closest('[data-nav-tab], [data-action]');
        if (!inPopNav) return;
        S.state.todoOpen = null;
      }

      if (e.target.closest('[data-action="open-impact"]')) {
        S.state.impactOpen = true;
        S.state.detailOpen = null;
        render(); return;
      }
      const usDept = e.target.closest('[data-action="usage-dept"]');
      if (usDept) {
        S.state.usageDept = usDept.dataset.dept;
        render(); return;
      }

      const impKpi = e.target.closest('[data-action="impact-kpi"]');
      if (impKpi) {
        S.state.impactKpi = impKpi.dataset.kpi;
        render(); return;
      }

      if (e.target.closest('[data-action="open-loss"]')) {
        S.state.detailOpen = null;
        S.state.lossOpen = true;
        S.state.detailOpen = null;
        render(); return;
      }

      if (e.target.closest('[data-action="open-method"]')) {
        S.state.methodOpen = true;
        S.state.valueOpen = false;
        render(); return;
      }

      if (e.target.closest('[data-action="open-value"]')) {
        S.state.methodOpen = false;
        S.state.valueOpen = true;
        S.state.detailOpen = null;
        render(); return;
      }

      const openRm = e.target.closest('[data-action="open-roadmap"]');
      if (openRm) {
        S.state.roadmapOpen = true;
        S.state.roadmapFilter = openRm.dataset.level || null;
        S.state.detailOpen = null;
        render(); return;
      }

      const rmFilter = e.target.closest('[data-action="roadmap-filter"]');
      if (rmFilter) {
        S.state.roadmapFilter = rmFilter.dataset.level || null;
        S.state.roadmapOpen = true;
        render(); return;
      }

      // Roadmap overlay closes via the ✕ button or a click on the backdrop itself
      if (e.target.closest('[data-action="close-roadmap"]') && (e.target.closest('.ov-modal-close') || e.target.classList.contains('ov-modal-backdrop'))) {
        S.state.roadmapOpen = false;
        S.state.valueOpen = false;
        S.state.lossOpen = false;
        S.state.detailOpen = null;
        S.state.impactOpen = false;
        S.state.methodOpen = false;
        render(); return;
      }

      if (e.target.closest('[data-action="open-project-modal"]')) {
        S.state.showProjectModal = true;
        render(); return;
      }

      if (e.target.closest('[data-action="open-training-modal"]')) {
        S.state.showTrainingModal = true;
        render(); return;
      }

      if (e.target.closest('[data-action="budget-edit"]')) {
        S.state.budgetEdit = !S.state.budgetEdit;
        render(); return;
      }

      const addBudgetBtn = e.target.closest('[data-budget-add]');
      if (addBudgetBtn) { S.increaseBudget(addBudgetBtn.dataset.budgetAdd); render(); return; }

      if (e.target.closest('[data-action="reset-budget"]')) {
        S.resetMonthlyBudget();
        render(); return;
      }

      const approveBtn = e.target.closest('[data-project-approve]');
      if (approveBtn) { S.setProjectStatus(approveBtn.dataset.projectApprove, 'Approved'); render(); return; }

      const declineBtn = e.target.closest('[data-project-decline]');
      if (declineBtn) { S.setProjectStatus(declineBtn.dataset.projectDecline, 'Declined'); render(); return; }

      const resetBtn = e.target.closest('[data-project-reset]');
      if (resetBtn) { S.setProjectStatus(resetBtn.dataset.projectReset, 'Pending'); render(); return; }

      const tApprove = e.target.closest('[data-train-approve]');
      if (tApprove) { S.setTrainingStatus(tApprove.dataset.trainApprove, 'Approved'); render(); return; }

      const tDecline = e.target.closest('[data-train-decline]');
      if (tDecline) { S.setTrainingStatus(tDecline.dataset.trainDecline, 'Declined'); render(); return; }

      const tReset = e.target.closest('[data-train-reset]');
      if (tReset) { S.setTrainingStatus(tReset.dataset.trainReset, 'Pending'); render(); return; }

      const licRealloc = e.target.closest('[data-lic-realloc]');
      if (licRealloc) { S.reallocateSeats(licRealloc.dataset.licRealloc); render(); return; }

      const licCancel = e.target.closest('[data-lic-cancel]');
      if (licCancel) { S.cancelUnusedSeats(licCancel.dataset.licCancel); render(); return; }

      if (e.target.closest('[data-action="reset-licenses"]')) {
        S.resetLicenseActions();
        render(); return;
      }

      const pf = e.target.closest('[data-proj-filter]');
      if (pf) { S.state.projectFilter = pf.dataset.projFilter; render(); return; }

      const tf = e.target.closest('[data-train-filter]');
      if (tf) { S.state.trainingFilter = tf.dataset.trainFilter; render(); return; }

      // Switching Department benchmark metric also syncs the 2026 trend metric
      const bm = e.target.closest('[data-bench-metric]');
      if (bm) {
        S.state.benchMetric = bm.dataset.benchMetric;
        S.state.trendMetric = bm.dataset.benchMetric === 'dailyPct' ? 'daily' : bm.dataset.benchMetric === 'trainedPct' ? 'trained' : 'weekly';
        render(); return;
      }

      // Clicking a department bar/row selects that department for the 2026 Progress graph!
      const deptSel = e.target.closest('[data-select-trend-dept]');
      if (deptSel) {
        const val = deptSel.dataset.selectTrendDept;
        if (val === 'all') {
          S.state.selectedTrendDept = null;
          S.state.filters.dept = 'all';
        } else if (S.canViewDept(val)) {
          S.state.selectedTrendDept = S.state.selectedTrendDept === val ? null : val;
          if (S.state.filters.dept !== 'all') S.state.filters.dept = val;
        }
        render(); return;
      }

      const tm = e.target.closest('[data-trend-metric]');
      if (tm) { S.state.trendMetric = tm.dataset.trendMetric; render(); return; }

      const navTab = e.target.closest('[data-nav-tab], [data-nav-card]');
      if (navTab) {
        const tab = navTab.dataset.navTab || navTab.dataset.navCard;
        if (S.state.activeTab === 'overview' && tab !== 'overview') {
          // Overview: details always open as a pop-up
          S.state.roadmapOpen = false;
          S.state.valueOpen = false;
          S.state.lossOpen = false;
          S.state.todoOpen = null;
          S.state.detailOpen = tab;
        } else {
          S.state.activeTab = tab;
        }
        render();
      }
    });

    el.viewRoot.addEventListener('change', e => {
      if (e.target.matches('[data-barrier-dept]')) {
        S.state.barrierDept = e.target.value;
        render();
      }
    });

    // Live name filter inside the delegate popover (no re-render, keeps focus)
    el.viewRoot.addEventListener('input', e => {
      if (!e.target.matches('[data-todo-search]')) return;
      const q = e.target.value.trim().toLowerCase();
      const list = e.target.parentElement.querySelector('[data-todo-results]');
      const quick = e.target.parentElement.querySelectorAll('.ov-pop-quick .ov-person');
      let hits = 0;
      list.querySelectorAll('.ov-person-row').forEach(b => {
        const show = !q || b.dataset.q.includes(q);
        b.hidden = !show;
        if (show) hits++;
      });
      quick.forEach(b => { b.hidden = !!q && !b.dataset.q.includes(q); if (!b.hidden && q) hits++; });
      list.querySelector('.ov-pop-none').hidden = hits > 0;
    });

    el.viewRoot.addEventListener('submit', e => {
      if (e.target.id === 'budget-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        S.setMonthlyBudget(fd.get('budgetAmount'));
        render();
      }
    });

    el.modalRoot.addEventListener('click', e => {
      if (e.target.closest('[data-action="close-modal"]') || e.target.classList.contains('modal-backdrop')) {
        closeModals();
      }
    });

    el.modalRoot.addEventListener('submit', e => {
      if (e.target.id === 'project-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        S.addProject({
          name: fd.get('name'),
          deptId: fd.get('deptId'),
          outcome: fd.get('outcome'),
          budget: fd.get('budget'),
          timeline: fd.get('timeline')
        });
        S.state.showProjectModal = false;
        render();
      } else if (e.target.id === 'training-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        S.addTraining({
          name: fd.get('name'),
          deptId: fd.get('deptId'),
          outcome: fd.get('outcome'),
          participants: fd.get('participants'),
          budget: fd.get('budget'),
          timeline: fd.get('timeline')
        });
        S.state.showTrainingModal = false;
        render();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModals();
        if (S.state.todoOpen) { S.state.todoOpen = null; render(); return; }
        if (S.state.roadmapOpen || S.state.valueOpen || S.state.lossOpen || S.state.detailOpen || S.state.impactOpen || S.state.methodOpen) { S.state.roadmapOpen = false; S.state.valueOpen = false; S.state.lossOpen = false; S.state.detailOpen = null; S.state.impactOpen = false; S.state.methodOpen = false; render(); }
        if (S.state.showSettings) { S.state.showSettings = false; render(); }
      }
    });

    window.addEventListener('beforeprint', () => {
      if (window.NUTEX_EXPORT && window.NUTEX_EXPORT.preparePrintHeader) {
        window.NUTEX_EXPORT.preparePrintHeader();
      }
    });

    if (window.NUTEX_ROADMAP) window.NUTEX_ROADMAP.bind(el.viewRoot);
    if (window.NUTEX_VALUE) window.NUTEX_VALUE.bind(el.viewRoot);
    if (window.NUTEX_ADOPTION) window.NUTEX_ADOPTION.bind(el.viewRoot);

    document.addEventListener('click', e => {
      if (!e.target.closest('#kpi-popover') && !e.target.closest('[data-kpi-info]')) hidePopover();
      if (S.state.todoOpen && !e.target.closest('.ov-todo-wrap')) {
        S.state.todoOpen = null;
        render();
      }
      if (S.state.showSettings && !e.target.closest('.settings-wrap')) {
        S.state.showSettings = false;
        render();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDom();
    bindEvents();
    render();
  });
})();
