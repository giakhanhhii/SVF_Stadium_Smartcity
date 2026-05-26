export function renderDomainBanner({ title, chips = [] }, inner = false) {
  const chipsHtml = chips.map((c) =>
    `<span class="layer-chip${c.active ? ' active' : ''}">${c.label}</span>`
  ).join('');
  const body = `
      <div class="domain-banner-title">
        <span class="domain-banner-tag">Domain</span>
        ${title}
      </div>
      ${chips.length ? `<div class="layer-chips">${chipsHtml}</div>` : ''}`;
  return inner ? body : `<div class="domain-banner">${body}</div>`;
}

export function renderDomainKpiRow(kpis) {
  const items = kpis.map((k) => `
    <div class="domain-kpi" style="--accent:${k.accent}">
      <div class="domain-kpi-label"><i class="ti ${k.icon}"></i> ${k.label}</div>
      <div class="domain-kpi-value">${k.value}${k.suffix || ''}</div>
      <div class="domain-kpi-sub"${k.subClass ? ` style="${k.subClass}"` : ''}>${k.sub}</div>
    </div>`).join('');
  return `<div class="domain-kpi-row">${items}</div>`;
}
