/* ============================================================================
   NuTex Inc. — Business impact since AI go-live
   Level 1 (tile): average KPI improvement since each go-live + mini lines
   Level 2 (pop-up): KPI list (before → now, change, confidence, driver) and a
     deep-dive chart for the selected KPI with go-live marker, before/after
     averages, control group (no AI) and target.
   ============================================================================ */

window.NUTEX_IMPACT = (() => {
  const D = window.NUTEX_DATA;
  const S = window.NUTEX_STATE;
  const I = () => D.IMPACT;
  const OFFSET = 3; // series start 3 months before Jan 2026 (Oct–Dec 2025 = pre-AI baseline period)
  const LINE_COLORS = ['var(--c-primary)', 'var(--c-sky)', 'var(--c-indigo)', 'var(--c-navy)', 'var(--c-light)', 'var(--c-primary-300)', 'var(--c-neutral-600)', 'var(--c-neutral)'];

  const avg = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  const fmt = (v, k) => (k.unit === '%' ? `${v.toFixed(1)}%` : k.unit === 'h' ? (v < 12 ? `${v.toFixed(1)} h` : `${Math.round(v)} h`) : k.unit === 'd' ? `${v.toFixed(1)} d` : k.unit === 'k' ? `€${v.toFixed(1)}k` : v.toFixed(1));

  function nowIndex() {
    const i = D.TREND_2026.keys.indexOf(S.state.filters.timeframe);
    return OFFSET + (i < 0 ? D.TREND_2026.keys.length - 1 : i);
  }

  // KPIs in scope (department filter) — falls back to company-wide when a department has none
  function scope() {
    const sel = S.state.filters.dept;
    const all = I().kpis;
    if (sel === 'all') return { kpis: all, companyWide: true, fallback: false };
    const own = all.filter(k => k.depts.includes(sel));
    return own.length ? { kpis: own, companyWide: false, fallback: false } : { kpis: all, companyWide: true, fallback: true };
  }

  function stats(k, ni = nowIndex()) {
    const g = k.goLive;
    const live = ni >= g;
    const before = avg(k.series.slice(Math.max(0, g - 3), g));
    const now = k.series[ni];
    const rel = ((now - before) / before) * 100;
    const better = k.lowerIsBetter ? -rel : rel;            // + = improvement
    const ctrl = k.control ? ((k.control[ni] - avg(k.control.slice(Math.max(0, g - 3), g))) / avg(k.control.slice(Math.max(0, g - 3), g))) * 100 : null;
    const ctrlBetter = ctrl === null ? null : (k.lowerIsBetter ? -ctrl : ctrl);
    const net = ctrlBetter === null ? better : better - ctrlBetter;  // improvement beyond control group
    const delta = k.unit === '%' && !k.lowerIsBetter ? `${now - before >= 0 ? '+' : ''}${(now - before).toFixed(1)} pp`
      : `${rel >= 0 ? '+' : '−'}${Math.abs(rel).toFixed(0)}%`;
    return { live, before, now, rel, better, ctrlBetter, net, delta };
  }

  // € per month of a KPI = the return of the pilots / driver behind it (same model as "Return per €")
  function euroMo(k) {
    const VL = window.NUTEX_VALUE;
    if (!VL || !k.driver) return 0;
    const total = S.computeMetrics().costSavedMo;
    if (k.pilots === '*') return VL.drivers(total)[k.driver];
    const list = VL.pilots();
    const sum = list.reduce((acc, p) => acc + p.valueMo, 0);
    const scale = sum > total ? total / sum : 1;
    return list.filter(p => k.pilots.includes(p.id)).reduce((acc, p) => {
      const split = p.split || { [p.driver || 'time']: p.valueMo };
      return acc + (split[k.driver] || 0) * scale;
    }, 0);
  }

  function summary() {
    const sc = scope();
    const ni = nowIndex();
    const live = sc.kpis.map(k => ({ k, s: stats(k, ni) })).filter(x => x.s.live);
    const improved = live.filter(x => x.s.better > 2).length;
    const avgBetter = live.length ? avg(live.map(x => x.s.better)) : 0;
    const best = live.slice().sort((a, b) => b.s.better - a.s.better)[0] || null;
    const euro = sc.kpis.reduce((acc, k) => acc + euroMo(k), 0); // € per month, all KPIs in scope
    return { ...sc, live, improved, avgBetter, best, euro, total: sc.kpis.length };
  }

  // ---------- Level 1: improvement since go-live, one line per KPI (up = better) ----------
  function mini() {
    const sm = summary();
    const ni = nowIndex();
    const w = 300;
    const h = 60;
    const start = OFFSET; // Jan 2026
    const span = Math.max(1, ni - start);
    const x = (i) => 4 + ((i - start) / span) * (w - 8);
    const lines = sm.live.map(({ k }) => {
      const g = k.goLive;
      const base = avg(k.series.slice(Math.max(0, g - 3), g));
      const pts = [];
      for (let i = Math.max(start, g - 1); i <= ni; i++) {
        const rel = ((k.series[i] - base) / base) * 100;
        pts.push([x(i), k.lowerIsBetter ? -rel : rel]);
      }
      return { k, pts };
    });
    const hi = Math.max(10, ...lines.flatMap(l => l.pts.map(p => p[1])));
    const lo = Math.min(-5, ...lines.flatMap(l => l.pts.map(p => p[1])));
    const y = (v) => h - 3 - ((v - lo) / (hi - lo)) * (h - 6);
    return `
      <svg class="ip-mini" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2="${w}" y1="${y(0)}" y2="${y(0)}" stroke="var(--text-3)" stroke-dasharray="3 3" stroke-width="1" opacity="0.6" vector-effect="non-scaling-stroke"/>
        ${lines.map((l, i) => `<polyline points="${l.pts.map(p => `${p[0].toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="${LINE_COLORS[I().kpis.indexOf(l.k) % LINE_COLORS.length]}" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity="0.9"/>`).join('')}
      </svg>
    `;
  }

  // ---------- Level 2 ----------
  function bigChart(k, ni) {
    const W = 760;
    const H = 230;
    const L = 44;
    const R = 744;
    const T = 24;
    const B = 196;
    const labels = I().labels;
    const n = ni + 1;
    const vals = k.series.slice(0, n).concat(k.control ? k.control.slice(0, n) : []);
    const pad = (Math.max(...vals) - Math.min(...vals)) * 0.2 || 1;
    const lo = Math.min(...vals) - pad;
    const hi = Math.max(...vals) + pad;
    const x = (i) => L + (i / (labels.length - 1)) * (R - L);
    const y = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
    const st = stats(k, ni);
    const g = k.goLive;
    const line = (arr, color, wdt, dash) => `<polyline points="${arr.slice(0, n).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${wdt}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
    const grid = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.85].map(v =>
      `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${L - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="central" font-size="10" fill="var(--text-3)">${fmt(v, k)}</text>`
    ).join('');
    return `
      <svg class="ip-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${k.name} over time">
        ${grid}
        <line x1="${x(g)}" x2="${x(g)}" y1="${T - 8}" y2="${B}" stroke="var(--text-3)" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${x(g) + 6}" y="${T - 2}" font-size="10.5" font-weight="600" fill="var(--text-3)">AI go-live</text>
        ${k.control ? line(k.control, 'var(--border-hover)', 1.6) : ''}
        ${line(k.series, 'var(--c-primary)', 2.4)}
        <circle cx="${x(ni)}" cy="${y(st.now)}" r="4" fill="var(--c-primary)"/>
        ${labels.map((l, i) => (i % 2 === 1 || i === labels.length - 1) ? '' : `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="var(--text-3)">${l}</text>`).join('')}
        <text x="${x(labels.length - 1)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="var(--text-3)">${labels[labels.length - 1]}</text>
      </svg>
    `;
  }

  const CONF = {
    high:   { label: 'high',   text: (k) => `${k.controlLabel} without AI stayed flat` },
    medium: { label: 'medium', text: () => 'before/after comparison only' },
    low:    { label: 'low',    text: () => 'indirect effect, several drivers' }
  };

  function render() {
    const sm = summary();
    const ni = nowIndex();
    const sel = sm.kpis.find(k => k.id === S.state.impactKpi) || (sm.best ? sm.best.k : sm.kpis[0]);
    const st = stats(sel, ni);
    const conf = CONF[sel.confidence];
    const eur = (n) => '€' + Math.round(n / 1000) + 'k';
    const k1 = (n) => `€${(n / 1000).toFixed(1)}k`;
    const ret = S.computeMetrics().costSavedMo;

    return `
      <div class="ip ip-clean">
        <div class="ip-head">
          <span class="b2-q">What has AI changed for our customers and operations?${sm.fallback ? ' <span class="ov-scope-pill">Company-wide</span>' : ''}</span>
          <span class="ip-sum">${sm.improved} of ${sm.live.length} KPIs better · KPIs add up to <strong>${k1(sm.euro)}/mo</strong> = Return per € spent (${k1(ret)}/mo)</span>
        </div>
        <div class="ip-grid">
          <div class="ip-list">
            ${sm.kpis.map(k => {
              const s = stats(k, ni);
              const good = s.better > 2;
              return `
                <button type="button" class="ip-row ${k.id === sel.id ? 'is-sel' : ''} ${s.live ? '' : 'is-off'}" data-action="impact-kpi" data-kpi="${k.id}">
                  <span class="ip-row-main">
                    <strong>${k.name}</strong>
                    <small>${s.live ? `${fmt(s.before, k)} → ${fmt(s.now, k)}` : `go-live ${I().labels[k.goLive]}`} · ${k.driver ? `${k1(euroMo(k))}/mo` : 'soft fact'}</small>
                  </span>
                  <b class="${s.live ? (good ? 'text-green' : 'text-red') : 'text-3'}">${s.live ? s.delta : '—'}</b>
                </button>
              `;
            }).join('')}
          </div>
          <div class="ip-detail">
            <div class="ip-detail-head">
              <div>
                <h4>${sel.name}</h4>
                <span>${sel.unitLabel} · ${sel.lowerIsBetter ? 'lower is better' : 'higher is better'}</span>
              </div>
              <div class="ip-kpis">
                <div><span>Before AI</span><strong>${fmt(st.before, sel)}</strong></div>
                <div><span>Now</span><strong>${st.live ? fmt(st.now, sel) : '—'}</strong></div>
                <div><span>Change</span><strong class="${st.better > 2 ? 'text-green' : 'text-red'}">${st.live ? st.delta : '—'}</strong></div>
              </div>
            </div>
            ${bigChart(sel, ni)}
            <div class="ip-note">
              ${sel.control ? `<span class="ip-key"><i class="ip-k-main"></i>With AI</span><span class="ip-key"><i class="ip-k-ctrl"></i>${sel.controlLabel}</span><span class="ip-dotsep"></span>` : ''}
              <span><strong>${sel.driverLabel}</strong> · ${sel.owner.split(' · ')[0]} · ${sel.driver ? `${k1(euroMo(sel))}/mo return (${(D.RETURN_MODEL.drivers.find(d => d.id === sel.driver) || {}).label})` : 'soft fact — tracked, not priced'} · attribution ${conf.label}: ${conf.text(sel)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return { summary, mini, render, stats, euroMo };
})();
