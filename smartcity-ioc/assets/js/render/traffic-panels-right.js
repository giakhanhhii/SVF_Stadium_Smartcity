function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function ringSvg(pct, label) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 56 56" class="hud-ring">
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="4"/>
    <circle cx="28" cy="28" r="${r}" fill="none" stroke="#00d4ff" stroke-width="4"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 28 28)"/>
    <text x="28" y="25" text-anchor="middle" fill="#7ab0d0" font-size="5">${label}</text>
    <text x="28" y="34" text-anchor="middle" fill="#00d4ff" font-size="9" font-weight="600">${pct}%</text>
  </svg>`;
}

function areaChartSvg(values) {
  const w = 120;
  const h = 36;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - v * h}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return `<svg viewBox="0 0 ${w} ${h + 4}" class="hud-area-chart">
    <defs><linearGradient id="trafGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#185FA5" stop-opacity="0.05"/>
    </linearGradient></defs>
    <polygon points="${area}" fill="url(#trafGrad)"/>
    <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="1"/>
  </svg>`;
}

function renderAlerts(alerts) {
  return alerts.map((a) =>
    `<div class="hud-alert">
      <span class="hud-alert__tag" style="background:${a.tagBg};color:${a.tagColor}">${a.tag}</span>
      <div class="hud-alert__title">${a.title}</div>
      <div class="hud-alert__time">${a.time} trước</div>
    </div>`,
  ).join('');
}

export function renderTrafficRightSidebar(d) {
  const sigTabs = d.signals.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const sigBars = d.signals.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');

  const congTabs = d.congestion.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const lanes = d.congestion.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('');

  const flowTabs = d.flow.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const stats = d.flow.stats.map((s) =>
    `<div class="hud-energy-cell">
      <div class="hud-energy-lbl">${s.label}</div>
      <div class="hud-energy-val">${s.value}</div>
      <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '▲' : '▼'} ${s.change}</div>
    </div>`,
  ).join('');

  return `
    <section class="hud-block">${hudHead('Cảnh báo gần đây')}${renderAlerts(d.alerts)}</section>
    <section class="hud-block hud-block--signals">${hudHead(d.signals.title)}
      <div class="hud-tabs">${sigTabs}</div>
      <div class="hud-env-row">${ringSvg(75, 'Chu kỳ xanh')}<div class="hud-env-bars">${sigBars}</div></div>
    </section>
    <section class="hud-block hud-block--congestion">${hudHead(d.congestion.title)}
      <div class="hud-tabs hud-tabs--wrap">${congTabs}</div>
      <div class="hud-congestion-info">
        <div class="hud-device-row"><i class="ti ti-camera"></i><span>Camera <strong>${d.congestion.quantity}</strong></span></div>
        <div class="hud-device-status">Mức ùn tắc: <span class="hud-badge">${d.congestion.status}</span></div>
      </div>
      <div class="hud-vent-row">${lanes}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.flow.title)}
      <div class="hud-energy-grid">${stats}</div>
      <div class="hud-tabs hud-tabs--wrap">${flowTabs}</div>
      <div class="hud-chart-lbl">Xe/giờ · 24h</div>
      ${areaChartSvg(d.flow.chart)}
    </section>`;
}
