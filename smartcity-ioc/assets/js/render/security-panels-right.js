function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function ringSvg(pct, label) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 64 64" class="hud-ring">
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="5"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="#00d4ff" stroke-width="5"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 32 32)"/>
    <text x="32" y="29" text-anchor="middle" fill="#7ab0d0" font-size="6">${label}</text>
    <text x="32" y="40" text-anchor="middle" fill="#00d4ff" font-size="12" font-weight="600">${pct}%</text>
  </svg>`;
}

function areaChartSvg(values) {
  const w = 120;
  const h = 40;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - v * h}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return `<svg viewBox="0 0 ${w} ${h + 8}" class="hud-area-chart">
    <defs><linearGradient id="securityEnergyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#8866ff" stop-opacity="0.05"/>
    </linearGradient></defs>
    <polygon points="${area}" fill="url(#securityEnergyGrad)"/>
    <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="1.2"/>
  </svg>`;
}

function metricBars(metrics) {
  return `<div class="hud-metric-bars">${metrics.map((m) =>
    `<div class="hud-bar-item" title="${m.label}: ${m.value}">
      <div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
      <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div>
    </div>`,
  ).join('')}</div>`;
}

function deviceMatrix(quantity, status, vents) {
  const cells = Array.from({ length: 24 }, (_, i) => {
    const tone = i < 20 ? 'ok' : i < 23 ? 'warn' : 'idle';
    return `<span class="hud-matrix-cell hud-matrix-cell--${tone}"></span>`;
  }).join('');
  return `<div class="hud-device-chart">
    <div class="hud-device-total"><i class="ti ti-device-desktop-analytics"></i><strong>${quantity}</strong><span>${status}</span></div>
    <div class="hud-matrix">${cells}</div>
    <div class="hud-vent-row">${vents.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
  </div>`;
}

function statTiles(stats) {
  return `<div class="hud-energy-grid">${stats.map((s) =>
    `<div class="hud-energy-cell">
      <div class="hud-energy-val">${s.value}</div>
      <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '+' : '-'} ${s.change}</div>
    </div>`,
  ).join('')}</div>`;
}

export function renderRightSidebar(d) {
  const envTabs = d.environment.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');

  const devTabs = d.devices.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');

  const energyTabs = d.energy.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');

  return `
    <section class="hud-block">${hudHead(d.environment.title)}
      <div class="hud-tabs">${envTabs}</div>
      <div class="hud-env-row">${ringSvg(d.environment.humidity, d.environment.tabs[0])}${metricBars(d.environment.metrics)}</div>
    </section>
    <section class="hud-block">${hudHead(d.devices.title)}
      <div class="hud-tabs hud-tabs--wrap">${devTabs}</div>
      ${deviceMatrix(d.devices.quantity, d.devices.status, d.devices.vents)}
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.energy.title)}
      ${statTiles(d.energy.stats)}
      <div class="hud-tabs hud-tabs--wrap">${energyTabs}</div>
      ${areaChartSvg(d.energy.chart)}
    </section>`;
}
