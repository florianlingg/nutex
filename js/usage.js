/* ============================================================================
   NuTex Inc. — Level 2: "Who uses AI — and how deeply?"
   Opened from the "Weekly use by department" tile.
   Left: department list (All on top, then by gap to target) with trend.
   Right: KPIs, usage ladder over the target group, trend Jan → now and
   team breakdown for the selected department.
   Ladder: target group = power + regular + occasional + inactive + no license.
   ============================================================================ */

window.NUTEX_USAGE = (() => {
  const D = window.NUTEX_DATA;
  const S = window.NUTEX_STATE;
  const DAYS = { power: 4.2, regular: 1.6 }; // avg active days per week

  const STEPS = [
    { id: 'power',      label: 'Power',      hint: 'AI on 3+ days / week',          color: 'var(--c-navy)' },
    { id: 'regular',    label: 'Regular',    hint: 'weekly, not daily',            color: 'var(--c-primary)' },
    { id: 'occasional', label: 'Occasional', hint: 'monthly, not weekly',          color: 'var(--c-primary-300)' },
    { id: 'inactive',   label: 'Inactive',   hint: 'license, no use in 30 days',   color: 'var(--c-primary-200)' },
    { id: 'nolicense',  label: 'No license', hint: 'in target group, no license',  color: 'var(--track)' }
  ];

  const monthIdx = () => {
    const i = D.TREND_2026.keys.indexOf(S.state.filters.timeframe);
    return i < 0 ? D.TREND_2026.keys.length - 1 : i;
  };

  // Ladder for one department at month index mi
  function deptLadder(dept, mi) {
    const H = S.adoption().perDept[dept.id];
    const tf = D.TIMEFRAMES[D.TREND_2026.keys[mi]];
    const T = dept.targetUsers;
    const W = Math.min(H.weekly[mi], T);
    const L = Math.max(W, Math.min(H.licensed[mi], T));
    const P = Math.min(W, S.computeDept(dept, tf).dailyUsers);
    const nov = H.weekly[H.weekly.length - 1] || 1;
    const O = Math.min(L - W, Math.round((dept.occasionalUsers || 0) * (W / nov)));
    return {
      target: T, employees: dept.employees, weekly: W, licensed: L,
      power: P, regular: W - P, occasional: O, inactive: L - W - O, nolicense: T - L
    };
  }

  function sum(ids, mi) {
    const acc = { target: 0, employees: 0, weekly: 0, licensed: 0, power: 0, regular: 0, occasional: 0, inactive: 0, nolicense: 0 };
    ids.forEach(id => {
      const l = deptLadder(D.DEPARTMENTS.find(d => d.id === id), mi);
      Object.keys(acc).forEach(k => { acc[k] += l[k]; });
    });
    return acc;
  }

  const pct = (n, d) => Math.round((n / Math.max(1, d)) * 100);
  const activeDays = (l) => (l.weekly ? (l.power * DAYS.power + l.regular * DAYS.regular) / l.weekly : 0);
  const lvl = (v, t) => (v >= t ? 'green' : v >= t - 15 ? 'yellow' : 'red');
  const tgt = (ids) => S.weeklyTarget(ids.map(id => D.DEPARTMENTS.find(d => d.id === id)));

  function spark(values, TARGET) {
    const w = 72;
    const h = 22;
    const lo = Math.min(...values, 0);
    const hi = Math.max(...values, TARGET);
    const x = (i) => 1 + (i / Math.max(1, values.length - 1)) * (w - 2);
    const y = (v) => h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4);
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <line x1="0" x2="${w}" y1="${y(TARGET)}" y2="${y(TARGET)}" stroke="var(--c-neutral)" stroke-dasharray="2 2" stroke-width="1"/>
      <polyline points="${values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--c-primary)" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>`;
  }

  function trend(ids, mi) {
    const TARGET = tgt(ids);
    const W = 640;
    const H = 150;
    const L = 34;
    const R = 628;
    const T = 12;
    const B = 122;
    const labels = D.TREND_2026.labelsEn.map(l => l.split(' ')[0]);
    const rows = labels.slice(0, mi + 1).map((_, i) => sum(ids, i));
    const wk = rows.map(r => pct(r.weekly, r.employees));
    const pw = rows.map(r => pct(r.power, r.employees));
    const x = (i) => L + (i / (labels.length - 1)) * (R - L);
    const y = (v) => B - (v / 100) * (B - T);
    const line = (vals, col, wd) => `<polyline points="${vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linejoin="round" stroke-linecap="round"/>`;
    return `
      <svg class="us-trend" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${[0, 50, 100].map(v => `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="central" font-size="10" fill="var(--text-3)">${v}%</text>`).join('')}
        <line x1="${L}" x2="${R}" y1="${y(TARGET)}" y2="${y(TARGET)}" stroke="var(--c-neutral)" stroke-dasharray="5 4" stroke-width="1.2"/>
        <text x="${R}" y="${y(TARGET) - 5}" text-anchor="end" font-size="10" fill="var(--text-3)">target ${TARGET}%</text>
        <polygon points="${x(0)},${B} ${wk.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} ${x(wk.length - 1)},${B}" fill="var(--c-primary-050)"/>
        ${line(wk, 'var(--c-primary)', 2.4)}
        ${line(pw, 'var(--c-navy)', 1.8)}
        <text x="${x(wk.length - 1) - 6}" y="${y(wk[wk.length - 1]) - 7}" text-anchor="end" font-size="10.5" font-weight="800" fill="var(--c-primary)">${wk[wk.length - 1]}%</text>
        <text x="${x(pw.length - 1) - 6}" y="${y(pw[pw.length - 1]) + 14}" text-anchor="end" font-size="10.5" font-weight="800" fill="var(--c-navy)">${pw[pw.length - 1]}%</text>
        ${labels.map((l, i) => (i % 2 ? '' : `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="${i <= mi ? 'var(--text-3)' : 'var(--border-hover)'}">${l}</text>`)).join('')}
      </svg>
    `;
  }

  function teams(ids) {
    const list = [];
    ids.forEach(id => {
      const d = D.DEPARTMENTS.find(x => x.id === id);
      S.getPrivacyTeams(d).forEach(t => list.push({ ...t, dept: d.name, target: S.weeklyTarget([d]) }));
    });
    const shown = ids.length > 1 ? list.sort((a, b) => (a.weeklyPct - a.target) - (b.weeklyPct - b.target)).slice(0, 6) : list.sort((a, b) => b.weeklyPct - a.weeklyPct);
    return { title: ids.length > 1 ? 'Lowest teams company-wide' : 'Teams', rows: shown };
  }

  function render() {
    const mi = monthIdx();
    const visible = S.getAccessibleDepts().map(d => d.id);
    const sel = S.state.usageDept && (S.state.usageDept === 'all' || visible.includes(S.state.usageDept))
      ? S.state.usageDept
      : (S.state.filters.dept !== 'all' ? S.state.filters.dept : 'all');
    const ids = sel === 'all' ? visible : [sel];

    const rowFor = (id) => {
      const rIds = id === 'all' ? visible : [id];
      const now = sum(rIds, mi);
      const prev = sum(rIds, Math.max(0, mi - 1));
      const series = Array.from({ length: mi + 1 }, (_, i) => { const r = sum(rIds, i); return pct(r.weekly, r.employees); });
      return { id, name: id === 'all' ? 'All departments' : D.DEPARTMENTS.find(d => d.id === id).name, pct: pct(now.weekly, now.employees), target: tgt(rIds), delta: pct(now.weekly, now.employees) - pct(prev.weekly, prev.employees), series };
    };
    const deptRows = visible.map(rowFor).sort((a, b) => (a.pct - a.target) - (b.pct - b.target));
    const list = [rowFor('all'), ...deptRows];

    const l = sum(ids, mi);
    const wkPct = pct(l.weekly, l.employees);
    const days = activeDays(l);
    const notWeekly = l.target - l.weekly;
    const breadth = notWeekly / Math.max(1, l.target);
    const depth = l.regular / Math.max(1, l.weekly);
    const tm = teams(ids);
    const lowTeam = tm.rows.slice().sort((a, b) => (a.weeklyPct - a.target) - (b.weeklyPct - b.target))[0];
    const name = sel === 'all' ? 'Company' : D.DEPARTMENTS.find(d => d.id === sel).name;
    const takeaway = breadth >= 0.15
      ? `<strong>Breadth issue:</strong> ${notWeekly} of ${l.target} in the target group don't use AI weekly${l.inactive ? ` (${l.inactive} licensed but inactive)` : ''} → training & licenses first.`
      : depth >= 0.5
        ? `<strong>Depth issue:</strong> ${pct(l.regular, l.weekly)}% of users only use AI weekly → role-specific use cases & AI champions.`
        : `<strong>Healthy:</strong> broad use and ${pct(l.power, l.weekly)}% power users.`;

    return `
      <div class="us">
        <div class="ip-head">
          <span class="b2-q">Who uses AI — and how deeply?</span>
          <span class="ip-sum">weekly users as % of employees · target = AI target group per department (McKinsey 2026)</span>
        </div>
        <div class="us-grid">
          <div class="ip-list ip-clean us-list">
            ${list.map((r, i) => `
              <button type="button" class="ip-row ${r.id === sel ? 'is-sel' : ''} ${i === 0 ? 'us-all' : ''}" data-action="usage-dept" data-dept="${r.id}">
                <span class="ip-row-main"><strong>${r.name}</strong><small>target ${r.target}% · <span class="${r.delta >= 0 ? 'text-green' : 'text-red'}">${r.delta >= 0 ? '+' : ''}${r.delta} pp</span></small></span>
                ${spark(r.series, r.target)}
                <b class="text-${lvl(r.pct, r.target)}">${r.pct}%</b>
              </button>
            `).join('')}
          </div>

          <div class="us-detail">
            <div class="us-kpis">
              <div><span>Weekly users</span><strong class="text-${lvl(wkPct, tgt(ids))}">${wkPct}%</strong><small>${l.weekly} of ${l.employees} · target ${tgt(ids)}% (${l.target})</small></div>
              <div><span>Power users</span><strong>${l.power}</strong><small>${pct(l.power, l.employees)}% of employees · 3+ days/week</small></div>
              <div><span>Active days / user</span><strong>${days.toFixed(1)}</strong><small>per week, weekly users</small></div>
              <div><span>Licensed but inactive</span><strong class="${l.inactive ? 'text-red' : ''}">${l.inactive}</strong><small>employees (not seats) · no use in 30 days</small></div>
            </div>

            <div class="us-sec">
              <div class="us-sec-head"><span>Usage ladder · ${name} target group ${l.target}</span></div>
              <div class="us-ladder">${STEPS.map(s => l[s.id] ? `<div style="flex:${l[s.id]};background:${s.color}" title="${s.label}: ${l[s.id]} (${s.hint})"><span>${l[s.id] / l.target >= 0.07 ? l[s.id] : ''}</span></div>` : '').join('')}</div>
              <div class="us-ladder-legend">${STEPS.map(s => `<span><i style="background:${s.color}"></i><strong>${s.label}</strong> ${l[s.id]} <small>${s.hint}</small></span>`).join('')}</div>
            </div>

            <div class="us-bottom">
              <div class="us-sec">
                <div class="us-sec-head"><span>Jan → ${D.TREND_2026.labelsEn[mi].split(' ')[0]}</span><span class="us-keys"><i class="us-k-w"></i>weekly <i class="us-k-p"></i>power</span></div>
                ${trend(ids, mi)}
              </div>
              <div class="us-sec">
                <div class="us-sec-head"><span>${tm.title}</span></div>
                <div class="us-teams">
                  ${tm.rows.map(t => `
                    <div class="us-team">
                      <span title="${t.name}">${t.isGrouped ? 'Small teams (<10)' : t.name}${ids.length > 1 ? `<small> · ${t.dept}</small>` : ''}</span>
                      <div class="pp-track"><div style="width:${Math.min(100, t.weeklyPct)}%;background:var(--${lvl(t.weeklyPct, t.target)})"></div><i style="left:${t.target}%"></i></div>
                      <strong class="text-${lvl(t.weeklyPct, t.target)}">${t.weeklyPct}%</strong>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="ip-note us-note">
              <span>${takeaway}${lowTeam ? ` Lowest team: <strong>${lowTeam.isGrouped ? 'small teams' : lowTeam.name} ${lowTeam.weeklyPct}%</strong>.` : ''}</span>
              <button type="button" class="link-btn" data-action="open-loss">Why? Where we lose people →</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return { render, deptLadder, sum };
})();
