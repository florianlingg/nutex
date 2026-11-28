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

  // ===========================================================================
  // Employee update deck: shared with ALL employees.
  // Fairness rules: percentages, ratios and trends only — no € amounts, no
  // headcounts, no individual names; departments compared to their OWN target.
  // ===========================================================================
  function generatePptxBytes() {
    const P = {
      bg: 'FFFFFF', surface: 'FFFFFF', soft: 'F5F8FF', track: 'E5EAF2', border: 'E2E8F0',
      text: '0F172A', text2: '475569', muted: '64748B',
      blue: '2563EB', navy: '1E3A8A', light: 'DBEAFE', sky: '0EA5E9', indigo: '6366F1',
      green: '10B981', yellow: 'F59E0B', red: 'EF4444', purple: '6366F1'
    };
    const TOTAL = 6;
    const saved = { dept: S.state.filters.dept };
    S.state.filters.dept = 'all';
    if (window.NUTEX_ROADMAP) window.NUTEX_ROADMAP.sync();
    const metrics = S.computeMetrics();
    const culture = S.computeCulture();
    const R = window.NUTEX_ROADMAP;
    const rm = R ? R.summary() : null;
    const IM = window.NUTEX_IMPACT;
    const im = IM ? IM.summary() : null;
    const U = window.NUTEX_USAGE;
    const mi = Math.max(0, D.TREND_2026.keys.indexOf(S.state.filters.timeframe));
    const ladder = U ? U.sum(D.DEPARTMENTS.map(d => d.id), mi) : null;
    const month = metrics.tf.label;
    const [ay, am, ad] = S.asOfDate().split('-').map(Number);
    const asOf = `${ad} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][am - 1]} ${ay}`;
    const pct = (n, d) => Math.round((n / Math.max(1, d)) * 100);
    const lvl = (v, t) => (v >= t ? 'green' : v >= t - 15 ? 'yellow' : 'red');
    const col = (l) => (l === 'green' ? P.green : l === 'yellow' ? P.yellow : P.red);
    const wTarget = S.weeklyTarget(metrics.rows);

    function frame(s, title, sub, n) {
      s.rect({ x: 0, y: 0, w: 13.333, h: 0.12, fill: P.blue, radius: 0 });
      s.text({ x: 0.65, y: 0.42, w: 10.5, h: 0.5, content: title, size: 26, bold: true });
      s.text({ x: 0.65, y: 0.95, w: 10.5, h: 0.3, content: sub, size: 13, color: P.muted });
      s.text({ x: 11.2, y: 0.5, w: 1.5, h: 0.3, content: `${n} / ${TOTAL}`, size: 11, color: P.muted, align: 'r' });
      s.text({ x: 0.65, y: 7.05, w: 12, h: 0.25, content: `NuTex AI update · ${month} · data as of ${asOf} · all figures in % of the relevant group`, size: 9, color: P.muted });
    }
    function card(s, x, y, w, h) { s.rect({ x, y, w, h, fill: P.soft, border: P.border, radius: 0.06 }); }
    function kpi(s, x, y, w, label, value, sub, color = P.text) {
      card(s, x, y, w, 1.55);
      s.text({ x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.3, content: label, size: 12, color: P.text2, bold: true });
      s.text({ x: x + 0.25, y: y + 0.5, w: w - 0.5, h: 0.6, content: value, size: 34, bold: true, color });
      s.text({ x: x + 0.25, y: y + 1.12, w: w - 0.5, h: 0.3, content: sub, size: 11, color: P.muted });
    }

    // ---- 1 · Title & three headline numbers
    const s1 = createSlideBuilder(P);
    s1.rect({ x: 0, y: 0, w: 13.333, h: 7.5, fill: P.navy, radius: 0 });
    s1.text({ x: 0.8, y: 1.0, w: 11.5, h: 0.4, content: `${month} · for all NuTex employees`, size: 14, color: 'BFDBFE' });
    s1.text({ x: 0.8, y: 1.45, w: 11.5, h: 1.2, content: 'AI at NuTex — where we stand', size: 40, bold: true, color: 'FFFFFF' });
    s1.text({ x: 0.8, y: 2.55, w: 11.5, h: 0.5, content: 'A transparent monthly update on our AI roadmap, how we use AI and what it changes.', size: 16, color: 'DBEAFE' });
    const heads = [
      ['Use AI every week', `${metrics.weeklyPct}%`, `of all employees · target ${wTarget}%`],
      ['Roadmap on schedule', rm ? `${rm.score}%` : '—', 'of due milestones done'],
      ['People score', `${culture.overallPct}%`, 'positive in the monthly pulse · target 75%']
    ];
    heads.forEach((h, i) => {
      const x = 0.8 + i * 4.0;
      s1.rect({ x, y: 3.6, w: 3.7, h: 1.9, fill: '1E40AF', radius: 0.06 });
      s1.text({ x: x + 0.3, y: 3.8, w: 3.2, h: 0.3, content: h[0], size: 13, color: 'BFDBFE', bold: true });
      s1.text({ x: x + 0.3, y: 4.15, w: 3.2, h: 0.8, content: h[1], size: 44, bold: true, color: 'FFFFFF' });
      s1.text({ x: x + 0.3, y: 4.95, w: 3.2, h: 0.4, content: h[2], size: 11, color: 'BFDBFE' });
    });
    s1.text({ x: 0.8, y: 6.7, w: 11.5, h: 0.3, content: `Data as of ${asOf}. All figures are shares of the relevant group — no individual or salary data.`, size: 10, color: '93C5FD' });

    // ---- 2 · AI readiness (roadmap)
    const s2 = createSlideBuilder(P);
    frame(s2, 'Are the foundations in place?', `AI roadmap · phase ${rm ? rm.phase : '—'}`, 2);
    if (rm) {
      kpi(s2, 0.65, 1.55, 3.6, 'Roadmap on schedule', `${rm.score}%`, 'of milestones due so far are done', P.blue);
      card(s2, 4.5, 1.55, 8.18, 3.0);
      s2.text({ x: 4.8, y: 1.75, w: 7.5, h: 0.3, content: 'Progress per area · planned milestones done', size: 13, bold: true });
      rm.lanes.forEach((l, i) => {
        const y = 2.25 + i * 0.55;
        const p = pct(l.done, l.total);
        s2.text({ x: 4.8, y, w: 1.8, h: 0.3, content: l.label, size: 12, color: P.text2 });
        s2.progressBar({ x: 6.7, y: y + 0.07, w: 4.6, h: 0.18, pct: p, fillColor: P.blue });
        s2.text({ x: 11.45, y, w: 1.0, h: 0.3, content: `${p}%`, size: 12, bold: true, align: 'r' });
      });
      card(s2, 0.65, 3.3, 3.6, 1.25);
      s2.text({ x: 0.9, y: 3.45, w: 3.1, h: 1.0, content: `${rm.overdue.length} milestone${rm.overdue.length === 1 ? '' : 's'} currently late — we are working on ${rm.overdue.length === 1 ? 'it' : 'them'}.`, size: 12, color: P.text2 });
      card(s2, 0.65, 4.8, 12.03, 2.0);
      s2.text({ x: 0.95, y: 4.98, w: 11, h: 0.3, content: 'Coming up next', size: 14, bold: true, color: P.blue });
      rm.openSorted.filter(m => m.visualState !== 'overdue').slice(0, 3).forEach((m, i) => {
        const x = 0.95 + i * 3.9;
        s2.text({ x, y: 5.4, w: 3.6, h: 0.3, content: `${m.lane} · ${R ? m.statusMeta.text : ''}`, size: 10.5, color: P.muted });
        s2.text({ x, y: 5.7, w: 3.6, h: 0.9, content: m.title, size: 13, bold: true });
      });
    }

    // ---- 3 · Adoption
    const s3 = createSlideBuilder(P);
    frame(s3, 'Are we using AI?', 'Each department has its own target: its AI target group (roles where AI is relevant, McKinsey study 2026)', 3);
    card(s3, 0.65, 1.55, 7.4, 5.2);
    s3.text({ x: 0.95, y: 1.75, w: 6.8, h: 0.3, content: 'Weekly AI use by department · marker = own target', size: 13, bold: true });
    metrics.rows.slice().sort((a, b) => b.weeklyPct - a.weeklyPct).forEach((r, i) => {
      const y = 2.3 + i * 0.68;
      const tg = S.weeklyTarget([r.dept]);
      s3.text({ x: 0.95, y, w: 1.7, h: 0.3, content: r.dept.name, size: 12, color: P.text2 });
      s3.progressBar({ x: 2.7, y: y + 0.07, w: 4.0, h: 0.2, pct: r.weeklyPct, targetPct: tg, fillColor: col(lvl(r.weeklyPct, tg)) });
      s3.text({ x: 6.8, y, w: 1.1, h: 0.3, content: `${r.weeklyPct}%`, size: 12, bold: true, align: 'r' });
      s3.text({ x: 2.7, y: y + 0.3, w: 4.0, h: 0.25, content: `target ${tg}%`, size: 9, color: P.muted });
    });
    kpi(s3, 8.3, 1.55, 4.38, 'AI target group trained', `${metrics.trainedTargetPct}%`, 'goal: everyone in the target group', P.blue);
    kpi(s3, 8.3, 3.3, 4.38, 'Use AI on 3+ days a week', ladder ? `${pct(ladder.power, ladder.weekly)}%` : '—', 'of weekly AI users', P.blue);
    kpi(s3, 8.3, 5.05, 4.38, 'Change vs last month', `${metrics.weeklyPct - metrics.weeklyPrevPct >= 0 ? '+' : ''}${metrics.weeklyPct - metrics.weeklyPrevPct} pp`, 'weekly AI use, all employees', P.blue);

    // ---- 4 · People
    const s4 = createSlideBuilder(P);
    frame(s4, 'How do we feel about AI?', `Monthly pulse · ${culture.responsePct}% of employees responded`, 4);
    card(s4, 0.65, 1.55, 6.0, 5.2);
    s4.text({ x: 0.95, y: 1.75, w: 5.5, h: 0.3, content: 'Agreement with the survey statements · target 75%', size: 13, bold: true });
    culture.questions.forEach((q, i) => {
      const y = 2.35 + i * 1.0;
      s4.text({ x: 0.95, y, w: 4.6, h: 0.3, content: q.label, size: 12, color: P.text2 });
      s4.text({ x: 5.4, y, w: 1.0, h: 0.3, content: `${q.pct}%`, size: 12, bold: true, align: 'r' });
      s4.progressBar({ x: 0.95, y: y + 0.38, w: 5.45, h: 0.2, pct: q.pct, targetPct: 75, fillColor: col(lvl(q.pct, 75)) });
    });
    card(s4, 6.9, 1.55, 5.78, 5.2);
    s4.text({ x: 7.2, y: 1.75, w: 5.2, h: 0.3, content: 'What stops us — and what we do about it', size: 13, bold: true });
    const B = D.CULTURE_SURVEY.barriers;
    const w = D.DEPARTMENTS.reduce((a, d) => a + d.employees, 0);
    B.options.map(o => ({ ...o, p: Math.round(D.DEPARTMENTS.reduce((a, d) => a + B.byDept[d.id][o.id] * d.employees, 0) / w) }))
      .sort((a, b) => b.p - a.p).slice(0, 4).forEach((o, i) => {
        const y = 2.3 + i * 1.08;
        s4.text({ x: 7.2, y, w: 4.2, h: 0.3, content: o.label, size: 12, bold: true });
        s4.text({ x: 11.4, y, w: 1.0, h: 0.3, content: `${o.p}%`, size: 12, bold: true, color: P.blue, align: 'r' });
        s4.text({ x: 7.2, y: y + 0.35, w: 5.2, h: 0.5, content: `→ ${o.lever}`, size: 11, color: P.text2 });
      });

    // ---- 5 · Impact (percentages and ratios only)
    const s5 = createSlideBuilder(P);
    frame(s5, 'What does AI change?', 'Change of business KPIs since each AI go-live · vs. the 3 months before', 5);
    const ratio = metrics.costSavedMo / Math.max(1, metrics.totalSpendMo);
    kpi(s5, 0.65, 1.55, 3.9, 'Return on every €1 spent', `€${ratio.toFixed(2)}`, 'break-even = €1.00', P.blue);
    kpi(s5, 0.65, 3.3, 3.9, 'KPIs improved', im ? `${pct(im.improved, im.live.length)}%` : '—', 'of tracked business KPIs', P.blue);
    kpi(s5, 0.65, 5.05, 3.9, 'Time saved per AI user', `${(metrics.hoursSavedMo / Math.max(1, metrics.weeklyUsers * 4.33)).toFixed(1)} h`, 'per week, after checking & rework', P.blue);
    card(s5, 4.8, 1.55, 7.88, 5.2);
    s5.text({ x: 5.1, y: 1.75, w: 7.2, h: 0.3, content: 'Business KPIs since AI go-live', size: 13, bold: true });
    if (im) {
      im.kpis.forEach((k, i) => {
        const st = IM.stats(k);
        const y = 2.25 + i * 0.55;
        s5.text({ x: 5.1, y, w: 4.6, h: 0.3, content: k.name, size: 12, color: P.text2 });
        s5.text({ x: 9.6, y, w: 1.4, h: 0.3, content: st.live ? st.delta : '—', size: 13, bold: true, color: st.better > 2 ? P.green : P.red, align: 'r' });
        s5.text({ x: 11.1, y, w: 1.4, h: 0.3, content: k.lowerIsBetter ? 'lower = better' : 'higher = better', size: 9.5, color: P.muted, align: 'r' });
      });
    }

    // ---- 6 · What's next & how to take part
    const s6 = createSlideBuilder(P);
    frame(s6, 'What happens next — and how you can take part', 'Based on this month\'s results', 6);
    const lowest = metrics.rows.slice().sort((a, b) => (a.weeklyPct - S.weeklyTarget([a.dept])) - (b.weeklyPct - S.weeklyTarget([b.dept])))[0];
    const next = [
      ['Learning time', 'Protected learning time of 30 minutes per week — the most named barrier is "no time to learn it".'],
      ['Clear rules', 'A one-page AI usage policy & FAQ so everyone knows what is allowed.'],
      ['Support where it is needed', lowest ? `Extra hands-on support in ${lowest.dept.name}, where use is furthest from its target.` : 'Extra hands-on support where use is furthest from target.']
    ];
    next.forEach((n, i) => {
      const x = 0.65 + i * 4.05;
      card(s6, x, 1.6, 3.83, 2.6);
      s6.text({ x: x + 0.25, y: 1.8, w: 3.3, h: 0.3, content: `0${i + 1}`, size: 14, bold: true, color: P.blue });
      s6.text({ x: x + 0.25, y: 2.15, w: 3.3, h: 0.35, content: n[0], size: 16, bold: true });
      s6.text({ x: x + 0.25, y: 2.6, w: 3.35, h: 1.4, content: n[1], size: 12, color: P.text2 });
    });
    s6.rect({ x: 0.65, y: 4.5, w: 12.03, h: 2.2, fill: P.light, radius: 0.06 });
    s6.text({ x: 0.95, y: 4.7, w: 11.4, h: 0.35, content: 'How you can take part', size: 16, bold: true, color: P.navy });
    s6.text({ x: 0.95, y: 5.15, w: 11.4, h: 1.4, content: '• Answer the monthly pulse — it directly shapes our priorities.\n• Ask your team\'s AI champion for help or ideas.\n• Suggest a use case for your area — the best ones become pilots.', size: 13, color: P.text });

    S.state.filters.dept = saved.dept;
    if (window.NUTEX_ROADMAP) window.NUTEX_ROADMAP.sync();

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
      <a:accent5><a:srgbClr val="6366F1"/></a:accent5><a:accent6><a:srgbClr val="64748B"/></a:accent6>
      <a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Clean">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Clean"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
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
    a.download = `NuTex_AI_Update_${metrics.tf.label.replace(/\s+/g, '_')}.pptx`;
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
