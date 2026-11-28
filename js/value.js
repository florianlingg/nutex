/* ============================================================================
   NuTex Inc. — Level 2: "Which pilots should we implement?"
   Opened from the "Return per € spent" tile. Left: company return per € and
   trend. Right: bubble chart of pilots (x = return per €, y = employees
   affected, size = monthly cost) with four decision zones and hover cards.
   ============================================================================ */

window.NUTEX_VALUE = (() => {
  const D = window.NUTEX_DATA;

  const X_MAX = 4;          // value per €
  // Employees axis and "broad impact" threshold follow the scope (company or one department)
  function scale() {
    const sel = window.NUTEX_STATE.state.filters.dept;
    const dept = sel !== 'all' ? D.DEPARTMENTS.find(d => d.id === sel) : null;
    if (!dept) return { max: 140, split: 40 };
    return { max: Math.ceil(dept.employees / 10) * 10, split: Math.max(5, Math.round(dept.employees * 0.4)) };
  }
  const ZONES = {
    implement: { label: 'Implement',  color: 'var(--green)', bg: 'rgba(16,185,129,0.09)', txt: 'var(--green-txt)', hint: 'pays off for many people' },
    niche:     { label: 'Niche win',  color: 'var(--c-neutral-600)', bg: 'rgba(100,116,139,0.07)', txt: 'var(--text-2)',    hint: 'pays off, few people' },
    improve:   { label: 'Improve',    color: 'var(--yellow)', bg: 'rgba(245,158,11,0.09)', txt: 'var(--yellow-txt)', hint: 'many people, not paying off yet' },
    stop:      { label: 'Stop',       color: 'var(--red)', bg: 'rgba(239,68,68,0.08)',  txt: 'var(--red-txt)',   hint: 'costs more than it returns' }
  };

  const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');
  const eurK = (n) => n >= 10000 ? `€${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : eur(n);
  const deptName = (id) => (D.DEPARTMENTS.find(d => d.id === id) || {}).name || id;

  function zoneOf(p, split = scale().split) {
    const v = p.valueMo / p.costMo;
    if (v >= 1) return p.employees >= split ? 'implement' : 'niche';
    return p.employees >= split ? 'improve' : 'stop';
  }

  const pilots = () => {
    const sel = window.NUTEX_STATE.state.filters.dept;
    return D.PILOTS
      .filter(p => sel === 'all' || p.deptId === sel)
      .map(p => ({ ...p, vpe: p.valueMo / p.costMo, zone: zoneOf(p) }));
  };

  function spark(values, { w = 260, h = 70, ref = 1, color = 'var(--c-primary)' } = {}) {
    const all = values.concat([ref]);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const pad = (hi - lo) * 0.15 || 0.2;
    const y = (v) => h - 4 - ((v - (lo - pad)) / ((hi + pad) - (lo - pad))) * (h - 8);
    const x = (i) => 4 + (i / Math.max(1, values.length - 1)) * (w - 10);
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const last = values.length - 1;
    return `
      <svg class="vl-spark" viewBox="0 0 ${w} ${h + 16}" aria-hidden="true">
        <line x1="0" x2="${w}" y1="${y(ref)}" y2="${y(ref)}" stroke="var(--red)" stroke-dasharray="4 3" stroke-width="1" opacity="0.7"/>
        <text x="${w - 2}" y="${y(ref) + 13}" text-anchor="end" font-size="10" font-weight="600" fill="var(--red-txt)">break-even 1.0</text>
        <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${x(last)}" cy="${y(values[last])}" r="4" fill="${color}"/>
      </svg>
    `;
  }

  function miniTrend(values, color) {
    const w = 120;
    const h = 28;
    const lo = Math.min(...values, 0.4);
    const hi = Math.max(...values, 1.2);
    const y = (v) => h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6);
    const x = (i) => 2 + (i / (values.length - 1)) * (w - 4);
    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        <line x1="0" x2="${w}" y1="${y(1)}" y2="${y(1)}" stroke="var(--text-3)" stroke-dasharray="2 2" stroke-width="1" opacity="0.6"/>
        <polyline points="${values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function chart(list) {
    const W = 820;
    const H = 330;
    const L = 54;
    const R = 806;
    const T = 10;
    const B = 292;
    const px = (v) => L + (Math.min(v, X_MAX) / X_MAX) * (R - L);
    const { max: Y_MAX, split: Y_SPLIT } = scale();
    const py = (e) => B - (Math.min(e, Y_MAX) / Y_MAX) * (B - T);
    const x1 = px(1);
    const ys = py(Y_SPLIT);
    const zone = (k, x, y, w, h, ax, ay, anchor) => `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${ZONES[k].bg}"/>
      <text x="${ax}" y="${ay}" text-anchor="${anchor}" font-size="10" font-weight="600" letter-spacing="0.08em" fill="${ZONES[k].txt}" opacity="0.6">${ZONES[k].label.toUpperCase()}</text>
    `;
    const rOf = (c) => 6 + Math.sqrt(c) * 0.34;
    // Label placement avoids collisions: right of the bubble, above, or below (default)
    const label = (p, cx, cy, r) => {
      const pos = p.label || (p.employees < 20 ? 'above' : 'below');
      const at = pos === 'right' ? { x: cx + r + 7, y: cy, a: 'start', b: 'central' }
        : pos === 'left' ? { x: cx - r - 7, y: cy, a: 'end', b: 'central' }
        : pos === 'above' ? { x: cx, y: cy - r - 7, a: 'middle', b: 'auto' }
        : pos === 'above-left' ? { x: cx + r, y: cy - r - 7, a: 'end', b: 'auto' }
        : { x: cx, y: cy + r + 14, a: 'middle', b: 'auto' };
      return `<text x="${at.x}" y="${at.y}" text-anchor="${at.a}" dominant-baseline="${at.b}" font-size="11.5" font-weight="600" fill="var(--text-2)">${p.name}</text>`;
    };

    const ticksX = [0, 1, 2, 3, 4].map(v => `
      <text x="${px(v)}" y="${B + 16}" text-anchor="middle" font-size="10.5" fill="var(--text-3)">${v === 1 ? '1.0 break-even' : `€${v}`}</text>
    `).join('');
    const ticksY = [0, Y_SPLIT, Y_MAX].map(e => `
      <text x="${L - 8}" y="${py(e)}" text-anchor="end" dominant-baseline="central" font-size="10.5" fill="var(--text-3)">${e}</text>
    `).join('');

    const bubbles = list.slice().sort((a, b) => b.costMo - a.costMo).map(p => {
      const cx = px(p.vpe);
      const cy = py(p.employees);
      const r = rOf(p.costMo);
      const z = ZONES[p.zone];
      const live = p.status === 'Live';
      return `
        <g class="vl-bubble" data-q="${p.zone}" data-pilot="${p.id}" tabindex="0" role="button" aria-label="${p.name}: €${p.vpe.toFixed(2)} return per €, ${p.employees} employees">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${z.color}" fill-opacity="${live ? 0.95 : 0.8}" stroke="${live ? 'var(--text)' : 'var(--surface)'}" stroke-width="${live ? 2 : 1.5}"/>
          ${label(p, cx, cy, r)}
        </g>
      `;
    }).join('');

    return `
      <svg class="vl-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pilots by return per euro and employees affected">
        ${zone('improve', L, T, x1 - L - 3, ys - T - 3, L + 10, T + 18, 'start')}
        ${zone('implement', x1 + 3, T, R - x1 - 3, ys - T - 3, R - 10, T + 18, 'end')}
        ${zone('stop', L, ys + 3, x1 - L - 3, B - ys - 3, L + 10, B - 10, 'start')}
        ${zone('niche', x1 + 3, ys + 3, R - x1 - 3, B - ys - 3, R - 10, B - 10, 'end')}
        <line x1="${x1}" x2="${x1}" y1="${T}" y2="${B}" stroke="var(--text-3)" stroke-dasharray="4 4" stroke-width="1.2"/>
        <line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="var(--border-hover)"/>
        ${ticksX}${ticksY}
        <text x="${R}" y="${H - 4}" text-anchor="end" font-size="11" font-weight="700" fill="var(--text-2)">return per € →</text>
        <text transform="translate(12 ${(T + B) / 2}) rotate(-90)" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-2)">employees affected</text>
        ${bubbles}
      </svg>
    `;
  }

  // Opened from the overview; company KPI comes from the overview metrics
  // Return split into the four drivers for the current scope (department / month).
  // Pilots contribute their own driver(s); everyday AI use is time saved.
  function drivers(totalMo) {
    const M = D.RETURN_MODEL;
    const out = Object.fromEntries(M.drivers.map(d => [d.id, 0]));
    const list = pilots();
    const pilotSum = list.reduce((s, p) => s + p.valueMo, 0);
    const k = pilotSum > totalMo ? totalMo / pilotSum : 1; // earlier months: scale pilots into the total
    list.forEach(p => {
      const split = p.split || { [p.driver || 'time']: p.valueMo };
      Object.entries(split).forEach(([id, v]) => { out[id] += v * k; });
    });
    out.time += Math.max(0, totalMo - pilotSum * k);
    const total = Object.values(out).reduce((a, b) => a + b, 0);
    return { ...out, total, hours: out.time / M.hourlyRate };
  }

  const k1 = (n) => `€${(n / 1000).toFixed(1)}k`;

  function driverBar(dv) {
    const M = D.RETURN_MODEL;
    return `
      <div class="vl-src">
        <div class="vl-src-bar">${M.drivers.map(d => `<div style="flex:${Math.max(0.001, dv[d.id])};background:${d.color}" title="${d.label}: ${k1(dv[d.id])}"></div>`).join('')}</div>
        <div class="vl-src-legend">
          ${M.drivers.map(d => `<span><i style="background:${d.color}"></i>${d.label} <strong>${k1(dv[d.id])}</strong></span>`).join('')}
        </div>
      </div>
    `;
  }

  // Methodology pop-up: the one place where "return" is defined
  function renderMethod(totalMo, scopeLabel) {
    const M = D.RETURN_MODEL;
    const S = window.NUTEX_STATE;
    const dv = drivers(totalMo);
    const CONF = { measured: { t: 'Measured', c: 'green' }, estimate: { t: 'Estimated', c: 'yellow' } };
    // soft facts (tracked, not priced)
    const fb = D.IMPACT.kpis.find(k => k.id === 'feedback');
    const fbNow = fb.series[Math.min(fb.series.length - 1, 3 + Math.max(0, D.TREND_2026.keys.indexOf(S.state.filters.timeframe)))];
    const culture = S.computeCulture();
    const rm = window.NUTEX_ROADMAP ? window.NUTEX_ROADMAP.summary() : null;
    const comp = rm ? rm.lanes.find(l => l.id === 'rules') : null;
    const lv = (v, t) => (v >= t ? 'green' : v >= t - 10 ? 'yellow' : 'red');
    const soft = [
      { label: 'Customer feedback', value: `${fbNow}% positive`, level: lv(fbNow, 80), note: 'target 80%' },
      { label: 'Employee sentiment', value: `${culture.overallPct}% People score`, level: lv(culture.overallPct, 75), note: 'target 75%' },
      { label: 'Compliance risk', value: comp ? (comp.overdue.length ? `${comp.overdue.length} item overdue` : 'on track') : '—', level: comp ? comp.level : 'green', note: 'works council, AI Act, DPIA' }
    ];
    return `
      <section class="card card-lg ov-detail rm2" aria-label="How we calculate return">
        <div class="panel-head ov-detail-head">
          <h3>How we calculate return</h3>
          <button type="button" class="link-btn rm2-back" data-action="open-value">← Back to pilots</button>
        </div>
        <div class="rm2-formula">
          <span class="rm2-total"><small>Return ${scopeLabel}</small><strong>${k1(dv.total)}</strong><small>/month</small></span>
          <span class="rm2-eq">=</span>
          ${M.drivers.map((d, i) => `
            ${i ? '<span class="rm2-eq">+</span>' : ''}
            <span class="rm2-part" style="border-color:${d.color}"><small>${d.label}</small><strong>${k1(dv[d.id])}</strong></span>
          `).join('')}
        </div>
        <div class="rm2-table">
          <div class="rm2-tr rm2-th"><span>Driver</span><span>How it is calculated</span><span>Source · owner</span><span>Basis</span><span>€ / month</span></div>
          ${M.drivers.map(d => `
            <div class="rm2-tr">
              <span class="rm2-name"><i style="background:${d.color}"></i>${d.label}</span>
              <span><strong>${d.formula}</strong><small>${d.detail}${d.id === 'time' ? ` Today: ${Math.round(dv.hours).toLocaleString('en-US')} h valued here.` : ''}</small></span>
              <span><small>${d.source}<br>${d.owner} · ${d.freq}</small></span>
              <span><em class="ip-conf ip-conf-${CONF[d.confidence].c}">${CONF[d.confidence].t}</em></span>
              <strong class="rm2-eur">${k1(dv[d.id])}</strong>
            </div>
          `).join('')}
        </div>
        <div class="rm2-bottom">
          <div class="rm2-rules">
            <span class="vl-lbl">Rules</span>
            ${M.rules.map(r => `<span>• ${r}</span>`).join('')}
          </div>
          <div class="rm2-soft">
            <span class="vl-lbl">Soft facts · tracked, not priced</span>
            <div class="rm2-soft-grid">
              ${soft.map(x => `
                <div class="rm2-soft-card">
                  <span><i class="dot dot-${x.level}"></i>${x.label}</span>
                  <strong>${x.value}</strong>
                  <small>${x.note}</small>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function render({ ratio, valueMo, costMo, series, labels }) {
    const list = pilots();
    const prev = series.length > 1 ? series[series.length - 2] : ratio;
    const diff = ratio - prev;
    const counts = Object.keys(ZONES).map(k => ({ k, n: list.filter(p => p.zone === k).length }));
    const pv = list.reduce((s, p) => s + p.valueMo, 0);
    const pc = list.reduce((s, p) => s + p.costMo, 0);

    return `
      <section class="card card-lg vl-card" aria-label="Which pilots should we implement?">
        <div class="panel-head">
          <h3>Return per € spent</h3>
        </div>
        <div class="b2-q ov-detail-q">Which pilots should we implement?</div>
        <div class="vl-wrap" data-vl-stage>
          <div class="vl-left">
            <span class="vl-lbl">Return per € spent</span>
            <div class="vl-big">€${ratio.toFixed(2)}</div>
            <div class="vl-meta">target ≥ €1.00</div>
            <div class="vl-meta"><strong>${eurK(valueMo)} return</strong> vs <strong>${eurK(costMo)} cost</strong> per month</div>
            <div class="vl-meta ${diff >= 0 ? 'text-green' : 'text-red'}"><strong>${diff >= 0 ? '+' : ''}${diff.toFixed(2)}</strong> vs last month</div>
            ${spark(series, { color: 'var(--c-primary)' })}
            <div class="vl-axis"><span>${labels[0]}</span><span>${labels[labels.length - 1]}</span></div>

            <span class="vl-lbl" style="margin-top:12px">Where the return comes from</span>
            ${driverBar(drivers(valueMo))}
            <button type="button" class="link-btn vl-method-link" data-action="open-method">How is return calculated? →</button>

            <span class="vl-lbl" style="margin-top:12px">${list.length} use case${list.length === 1 ? '' : 's'} · ${eurK(pv)} return vs ${eurK(pc)} cost</span>
            <div class="vl-chips">
              ${counts.map(c => `
                <span class="vl-chip" data-q="${c.k}" title="${ZONES[c.k].hint}">
                  <i style="background:${ZONES[c.k].color}"></i>${ZONES[c.k].label} <strong>${c.n}</strong>
                </span>
              `).join('')}
            </div>
          </div>
          <div class="vl-right">
            ${chart(list)}
            ${list.length ? '' : `<div class="vl-empty">No AI pilots in ${deptName(window.NUTEX_STATE.state.filters.dept)} yet</div>`}
            <div class="vl-foot">Bubble size = cost per month · dark outline = live · hover a pilot for details</div>
            <div class="vl-tooltip" data-vl-tooltip role="tooltip" aria-hidden="true"></div>
          </div>
        </div>
      </section>
    `;
  }

  function cardHtml(p) {
    const z = ZONES[p.zone];
    return `
      <div class="vl-tip-head">
        <strong>${p.name}</strong>
        <span class="vl-tip-zone" style="background:${z.bg};color:${z.txt}">${z.label}</span>
      </div>
      <div class="vl-tip-sub">${p.full} · ${deptName(p.deptId)} · ${p.owner}</div>
      <div class="vl-tip-grid">
        <span>Return per €</span><strong style="color:${z.txt}">€${p.vpe.toFixed(2)}</strong>
        <span>Return / month</span><strong>${eur(p.valueMo)}</strong>
        <span>Cost / month</span><strong>${eur(p.costMo)}</strong>
        <span>Employees</span><strong>${p.employees}</strong>
        <span>Status</span><strong>${p.status} since ${p.since}</strong>
      </div>
      <div class="vl-tip-trend">
        <span>Return per € · Jun → Nov</span>
        ${miniTrend(p.trend, z.color)}
      </div>
      <div class="vl-tip-mix">${(() => {
        const split = p.split || { [p.driver || 'time']: p.valueMo };
        return Object.entries(split).map(([id, v]) => {
          const d = D.RETURN_MODEL.drivers.find(x => x.id === id);
          return `<span><i style="background:${d.color}"></i>${d.label} ${k1(v)}</span>`;
        }).join('');
      })()}</div>
      <div class="vl-tip-result">${p.result}</div>
      <div class="vl-tip-next"><span>Next step</span>${p.next}</div>
    `;
  }

  function show(stage, node) {
    const p = pilots().find(x => x.id === node.getAttribute('data-pilot'));
    const tip = stage.querySelector('[data-vl-tooltip]');
    if (!p || !tip) return;
    tip.innerHTML = cardHtml(p);
    tip.classList.add('open');
    stage.classList.add('vl-focus');
    stage.querySelectorAll('.vl-bubble').forEach(b => b.classList.toggle('is-active', b === node));

    const host = tip.parentElement.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const tw = tip.offsetWidth || 280;
    const th = tip.offsetHeight || 220;
    let left = r.right - host.left + 12;
    if (left + tw > host.width) left = r.left - host.left - tw - 12;
    let top = r.top - host.top + r.height / 2 - th / 2;
    top = Math.max(0, Math.min(host.height - th, top));
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function hide(stage) {
    if (!stage) return;
    const tip = stage.querySelector('[data-vl-tooltip]');
    if (tip) tip.classList.remove('open');
    stage.classList.remove('vl-focus');
    stage.querySelectorAll('.vl-bubble.is-active').forEach(b => b.classList.remove('is-active'));
  }

  function bind(root) {
    if (!root || root._valueBound) return;
    root._valueBound = true;
    const find = (e) => { const n = e.target.closest('.vl-bubble'); return n ? [n, n.closest('[data-vl-stage]')] : [null, null]; };
    root.addEventListener('mouseover', e => { const [n, s] = find(e); if (n && s) show(s, n); });
    root.addEventListener('mouseout', e => {
      const [n, s] = find(e);
      if (!n || (e.relatedTarget && n.contains(e.relatedTarget))) return;
      hide(s);
    });
    root.addEventListener('focusin', e => { const [n, s] = find(e); if (n && s) show(s, n); });
    root.addEventListener('focusout', e => { const [n, s] = find(e); if (n) hide(s); });
  }

  return { render, renderMethod, drivers, bind, pilots };
})();
