/* ============================================================================
   NuTex Inc. — Level 2: Employee sentiment (People score)
   1) Monthly survey (4 statements, change vs last month)
   2) What stops you? — barriers per department, each mapped to a lever
   3) Time saved by AI — net hours per AI user / week (consistent with the
      1,420 h/month used elsewhere) vs rework, by department
   4) Sentiment over time
   ============================================================================ */

window.NUTEX_PEOPLE = (() => {
  const D = window.NUTEX_DATA;
  const S = window.NUTEX_STATE;
  const WEEKS = 4.33;
  const TARGET_H = 1.5; // net hours saved per AI user per week

  const lvlPct = (v, t) => (v >= t ? 'green' : v >= t - 15 ? 'yellow' : 'red');
  const LV = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };

  function withFilters(patch, fn) {
    const saved = { ...S.state.filters };
    Object.assign(S.state.filters, patch);
    try { return fn(); } finally { S.state.filters = saved; }
  }

  function barriers(deptId) {
    const B = D.CULTURE_SURVEY.barriers;
    const ids = deptId === 'all' ? S.getAccessibleDepts().map(d => d.id) : [deptId];
    const w = ids.map(id => (D.DEPARTMENTS.find(d => d.id === id) || {}).employees || 0);
    const tw = w.reduce((a, b) => a + b, 0) || 1;
    return B.options.map(o => ({
      ...o,
      pct: Math.round(ids.reduce((sum, id, i) => sum + (B.byDept[id][o.id] || 0) * w[i], 0) / tw)
    })).sort((a, b) => b.pct - a.pct);
  }

  function timeSaved(metrics) {
    const R = D.CULTURE_SURVEY.reworkPct;
    const rows = metrics.rows.map(r => {
      const net = r.hoursSavedMo / Math.max(1, r.weeklyUsers * WEEKS);
      const rework = R[r.dept.id] || 0.25;
      return { id: r.dept.id, name: r.dept.name, net, gross: net / (1 - rework), users: r.weeklyUsers, hours: r.hoursSavedMo };
    });
    const users = rows.reduce((s, r) => s + r.users, 0) || 1;
    const hours = rows.reduce((s, r) => s + r.hours, 0);
    const net = hours / (users * WEEKS);
    const gross = rows.reduce((s, r) => s + r.gross * r.users, 0) / users;
    return { rows: rows.sort((a, b) => b.net - a.net), net, gross, rework: gross - net, users, hours };
  }

  function donut(net, gross) {
    const size = 112;
    const r = 44;
    const c = 2 * Math.PI * r;
    const netLen = (net / Math.max(0.01, gross)) * c;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--c-primary-200)" stroke-width="12"/>
        <circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--c-primary)" stroke-width="12" stroke-dasharray="${netLen.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 56 56)"/>
        <text x="56" y="53" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)">${net.toFixed(1)} h</text>
        <text x="56" y="71" text-anchor="middle" font-size="10" font-weight="600" fill="var(--c-primary)">net saved</text>
      </svg>
    `;
  }

  function trend(labels, values, target) {
    const W = 1100;
    const H = 128;
    const L = 40;
    const R = 1080;
    const T = 18;
    const B = 100;
    const lo = Math.max(0, Math.floor((Math.min(...values, target) - 6) / 10) * 10);
    const hi = Math.min(100, Math.ceil((Math.max(...values, target) + 4) / 10) * 10);
    const x = (i) => L + (i / Math.max(1, labels.length - 1)) * (R - L);
    const y = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const grid = [lo, (lo + hi) / 2, hi].map(v => `
      <line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>
      <text x="${L - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="central" font-size="10.5" fill="var(--text-3)">${Math.round(v)}%</text>
    `).join('');
    return `
      <svg class="pp-trend" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${grid}
        <line x1="${L}" x2="${R}" y1="${y(target)}" y2="${y(target)}" stroke="var(--c-neutral)" stroke-dasharray="6 4" stroke-width="1.4"/>
        <text x="${R}" y="${y(target) - 6}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--text-3)">Target ${target}%</text>
        <polygon points="${x(0)},${B} ${pts} ${x(values.length - 1)},${B}" fill="var(--c-primary-050)"/>
        <polyline points="${pts}" fill="none" stroke="var(--c-primary)" stroke-width="2.4" stroke-linejoin="round"/>
        ${values.map((v, i) => `
          <circle cx="${x(i)}" cy="${y(v)}" r="${i === values.length - 1 ? 5.5 : 4}" fill="${i === values.length - 1 ? 'var(--c-primary)' : 'var(--surface)'}" stroke="var(--c-primary)" stroke-width="2"/>
          <text x="${x(i)}" y="${y(v) + 17}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--text-2)">${v}%</text>
          <text x="${x(i)}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--text-3)">${labels[i]}</text>
        `).join('')}
      </svg>
    `;
  }

  function render(metrics) {
    const keys = D.TREND_2026.keys;
    const tfKey = S.state.filters.timeframe;
    const idx = Math.max(0, keys.indexOf(tfKey));
    const c = S.computeCulture();
    const prev = idx > 0 ? withFilters({ timeframe: keys[idx - 1] }, () => S.computeCulture()) : null;
    const prevById = prev ? Object.fromEntries(prev.questions.map(q => [q.id, q.pct])) : {};
    // lowest department per statement (within the current scope)
    const lowest = {};
    const scopeDepts = S.getFilteredDepts();
    if (scopeDepts.length > 1) {
      c.questions.forEach(q => {
        let best = null;
        scopeDepts.forEach(d => {
          const v = withFilters({ dept: d.id }, () => S.computeCulture()).questions.find(x => x.id === q.id).pct;
          if (!best || v < best.v) best = { name: d.name, v };
        });
        lowest[q.id] = best;
      });
    }

    const sel = S.state.barrierDept || (S.state.filters.dept !== 'all' ? S.state.filters.dept : 'all');
    const bars = barriers(sel);
    const top = bars[0];
    const maxB = Math.max(...bars.map(b => b.pct), 1);
    const selDept = sel !== 'all' ? D.DEPARTMENTS.find(d => d.id === sel) : null;
    const dropOff = selDept
      ? (() => { const r = S.computeDept(selDept, metrics.tf); return r.targetUsers - r.trainedCount; })()
      : metrics.targetUsers - metrics.trainedCount;

    const ts = timeSaved(metrics);
    const maxNet = Math.max(...ts.rows.map(r => r.net), TARGET_H) * 1.1;
    const labels = (D.TREND_2026.labelsEn).slice(0, idx + 1).map(l => l.split(' ')[0]);
    const series = c.trend.actual.slice(0, idx + 1);

    return `
      <div class="pp">
        <div class="pp-row">
          <!-- 1 · Survey -->
          <section class="pp-card">
            <div class="pp-head"><h4>Monthly survey</h4><span>${c.totalResponses} / ${c.totalEmp} (${c.responsePct}%)</span></div>
            <div class="pp-qs pp-fill">
              ${c.questions.map(q => {
                const lv = lvlPct(q.pct, 75);
                const d = prevById[q.id] !== undefined ? q.pct - prevById[q.id] : null;
                return `
                  <div class="pp-q">
                    <div class="pp-q-top">
                      <span>${q.label}</span>
                      <span class="pp-q-val">${d !== null ? `<em class="${d >= 0 ? 'text-green' : 'text-red'}">${d >= 0 ? '▲' : '▼'}${Math.abs(d)}</em>` : ''}<strong class="text-${lv}">${q.pct}%</strong></span>
                    </div>
                    <div class="pp-track"><div style="width:${q.pct}%;background:${LV[lv]}"></div><i style="left:75%"></i></div>
                    ${lowest[q.id] ? `<span class="pp-note">lowest: <strong class="text-${lvlPct(lowest[q.id].v, 75)}">${lowest[q.id].name} ${lowest[q.id].v}%</strong> · target 75%</span>` : '<span class="pp-note">target 75%</span>'}
                  </div>
                `;
              }).join('')}
            </div>
          </section>

          <!-- 2 · Barriers -->
          <section class="pp-card">
            <div class="pp-head">
              <h4>What stops you? <small>multiple answers</small></h4>
              <select class="pp-select" data-barrier-dept aria-label="Department">
                <option value="all" ${sel === 'all' ? 'selected' : ''}>All departments</option>
                ${S.getAccessibleDepts().map(d => `<option value="${d.id}" ${sel === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>
            <div class="pp-qs pp-fill">
              ${bars.map(b => `
                <div class="pp-q">
                  <div class="pp-q-top"><span>${b.label}</span><strong class="pp-blue">${b.pct}%</strong></div>
                  <div class="pp-track"><div style="width:${(b.pct / maxB) * 100}%;background:var(--c-primary)"></div></div>
                  <span class="pp-note">→ ${b.lever}</span>
                </div>
              `).join('')}
            </div>
            <div class="pp-foot">Biggest drop-off: <strong>Target group → Trained · ${dropOff} people</strong></div>
          </section>

          <!-- 3 · Time saved -->
          <section class="pp-card">
            <div class="pp-head"><h4>Time saved by AI</h4><span>per AI user / week</span></div>
            <div class="pp-time">
              ${donut(ts.net, ts.gross)}
              <div class="pp-time-kpis">
                <div><span>Time saved (gross)</span><strong>${ts.gross.toFixed(1)} h</strong></div>
                <div><span><i class="pp-dot-rework"></i>Rework (checking, fixing)</span><strong>${ts.rework.toFixed(1)} h</strong></div>
              </div>
            </div>
            <div class="pp-sub">Net saved by department · target ${TARGET_H.toFixed(1)} h</div>
            <div class="pp-dept pp-fill">
              ${ts.rows.map(r => {
                const lv = r.net >= TARGET_H ? 'green' : r.net >= TARGET_H * 0.85 ? 'yellow' : 'red';
                return `
                  <div class="pp-dept-row">
                    <span>${r.name}</span>
                    <div class="pp-track"><div style="width:${(r.net / maxNet) * 100}%;background:${LV[lv]}"></div><i style="left:${(TARGET_H / maxNet) * 100}%"></i></div>
                    <strong class="text-${lv}">${r.net.toFixed(1)} h</strong>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        </div>

        <!-- 4 · Over time -->
        <section class="pp-card pp-wide">
          <div class="pp-head"><h4>Sentiment over time <small>average agreement across the ${c.questions.length} survey statements</small></h4><span>${labels[labels.length - 1]}: ${c.overallPct}%</span></div>
          ${trend(labels, series, 75)}
        </section>
      </div>
    `;
  }

  return { render };
})();
