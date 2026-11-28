/* ============================================================================
   NuTex Inc. — State, RBAC, Metrics & VP-to-CEO Project Approval Workflow
   ============================================================================ */

window.NUTEX_STATE = (() => {
  const D = window.NUTEX_DATA;
  const STORAGE_KEY = 'nutex_ai_projects_v2';
  const TRAIN_KEY = 'nutex_ai_trainings_v1';
  const BUDGET_KEY = 'nutex_ai_monthly_budget_v2';
  const THEME_KEY = 'nutex_ai_theme_v1';
  const LANG_KEY = 'nutex_ai_lang_v1';
  const DELEGATE_KEY = 'nutex_ai_delegations_v1';
  const DEFAULT_MONTHLY_BUDGET = 32000;

  function loadString(key, fallback) {
    try {
      if (typeof localStorage !== 'undefined') {
        const v = localStorage.getItem(key);
        if (v) return v;
      }
    } catch (_) {}
    return fallback;
  }

  function loadNumber(key, fallback) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = Number(localStorage.getItem(key));
        if (raw > 0) return raw;
      }
    } catch (_) {}
    return fallback;
  }

  function loadList(key, fallback) {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) return parsed;
        }
      }
    } catch (_) {}
    return JSON.parse(JSON.stringify(fallback));
  }

  function saveList(key, list) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (_) {}
  }

  const state = {
    activeTab: 'overview',          // overview | projects | trainings | licenses | budget | departments
    benchMetric: 'weeklyPct',       // weeklyPct | dailyPct | trainedPct
    trendMetric: 'weekly',          // weekly | daily | trained
    selectedTrendDept: null,        // null = follows global filter, or dept id clicked in Departments chart
    projectFilter: 'all',           // all | Pending | Approved | Blocked | Declined
    trainingFilter: 'all',          // all | Pending | Approved | Declined
    filters: {
      dept: 'all',
      timeframe: 'nov_2026'
    },
    roleId: 'ceo',
    rbac: JSON.parse(JSON.stringify(D.DEFAULT_RBAC)),
    projects: loadList(STORAGE_KEY, D.INITIAL_PROJECTS),
    trainings: loadList(TRAIN_KEY, D.INITIAL_TRAININGS),
    monthlyBudget: loadNumber(BUDGET_KEY, DEFAULT_MONTHLY_BUDGET),
    reallocatedSeats: 0,
    cancelledSeats: 0,
    theme: loadString(THEME_KEY, 'light'),
    lang: loadString(LANG_KEY, 'en'),
    showSettings: false,
    roadmapOpen: false,
    roadmapFilter: null,
    valueOpen: false,
    lossOpen: false,
    detailOpen: null,
    budgetEdit: false,
    barrierDept: null,
    impactOpen: false,
    methodOpen: false,
    usageDept: null,
    impactKpi: null,
    todoOpen: null,
    delegations: (() => {
      try { return JSON.parse(localStorage.getItem(DELEGATE_KEY) || '{}') || {}; } catch (_) { return {}; }
    })(),
    showProjectModal: false,
    showTrainingModal: false
  };

  function t(key, vars) {
    const dict = D.I18N[state.lang] || D.I18N.en;
    let str = dict[key] !== undefined ? dict[key] : (D.I18N.en[key] !== undefined ? D.I18N.en[key] : key);
    if (vars) {
      Object.keys(vars).forEach(k => { str = str.replace(`{${k}}`, vars[k]); });
    }
    return str;
  }

  function setTheme(mode) {
    state.theme = mode === 'dark' ? 'dark' : 'light';
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, state.theme); } catch (_) {}
  }

  function setDelegation(todoId, personId) {
    if (personId) state.delegations[todoId] = personId;
    else delete state.delegations[todoId];
    try { localStorage.setItem(DELEGATE_KEY, JSON.stringify(state.delegations)); } catch (_) {}
  }

  function setLang(lang) {
    state.lang = lang === 'de' ? 'de' : 'en';
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(LANG_KEY, state.lang); } catch (_) {}
  }

  const r1 = (n) => Math.round(n * 10) / 10;
  const r2 = (n) => Math.round(n * 100) / 100;

  function getRole() { return D.ROLES.find(r => r.id === state.roleId) || D.ROLES[0]; }
  function getPerms() { return state.rbac[state.roleId] || D.DEFAULT_RBAC.ceo; }

  function canViewDept(deptId) {
    const role = getRole();
    return role.isCEO || getPerms().allDepts || role.ownDepts.includes(deptId);
  }

  function canViewFinancials() {
    return !!getPerms().financials;
  }

  function getAccessibleDepts() { return D.DEPARTMENTS.filter(d => canViewDept(d.id)); }

  function getFilteredDepts() {
    const acc = getAccessibleDepts();
    if (state.filters.dept === 'all') return acc;
    const match = acc.filter(d => d.id === state.filters.dept);
    return match.length ? match : acc;
  }

  // Weekly-use target = AI target group ÷ employees (per department or summed for a scope)
  function weeklyTarget(depts) {
    const list = (depts && depts.length ? depts : D.DEPARTMENTS).map(d => (d.dept ? d.dept : d));
    const emp = list.reduce((a, d) => a + d.employees, 0) || 1;
    return Math.round((list.reduce((a, d) => a + (d.targetUsers || d.employees), 0) / emp) * 100);
  }

  function getStatus(actual, target, lowerIsBetter = false) {
    if (!target) return { level: 'green', label: t('on_track'), gapPct: 0 };
    const att = lowerIsBetter
      ? (target / Math.max(actual, 0.01)) * 100
      : (actual / target) * 100;
    const gapPct = lowerIsBetter
      ? r1(((target - actual) / target) * 100)
      : r1(((actual - target) / target) * 100);
    if (att >= D.THRESHOLDS.green) return { level: 'green', label: t('on_track'), gapPct };
    if (att >= D.THRESHOLDS.yellow) return { level: 'yellow', label: t('watch'), gapPct };
    return { level: 'red', label: t('action_needed'), gapPct };
  }

  // --- VP → CEO Project Proposal & Approval Actions ---
  function addProject({ name, deptId, outcome, budget, timeline }) {
    const role = getRole();
    const cleanName = String(name || '').trim();
    const cleanOutcome = String(outcome || '').trim();
    if (!cleanName || !cleanOutcome) return false;

    const proj = {
      id: 'p_' + Date.now(),
      name: cleanName,
      deptId: deptId || role.ownDepts[0] || 'rd',
      owner: role.name,
      outcome: cleanOutcome,
      budget: Math.max(0, Number(budget) || 0),
      timeline: String(timeline || 'Q1 2027').trim(),
      status: role.isCEO ? 'Approved' : 'Pending'
    };
    state.projects.unshift(proj);
    saveList(STORAGE_KEY, state.projects);
    return true;
  }

  function setProjectStatus(projectId, newStatus) {
    if (!getRole().isCEO) return;
    const item = state.projects.find(p => p.id === projectId);
    if (!item) return;
    item.status = newStatus;
    saveList(STORAGE_KEY, state.projects);
  }

  function getVisibleProjects() {
    const allowedIds = getFilteredDepts().map(d => d.id);
    return state.projects.filter(p => allowedIds.includes(p.deptId));
  }

  // --- VP → CEO Training Request & Approval Actions ---
  function addTraining({ name, deptId, outcome, participants, budget, timeline }) {
    const role = getRole();
    const cleanName = String(name || '').trim();
    const cleanOutcome = String(outcome || '').trim();
    if (!cleanName || !cleanOutcome) return false;

    const item = {
      id: 't_' + Date.now(),
      name: cleanName,
      deptId: deptId || role.ownDepts[0] || 'rd',
      owner: role.name,
      outcome: cleanOutcome,
      participants: Math.max(1, Number(participants) || 10),
      budget: Math.max(0, Number(budget) || 0),
      timeline: String(timeline || 'Q1 2027').trim(),
      status: role.isCEO ? 'Approved' : 'Pending'
    };
    state.trainings.unshift(item);
    saveList(TRAIN_KEY, state.trainings);
    return true;
  }

  function setTrainingStatus(trainingId, newStatus) {
    if (!getRole().isCEO) return;
    const item = state.trainings.find(t => t.id === trainingId);
    if (!item) return;
    item.status = newStatus;
    saveList(TRAIN_KEY, state.trainings);
  }

  function getVisibleTrainings() {
    const allowedIds = getFilteredDepts().map(d => d.id);
    return state.trainings.filter(t => allowedIds.includes(t.deptId));
  }

  // Privacy-preserving Team Grouping (< 10 employees merged automatically)
  function getPrivacyTeams(dept) {
    const tf = D.TIMEFRAMES[state.filters.timeframe] || D.TIMEFRAMES.nov_2026;
    const visible = [];
    const small = [];

    dept.teams.forEach(t => {
      if (t.employees >= 10) {
        visible.push({
          ...t,
          isGrouped: false,
          weeklyPct: Math.round(t.weeklyPct * tf.factor),
          dailyPct: Math.round(t.dailyPct * tf.factor),
          trainedPct: Math.round(t.trainedPct * (0.35 + 0.65 * tf.factor))
        });
      } else {
        small.push(t);
      }
    });

    if (small.length > 0) {
      const emp = small.reduce((s, t) => s + t.employees, 0);
      const wAvg = (fn) => small.reduce((s, t) => s + fn(t) * t.employees, 0) / emp;
      visible.push({
        name: `Grouped Small Teams (${small.length} <10)`,
        employees: emp,
        isGrouped: true,
        weeklyPct: Math.round(wAvg(t => t.weeklyPct) * tf.factor),
        dailyPct: Math.round(wAvg(t => t.dailyPct) * tf.factor),
        trainedPct: Math.round(wAvg(t => t.trainedPct) * (0.35 + 0.65 * tf.factor))
      });
    }
    return visible;
  }

  // ---------- Adoption history per department (Jan–Nov) ----------
  // Built from the company series: each department gets only the change events it was part of
  // (split by headcount, largest remainder so shares add up exactly) plus its share of organic
  // growth. Nov values equal each department's live figures; the company curve is the sum.
  function allocInt(total, weights) {
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    const raw = weights.map(w => (total * w) / sum);
    const base = raw.map(v => (total >= 0 ? Math.floor(v) : Math.ceil(v)));
    let rest = total - base.reduce((a, b) => a + b, 0);
    const order = raw.map((v, i) => [Math.abs(v - base[i]), i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; rest !== 0 && k < order.length; k++) {
      base[order[k][1]] += Math.sign(rest);
      rest -= Math.sign(rest);
    }
    return base;
  }

  let ADOPT = null;
  function adoption() {
    if (ADOPT) return ADOPT;
    const C = D.ADOPTION_2026;
    const n = C.labels.length;
    const depts = D.DEPARTMENTS;
    const idx = Object.fromEntries(depts.map((d, i) => [d.id, i]));
    const novW = depts.map(d => d.weeklyUsers);
    const novT = depts.map(d => d.trainedEmployees);
    // licensed employees per department (fixed in data, never above the target group)
    const novL = depts.map((d, i) => d.licensedUsers !== undefined ? d.licensedUsers : allocInt(C.licensed[n - 1], depts.map((x, j) => novW[j] + novT[j]))[i]);
    const nov = { weekly: novW, trained: novT, licensed: novL };

    // per event: integer share per department for each field
    const events = C.events.map(e => {
      const w = e.depts.map(id => depts[idx[id]].employees);
      const share = {};
      ['weekly', 'trained', 'licensed', 'recovered'].forEach(f => {
        const parts = allocInt(e[f] || 0, w);
        share[f] = Object.fromEntries(e.depts.map((id, k) => [id, parts[k]]));
      });
      return { ...e, at: Math.ceil(e.m), share };
    });

    const perDept = Object.fromEntries(depts.map(d => [d.id, { target: d.targetUsers, employees: d.employees }]));
    ['weekly', 'trained', 'licensed'].forEach(f => {
      const comp = C[f];
      const evAt = Array(n).fill(0);
      events.forEach(e => { evAt[e.at] += e[f] || 0; });
      const cumOrg = [0];
      for (let i = 1; i < n; i++) cumOrg[i] = cumOrg[i - 1] + (comp[i] - comp[i - 1] - evAt[i]);
      const orgTotal = cumOrg[n - 1] || 1;
      const start = allocInt(comp[0], nov[f]);
      depts.forEach((d, di) => {
        const evCum = Array(n).fill(0);
        events.forEach(e => { if (e.share[f][d.id] !== undefined) for (let i = e.at; i < n; i++) evCum[i] += e.share[f][d.id]; });
        const o = (nov[f][di] - start[di] - evCum[n - 1]) / orgTotal;
        perDept[d.id][f] = cumOrg.map((c, i) => {
          const v = i === n - 1 ? nov[f][di] : start[di] + Math.round(o * c) + evCum[i];
          return Math.max(0, Math.min(d.employees, v));
        });
      });
    });
    // a weekly AI user always holds a license: licensed >= weekly in every month
    depts.forEach(d => {
      const h = perDept[d.id];
      h.licensed = h.licensed.map((v, i) => Math.max(v, h.weekly[i]));
    });
    ADOPT = { labels: C.labels, perDept, events };
    return ADOPT;
  }

  function tfIndex(tf) {
    const key = Object.keys(D.TIMEFRAMES).find(k => D.TIMEFRAMES[k] === tf);
    const i = D.TREND_2026.keys.indexOf(key);
    return i < 0 ? D.TREND_2026.keys.length - 1 : i;
  }

  function computeDept(dept, tf) {
    let purchased = 0, assigned = 0, activeSeats = 0, monthlyCost = 0;
    const seatScale = 0.42 + 0.58 * tf.factor;
    D.TOOLS.forEach(tDef => {
      const s = dept.seats[tDef.id] || { purchased: 0, assigned: 0, active: 0 };
      const p = Math.round(s.purchased * seatScale);
      const a = Math.min(p, Math.round(s.assigned * (0.40 + 0.60 * tf.factor)));
      const act = Math.min(a, Math.round(s.active * tf.factor));
      purchased += p; assigned += a; activeSeats += act;
      monthlyCost += p * tDef.costPerSeat;
    });

    // Weekly users & trained come from the adoption history (same numbers as the loss timeline)
    const hist = adoption().perDept[dept.id];
    const mi = tfIndex(tf);
    const weeklyUsers = hist ? hist.weekly[mi] : Math.round(dept.weeklyUsers * tf.factor);
    const prevWeekly = hist ? hist.weekly[Math.max(0, mi - 1)] : Math.round(dept.weeklyUsers * tf.prevFactor);
    const dailyUsers = Math.min(weeklyUsers, Math.round(dept.dailyUsers * tf.factor));
    const weeklyPct = Math.round((weeklyUsers / dept.employees) * 100);
    const dailyPct = Math.round((dailyUsers / dept.employees) * 100);
    const trainedCount = hist ? hist.trained[mi] : Math.min(dept.employees, Math.round(dept.trainedEmployees * (0.35 + 0.65 * tf.factor)));
    const trainedPct = Math.round((trainedCount / dept.employees) * 100);
    const unusedLicenses = Math.max(0, purchased - activeSeats);
    const licenseActivePct = purchased > 0 ? Math.round((activeSeats / purchased) * 100) : 0;
    const unusedCostMo = purchased > 0 ? Math.round((unusedLicenses / purchased) * monthlyCost) : 0;
    const errorRatePct = r1(4.2 - (4.2 - dept.errorRatePct) * tf.factor);
    const cycleDays = r1(5.0 - (5.0 - dept.cycleDays) * tf.factor);
    const tokensM = r1((dept.tokensM || 0) * tf.factor);
    const tokenRate = dept.tokenRate || 50;
    const tokenCostMo = Math.round(tokensM * tokenRate);

    return {
      dept,
      employees: dept.employees,
      targetUsers: dept.targetUsers || dept.employees,
      dataSourcesReady: dept.dataSourcesReady,
      dataSourcesTotal: dept.dataSourcesTotal,
      weeklyUsers, weeklyPct,
      weeklyPrevPct: Math.round((prevWeekly / dept.employees) * 100),
      dailyUsers, dailyPct,
      trainedCount, trainedPct,
      untrainedCount: dept.employees - trainedCount,
      purchased, assigned, activeSeats, unusedLicenses,
      openRequests: dept.openRequests,
      licenseActivePct,
      monthlyCost, unusedCostMo,
      costPerActive: activeSeats > 0 ? Math.round(monthlyCost / activeSeats) : 0,
      tokensM, tokenRate, tokenCostMo,
      hoursSavedMo: Math.round(dept.hoursSavedMo * tf.factor),
      costSavedMo: Math.round(dept.costSavedMo * tf.factor),
      errorRatePct, cycleDays
    };
  }

  function computeMetrics() {
    const tf = D.TIMEFRAMES[state.filters.timeframe] || D.TIMEFRAMES.nov_2026;
    const depts = getFilteredDepts();
    const rows = depts.map(d => computeDept(d, tf));
    const totalEmp = rows.reduce((s, r) => s + r.employees, 0) || 1;
    const wAvg = (fn) => rows.reduce((s, r) => s + fn(r) * r.employees, 0) / totalEmp;

    const targetUsers = rows.reduce((s, r) => s + r.targetUsers, 0);
    const weeklyUsers = rows.reduce((s, r) => s + r.weeklyUsers, 0);
    const dailyUsers = rows.reduce((s, r) => s + r.dailyUsers, 0);
    const trainedCount = rows.reduce((s, r) => s + r.trainedCount, 0);
    const rawPurchased = rows.reduce((s, r) => s + r.purchased, 0);
    const rawAssigned = rows.reduce((s, r) => s + r.assigned, 0);
    const rawActive = rows.reduce((s, r) => s + r.activeSeats, 0);
    const rawRequests = rows.reduce((s, r) => s + r.openRequests, 0);
    const rawMonthlyCost = rows.reduce((s, r) => s + r.monthlyCost, 0);

    // Apply live CEO/VP license actions (Reallocate / Cancel)
    const scopeShare = totalEmp / 300;
    const appliedCancel = Math.min(Math.max(0, rawPurchased - rawActive), Math.round(state.cancelledSeats * scopeShare));
    const purchased = Math.max(rawActive, rawPurchased - appliedCancel);
    const appliedRealloc = Math.min(Math.max(0, purchased - rawActive), rawRequests, Math.round(state.reallocatedSeats * scopeShare));
    const activeSeats = rawActive + appliedRealloc;
    const assigned = Math.min(purchased, Math.max(activeSeats, rawAssigned));
    const unusedLicenses = Math.max(0, purchased - activeSeats);
    const openRequests = Math.max(0, rawRequests - appliedRealloc);
    const avgSeatPrice = rawPurchased > 0 ? rawMonthlyCost / rawPurchased : 36;
    const monthlyCost = Math.max(0, Math.round(rawMonthlyCost - appliedCancel * avgSeatPrice));
    const unusedCostMo = purchased > 0 ? Math.round((unusedLicenses / purchased) * monthlyCost) : 0;

    const hoursSavedMo = rows.reduce((s, r) => s + r.hoursSavedMo, 0);
    const costSavedMo = rows.reduce((s, r) => s + r.costSavedMo, 0);
    const dataSourcesReady = rows.reduce((s, r) => s + r.dataSourcesReady, 0);
    const dataSourcesTotal = rows.reduce((s, r) => s + r.dataSourcesTotal, 0);

    const seatScale = 0.42 + 0.58 * tf.factor;
    const toolUsage = D.TOOLS.map(t => {
      let p = 0, a = 0, act = 0;
      rows.forEach(dr => {
        const s = dr.dept.seats[t.id];
        if (!s) return;
        const pp = Math.round(s.purchased * seatScale);
        const aa = Math.min(pp, Math.round(s.assigned * (0.40 + 0.60 * tf.factor)));
        const ac = Math.min(aa, Math.round(s.active * tf.factor));
        p += pp; a += aa; act += ac;
      });
      return { id: t.id, name: t.name, purchased: p, active: act, activePct: p > 0 ? Math.round((act / p) * 100) : 0 };
    }).filter(t => t.purchased > 0);

    const projects = getVisibleProjects();
    const pendingProjects = projects.filter(p => p.status === 'Pending');
    const approvedProjects = projects.filter(p => p.status === 'Approved');
    const blockedProjects = projects.filter(p => p.status === 'Blocked');

    const trainings = getVisibleTrainings();
    const pendingTrainings = trainings.filter(t => t.status === 'Pending');
    const approvedTrainings = trainings.filter(t => t.status === 'Approved');

    // Monthly Budget & Live Spend (Licenses + API Tokens + Approved Projects & Trainings)
    const totalTokensM = r1(rows.reduce((s, r) => s + r.tokensM, 0));
    const tokenSpendMo = rows.reduce((s, r) => s + r.tokenCostMo, 0);
    const avgTokenRate = totalTokensM > 0 ? Math.round(tokenSpendMo / totalTokensM) : 50;

    // Budget follows each department's planned share (not headcount); all departments = 100 %
    const budgetShare = depts.length === D.DEPARTMENTS.length ? 1 : depts.reduce((sum, d) => sum + (d.budgetShare || d.employees / 300), 0);
    const budgetLimit = Math.round(state.monthlyBudget * budgetShare);
    const licenseSpendMo = monthlyCost;
    const projectSpendMo = Math.round((approvedProjects.reduce((s, p) => s + (p.budget || 0), 0) / 12) * tf.factor);
    const trainingSpendMo = Math.round((approvedTrainings.reduce((s, t) => s + (t.budget || 0), 0) / 6) * tf.factor);
    const totalSpendMo = licenseSpendMo + tokenSpendMo + projectSpendMo + trainingSpendMo;
    const budgetRemaining = budgetLimit - totalSpendMo;
    const budgetUsedPct = budgetLimit > 0 ? Math.round((totalSpendMo / budgetLimit) * 100) : 0;

    const weeklyPct = Math.round((weeklyUsers / totalEmp) * 100);
    const dailyPct = Math.round((dailyUsers / totalEmp) * 100);
    const trainedPct = Math.round((trainedCount / totalEmp) * 100);
    const licenseActivePct = purchased > 0 ? Math.round((activeSeats / purchased) * 100) : 0;
    const errorRatePct = r1(wAvg(r => r.errorRatePct));
    const cycleDays = r1(wAvg(r => r.cycleDays));

    return {
      tf, totalEmp, targetUsers, targetUsersPct: Math.round((targetUsers / totalEmp) * 100), deptCount: rows.length, rows, toolUsage,
      projects, pendingProjects, approvedProjects, blockedProjects,
      trainings, pendingTrainings, approvedTrainings,
      dataSourcesReady, dataSourcesTotal,
      weeklyUsers, weeklyPct, weeklyPrevPct: Math.round(wAvg(r => r.weeklyPrevPct)),
      dailyUsers, dailyPct,
      trainedCount, trainedPct, untrainedCount: totalEmp - trainedCount,
      purchased, assigned, activeSeats, unusedLicenses, openRequests,
      licenseActivePct,
      monthlyCost, unusedCostMo,
      costPerActive: activeSeats > 0 ? Math.round(monthlyCost / activeSeats) : 0,
      totalTokensM, tokenSpendMo, avgTokenRate,
      budgetLimit, licenseSpendMo, projectSpendMo, trainingSpendMo, totalSpendMo, budgetRemaining, budgetUsedPct,
      hoursSavedMo, costSavedMo,
      errorRatePct,
      errorDropPct: Math.round(((4.2 - errorRatePct) / 4.2) * 100),
      cycleDays
    };
  }

  // Dynamic 11-Month Trend (Jan–Nov 2026) for selected department (or all visible)
  function computeTrendSeries(metricKey) {
    const activeDeptId = state.filters.dept !== 'all' ? state.filters.dept : state.selectedTrendDept;
    let scopeDepts = getAccessibleDepts();
    let scopeLabel = t('all_depts_short');

    if (activeDeptId && canViewDept(activeDeptId)) {
      const match = D.DEPARTMENTS.find(d => d.id === activeDeptId);
      if (match) {
        scopeDepts = [match];
        scopeLabel = match.name;
      }
    }

    const totalEmp = scopeDepts.reduce((s, d) => s + d.employees, 0) || 1;
    const actual = D.TREND_2026.keys.map(tfKey => {
      const tf = D.TIMEFRAMES[tfKey];
      const rows = scopeDepts.map(d => computeDept(d, tf));
      if (metricKey === 'daily') {
        const sum = rows.reduce((s, r) => s + r.dailyUsers, 0);
        return Math.round((sum / totalEmp) * 100);
      }
      if (metricKey === 'trained') {
        const sum = rows.reduce((s, r) => s + r.trainedCount, 0);
        return Math.round((sum / totalEmp) * 100);
      }
      const sum = rows.reduce((s, r) => s + r.weeklyUsers, 0);
      return Math.round((sum / totalEmp) * 100);
    });

    const cfg = D.TREND_2026[metricKey] || D.TREND_2026.weekly;
    const labels = state.lang === 'de' ? D.TREND_2026.labelsDe : D.TREND_2026.labelsEn;
    return {
      labels,
      actual,
      target: cfg.target,
      scopeLabel,
      activeDeptId
    };
  }

  function hasActiveFilters() {
    if (state.activeTab === 'projects') return state.filters.dept !== 'all';
    return state.filters.dept !== 'all' || state.filters.timeframe !== 'nov_2026';
  }

  function resetFilters() {
    state.filters = { dept: 'all', timeframe: 'nov_2026' };
    state.selectedTrendDept = null;
  }

  function setRole(roleId) {
    state.roleId = roleId;
    state.filters.dept = 'all';
    state.selectedTrendDept = null;
    if (state.activeTab === 'budget' && !canViewFinancials()) {
      state.activeTab = 'overview';
    }
  }

  function reallocateSeats(count) {
    state.reallocatedSeats += Math.max(0, Number(count) || 0);
  }

  function cancelUnusedSeats(count) {
    state.cancelledSeats += Math.max(0, Number(count) || 0);
  }

  function resetLicenseActions() {
    state.reallocatedSeats = 0;
    state.cancelledSeats = 0;
  }

  function setMonthlyBudget(amount) {
    if (!getRole().isCEO) return;
    const val = Math.max(5000, Math.round(Number(amount) || 0));
    state.monthlyBudget = val;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(BUDGET_KEY, String(val)); } catch (_) {}
  }

  function increaseBudget(delta) {
    setMonthlyBudget(state.monthlyBudget + Number(delta || 0));
  }

  function resetMonthlyBudget() {
    setMonthlyBudget(DEFAULT_MONTHLY_BUDGET);
  }

  // Monthly Culture Pulse Survey (5 questions + top requested tools ranking)
  function computeCulture() {
    const tf = D.TIMEFRAMES[state.filters.timeframe] || D.TIMEFRAMES.nov_2026;
    const depts = getFilteredDepts();
    const scale = 0.72 + 0.28 * tf.factor; // culture improves steadily across 2026

    let totalEmp = 0;
    let totalResponses = 0;
    const qWeighted = {};
    D.CULTURE_SURVEY.questions.forEach(q => { qWeighted[q.id] = 0; });

    const wishTotals = {};
    D.CULTURE_SURVEY.wishTools.forEach(w => { wishTotals[w.id] = 0; });

    depts.forEach(d => {
      const c = D.CULTURE_SURVEY.byDept[d.id];
      if (!c) return;
      totalEmp += d.employees;
      const resp = Math.round(d.employees * c.responseRate * (0.85 + 0.15 * tf.factor));
      totalResponses += resp;
      D.CULTURE_SURVEY.questions.forEach(q => {
        qWeighted[q.id] += Math.min(98, Math.round(c.scores[q.id] * scale)) * d.employees;
      });
      D.CULTURE_SURVEY.wishTools.forEach(w => {
        wishTotals[w.id] += Math.round((c.wishes[w.id] || 0) * (0.55 + 0.45 * tf.factor));
      });
    });

    const empDiv = totalEmp || 1;
    const questions = D.CULTURE_SURVEY.questions.map(q => ({
      id: q.id,
      label: state.lang === 'de' ? q.de : q.en,
      pct: Math.round(qWeighted[q.id] / empDiv)
    }));

    const overallPct = Math.round(questions.reduce((s, q) => s + q.pct, 0) / questions.length);

    const wishRanking = D.CULTURE_SURVEY.wishTools
      .map(w => ({ id: w.id, name: w.name, votes: wishTotals[w.id] || 0 }))
      .sort((a, b) => b.votes - a.votes);

    const deptScores = getAccessibleDepts().map(d => {
      const c = D.CULTURE_SURVEY.byDept[d.id];
      const avg = Math.round(
        (D.CULTURE_SURVEY.questions.reduce((s, q) => s + Math.min(98, Math.round(c.scores[q.id] * scale)), 0)) / D.CULTURE_SURVEY.questions.length
      );
      return { id: d.id, name: d.name, pct: avg };
    }).sort((a, b) => b.pct - a.pct);

    const tfOrder = [
      'jan_2026', 'feb_2026', 'mar_2026', 'apr_2026', 'may_2026', 'jun_2026',
      'jul_2026', 'aug_2026', 'sep_2026', 'oct_2026', 'nov_2026'
    ];
    const trendActual = tfOrder.map(tfKey => {
      const mTf = D.TIMEFRAMES[tfKey];
      const mScale = 0.72 + 0.28 * mTf.factor;
      let weightedSum = 0;
      depts.forEach(d => {
        const c = D.CULTURE_SURVEY.byDept[d.id];
        if (!c) return;
        const dAvg = D.CULTURE_SURVEY.questions.reduce(
          (s, q) => s + Math.min(98, Math.round(c.scores[q.id] * mScale)), 0
        ) / D.CULTURE_SURVEY.questions.length;
        weightedSum += dAvg * d.employees;
      });
      return Math.round(weightedSum / empDiv);
    });
    const trendLabels = state.lang === 'de' ? D.TREND_2026.labelsDe : D.TREND_2026.labelsEn;
    const scopeLabel = depts.length === 1 ? depts[0].name : t('all_depts_short');

    return {
      tf,
      totalEmp,
      totalResponses,
      responsePct: Math.round((totalResponses / empDiv) * 100),
      overallPct,
      questions,
      wishRanking,
      deptScores,
      trend: { labels: trendLabels, actual: trendActual, target: 75, scopeLabel }
    };
  }

  return {
    state, r1, r2, t, setTheme, setLang, setDelegation,
    getRole, getPerms, canViewDept, canViewFinancials, getAccessibleDepts, getFilteredDepts, adoption,
    getStatus, weeklyTarget, addProject, setProjectStatus, getVisibleProjects,
    addTraining, setTrainingStatus, getVisibleTrainings,
    reallocateSeats, cancelUnusedSeats, resetLicenseActions,
    setMonthlyBudget, increaseBudget, resetMonthlyBudget,
    computeTrendSeries, computeCulture, getPrivacyTeams, computeDept, computeMetrics,
    hasActiveFilters, resetFilters, setRole
  };
})();
