/* ============================================================================
   NuTex Inc. — "Where do we lose our people?"
   Level 1: compact time horizon (trained · licensed · weekly users vs target)
   Level 2: full timeline with change events (gains ▲ / losses ▼), a loss log
            and today's leak from target group to weekly users.
   ============================================================================ */

window.NUTEX_ADOPTION = (() => {
  const D = window.NUTEX_DATA;
  let TOTAL = 300;

  const SERIES = [
    { key: 'trained',  label: 'Trained',      color: 'var(--c-indigo)', fill: 'rgba(99,102,241,0.05)' },
    { key: 'licensed', label: 'With license', color: 'var(--c-neutral)', fill: 'rgba(148,163,184,0.05)' },
    { key: 'weekly',   label: 'Weekly users', color: 'var(--c-primary)', fill: 'rgba(37,99,235,0.14)' }
  ];

  const pct = (n) => Math.round((n / TOTAL) * 100);
  const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
  const deptName = (id) => (D.DEPARTMENTS.find(d => d.id === id) || {}).name || id;

  // Company = sum of all departments; a department filter shows only its own history and the
  // change events it was part of (its share). Each marker equals the step in the weekly line.
  function data() {
    const S = window.NUTEX_STATE;
    const H = S.adoption();
    const C = D.ADOPTION_2026;
    const sel = S.state.filters.dept;
    const ids = sel !== 'all' && S.canViewDept(sel) ? [sel] : D.DEPARTMENTS.map(d => d.id);
    const sum = (f) => H.labels.map((_, i) => ids.reduce((acc, id) => acc + H.perDept[id][f][i], 0));
    TOTAL = ids.reduce((acc, id) => acc + H.perDept[id].employees, 0);
    const events = H.events
      .filter(e => ids.some(id => e.share.weekly[id] !== undefined))
      .map(e => {
        const pick = (f) => ids.reduce((acc, id) => acc + (e.share[f][id] || 0), 0);
        return { ...e, weekly: pick('weekly'), trained: pick('trained'), licensed: pick('licensed'), recovered: pick('recovered'), depts: e.depts.filter(id => ids.includes(id)) };
      })
      .filter(e => e.weekly !== 0);
    return {
      ...C,
      target: ids.reduce((acc, id) => acc + H.perDept[id].target, 0),
      weekly: sum('weekly'), trained: sum('trained'), licensed: sum('licensed'),
      events
    };
  }

  // Month index (0 = Jan) of the selected timeframe
  function upTo() {
    const k = window.NUTEX_STATE.state.filters.timeframe;
    const i = D.TREND_2026.keys.indexOf(k);
    return i < 0 ? D.ADOPTION_2026.labels.length - 1 : i;
  }

  function events(last, A = data()) { return A.events.filter(e => e.m <= last + 0.999); }

  function summary() {
    const A = data();
    const last = upTo();
    const weekly = A.weekly[last];
    const gap = A.target - weekly;
    const losses = events(last, A).filter(e => e.weekly < 0);
    const biggest = losses.slice().sort((a, b) => a.weekly - b.weekly)[0] || null;
    const lost = losses.reduce((s, e) => s - e.weekly, 0);
    const recovered = losses.reduce((s, e) => s + e.recovered, 0);
    return { last, weekly, gap, losses, biggest, lost, recovered, target: A.target };
  }

  // ---------- Level 1: tiny time horizon ----------
  function mini() {
    const A = data();
    const last = upTo();
    const w = 300;
    const h = 62;
    const x = (m) => 4 + (m / Math.max(1, A.labels.length - 1)) * (w - 8);
    const y = (n) => h - 2 - (pct(n) / 100) * (h - 6);
    const area = (key) => {
      const v = A[key].slice(0, last + 1);
      const pts = v.map((n, i) => `${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(' ');
      return { pts, poly: `${x(0)},${h} ${pts} ${x(v.length - 1)},${h}` };
    };
    const layers = SERIES.map(s => {
      const a = area(s.key);
      const fill = s.key === 'weekly' ? `<polygon points="${a.poly}" fill="${s.fill}"/>` : '';
      return `${fill}<polyline points="${a.pts}" fill="none" stroke="${s.color}" stroke-width="${s.key === 'weekly' ? 2.2 : 1.5}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    }).join('');
    const marks = events(last, A).filter(e => e.weekly < 0).map(e => `
      <line x1="${x(e.m)}" x2="${x(e.m)}" y1="6" y2="${h}" stroke="var(--red)" stroke-width="1" stroke-dasharray="2 2" opacity="0.8"/>
      <path d="M${x(e.m) - 4},2 L${x(e.m) + 4},2 L${x(e.m)},8 z" fill="var(--red)"/>
    `).join('');
    return `
      <svg class="ad-mini" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" x2="${w}" y1="${y(A.target)}" y2="${y(A.target)}" stroke="var(--text-3)" stroke-dasharray="4 3" stroke-width="1" opacity="0.8" vector-effect="non-scaling-stroke"/>
        ${layers}
        ${marks}
      </svg>
    `;
  }

  // ---------- Level 2 ----------
  function bigChart(last, A) {
    const W = 800;
    const H = 330;
    const L = 40;
    const R = 760;
    const T = 46;
    const B = 296;
    const x = (m) => L + (m / (A.labels.length - 1)) * (R - L);
    const y = (p) => B - (p / 100) * (B - T);

    const grid = [0, 25, 50, 75, 100].map(p => `
      <line x1="${L}" x2="${R}" y1="${y(p)}" y2="${y(p)}" stroke="var(--grid)" stroke-width="1"/>
      <text x="${L - 8}" y="${y(p)}" text-anchor="end" dominant-baseline="central" font-size="10.5" fill="var(--text-3)">${p}%</text>
    `).join('');
    const months = A.labels.map((l, i) => `
      <text x="${x(i)}" y="${B + 18}" text-anchor="middle" font-size="10.5" fill="${i <= last ? 'var(--text-3)' : 'var(--border-hover)'}">${l}</text>
    `).join('');

    const layers = SERIES.map(s => {
      const v = A[s.key].slice(0, last + 1);
      const pts = v.map((n, i) => `${x(i).toFixed(1)},${y(pct(n)).toFixed(1)}`).join(' ');
      const lx = x(v.length - 1);
      const ly = y(pct(v[v.length - 1]));
      return `
        <polygon points="${x(0)},${B} ${pts} ${lx},${B}" fill="${s.fill}"/>
        <polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${lx}" cy="${ly}" r="4" fill="${s.color}"/>
        <text x="${lx + 8}" y="${ly}" dominant-baseline="central" font-size="11.5" font-weight="700" fill="${s.color}">${pct(v[v.length - 1])}%</text>
      `;
    }).join('');

    const evs = events(last, A).map(e => {
      const ex = x(e.m);
      const loss = e.weekly < 0;
      const col = loss ? 'var(--red)' : 'var(--green)';
      return `
        <g class="ad-ev" data-ev="${e.id}" tabindex="0" role="button" aria-label="${e.title}: ${sign(e.weekly)} weekly users">
          <line x1="${ex}" x2="${ex}" y1="${T - 10}" y2="${B}" stroke="${col}" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.75"/>
          <rect x="${ex - 22}" y="${T - 34}" width="44" height="20" rx="10" fill="${loss ? 'var(--red-bg)' : 'var(--green-bg)'}" stroke="${col}" stroke-width="1"/>
          <text x="${ex}" y="${T - 24}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="800" fill="${col}">${loss ? '▼' : '▲'} ${Math.abs(e.weekly)}</text>
          <rect x="${ex - 14}" y="${T - 36}" width="28" height="${B - T + 36}" fill="transparent"/>
        </g>
      `;
    }).join('');

    return `
      <svg class="ad-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="AI adoption over time with change events">
        ${grid}
        <line x1="${L}" x2="${R}" y1="${y(pct(A.target))}" y2="${y(pct(A.target))}" stroke="var(--text-2)" stroke-dasharray="6 4" stroke-width="1.3"/>
        <text x="${R}" y="${y(pct(A.target)) - 7}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--text-2)">Target group ${A.target} (${pct(A.target)}%)</text>
        ${layers}
        ${months}
        ${evs}
      </svg>
    `;
  }

  function render() {
    const A = data();
    const s = summary();
    const last = s.last;
    const steps = [
      { label: 'Target group', n: A.target },
      { label: 'With license', n: A.licensed[last] },
      { label: 'Trained', n: A.trained[last] },
      { label: 'Weekly users', n: A.weekly[last] }
    ];
    const lossLog = s.losses.slice().sort((a, b) => a.weekly - b.weekly);

    return `
      <section class="card card-lg ad-card" aria-label="Where did we lose our people?">
        <div class="panel-head">
          <h3>Where did we lose our people?</h3>
        </div>
        <div class="ad-legend">
          ${SERIES.map(x => `<span><i style="background:${x.color}"></i>${x.label}</span>`).join('')}
          <span><i class="ad-dash"></i>Target group</span>
          <span><b class="text-green">▲</b> gain <b class="text-red">▼</b> loss · weekly users per change</span>
        </div>
        <div class="ad-wrap" data-ad-stage>
          <div class="ad-left">
            ${bigChart(last, A)}
            <div class="ad-tooltip" data-ad-tooltip role="tooltip" aria-hidden="true"></div>
          </div>
          <aside class="ad-log">
            <div class="ad-log-head">
              <span class="ad-lbl">Loss log ${A.year}</span>
              <span class="ad-log-sum"><strong class="text-red">−${s.lost}</strong> weekly users · <strong class="text-green">${s.recovered}</strong> won back</span>
            </div>
            ${lossLog.map(e => {
              const rec = Math.round((e.recovered / Math.abs(e.weekly)) * 100);
              return `
                <div class="ad-loss" data-ev="${e.id}">
                  <div class="ad-loss-top">
                    <strong>${e.title}</strong>
                    <span class="ad-loss-n">${sign(e.weekly)}</span>
                  </div>
                  <div class="ad-loss-sub">${e.date} · ${e.depts.map(deptName).join(', ')}</div>
                  <div class="ad-rec"><div style="width:${rec}%"></div></div>
                  <div class="ad-loss-sub">${e.recovered} of ${Math.abs(e.weekly)} won back · ${e.fix}</div>
                </div>
              `;
            }).join('') || '<div class="ad-loss-sub">No losses in this period.</div>'}
          </aside>
        </div>
        <div class="ad-leak">
          <span class="ad-lbl">Where we lose them today</span>
          <div class="ad-leak-row">
            ${steps.map((st, i) => `
              ${i ? `<span class="ad-leak-drop">−${steps[i - 1].n - st.n}</span>` : ''}
              <div class="ad-leak-step ${i === 3 ? 'is-last' : ''}">
                <strong>${st.n}</strong><span>${st.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function cardHtml(e) {
    const loss = e.weekly < 0;
    return `
      <div class="ad-tip-head">
        <strong>${e.title}</strong>
        <span class="ad-tip-badge ${loss ? 'is-loss' : 'is-gain'}">${sign(e.weekly)} weekly</span>
      </div>
      <div class="ad-tip-sub">${e.date} · ${e.depts.map(deptName).join(', ')}</div>
      <div class="ad-tip-grid">
        <span>Weekly users</span><strong>${sign(e.weekly)}</strong>
        <span>Licenses</span><strong>${sign(e.licensed)}</strong>
        <span>Trained</span><strong>${sign(e.trained)}</strong>
        ${loss ? `<span>Won back</span><strong>${e.recovered} of ${Math.abs(e.weekly)}</strong>` : ''}
      </div>
      <div class="ad-tip-why"><span>${loss ? 'Why we lost them' : 'What worked'}</span>${e.why}</div>
      ${e.fix ? `<div class="ad-tip-why"><span>${loss ? 'Fix' : 'Next'}</span>${e.fix}</div>` : ''}
    `;
  }

  function show(stage, node) {
    const e = data().events.find(x => x.id === node.getAttribute('data-ev'));
    const tip = stage.querySelector('[data-ad-tooltip]');
    if (!e || !tip) return;
    tip.innerHTML = cardHtml(e);
    tip.classList.add('open');
    const host = tip.parentElement.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const tw = tip.offsetWidth || 290;
    let left = r.left - host.left + r.width / 2 + 14;
    if (left + tw > host.width) left = r.left - host.left + r.width / 2 - tw - 14;
    tip.style.left = `${Math.round(Math.max(0, left))}px`;
    tip.style.top = '40px';
    stage.querySelectorAll('[data-ev]').forEach(n => n.classList.toggle('is-active', n.getAttribute('data-ev') === e.id));
  }

  function hide(stage) {
    if (!stage) return;
    const tip = stage.querySelector('[data-ad-tooltip]');
    if (tip) tip.classList.remove('open');
    stage.querySelectorAll('[data-ev].is-active').forEach(n => n.classList.remove('is-active'));
  }

  function bind(root) {
    if (!root || root._adoptionBound) return;
    root._adoptionBound = true;
    const find = (e) => { const n = e.target.closest('.ad-ev, .ad-loss'); return n ? [n, n.closest('[data-ad-stage]')] : [null, null]; };
    root.addEventListener('mouseover', e => {
      const [n, s] = find(e);
      if (!n || !s) return;
      const chartNode = n.classList.contains('ad-loss') ? s.querySelector(`.ad-ev[data-ev="${n.getAttribute('data-ev')}"]`) : n;
      if (chartNode) show(s, chartNode);
    });
    root.addEventListener('mouseout', e => {
      const [n, s] = find(e);
      if (!n || (e.relatedTarget && n.contains(e.relatedTarget))) return;
      hide(s);
    });
    root.addEventListener('focusin', e => { const [n, s] = find(e); if (n && s && n.classList.contains('ad-ev')) show(s, n); });
    root.addEventListener('focusout', e => { const [n, s] = find(e); if (n) hide(s); });
  }

  return { summary, mini, render, bind };
})();
