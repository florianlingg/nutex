/* ============================================================================
   NuTex Inc. — Clean SVG Charts (Dark-Mode & Bilingual Ready)
   ============================================================================ */

window.NUTEX_CHARTS = (() => {
  const COLORS = {
    green: 'var(--green)',
    yellow: 'var(--yellow)',
    red: 'var(--red)',
    blue: 'var(--c-primary)',
    muted: 'var(--c-neutral-600)'
  };

  function color(level) { return COLORS[level] || COLORS.blue; }

  // 1. Horizontal Bars with Target Line + Clickable Department Selection
  function renderTargetBars({ items, max = 100, target = 75, unit = '%', clickableAttr = null, selectedId = null, compact = false, tight = false }) {
    const t = window.NUTEX_STATE.t;
    const maxLen = items.reduce((m, it) => Math.max(m, (it.isOwn ? 2 : 0) + String(it.label).length), 10);
    const labelW = tight
      ? Math.max(88, Math.min(138, Math.round(maxLen * 6.9 + 10)))
      : Math.max(108, Math.min(210, Math.round(maxLen * 7.6 + 18)));
    const rightW = tight ? 42 : 58;
    const w = tight ? Math.max(330, labelW + 172 + rightW) : Math.max(520, labelW + 340 + rightW);
    const barW = w - labelW - rightW;
    const rowH = tight ? (items.length <= 4 ? 30 : 24) : (compact ? 36 : 42);
    const topPad = tight ? 19 : 24;
    const bottomPad = tight ? 4 : 6;
    const h = topPad + items.length * rowH + bottomPad;
    const tx = labelW + (Math.min(target, max) / max) * barW;

    const rows = items.map((it, i) => {
      const y = topPad + i * rowH;
      const barH = tight ? 11 : (compact ? 16 : 19);
      const barY = y + (rowH - barH) / 2;
      const bw = Math.max(5, (Math.min(it.value, max) / max) * barW);
      const isSelected = selectedId && selectedId === it.id;
      const clickPart = clickableAttr && !it.locked ? `${clickableAttr}="${it.id}" class="svg-row-click"` : '';
      const hl = isSelected || it.isOwn;
      const fs = tight ? 11.5 : (compact ? 12.5 : 13);
      return `
        <g ${clickPart}>
          ${hl ? `<rect x="0" y="${y + 2}" width="${w}" height="${rowH - 4}" rx="7" fill="var(--highlight-row)" ${isSelected ? 'stroke="var(--blue)" stroke-width="1.2"' : ''}/>` : ''}
          <text x="${hl ? 8 : 2}" y="${y + rowH / 2}" text-anchor="start" dominant-baseline="central"
            font-size="${fs}" font-weight="${hl ? 700 : 500}" fill="${hl ? 'var(--blue)' : 'var(--text-2)'}">
            ${it.isOwn ? '★ ' : ''}${it.label}
          </text>
          <rect x="${labelW}" y="${barY}" width="${barW}" height="${barH}" rx="4" fill="var(--track)"/>
          ${it.locked
            ? `<text x="${labelW + 8}" y="${y + rowH / 2}" dominant-baseline="central" font-size="11" fill="var(--text-3)">${t('restricted')}</text>`
            : `<rect x="${labelW}" y="${barY}" width="${bw.toFixed(1)}" height="${barH}" rx="4" fill="${color(it.level)}" opacity="0.92"/>`
          }
          <text x="${labelW + barW + (tight ? 8 : 12)}" y="${y + rowH / 2}" dominant-baseline="central"
            font-size="${fs}" font-weight="700" fill="${it.locked ? 'var(--text-3)' : 'var(--text)'}">
            ${it.locked ? '—' : it.display}
          </text>
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;">
        ${rows}
        <line x1="${tx.toFixed(1)}" y1="${topPad - 3}" x2="${tx.toFixed(1)}" y2="${h - bottomPad + 2}"
          stroke="var(--text)" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.7"/>
        <text x="${tx.toFixed(1)}" y="${tight ? 9 : 11}" text-anchor="middle" font-size="${tight ? 9.5 : 10.5}" font-weight="600" fill="var(--text)">
          ${t('target')} ${target}${unit}
        </text>
      </svg>
    `;
  }

  // 2. Clean 3-Step License Funnel
  function renderFunnel({ purchased, assigned, active }) {
    const t = window.NUTEX_STATE.t;
    const pct = (n) => purchased > 0 ? Math.round((n / purchased) * 100) : 0;
    const steps = [
      { label: t('paid_col'),   count: purchased, p: 100, fill: 'var(--c-neutral-600)' },
      { label: window.NUTEX_STATE.state.lang === 'de' ? 'Zugewiesen' : 'Assigned', count: assigned, p: pct(assigned), fill: 'var(--c-primary)' },
      { label: t('active_col'), count: active,    p: pct(active), fill: 'var(--c-navy)' }
    ];
    return `
      <div class="funnel-simple">
        ${steps.map(s => `
          <div class="funnel-step">
            <div class="funnel-meta">
              <span>${s.label}</span>
              <strong>${s.count} <span class="muted">${s.p}%</span></strong>
            </div>
            <div class="funnel-track">
              <div class="funnel-fill" style="width:${Math.max(5, s.p)}%;background:${s.fill};"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 2b. 4-Stage Executive AI Adoption Funnel (All → AI Target Group → Trained → Weekly Users)
  function renderAdoptionFunnel({ total, targetUsers, trained, weekly, weeklyLevel = 'yellow' }) {
    const t = window.NUTEX_STATE.t;
    const base = Math.max(1, total);
    const tCount = Math.min(base, Math.max(0, targetUsers));
    const trCount = Math.min(tCount, Math.max(0, trained));
    const wCount = Math.min(trCount, Math.max(0, weekly));

    const stages = [
      { label: t('funnel_all'),     count: base,    pct: 100,                          fill: 'var(--c-neutral-600)' },
      { label: t('funnel_target'),  count: tCount,  pct: Math.round((tCount / base) * 100),  fill: 'var(--c-primary)' },
      { label: t('funnel_trained'), count: trCount, pct: Math.round((trCount / base) * 100), fill: 'var(--c-navy)' },
      { label: t('funnel_weekly'),  count: wCount,  pct: Math.round((wCount / base) * 100),  fill: color(weeklyLevel) }
    ];

    const w = 680;
    const barH = 19;
    const gap = 8;
    const topPad = 2;
    const centerX = 356;
    const maxW = 372;
    const h = topPad + stages.length * barH + (stages.length - 1) * gap + 2;

    const rects = stages.map((s, i) => {
      const bw = Math.max(20, (s.count / base) * maxW);
      const x1 = centerX - bw / 2;
      const x2 = centerX + bw / 2;
      const y = topPad + i * (barH + gap);
      return { ...s, bw, x1, x2, y };
    });

    const connectors = rects.slice(0, -1).map((r, i) => {
      const n = rects[i + 1];
      const y1 = r.y + barH - 1;
      const y2 = n.y + 1;
      return `<polygon points="${r.x1.toFixed(1)},${y1} ${r.x2.toFixed(1)},${y1} ${n.x2.toFixed(1)},${y2} ${n.x1.toFixed(1)},${y2}" fill="${n.fill}" opacity="0.16"/>`;
    }).join('');

    const rows = rects.map(r => {
      const cy = r.y + barH / 2;
      return `
        <g>
          <text x="0" y="${cy}" dominant-baseline="central" font-size="12.5" font-weight="600" fill="var(--text-2)">${r.label}</text>
          <rect x="${r.x1.toFixed(1)}" y="${r.y}" width="${r.bw.toFixed(1)}" height="${barH}" rx="5" fill="${r.fill}"/>
          <text x="${w}" y="${cy}" text-anchor="end" dominant-baseline="central" font-size="12.5">
            <tspan font-weight="700" fill="var(--text)">${r.count}</tspan>
            <tspan dx="6" font-weight="600" fill="var(--text-3)">${r.pct}%</tspan>
          </text>
        </g>
      `;
    }).join('');

    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;">${connectors}${rows}</svg>`;
  }

  // 3. Clean 2026 Area Trend Chart (Jan–Nov) with Target Line
  function renderTrendLine({ labels, actual, target, unit = '%', min = 0, max = 100 }) {
    const t = window.NUTEX_STATE.t;
    // Wide aspect so the chart stays compact (fits inside the detail pop-ups without scrolling)
    const w = 1200, h = 220, padL = 48, padR = 24, padT = 26, padB = 34;
    const pw = w - padL - padR, ph = h - padT - padB;
    const x = (i) => padL + (i / Math.max(1, labels.length - 1)) * pw;
    const y = (v) => padT + ph - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * ph;

    let grid = '';
    for (let i = 0; i <= 3; i++) {
      const val = min + ((max - min) * i) / 3;
      const gy = y(val);
      grid += `
        <line x1="${padL}" y1="${gy.toFixed(1)}" x2="${w - padR}" y2="${gy.toFixed(1)}" stroke="var(--grid)" stroke-width="1"/>
        <text x="${padL - 10}" y="${gy.toFixed(1)}" text-anchor="end" dominant-baseline="central" font-size="11" fill="var(--text-3)">${Math.round(val)}${unit}</text>
      `;
    }

    const ty = y(target);
    const pts = actual.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const areaPts = `${x(0).toFixed(1)},${(padT + ph).toFixed(1)} ${pts} ${x(actual.length - 1).toFixed(1)},${(padT + ph).toFixed(1)}`;

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--c-primary)" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="var(--c-primary)" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${grid}
        ${labels.map((l, i) => `<text x="${x(i).toFixed(1)}" y="${h - 10}" text-anchor="middle" font-size="11" fill="var(--text-3)">${l}</text>`).join('')}
        <polygon points="${areaPts}" fill="url(#trendGrad)"/>
        <line x1="${padL}" y1="${ty.toFixed(1)}" x2="${w - padR}" y2="${ty.toFixed(1)}" stroke="var(--c-neutral)" stroke-width="1.6" stroke-dasharray="5,5"/>
        <text x="${w - padR}" y="${ty - 7}" text-anchor="end" font-size="11" font-weight="600" fill="var(--text-3)">${t('target')} ${target}${unit}</text>
        <polyline points="${pts}" fill="none" stroke="var(--c-primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
        ${actual.map((v, i) => `
          <circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4.2" fill="var(--surface)" stroke="var(--c-primary)" stroke-width="2.4"/>
          <text x="${x(i).toFixed(1)}" y="${y(v) - 11}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--text)">${v}${unit}</text>
        `).join('')}
      </svg>
    `;
  }

  return { color, renderTargetBars, renderFunnel, renderAdoptionFunnel, renderTrendLine };
})();
