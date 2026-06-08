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
    <text x="43" y="38" text-anchor="middle" fill="#9bdff2" font-size="9" font-weight="800">${label}</text>
    <text x="43" y="55" text-anchor="middle" fill="${BLUE}" font-size="16" font-weight="900">${pct}%</text>
  </svg>`;
}

function trafficKpiBars(kpi) {
  const items = kpi.labels.map((label, index) => ({
    label,
    pct: Math.round((kpi.values[index] || 0) * 100),
  }));
  const modes = [
    { id: 'overview', label: 'Tổng quan', note: 'Đang xem KPI tổng hợp 5 nhóm.' },
    { id: 'signal', label: 'Tối ưu đèn', note: 'Ưu tiên đèn và tốc độ luồng xe.' },
    { id: 'camera', label: 'Camera', note: 'Tập trung camera, làn và SLA giám sát.' },
  ];

  return `<div class="traffic-kpi-bars" data-traffic-kpi>
    <div class="traffic-kpi-bars__chart" data-traffic-kpi-chart>
      ${items.map((item) => `<button type="button" class="traffic-kpi-bar" data-kpi-bar="${item.label}" aria-label="${item.label} ${item.pct}%">
        <span>${item.label}</span>
        <i><em style="height:${item.pct}%"></em></i>
        <b>${item.pct}%</b>
      </button>`).join('')}
    </div>
    <div class="traffic-kpi-bars__actions" role="group" aria-label="Bộ lọc KPI giao thông">
      ${modes.map((mode, index) => `<button type="button" class="traffic-kpi-action${index === 0 ? ' traffic-kpi-action--active' : ''}" data-kpi-mode="${mode.id}" data-kpi-note="${mode.note}">
        ${mode.label}
      </button>`).join('')}
    </div>
    <div class="traffic-kpi-bars__summary" data-traffic-kpi-summary>
      <b>94%</b><span>Điểm KPI trung bình · nhấn từng cột hoặc bộ lọc để xem ưu tiên.</span>
    </div>
  </div>`;
}

function signalCycle(d) {
  const initialMode = d.tabs?.[0] || 'A4';
  const state = d.datasets?.[initialMode] || { label: 'Xanh', pct: 75, metrics: d.metrics };
  const bars = state.metrics.map((m) => `<span class="traffic-cycle-bar" data-signal-metric>
    <em>${m.label}</em><i style="width:${m.pct}%"></i><b>${m.value}</b>
  </span>`).join('');
  return `<div class="traffic-cycle" data-traffic-signal data-signal-mode="${initialMode}">
    <div class="traffic-cycle__ring" data-signal-ring>${ringSvg(state.pct, state.label)}</div>
    <div class="traffic-cycle__bars">${bars}</div>
  </div>`;
}

function buildFlowArea(stats) {
  const items = stats.slice(0, 4);
  const points = items.map((s, index) => {
    const x = 20 + index * 48;
    const y = 94 - (s.pct || 64) * 0.62;
    return { ...s, x, y };
  });
  const line = points.map((p) => `${p.x},${p.y.toFixed(1)}`).join(' ');
  const area = `20,104 ${line} ${points[points.length - 1]?.x || 164},104`;
  const nodes = points.map((p, index) => `<g class="traffic-flow-area__node" data-flow-point="${index}">
    <text class="traffic-flow-area__value" x="${p.x}" y="${(p.y - 8).toFixed(1)}" text-anchor="middle">${p.value}</text>
    <circle cx="${p.x}" cy="${p.y.toFixed(1)}" r="3.2"/>
    <text class="traffic-flow-area__label" x="${p.x}" y="118" text-anchor="middle">${p.label}</text>
  </g>`).join('');

  return { line, area, nodes };
}

function flowAreaChart(d) {
  const initialMode = d.tabs?.[0] || 'Lưu lượng';
  const chart = buildFlowArea(d.datasets?.[initialMode] || d.stats);
  return `<div class="traffic-flow-area" data-traffic-flow-chart data-flow-mode="${initialMode}">
    <svg viewBox="0 0 184 124" aria-hidden="true">
      <defs>
        <linearGradient id="trafficFlowAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.58"/>
          <stop offset="100%" stop-color="#185fa5" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <g class="traffic-flow-area__grid">
        <line x1="20" y1="42" x2="164" y2="42"/>
        <line x1="20" y1="72" x2="164" y2="72"/>
        <line x1="20" y1="104" x2="164" y2="104"/>
      </g>
      <polygon class="traffic-flow-area__fill" points="${chart.area}"/>
      <polyline class="traffic-flow-area__line" points="${chart.line}"/>
      <g data-flow-points>${chart.nodes}</g>
    </svg>
  </div>`;
}

export function renderTrafficRightSidebar(d) {
  const sigTabs = d.signals.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}" data-signal-tab="${t}">${t}</button>`,
  ).join('');
  const flowTabs = d.flow.tabs.map((t, i) =>
    `<button class="hud-tab hud-tab--sm${i === 0 ? ' hud-tab--active' : ''}" data-flow-tab="${t}">${t}</button>`,
  ).join('');
  const flowDataset = encodeURIComponent(JSON.stringify(d.flow.datasets || {}));
  const signalDataset = encodeURIComponent(JSON.stringify(d.signals.datasets || {}));

  return `
    <section class="hud-block traffic-viz-block traffic-viz-block--radar">${hudHead(d.kpiRadar.title)}
      ${trafficKpiBars(d.kpiRadar)}
    </section>
    <section class="hud-block traffic-viz-block hud-block--signals">${hudHead(d.signals.title)}
      <div class="hud-tabs" data-traffic-signal-tabs data-signal-datasets="${signalDataset}">${sigTabs}</div>
      ${signalCycle(d.signals)}
    </section>
    <section class="hud-block traffic-viz-block traffic-viz-block--flow">${hudHead(d.flow.title)}
      <div class="hud-tabs hud-tabs--wrap" data-traffic-flow-tabs data-flow-datasets="${flowDataset}">${flowTabs}</div>
      ${flowAreaChart(d.flow)}
    </section>`;
}

export function bindTrafficKpiControls() {
  if (document.documentElement.dataset.trafficKpiBound === 'true') return;
  document.documentElement.dataset.trafficKpiBound = 'true';

  document.addEventListener('click', (event) => {
    const root = event.target.closest('[data-traffic-kpi]');
    if (!root) return;

    const modeBtn = event.target.closest('[data-kpi-mode]');
    const barBtn = event.target.closest('[data-kpi-bar]');
    const summary = root.querySelector('[data-traffic-kpi-summary]');
    if (!summary) return;

    if (modeBtn) {
      root.querySelectorAll('[data-kpi-mode]').forEach((btn) => btn.classList.toggle('traffic-kpi-action--active', btn === modeBtn));
      const mode = modeBtn.dataset.kpiMode;
      root.querySelectorAll('[data-kpi-bar]').forEach((bar) => {
        const label = bar.dataset.kpiBar;
        const active = mode === 'overview'
          || (mode === 'signal' && ['Tốc', 'Đèn', 'SLA'].includes(label))
          || (mode === 'camera' && ['Camera', 'Làn', 'SLA'].includes(label));
        bar.classList.toggle('traffic-kpi-bar--muted', !active);
      });
      summary.innerHTML = `<b>${modeBtn.textContent.trim()}</b><span>${modeBtn.dataset.kpiNote}</span>`;
    }

    if (barBtn) {
      const value = barBtn.querySelector('b')?.textContent || '';
      summary.innerHTML = `<b>${value}</b><span>${barBtn.dataset.kpiBar}: nhấn bộ lọc để khoanh vùng nhóm liên quan.</span>`;
    }
  });
}

export function bindTrafficFlowControls() {
  if (document.documentElement.dataset.trafficFlowBound === 'true') return;
  document.documentElement.dataset.trafficFlowBound = 'true';

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-flow-tab]');
    if (!tab) return;
    const tabs = tab.closest('[data-traffic-flow-tabs]');
    const block = tab.closest('.hud-block');
    const chart = block?.querySelector('[data-traffic-flow-chart]');
    if (!tabs || !chart) return;

    const datasets = JSON.parse(decodeURIComponent(tabs.dataset.flowDatasets || '%7B%7D'));
    const stats = datasets[tab.dataset.flowTab] || [];
    if (!stats.length) return;

    tabs.querySelectorAll('[data-flow-tab]').forEach((btn) => btn.classList.toggle('hud-tab--active', btn === tab));
    chart.dataset.flowMode = tab.dataset.flowTab;
    const nextChart = buildFlowArea(stats);
    chart.querySelector('.traffic-flow-area__fill').setAttribute('points', nextChart.area);
    chart.querySelector('.traffic-flow-area__line').setAttribute('points', nextChart.line);
    chart.querySelector('[data-flow-points]').innerHTML = nextChart.nodes;
  });
}

export function bindTrafficSignalControls() {
  if (document.documentElement.dataset.trafficSignalBound === 'true') return;
  document.documentElement.dataset.trafficSignalBound = 'true';

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-signal-tab]');
    if (!tab) return;
    const tabs = tab.closest('[data-traffic-signal-tabs]');
    const block = tab.closest('.hud-block');
    const signal = block?.querySelector('[data-traffic-signal]');
    if (!tabs || !signal) return;

    const datasets = JSON.parse(decodeURIComponent(tabs.dataset.signalDatasets || '%7B%7D'));
    const state = datasets[tab.dataset.signalTab];
    if (!state) return;

    tabs.querySelectorAll('[data-signal-tab]').forEach((btn) => btn.classList.toggle('hud-tab--active', btn === tab));
    signal.dataset.signalMode = tab.dataset.signalTab;
    signal.querySelector('[data-signal-ring]').innerHTML = ringSvg(state.pct, state.label);
    signal.querySelector('.traffic-cycle__bars').innerHTML = state.metrics.map((m) => `<span class="traffic-cycle-bar" data-signal-metric>
      <em>${m.label}</em><i style="width:${m.pct}%"></i><b>${m.value}</b>
    </span>`).join('');
  });
}
