/* ============================================================================
   NuTex Inc. — Executive PDF & Native PowerPoint (.pptx) Generator
   100% Offline, Zero Dependencies, Light & Dark Mode, Bilingual (EN / DE)
   ============================================================================ */

window.NUTEX_EXPORT = (() => {
  const D = window.NUTEX_DATA;
  const S = window.NUTEX_STATE;

  // --- Minimal UTF-8 & CRC32 ZIP Writer (Standard Store Method, 100% PPTX Compatible) ---
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function toUtf8(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
    return new Uint8Array(out);
  }

  function buildZip(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;

    files.forEach(({ name, content }) => {
      const nameBytes = toUtf8(name);
      const dataBytes = typeof content === 'string' ? toUtf8(content) : content;
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      // Local File Header (30 bytes + name)
      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034B50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8 flag
      lv.setUint16(8, 0, true);      // Store
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x5421, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);

      locals.push(lh, dataBytes);

      // Central Directory Header (46 bytes + name)
      const ch = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014B50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x5421, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      ch.set(nameBytes, 46);

      centrals.push(ch);
      offset += lh.length + dataBytes.length;
    });

    const centralStart = offset;
    let centralSize = 0;
    centrals.forEach(c => { centralSize += c.length; });

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054B50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralStart, true);
    ev.setUint16(20, 0, true);

    const totalLen = offset + centralSize + 22;
    const out = new Uint8Array(totalLen);
    let pos = 0;
    locals.forEach(part => { out.set(part, pos); pos += part.length; });
    centrals.forEach(part => { out.set(part, pos); pos += part.length; });
    out.set(eocd, pos);
    return out;
  }

  // --- OOXML Presentation Helpers (16:9 Widescreen: 13.333 in x 7.5 in) ---
  const EMU = (inches) => Math.round(inches * 914400);
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  function getPalette() {
    const dark = S.state.theme === 'dark';
    return dark ? {
      bg: '0B1120', surface: '111827', soft: '172033', track: '1E293B', border: '1F2937',
      text: 'F8FAFC', text2: 'CBD5E1', muted: '94A3B8',
      blue: '3B82F6', green: '10B981', yellow: 'F59E0B', red: 'EF4444', purple: '8B5CF6'
    } : {
      bg: 'F3F5F9', surface: 'FFFFFF', soft: 'FAFBFD', track: 'E2E8F0', border: 'E6EAF0',
      text: '0F172A', text2: '475569', muted: '64748B',
      blue: '2563EB', green: '10B981', yellow: 'F59E0B', red: 'EF4444', purple: '8B5CF6'
    };
  }

  function statusHex(level, P) {
    return level === 'green' ? P.green : level === 'yellow' ? P.yellow : P.red;
  }

  // Shape builder helpers
  function createSlideBuilder(P) {
    let shapeId = 2;
    const shapes = [];

    function rect({ x, y, w, h, fill, border = null, radius = 0.08 }) {
      const id = shapeId++;
      const prst = radius > 0 ? 'roundRect' : 'rect';
      const avLst = radius > 0 ? `<a:avLst><a:gd name="adj" fmla="val ${Math.round(radius * 100000)}"/></a:avLst>` : '<a:avLst/>';
      const ln = border
        ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${border}"/></a:solidFill></a:ln>`
        : '<a:ln><a:noFill/></a:ln>';
      shapes.push(`
        <p:sp>
          <p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
          <p:spPr>
            <a:xfrm><a:off x="${EMU(x)}" y="${EMU(y)}"/><a:ext cx="${EMU(w)}" cy="${EMU(h)}"/></a:xfrm>
            <a:prstGeom prst="${prst}">${avLst}</a:prstGeom>
            <a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>
            ${ln}
          </p:spPr>
          <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
        </p:sp>
      `);
    }

    function text({ x, y, w, h, content, size = 14, color = P.text, bold = false, align = 'l', valign = 't' }) {
      const id = shapeId++;
      const lines = String(content ?? '').split('\n');
      const paras = lines.map(line => `
        <a:p>
          <a:pPr algn="${align}"/>
          <a:r>
            <a:rPr lang="${S.state.lang === 'de' ? 'de-DE' : 'en-US'}" sz="${Math.round(size * 100)}" b="${bold ? 1 : 0}" dirty="0">
              <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
              <a:latin typeface="Calibri"/>
            </a:rPr>
            <a:t>${esc(line)}</a:t>
          </a:r>
        </a:p>
      `).join('');

      shapes.push(`
        <p:sp>
          <p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
          <p:spPr>
            <a:xfrm><a:off x="${EMU(x)}" y="${EMU(y)}"/><a:ext cx="${EMU(w)}" cy="${EMU(h)}"/></a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            <a:noFill/>
          </p:spPr>
          <p:txBody>
            <a:bodyPr wrap="square" anchor="${valign}" lIns="0" tIns="0" rIns="0" bIns="0"/>
            <a:lstStyle/>
            ${paras}
          </p:txBody>
        </p:sp>
      `);
    }

    function progressBar({ x, y, w, h = 0.14, pct, targetPct = null, fillColor }) {
      rect({ x, y, w, h, fill: P.track, radius: 0.4 });
      const fw = Math.max(0.12, (Math.min(100, Math.max(0, pct)) / 100) * w);
      rect({ x, y, w: fw, h, fill: fillColor, radius: 0.4 });
      if (targetPct !== null) {
        const tx = x + (Math.min(100, targetPct) / 100) * w;
        rect({ x: tx - 0.015, y: y - 0.04, w: 0.03, h: h + 0.08, fill: P.text, radius: 0 });
      }
    }

    function header(title, subtitle, pageNum) {
      text({ x: 0.65, y: 0.42, w: 9.5, h: 0.45, content: title, size: 24, bold: true, color: P.text });
      text({ x: 0.65, y: 0.86, w: 9.5, h: 0.3, content: subtitle, size: 12, color: P.muted });
      text({ x: 11.4, y: 0.48, w: 1.3, h: 0.3, content: `${pageNum} / 6`, size: 11, color: P.muted, align: 'r' });
    }

    function toXml() {
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${P.bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${shapes.join('\n')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
    }

    return { rect, text, progressBar, header, toXml };
  }

  // --- AI-Generated Executive Narrative for the Selected Month ---
  function buildAISummary(metrics, culture) {
    const de = S.state.lang === 'de';
    const ranked = metrics.rows.slice().sort((a, b) => b.weeklyPct - a.weeklyPct);
    const top = ranked[0];
    const low = ranked[ranked.length - 1];
    const showFin = S.canViewFinancials();
    const eur = (n) => '€' + Math.round(n).toLocaleString(S.state.lang === 'de' ? 'de-DE' : 'en-US');

    if (de) {
      return {
        bullets: [
          `KI-Nutzung im ${metrics.tf.label}: ${metrics.weeklyPct}% (${metrics.weeklyUsers} von ${metrics.totalEmp} MA) nutzen KI wöchentlich — ${top ? `${top.dept.name} führt mit ${top.weeklyPct}%` : ''}, ${low ? `${low.dept.name} liegt bei ${low.weeklyPct}%` : ''}.`,
          showFin
            ? `Budget & Lizenzen: ${eur(metrics.totalSpendMo)} von ${eur(metrics.budgetLimit)} (${metrics.budgetUsedPct}%) verbraucht inkl. ${metrics.totalTokensM}M API-Tokens (${eur(metrics.tokenSpendMo)}). ${metrics.unusedLicenses} ungenutzte Lizenzen bieten direktes Einsparpotenzial.`
            : `Schulung & Lizenzen: ${metrics.trainedPct}% der Belegschaft geschult (${metrics.untrainedCount} offen) und ${metrics.unusedLicenses} bezahlte Lizenzen aktuell ungenutzt.`,
          `Kultur & Pipeline: ${culture.overallPct}% positive Rückmeldung in der Monatsumfrage (Top-Wunsch: ${culture.wishRanking[0]?.name || '—'}). ${metrics.pendingProjects.length} Projekt- und ${metrics.pendingTrainings.length} Schulungsanträge warten auf Entscheidung.`
        ],
        actions: [
          `${metrics.pendingProjects.length} offene KI-Projekte & ${metrics.pendingTrainings.length} Schulungsbudgets entscheiden`,
          `${Math.min(metrics.unusedLicenses, metrics.openRequests)} ungenutzte Lizenzen auf offene Anfragen umverteilen`,
          low ? `Gezieltes KI-Training & Support für ${low.dept.name} (${low.trainedPct}% geschult) starten` : 'Trainingsquote Richtung 80%-Ziel ausbauen'
        ]
      };
    }

    return {
      bullets: [
        `AI adoption in ${metrics.tf.label}: ${metrics.weeklyPct}% (${metrics.weeklyUsers} of ${metrics.totalEmp} employees) use AI weekly — ${top ? `${top.dept.name} leads at ${top.weeklyPct}%` : ''}, while ${low ? `${low.dept.name} trails at ${low.weeklyPct}%` : ''}.`,
        showFin
          ? `Budget & licenses: ${eur(metrics.totalSpendMo)} of ${eur(metrics.budgetLimit)} (${metrics.budgetUsedPct}%) spent, including ${metrics.totalTokensM}M API tokens (${eur(metrics.tokenSpendMo)}). ${metrics.unusedLicenses} unused seats can be reallocated or cut.`
          : `Training & licenses: ${metrics.trainedPct}% trained (${metrics.untrainedCount} remaining) with ${metrics.unusedLicenses} paid licenses currently unused.`,
        `Culture & pipeline: ${culture.overallPct}% positive employee pulse (top requested tool: ${culture.wishRanking[0]?.name || '—'}). ${metrics.pendingProjects.length} project and ${metrics.pendingTrainings.length} training proposals await approval.`
      ],
      actions: [
        `Decide on ${metrics.pendingProjects.length} pending AI projects & ${metrics.pendingTrainings.length} training budgets`,
        `Reallocate ${Math.min(metrics.unusedLicenses, metrics.openRequests)} unused licenses to fill open requests`,
        low ? `Focus hands-on enablement on ${low.dept.name} (${low.trainedPct}% trained)` : 'Close remaining gap to 80% training target'
      ]
    };
  }

  function generatePptxBytes() {
    const P = getPalette();
    const t = S.t;
    const de = S.state.lang === 'de';
    const metrics = S.computeMetrics();
    const culture = S.computeCulture();
    const role = S.getRole();
    const showFin = S.canViewFinancials();
    const ai = buildAISummary(metrics, culture);
    const eur = (n) => '€' + Math.round(n).toLocaleString(S.state.lang === 'de' ? 'de-DE' : 'en-US');
    const deptName = (id) => D.DEPARTMENTS.find(d => d.id === id)?.name || id;
    const scopeText = `${metrics.tf.label} · ${metrics.totalEmp} ${t('employees')} · ${role.name} (${role.title})`;

    // --- SLIDE 1: Title, 3 Hero KPIs & AI Executive Summary ---
    const s1 = createSlideBuilder(P);
    s1.text({ x: 0.65, y: 0.55, w: 11.5, h: 0.65, content: de ? `AI Executive Report — ${metrics.tf.label}` : `AI Executive Report — ${metrics.tf.label}`, size: 32, bold: true });
    s1.text({ x: 0.65, y: 1.22, w: 10.5, h: 0.32, content: scopeText, size: 13, color: P.muted });

    const heroCards = [
      {
        title: t('employees_using_ai'),
        val: `${metrics.weeklyPct}%`,
        sub: `${metrics.weeklyUsers} / ${metrics.totalEmp} · ${t('target')} ${S.weeklyTarget(metrics.rows)}%`,
        pct: metrics.weeklyPct, tgt: S.weeklyTarget(metrics.rows),
        col: statusHex(S.getStatus(metrics.weeklyPct, S.weeklyTarget(metrics.rows)).level, P)
      },
      {
        title: t('employees_trained'),
        val: `${metrics.trainedPct}%`,
        sub: `${metrics.untrainedCount} ${t('untrained_suffix')} · ${t('target')} ${D.TARGETS.trainingPct}%`,
        pct: metrics.trainedPct, tgt: D.TARGETS.trainingPct,
        col: statusHex(S.getStatus(metrics.trainedPct, D.TARGETS.trainingPct).level, P)
      },
      showFin ? {
        title: t('monthly_budget'),
        val: eur(metrics.totalSpendMo),
        sub: `${metrics.budgetUsedPct}% / ${eur(metrics.budgetLimit)} · ${metrics.totalTokensM}M ${t('tokens_short')}`,
        pct: metrics.budgetUsedPct, tgt: 100,
        col: statusHex(metrics.budgetUsedPct > 95 ? 'red' : metrics.budgetUsedPct > 80 ? 'yellow' : 'green', P)
      } : {
        title: t('nav_culture'),
        val: `${culture.overallPct}%`,
        sub: `${culture.totalResponses} / ${culture.totalEmp} ${t('responses')}`,
        pct: culture.overallPct, tgt: 75,
        col: statusHex(S.getStatus(culture.overallPct, 75).level, P)
      }
    ];

    heroCards.forEach((c, idx) => {
      const cx = 0.65 + idx * 4.12;
      s1.rect({ x: cx, y: 1.78, w: 3.85, h: 2.05, fill: P.surface, border: P.border, radius: 0.08 });
      s1.text({ x: cx + 0.25, y: 2.0, w: 3.35, h: 0.3, content: c.title, size: 12, bold: true, color: P.text2 });
      s1.text({ x: cx + 0.25, y: 2.38, w: 3.35, h: 0.65, content: c.val, size: 34, bold: true, color: P.text });
      s1.progressBar({ x: cx + 0.25, y: 3.16, w: 3.35, h: 0.13, pct: c.pct, targetPct: c.tgt, fillColor: c.col });
      s1.text({ x: cx + 0.25, y: 3.42, w: 3.35, h: 0.28, content: c.sub, size: 11, color: P.muted });
    });

    // AI Executive Summary Box
    s1.rect({ x: 0.65, y: 4.15, w: 12.03, h: 2.72, fill: P.surface, border: P.border, radius: 0.07 });
    s1.rect({ x: 0.65, y: 4.15, w: 0.09, h: 2.72, fill: P.blue, radius: 0 });
    s1.text({ x: 0.95, y: 4.38, w: 10, h: 0.35, content: de ? 'KI-Zusammenfassung (Executive Summary)' : 'AI Executive Summary', size: 15, bold: true, color: P.blue });
    ai.bullets.forEach((b, i) => {
      s1.text({ x: 0.95, y: 4.86 + i * 0.62, w: 11.4, h: 0.56, content: `•  ${b}`, size: 12.5, color: P.text2 });
    });

    // --- SLIDE 2: AI Adoption by Department & Tools ---
    const s2 = createSlideBuilder(P);
    s2.header(t('ai_adoption'), scopeText, 2);

    // Left Card: By Department
    s2.rect({ x: 0.65, y: 1.4, w: 6.3, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s2.text({ x: 0.95, y: 1.65, w: 5.5, h: 0.35, content: `${t('usage_by_dept')} (${t('target')} ${S.weeklyTarget(metrics.rows)}%)`, size: 15, bold: true });

    const rankedDepts = metrics.rows.slice().sort((a, b) => b.weeklyPct - a.weeklyPct);
    rankedDepts.forEach((r, i) => {
      const ry = 2.25 + i * 0.72;
      const col = statusHex(S.getStatus(r.weeklyPct, S.weeklyTarget([r.dept])).level, P);
      s2.text({ x: 0.95, y: ry, w: 1.45, h: 0.35, content: r.dept.name, size: 13, bold: true, color: P.text2, valign: 'ctr' });
      s2.progressBar({ x: 2.45, y: ry + 0.08, w: 3.4, h: 0.2, pct: r.weeklyPct, targetPct: S.weeklyTarget([r.dept]), fillColor: col });
      s2.text({ x: 5.95, y: ry, w: 0.8, h: 0.35, content: `${r.weeklyPct}%`, size: 13, bold: true, align: 'r', valign: 'ctr' });
    });

    // Right Card: By Tool
    s2.rect({ x: 7.25, y: 1.4, w: 5.43, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s2.text({ x: 7.55, y: 1.65, w: 4.8, h: 0.35, content: `${t('usage_by_tool')} (${t('active_seats')})`, size: 15, bold: true });

    const rankedTools = metrics.toolUsage.slice().sort((a, b) => b.activePct - a.activePct);
    rankedTools.forEach((tool, i) => {
      const ry = 2.3 + i * 0.95;
      const col = statusHex(S.getStatus(tool.activePct, D.TARGETS.licenseActivePct).level, P);
      s2.text({ x: 7.55, y: ry, w: 3.6, h: 0.3, content: tool.name, size: 13, bold: true, color: P.text });
      s2.text({ x: 11.2, y: ry, w: 1.15, h: 0.3, content: `${tool.activePct}%`, size: 13, bold: true, align: 'r', color: col });
      s2.progressBar({ x: 7.55, y: ry + 0.38, w: 4.8, h: 0.18, pct: tool.activePct, targetPct: D.TARGETS.licenseActivePct, fillColor: col });
    });

    // --- SLIDE 3: Projects & Trainings Pipeline ---
    const s3 = createSlideBuilder(P);
    s3.header(`${t('nav_projects')} & ${t('nav_trainings')}`, scopeText, 3);

    // Left: Projects
    s3.rect({ x: 0.65, y: 1.4, w: 5.9, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s3.text({ x: 0.95, y: 1.65, w: 5.3, h: 0.35, content: `${t('nav_projects')} (${metrics.pendingProjects.length} ${t('Pending')})`, size: 15, bold: true });
    metrics.projects.slice(0, 4).forEach((p, i) => {
      const ry = 2.18 + i * 1.12;
      const pCol = p.status === 'Approved' ? P.green : p.status === 'Pending' ? P.yellow : p.status === 'Blocked' ? P.red : P.muted;
      s3.rect({ x: 0.92, y: ry, w: 5.36, h: 0.96, fill: P.soft, border: P.border, radius: 0.08 });
      s3.text({ x: 1.1, y: ry + 0.1, w: 3.9, h: 0.28, content: `${p.name} (${deptName(p.deptId)})`, size: 12, bold: true });
      s3.text({ x: 5.05, y: ry + 0.1, w: 1.05, h: 0.28, content: t(p.status), size: 11, bold: true, color: pCol, align: 'r' });
      s3.text({ x: 1.1, y: ry + 0.42, w: 4.95, h: 0.42, content: `${p.outcome}${showFin && p.budget ? ` · ${eur(p.budget)}` : ''}`, size: 11, color: P.text2 });
    });

    // Right: Trainings
    s3.rect({ x: 6.8, y: 1.4, w: 5.88, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s3.text({ x: 7.1, y: 1.65, w: 5.3, h: 0.35, content: `${t('nav_trainings')} (${metrics.trainedPct}% ${t('trained_suffix')})`, size: 15, bold: true });
    metrics.trainings.slice(0, 4).forEach((tr, i) => {
      const ry = 2.18 + i * 1.12;
      const trCol = tr.status === 'Approved' ? P.green : tr.status === 'Pending' ? P.yellow : P.muted;
      s3.rect({ x: 7.07, y: ry, w: 5.34, h: 0.96, fill: P.soft, border: P.border, radius: 0.08 });
      s3.text({ x: 7.25, y: ry + 0.1, w: 3.9, h: 0.28, content: `${tr.name} (${tr.participants} ${t('emp')})`, size: 12, bold: true });
      s3.text({ x: 11.2, y: ry + 0.1, w: 1.05, h: 0.28, content: t(tr.status), size: 11, bold: true, color: trCol, align: 'r' });
      s3.text({ x: 7.25, y: ry + 0.42, w: 4.95, h: 0.42, content: `${tr.outcome}${showFin && tr.budget ? ` · ${eur(tr.budget)}` : ''}`, size: 11, color: P.text2 });
    });

    // --- SLIDE 4: Licenses & Budget / API Tokens ---
    const s4 = createSlideBuilder(P);
    s4.header(showFin ? `${t('nav_licenses')}, ${t('nav_budget')} & Tokens` : t('nav_licenses'), scopeText, 4);

    // Left: Licenses
    s4.rect({ x: 0.65, y: 1.4, w: 5.8, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s4.text({ x: 0.95, y: 1.65, w: 5.2, h: 0.35, content: t('licenses'), size: 15, bold: true });
    s4.text({ x: 0.95, y: 2.15, w: 5.2, h: 0.55, content: `${metrics.unusedLicenses} ${t('unused')} / ${metrics.purchased} ${t('paid')}`, size: 22, bold: true });
    const lSteps = [
      { l: t('paid_col'), v: metrics.purchased, p: 100, c: '475569' },
      { l: de ? 'Zugewiesen' : 'Assigned', v: metrics.assigned, p: Math.round((metrics.assigned / Math.max(1, metrics.purchased)) * 100), c: P.blue },
      { l: t('active_col'), v: metrics.activeSeats, p: metrics.licenseActivePct, c: P.green }
    ];
    lSteps.forEach((st, i) => {
      const ry = 2.95 + i * 0.95;
      s4.text({ x: 0.95, y: ry, w: 3.0, h: 0.3, content: st.l, size: 12.5, color: P.text2 });
      s4.text({ x: 4.0, y: ry, w: 2.15, h: 0.3, content: `${st.v} (${st.p}%)`, size: 12.5, bold: true, align: 'r' });
      s4.progressBar({ x: 0.95, y: ry + 0.36, w: 5.2, h: 0.2, pct: st.p, fillColor: st.c });
    });
    s4.text({ x: 0.95, y: 6.1, w: 5.2, h: 0.4, content: `${metrics.openRequests} ${t('open_requests')}${showFin ? ` · ${eur(metrics.costPerActive)} ${t('per_active_user')}` : ''}`, size: 12, color: P.muted });

    // Right: Budget & Tokens (CEO) or Dept License Breakdown (VP)
    s4.rect({ x: 6.75, y: 1.4, w: 5.93, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    if (showFin) {
      s4.text({ x: 7.05, y: 1.65, w: 5.3, h: 0.35, content: `${t('monthly_budget')} & ${t('token_usage_cost')}`, size: 15, bold: true });
      s4.text({ x: 7.05, y: 2.15, w: 5.3, h: 0.55, content: `${eur(metrics.totalSpendMo)} / ${eur(metrics.budgetLimit)} (${metrics.budgetUsedPct}%)`, size: 22, bold: true });
      const spTotal = Math.max(1, metrics.totalSpendMo);
      const bItems = [
        { l: t('ai_licenses'), v: metrics.licenseSpendMo, c: P.blue },
        { l: `${t('api_tokens')} (${metrics.totalTokensM}M)`, v: metrics.tokenSpendMo, c: P.purple },
        { l: t('approved_projects'), v: metrics.projectSpendMo, c: P.green },
        { l: t('approved_trainings'), v: metrics.trainingSpendMo, c: P.yellow }
      ];
      bItems.forEach((bi, i) => {
        const ry = 2.95 + i * 0.85;
        const pct = Math.round((bi.v / spTotal) * 100);
        s4.text({ x: 7.05, y: ry, w: 3.4, h: 0.28, content: bi.l, size: 12, color: P.text2 });
        s4.text({ x: 10.5, y: ry, w: 1.85, h: 0.28, content: `${eur(bi.v)} (${pct}%)`, size: 12, bold: true, align: 'r' });
        s4.progressBar({ x: 7.05, y: ry + 0.34, w: 5.3, h: 0.16, pct, fillColor: bi.c });
      });
    } else {
      s4.text({ x: 7.05, y: 1.65, w: 5.3, h: 0.35, content: `${t('licenses')} · ${t('by_dept')}`, size: 15, bold: true });
      metrics.rows.slice().sort((a, b) => b.unusedLicenses - a.unusedLicenses).forEach((r, i) => {
        const ry = 2.3 + i * 0.72;
        s4.text({ x: 7.05, y: ry, w: 2.1, h: 0.32, content: r.dept.name, size: 13, bold: true });
        s4.text({ x: 9.2, y: ry, w: 1.6, h: 0.32, content: `${r.activeSeats}/${r.purchased} ${t('active')}`, size: 12, color: P.text2 });
        s4.text({ x: 10.85, y: ry, w: 1.5, h: 0.32, content: `${r.unusedLicenses} ${t('unused')}`, size: 12, bold: true, color: r.unusedLicenses >= 20 ? P.red : P.green, align: 'r' });
      });
    }

    // --- SLIDE 5: Employee Culture & Most Wanted Tools ---
    const s5 = createSlideBuilder(P);
    s5.header(t('nav_culture'), `${metrics.tf.label} · ${culture.totalResponses} / ${culture.totalEmp} ${t('responses')} (${culture.responsePct}%)`, 5);

    // Left: 5 Survey Questions
    s5.rect({ x: 0.65, y: 1.4, w: 6.4, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s5.text({ x: 0.95, y: 1.65, w: 5.8, h: 0.35, content: t('culture_pulse'), size: 15, bold: true });
    culture.questions.forEach((q, i) => {
      const ry = 2.25 + i * 0.88;
      const col = statusHex(S.getStatus(q.pct, 75).level, P);
      s5.text({ x: 0.95, y: ry, w: 4.8, h: 0.3, content: q.label, size: 12.5, color: P.text2 });
      s5.text({ x: 5.85, y: ry, w: 0.9, h: 0.3, content: `${q.pct}%`, size: 13, bold: true, color: col, align: 'r' });
      s5.progressBar({ x: 0.95, y: ry + 0.36, w: 5.8, h: 0.16, pct: q.pct, targetPct: 75, fillColor: col });
    });

    // Right: Most Wanted Tools Ranking
    s5.rect({ x: 7.35, y: 1.4, w: 5.33, h: 5.5, fill: P.surface, border: P.border, radius: 0.06 });
    s5.text({ x: 7.65, y: 1.65, w: 4.7, h: 0.35, content: t('culture_wishes'), size: 15, bold: true });
    const maxV = Math.max(1, culture.wishRanking[0]?.votes || 1);
    culture.wishRanking.forEach((w, i) => {
      const ry = 2.25 + i * 0.88;
      s5.text({ x: 7.65, y: ry, w: 3.5, h: 0.3, content: `#${i + 1}  ${w.name}`, size: 13, bold: true });
      s5.text({ x: 11.2, y: ry, w: 1.15, h: 0.3, content: `${w.votes} ${t('votes')}`, size: 12, color: P.muted, align: 'r' });
      s5.progressBar({ x: 7.65, y: ry + 0.36, w: 4.7, h: 0.14, pct: Math.round((w.votes / maxV) * 100), fillColor: P.blue });
    });

    // --- SLIDE 6: 2026 Progress (Jan–Nov) & Recommended Next Steps ---
    const s6 = createSlideBuilder(P);
    s6.header(t('progress_2026'), scopeText, 6);

    const trend = S.computeTrendSeries('weekly');
    s6.rect({ x: 0.65, y: 1.4, w: 12.03, h: 3.15, fill: P.surface, border: P.border, radius: 0.06 });
    s6.text({ x: 0.95, y: 1.6, w: 8, h: 0.3, content: `${t('metric_weekly')} · ${trend.scopeLabel} (${t('target')} ${trend.target}%)`, size: 14, bold: true });

    // Clean 11-Month Column Chart
    const chartBaseY = 4.05;
    const maxBarH = 1.8;
    const colStartX = 1.05;
    const colGap = 1.03;
    // Target Line across columns
    const targetY = chartBaseY - (trend.target / 100) * maxBarH;
    s6.rect({ x: 0.95, y: targetY, w: 11.4, h: 0.02, fill: P.green, radius: 0 });
    trend.actual.forEach((val, i) => {
      const bx = colStartX + i * colGap;
      const bh = Math.max(0.12, (val / 100) * maxBarH);
      const by = chartBaseY - bh;
      const isCurrent = D.TREND_2026.keys[i] === S.state.filters.timeframe;
      s6.rect({ x: bx, y: by, w: 0.62, h: bh, fill: isCurrent ? P.green : P.blue, radius: 0.12 });
      s6.text({ x: bx - 0.05, y: by - 0.25, w: 0.72, h: 0.22, content: `${val}%`, size: 10.5, bold: true, align: 'ctr' });
      s6.text({ x: bx - 0.08, y: chartBaseY + 0.08, w: 0.78, h: 0.24, content: trend.labels[i], size: 9.5, color: P.muted, align: 'ctr' });
    });

    // Bottom: Recommended Next Steps
    s6.rect({ x: 0.65, y: 4.8, w: 12.03, h: 2.1, fill: P.surface, border: P.border, radius: 0.06 });
    s6.text({ x: 0.95, y: 5.0, w: 9, h: 0.32, content: de ? 'Empfohlene nächste Schritte' : 'Recommended Next Steps', size: 15, bold: true, color: P.blue });
    ai.actions.forEach((act, i) => {
      const ax = 0.95 + i * 3.88;
      s6.rect({ x: ax, y: 5.45, w: 3.65, h: 1.2, fill: P.soft, border: P.border, radius: 0.08 });
      s6.text({ x: ax + 0.18, y: 5.58, w: 3.3, h: 0.25, content: `0${i + 1}`, size: 12, bold: true, color: P.blue });
      s6.text({ x: ax + 0.18, y: 5.88, w: 3.3, h: 0.68, content: act, size: 11.5, color: P.text });
    });

    const slides = [s1.toXml(), s2.toXml(), s3.toXml(), s4.toXml(), s5.toXml(), s6.toXml()];

    // --- Standard OOXML Package Files ---
    const files = [
      {
        name: '[Content_Types].xml',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
</Types>`
      },
      {
        name: '_rels/.rels',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
      },
      {
        name: 'ppt/presentation.xml',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    ${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
      },
      {
        name: 'ppt/_rels/presentation.xml.rels',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('\n  ')}
</Relationships>`
      },
      {
        name: 'ppt/slideMasters/slideMaster1.xml',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`
      },
      {
        name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
      },
      {
        name: 'ppt/slideLayouts/slideLayout1.xml',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`
      },
      {
        name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
      },
      {
        name: 'ppt/theme/theme1.xml',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="DashboardTheme">
  <a:themeElements>
    <a:clrScheme name="Dashboard">
      <a:dk1><a:srgbClr val="0F172A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2><a:lt2><a:srgbClr val="F3F5F9"/></a:lt2>
      <a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="10B981"/></a:accent2>
      <a:accent3><a:srgbClr val="F59E0B"/></a:accent3><a:accent4><a:srgbClr val="EF4444"/></a:accent4>
      <a:accent5><a:srgbClr val="8B5CF6"/></a:accent5><a:accent6><a:srgbClr val="64748B"/></a:accent6>
      <a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Clean">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Clean"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`
      }
    ];

    slides.forEach((xml, i) => {
      files.push({ name: `ppt/slides/slide${i + 1}.xml`, content: xml });
      files.push({
        name: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
      });
    });

    return buildZip(files);
  }

  function exportPowerPoint() {
    const metrics = S.computeMetrics();
    const bytes = generatePptxBytes();
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Executive_Report_${metrics.tf.label.replace(/\s+/g, '_')}.pptx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // --- Structured Executive PDF Export (Respects Light & Full-Bleed Dark Mode!) ---
  function syncPrintPageTheme() {
    const pageStyle = document.getElementById('print-page-style');
    if (pageStyle) {
      const bg = S.state.theme === 'dark' ? '#0B1120' : '#F3F5F9';
      pageStyle.textContent = `@media print { @page { margin: 0; background: ${bg}; } }`;
    }
  }

  function preparePrintHeader() {
    syncPrintPageTheme();
    const metrics = S.computeMetrics();
    const role = S.getRole();
    const printHeader = document.getElementById('print-header');
    if (printHeader) {
      const tabTitle = S.t('nav_' + S.state.activeTab);
      printHeader.innerHTML = `
        <div class="print-head-left">
          <strong>AI Executive Report · ${tabTitle}</strong>
          <span>${metrics.tf.label} · ${metrics.totalEmp} ${S.t('employees')} · ${role.name} (${role.title})</span>
        </div>
        <div class="print-head-right">${new Date().toISOString().slice(0, 10)}</div>
      `;
    }
  }

  function exportPDF() {
    preparePrintHeader();
    window.print();
  }

  return { generatePptxBytes, exportPowerPoint, exportPDF, preparePrintHeader, syncPrintPageTheme };
})();
