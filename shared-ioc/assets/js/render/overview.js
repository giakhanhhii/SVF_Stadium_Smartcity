export function renderVitals(vitals) {
  return vitals.map((v) => `
    <div class="vital-item">
      <div class="vital-label">${v.label}</div>
      <div class="vital-value" style="color:${v.valueColor}">${v.value}</div>
      <div class="vital-status" style="color:${v.statusColor}">${v.status}</div>
    </div>`).join('');
}

export function renderKpiGrid(kpis) {
  return kpis.map((k) => `
    <div class="kpi-card" style="border-left:3px solid ${k.accent}">
      <div class="kpi-label"><i class="ti ${k.icon}"></i> ${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-delta" style="color:${k.deltaColor}">${k.delta}</div>
    </div>`).join('');
}

export function renderModules(modules) {
  return modules.map((m) => {
    const tag = m.href ? 'a' : 'button';
    const attrs = m.href
      ? ` href="${m.href}" class="module-card" style="text-decoration:none${m.borderStyle ? `;${m.borderStyle}` : ''}"`
      : ` class="module-card" data-nav="${m.nav}"`;
    const linkText = m.linkText || 'Mở bảng điều khiển →';
    return `
    <${tag}${attrs}>
      <div class="module-card-top">
        <div class="module-icon" style="background:${m.iconBg};color:${m.iconColor}"><i class="ti ${m.icon}"></i></div>
        <span class="badge ${m.badgeClass}">${m.badge}</span>
      </div>
      <div class="module-name">${m.name}</div>
      <div class="module-meta">${m.meta}</div>
      <div class="module-link">${linkText}</div>
    </${tag}>`;
  }).join('');
}

export function renderUtilityPanels(panels) {
  return panels.map((p) => `
    <div class="utility-panel">
      <div class="utility-panel-head">
        <div class="utility-panel-title"><i class="ti ${p.icon}"></i> ${p.title}</div>
        <span class="badge ${p.badgeClass}">${p.badge}</span>
      </div>
      <div style="font-size:11px;color:var(--color-text-secondary)">${p.detail}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${p.load}%${p.loadColor ? `;background:${p.loadColor}` : ''}"></div></div>
      ${p.loadNote ? `<div style="font-size:10px;${p.loadNoteClass || 'color:var(--color-text-secondary)'};margin-top:4px">${p.loadNote || `Tải hệ thống: ${p.load}%`}</div>` : (p.load < 100 ? `<div style="font-size:10px;color:var(--color-text-secondary);margin-top:4px">Tải hệ thống: ${p.load}%</div>` : '')}
    </div>`).join('');
}

export function renderMiniStats(stats) {
  return stats.map((s) => `
    <div class="mini-stat">
      <div class="mini-stat-label">${s.label}</div>
      <div class="mini-stat-value"${s.valueClass ? ` style="${s.valueClass}"` : ''}>${s.value}</div>
    </div>`).join('');
}

export function renderReportTable(rows) {
  return rows.map((r) =>
    `<tr><td>${r.domain}</td><td>${r.kpi}</td><td>${r.actual}</td><td>${r.target}</td><td style="color:${r.trendColor}">${r.trend}</td></tr>`
  ).join('');
}

export function renderReportCategories(categories) {
  return categories.map((c) => {
    if (typeof c === 'string') {
      return `<div class="report-cat">${c} <i class="ti ti-chevron-right"></i></div>`;
    }
    return `<div class="report-cat"><span><i class="ti ${c.icon}"></i> ${c.label}</span>${c.suffix || '<i class="ti ti-chevron-right"></i>'}</div>`;
  }).join('');
}
