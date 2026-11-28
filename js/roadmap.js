/* ============================================================================
   NuTex Inc. — AI Roadmap (Data · Technology · Skills · Compliance)
   Date-based SVG timeline Jan 2026 – Dec 2027, hover/focus cards,
   critical-path highlighting and a summary used by the Overview
   (traffic light per lane + schedule score).
   ============================================================================ */

window.NUTEX_ROADMAP = (() => {
  // Current day (local time) — milestones turn overdue automatically
  const TODAY = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Phase plan: Pilot (H1 2026) → Scale (H2 2026 – H1 2027) → Embed (H2 2027)
  const PHASES = [
    { id: 'pilot', label: 'Pilot', from: '2026-01-01', to: '2026-06-30' },
    { id: 'scale', label: 'Scale', from: '2026-07-01', to: '2027-06-30' },
    { id: 'embed', label: 'Embed', from: '2027-07-01', to: '2027-12-31' }
  ];

  const P3 = '3 Production pilots (≈ €76k a year)';

  const LANES = [
    {
      id: 'data', label: 'Data',
      items: [
        { id: 'd1', short: 'Sources named',   title: 'Priority data sources identified (9)',               status: 'done',     date: '2026-03-31', owner: 'Head of IT' },
        { id: 'd2', short: 'Owners named',    title: 'A data owner named for each source',                status: 'done',     date: '2026-06-15', owner: 'VPs' },
        { id: 'd3', short: 'CRM data clean',  title: 'Sales CRM data cleaned & deduplicated',              status: 'done',     date: '2026-09-30', owner: 'Sales Ops' },
        { id: 'd4', short: 'Quality check',   title: 'Production data quality check (Plant A & B)',        status: 'open',     date: '2026-11-10', owner: null,            unlocks: P3, onPath: true },
        { id: 'd5', short: '7 of 9 sources',  title: '7 of 9 sources accessible — today 4 of 9',           status: 'open',     date: '2026-12-15', owner: 'VP Production', unlocks: P3, onPath: true },
        { id: 'd6', short: 'Plant B export',  title: 'Plant B loom machine data export',                   status: 'open',     date: '2027-03-31', owner: 'Maintenance lead', unlocks: 'Predictive Loom Maintenance pilot' },
        { id: 'd7', short: 'All 9 sources',   title: 'All 9 priority data sources connected',              status: 'proposed', date: '2027-09-30', owner: null }
      ]
    },
    {
      id: 'tech', label: 'Technology',
      items: [
        { id: 't1', short: 'Platform live',   title: 'Azure OpenAI EU gateway live',                      status: 'done',     date: '2026-04-15', owner: 'Head of IT' },
        { id: 't2', short: 'SSO & roles',     title: 'Secure SSO & role-based access',                    status: 'done',     date: '2026-07-31', owner: 'IT security' },
        { id: 't3', short: 'Spec library',    title: 'Textile spec library searchable (18,400 specs)',    status: 'done',     date: '2026-09-15', owner: 'R&D' },
        { id: 't4', short: 'ERP link',        title: 'SAP ERP link for production data',                  status: 'open',     date: '2026-10-31', owner: 'IT lead',       unlocks: P3, onPath: true },
        { id: 't5', short: 'Cost control',    title: 'Token & license cost control',                      status: 'done',     date: '2026-11-12', owner: 'Finance' },
        { id: 't6', short: 'Data platform',   title: 'Central data platform go-live',                     status: 'open',     date: '2027-01-29', owner: 'Head of IT',    unlocks: P3, onPath: true },
        { id: 't7', short: 'Core processes',  title: 'AI embedded in core processes',                     status: 'proposed', date: '2027-11-30', owner: null }
      ]
    },
    {
      id: 'skills', label: 'Skills',
      items: [
        { id: 's1', short: 'AI basics',       title: 'AI basics e-learning for all staff',                status: 'done',     date: '2026-03-15', owner: 'HR / L&D' },
        { id: 's2', short: 'Champions',       title: 'AI champion named in every team',                   status: 'done',     date: '2026-08-31', owner: 'VPs' },
        { id: 's3', short: 'Wave 2',          title: 'Training wave 2 — shopfloor & warehouse',           status: 'open',     date: '2026-12-05', owner: 'HR / L&D',      unlocks: 'Production & Logistics to 80% trained' },
        { id: 's4', short: 'AI literacy',     title: 'AI literacy records for all staff (EU AI Act Art. 4)', status: 'open',  date: '2027-03-31', owner: 'HR / Legal' },
        { id: 's5', short: 'Expert tracks',   title: 'Role-based expert tracks',                          status: 'proposed', date: '2027-09-30', owner: null }
      ]
    },
    {
      id: 'rules', label: 'Compliance',
      items: [
        { id: 'r1', short: 'AI policy',       title: 'AI usage policy published',                         status: 'done',     date: '2026-02-27', owner: 'Legal' },
        { id: 'r2', short: 'Works council',   title: 'Works council agreement on AI use',                 status: 'open',     date: '2026-11-15', owner: 'Legal / HR',    unlocks: 'Shopfloor camera & usage analytics' },
        { id: 'r3', short: 'Risk register',   title: 'AI Act risk register for all use cases',            status: 'open',     date: '2026-12-18', owner: 'Compliance' },
        { id: 'r4', short: 'DPIA camera',     title: 'Data protection impact assessment — defect camera', status: 'open',     date: '2027-02-12', owner: 'Data protection officer' },
        { id: 'r5', short: 'Audit',           title: 'External AI governance audit',                      status: 'proposed', date: '2027-10-15', owner: null }
      ]
    }
  ];

  // ---------- Geometry ----------
  const W = 1160;
  const X0 = 112;
  const X1 = 1152;
  const TOP = 34;
  const LANE_GAP = 50;
  const AXIS_Y = TOP + (LANES.length - 1) * LANE_GAP + 22 + 42;
  const H = AXIS_Y + 30;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ms = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const T0 = ms('2026-01-01');
  const T1 = ms('2027-12-31');
  const xOf = (iso) => X0 + ((ms(iso) - T0) / (T1 - T0)) * (X1 - X0);
  const fmt = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
  const daysLate = (iso) => Math.max(0, Math.round((ms(TODAY) - ms(iso)) / 86400000));

  function visualState(m) {
    if (m.status === 'done') return 'done';
    if (m.status === 'proposed') return 'proposed';
    return m.date < TODAY ? 'overdue' : 'open';
  }

  function statusMeta(m) {
    const vs = visualState(m);
    if (vs === 'done') return { text: `Done · ${fmt(m.date)}`, tone: 'done' };
    if (vs === 'overdue') return { text: `${daysLate(m.date)} days late (due ${fmt(m.date)})`, tone: 'overdue' };
    if (vs === 'proposed') return { text: `Later phase · ${fmt(m.date)}`, tone: 'proposed' };
    return { text: `Due ${fmt(m.date)}`, tone: 'open' };
  }

  const ITEM_INDEX = {};
  const LAYOUT = LANES.map((lane, li) => {
    const y = TOP + li * LANE_GAP + 22;
    const placed = lane.items.map(m => {
      const vs = visualState(m);
      const labeled = vs === 'overdue';
      const p = {
        ...m, onPath: !!m.onPath, unlocks: m.unlocks || null,
        x: xOf(m.date), y, visualState: vs, statusMeta: statusMeta(m),
        labeled, labelPos: labeled ? 'above' : null,
        lane: lane.label
      };
      ITEM_INDEX[p.id] = p;
      return p;
    });
    return { ...lane, y, placed };
  });

  // ---------- Summary for Overview (traffic light + score) ----------
  function summary() {
    const all = Object.values(ITEM_INDEX);
    const planned = all.filter(m => m.status !== 'proposed');
    const done = all.filter(m => m.status === 'done').length;
    const overdue = all.filter(m => m.visualState === 'overdue');
    const dueByToday = done + overdue.length;
    const score = Math.round((done / Math.max(1, dueByToday)) * 100);

    const lanes = LAYOUT.map(l => {
      const od = l.placed.filter(m => m.visualState === 'overdue');
      const level = laneLevel(l);
      const active = l.placed.filter(m => m.status !== 'proposed');
      return {
        id: l.id, label: l.label, level,
        done: active.filter(m => m.status === 'done').length,
        total: active.length,
        overdue: od
      };
    });
    const level = lanes.some(l => l.level === 'red') ? 'red' : lanes.some(l => l.level === 'yellow') ? 'yellow' : 'green';
    const openSorted = all
      .filter(m => m.visualState === 'overdue' || m.visualState === 'open')
      .sort((a, b) => (b.visualState === 'overdue') - (a.visualState === 'overdue') || (b.onPath - a.onPath) || a.date.localeCompare(b.date));
    const phase = PHASES.find(p => TODAY >= p.from && TODAY <= p.to) || PHASES[1];

    return {
      total: all.length, planned: planned.length, done, overdue, dueByToday, score,
      lanes, level, openSorted, phase: phase.label,
      fmt, daysLate
    };
  }

  // ---------- Render ----------
  function nodeMark(m) {
    const r = 7.5;
    const cx = m.x.toFixed(1);
    const cy = m.y;
    const parts = [];
    if (m.onPath && m.status !== 'done') {
      parts.push(`<circle class="rm-onpath-ring" cx="${cx}" cy="${cy}" r="${r + 4.5}" fill="none" stroke="var(--c-navy)" stroke-width="1.8"/>`);
    }
    if (m.visualState === 'done') {
      parts.push(`<circle class="rm-dot" cx="${cx}" cy="${cy}" r="${r}" fill="var(--c-primary)"/>`);
    } else if (m.visualState === 'overdue') {
      parts.push(`<circle class="rm-dot" cx="${cx}" cy="${cy}" r="${r}" fill="var(--surface)" stroke="var(--red)" stroke-width="2.6"/>`);
    } else if (m.visualState === 'proposed') {
      parts.push(`<circle class="rm-dot" cx="${cx}" cy="${cy}" r="${r}" fill="var(--surface)" stroke="var(--c-neutral)" stroke-width="1.8" stroke-dasharray="2.6 2.2"/>`);
    } else {
      parts.push(`<circle class="rm-dot" cx="${cx}" cy="${cy}" r="${r}" fill="var(--surface)" stroke="var(--c-primary-300)" stroke-width="2.6"/>`);
    }
    parts.push(`<circle cx="${cx}" cy="${cy}" r="15" fill="transparent"/>`);
    if (m.labeled) {
      const ly = m.labelPos === 'above' ? cy - 15 : cy + 22;
      const col = m.visualState === 'overdue' ? 'var(--red-txt)' : 'var(--text-2)';
      parts.push(`<text class="rm-label" x="${cx}" y="${ly}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${col}">${m.short}</text>`);
    }
    const aria = `${m.title} — ${m.statusMeta.text}`.replace(/"/g, '&quot;');
    return `<g class="rm-node${m.dim ? ' rm-dim' : ''}" tabindex="0" role="button" aria-label="${aria}" data-rm-id="${m.id}" data-on-path="${m.onPath ? 'true' : 'false'}">${parts.join('')}</g>`;
  }

  // Lane level: red = overdue on critical path · yellow = overdue or no owner · green = on track
  function laneLevel(l) {
    const od = l.placed.filter(m => m.visualState === 'overdue');
    const noOwner = l.placed.filter(m => m.visualState === 'open' && !m.owner);
    return od.some(m => m.onPath) ? 'red' : (od.length || noOwner.length) ? 'yellow' : 'green';
  }

  // Re-stack the selected lanes so a filtered roadmap has no gaps
  function lanesFor(ids) {
    const pick = ids && ids.length ? LAYOUT.filter(l => ids.includes(l.id)) : LAYOUT;
    return pick.map((l, i) => {
      const y = TOP + i * LANE_GAP + 22;
      return { ...l, y, placed: l.placed.map(m => ({ ...m, y })) };
    });
  }

  function renderSvg(ids, match = null) {
    const LAYOUT_V = lanesFor(ids).map(l => ({ ...l, placed: l.placed.map(m => ({ ...m, dim: !!match && !match(m) })) }));
    const AXIS_Y = TOP + (LAYOUT_V.length - 1) * LANE_GAP + 22 + 42;
    const H = AXIS_Y + 30;
    const tx = xOf(TODAY);
    const inRange = TODAY >= '2026-01-01' && TODAY <= '2027-12-31';
    const PH = {
      pilot: { fill: 'var(--c-primary-100)', text: 'var(--c-primary)', band: 'rgba(37,99,235,0.035)', sub: 'done' },
      scale: { fill: 'var(--c-primary)', text: '#FFFFFF', band: 'rgba(37,99,235,0.07)', sub: 'we are here' },
      embed: { fill: 'var(--track)', text: 'var(--text-3)', band: 'rgba(148,163,184,0.06)', sub: 'next' }
    };

    // Phase chevrons (arrow-shaped) + tinted bands behind the lanes
    const phases = PHASES.map((p, i) => {
      const x1 = xOf(p.from) + (i ? 2 : 0);
      const x2 = xOf(p.to);
      const c = PH[p.id];
      const tip = 11;
      const pts = [
        `${x1},4`, `${x2 - tip},4`, `${x2},16`, `${x2 - tip},28`, `${x1},28`,
        i ? `${x1 + tip},16` : `${x1},16`
      ].join(' ');
      return `
        <rect x="${xOf(p.from)}" y="30" width="${x2 - xOf(p.from)}" height="${AXIS_Y - 30}" fill="${c.band}"/>
        <polygon points="${pts}" fill="${c.fill}"/>
        <text x="${(x1 + x2) / 2 + (i ? 4 : -4)}" y="16" dominant-baseline="central" text-anchor="middle" font-size="11.5" fill="${c.text}">
          <tspan font-weight="750">${p.label}</tspan>
        </text>
      `;
    }).join('');

    // Time axis with arrow, quarter ticks
    const ticks = [];
    for (let y = 2026; y <= 2027; y++) {
      for (let q = 0; q < 4; q++) {
        const iso = `${y}-${String(q * 3 + 1).padStart(2, '0')}-01`;
        const x = xOf(iso);
        const x2 = xOf(q === 3 ? `${y}-12-31` : `${y}-${String(q * 3 + 4).padStart(2, '0')}-01`);
        ticks.push(`<line x1="${x}" x2="${x}" y1="${AXIS_Y - 4}" y2="${AXIS_Y + 4}" stroke="var(--text-3)" stroke-width="1"/>`);
        ticks.push(`<text x="${(x + x2) / 2}" y="${AXIS_Y + 20}" text-anchor="middle" font-size="10.5" fill="var(--text-3)">Q${q + 1} ${String(y).slice(2)}</text>`);
      }
    }

    const lanes = LAYOUT_V.map(l => {
      return `
        <g class="rm-lane">
          <text x="2" y="${l.y}" dominant-baseline="central" font-size="12.5">
            <tspan font-weight="700" fill="var(--text)">${l.label}</tspan>
          </text>
          <line x1="${X0 - 6}" y1="${l.y}" x2="${X1 - 5}" y2="${l.y}" stroke="var(--border-hover)" stroke-width="1.6" stroke-linecap="round" marker-end="url(#rm-arrow)"/>
          ${l.placed.map(nodeMark).join('')}
        </g>
      `;
    }).join('');

    const pillW = 44;
    const today = inRange ? `
      <g class="rm-today">
        <title>Today · ${fmt(TODAY)}</title>
        <line x1="${tx}" y1="30" x2="${tx}" y2="${AXIS_Y - 8}" stroke="var(--text-3)" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>
        <rect x="${tx - pillW / 2}" y="${AXIS_Y - 8}" width="${pillW}" height="16" rx="8" fill="var(--surface)" stroke="var(--border-hover)"/>
        <text x="${tx}" y="${AXIS_Y}" dominant-baseline="central" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--text-3)">Today</text>
      </g>
    ` : '';

    return `
      <svg class="roadmap-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="AI roadmap across Data, Technology, Skills and Compliance">
        <defs>
          <marker id="rm-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--border-hover)"/>
          </marker>
          <marker id="rm-axis-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-3)"/>
          </marker>
        </defs>
        ${phases}
        <line x1="${X0 - 6}" y1="${AXIS_Y}" x2="${X1 - 5}" y2="${AXIS_Y}" stroke="var(--text-3)" stroke-width="1.3" marker-end="url(#rm-axis-arrow)"/>
        ${ticks.join('')}
        ${lanes}
        ${today}
      </svg>
    `;
  }

  function legend() {
    return `
      <div class="rm-legend">
        <span class="rm-leg-item"><span class="rm-leg-dot rm-leg-done"></span>done</span>
        <span class="rm-leg-item"><span class="rm-leg-dot rm-leg-open"></span>planned, on track</span>
        <span class="rm-leg-item"><span class="rm-leg-dot rm-leg-overdue"></span>overdue</span>
        <span class="rm-leg-item"><span class="rm-leg-dot rm-leg-proposed"></span>later phase</span>
        <span class="rm-leg-item"><span class="rm-leg-dot rm-leg-path"></span>critical path</span>
      </div>
    `;
  }

  // Milestone filters used by the overlay and the overview tile
  const FILTERS = {
    critical: { label: 'Critical path', color: 'var(--c-navy)', match: (m) => m.onPath && m.status !== 'done' },
    overdue:  { label: 'Overdue',       color: 'var(--red)', match: (m) => m.visualState === 'overdue' }
  };

  function filterCounts() {
    const all = Object.values(ITEM_INDEX);
    return Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, all.filter(f.match).length]));
  }

  function filterChips(active, cls = 'rm-filter') {
    const counts = filterCounts();
    return `
      <button type="button" class="${cls} ${active ? '' : 'active'}" data-action="roadmap-filter" data-level="">All</button>
      ${Object.entries(FILTERS).map(([k, f]) => `
        <button type="button" class="${cls} ${active === k ? 'active' : ''}" data-action="roadmap-filter" data-level="${k}" ${counts[k] ? '' : 'disabled'}>
          <i style="border-color:${f.color}"></i>${f.label} <strong>${counts[k]}</strong>
        </button>
      `).join('')}
    `;
  }

  // Full roadmap; `filter` (critical|overdue) keeps only lanes with matching milestones
  function render({ filter = null } = {}) {
    const f = FILTERS[filter] || null;
    const ids = f ? LAYOUT.filter(l => l.placed.some(f.match)).map(l => l.id) : null;
    return `
      <section class="card card-lg roadmap-section" aria-label="AI roadmap">
        <div class="panel-head roadmap-head">
          <h3>AI Roadmap 2026 – 2027</h3>
          <div class="rm-filters">${filterChips(f ? filter : null)}</div>
        </div>
        <div class="roadmap-stage" data-roadmap-stage>
          ${renderSvg(ids, f ? f.match : null)}
          <div class="rm-tooltip" data-rm-tooltip role="tooltip" aria-hidden="true"></div>
        </div>
        ${legend()}
      </section>
    `;
  }

  // Roadmap thumbnail for the overview tile (lane names + dots, no other text)
  function preview() {
    const w = 520;
    const lx = 78;
    const top = 22;
    const gap = 21;
    const h = top + LAYOUT.length * gap;
    const px = (iso) => lx + ((ms(iso) - T0) / (T1 - T0)) * (w - lx - 12);
    const col = { done: 'var(--c-primary)', overdue: 'var(--red)', open: 'var(--c-primary-300)', proposed: 'var(--c-neutral)' };
    const ph = PHASES.map((p, i) => {
      const x1 = px(p.from) + (i ? 1.5 : 0);
      const x2 = px(p.to);
      const fill = p.id === 'pilot' ? 'var(--c-primary-100)' : p.id === 'scale' ? 'var(--c-primary)' : 'var(--track)';
      return `<polygon points="${x1},2 ${x2 - 6},2 ${x2},8.5 ${x2 - 6},15 ${x1},15 ${i ? x1 + 6 : x1},8.5" fill="${fill}"/>`;
    }).join('');
    const rows = LAYOUT.map((l, i) => {
      const y = top + i * gap + 6;
      return `
        <text x="0" y="${y}" dominant-baseline="central" font-size="11" font-weight="600" fill="var(--text-2)">${l.label}</text>
        <line x1="${lx - 4}" x2="${w - 6}" y1="${y}" y2="${y}" stroke="var(--border-hover)" stroke-width="1.3"/>
        <path d="M${w - 8},${y - 3.5} L${w - 1},${y} L${w - 8},${y + 3.5} z" fill="var(--border-hover)"/>
        ${l.placed.map(m => {
          const cx = px(m.date).toFixed(1);
          const ring = m.onPath && m.status !== 'done' ? `<circle cx="${cx}" cy="${y}" r="6.2" fill="none" stroke="var(--c-navy)" stroke-width="1.2"/>` : '';
          return ring + (m.visualState === 'done'
            ? `<circle cx="${cx}" cy="${y}" r="4" fill="${col.done}"/>`
            : `<circle cx="${cx}" cy="${y}" r="3.6" fill="var(--surface)" stroke="${col[m.visualState]}" stroke-width="1.8" ${m.visualState === 'proposed' ? 'stroke-dasharray="1.8 1.6"' : ''}/>`);
        }).join('')}
      `;
    }).join('');
    const tx = px(TODAY);
    return `
      <svg class="pv-svg" viewBox="-2 0 ${w + 2} ${h}" aria-hidden="true">
        ${ph}
        ${rows}
        <line x1="${tx}" x2="${tx}" y1="17" y2="${h}" stroke="var(--text-3)" stroke-dasharray="2.5 2.5" stroke-width="1" opacity="0.7"/>
      </svg>
    `;
  }

  function buildCardHtml(m) {
    return `
      <div class="rm-card-title">${m.title}</div>
      <div class="rm-card-status rm-status-${m.statusMeta.tone}">${m.statusMeta.text}</div>
      <div class="rm-card-meta"><span>${m.lane} · Owner</span><strong>${m.owner || 'Unassigned'}</strong></div>
      ${m.unlocks ? `<div class="rm-card-unlocks"><span>Unlocks</span><strong>${m.unlocks}</strong></div>` : ''}
    `;
  }

  function showCard(stage, nodeEl) {
    const m = ITEM_INDEX[nodeEl.getAttribute('data-rm-id')];
    const tip = stage.querySelector('[data-rm-tooltip]');
    if (!m || !tip) return;
    tip.innerHTML = buildCardHtml(m);
    tip.classList.add('open');
    tip.setAttribute('aria-hidden', 'false');
    stage.classList.toggle('rm-path-active', !!m.onPath);

    const sr = stage.getBoundingClientRect();
    const nr = nodeEl.getBoundingClientRect();
    const tw = tip.offsetWidth || 260;
    const th = tip.offsetHeight || 110;
    let left = (nr.left - sr.left) + nr.width / 2 - tw / 2;
    left = Math.max(8, Math.min(sr.width - tw - 8, left));
    let top = (nr.top - sr.top) - th - 10;
    if (top < 4) top = (nr.bottom - sr.top) + 10;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function hideCard(stage) {
    if (!stage) return;
    const tip = stage.querySelector('[data-rm-tooltip]');
    if (tip) { tip.classList.remove('open'); tip.setAttribute('aria-hidden', 'true'); }
    stage.classList.remove('rm-path-active');
  }

  function bind(rootEl) {
    if (!rootEl || rootEl._roadmapBound) return;
    rootEl._roadmapBound = true;
    const stageOf = (e) => { const n = e.target.closest('.rm-node'); return n ? [n, n.closest('[data-roadmap-stage]')] : [null, null]; };
    rootEl.addEventListener('mouseover', e => { const [n, s] = stageOf(e); if (n && s) showCard(s, n); });
    rootEl.addEventListener('mouseout', e => {
      const [n, s] = stageOf(e);
      if (!n || (e.relatedTarget && n.contains(e.relatedTarget))) return;
      hideCard(s);
    });
    rootEl.addEventListener('focusin', e => { const [n, s] = stageOf(e); if (n && s) showCard(s, n); });
    rootEl.addEventListener('focusout', e => { const [n, s] = stageOf(e); if (n) hideCard(s); });
    rootEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideCard(rootEl.querySelector('[data-roadmap-stage]'));
    });
  }

  return { TODAY, LANES, ITEM_INDEX, summary, render, preview, filterChips, bind };
})();
