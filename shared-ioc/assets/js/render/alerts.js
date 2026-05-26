export function renderAlertCard(alert) {
  const dangerClass = alert.danger ? ' danger' : '';
  return `
    <div class="alert-card${dangerClass}" style="border-left:3px solid ${alert.accent}">
      <div class="alert-top">
        <span class="alert-tag" style="background:${alert.tagBg};color:${alert.tagColor}">${alert.tag}</span>
        <span class="alert-time">${alert.time}</span>
      </div>
      <div class="alert-title">${alert.title}</div>
      <div class="alert-desc">${alert.desc}</div>
    </div>`;
}

export function renderAlertList(alerts) {
  return alerts.map(renderAlertCard).join('');
}

export function renderSeverityRow(items) {
  return `<div class="severity-row">${items.map((s) =>
    `<div class="severity-pill" style="background:${s.bg};color:${s.color}">${s.label}<strong>${s.count}</strong></div>`
  ).join('')}</div>`;
}
