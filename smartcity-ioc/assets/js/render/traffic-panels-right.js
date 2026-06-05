const BLUE = '#00d4ff';

function hudHead(title) {
  return `<div class="hud-head"><span>${title}</span><i class="ti ti-dots"></i></div>`;
}

function ringSvg(pct, label) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return `<svg viewBox="0 0 86 86" class="traffic-viz-ring" aria-hidden="true">
    <circle cx="43" cy="43" r="${r}" fill="none" stroke="rgba(0,212,255,0.14)" stroke-width="8"/>
    <circle cx="43" cy="43" r="${r}" fill="none" stroke="${BLUE}" stroke-width="8"
      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 43 43)"/>
    <text x="43" y="39" text-anchor="middle" fill="#7ab0d0" font-size="8" font-weight="800">${label}</text>
    <text x="43" y="53" text-anchor="middle" fill="${BLUE}" font-size="14" font-weight="800">${pct}%</text>
  </svg>`;
}

function radarChart(values, labels) {
  const cx = 74;
  const cy = 66;
  const maxR = 46;
  const labelR = 58;
  const sides = labels.length;
  const point = (i, r) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
  };
  const ring = (r) => labels.map((_, i) => point(i, r)).join(' ');
  const data = values.map((v, i) => point(i, maxR * v)).join(' ');
  const axes = labels.map((label, i) => {
    const angle = (-90 + i * (360 / sides)) * Math.PI / 180;
    const tx = cx + Math.cos(angle) * labelR;
    const ty = cy + Math.sin(angle) * labelR;
    const [x2, y2] = point(i, maxR).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle">${label}</text>`;
  }).join('');
  return `<svg class="traffic-viz-radar" viewBox="0 0 148 132" aria-hidden="true">
    <defs><linearGradient id="trafficRadarFill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7edfff" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#386dff" stop-opacity="0.58"/>
    </linearGradient></defs>
    <g class="traffic-viz-radar__grid">
      <polygon points="${ring(16)}"/><polygon points="${ring(31)}"/><polygon points="${ring(maxR)}"/>
      ${axes}
    </g>
    <polygon class="traffic-viz-radar__shadow" points="${data}"/>
    <polygon class="traffic-viz-radar__shape" points="${data}"/>
    ${values.map((v, i) => {
    const [x, y] = point(i, maxR * v).split(',');
    return `<circle cx="${x}" cy="${y}" r="2.3"/>`;
  }).join('')}
  </svg>`;
}

function signalCycle(d) {
  const bars = d.metrics.map((m) => `<span class="traffic-cycle-bar">
    <em>${m.label}</em><i style="width:${m.pct}%"></i><b>${m.value}</b>
  </span>`).join('');
  return `<div class="traffic-cycle">
    ${ringSvg(75, 'Xanh')}
    <div class="traffic-cycle__bars">${bars}</div>
  </div>`;
}

function flowHeatBars(d) {
  return `<div class="traffic-heat-bars">
    ${d.stats.map((s) => `<span class="traffic-heat-bars__cell traffic-heat-bars__cell--${s.trend}">
      <b>${s.value}</b><em>${s.label}</em><i style="height:${s.pct || 64}%"></i>
    </span>`).join('')}
  </div>`;
}

export function renderTrafficRightSidebar(d) {
  const sigTabs = d.signals.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const flowTabs = d.flow.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');

  return `
    <section class="hud-block traffic-viz-block traffic-viz-block--radar">${hudHead(d.kpiRadar.title)}
      ${radarChart(d.kpiRadar.values, d.kpiRadar.labels)}
    </section>
    <section class="hud-block traffic-viz-block hud-block--signals">${hudHead(d.signals.title)}
      <div class="hud-tabs">${sigTabs}</div>
      ${signalCycle(d.signals)}
    </section>
    <section class="hud-block traffic-viz-block hud-block--grow">${hudHead(d.flow.title)}
      <div class="hud-tabs hud-tabs--wrap">${flowTabs}</div>
      ${flowHeatBars(d.flow)}
    </section>`;
}
