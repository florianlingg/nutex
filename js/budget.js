/* ============================================================================
   NuTex Inc. — Level 2: Budget
   1) This month's AI spend vs budget (+ trend)
   2) Budget per department: allocation, spend, utilization, € per employee,
      value per € — and derived recommendations
   3) AI spend in the company context (revenue → IT budget → AI → value)
   ============================================================================ */

window.NUTEX_BUDGET = (() => {
  const D = window.NUTEX_DATA;
  const S = window.NUTEX_STATE;

  const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');
  const eurK = (n) => {
    const a = Math.abs(n);
    if (a >= 1e6) return `€${(n / 1e6).toFixed(a >= 1e7 ? 0 : 2).replace(/\.?0+$/, '')}M`;
    if (a >= 1e4) return `€${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
    return eur(n);
  };
  const pct = (n, d) => (d ? (n / d) * 100 : 0);
  const k1 = (n) => `€${(n / 1000).toFixed(1)}k`;
  const fmtPct = (v) => (v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v)) + '%';

  // Re-compute metrics for another filter state, then restore
  function withFilters(patch, fn) {
    const saved = { ...S.state.filters };
    Object.assign(S.state.filters, patch);
    try { return fn(S.computeMetrics()); } finally { S.state.filters = saved; }
  }

  function deptRows() {
    return S.getAccessibleDepts().map(d => withFilters({ dept: d.id }, m => ({
      id: d.id,
      name: d.name,
      vp: d.vp,
      employees: d.employees,
      budget: m.budgetLimit,
      spent: m.totalSpendMo,
      used: m.budgetUsedPct,
      perEmp: m.totalSpendMo / d.employees,
      value: m.costSavedMo,
      vpe: m.costSavedMo / Math.max(1, m.totalSpendMo),
      parts: { licenses: m.licenseSpendMo, tokens: m.tokenSpendMo, projects: m.projectSpendMo, trainings: m.trainingSpendMo },
      unusedCost: m.unusedCostMo
    })));
  }

  function insights(rows) {
    const out = [];
    const over = rows.filter(r => r.used > 100).sort((a, b) => b.used - a.used);
    const tight = rows.filter(r => r.used >= 95 && r.used <= 100).sort((a, b) => b.used - a.used);
    const room = rows.filter(r => r.used < 85).sort((a, b) => b.vpe - a.vpe);
    const waste = rows.slice().sort((a, b) => b.unusedCost - a.unusedCost)[0];
    const best = rows.slice().sort((a, b) => b.vpe - a.vpe)[0];

    if (over.length) {
      out.push({ level: 'red', text: `<strong>${over.map(r => r.name).join(', ')}</strong> over budget by ${eur(over.reduce((s, r) => s + r.spent - r.budget, 0))} this month.` });
    }
    if (room[0] && (tight.length || over.length)) {
      const from = room[0];
      const to = (over[0] || tight[0]);
      const amount = Math.round(Math.min(from.budget - from.spent, Math.max(500, to.spent - to.budget + to.budget * 0.05)) / 100) * 100;
      out.push({ level: 'yellow', text: `Shift <strong>${eur(amount)}/mo</strong> from ${from.name} (${from.used}% used) to ${to.name} (${to.used}% used).` });
    } else if (room[0]) {
      out.push({ level: 'green', text: `<strong>${room[0].name}</strong> has ${eur(room[0].budget - room[0].spent)} headroom at €${room[0].vpe.toFixed(2)} per € — room to fund its next pilot.` });
    }
    const avgEmp = rows.reduce((s, r) => s + r.spent, 0) / Math.max(1, rows.reduce((s, r) => s + r.employees, 0));
    const avgVpe = rows.reduce((s, r) => s + r.value, 0) / Math.max(1, rows.reduce((s, r) => s + r.spent, 0));
    const costly = rows.filter(r => r.perEmp > avgEmp * 1.6 && r.vpe < avgVpe).sort((a, b) => b.perEmp - a.perEmp)[0];
    if (costly) out.push({ level: 'yellow', text: `<strong>${costly.name}</strong> spends ${eur(costly.perEmp)} per employee (${(costly.perEmp / avgEmp).toFixed(1)}× average) but returns only €${costly.vpe.toFixed(2)} per € — review its tool mix.` });
    if (waste && waste.unusedCost > 300) out.push({ level: 'yellow', text: `${eur(waste.unusedCost)}/mo goes to unused licenses in <strong>${waste.name}</strong> — reallocate before raising budget.` });
    if (best) out.push({ level: 'green', text: `Best return: <strong>${best.name}</strong> at €${best.vpe.toFixed(2)} value per € spent.` });
    return out.slice(0, 3);
  }

  function spark(values, budget) {
    const w = 260;
    const h = 54;
    const hi = Math.max(...values, budget) * 1.08;
    const x = (i) => 2 + (i / Math.max(1, values.length - 1)) * (w - 6);
    const y = (v) => h - 2 - (v / hi) * (h - 6);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `
      <svg class="bg-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        <line x1="0" x2="${w}" y1="${y(budget)}" y2="${y(budget)}" stroke="var(--text-3)" stroke-dasharray="4 3" stroke-width="1"/>
        <text x="${w - 2}" y="${y(budget) - 4}" text-anchor="end" font-size="9.5" fill="var(--text-3)">budget</text>
        <polygon points="2,${h} ${pts} ${x(values.length - 1)},${h}" fill="rgba(59,130,246,0.12)"/>
        <polyline points="${pts}" fill="none" stroke="var(--c-primary)" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="${x(values.length - 1)}" cy="${y(values[values.length - 1])}" r="3.2" fill="var(--c-primary)"/>
      </svg>
    `;
  }

  function verdict(all, share, C, stats) {
    const [lo, hi] = C.bench.shareOfRevenue;
    const revMo = C.revenueYear / 12;
    const peerHighMo = revMo * hi / 100;
    if (all.budgetUsedPct > 100) {
      return { level: 'red', text: `<strong>Over budget.</strong> AI spend exceeds the monthly budget by ${eur(-all.budgetRemaining)} — raise the budget or pause low-return spend.` };
    }
    if (share < lo) {
      return { level: 'yellow', text: `<strong>Below peers.</strong> NuTex invests ${fmtPct(share)} of revenue in AI — less than most comparable companies (median ${fmtPct(stats.median)}).` };
    }
    if (share > hi) {
      return { level: 'yellow', text: `<strong>Above peers.</strong> At ${fmtPct(share)} of revenue NuTex spends more than the peer range (${lo}–${hi}%) — hold the budget flat.` };
    }
    return {
      level: 'green',
      text: `<strong>Within the peer range.</strong> NuTex invests <strong>${fmtPct(share)}</strong> of revenue in AI (peer median ${fmtPct(stats.median)}, rank ${stats.rank} of ${stats.n}). Up to <strong>${eurK(peerHighMo)}/mo</strong> would still be in range.`
    };
  }

  // Peer chart: one scale, two axes — % of revenue and the same position in €/month for NuTex
  function peerChart(share, budgetShare, C, stats, revMo) {
    const W = 600;
    const H = 186;
    const L = 16;
    const R = 584;
    const MAX = 1.2;
    const x = (p) => L + (Math.min(p, MAX) / MAX) * (R - L);
    const top = 34;
    const bot = 116;
    const yMid = (top + bot) / 2 + 6;
    const [lo, hi] = C.bench.shareOfRevenue;
    const placed = [];
    const dots = C.peers.slice().sort((a, b) => a.share - b.share).map(p => {
      const px = x(p.share);
      let lane = 0;
      while (placed.some(q => q.lane === lane && Math.abs(q.x - px) < 13)) lane++;
      placed.push({ x: px, lane });
      const py = yMid + (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 13;
      return `<circle cx="${px}" cy="${py}" r="6" fill="var(--c-neutral)" opacity="0.8"><title>${p.name}: ${p.share.toFixed(2)}% of revenue</title></circle>`;
    }).join('');
    const ticks = [0, 0.4, 0.8, 1.2];
    const anchor = (t) => (t === 0 ? 'start' : t === MAX ? 'end' : 'middle');
    const nx = x(share);
    const bx = x(budgetShare);
    const eur = (p) => `€${Math.round((revMo * p) / 100 / 1000)}k`;
    return `
      <svg class="b5-peer" viewBox="0 0 ${W} ${H}" role="img" aria-label="AI spend as share of revenue vs peers">
        <rect x="${x(0)}" y="${top}" width="${x(lo) - x(0)}" height="${bot - top}" fill="rgba(245,158,11,0.08)"/>
        <rect x="${x(lo)}" y="${top}" width="${x(hi) - x(lo)}" height="${bot - top}" fill="rgba(16,185,129,0.13)"/>
        <rect x="${x(hi)}" y="${top}" width="${x(MAX) - x(hi)}" height="${bot - top}" fill="rgba(239,68,68,0.07)"/>
        <text x="${(x(0) + x(lo)) / 2}" y="${top + 14}" text-anchor="middle" font-size="9.5" font-weight="800" letter-spacing="0.06em" fill="var(--yellow-txt)">BELOW</text>
        <text x="${(x(lo) + x(hi)) / 2}" y="${top + 14}" text-anchor="middle" font-size="9.5" font-weight="800" letter-spacing="0.06em" fill="var(--green-txt)">PEER RANGE</text>
        <text x="${(x(hi) + x(MAX)) / 2}" y="${top + 14}" text-anchor="middle" font-size="9.5" font-weight="800" letter-spacing="0.06em" fill="var(--red-txt)">ABOVE</text>
        <line x1="${x(stats.median)}" x2="${x(stats.median)}" y1="${top + 20}" y2="${bot}" stroke="var(--c-neutral-600)" stroke-dasharray="3 3"/>
        ${dots}
        <line x1="${bx}" x2="${bx}" y1="${top}" y2="${bot + 8}" stroke="var(--c-primary)" stroke-width="2" stroke-dasharray="4 3"/>
        <circle cx="${nx}" cy="${yMid}" r="10" fill="var(--c-ink)" stroke="var(--surface)" stroke-width="3"/>
        <line x1="${nx}" x2="${nx}" y1="${top - 8}" y2="${bot + 8}" stroke="var(--c-ink)" stroke-width="1.6"/>
        <rect x="${nx - 46}" y="4" width="92" height="20" rx="10" fill="var(--c-ink)"/>
        <text x="${nx}" y="14" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="800" fill="var(--surface)">NuTex ${fmtPct(share)}</text>

        <!-- axis 1: % of revenue -->
        <line x1="${L}" x2="${R}" y1="${bot + 8}" y2="${bot + 8}" stroke="var(--border-hover)"/>
        ${ticks.map(t => `<line x1="${x(t)}" x2="${x(t)}" y1="${bot + 4}" y2="${bot + 12}" stroke="var(--border-hover)"/>
          <text x="${x(t)}" y="${bot + 26}" text-anchor="${anchor(t)}" font-size="11" font-weight="600" fill="var(--text-2)">${t.toFixed(1)}%</text>
          <text x="${x(t)}" y="${bot + 42}" text-anchor="${anchor(t)}" font-size="10.5" fill="var(--text-3)">${eur(t)}</text>`).join('')}
        <text x="${bx}" y="${bot + 26}" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--c-primary)" ${Math.abs(bx - x(0.8)) < 34 ? `dx="${bx < x(0.8) ? -22 : 22}"` : ''}>budget</text>
        <text x="${L}" y="${H - 4}" font-size="10" fill="var(--text-3)">top: % of revenue · below: same point in € per month for NuTex</text>
      </svg>
    `;
  }

  // Monthly spend vs budget, Jan → selected month
  function budgetTrend(series, budget) {
    const w = 300;
    const h = 64;
    const hi = Math.max(...series, budget) * 1.1;
    const x = (i) => 2 + (i / Math.max(1, series.length - 1)) * (w - 6);
    const y = (v) => h - 2 - (v / hi) * (h - 8);
    const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `
      <svg class="b4-trend" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2="${w}" y1="${y(budget)}" y2="${y(budget)}" stroke="var(--c-primary)" stroke-dasharray="5 4" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
        <polygon points="2,${h} ${pts} ${x(series.length - 1)},${h}" fill="rgba(15,23,42,0.07)"/>
        <polyline points="${pts}" fill="none" stroke="var(--c-ink)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      </svg>
    `;
  }

  function render() {
    const role = S.getRole();
    const all = withFilters({ dept: 'all' }, m => m);
    const rows = deptRows();
    const sel = S.state.filters.dept;
    const C = D.COMPANY;
    const revMo = C.revenueYear / 12;
    const itMo = revMo * C.itBudgetPct / 100;
    const share = pct(all.totalSpendMo, revMo);
    const budgetShare = pct(all.budgetLimit, revMo);
    const shares = C.peers.map(p => p.share).sort((a, b) => a - b);
    const median = shares.length % 2 ? shares[(shares.length - 1) / 2] : (shares[shares.length / 2 - 1] + shares[shares.length / 2]) / 2;
    const stats = { median, rank: shares.filter(s => s > share).length + 1, n: shares.length + 1 };
    const v = verdict(all, share, C, stats);
    const level = all.budgetUsedPct > 100 ? 'red' : all.budgetUsedPct > 90 ? 'yellow' : 'green';
    const editing = !!S.state.budgetEdit;
    const keys = D.TREND_2026.keys;
    const idx = Math.max(0, keys.indexOf(S.state.filters.timeframe));
    const series = keys.slice(0, idx + 1).map(k => withFilters({ timeframe: k, dept: 'all' }, m => m.totalSpendMo));
    const ytd = series.reduce((a, b) => a + b, 0);
    const cats = [
      { label: 'Licenses', v: all.licenseSpendMo, c: 'var(--c-primary)' },
      { label: 'Tokens', v: all.tokenSpendMo, c: 'var(--c-indigo)' },
      { label: 'Projects', v: all.projectSpendMo, c: 'var(--c-sky)' },
      { label: 'Trainings', v: all.trainingSpendMo, c: 'var(--c-light)' }
    ];
    const [lo, hi] = C.bench.shareOfRevenue;
    const eMax = Math.max(revMo * 1.2 / 100, all.budgetLimit, all.totalSpendMo);
    const ePos = (v) => Math.min(100, (v / eMax) * 100);
    const eLo = ePos(revMo * lo / 100);
    const eHi = ePos(revMo * hi / 100);
    const eNow = ePos(all.totalSpendMo);
    const eBud = ePos(all.budgetLimit);
    // Aligned table: each bar = share of the row above (IT of revenue, AI budget of IT, spend of AI budget)
    const tableRows = [
      { label: 'Revenue', val: revMo, bar: 100, share: `${eurK(C.revenueYear)} / year`, cls: '' },
      { label: 'IT budget', val: itMo, bar: C.itBudgetPct, share: `${fmtPct(C.itBudgetPct)} of revenue`, cls: '', scale: 10 },
      { label: 'AI budget', val: all.budgetLimit, bar: pct(all.budgetLimit, itMo), share: `${fmtPct(pct(all.budgetLimit, itMo))} of IT budget`, cls: 'is-budget' },
      { label: 'AI spend', val: all.totalSpendMo, bar: all.budgetUsedPct, share: `${all.budgetUsedPct}% of AI budget`, cls: 'is-ai', track: true }
    ];

    return `
      <div class="b2">
        <div class="b2-head">
          <span class="b2-q">How much of our revenue do we invest in AI — and is that right?</span>
          ${role.isCEO ? `
            <div class="b2-adjust">
              <button type="button" class="b2-adjust-btn ${editing ? 'is-open' : ''}" data-action="budget-edit">Adjust budget</button>
              ${editing ? `
                <div class="b2-adjust-pop">
                  <span class="bg-lbl">Monthly AI budget</span>
                  <form id="budget-form" class="b2-form">
                    <input type="number" name="budgetAmount" value="${S.state.monthlyBudget}" min="5000" step="500" aria-label="Monthly budget">
                    <button type="submit" class="btn-primary-sm">Save</button>
                  </form>
                  <div class="b2-quick">
                    <button type="button" class="bg-chip" data-budget-add="2500">+ €2.5k</button>
                    <button type="button" class="bg-chip" data-budget-add="5000">+ €5k</button>
                    <button type="button" class="bg-chip" data-action="reset-budget">Reset €32k</button>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <section class="b5-hero-grid">
          <!-- Company context -->
          <div class="b5-col">
            <div class="b5-head"><span class="bg-lbl">AI in the company · per month</span></div>
            <div class="b5-hero"><strong>${fmtPct(share)}</strong><span>of revenue goes to AI</span></div>
            <div class="b5-table">
              <div class="b5-tr b5-th"><span></span><span>per month</span><span></span><span>share</span></div>
              ${tableRows.map(r => `
                <div class="b5-tr ${r.cls}">
                  <span class="b5-lbl">${r.label}</span>
                  <strong class="b5-val">${eurK(r.val)}</strong>
                  <span class="b5-bar ${r.track ? 'has-track' : ''}"><i style="width:${Math.max(1.5, Math.min(100, r.bar * (r.scale || 1)))}%"></i></span>
                  <span class="b5-share">${r.share}</span>
                </div>
              `).join('')}
            </div>
            <div class="b5-facts">
              <div><span>Per year</span><strong>${eurK(all.totalSpendMo * 12)}</strong><small>run-rate</small></div>
              <div><span>Per employee</span><strong>${eur(all.totalSpendMo / all.totalEmp)}</strong><small>per month</small></div>
              <div><span>Budget left</span><strong class="${all.budgetRemaining >= 0 ? 'text-green' : 'text-red'}">${eurK(Math.abs(all.budgetRemaining))}</strong><small>${all.budgetRemaining >= 0 ? 'this month' : 'over budget'}</small></div>
            </div>
          </div>

          <!-- Peers -->
          <div class="b5-col">
            <div class="b5-head">
              <span class="bg-lbl">Vs. ${C.peers.length} comparable manufacturers</span>
              <span class="b4-facts"><span>Rank <strong>${stats.rank}</strong> of ${stats.n}</span><span>Median <strong>${fmtPct(median)}</strong></span></span>
            </div>
            ${peerChart(share, budgetShare, C, stats, revMo)}
            <div class="b5-facts">
              <div><span>Peer range for NuTex</span><strong>${eurK(revMo * lo / 100)} – ${eurK(revMo * hi / 100)}</strong><small>per month</small></div>
              <div><span>Spend today</span><strong>${eurK(all.totalSpendMo)}</strong><small>${fmtPct(share)} of revenue</small></div>
              <div><span>Budget</span><strong class="text-blue">${eurK(all.budgetLimit)}</strong><small>${fmtPct(budgetShare)} of revenue</small></div>
            </div>
          </div>
        </section>
        <div class="b2-verdict b2-verdict-${v.level}">${v.text}</div>

        <div class="b3-depts">
          <span class="b3-depts-lbl">By department</span>
          ${rows.map(r => {
            const lv = r.used > 100 ? 'red' : r.used >= 95 ? 'yellow' : 'green';
            return `
              <div class="b3-dept ${sel === r.id ? 'is-sel' : ''}" title="${r.name}: ${eur(r.spent)} of ${eur(r.budget)} · ${eur(r.perEmp)} per employee">
                <div class="b3-dept-top"><strong>${r.name}</strong><span class="text-${lv}">${r.used}%</span></div>
                <div class="b2-dept-bar"><div class="bg-${lv}" style="width:${Math.min(100, r.used)}%"></div></div>
                <div class="b3-dept-amt">${k1(r.spent)} / ${k1(r.budget)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return { render };
})();
